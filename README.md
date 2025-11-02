# AI Scalping Trading Dashboard

A modern React-based dashboard for high-frequency forex scalping trading with AI-powered market analysis.

## Features

- 📊 **Real-time Dashboard**: Live trading metrics, positions, and performance tracking
- 🤖 **AI Market Analysis**: Gemini-powered insights for EUR/USD, GBP/USD, and USD/JPY
- ⚙️ **Trading Settings**: Configurable parameters for lot sizes, risk management, and API connections
- 📱 **Responsive Design**: Optimized for desktop and mobile devices
- 🔄 **Live Data Streaming**: Server-sent events for real-time updates

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **AI Integration**: Google Gemini API
- **Build Tool**: Create React App
- **Deployment**: Netlify (static hosting)

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd money

# Install dependencies
npm install

# Start development server
npm start
```

### Build for Production

```bash
npm run build
```

## Deployment

### Netlify (Recommended)

1. **Connect Repository**:
   - Push code to GitHub
   - Go to [Netlify](https://netlify.com) and connect your repository
   - Netlify will auto-detect the `netlify.toml` configuration

2. **Manual Deploy**:
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy --prod --dir=build
   ```

### Docker

```bash
# Build image
docker build -t trading-dashboard .

# Run container
docker run -p 3000:3000 trading-dashboard
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
REACT_APP_BACKEND_API_URL=http://your-backend-server:5000
```

### Settings

Access the Settings page in the app to configure:
- GCP VM IP address
- API keys
- Trading parameters (lot size, max positions, etc.)

## Project Structure

```
money/
├── public/
│   ├── index.html
│   └── _redirects
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── Header.tsx
│   │   ├── Settings.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── useSettings.ts
│   │   └── useTradingData.ts
│   ├── services/
│   │   └── geminiService.ts
│   ├── types.ts
│   ├── App.tsx
│   └── index.tsx
├── Dockerfile
├── netlify.toml
├── package.json
└── README.md
```

## Backend Requirements

This frontend requires a backend API server for full functionality. See the `deploy.sh` script for the complete backend deployment setup including:

- Flask API server
- SQLite database
- Feature engineering service
- Signal generation service
- Nginx reverse proxy

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## License

MIT License - see LICENSE file for details