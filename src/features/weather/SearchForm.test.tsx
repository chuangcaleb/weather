import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchForm } from './SearchForm';

describe('SearchForm', () => {
  it('submits the typed city and the selected country code', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchForm onSearch={onSearch} />);

    await user.type(screen.getByLabelText('City'), 'Lisbon');
    await user.selectOptions(screen.getByLabelText('Country'), 'PT');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(onSearch).toHaveBeenCalledWith({ city: 'Lisbon', country: 'PT' });
  });

  it('trims surrounding whitespace off the city', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchForm onSearch={onSearch} />);

    await user.type(screen.getByLabelText('City'), '  Lisbon  ');
    await user.selectOptions(screen.getByLabelText('Country'), 'PT');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(onSearch).toHaveBeenCalledWith({ city: 'Lisbon', country: 'PT' });
  });

  it('leaves both fields required so the browser blocks an empty submit', () => {
    render(<SearchForm onSearch={vi.fn()} />);

    expect(screen.getByLabelText('City')).toBeRequired();
    expect(screen.getByLabelText('Country')).toBeRequired();
  });

  it('never submits a blank city', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchForm onSearch={onSearch} />);

    await user.selectOptions(screen.getByLabelText('Country'), 'PT');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('rejects a city of nothing but spaces', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchForm onSearch={onSearch} />);

    await user.type(screen.getByLabelText('City'), '   ');
    await user.selectOptions(screen.getByLabelText('Country'), 'PT');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(onSearch).not.toHaveBeenCalled();
    expect(screen.getByLabelText('City')).toBeInvalid();
  });

  it('describes each field by the message its own constraint reveals', () => {
    render(<SearchForm onSearch={vi.fn()} />);

    expect(screen.getByLabelText('City')).toHaveAccessibleDescription(
      'Enter a city name.',
    );
    expect(screen.getByLabelText('Country')).toHaveAccessibleDescription(
      'Choose a country.',
    );
  });

  it('offers country names, valued by alpha-2 code', () => {
    render(<SearchForm onSearch={vi.fn()} />);

    const portugal = screen.getByRole('option', { name: 'Portugal' });
    expect(portugal).toHaveValue('PT');
  });
});
