# DOGE local candidate acceptance

Status: **incomplete**, preserved for local review. No deploy, push, production registry, or production ownership change.

## Verified bounded behavior

- Actual provider responses establish tip/current blocks, historical block100000 (2014), historical transaction and first indexed address page. Exact historical transaction inputs−outputs=1DOGE fee;226 physical bytes. Evidence: `initial-live.json`, `historical-block.json`, `historical-transaction.json`, `quantity-check.json`.
- Unsafe JSON integer preservation and BigInt amount display verified recorded185458827448319109koinu as1,854,588,274.48319109DOGE (`exact-balance.json`, `exact-balance-desktop.png`). Address fixture deliberately uses empty history to isolate formatting; it does not verify indexing.
- Kraken independent current USD works with60s observation/expiry cache (`current-usd.json`); no historical conversion is invented.
- Angular watch compiled successfully after final semantic changes; Node adapter syntax checked. Bounded browser fixture pass8cases: root and historical tx × desktop1440/mobile390 × DOGE/default and Original themes. Every screenshot was opened and inspected; no viewport overflow or page errors (`fixture-browser.json`). Captured real data is clearly fixture evidence, not live acceptance.
- Affected final desktop root and exact balance screenshots reopened after amount-width/UTXO fixes. Native component geometry retained, amount columns legible, unknown UTXO count is an em dash. Final root neutralizes unverified capacity fill and replaces unavailable median fee with dash (`final-root-desktop.png`, `final-affected.json`).
- Real provider failure opened on mobile (`actual-throttled-mobile.png`), native Offline/reconnect state visible. Provider health remains stale during cooldown; immutable history cannot reset live freshness.
- Root and historical transaction1200×630 social cards opened and inspected (`root-card.png`, `tx-card.png`). Root screenshot predates the final removal of unsupported “live/mining” marketing words; same native composition preserved.
- Parent integrator verified matched-data native/hub desktop6blocks and mobile2blocks exact text/geometry/colors, local links and lifecycle; both final side-by-side screenshots opened. Evidence under isolated router4340 review directory. Recorded-data UI only.

## Not verified / concrete blockers

- Sustained live updates and recovery: REST429 body `Limits reached.`, remaining−13; WS event subscription `events limit reached`. Persisted cooldown honors next known budget reset/Retry-After and does not repeatedly call exhausted provider. An initial later tip was observed, but that is insufficient continuous-live acceptance.
- Historical block transaction collection, complete address second-page live pass, containing historical-block focus strip still incomplete under the exhausted provider. Historical tx content displays correctly, but focus strip may be skeleton; do not label route fully passed.
- Historical aggregate mining charts are unsupported. Actual current/historical block difficulty/reward/fees exist; bounded block-derived views could be built without assuming a long-range aggregate index.
- AuxPoW block size disagrees between providers (1545B vs782B for same block). UI now says provider-reported size, removes weight and size-based capacity/fee-density claims. Standard-node raw serialization or documented correct mapping is required.
- Historical fiat unsupported. Current quotes are independent and do not fix chain live coverage.

Smallest requirement: reachable DOGE indexed/live capacity sufficient for the above remaining route/update checks, plus documented or raw-node AuxPoW size reconciliation. A paid key alone does not prove historical aggregation support. Full route acceptance is not claimed; inherited unsupported tool/docs routes remain candidate scope.

Final navigation cleanup: removed promotional upstream footer link and known unsupported Mempool Wall, Mining Dashboard and Graphs entry points; retained About and Trademark/Attribution access. Fee heading explicitly says provider estimates with BlockCypher/no-guarantee tooltip. Reopened affected final desktop root screenshot: no overflow or page errors; watch build passes. Native strip and export sources unchanged.
