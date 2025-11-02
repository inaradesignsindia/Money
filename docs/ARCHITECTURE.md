# AI-Powered High-Frequency Scalping System: Architecture v2.0

This document outlines the complete architecture of the zero-cost, AI-powered high-frequency scalping system. The system is composed of three main parts: the MT4 Expert Advisor (Data Source), the GCP Backend (Processing & AI), and the React Web Dashboard (Monitoring & Control).

## System Architecture Diagram

```text
┌──────────────────────────────────┐      ┌───────────────────────────────────────────┐      ┌──────────────────────────────────┐
│    MT4 TERMINAL (Windows PC)     │      │        GCP E2-MICRO VM (us-central1)        │      │      WEB BROWSER (User)          │
│ ┌──────────────────────────────┐ │      │ ┌──────────────────┐  ┌─────────────────┐ │      │ ┌──────────────────────────────┐ │
│ │   EXPERT ADVISOR (MQL4)      │ │      │ │ NGINX            │  │  FLASK REST API │ │      │ │    REACT DASHBOARD (SPA)     │ │
│ │ ├─ OnTick() → Capture Ticks │ │      │ │ ├─ Serve React App│  │ ├─ /api/ticks  │ │      │ │ ├─ Real-time Metrics & Charts │ │
│ │ ├─ Batch (500) & Compress   │ │ HTTPS│ │ ├─ Reverse Proxy  │  │ ├─ /api/signals│ │      │ │ ├─ Live Positions & Trades    │ │
│ │ ├─ POST /api/ticks          ├─┼─────>│ │ │  /api/* → 5000 │  │ ├─ /api/trades │ │ SSE  │ │ ├─ AI Signal Display          │ │
│ │ ├─ Poll /api/signals        │ │<─────┼─┼─┤ /dashboard/stream ◄─┼───────────────┤ │<─────┼─┤ ├─ Gemini Market Analysis     │ │
│ │ ├─ Validate & Execute Trades│ │      │ │ └──────────────────┘  │                 │ │      │ │ ├─ System Settings Page       │ │
│ │ └─ OrderSend() w/ SL/TP     │ │      │ │                       └─┬───────────────┘ │      │ │ └─ (localStorage for keys)  │ │
│ └──────────────────────────────┘ │      │                         │                 │      │ └──────────────────────────────┘ │
└──────────────────────────────────┘      │                         ▼                 │      │               ▲                │
                                          │ ┌───────────────────────────────────────┐ │      │               │ HTTPS          │
                                          │ │      PYTHON BACKGROUND SERVICES       │ │      │               │ (Gemini API)   │
                                          │ │ ┌─────────────────┐ ┌───────────────┐ │ │      │               ▼                │
                                          │ │ │ Feature Engine  ├>│Signal Generator │ │ │      │ ┌──────────────────────────────┐ │
                                          │ │ └─────────────────┘ └───────┬───────┘ │ │      │ │ GOOGLE CLOUD AI PLATFORM     │ │
                                          │ │                             │         │ │      │ │ ├─ Gemini 2.5 Flash         │ │
                                          │ │                             ▼         │ │      │ │ └─ (For Market Analysis)     │ │
                                          │ │ ┌───────────────────────────────────┐ │ │      │ └──────────────────────────────┘ │
                                          │ │ │ AI MODEL (Scikit-Learn .pkl)      │ │ │      └──────────────────────────────────┘
                                          │ │ └───────────────────────────────────┘ │ │
                                          │ └───────────────────────────────────────┘ │
                                          │                         │                 │
                                          │                         ▼                 │
                                          │ ┌──────────────────┐  ┌─────────────────┐ │
                                          │ │ IN-MEMORY CACHE  │  │  SQLITE DB      │ │
                                          │ │ ├─ latest_ticks   │  │ ├─ ticks_raw   │ │
                                          │ │ ├─ feature_vectors│  │ ├─ trades      │ │
                                          │ │ └─ latest_signals │  │ └─ signals     │ │
                                          │ └──────────────────┘  └─────────────────┘ │
                                          └───────────────────────────────────────────┘
```

## Component Breakdown

### 1. MT4 Expert Advisor (EA)
- **Language:** MQL4
- **Role:** Data collection and trade execution.
- **Functionality:**
    - `OnTick()`: Captures every incoming tick (bid, ask, spread, volume) for the attached currency pair.
    - **Batching:** Collects ticks into a buffer (e.g., 500 ticks) to reduce network overhead.
    - **Data Transmission:** Compresses the tick batch and sends it via an authenticated HTTPS POST request to the `/api/ticks` endpoint on the GCP backend.
    - **Signal Polling:** Periodically (e.g., every 500ms) sends a GET request to `/api/signals` to check for new AI-generated trading signals.
    - **Trade Execution:** Validates received signals against risk parameters (max spread, open positions) and executes trades using `OrderSend()` if conditions are met.
    - **Logging:** Reports trade executions and closures back to the GCP backend for performance tracking.

### 2. GCP Backend (e2-micro VM)
- **Role:** Data ingestion, feature engineering, AI inference, signal generation, and serving the web dashboard.
- **Services:**
    - **NGINX Web Server:**
        - Acts as the public-facing entry point.
        - Serves the static files of the built React dashboard application.
        - Functions as a reverse proxy, forwarding all requests to `/api/*` to the Flask application running on port 5000. This provides a secure and scalable setup.
    - **Flask REST API (Python):**
        - `/api/ticks`: Receives and decompresses tick data from the MT4 EA, storing it in the SQLite database and updating the in-memory cache.
        - `/api/signals`: Retrieves the latest valid signal from the in-memory cache and returns it to the MT4 EA.
        - `/api/trades`: Logs executed trades into the `trades` table.
        - `/api/dashboard/stream`: Provides a Server-Sent Events (SSE) stream, pushing real-time performance metrics and trade updates to the React dashboard.
    - **Background Python Services (run via systemd):**
        - **Feature Engine:** Periodically fetches the latest ticks from the database, calculates ~13 technical features (momentum, volatility, MAs, etc.), and stores the resulting feature vector in the in-gmemory cache.
        - **Signal Generator:** Takes the latest feature vector from the cache, runs it through the pre-trained Scikit-Learn model for a BUY/SELL/HOLD prediction, applies confidence and spread filters, calculates SL/TP, and places the final, valid signal into the cache for the Flask API to serve.
    - **Data Stores:**
        - **SQLite Database:** A file-based database for persistent storage of historical tick and trade data.
        - **In-Memory Cache (Python Dict):** A thread-safe dictionary for extremely fast, ephemeral storage of the latest ticks, feature vectors, and signals, enabling sub-second response times.

### 3. React Web Dashboard (Frontend)
- **Framework:** React 18 with TypeScript.
- **Role:** Real-time monitoring, system configuration, and AI-driven insights.
- **Functionality:**
    - **Real-time Monitoring:** Connects to the Flask SSE stream (`/api/dashboard/stream`) to display live updates for P&L, win rate, open positions, and recent trades without needing to refresh the page.
    - **Settings Page:** Provides a user-friendly interface to configure all system parameters (e.g., `LOT_SIZE`, `MAX_DAILY_LOSS`, API keys). Settings are saved to the browser's `localStorage` for persistence.
    - **Gemini Market Analysis:** Contains a dedicated component that makes a direct, client-side API call to the Google Gemini API. It sends recent financial news headlines and receives a concise, AI-generated market sentiment analysis, providing additional decision-making context. The API key for this feature is managed via the Settings page.
    - **Component-Based UI:** Built with reusable components for metrics, tables, and signals, ensuring a clean and maintainable codebase.
    - **Styling:** Uses Tailwind CSS for a modern, responsive, and aesthetically pleasing design.
    - **Error Handling:** A global error handling system provides users with clear feedback in case of API or other errors.

### 4. Testing
- **Frameworks:** Jest and React Testing Library.
- **Strategy:**
    - **Unit Tests:** Individual components, hooks, and utility functions are tested in isolation to ensure they behave as expected.
    - **Integration Tests:** Test the interaction between multiple components to ensure the application works as a whole.