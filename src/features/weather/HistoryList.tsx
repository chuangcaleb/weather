import { normalizeQuery } from './normalizeQuery';
import { HistoryRow } from './HistoryRow';
import type { HistoryEntry, Query } from './types';

type Props = {
  /** Already sorted by `requestedAt` descending and capped by the reducer. */
  entries: HistoryEntry[];
  onResearch: (query: Query) => void;
  onDelete: (query: Query) => void;
};

/**
 * A sibling region to the result card, never nested inside it — the two have
 * independent lifecycles.
 */
export function HistoryList({ entries, onResearch, onDelete }: Props) {
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
              onResearch={onResearch}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
