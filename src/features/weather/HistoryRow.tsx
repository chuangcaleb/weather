import { IconButton } from '@/components/IconButton';
import { SearchIcon } from '@/components/icons/SearchIcon';
import { TrashIcon } from '@/components/icons/TrashIcon';
import { formatDateTime } from '@/lib/formatDateTime';
import type { HistoryEntry, Query } from './types';

type Props = {
  entry: HistoryEntry;
  onSearchAgain: (query: Query) => void;
  onDelete: (query: Query) => void;
};

export function HistoryRow({ entry, onSearchAgain, onDelete }: Props) {
  const { query, requestedAt } = entry;
  const label = `${query.city}, ${query.country}`;

  return (
    <li className="history-row switcher">
      <span className="history-row__label">{label}</span>
      {/* Date and actions travel as one unit, so the row wraps to two lines
          (label, then everything else) rather than three. */}
      <span className="history-row__aside cluster">
        <span className="history-row__time">{formatDateTime(requestedAt)}</span>
        <IconButton
          label={`Search ${label} again`}
          variant="ghost"
          onClick={() => onSearchAgain(query)}
        >
          <SearchIcon />
        </IconButton>
        <IconButton
          label={`Delete ${label}`}
          variant="ghost"
          onClick={() => onDelete(query)}
        >
          <TrashIcon />
        </IconButton>
      </span>
    </li>
  );
}
