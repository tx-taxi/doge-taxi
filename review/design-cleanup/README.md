# DOGE design cleanup — local candidate

Implements DOGE scope of audit A01/A02/A06/A08/A09/A11/A13/A15/A17/A18. Shared search, divider identity and initial navigation integration are owned by the root integrator and are separate changes in this worktree.

Reused exact native Dashboard, MempoolBlockOverview / BlockOverviewGraph, IncomingTransactionsGraph, Difficulty, HashrateChart, PoolRanking, Calculator, Fiat and existing docs/legal components. The reference is current LTC `05c674599` / BTC `ab3ea4e26`; do not treat old Litecoin-specific text or inherited chart capacity thresholds as DOGE requirements.

- Dashboard restores native pending treemap / incoming-chart row, retaining recent block/transaction row. Pending data is the actual bounded sample, not a projected block/global mempool. No duplicate transaction table or replacement prose card.
- Native network/reward switcher retains bar/stats geometry and first mobile metric. Network bar describes actual observed header-time gap against the protocol's 60-second target, not block utilization or estimated confirmation. Subsidy is permanent10,000 DOGE; fee value is real latest observed block fees. Native fixed-height unavailable state handles null AND empty block arrays.
- Mining uses actual chart components with scoped unavailable inputs that avoid unsupported provider calls. Historical chart routes remain accessible and show the same native chart unavailable state. No inherited Next Halving, fake series or indefinitely spinning unsupported graph. Pending projection route reuses the observed dashboard without claiming a projection.
- Calculator uses Ð, real quote observation age, correct safe-precision limit wording and genesis date. Historical selection stays explicitly unavailable and avoids an unsupported request. Fiat fallback has a current-price-equivalent tooltip. Denomination select fits DOGE/koinu. Missing fee-range row is omitted instead of `— - —`.
- Actual routed FAQ/API/About/legal corrected; required upstream attribution retained, literal EOF removed. Root and entity social frame/checkers now gold.

## Semantics and retained observations

[Dogecoin Core chain parameters](https://github.com/dogecoin/dogecoin/blob/master/src/chainparams.cpp) define the60-second target and mainnet DigiShield/AuxPoW parameters. [Dogecoin Core reward implementation](https://github.com/dogecoin/dogecoin/blob/master/src/dogecoin.cpp) defines permanent10,000-coin rewards after six100,000-block intervals. These were opened during this pass. Historical randomized rewards are not guessed.

Incoming sample statistics are derived only from successive **provider observation timestamps** of the existing pending feed: newly seen transaction bytes / elapsed seconds. Cached responses are not new observations; gaps over300s break the series rather than create zeros. Snapshots coalesce across clients, retain a bounded two-hour observation file, and use no additional provider requests. This is partial observed activity, not global intake/mining statistics. No historical series was invented.

## Bounded verification and evidence

`report.json`: initial20-page matrix at1440×900 and390×844, native/Original, root/mining/graphs/calculator/docs. No product JS errors, API failures or document overflow in that initial matrix. `final.json`: affected root/rewards/calculator and controlled empty-array fallback after refinements. The four localStorage errors in that harness originate from its unguarded init script on a non-origin document; `capture-final.mjs` records that harness limitation rather than claiming a zero-error pass. `routes.json`: actual routed API/About/three legal pages/historical block/mining/fee graph; no product JS errors or document overflow. Builds passed via `node node_modules/@angular/cli/bin/ng.js build --localize=false`; final minor template changes additionally passed the running Angular watch compiler.

Actually opened screenshots: both desktop and mobile root variants, mobile reward variants, calculator variants, native/Original mining and graph unavailable, docs, About/trademark, historical block, controlled empty-block fallback, root/entity socialcards. Native pending sample rendered gold and Original colored tiles using actual provider transaction data; sparse size is preserved. The controlled empty-array screenshot verifies a126.5px difficulty card and explicit unavailable state; it is not evidence of healthy provider data. Later `route--mining.png` supersedes earlier mining screenshots' intermediate block-size wording with observed-header-gap semantics. `root-live-observed.png` / `live.json` retain the bounded130-second live observation, including provider failure if present.

## Concrete unresolved provider blocker

DOGE remains incomplete. Provider recovered briefly after03:00UTC, showing real heights6388393/6388394 and pending samples, then returned429 again during historical block detail loading. `provider-cooldown.json` records original upstream429 on `/txs/37ea455a9f80e9d40e2a4009ff27c600ac3bfbfd22a5143ebb2ce41b11a15ec0?limit=10000` at1790305754526, cooldown until04:00UTC. A later `/blocks/100001`503 was local cooldown enforcement, not proof of missing upstream historical indexing. No additional upstream probes after this observation.

A sustained indexed DOGE provider budget covering historical block transaction lists and indexed address history is still required. Historical mining aggregates are a separate missing capability: a paid key alone does not establish them. No claim of completed live incoming series, historical mining, full indexing or continuously healthy live feed is made. Native design repairs do not remove that blocker.

Local watch remains `http://127.0.0.1:4351`; start `bash scripts/local-start.sh`, stop `bash scripts/local-stop.sh`, from `/home/lukee/dev/doge-taxi`. No production/push/deploy.

The130-second observation completed with real50-transaction snapshots and heartbeats, then the native Offline state after renewed429. `live.json` contains no product JS errors; screenshot was opened. The duplicate reconnect caption beneath the pending canvas was removed after screenshot inspection found it touched the card edge; native canvas unavailable state and Offline badge remain. Provider coverage history is retained in `review/doge/` and the existing manifest; this pass adds the exact renewed429 record without re-probing previously failed providers.

## Health consistency follow-up

`/healthz` now shares the same persisted cooldown/staleness calculation as `/api/provider-health`, while remaining a read-only liveness endpoint. This fixes the observed contradiction where websocket/unavailable and an active429 cooldown could report `degraded:false`. Isolated actual HTTP-route verification trapped both provider-route and fetch calls: three health reads returned200/degraded/stale with the cooldown timestamp and **zero probes**. Evidence: [health-no-probe.json](health-no-probe.json), [verification harness](verify-health-no-probe.cjs), [local runtime](health-local.json). Shared navigation files remain untouched.
