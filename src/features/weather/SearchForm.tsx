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
  isPending: boolean;
};

/**
 * Uncontrolled on purpose: the fields carry `required`, the browser's own
 * `:user-invalid` surfaces the message, and the values are read once on submit.
 * Mirroring them into state would only duplicate what the DOM already holds.
 */
export function SearchForm({ onSearch, isPending }: Props) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const city = readTextField(data, 'city').trim();
    const country = readTextField(data, 'country');

    // `required` rejects an empty field, but not one holding only spaces.
    if (!city || !country) return;

    onSearch({ city, country });
  }

  return (
    <form
      className="search-form cluster"
      onSubmit={handleSubmit}
      noValidate={false}
    >
      <div className="search-field">
        <label htmlFor="city">City</label>
        <input
          id="city"
          name="city"
          type="text"
          autoComplete="address-level2"
          required
        />
      </div>

      <div className="search-form__country cluster">
        <div className="search-field">
          <label htmlFor="country">Country</label>
          <select id="country" name="country" defaultValue="" required>
            <option value="" disabled>
              Select a country
            </option>
            {COUNTRY_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        <IconButton
          label="Search"
          type="submit"
          size="large"
          disabled={isPending}
        >
          <SearchIcon />
        </IconButton>
      </div>
    </form>
  );
}
