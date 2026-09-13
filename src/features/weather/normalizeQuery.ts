import type { Query } from '@/features/weather/types';

export function normalizeQuery(query: Query): string {
  return `${query.city.trim().toLowerCase()}|${query.country.toUpperCase()}`;
}
