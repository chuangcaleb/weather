import type { FormEvent } from 'react';
import { IconButton } from '@/components/IconButton';
import { SearchIcon } from '@/components/icons/SearchIcon';
import { COUNTRY_OPTIONS } from '@/lib/countries';
import type { Query } from './types';

/** `FormData` yields `File` too; these fields are always text. */
function readTextField(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === 'string' ? value : '';
}

type Props = {
  onSearch: (query: Query) => void;
};

/**
 * Uncontrolled on purpose: the fields carry their own constraints, the browser's
 * `:user-invalid` reveals the message each field is described by, and the values
 * are read once on submit. Mirroring them into state would only duplicate what
 * the DOM already holds.
 */
export function SearchForm({ onSearch }: Props) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const city = readTextField(data, 'city').trim();
    const country = readTextField(data, 'country');

    // The field constraints already rejected both of these; this is the guard
    // that keeps a malformed Query out of the API if a browser ever disagrees.
    if (!city || !country) return;

    onSearch({ city, country });
  }

  return (
    <form className="search-form switcher" onSubmit={handleSubmit}>
      <div className="search-field">
        <label htmlFor="country">Country</label>
        <select
          id="country"
          name="country"
          defaultValue=""
          required
          aria-describedby="country-error"
        >
          <option value="" disabled>
            Select a country
          </option>
          {COUNTRY_OPTIONS.map((option) => (
            <option key={option.code} value={option.code}>
              {option.name}
            </option>
          ))}
        </select>
        <p id="country-error" className="search-field__error">
          Choose a country.
        </p>
      </div>

      <div className="search-form__city cluster">
        <div className="search-field">
          <label htmlFor="city">City</label>
          <input
            id="city"
            name="city"
            type="text"
            autoComplete="address-level2"
            required
            // `required` alone accepts a field holding only spaces.
            pattern=".*\S.*"
            aria-describedby="city-error"
          />
          <p id="city-error" className="search-field__error">
            Enter a city name.
          </p>
        </div>
        <IconButton label="Search" type="submit" size="large">
          <SearchIcon />
        </IconButton>
      </div>
    </form>
  );
}
