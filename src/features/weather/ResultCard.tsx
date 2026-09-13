import { Spinner } from '@/components/Spinner';
import { formatDateTime } from '@/lib/formatDateTime';
import { formatTemperature } from '@/lib/formatTemperature';
import { ConditionIcon } from './ConditionIcon';
import type { ResultState } from './resultState';
import type { Reading } from './types';

type Props = {
  state: ResultState;
  /** Epoch milliseconds of the search that produced the reading on screen. */
  requestedAt: number;
  onRetry: () => void;
};

function ReadingView({
  reading,
  requestedAt,
}: {
  reading: Reading;
  requestedAt: number;
}) {
  return (
    <>
      <ConditionIcon summary={reading.summary} />
      <div className="flow result-card__headline">
        <h2>Today&rsquo;s Weather</h2>
        <p className="result-card__temperature">
          {formatTemperature(reading.temperatureC)}
        </p>
        <p className="result-card__description">{reading.description}</p>
      </div>
      <div className="cluster result-card__meta">
        <strong>{reading.place}</strong>
        <span>{formatDateTime(requestedAt)}</span>
        <span>Humidity: {reading.humidity}%</span>
        <span>{reading.summary}</span>
      </div>
    </>
  );
}

function ResultBody({ state, requestedAt, onRetry }: Props) {
  switch (state.status) {
    case 'idle':
      return <p>Search a city to see current conditions.</p>;
    case 'pending':
      return <Spinner />;
    case 'success':
      return <ReadingView reading={state.reading} requestedAt={requestedAt} />;
    case 'error':
      return (
        <div className="cluster result-card__error">
          <p>{state.message}</p>
          {state.canRetry && (
            <button type="button" className="text-button" onClick={onRetry}>
              Try again
            </button>
          )}
        </div>
      );
  }
}

/**
 * The whole result slot, including its live region — so every transition between
 * idle, pending, reading, and error swaps inside one announced container.
 */
export function ResultCard(props: Props) {
  return (
    <section
      className="result-card card flow"
      aria-label="Current weather"
      aria-live="polite"
      aria-atomic="true"
      data-status={props.state.status}
    >
      <ResultBody {...props} />
    </section>
  );
}
