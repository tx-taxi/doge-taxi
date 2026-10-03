# Dogecoin native SEO/GEO candidate

Observed locally on 2026-10-03; isolated branch `codex/native-seo-complete-20261003`, based on `da3368804b67bf4d152f0723d0c1698cec4e83d4`. Candidate only: no push, deployment, live crawler result or indexing claim is established here.

## Scope and superseded decision

The earlier homepage-only sitemap at `da3368804b67bf4d152f0723d0c1698cec4e83d4` was published and separately observed, but is insufficient for the user’s corrected scope. Its evidence is retained in the prior owned clone under `/tmp/tx-taxi-seo-native-20261003/doge` and the shared historical live-verification directory. This candidate replaces that sitemap with all 15 finite canonical routes justified below; it also fixes the demonstrated homepage-canonical/empty-body behavior on documentation links.

## Canonical inventory

All listed URLs use `https://doge.tx.taxi`. Actual handler responses in `crawl-validation.json` establish HTTP 200 HTML, one own canonical link with `id="canonical"`, one page H1, unique title/description, visible semantic text, a working Markdown alternate, and the real shared screenshot metadata. This is a handler audit with file/response mocks, not a production crawl.

| Canonical path | Content classification | Existing source |
| --- | --- | --- |
| `/` | Explorer introduction | `src/app/components/about/about.component.html` |
| `/about` | Source document | `src/app/components/about/about.component.html` |
| `/privacy-policy` | Source document | `src/app/components/privacy-policy/privacy-policy.component.html` |
| `/terms-of-service` | Source document | `src/app/components/terms-of-service/terms-of-service.component.html` |
| `/trademark-policy` | Source document | `src/app/components/trademark-policy/trademark-policy.component.html` |
| `/docs/faq` | Source document | `src/app/docs/api-docs/api-docs-data.ts` |
| `/docs/api/rest` | Source document | `src/app/docs/api-docs/api-docs-data.ts` |
| `/docs/api/websocket` | Source document | `src/app/docs/api-docs/api-docs-data.ts` |
| `/blocks/1` | Existing live page context; live values remain in Angular | `src/app/components/blocks-list/blocks-list.component.ts` |
| `/txs` | Existing live page context; live values remain in Angular | `src/app/components/recent-transactions-list/recent-transactions-list.component.ts` |
| `/mining` | Existing live page context; live values remain in Angular | `src/app/components/mining-dashboard/mining-dashboard.component.ts` |
| `/tools/calculator` | Existing live page context; live values remain in Angular | `src/app/components/calculator/calculator.component.ts` |
| `/mempool-block/0` | Existing live page context; live values remain in Angular | `src/app/components/mempool-block/mempool-block.component.ts` |
| `/graphs/mempool` | Existing live page context; live values remain in Angular | `src/app/components/statistics/statistics.component.ts` |
| `/graphs/mining/hashrate-difficulty` | Existing live page context; live values remain in Angular | `src/app/components/hashrate-chart/hashrate-chart.component.ts` |

## Route and data evidence

Route registration is observed in the unchanged `app-routing.module.ts`, `master-page.module.ts`, `graphs/graphs.routing.module.ts`, entity modules and `docs/docs.routing.module.ts`. The retained-chain filters remove unsupported inherited write/enterprise/Lightning routes. Production config enables mainnet and mining but disables Testnet/Testnet4/Signet/Regtest/Liquid, auditing and accelerator services; Docker explicitly builds `--localize=false`, so these candidates serve English only and do not claim localized-prefix pages.

Dogecoin source implements blocks, standard indexed addresses, transactions, current fiat observations, mempool snapshots and bounded observed statistics. Hasrate uses the current observation plus bounded Blockchair daily history for supported intervals; no full mining archives are inferred. Historical-price fallback can provide a current point without an archive timestamp; /graphs/price is excluded. Fee/reward/pool chart series, RBF and stale-tip data are unavailable.

Provider source files: `adapter/dogecoin.cjs`, `adapter/blockchair.cjs`, `adapter/mining.cjs`, `adapter/price.cjs`. These files are byte-identical to the base, as recorded in `preservation.json`.

| Dynamic family | HTTP/canonical/discovery treatment |
| --- | --- |
| `/tx/:txid`, `/block/:height-or-hash`, `/address/:address` | Existing valid entity patterns keep their own canonical; existing read-only metadata request supplies a semantic description. Real entity API failure status propagates to HTML. Arbitrary entity IDs are not invented for XML. Fake fixtures exercise routing only. |
| `/blocks/:positive-page` | Numbered pages keep their own canonical; `/blocks/1` is the finite discovery entry, with no unbounded pagination enumeration. |
| `/mempool-block/:numeric-id` | Existing projections keep their own canonical; only stable `/mempool-block/0` is enumerated. Pending samples are observations. |
| `/mining/pool/:slug` | Existing inherited page remains HTTP 200/noindex because no pool provider capability is supported. |
| `/clock`, `/clock/:mode`, `/clock/:mode/:index`; `/view/blocks`, `/view/block/:id`, `/view/mempool-block/:index` | Registered presentation routes stay HTTP 200/noindex, omitted XML. Angular redirects/interactive components are unchanged. |
| `/widget/wallet`, `/preview/...` entity/wallet/pool/Lightning routes, `/cab/:chain/:kind/:value` | Registered top-level presentation/helper routes stay HTTP 200/noindex with bounded route patterns. Preview network prefixes remain presentation routes, without claiming those networks are enabled. |
| `/wallet/:wallet` | Removed by the native retained-route filter; HTTP 404/noindex, not advertised. |

## Alias and exclusion matrix

All documented aliases below return HTTP 308 to the own canonical HTML/resource URL; aliases are omitted XML. Query strings are excluded from canonical links. Known finite trailing-slash paths redirect to their slashless canonical, with `/` retained for home.

| Alias | Canonical target |
| --- | --- |
| `/docs` | `/docs/faq` |
| `/docs/api` | `/docs/api/rest` |
| `/api` | `/docs/api/rest` |
| `/api/api/rest` | `/docs/api/rest` |
| `/api/api/websocket` | `/docs/api/websocket` |
| `/api/faq` | `/docs/faq` |
| `/blocks` | `/blocks/1` |
| `/mining/blocks` | `/blocks/1` |
| `/graphs` | `/graphs/mempool` |
| `/llm.txt` | `/llms.txt` |
| `/index.html` | `/` |
| `/tx` | `/` |
| `/tx/preview` | `/docs/faq` |

Known inherited routes below retain HTTP 200 and the existing app, but use `X-Robots-Tag: noindex, follow` and are excluded from XML/LLM route advertising because source support is unavailable:

- `/blocks/stale`
- `/rbf`
- `/graphs/mining/pools-dominance`
- `/graphs/mining/pools`
- `/graphs/mining/block-fees`
- `/graphs/mining/block-fees-subsidy`
- `/graphs/mining/block-rewards`
- `/graphs/mining/block-fee-rates`
- `/graphs/mining/block-sizes-weights`
- `/graphs/price`

Disabled/unknown routes return HTTP 404/noindex: write/broadcast tools (`/tx/push`, `/tx/test`, `/pushtx`), stratum, accelerator, Lightning graphs/explorer, monitoring/nodes/faucet, sponsor/enterprise pages, auditing/block-health, treasuries and disabled networks. APIs are read-only public data/resources and not HTML documents to enumerate; documented endpoint coverage is available in REST/WS pages and full Markdown content. Existing `/api/*` and WebSocket serving logic is unchanged apart from the documented legacy documentation aliases.

## Content, representations and hydration

`adapter/generate-static-seo.cjs` reads current source documents during the existing Docker build. FAQ answers, actual REST endpoints and labeled response examples, WebSocket connection/subscription descriptions, about text and policy text are reused. Angular-only bindings are removed from the fallback. No live values or screenshots are fabricated. The HTML uses one existing `<app-root>` with global `.container-xl` and normal headings/paragraphs/articles/preformatted examples; Angular replaces the same root on bootstrap. There is no parallel UI, user-agent cloaking or separate bot response.

The fallback deliberately omits the scoped `.endpoint-content`/collapsed-doc wrapper classes used by client accordion styles, so FAQ/API content is not hidden on mobile before JavaScript. Existing component SCSS is unchanged except the user-requested search dropdown hint wrapping and code styling. The about source heading is nested as H2 beneath the one page H1. The client SEO service enforces the same route map when existing components call their metadata methods, preserves the stable chain brand base title/description, and updates the identified canonical link after navigation. Documentation-specific SSR titles cannot become the constructor defaults.

`/sitemap.xml`: application/xml; GET/HEAD 200; only canonical finite pages. `/robots.txt`: text/plain; preserves `User-agent: *` and `Allow: /`, and advertises the own sitemap. `/llms.txt` and `/llms-full.txt`: text/plain; the full text has noindex/follow to keep HTML canonical indexing; verified page/resource links and actual source-derived about/policy/FAQ/API content. `/llm.txt`: 308 canonical alias. `/index.md` and each finite page’s `.md`: text/markdown with HTML canonical Link header and noindex/follow duplicate treatment. HTML adds alternate Markdown and describedby `/llms.txt` links. HEAD is bodyless; unsupported methods retain 405. `/3rdpartylicenses.txt` passthrough was exercised with a clearly labeled fixture, rather than treating every non-route asset as HTML/404.

## Social metadata provenance

All static and dynamic entity HTML plus client social metadata use the already approved real full-page product capture: `https://tx.taxi/assets/screenshots/hub-c0f1a521a7ad.jpg` (1440 × 2611, `image/jpeg`). Source/captured URL: `https://tx.taxi/`; captured at `2026-09-27T22:31:45.077Z`. Honest alt: “The tx.taxi hub showing its native blockchain explorer strips and external explorer blocks.” This is a shared hub screenshot, not an image of the chain document or entity. Provenance was read only from the existing router screenshot JSON manifest (key `hub`); no image bytes or screenshot were read/viewed. Existing generated `/og.png` endpoint remains unchanged and is no longer linked from HTML/client metadata.

## Requested search hint

The Automatic Routing dropdown now says `Or go straight to tx.taxi/[your search]`, with the search pattern in a code element. It keeps the existing subdued host font/color, explicitly allows wrapping and uses a scoped inherited-size monospace code rule. Search handlers, component logic and other dropdown rows are unchanged. Template/Sass source compilation is checked; no screenshot was inspected.

## Validation and remaining limits

- Verified locally at `2026-10-03T19:10:02.981Z`: actual adapter callback/functions evaluated with static-file/response mocks; all 15 actual emitted XML URLs crawled, metadata uniqueness/own canonicals/body/HEAD/Markdown/LLM/aliases/noindex exclusions/presentation links checked. XML parsed with Python ElementTree. Static crawl made zero provider requests. The prior documentation behavior was observed directly in the base callback: home canonical and empty app root.
- Verified TypeScript at `2026-10-03T19:07:32.919Z`: real project compiler and `tsconfig.app.json` for changed services/generated metadata; zero changed-file type errors and zero import-graph diagnostics. Installed original dependencies were read only; no original edits, symlinks or installs.
- Node syntax checks passed for server, helper and generator; git diff whitespace checks passed. Existing route definitions, providers, production capability flags and all tracked frontend SCSS apart from the user-requested search hint are unchanged; hashes/equality evidence in `preservation.json`. Docker Node 24 runtime/path/entrypoint remain unchanged; generation is inserted before the existing Angular build.
- Node 24 compatibility source verified on 2026-10-03: official Node v24.0.0 module API documents `stripTypeScriptTypes`, including strip mode used for simple source arrays: https://raw.githubusercontent.com/nodejs/node/v24.0.0/doc/api/module.md . Local generation succeeded on installed Node 26; the parser remains experimental upstream.
- Unresolved before rollout: a complete Docker/Angular production bundle was not built locally in these dependency-isolated clones; remote build/health and live public GET/HEAD validation belong to deployment ownership. Source-derived live graph context is available in server HTML; real graph values still use the unchanged Angular/API flow. No fresh provider archive availability, entity fixture as real data, search indexing, LLM uptake or rank guarantee is asserted.

Source files actually consumed by generation:

- `src/app/components/about/about.component.html`
- `src/app/components/blocks-list/blocks-list.component.ts`
- `src/app/components/calculator/calculator.component.ts`
- `src/app/components/hashrate-chart/hashrate-chart.component.ts`
- `src/app/components/mempool-block/mempool-block.component.ts`
- `src/app/components/mining-dashboard/mining-dashboard.component.ts`
- `src/app/components/privacy-policy/privacy-policy.component.html`
- `src/app/components/recent-transactions-list/recent-transactions-list.component.ts`
- `src/app/components/statistics/statistics.component.ts`
- `src/app/components/terms-of-service/terms-of-service.component.html`
- `src/app/components/trademark-policy/trademark-policy.component.html`
- `src/app/docs/api-docs/api-docs-data.ts`
- `src/app/docs/api-docs/api-docs.component.html`
- `src/app/shared/components/tx-taxi-docs-intro/tx-taxi-docs-intro.component.html`
