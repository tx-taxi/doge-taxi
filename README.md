<p align="center">
  <img src="frontend/src/resources/branding/doge-favicon.svg" width="88" height="88" alt="doge.tx.taxi logo">
</p>

<h1 align="center">Dogecoin Explorer · doge.tx.taxi</h1>

<p align="center">
  A public Dogecoin block explorer and API.<br>
  <a href="https://doge.tx.taxi">Open doge.tx.taxi</a>
</p>

## Overview

[doge.tx.taxi](https://doge.tx.taxi) is a Dogecoin explorer in the [tx.taxi](https://tx.taxi) network. It combines a branded Angular frontend with a read-only Dogecoin API adapter and a native bridge to the hub.

## Features

- Look up Dogecoin blocks, transactions, and indexed address history.
- Browse recent blocks, fee estimates, and an observed pending-transaction sample. The sample is not a complete global mempool.
- View Dogecoin mining and network history, including difficulty and estimated hashrate where provider data is available.
- Use current DOGE/USD pricing in the calculator and move between supported chains through the tx.taxi search interface.
- Return explicit unavailable states when a provider cannot supply complete data; cached data retains its provider observation time.

## Development

Use Node.js `v24.13.0` (see [.nvmrc](.nvmrc)), then install the frontend and adapter dependencies:

```bash
npm ci --prefix frontend
npm ci --prefix adapter
```

Start the local explorer at `http://127.0.0.1:4451`:

```bash
bash scripts/local-start.sh
```

Stop it with:

```bash
bash scripts/local-stop.sh
```

Build the production container locally:

```bash
docker build -t doge-taxi .
```

The adapter needs outbound access to the Atomic Wallet Dogecoin API, BlockCypher’s Dogecoin API, Blockchair’s Dogecoin API, and Kraken’s public ticker API. Local development can use the public-provider configuration. A containerized runtime requires either `DOGE_BLOCKCHAIR_KEY` or an explicit `DOGE_BLOCKCHAIR_NONCOMMERCIAL=1` eligibility setting for Blockchair; `BLOCKCYPHER_TOKEN` is optional for higher BlockCypher allowance. Supply provider values through the runtime environment and never commit them.

## Attribution and license

This repository adapts the [Mempool Open Source Project](https://github.com/mempool/mempool) for Dogecoin in the tx.taxi network. The inherited root README is retained in [UPSTREAM_README.md](UPSTREAM_README.md) for provenance.

The code is distributed under the terms in [LICENSE](LICENSE) and [COPYING.md](COPYING.md), including the GNU Affero General Public License v3 text and applicable trademark notices.

The software license does not grant trademark rights to the tx.taxi name or logos. Independent deployments should use their own branding and must not imply they are operated or endorsed by tx.taxi.

## Links

- [Live explorer](https://doge.tx.taxi)
- [tx.taxi hub](https://tx.taxi)
- [Telegram channel](https://t.me/txtaxi)
