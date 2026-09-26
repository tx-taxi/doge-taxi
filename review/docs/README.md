# Dogecoin documentation evidence

Reviewed: 2026-09-26. This record supports the Dogecoin-specific documentation in `frontend/src/app/docs/`; it does not certify a deployment or provider availability.

## Protocol facts

* [Dogecoin Core `chainparams.cpp`](https://github.com/dogecoin/dogecoin/blob/master/src/chainparams.cpp) defines a 60-second target spacing, DigiShield’s post-activation one-minute adjustment interval, and AuxPoW parameters. Its mainnet comments place AuxPoW blocks at height 371,337 onward.
* [Dogecoin Core BIP status](https://github.com/dogecoin/dogecoin/blob/master/doc/bips.md) lists Scrypt-1024 proof of work, merged mining (AuxPoW), and DigiShield as implemented Dogecoin features.
* [Dogecoin Core `amount.h`](https://github.com/dogecoin/dogecoin/blob/master/src/amount.h) defines `COIN = 100000000` and calls wallet/relay fees “koinus.” The docs consequently use 100,000,000 koinu per DOGE and koinu/B for the explorer’s fee display.

## Gateway contract inspected

`adapter/dogecoin.cjs` is the source of the public read-only route mapping. Its `route()` function covers:

* chain tip and height-to-hash lookup (`/api/blocks/tip/*`, `/api/block-height/:height`);
* block data, indexed transaction pages, and complete transaction IDs (`/api/block/:id`, `/txs/:start`, `/txids`);
* transaction, status, outspend, and hex lookup (`/api/tx/:txid*`);
* address statistics/history and format validation;
* fee estimates, recent pending observations, the packed pending sample, and `/api/v1/doge/network`.

No public raw-block route is exposed. `adapter/blockchair.cjs` reads `/raw/block/:id` internally to verify enriched recent block data. The docs describe this as an enrichment path rather than advertising a raw-block endpoint.

`adapter/server.cjs` accepts only `GET`/`HEAD` API requests and exposes the WebSocket at `/api/v1/ws`. Its implemented client messages are `action: "init"`, `track-tx`, `track-address`, and `track-mempool-block`; documentation intentionally makes no claim for Electrum, Lightning, enterprise, or a general transaction broadcast API.

## Bounds and availability

The adapter sets a 60-second shared collector interval and a 240-second provider refresh interval. Pending observations request at most 50 transactions and pack at most 1,000,000 bytes into the visualized sample. It records a gap rather than a fabricated rate after a provider outage. Provider freshness becomes stale after two refresh intervals.

For blocks, the gateway rejects incomplete transaction lists/pages, and its summary path rejects a block above 100 transactions when it cannot obtain a complete visualization inside the provider budget. Historical address, transaction, outspend, and raw-data-dependent enrichment remain conditional on the upstream indexed provider. These are why the docs call the pending view bounded and historical availability provider-dependent.

## Validation

* `frontend/./node_modules/.bin/ngc -p tsconfig.app.json` completed successfully after the docs implementation.
* `git diff --check` completed successfully before the docs implementation commit `c272a1b7d`.
* No full frontend build, browser review, deployment, or public API load test was run for this evidence addition.
