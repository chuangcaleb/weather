import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { HistoryList } from './HistoryList';
import { HISTORY_CAP } from './historyReducer';
import type { HistoryEntry } from './types';

function entry(city: string, country: string, requestedAt: Date): HistoryEntry {
  return {
    query: { city, country },
    reading: {
      summary: 'Clouds',
      temperatureC: 18.5,
      highC: 21.2,
      lowC: 15.9,
      humidity: 72,
      place: `${city}, ${country}`,
    },
    requestedAt: requestedAt.toISOString(),
  };
}

const lisbon = entry('Lisbon', 'PT', new Date(2022, 8, 1, 9, 41));
const osaka = entry('Osaka', 'JP', new Date(2022, 8, 1, 8, 12));

describe('HistoryList', () => {
  it('says so when nothing has been searched yet', () => {
    render(
      <HistoryList entries={[]} onSearchAgain={vi.fn()} onDelete={vi.fn()} />,
    );

    expect(screen.getByText('No searches yet.')).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('notes the cap only once there is something to show', () => {
    render(
      <HistoryList entries={[]} onSearchAgain={vi.fn()} onDelete={vi.fn()} />,
    );

    expect(
      screen.queryByText(`Only latest ${HISTORY_CAP} entries are kept.`),
    ).not.toBeInTheDocument();
  });

  it('notes the cap once entries exist', () => {
    render(
      <HistoryList
        entries={[lisbon]}
        onSearchAgain={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(
      screen.getByText(`Only latest ${HISTORY_CAP} entries are kept.`),
    ).toBeInTheDocument();
  });

  it('renders one row per entry, in the order given', () => {
    render(
      <HistoryList
        entries={[lisbon, osaka]}
        onSearchAgain={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('Lisbon, PT');
    expect(rows[1]).toHaveTextContent('Osaka, JP');
  });

  it('shows when each entry was requested', () => {
    render(
      <HistoryList
        entries={[lisbon]}
        onSearchAgain={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('01/09/2022, 09:41')).toBeInTheDocument();
  });

  it('re-searches the row it was clicked on', async () => {
    const user = userEvent.setup();
    const onSearchAgain = vi.fn();
    render(
      <HistoryList
        entries={[lisbon, osaka]}
        onSearchAgain={onSearchAgain}
        onDelete={vi.fn()}
      />,
    );

    const [, second] = screen.getAllByRole('listitem');
    await user.click(
      within(second!).getByRole('button', { name: 'Search Osaka, JP again' }),
    );

    expect(onSearchAgain).toHaveBeenCalledWith({
      city: 'Osaka',
      country: 'JP',
    });
  });

  it('deletes the row it was clicked on', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <HistoryList
        entries={[lisbon]}
        onSearchAgain={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Delete Lisbon, PT' }));

    expect(onDelete).toHaveBeenCalledWith({ city: 'Lisbon', country: 'PT' });
  });
});
