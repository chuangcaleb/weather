# OpenWeather API: surface and query semantics

Research for [#3](https://github.com/chuangcaleb/weather/issues/3). Investigated 2026-09-12 against
OpenWeather's own documentation, plus live requests against `api.openweathermap.org` where a claim
could be checked without a key.

The app needs one thing from this API: for a single city + country submitted through a two-field
form, render a summary, a description, a temperature in °C, a humidity percentage, and the datetime
of submission. No forecast, no history, no maps.

## Sources

All primary. OpenWeather publishes a Markdown mirror of each documentation page (append `.md` to the
page URL), plus a complete export at `/llms-full.txt`; those mirrors are the same content as the HTML
pages and are easier to quote exactly.

| Source | URL |
| --- | --- |
| API catalogue | <https://openweathermap.org/api> |
| Current Weather Data | <https://openweathermap.org/api/current> (`/api/current.md`) |
| Geocoding API | <https://openweathermap.org/api/geocoding-api> (`/api/geocoding-api.md`) |
| One Call API 4.0 | <https://openweathermap.org/api/one-call-4> |
| Pricing (detailed) | <https://openweathermap.org/full-price> (`/full-price.md`) |
| Pricing (overview) | <https://openweathermap.org/price> (`/price.md`) |
| FAQ | <https://openweathermap.org/faq> (`/faq.md`) |
| How to start / API keys | <https://openweathermap.org/appid> (`/appid.md`) |
| Full content export | <https://openweathermap.org/llms-full.txt> |

## 1. Endpoint choice

**Recommendation: Current Weather Data, `GET https://api.openweathermap.org/data/2.5/weather`.**

| | Current Weather Data | One Call API 4.0 |
| --- | --- | --- |
| Endpoint | `api.openweathermap.org/data/2.5/weather` | `api.openweathermap.org/data/3.0/onecall` (3.0) / One Call 4.0 product family |
| Plan | Included in the permanent **Free** plan | Separate **"Pay as you call"** subscription, not part of the Free plan |
| Payment card | Not required | Required — subscribing means filling in a billing form; 1,000 calls/day are free, calls beyond that bill at 0.0012 GBP each |
| Accepts a city name | Yes, via the built-in geocoder (`q=`), deprecated but live | No — coordinates only |
| Returns what this app renders | Yes, in one call | Yes, but bundled with minutely/hourly/daily timelines and alerts the app would discard |

The pricing page lists Current Weather API as available on every plan including Free, and describes
the Free plan as "Permanent free access" at 60 calls/minute and 1,000,000 calls/month. One Call is
listed as its own pay-as-you-call product: "First 1,000 API calls per day are FREE. Each additional
call costs 0.0012 GBP." The FAQ's walkthrough for starting a pay-as-you-call subscription says to
"Fill out a short billing form and complete your subscription," which is the card requirement.

One Call would also force a second decision the app does not need: it takes `lat`/`lon` only, so a
Geocoding call becomes mandatory rather than optional. Current Weather Data answers the whole
question — summary, description, temperature, humidity, observation timestamp — in a single
request, on a free key, with no card.

## 2. City + country query semantics

Two viable shapes. Both are documented and both work on a Free key.

### Option A — direct `q=city,countryCode` (recommended)

```text
https://api.openweathermap.org/data/2.5/weather?q={city},{ISO-3166-1-alpha-2}&units=metric&appid={key}
```

One request. The Geocoding API is **not** a required first hop for this app.

The caveat, stated in the docs on the Current Weather page: "Please note that API requests by city
name, zip-codes and city id have been deprecated. Although they are still available for use, bug
fixing and updates are no longer available for this functionality." Deprecated, not removed — the
endpoint still serves these requests, but it will not gain fixes. For a two-field form with no
typeahead and no disambiguation UI, that trade is acceptable and it halves the request count.

### Option B — Geocoding first, then coordinates

```text
https://api.openweathermap.org/geo/1.0/direct?q={city},{country}&limit=5&appid={key}
https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={key}
```

Geocoding is on the Free plan too, so this costs no money — only a second round trip and a second
failure mode. It becomes the right choice only if the app later needs to show the user a list of
candidate matches, or to display a resolved place name distinct from what the user typed. It is not
needed now.

The `q` grammar is the same in both: `{city name}`, `{city name},{country code}`, or
`{city name},{state code},{country code}`. State codes apply to US locations only.

### Country format constraint

**The country field must be an ISO 3166-1 alpha-2 code (`GB`, `MY`, `JP`), not a country name.**

Both endpoints say so explicitly:

- Current Weather Data, `q` parameter: "City name, state code and country code divided by comma,
  Please refer to [ISO 3166](https://www.iso.org/obp/ui/#search) for the state codes or country
  codes."
- Geocoding API, `q` parameter: "City name, state code (only for the US) and country code divided by
  comma. Please use ISO 3166 country codes."

There is no documented support for `q=London,United Kingdom`. Nothing in the docs promises a country
*name* will resolve, and the deprecated status of the built-in geocoder means undocumented leniency
should not be relied on.

Consequences for the form:

- The country field cannot be a free-text input that accepts "Malaysia". It should be a select, or a
  text input validated against the ISO 3166-1 alpha-2 list, so the value reaching the API is always
  a two-letter code.
- The app owns the code-to-name mapping for display. `sys.country` in the response is also a code
  ("Country code (GB, JP etc.)"), so it cannot supply a readable country name either. `Intl.DisplayNames`
  in the browser converts alpha-2 to a localised country name at zero dependency cost.
- Search history rows showing "City/Country" should store the alpha-2 code as the identity and
  render the display name from it. That also gives the history-bump rule a clean equality check:
  `city.toLowerCase() + '|' + countryCode`.

City name is *not* constrained to English: "You can specify the parameter not only in English. In
this case, the API response should be returned in the same language as the language of requested
location name if the location is in our predefined list of more than 200,000 locations."

## 3. Ambiguity

Different behaviour per option, and this is the strongest practical argument for pinning the country
code.

**Current Weather Data (`q=`)** returns a single weather object, never a list. When a name matches
several places, the service picks one; the response carries no indication that alternatives existed.
The only signals of which place answered are `name`, `sys.country`, `id`, and `coord`. The docs
recommend city ID "to get unambiguous result for your city" and warn that "There is a possibility to
receive a central district of the city/town with its own parameters (geographic coordinates/id/name)
in API response" — that is, `name` in the response may not equal the name submitted.

Supplying the country code narrows the match set substantially but does not guarantee uniqueness
within a country (two same-named towns in one country remain possible). Since the app has no
disambiguation UI, the honest treatment is:

- Render the API's own `name` and `sys.country` rather than echoing the user's input, so the user can
  see which place answered.
- Record that "no disambiguation" is a stated assumption, not an oversight.

**Geocoding API (`/geo/1.0/direct`)** returns a JSON **array**, and `limit` "can cap how many
locations with the same name will be seen in the API response (for instance, London in the UK and
London in the US)", up to 5. An unmatched query returns an empty array — not a 404. Any future
"did you mean?" feature would be built on this endpoint.

## 4. Response shape and the fields backing each rendered value

Example request:

```text
https://api.openweathermap.org/data/2.5/weather?q=London,GB&units=metric&appid={key}
```

Documented response (abridged from the Current Weather Data page; unrelated keys such as `wind`,
`clouds`, `rain`, `visibility`, `base`, `timezone` omitted):

```json
{
  "coord": { "lon": -0.13, "lat": 51.51 },
  "weather": [
    { "id": 300, "main": "Drizzle", "description": "light intensity drizzle", "icon": "09d" }
  ],
  "main": {
    "temp": 280.32,
    "feels_like": 279.1,
    "temp_min": 279.15,
    "temp_max": 281.15,
    "pressure": 1012,
    "humidity": 81
  },
  "dt": 1485789600,
  "sys": { "country": "GB", "sunrise": 1485762037, "sunset": 1485794875 },
  "id": 2643743,
  "name": "London",
  "cod": 200
}
```

### Exact JSON field paths

| Rendered value | JSON path | Type | Documented meaning | Notes |
| --- | --- | --- | --- | --- |
| Summary | `weather[0].main` | string | "Group of weather parameters (Rain, Snow, Clouds etc.)" | Short condition group, e.g. `"Drizzle"`. Always English — `lang` does not translate it. |
| Description | `weather[0].description` | string | "Weather condition within the group" | e.g. `"light intensity drizzle"`. Lowercase as returned; capitalise in CSS, not in data. Translated by `lang`. |
| Temperature (°C) | `main.temp` | number | "Temperature. Unit Default: Kelvin, Metric: Celsius, Imperial: Fahrenheit" | Celsius **only** when `units=metric` is sent. Fractional — round at the render boundary. |
| Humidity (%) | `main.humidity` | number | "Humidity, %" | Integer percentage; unit is fixed, unaffected by `units`. |
| Observation time | `dt` | number | "Time of data calculation, unix, UTC" | Seconds, not milliseconds: `new Date(dt * 1000)`. |
| Resolved city name | `name` | string | "City name" | Flagged as part of the deprecated built-in geocoder, but still returned. |
| Resolved country | `sys.country` | string | "Country code (GB, JP etc.)" | ISO 3166-1 alpha-2, not a name. |
| Local offset | `timezone` | number | "Shift in seconds from UTC" | Only needed if the observation time is shown in the city's local zone. |

`weather` is an array. Every documented example contains exactly one element, and the docs describe
no case that returns more, but the array is the contract — index `[0]` and treat an empty array as a
malformed response rather than assuming presence.

The docs also warn: "If you do not see some of the parameters in your API response it means that
these weather phenomena are just not happened for the time of measurement... Only really measured or
calculated data is displayed in API response." That applies to optional blocks such as `rain` and
`snow`; `weather`, `main.temp`, `main.humidity` and `dt` appear in every documented sample. Still,
parse defensively at the network boundary rather than trusting the shape.

### Units

`units` is optional and defaults to `standard`, which is **Kelvin**. Omitting it is the single most
likely way to ship a wrong-by-273 temperature.

| `units` | Temperature unit |
| --- | --- |
| `standard` (default) | Kelvin |
| `metric` | Celsius |
| `imperial` | Fahrenheit |

Send `units=metric` on every request. The app renders °C only and has no unit toggle, so this belongs
in the request builder as a constant, not as a caller-supplied argument.

### Datetime of submission vs `dt`

The ticket and the parent map call for "the datetime of submission" — when the user pressed search.
That is client-side state, not an API field. `dt` is a different thing: when OpenWeather calculated
the observation, which on the Free plan can lag by up to two hours (the pricing page gives Free a
"Weather Data Update Frequency" of "Every 2 hrs"). Keep the two distinct in the domain model. If only
one is shown, submission time is what the history list needs; `dt` is what honestly labels the
reading's age.

### Other parameters

- `lang` — translates `weather[].description` and `name`, not `weather[].main`. Out of scope (no i18n),
  but noted because the `main`/`description` asymmetry is easy to trip over later.
- `mode` — `xml` or `html`; JSON is the default when omitted. Omit it.
- `callback` — JSONP. Irrelevant; the proxy makes server-side requests.

## 5. Errors

OpenWeather documents a generic error envelope: `cod` ("Code of error"), `message` ("Description of
error"), and an optional `parameters` array ("List of request parameter names that are related to
this particular error"). The `2.5/weather` endpoint returns the two-field form.

Note the type inconsistency: `cod` is the number `200` on success and, in observed error responses, a
number as well — but OpenWeather's own error examples elsewhere show it quoted as a string (`"400"`).
Do not branch on `cod`; branch on the HTTP status.

| HTTP | Cause | Response body | Verified |
| --- | --- | --- | --- |
| 200 | Success | Full weather object, `"cod": 200` | Docs |
| 400 | Missing or malformed mandatory parameter (e.g. no `q`, no `lat`/`lon`) | `{ "cod": "400", "message": "<description>", "parameters": ["lat"] }` — `parameters` lists the offending names | Docs (error-envelope spec) |
| 401 | Missing key, wrong key, key not yet activated, or key without access to the requested product | `{"cod":401, "message": "Invalid API key. Please see https://openweathermap.org/faq#error401 for more info."}` | **Live**, 2026-09-12 |
| 404 | Unknown city name / ZIP / city ID, or a malformed request path | `{ "cod": "404", "message": "city not found" }` | Docs describe the cause; exact message string not verifiable without a key |
| 429 | Free-plan rate limit exceeded — more than 60 calls/minute, or over the monthly quota | `{ "cod": "429", "message": "Too many requests" }` | Docs describe the cause; exact message string not verifiable without a key |
| 500, 502, 503, 504 | Upstream failure | Unspecified; the FAQ says to contact support | Docs |

Behaviour worth designing around, confirmed live: **authentication is checked before the query is
parsed.** A request with both a bad key and a nonexistent city returns 401, not 404. So a 401 in
production means the key, full stop — never a user-input problem — and error mapping can treat it as
an operator-facing fault rather than something to show the user.

Suggested mapping to rendering boundaries:

| HTTP | Surface to user as | Recoverable by the user? |
| --- | --- | --- |
| 404 | "No city matching *X* in *CC*." | Yes — retype |
| 429 | "Too many searches just now. Try again in a moment." | Yes — wait |
| 400 | Generic failure; also a bug signal, since the app builds the query | No |
| 401 | Generic failure; log loudly — configuration fault | No |
| 5xx | "Weather service is unavailable. Try again shortly." | Yes — retry |
| Network/timeout | Same as 5xx | Yes — retry |

The 401 case argues for the serverless-proxy decision under discussion in #1: with the key held
server-side, a 401 is a deploy-configuration problem visible in server logs, and the browser never
sees a distinction it could leak.

## 6. Free-tier limits, card, and key activation

- **Rate limits (Free plan):** 60 calls/minute and 1,000,000 calls/month, per the detailed pricing
  page. Account-level, not per key: "API call limits are applied at the account level, not per API
  key or per product. Usage from all API keys and subscribed products is combined."
- **Cost:** the Free plan is described as "Permanent free access."
- **Payment card:** not required for the Free plan or for Current Weather Data. Sign-up takes an
  email. A card is only needed to subscribe to a paid plan or to a pay-as-you-call product such as
  One Call — another reason to avoid One Call here.
- **Data freshness:** Free-plan weather data updates every 2 hours (pricing page, "Weather Data
  Update Frequency"). Paid tiers go to 1 hour or 10 minutes. Repeated searches for the same city
  within that window can legitimately return an identical `dt`.
- **Key activation delay:** yes, there is one. FAQ: "Your API key will be activated automatically, up
  to 2 hours after your successful registration." The 401 page repeats it: "Your API key is not
  activated yet. Within the next couple of hours, it will be activated and ready to use." A fresh key
  returning 401 is expected, not broken — worth a line in the README so the next person setting up
  the project does not chase a non-bug.
- **Host:** free calls must go to `api.openweathermap.org` by hostname. The docs: "the only endpoint
  for making free API calls is api.openweathermap.org. Please, don't use the server's IP address."
  Paid plans use `pro.openweathermap.org`. A `cn-` prefixed host exists for callers in China; same
  keys, same shapes, not relevant here.
- **Licence:** data is ODbL on all self-service plans, which carries an attribution requirement. Worth
  a credit line in the app footer.

## Recommended request

```text
GET https://api.openweathermap.org/data/2.5/weather
      ?q={city},{countryCodeAlpha2}
      &units=metric
      &appid={OPENWEATHER_API_KEY}
```

One call. Free plan. No card. Everything the page renders, in one response.

## Open questions this research does not settle

- Whether the API key sits behind a Vercel serverless proxy — tracked separately in #1. This research
  only reinforces that it should: the key is a plain query parameter with no CORS-safe alternative,
  so any browser-side call exposes it.
- Which ISO 3166-1 alpha-2 source the country field uses (hardcoded list vs a small package vs
  `Intl.supportedValuesOf`) — an implementation choice for the form ticket.
- Whether the app caches responses. Free-plan data refreshes every 2 hours, so a short client-side
  cache would cost nothing in freshness; not needed to satisfy the rate limit at this app's volume.

## A note on OpenWeather's "agent lane"

While reading the documentation mirrors, `/llms.txt` was found to advertise a separate commercial
channel — an "agent lane" at `agents.openweathermap.org`, operated by a company called The Bot Forum,
with programmatic signup, prepaid credits, and per-call billing. It is addressed at automated
clients and invites them to register an account by POST.

It was not used and is not recommended. It is a different vendor relationship with a different
billing model, and it is unnecessary: the standard Free plan covers this app completely. Flagged only
so that a later reader who encounters the same page knows it was seen and consciously declined.
