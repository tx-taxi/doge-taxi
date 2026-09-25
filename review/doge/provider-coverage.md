# DOGE provider coverage — observed 2026-09-25 01:29–01:37 UTC

Status: incomplete local candidate. These observations are not a verified explorer baseline. No production work.

| Provider / exact endpoint | Observation | Meaning |
| --- | --- | --- |
| `https://api.blockcypher.com/v1/doge/main` | HTTP 200, height 6388306 initially | Chain tip, pending count, fee bands; still usable in later local snapshot |
| `/blocks/100000?txstart=1&limit=2` | HTTP 200, 2014-02-14 block `13ab3b961fcc500c03f51279385c42e9f055d48a37dfa72d0073c0d3f595036b` | Historical block index exists |
| `/txs/19220173c151925d493a25dbe67798fa11e6e4db01b927b1c04cddead85d3d12` | HTTP 200; exact 1 DOGE fee, inputs minus outputs matches | Historical transactions exist, not a missing archival dependency |
| `/addrs/DDogepartyxxxxxxxxxxxxxxxxxxw1dfzr/full?limit=2` | HTTP 200, 7587 transactions, `hasMore: true`, full tx bodies | Indexed history exists; first page observed; documented full endpoint includes all same-height boundary records, candidate retains entire page before height cursor; live second page remains blocked |
| `/txs?limit=2` | HTTP 200, unconfirmed transactions | Pending sample, not guaranteed complete network mempool |
| `https://api.blockchair.com/dogecoin/stats` | Initially HTTP 200 with hash rate, fiat, difficulty and pending stats; subsequent HTTP 430 | Temporary IP blacklist, not evidence of missing indexing |
| `https://api.blockchair.com/dogecoin/blocks?limit=2` | Initially HTTP 200; size, fees, rewards, difficulty, guessed miner, AuxPoW flag | Current mining/block metrics exist |
| `https://api.blockchair.com/dogecoin/dashboards/block/100000` | HTTP 200, same historical hash as BlockCypher | Independently verified historical block |
| `https://api.blockchair.com/dogecoin/dashboards/address/DDogepartyxxxxxxxxxxxxxxxxxxw1dfzr?limit=2` | HTTP 200, 7587 transactions; 22737 outputs | Independent indexed history exists |
| `https://api.blockchair.com/dogecoin/dashboards/transaction/19220173c151925d493a25dbe67798fa11e6e4db01b927b1c04cddead85d3d12` | HTTP 430 | Throttled; transaction route not proven by this probe |
| `https://api.blockchair.com/dogecoin/blocks?a=date,count(),sum(fee_total),avg(difficulty)&s=date(desc)&limit=3` | HTTP 430 | Historical mining aggregation NOT verified. A paid key alone is not proof this query is supported |
| `https://api.blockchair.com/dogecoin/transactions?q=block_id(100000)&limit=2` | HTTP 430 | Throttled, block transaction pagination not proven |
| `https://api.blockchair.com/dogecoin/dashboards/address/DDogepartyxxxxxxxxxxxxxxxxxxw1dfzr?limit=2&offset=2` | HTTP 430 | Throttled, independent page2 not proven |
| `https://doge1.trezor.io/api/v2`, `https://doge2.trezor.io/api/v2`, `https://doge1.trezor.io/api` | HTTP 403 | Access denied from this environment |
| `https://doge-electrs-demo.qed.me/blocks/tip/height`, `/api/blocks/tip/height`; `https://doge-explorer.qed.me/api/blocks/tip/height` | HTTP 403 | Documented public Electrs demo currently inaccessible |
| `https://dogechain.info/api/v1/block/100000` | HTTP 403 | Access denied |
| `https://sochain.com/api/v3/info/DOGE` | HTTP 403 | Access denied |
| `https://doge.tokenview.io/api/v2` | HTTP 200 HTML security challenge | Not API JSON; never treat as data |
| `https://explorer.doged.io/api/v2` | HTTP 502 | Upstream failure |
| `https://doge-blockbook.nownodes.io/api/v2`, `https://doge.nownodes.io` | HTTP 403 | Guessed/unauthenticated routes, not capability evidence; official documented indexer is `dogebook.nownodes.io` with API-key header |
| `dogecoinspace.org`, `dogecoinblockexplorer.com`, `doge.atomicwallet.io` | DNS resolution failed | No usable service; names were discovery candidates |

Exact Blockchair error: `Your IP address is temporary blacklisted due to exceeding usage of API resources. Please apply for an API key by contacting us at info@blockchair.com`. No subsequent repeat probes after this diagnosis.

BlockCypher's [primary rate documentation](https://www.blockcypher.com/dev/bitcoin/#rate-limits-and-tokens) states 3 requests/second and 100 requests/hour for free GET access, with or without a token; 429 indicates exhaustion. The candidate serializes calls, coalesces duplicate requests, caches immutable entities on disk, and uses a 120-second snapshot cadence. This is not sufficient for a full historical explorer plus mining time series. A free token does not solve the budget.

## Smallest concrete unblock requirement

1. A reachable DOGE indexed service with a confirmed request budget for latest blocks, historical block/transaction details, complete address pagination, pending data and live refresh. BlockCypher proves several of these capabilities but its public budget cannot guarantee the requested workload.
2. Current and historical block difficulty, fees, rewards and size are available and can support bounded block-derived mining views. The inherited long-range mining aggregation API remains unverified; it is a separate scope gap, not proof that mining data is absent. Do not recommend a paid key as proof of this capability.
3. Reconcile AuxPoW block-size serialization against a documented provider mapping or actual standard-node raw block. Current USD now works through independent Kraken XDGUSD; historical quotes remain unavailable.

No node deployment, payment, signup, messaging or production registration was performed. Credentials must be supplied via local environment/secret reference, never committed.

## Semantics sources

Dogecoin Core [chain parameters](https://github.com/dogecoin/dogecoin/blob/master/src/chainparams.cpp) establish mainnet Base58 version30 (P2PKH), version22 (P2SH), target spacing and AuxPoW configuration. [Fee policy](https://github.com/dogecoin/dogecoin/blob/master/doc/fee-recommendation.md) documents 0.01 DOGE/kB recommended block inclusion fee; this is not a live fee-market promise. 1 DOGE = 100,000,000 koinu. Native transactions have no SegWit discount; internal inherited weight = physical bytes×4 is adapter compatibility only. No LTC halving schedule or 84M cap applies. Unsafe integer JSON values now retain exact decimal strings. BigInt display verified the recorded balance 185458827448319109 koinu as 1,854,588,274.48319109 DOGE. Geometry still uses approximate numbers; displayed and summed monetary quantities use exact fields.

## Additional bounded live-transport probe
`wss://socket.blockcypher.com/v1/doge/main` opened, but unauthenticated `{event:"new-block"}` returned `{ "event": "events limit reached" }` at2026-09-25T01:37:47Z. Exact capture: `blockcypher-ws.json`. No usable update was delivered. This is an observed stream limit, separate from the documented REST budget (subsequently REST429 was observed, see below).

## Final bounded observations

REST tip returned HTTP429 at 2026-09-25T01:41:24Z, `x-ratelimit-remaining: -13`, body `{"error":"Limits reached."}`. Exact files: `blockcypher-throttle.headers`, `blockcypher-throttle.json`. Cooldown persists across watch restarts until next known UTC reset (02:00 UTC for this observation); requests during cooldown are rejected locally. `throttled-health.json` shows stale/degraded and zero provider calls. Historical cached reads do not reset live freshness.

Kraken `https://api.kraken.com/0/public/Ticker?pair=XDGUSD` HTTP200, error[]; actual current USD captured in `current-usd.json`. [Primary ticker contract](https://docs.kraken.com/api-reference/market-data/get-ticker-information). Independent 60-second cache, explicit observation/expiry, unavailable differs from zero; no historical quote invented.

Same AuxPoW block `dcdbae87393e3d395d0d0c3b6080440dacd5ad4aa8e24b8091c8cc838ff10950`: Blockchair reports1545B, BlockCypher782B; historical pre-AuxPoW100000 agrees13372B. Cause is unresolved without raw-block decoding. UI labels provider-reported size, hides inherited weight and removes size-derived utilization/fill and aggregate fee-density claims. Transaction fee per transaction byte remains separately supported.

Primary [BlockCypher full address contract](https://www.blockcypher.com/dev/dogecoin/#address-full-endpoint) says limit is a minimum and all transactions at the lower block-height boundary are included. The adapter keeps the full returned page before using that boundary for next-page `before`; no arbitrary25 slicing. Second-page live acceptance is still blocked. Hidden historical strip pages now defer HTTP fetch until explicit history navigation, reducing unsolicited quota use.

## Request budget from implemented call graph

At120-second cadence, each snapshot uses one tip request, one pending-sample request, and at most one newly observed tip-block request: up to90REST requests/hour after warmup; initial cold start adds six blocks. Duplicate concurrent consumers share requests and immutable data is cached24hours. This implementation samples observed latest blocks and can skip intervening heights. Contiguous block collection at the60-second target would average another30block requests/hour, approximately120/hour before navigation (actual block arrivals vary).

Uncached navigation: historical strip page10block calls; block detail1block plus up to25transaction calls per page; transaction1call (hex separate); indexed address1call/page, plus cursor transaction lookup if not cached. A bounded tour with one history page, one block25tx page, one standalone tx, and two address pages adds approximately39–41calls. Thus budget approximately160+/hour supports this specific single-user contiguous-live plus small tour workload, with additional headroom for variance/recovery; it is an engineering estimate, not measured provider SLA. Existing100/hour leaves at most10calls beyond sampled updates and is shared with other public-IP activity. Proven429 and stream event limit remain the measured blocker. No paid provider capability is assumed from these estimates.
