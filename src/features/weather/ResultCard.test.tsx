import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ResultCard } from './ResultCard';
import type { Reading } from './types';

const reading: Reading = {
  summary: 'Clouds',
  description: 'overcast clouds',
  temperatureC: 18.5,
  humidity: 72,
  place: 'Lisbon, PT',
};

const requestedAt = new Date(2022, 8, 1, 9, 41).toISOString();

describe('ResultCard', () => {
  it('invites a first search when idle', () => {
    render(
      <ResultCard
        state={{ status: 'idle' }}
        requestedAt=""
        onRetry={vi.fn()}
      />,
    );

    expect(
      screen.getByText('Search a city to see current conditions.'),
    ).toBeInTheDocument();
  });

  it('shows a spinner and no announced text while pending', () => {
    render(
      <ResultCard
        state={{ status: 'pending' }}
        requestedAt=""
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.getByRole('region')).toHaveTextContent('');
  });

  it('renders the reading the API echoed back', () => {
    render(
      <ResultCard
        state={{ status: 'success', reading }}
        requestedAt={requestedAt}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText('19°C')).toBeInTheDocument();
    expect(screen.getByText('Lisbon, PT')).toBeInTheDocument();
    expect(screen.getByText('Humidity: 72%')).toBeInTheDocument();
    expect(screen.getByText('Clouds')).toBeInTheDocument();
    expect(screen.getByText('overcast clouds')).toBeInTheDocument();
    expect(screen.getByText('01/09/2022, 09:41')).toBeInTheDocument();
  });

  it('offers a retry on a recoverable error', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <ResultCard
        state={{
          status: 'error',
          message: 'Weather service unavailable. Try again shortly.',
          canRetry: true,
        }}
        requestedAt=""
        onRetry={onRetry}
      />,
    );

    expect(
      screen.getByText('Weather service unavailable. Try again shortly.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('withholds the retry button on an error the user cannot fix', () => {
    render(
      <ResultCard
        state={{
          status: 'error',
          message: 'Something went wrong.',
          canRetry: false,
        }}
        requestedAt=""
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Try again' }),
    ).not.toBeInTheDocument();
  });

  it('announces result transitions politely', () => {
    render(
      <ResultCard
        state={{ status: 'success', reading }}
        requestedAt={requestedAt}
        onRetry={vi.fn()}
      />,
    );

    const region = screen.getByRole('region');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-atomic', 'true');
  });
});
