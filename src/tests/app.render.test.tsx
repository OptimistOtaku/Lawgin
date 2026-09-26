import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

const MODULES = [
  'Document Studio',
  'Plain English',
  'Risk Radar',
  'Contract Diff',
  'Grounded',
  'What-If Simulator',
  'Actions',
  'Attorney Dossier'
];

describe('App — smoke render', () => {
  beforeEach(() => {
    localStorage.clear();
    // Force the offline heuristic path so tests never touch the network.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the brand and exposes every feature module', () => {
    render(<App />);

    expect(screen.getByText(/LAW GIN/i)).toBeInTheDocument();

    for (const label of MODULES) {
      expect(screen.getAllByRole('button', { name: new RegExp(label, 'i') }).length).toBeGreaterThan(0);
    }
  });

  it('provides a keyboard skip link and an ARIA live region', () => {
    render(<App />);

    expect(screen.getByRole('link', { name: /skip to main content/i })).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(document.querySelector('[role="status"]')).toBeTruthy();
  });
});
