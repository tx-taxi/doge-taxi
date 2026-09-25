# Dogecoin raw block size and marker extraction

Read-only public source verified: `https://dogecoin.atomicwallet.io/api/v2/rawblock/6389384` plus `.../block/6389384?pageSize=1000`. Raw block is 3,335 bytes, containing 11 legacy Dogecoin transactions totaling 2,420 bytes; the remaining bytes are header, AuxPoW proof and count. Every computed transaction ID matches the independently indexed list in order. One additional full transaction detail verifies both its explicit size and hex length are 289 bytes.

`adapter/doge-raw-block.cjs` exports `parseBlock(hex)` returning `{hash, transactions:[{txid,size}], parentCoinbase, auxpow, size}`. `parentCoinbase` is UTF-8 decoded parent coinbase script, preserving markers (this example `/F2Pool/`). `size` includes the entire serialized AuxPoW block; transaction sizes are exact byte lengths, not proportional estimates.

Serialization references are the primary Dogecoin Core sources:

- https://github.com/dogecoin/dogecoin/blob/master/src/primitives/pureheader.h (80-byte header, AuxPoW version bit 0x100)
- https://github.com/dogecoin/dogecoin/blob/master/src/primitives/pureheader.cpp (header hash is SerializeHash)
- https://github.com/dogecoin/dogecoin/blob/master/src/primitives/block.h (header, conditional AuxPoW, transaction vector)
- https://github.com/dogecoin/dogecoin/blob/master/src/auxpow.h (parent coinbase, parent block hash, parent branch/index, chain branch/index, parent pure header)
- https://github.com/dogecoin/dogecoin/blob/master/src/primitives/transaction.h (transaction fields and optional witness serialization of parent coinbase)
- https://github.com/trezor/blockbook/blob/master/server/public.go (public rawblock API handler)

Strict checks cover hexadecimal form, bounded payload, canonical CompactSize, remaining-byte/count bounds, branch limits, coinbase position, legacy DOGE transactions, trailing bytes and child transaction Merkle root. This parser does not replace a full node's PoW/AuxPoW proof or consensus validation; caller must reconcile the computed header hash with its indexed canonical block. Parent markers are attribution evidence, not proof of pool ownership.

Run `node --test adapter/doge-raw-block.test.cjs`. Five focused behavior tests passed: real cross-source size/ID agreement plus malformed/truncated/noncanonical/oversized/trailing/Merkle-corrupted inputs. Fixtures are actual recorded public responses, not invented chain data. No deployment/push performed here.
