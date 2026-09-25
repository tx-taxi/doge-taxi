# DOGE bounded follow-up — 2026-09-25

Candidate changes; DOGE remains provider-blocked, not a verified complete explorer.

- Retain up to eight actual observed block tips, bootstrap three consecutive blocks. Missing heights are explicit ellipsis/count markers derived from adjacent heights in the native strip and Recent Blocks table. No fabricated blocks or implied contiguous history. Markers include the omitted height range as a native title. Sparse history remains a limitation.
- Pending transactions reuse the native tile renderer with scale derived from actual transaction bytes and measured native packing extent. No predicted block, ETA or block-capacity claim is added. The chain capacity remains 1,000,000 bytes; the dashboard's provider block-size bar no longer implies utilization from AuxPoW-inclusive sizes.
- One coalesced snapshot across readers, cached for 150 seconds. Snapshot and last actual observation survive restarts. Persistent rolling-hour budget: 90 total maximum, 76 collector, 14 interactive detail. A denied detail request does not mark the collector unhealthy. Persistent upstream 429 cooldown still takes precedence.

## Evidence

`verify-provider.cjs` exercises the demonstrated quota exhaustion and restart gaps against the actual adapter with a controlled provider and clock. `provider-controlled.json`: 24 collection cycles, 20 simultaneous readers per cycle, 74 collector requests, 14 interactive requests. The next detail request is denied before outbound I/O. Cached detail reads survive exhaustion. Budget and snapshot survive restart. An isolated actual adapter HTTP-429 response causes one upstream call total across failure/restart/retry. This is controlled behavior evidence, not public-provider liveness acceptance.

`health-controlled.json` verifies three health reads during cooldown issue zero upstream probes and consistently report degraded/stale. `runtime-health.json` is a read-only observation of the running gateway: actual persisted HTTP-429 cooldown until 06:00 UTC, source requests zero during this pass. No cooldown bypass or extra upstream probes were attempted.

`capture.mjs` uses the previously recorded real DOGE init response, omitting known blocks to exercise gaps. API/WebSocket traffic is intercepted locally; screenshots are UI evidence only. The four `pending-gap-{1440,390}-{default,original}.png` screenshots were opened and inspected. Native tile colors, inspectable tile sizes, numeric gaps and unavailable incoming-history state remain consistent across both themes and viewport sizes. The block strip deliberately scrolls horizontally on mobile; the page has no horizontal overflow. The native fixed mobile navigation overlays scrolling content as in the ancestor. `visual.json` records exact tile geometry, scale and gaps.

## Provider requirement still unresolved

BlockCypher's [official rate-limit documentation](https://www.blockcypher.com/dev/bitcoin/#rate-limits-and-tokens) documents the classic allowance of 100 requests/hour and HTTP 429. The latest persisted actual failure was `/blocks/6388530?txstart=0&limit=500` at 05:21:07 UTC, with cooldown through 06:00 UTC. This is throttling, not proof of missing historical indexing. Prior historical coverage and distinct mining gaps are in [the provider matrix](../doge/provider-coverage.md).

The public allowance cannot deliver all roughly 60 blocks/hour plus tip and pending polls and useful uncached detail review. Our conservative collector keeps sparse observed tips and reserves only 14 detail requests/hour; a 25-transaction uncached block page alone needs more than that. The limiter prevents repeated rate-limit failure; it does not unblock full acceptance. Smallest dependency: a verified DOGE source with indexed historical block/transaction/address paging and sufficient sustained quota or batch capability for the collector plus detail pages. Complete mining acceptance separately requires verified historical mining aggregation/AuxPoW attribution coverage. No paid key is assumed to provide that data. Historical mining and healthy sustained upstream recovery remain unverified.

Local review: http://127.0.0.1:4351 . Angular watch 4350 and gateway watch 4351 remain running. From repository root: `./scripts/local-start.sh`; stop: `./scripts/local-stop.sh`. No production changes or pushes.

After correcting the observed native-packing overflow, all 39 recorded pending tiles fit inside the native canvas in all four cases. Minimum rendered tile sizes are 33 px desktop and 22 px mobile; canvas sizes are 410×410 and 258×258. The fit uses the actual native layout, not an arbitrary multiplier. No browser errors or page overflow were recorded. Angular watch compiled successfully at 05:28:54 UTC (859ff58b59021bc8); adapter syntax checks passed.
