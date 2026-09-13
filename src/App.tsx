import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { HistoryList } from '@/features/weather/HistoryList';
import { ResultCard } from '@/features/weather/ResultCard';
import { SearchForm } from '@/features/weather/SearchForm';
import { toResultState } from '@/features/weather/resultState';
import { useWeatherSearch } from '@/features/weather/useWeatherSearch';

export function App() {
  const {
    search,
    retry,
    submittedQuery,
    currentReading,
    history,
    deleteEntry,
  } = useWeatherSearch();

  const resultState = toResultState(submittedQuery, {
    isFetching: currentReading.isFetching,
    data: currentReading.data,
    error: currentReading.error,
  });

  return (
    <ErrorBoundary>
      <header className="wrapper repel page-header">
        <h1>Weather</h1>
        <ThemeSwitcher />
      </header>

      <main className="wrapper flow page-main">
        <SearchForm onSearch={search} />
        {/* Result and history are siblings: same page, independent lifecycles. */}
        <ResultCard
          state={resultState}
          requestedAt={new Date(currentReading.dataUpdatedAt).toISOString()}
          onRetry={retry}
        />
        <HistoryList
          entries={history}
          onSearchAgain={search}
          onDelete={deleteEntry}
        />
      </main>
    </ErrorBoundary>
  );
}
