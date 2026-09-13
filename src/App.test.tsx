import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { App } from '@/App';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => localStorage.clear());

function upstreamBody(name: string, country: string, temp: number) {
  return {
    weather: [{ main: 'Clouds' }],
    main: { temp, temp_max: temp + 3, temp_min: temp - 3, humidity: 72 },
    name,
    sys: { country },
  };
}

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
}

function resultCard() {
  return screen.getByRole('region', { name: 'Current weather' });
}

async function searchFor(city: string, country: string) {
  const user = userEvent.setup();
  await user.clear(screen.getByLabelText('City'));
  await user.type(screen.getByLabelText('City'), city);
  await user.selectOptions(screen.getByLabelText('Country'), country);
  await user.click(screen.getByRole('button', { name: 'Search' }));
}

describe('App', () => {
  it('starts idle, with an empty history', () => {
    renderApp();

    expect(
      screen.getByText('Search a city to see current conditions.'),
    ).toBeInTheDocument();
    expect(screen.getByText('No searches yet.')).toBeInTheDocument();
  });

  it('renders the reading and records a matching history row on a successful search', async () => {
    server.use(
      http.get('/api/weather', () =>
        HttpResponse.json(upstreamBody('Lisbon', 'PT', 18.5)),
      ),
    );

    renderApp();
    await searchFor('Lisbon', 'PT');

    expect(await within(resultCard()).findByText('19°')).toBeInTheDocument();
    expect(within(resultCard()).getByText('Lisbon, PT')).toBeInTheDocument();

    const rows = await screen.findAllByRole('listitem');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent('Lisbon, PT');
  });

  it('bumps a repeated search to the top instead of duplicating it', async () => {
    server.use(
      http.get('/api/weather', ({ request }) => {
        const city = new URL(request.url).searchParams.get('city') ?? '';
        return HttpResponse.json(
          upstreamBody(city, city === 'Lisbon' ? 'PT' : 'JP', 18.5),
        );
      }),
    );

    renderApp();
    await searchFor('Lisbon', 'PT');
    await within(resultCard()).findByText('Lisbon, PT');

    await searchFor('Osaka', 'JP');
    await within(resultCard()).findByText('Osaka, JP');
    expect(await screen.findAllByRole('listitem')).toHaveLength(2);

    await searchFor('Lisbon', 'PT');
    await within(resultCard()).findByText('Lisbon, PT');

    await waitFor(() => {
      const rows = screen.getAllByRole('listitem');
      expect(rows).toHaveLength(2);
      expect(rows[0]).toHaveTextContent('Lisbon, PT');
    });
  });

  it('shows the not-found message without touching history', async () => {
    server.use(
      http.get('/api/weather', () =>
        HttpResponse.json({ error: 'not found' }, { status: 404 }),
      ),
    );

    renderApp();
    await searchFor('Nowhere', 'PT');

    expect(
      await screen.findByText('No city matching Nowhere in PT.'),
    ).toBeInTheDocument();
    expect(screen.getByText('No searches yet.')).toBeInTheDocument();
  });

  it('re-searches a history row from its own button', async () => {
    server.use(
      http.get('/api/weather', () =>
        HttpResponse.json(upstreamBody('Lisbon', 'PT', 18.5)),
      ),
    );

    renderApp();
    await searchFor('Lisbon', 'PT');
    const row = (await screen.findAllByRole('listitem'))[0]!;

    const user = userEvent.setup();
    await user.click(
      within(row).getByRole('button', { name: 'Search Lisbon, PT again' }),
    );

    expect(await within(resultCard()).findByText('19°')).toBeInTheDocument();
  });

  it('deletes a history row without clearing the current reading', async () => {
    server.use(
      http.get('/api/weather', () =>
        HttpResponse.json(upstreamBody('Lisbon', 'PT', 18.5)),
      ),
    );

    renderApp();
    await searchFor('Lisbon', 'PT');
    await screen.findAllByRole('listitem');

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Delete Lisbon, PT' }));

    expect(screen.getByText('No searches yet.')).toBeInTheDocument();
    expect(within(resultCard()).getByText('19°')).toBeInTheDocument();
  });
});
