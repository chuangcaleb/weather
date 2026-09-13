import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchForm } from './SearchForm';

describe('SearchForm', () => {
  it('submits the typed city and the selected country code', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchForm onSearch={onSearch} isPending={false} />);

    await user.type(screen.getByLabelText('City'), 'Lisbon');
    await user.selectOptions(screen.getByLabelText('Country'), 'PT');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(onSearch).toHaveBeenCalledWith({ city: 'Lisbon', country: 'PT' });
  });

  it('trims surrounding whitespace off the city', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchForm onSearch={onSearch} isPending={false} />);

    await user.type(screen.getByLabelText('City'), '  Lisbon  ');
    await user.selectOptions(screen.getByLabelText('Country'), 'PT');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(onSearch).toHaveBeenCalledWith({ city: 'Lisbon', country: 'PT' });
  });

  it('leaves both fields required so the browser blocks an empty submit', () => {
    render(<SearchForm onSearch={vi.fn()} isPending={false} />);

    expect(screen.getByLabelText('City')).toBeRequired();
    expect(screen.getByLabelText('Country')).toBeRequired();
  });

  it('never submits a blank city', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchForm onSearch={onSearch} isPending={false} />);

    await user.selectOptions(screen.getByLabelText('Country'), 'PT');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('disables submitting while a search is in flight', () => {
    render(<SearchForm onSearch={vi.fn()} isPending />);

    expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();
  });

  it('offers country names, valued by alpha-2 code', () => {
    render(<SearchForm onSearch={vi.fn()} isPending={false} />);

    const portugal = screen.getByRole('option', { name: 'Portugal' });
    expect(portugal).toHaveValue('PT');
  });
});
