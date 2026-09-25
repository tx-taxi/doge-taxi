# Live mined DOGE metrics

The prior collector requested only block headers and enriched fees/pool on detail visits. This made the normal hub strip blank indefinitely. AtomicWallet Blockbook now supplies the canonical block list and indexed fees, paired with serialized raw blocks. We verify header hashes, every transaction ID, Merkle root, exact transaction sizes, complete counts, input/output fee differences and total coinbase reward before publishing median/range. AuxPoW coinbase tags give pool names; absent tags fall back to actual payout address.

Shared collector polls every60s. New blocks cost two requests plus bounded pagination (1000/page,10page maximum). Verified immutable results persist by hash; already seen blocks use no detail requests. One outbound request at a time, minimum1100ms spacing, local240/hour ceiling, persistent429/403/503 cooldown. This ceiling is a local protection, not a claimed provider allowance. Blockchair remains fallback and BlockCypher pending remains separately240s. Failed pending fetch retains original observation time; it cannot become fresh merely because mined blocks updated. No frontend/native component extraction changed.

Live eight-block evidence strip.json and actual screenshot pair1440.png/390.png inspected. Screenshot6389384 verified F2Pool tag, payout D8AXXiGEZeZnMKTKnC9AWB3YUU4jfMAmYU, median91071.62802768167, range50628..550000koinu/B. Game-1 can access the provider. Local BlockCypher429 means local pending is correctly stale; screenshot warning preserved, not hidden.

Seven focused actual-data and malformed/incomplete-data checks passed: `node --test adapter/atomic.test.cjs adapter/doge-raw-block.test.cjs`. Raw parser evidence/primary source references: ../raw-block/README.md.
