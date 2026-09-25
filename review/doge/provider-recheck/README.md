# DOGE provider recheck — 2026-09-25 around 16:00 UTC

Read-only bounded provider probes from local workstation. Production provider availability was not assumed from workstation success.

BlockCypher semicolon batching returned HTTP200 for two blocks and two transactions. Transaction response was reordered: map by hash. Its official batching contract bills each identifier individually and limits unregistered traffic to three per second: batching improves latency, not the 100/hour capacity. No batch-based quota claim is valid. https://www.blockcypher.com/dev/#batching

Two actual DDogeparty address pages succeeded with `limit=2&txlimit=10000`: heights6378799,6316430 then `before=6316430` returned6307245,6307244. No overlap, hasMore=true on both. Existing height cursor works on this example.

Blockchair now returned HTTP200 for latest stats, eight blocks, two-block dashboard, raw block6389131, complete32-transaction block index and daily mining aggregate. Saved `doge-alt-2.json` contains three dates, Sep23–25, count/fees/average difficulty, context.total_rows4676, request_cost32. This proves historical mining capability, not an adequate subscription. Cache daily history; do not poll costly aggregation. Raw block AuxPoW parent coinbase contains “Mined by AntPool” although guessed_miner is Unknown. Attribution can derive from parent coinbase evidence rather than guessing DOGE payout owners.

Costs observed: blocks?limit=8 costs2, dashboards/blocks/two heights costs1.1, raw/block costs1, aggregate costs32. A proposed four-minute eight-block dashboard collector costs612/day, excluding navigation and enrichment. It still needs provider allowance headroom and shared persistent budget.

Production permission unresolved: Blockchair's published API policy requires a Premium key for commercial projects independent of traffic; no-key noncommercial usage has a published1440/day ceiling. Marketing describes a1000/day testing plan. Do not assume commercial production permission from200 responses. https://github.com/Blockchair/Blockchair.Support/blob/master/API_DOCUMENTATION_EN.md#link_M05

Trezor doge1/doge2, Zelcore blockbook.doge.zelcore.io and unauthenticated dogebook.nownodes.io returned403. No repeat attempts after access denial.

Scoped code change in adapter/dogecoin.cjs: use30-second pending/recent transaction cache (<6 confirmations),24hours for deeply confirmed; always30seconds for outspends since outputs can spend later. Applies to memory and disk. Syntax verified and controlled-time adapter behavior demonstrated pending→confirmed and confirmed output→spent at31seconds using real transaction payload shape;3upstreamcalls. No batching/catchup collector changes made because quota assumption was disproven. No production changes.

## Implemented local combined provider — supersedes earlier cache-only scope

`adapter/blockchair.cjs` exposes `request(path,{ttl,cost,lane})`, persists budget/cache/cooldown, serializes requests2.5seconds apart and caps25requests/minute. Daily ceiling900weighted points: collector612, detail224, history64. Actual response cost above reservation is charged too. This is a single gateway process contract; do not run independent provider workers against the same directory. API key remains environment-only, never persisted in cache keys, URLs or error messages.

Production (`NODE_ENV=production` or `DOGE_STATIC_ROOT` configured) requires `DOGE_BLOCKCHAIR_KEY` or explicit `DOGE_BLOCKCHAIR_NONCOMMERCIAL=1`. Local research mode remains allowed. No production deployment performed. API allowance/classification still must be confirmed by integrator before deployment.

Collector refresh240seconds: two BlockCypher calls (tip and pending,30/hour) plus eight contiguous Blockchair canonical heights (1.7weighted points each refresh,612/day worst case). Schema2 invalidates old sparse persisted snapshot. Cross-provider tip hashes must agree. Only the top header's actual BlockCypher previous hash is attached, never guessed neighbor linkage. Numeric block-height canonical mapping caches30seconds; immutable hash block data caches24hours. Live observation timestamp uses older source observation, never renewed simply by disk cache access.

Block/tx pages use Blockchair: transaction dashboards batch at most10 and restore requested order by hash. Complete block tx pages assert expected count. Confirmed single tx status resolves canonical block hash. Outspends refresh30seconds. Address history deliberately retains proven BlockCypher full-address route:25complete transaction bodies per one request, cheaper and cursor-stable compared to Blockchair offset list plus body batches. BC reserved collector35/detail55 inside90/hour ceiling.

Pending sample projection packs sampled transactions by fee rate within1MB and derives nTx, byte fullness, sum fees, exact sample min/max/median and transaction IDs. It is explicitly sampled; no claim of complete network mempool. Native geometry gets target60000ms (`da.adjustedTimeAvg`), not a promise of inclusion time.

On-demand block detail enrichment covers blocks up to100transactions, validates full tx count and total fees before exposing fee range/median, and decodes raw AuxPoW parent coinbase for known explicit pool tags. Verified block6389131:32transactions,8580serialized bytes,250495028totalfees; noncoinbase range100.29585798816568–750000baseunits/byte, median2010.4712041884816; AntPool parent marker plus actual DOGE coinbase payoutDTZSTXecLmSXpRGSfht4tAMyqra1wsL7xb. Hash-cached enrichment is reused in later strip refresh. Range is unavailable until complete enrichment exists; no fabricated empty range statistics or median=average.

Cost correction: earlier `transactions?q=block_id(6389131)&limit=100` actually cost11.4, as recorded by response.context. Full dashboard batching is cheaper but still cannot enrich every new strip block within free reserved budget. Blocks over100tx or exhausted enrichment budget retain honest missing ranges. This remaining gap prevents claiming universal live fee-range completeness.

Final bounded verification: live gateway4451 produced8contiguous heights6389133..6389126, sampled43transactions/11966bytes; real blockdetail enrichment above verified via gateway, allcode syntax checks passed. Earlier isolated research cost2BC+1.7chair occurred before shared-directory coordination; account it within100points safety margin (900localceiling vs1000testing maximum). No subsequent isolated live requests.

### Final audit corrections

`cache-limits.cjs`: entity files only, max1000files/256MiB per provider,7days maximum age, oldest file timestamps evicted. Budget/cooldown/snapshot/observations are explicitly protected. BC memory map max500 entries. Controlled check retained budget while evicting oldest cache entries and bounded505memoryinsertions to500. Existing shared budget5records was read/count-preserved without modifying its bytes. Final BC collector36/detail54/hour90.

`provider-queue.cjs`: one outbound request in flight, max8waiting details,2collectors,2history requests. Collector has next-slot priority; duplicate provider paths still coalesce. Budget charged immediately before outbound after spacing, never on admission. Local queue rejection returns503 without recording upstream failure. Controlled burst10details plus collector behind active request ran collector next, accepted8details and rejected2; queue drained. This fixes collector starvation rather than adding concurrency.

BlockCypher fallback rejects incomplete vin_sz/vout_sz bodies. Pending projection consumes verified transaction summary fields, so an intentionally summarized pending payload does not pretend to contain full inputs/outputs. Provider confirmation receipt time is no longer labeled block timestamp: use known block header time or omit it, resolving actual canonical header on individual transaction detail. The real coinbase fixture's receipt time15:58:53.125 differs from its actual block time15:58:37.

Persisted live snapshot final schema3 also invalidates intermediate snapshots without native `da` geometry fields. Code syntax and scoped diff checks pass. All changes remain local; production eligibility is not assumed.
