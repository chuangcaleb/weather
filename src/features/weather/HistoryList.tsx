import { HistoryRow } from './HistoryRow';
import { normalizeQuery } from './normalizeQuery';
import type { HistoryEntry, Query } from './types';

type Props = {
  entries: HistoryEntry[];
  onSearchAgain: (query: Query) => void;
  onDelete: (query: Query) => void;
};

/** Pure render. Sort/limit handled by consumer. */
export function HistoryList({ entries, onSearchAgain, onDelete }: Props) {
  return (
    <section
      className="history-list card flow"
      aria-labelledby="history-heading"
    >
      <h2 id="history-heading">Search History</h2>
      {entries.length === 0 ? (
        <p>No searches yet.</p>
      ) : (
        <ul className="history-list__rows flow">
          {entries.map((entry) => (
            <HistoryRow
              key={normalizeQuery(entry.query)}
              entry={entry}
              onSearchAgain={onSearchAgain}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
