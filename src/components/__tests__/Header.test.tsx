import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from '../Header.tsx';

describe('Header', () => {
    it('renders the header with the correct title', () => {
        render(<Header systemStatus="OPERATIONAL" currentPage="dashboard" setPage={() => {}} />);
        const titleElement = screen.getByText(/AI Scalping System/i);
        expect(titleElement).toBeInTheDocument();
    });

    it('shows the correct system status', () => {
        render(<Header systemStatus="OPERATIONAL" currentPage="dashboard" setPage={() => {}} />);
        const statusElement = screen.getByText(/Operational/i);
        expect(statusElement).toBeInTheDocument();
    });
});
