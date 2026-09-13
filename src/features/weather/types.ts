export type Query = {
  city: string;
  country: string;
};

export type Reading = {
  summary: string;
  description: string;
  temperatureC: number;
  humidity: number;
  place: string;
};

export type HistoryEntry = {
  query: Query;
  reading: Reading;
  requestedAt: string;
};

export type HistoryState = {
  schemaVersion: 1;
  entries: HistoryEntry[];
};
