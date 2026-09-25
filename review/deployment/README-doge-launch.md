# DOGE production launch — 2026-09-25

Live: https://doge.tx.taxi/ · https://tx.taxi/ · https://status.tx.taxi/

The user authorized first deployment and confirmed tx.taxi is currently noncommercial. Production enables `DOGE_BLOCKCHAIR_NONCOMMERCIAL=1`; obtain Premium before commercial use. No key is recorded here.

## Infrastructure

- Private repository: `tx-taxi/doge-taxi`, branch main.
- Coolify app `nvmlexfieesvcej03omudjgk`, game-1, Dockerfile, port 8080.
- Cloudflare proxied `doge.tx.taxi` A record points to game-1.
- Persistent volume `nvmlexfieesvcej03omudjgk-doge-provider-data` mounted at `/app/data`. Cached feed and budgets survived a real container replacement.
- Router revision `02301b73d860f397da0f167c69819fd8e6f6dced`, deployment `vwpy7hzkxdeg6ve18nldwz3g` finished. Existing native strips and 54-entry third-party carousel retained.
- OpenStatus monitor 64, component 55, page 2; Router row 8. Minute request check for provider-health HTTP 200, stale:false, websocket:live. Two real successful measurements verified; other 40 monitor configurations preserved.

## Evidence

- `doge-public/`: actual public desktop/mobile default/Original root and pending screenshots, mining and block detail, results.json, root/block social PNGs, navigation.json. Images actually inspected.
- `doge-public-health.json`: production provider state and budget snapshot.
- Native/hub matched-data parity and public hub desktop/mobile: `/home/lukee/dev/tx-taxi-doge-release/review/doge-release/`.
- Provider correctness: `../doge/provider-recheck/README.md`; frontend: `../doge/frontend/README.md`; transaction/address live subscription isolation, failure/recovery: `../doge/gateway/README.md`.
- Public logo click verified pending page → DOGE root → tx.taxi, no browser errors. Public `/doge/6389131` router request returned native DOGE block destination.
- Block 6389131 has 32 verified transactions, 8,580 bytes, 250,495,028 koinu fees, full fee range and observed AntPool AuxPoW tag. Native canvas preserves real ~0.86% capacity rather than inflating tiles.
- Frontend production build passed. Existing provider-health checks passed. Router targeted native checks passed; full suite retains three pre-existing retired marketing-home assertions, documented separately.

## Honest coverage limits

The shared collector runs every 240 seconds. Persistent ceilings are 90 BlockCypher requests/hour and 900 weighted Blockchair requests/day, with reserved collector/detail/history lanes. Pending is an observed sample. Complete fee ranges and full mined canvas require a complete verified transaction set; blocks above the bounded enrichment size can lack these. Mining history is 30 complete daily records and daily estimated hashrate, not full historical pool dominance. Free provider quotas still constrain high-volume entity lookups. Missing data remains unavailable, not fabricated.

## Local review

DOGE http://127.0.0.1:4451/ (frontend 4450), router http://127.0.0.1:4461/.
From `/home/lukee/dev/doge-completion`: `bash scripts/local-start.sh`; stop with `bash scripts/local-stop.sh`. Review servers remain running.

## Final corrective rollout

Final deployed DOGE revision: `d2ac2f3e27f38f1a9771daca43d85b107a3eceaf`; Coolify deployment `ugctujlnzne3unnkhxbzes9a` finished. The initial public matrix exposed an intermittent ECharts `coord` error when observations arrived. `../doge/frontend/coord-fix.md` records the exact dependency reproduction and actual Angular checks. Replacing an unbounded single-color visualMap with the identical direct line color fixes the first-sample failure. Initial failing evidence is retained; the affected public checks are recorded separately under `doge-public/chart-fix/`.

Post-deployment affected checks passed: default/Original root and pending, no browser exceptions or horizontal overflow, corrected graph label present. Final default root screenshot opened and inspected. Fresh provider-health remained live, nondegraded and nonstale.
