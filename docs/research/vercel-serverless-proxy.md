# Serverless proxy on Vercel for a Vite + React SPA

Research for [issue #4](https://github.com/chuangcaleb/weather/issues/4). Question: is putting the weather API key behind a Vercel Function free and simple enough to be worth it, and what is the setup?

All claims below are sourced from Vercel's official documentation (and Vite's own docs for the dev-server proxy). Links are inline against each claim.

---

## Recommendation

**Adopt the serverless proxy.** It is free on the Hobby plan by a very wide margin, needs no `vercel.json` for this app's shape, and costs one new source file plus one environment variable. The local development loop is a single command (`vercel dev`) that runs the real Vite dev server underneath, so hot module replacement and the rest of the Vite experience are unchanged.

The one-time setup cost that is not zero, and that should be written down as an assumption, is this: `vercel dev` requires a Vercel account, a linked project, and at least one prior deployment before it will work locally ([Development Command](https://vercel.com/docs/builds/configure-a-build#development-command)). That is a five-minute onboarding step for a contributor, not an ongoing tax, and it is a step this project has to take anyway because Vercel is already the chosen deploy target. On that basis the conditional in the parent map ("only if it is genuinely free and simple") is satisfied.

**What the proxy does and does not buy.** It removes the API key from the client bundle entirely, which is the stated goal. It does not make the endpoint private: `https://<app>/api/weather?city=...` is world-readable and anyone can spend the project's upstream API quota through it. That is a smaller and more manageable exposure than a leaked key — the endpoint can be narrowed, cached, or rate-limited, whereas a leaked key can be used anywhere, forever, until rotated. Mitigations are listed under [Abuse surface](#abuse-surface).

**Fallback, if the proxy is ever abandoned.** Ship the key as `VITE_WEATHER_API_KEY` and accept that it is public. Document in the README that the key is visible in the bundle, scope it to the weather API only, and treat it as rotatable. This is a legitimate choice for a demo app with a free-tier key, but it is strictly worse here because the proxy costs so little.

---

## 1. Cost and limits

### Is it free?

Yes. The Hobby plan is free and includes Vercel Functions ([Hobby plan](https://vercel.com/docs/plans/hobby); [Functions limits](https://vercel.com/docs/functions/limitations#cost-and-usage): "The Hobby plan offers functions for free, within limits").

Included monthly allowances on Hobby ([Hobby plan](https://vercel.com/docs/plans/hobby)):

| Resource | Hobby included |
| --- | --- |
| Function Invocations | First 1,000,000 |
| Active CPU | 4 CPU-hrs |
| Provisioned Memory | 360 GB-hrs |
| Edge Requests | Up to 1,000,000 |
| Deployments per day | 100 |
| Projects | 200 |

For context, this app makes one upstream call per user search. A million invocations per month is not a limit this project will approach.

Note that **Active CPU** is measured as CPU time actually consumed, not wall-clock time — "Waiting for I/O (e.g. calling AI models, database queries) does not count towards active CPU time" ([Functions limits](https://vercel.com/docs/functions/limitations#cost-and-usage)). A proxy function is almost entirely I/O wait on the upstream weather API, so it burns very little of the 4 CPU-hour allowance.

### Runtime limits

From [Vercel Functions Limits](https://vercel.com/docs/functions/limitations):

| Feature | Hobby limit |
| --- | --- |
| Maximum duration | 300s default and maximum |
| Maximum memory | 2 GB / 1 vCPU (default and maximum) |
| Request/response body size | 4.5 MB |
| Bundle size (uncompressed) | 250 MB |
| Concurrency | Auto-scales up to 30,000 |
| Regions | Single region, default `iad1` |

None of these bind on a JSON proxy. The single-region default (`iad1`, Washington D.C.) is worth knowing: every request adds a round trip to that region on top of the upstream API call. Hobby cannot configure multiple regions ([region config](https://vercel.com/docs/functions/configuring-functions/region#limits)), though the default region can be changed.

### What happens at the limit

"In most cases, if you exceed your usage limits on the Hobby plan, you will have to wait until 30 days have passed before you can use the feature again" ([Hobby billing cycle](https://vercel.com/docs/plans/hobby#hobby-billing-cycle)). There is no overage billing on Hobby — the feature pauses rather than charging.

### Is a payment card required?

No. The documented prerequisites to deploy are "A Vercel account" and "Node.js 18+" ([Getting started with Vercel](https://vercel.com/docs/getting-started-with-vercel#prerequisites)). No payment method appears anywhere in the Hobby signup or deploy path; card details are collected only in the **Upgrading to Pro** flow, step 5 of which is "Enter your card details" ([Hobby plan → Upgrading to Pro](https://vercel.com/docs/plans/hobby#upgrading-to-pro)). Because Hobby has no overage billing, there is nothing for a card to settle.

### The one real constraint: non-commercial use

"**Hobby teams** are restricted to non-commercial personal use only. All commercial usage of the platform requires either a Pro or Enterprise plan." Commercial usage includes "Receiving payment to create, update, or host the site" ([Fair Use Guidelines → Commercial usage](https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage)).

A personal portfolio weather app with no ads, no payments, and no affiliate links falls within personal use. This is a constraint on the project, not on the proxy decision specifically — it applies identically to a static-only deployment.

---

## 2. Project shape

### The `api/` directory

For any project that is not Next.js, Vercel deploys every file under a top-level `/api` directory as a function: "You can create a function in other frameworks or with no frameworks by defining your function in a file under `/api` in your project. Vercel will deploy any file in the `/api` directory as a function" ([Functions API Reference](https://vercel.com/docs/functions/functions-api-reference)).

This sits alongside the Vite build, not inside it. Vite builds `src/` into `dist/` and never sees `api/`; Vercel's build pipeline picks up `api/` separately and installs its dependencies with its own install command, which is not customisable ([Custom Install Command for your API](https://vercel.com/docs/builds/configure-a-build#custom-install-command-for-your-api)).

A caveat that does not apply to us, but is worth recording: without a framework, `.js` function files require `"type": "module"` in `package.json` or a `.mjs` extension ([Functions API Reference](https://vercel.com/docs/functions/functions-api-reference)). We are writing `.ts`, so this is moot.

Function file naming: max 128 characters including the extension, no spaces ([Functions name](https://vercel.com/docs/functions/limitations#functions-name)).

> **Note on Vercel's Vite guidance.** The [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite#vercel-functions) page recommends adding Nitro to a Vite project for "a comprehensive backend". That recommendation is aimed at projects wanting SSR and a full API layer. For a single proxy endpoint, the plain `api/` directory convention is the smaller tool and is fully supported independently of the framework preset.

### Minimal working example

**`api/weather.ts`**

```ts
// Vercel deploys this file as a function at /api/weather.
// See https://vercel.com/docs/functions/functions-api-reference

const UPSTREAM = "https://api.openweathermap.org/data/2.5/weather";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const country = searchParams.get("country");

  if (!city) {
    return Response.json({ error: "Missing 'city' query parameter." }, { status: 400 });
  }

  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    // Misconfiguration, not a client error.
    return Response.json({ error: "Weather API key is not configured." }, { status: 500 });
  }

  // Build the upstream URL ourselves. Never forward the caller's query string
  // wholesale — that would let a caller reach arbitrary upstream parameters.
  const upstream = new URL(UPSTREAM);
  upstream.searchParams.set("q", country ? `${city},${country}` : city);
  upstream.searchParams.set("units", "metric");
  upstream.searchParams.set("appid", apiKey);

  const response = await fetch(upstream, { signal: request.signal });

  if (!response.ok) {
    return Response.json(
      { error: "Upstream weather request failed." },
      { status: response.status === 404 ? 404 : 502 },
    );
  }

  const data: unknown = await response.json();

  return Response.json(data, {
    headers: {
      // Let Vercel's CDN serve repeat lookups for the same city without
      // re-invoking the function. https://vercel.com/docs/caching/cdn-cache
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=600",
    },
  });
}
```

Notes on the shape:

- The handler is a **Web handler**: the parameter is a standard [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) and the return value a standard `Response` ([Function signature](https://vercel.com/docs/functions/functions-api-reference#function-signature)). No Vercel-specific types or packages are needed, which also means the handler body is trivially unit-testable — call it with a constructed `Request`.
- `export async function GET` handles only `GET`. A `fetch` default export (`export default { fetch(request) {...} }`) is the alternative that handles all methods in one function ([`fetch` Web Standard](https://vercel.com/docs/functions/functions-api-reference#fetch-web-standard)); we want method discrimination, so named exports are the better fit.
- `request.signal` is a standard `AbortSignal` that fires when the client disconnects, and is passed straight to `fetch` ([Cancel requests](https://vercel.com/docs/functions/functions-api-reference#cancel-requests)). Note that termination on disconnect is **opt-in** via `"supportsCancellation": true` in `vercel.json`; passing the signal is harmless without it and becomes useful if we opt in later.
- Optional per-function config, if we ever want to cap runtime ([`config` object](https://vercel.com/docs/functions/functions-api-reference#config-object)):

  ```ts
  export const config = { runtime: "nodejs", maxDuration: 15 };
  ```

### Does this need a `vercel.json`?

**No — not for this app.** Two independent reasons:

1. **The `api/` directory needs no configuration.** Vercel deploys it by convention.
2. **The SPA fallback rewrite is not needed.** Vercel's Vite guide gives a catch-all rewrite for SPAs because "deep linking won't work out of the box" ([Using Vite to make SPAs](https://vercel.com/docs/frameworks/frontend/vite#using-vite-to-make-spas)):

   ```json
   {
     "$schema": "https://openapi.vercel.sh/vercel.json",
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

   This app has no router and exactly one page (per the decisions in [#1](https://github.com/chuangcaleb/weather/issues/1)), so there are no deep links to fall back for.

**If that rewrite is ever added, it does not break `/api/weather`.** Rewrites are evaluated after the filesystem: "precedence is given to the filesystem prior to rewrites being applied" ([`rewrites`](https://vercel.com/docs/project-configuration/vercel-json#rewrites)). Functions are part of the filesystem for routing purposes, so `/api/weather` resolves to the function and never reaches the catch-all. No `/api` exclusion clause is required.

So the recommended shape is: **no `vercel.json` at all**, with the SPA rewrite above kept on file in case a router is ever introduced.

### Resulting layout

```
weather/
├── api/
│   └── weather.ts          # deployed as /api/weather
├── src/                    # Vite app, built to dist/
├── .env.local              # gitignored; WEATHER_API_KEY=...
├── .env.example            # committed, empty values
└── package.json
```

---

## 3. Local development

### Recommended: `vercel dev` as the single dev command

`vercel dev` "replicate[s] the Vercel deployment environment locally, allowing you to test your Vercel Functions and Middleware without requiring you to deploy each time a change is made" ([`vercel dev`](https://vercel.com/docs/cli/dev)).

It does not replace the Vite dev server — it runs it. Vercel auto-detects the Vite framework preset and configures the Development Command; `vercel dev` starts that command and serves `api/` functions on the same origin ([Development Command](https://vercel.com/docs/builds/configure-a-build#development-command)). Hot module replacement, dependency pre-bundling, and everything else Vite provides are intact, because it is the real Vite server behind the proxy.

The practical effect: the client can call the relative path `/api/weather` in every environment — local, preview, production — with no environment-conditional base URL. That is the single biggest simplification the proxy brings to the client code.

One-time setup:

```bash
pnpm add -D vercel
pnpm vercel login
pnpm vercel link          # link this directory to the Vercel project
pnpm vercel               # first deployment (required before `vercel dev` works)
pnpm vercel dev           # from here on, this is the dev command
```

**The prerequisites are real and should be documented in the README.** Vercel states plainly: "You must create a deployment and have your local project linked to the project on Vercel (using `vercel`). Otherwise, `vercel dev` will not work correctly" ([Development Command](https://vercel.com/docs/builds/configure-a-build#development-command)). Also note that the first deployment of a new project is always a *production* deployment, even without `--prod` ([First deployment](https://vercel.com/docs/deployments/environments#first-deployment)).

Vercel's own advice is to avoid `vercel dev` when the framework's dev command is sufficient — "Use `vercel dev` only if you need to use Vercel platform features like Vercel functions" ([Development Command](https://vercel.com/docs/builds/configure-a-build#development-command)). We do need a Vercel function, so this is exactly the documented case for using it.

Suggested `package.json` scripts:

```json
{
  "scripts": {
    "dev": "vercel dev",
    "dev:ui": "vite",
    "build": "tsc -b && vite build"
  }
}
```

`dev:ui` is an escape hatch for pure-styling work where no live API is needed — it starts Vite directly with no Vercel account involvement. Requests to `/api/weather` will 404 under it, which the app's error boundary already has to handle.

### Alternative, if `vercel dev` proves painful: Vite's `server.proxy`

Vite's dev server can proxy a path prefix to another origin ([Vite `server.proxy`](https://vite.dev/config/server-options.html#server-proxy)):

```ts
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000", // a separate `vercel dev --listen 3000`
        changeOrigin: true,
      },
    },
  },
});
```

This keeps `vite` as the primary dev server and runs `vercel dev --listen 3000` ([`--listen`](https://vercel.com/docs/cli/dev#listen)) beside it for functions only. It costs two processes instead of one and gains nothing for this app, so it is recorded as a fallback rather than a recommendation. The same mechanism can point `target` at a deployed preview URL if someone wants to do UI work against the real deployed function without running any local backend.

---

## 4. Environment variables

### Where the key lives

A **single, unprefixed** variable: `WEATHER_API_KEY`.

The absence of a `VITE_` prefix is load-bearing. Vite only inlines variables into the client bundle when they carry the configured prefix; an unprefixed variable is never available to `import.meta.env` and so cannot leak into `dist/`. The function reads it from `process.env.WEATHER_API_KEY` at runtime instead.

Set it in the Vercel dashboard (Project → Settings → Environment Variables) for all three environments ([Environment variables](https://vercel.com/docs/environment-variables)):

| Environment | Applies to |
| --- | --- |
| Production | Deployments from the production branch, or `vercel --prod` |
| Preview | Deployments from any non-production branch or PR |
| Development | Local runs via `vercel dev` |

Vercel's own note: environment variables "are encrypted at rest and visible to any user that has access to the project. It is safe to use both non-sensitive and sensitive data, such as tokens" ([Environment variables](https://vercel.com/docs/environment-variables)).

Changes only take effect on new deployments: "Any change you make to environment variables are not applied to previous deployments, they only apply to new deployments."

### How the local `.env` mirrors it

Two paths, both documented ([Development environment variables](https://vercel.com/docs/environment-variables#development-environment-variables)):

- **Automatic.** `vercel dev` "automatically downloads the Development Environment Variables into memory" — no local file needed at all.
- **Explicit.** `vercel env pull` writes the Development environment into a local `.env` file (`.env.local` serves the same purpose). Useful for `dev:ui`, for tests, and for reading the values.

```bash
pnpm vercel env pull        # → .env.local
```

A contributor without dashboard access can instead hand-write `.env.local`:

```
WEATHER_API_KEY=
```

Keep `.env*` gitignored and commit `.env.example` with the key name and an empty value, matching the convention already in the coding standard.

For completeness: Vercel's system variables can still be read in the Vite build by prefixing them, e.g. `VITE_VERCEL_ENV` yields `preview`, `production`, or `development` ([Vite on Vercel → Environment Variables](https://vercel.com/docs/frameworks/frontend/vite#environment-variables)). That is a build-time convenience for non-secret values and does not change the rule for the API key.

---

## 5. Proposed coding-standard amendment

`docs/agents/coding-standard/data-fetching.md` currently reads:

> - Config comes from `import.meta.env.VITE_*`. `.env` is gitignored; `.env.example` is committed with empty values.

Under a proxy this is wrong for secrets: anything reachable through `import.meta.env.VITE_*` is inlined into the client bundle and is therefore public. The rule needs to split the two cases rather than be deleted — non-secret build-time config legitimately still uses `VITE_*`.

**Proposed replacement wording:**

> - **Secrets never reach the client.** API keys and any other credential live in an **unprefixed** environment variable (e.g. `WEATHER_API_KEY`), read at runtime by a Vercel Function under `api/` via `process.env`. A `VITE_`-prefixed variable is inlined into the client bundle by Vite and is therefore public — never give a secret that prefix.
> - **Non-secret build-time config** — feature flags, public base paths, and similar — comes from `import.meta.env.VITE_*`.
> - The client calls the proxy at a relative path (`/api/...`), never the third-party API directly, and never holds a base URL that varies by environment.
> - `.env*` is gitignored; `.env.example` is committed with every key name present and all values empty. Local values come from `vercel env pull` or are hand-written.

That also implies a small addition to the "All HTTP calls live under `src/lib/api/`" rule: those modules now target our own `/api/*` proxy, and the upstream API's shape is the function's concern rather than the client's. Worth noting when the rule is edited, though it does not require new wording.

---

## Abuse surface

Recording this because it is the honest counterweight to "the key is now safe".

The proxy endpoint is public. Anyone who finds `https://<app>/api/weather` can call it and spend our upstream quota and our Hobby function allowance. Practical mitigations, in order of effort:

1. **Validate and reconstruct parameters** — already in the example above. The function builds the upstream URL itself and only forwards `city` and `country`, so the endpoint cannot be used as a general-purpose proxy to arbitrary upstream paths or parameters.
2. **Cache at the CDN** — the `Cache-Control: s-maxage=600` header in the example lets Vercel's CDN serve repeat lookups for the same city without re-invoking the function ([CDN cache](https://vercel.com/docs/caching/cdn-cache#using-vercel-functions)). This is the highest-leverage mitigation for a weather app, where the same handful of cities will dominate traffic and data goes stale slowly.
3. **Firewall rules** — Hobby allows up to 3 WAF custom rules and 3 IP blocks ([Hobby plan](https://vercel.com/docs/plans/hobby#comparing-hobby-and-pro-plans)). Enough for a crude rate limit if one is ever needed.

Even unmitigated, this is a better position than a public key: the blast radius is one endpoint on one deployment, and it can be turned off by deleting the deployment.

---

## Sources

All Vercel documentation, retrieved 2026-09-12.

- [Vercel Functions Limits](https://vercel.com/docs/functions/limitations)
- [Vercel Hobby Plan](https://vercel.com/docs/plans/hobby)
- [Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines)
- [Functions API Reference](https://vercel.com/docs/functions/functions-api-reference)
- [Getting started with Vercel Functions](https://vercel.com/docs/functions/quickstart)
- [Static Configuration with `vercel.json`](https://vercel.com/docs/project-configuration/vercel-json)
- [Project Configuration](https://vercel.com/docs/project-configuration)
- [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)
- [Configuring a Build](https://vercel.com/docs/builds/configure-a-build)
- [`vercel dev`](https://vercel.com/docs/cli/dev)
- [Environment variables](https://vercel.com/docs/environment-variables)
- [Environments](https://vercel.com/docs/deployments/environments)
- [Getting started with Vercel](https://vercel.com/docs/getting-started-with-vercel)
- [Vite: Server Options (`server.proxy`)](https://vite.dev/config/server-options.html#server-proxy)
