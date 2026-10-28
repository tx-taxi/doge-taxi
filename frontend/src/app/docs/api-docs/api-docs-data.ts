const dogecoin = [''];

const example = (path: string, response: string) => ({
  codeTemplate: { curl: path },
  codeSampleMainnet: { curl: [path], response },
  codeSampleTestnet: { curl: [path], response },
  codeSampleSignet: { curl: [path], response },
  codeSampleLiquid: { curl: [path], response },
  codeSampleLiquidTestnet: { curl: [path], response },
});

const endpoint = (category: string, fragment: string, title: string, urlString: string, description: string, response: string) => ({
  type: 'endpoint', category, fragment, title, urlString, httpRequestMethod: 'GET',
  description: { default: description }, showConditions: dogecoin, showJsExamples: { '': false },
  codeExample: { default: example('/api' + urlString, response) },
});

export const wsApiDocsData = [
  { type: 'category', category: 'connection', fragment: 'connection', title: $localize`:@@tx-taxi.doge.api.label.1:Connection`, showConditions: dogecoin },
  { type: 'endpoint', category: 'connection', fragment: 'initialize', title: $localize`:@@tx-taxi.doge.api.label.2:Initialize the stream`, description: { default: $localize`:@@tx-taxi.doge.api.description.19:Connect to <code>wss://doge.tx.taxi/api/v1/ws</code>, then send this message. The service returns the current block, fee, pending-sample, and provider-freshness snapshot when available.` }, payload: '{ "action": "init" }', showConditions: dogecoin, showJsExamples: { '': false }, httpRequestMethod: 'websocket', codeExample: { default: example('', '') } },
  { type: 'endpoint', category: 'connection', fragment: 'track-transaction', title: $localize`:@@tx-taxi.doge.api.label.3:Track one transaction`, description: { default: $localize`:@@tx-taxi.doge.api.description.20:Track a 64-character transaction ID. The service sends <code>tx</code> when it can retrieve the transaction and stops tracking it after confirmation.` }, payload: '{ "track-tx": "<txid>" }', showConditions: dogecoin, showJsExamples: { '': false }, httpRequestMethod: 'websocket', codeExample: { default: example('', '') } },
  { type: 'endpoint', category: 'connection', fragment: 'track-address', title: $localize`:@@tx-taxi.doge.api.label.4:Track an address`, description: { default: $localize`:@@tx-taxi.doge.api.description.21:Track a standard Dogecoin address. New unconfirmed transactions arrive as <code>address-transactions</code>; confirmations arrive as <code>block-transactions</code>. Address history remains subject to provider availability.` }, payload: '{ "track-address": "<address>" }', showConditions: dogecoin, showJsExamples: { '': false }, httpRequestMethod: 'websocket', codeExample: { default: example('', '') } },
  { type: 'endpoint', category: 'connection', fragment: 'pending-sample', title: $localize`:@@tx-taxi.doge.api.label.5:Inspect the pending sample`, description: { default: $localize`:@@tx-taxi.doge.api.description.22:Request the transactions included in the explorer’s bounded pending sample. This is a sampled visualization of the latest provider observation, not the network-wide mempool and not a confirmation promise.` }, payload: '{ "track-mempool-block": 0 }', showConditions: dogecoin, showJsExamples: { '': false }, httpRequestMethod: 'websocket', codeExample: { default: example('', '') } },
];

export const restApiDocsData = [
  { type: 'category', category: 'network', fragment: 'network', title: $localize`:@@tx-taxi.doge.api.label.6:Network`, showConditions: dogecoin },
  endpoint('network', 'tip-height', $localize`:@@tx-taxi.doge.api.label.7:Get the tip height`, '/blocks/tip/height', $localize`:@@tx-taxi.doge.api.description.1:Returns the current best-chain height as plain text.`, '5400000'),
  endpoint('network', 'tip-hash', $localize`:@@tx-taxi.doge.api.label.8:Get the tip hash`, '/blocks/tip/hash', $localize`:@@tx-taxi.doge.api.description.2:Returns the current best-chain block hash as plain text.`, '0000000000000000000000000000000000000000000000000000000000000000'),
  endpoint('network', 'dogecoin-network', $localize`:@@tx-taxi.doge.api.label.9:Get explorer network data`, '/v1/doge/network', $localize`:@@tx-taxi.doge.api.description.3:Returns the latest observed Dogecoin target block time, permanent subsidy, provider observation timestamps, and tip snapshot. Timestamps describe the source observation, not a guarantee of live network state.`, '{\n  "targetBlockTime": 60,\n  "subsidy": 1000000000000,\n  "pendingSample": 50\n}'),
  { type: 'category', category: 'blocks', fragment: 'blocks', title: $localize`:@@tx-taxi.doge.api.label.10:Blocks`, showConditions: dogecoin },
  endpoint('blocks', 'block-height', $localize`:@@tx-taxi.doge.api.label.11:Get a block hash by height`, '/block-height/:height', $localize`:@@tx-taxi.doge.api.description.4:Resolves a decimal block height to its canonical block hash.`, '0000000000000000000000000000000000000000000000000000000000000000'),
  endpoint('blocks', 'block', $localize`:@@tx-taxi.doge.api.label.12:Get a block`, '/block/:hash', $localize`:@@tx-taxi.doge.api.description.5:Returns indexed block data including height, timestamp, header fields, transaction count, fees when available, and reward. Recent strip data is cross-checked against raw Dogecoin block data before use; older detail availability depends on the historical provider.`, '{\n  "id": "<hash>",\n  "height": 5400000,\n  "tx_count": 1,\n  "timestamp": 1710000000\n}'),
  endpoint('blocks', 'block-transactions', $localize`:@@tx-taxi.doge.api.label.13:Get a block transaction page`, '/block/:hash/txs/:start_index', $localize`:@@tx-taxi.doge.api.description.6:Returns up to 25 indexed transactions from a block. The gateway rejects incomplete pages rather than silently returning partial data.`, '[{ "txid": "<txid>", "fee": 100000000, "status": { "confirmed": true } }]'),
  endpoint('blocks', 'block-transaction-ids', $localize`:@@tx-taxi.doge.api.label.14:Get all indexed transaction IDs`, '/block/:hash/txids', $localize`:@@tx-taxi.doge.api.description.7:Returns a complete transaction-ID list only when the provider can supply the whole block.`, '["<txid>"]'),
  { type: 'category', category: 'transactions', fragment: 'transactions', title: $localize`:@@tx-taxi.doge.api.label.15:Transactions`, showConditions: dogecoin },
  endpoint('transactions', 'transaction', $localize`:@@tx-taxi.doge.api.label.16:Get a transaction`, '/tx/:txid', $localize`:@@tx-taxi.doge.api.description.8:Returns a transaction with inputs, outputs, koinu values, and confirmation status. Amounts are in koinu; 100,000,000 koinu equals 1 DOGE.`, '{\n  "txid": "<txid>",\n  "fee": 100000000,\n  "size": 225,\n  "status": { "confirmed": true }\n}'),
  endpoint('transactions', 'transaction-status', $localize`:@@tx-taxi.doge.api.label.17:Get transaction status`, '/tx/:txid/status', $localize`:@@tx-taxi.doge.api.description.9:Returns only the confirmation status and, when known, the containing block.`, '{ "confirmed": true, "block_height": 5400000, "block_hash": "<hash>" }'),
  endpoint('transactions', 'transaction-outspends', $localize`:@@tx-taxi.doge.api.label.18:Get output spends`, '/tx/:txid/outspends', $localize`:@@tx-taxi.doge.api.description.10:Returns one entry per output describing whether it has been spent, when the historical provider has the data.`, '[{ "spent": false }]'),
  endpoint('transactions', 'transaction-hex', $localize`:@@tx-taxi.doge.api.label.19:Get raw transaction data`, '/tx/:txid/hex', $localize`:@@tx-taxi.doge.api.description.11:Returns a transaction serialized as hexadecimal when it remains available from the provider.`, '<hex>'),
  { type: 'category', category: 'addresses', fragment: 'addresses', title: $localize`:@@tx-taxi.doge.api.label.20:Addresses`, showConditions: dogecoin },
  endpoint('addresses', 'address', $localize`:@@tx-taxi.doge.api.label.21:Get address statistics`, '/address/:address', $localize`:@@tx-taxi.doge.api.description.12:Returns indexed funded, spent, and transaction totals for a standard Dogecoin address. The explorer does not provide wallet balances or private-key services.`, '{ "address": "<address>", "chain_stats": { "tx_count": 4 } }'),
  endpoint('addresses', 'address-transactions', $localize`:@@tx-taxi.doge.api.label.22:Get address transactions`, '/address/:address/txs', $localize`:@@tx-taxi.doge.api.description.13:Returns the current provider page of transactions for an address. Use the chain cursor endpoint to continue through confirmed history.`, '[{ "txid": "<txid>", "status": { "confirmed": true } }]'),
  endpoint('addresses', 'address-history', $localize`:@@tx-taxi.doge.api.label.23:Continue confirmed address history`, '/address/:address/txs/chain/:last_seen_txid', $localize`:@@tx-taxi.doge.api.description.14:Returns the next historical page before a confirmed transaction ID. Historical depth is limited by the upstream indexed provider.`, '[{ "txid": "<older-txid>" }]'),
  endpoint('addresses', 'validate-address', $localize`:@@tx-taxi.doge.api.label.24:Validate an address format`, '/v1/validate-address/:address', $localize`:@@tx-taxi.doge.api.description.15:Checks whether a value matches the gateway’s standard Dogecoin address format. This is format validation, not an ownership or balance check.`, '{ "isvalid": true, "address": "<address>" }'),
  { type: 'category', category: 'fees', fragment: 'fees', title: $localize`:@@tx-taxi.doge.api.label.25:Fees and pending sample`, showConditions: dogecoin },
  endpoint('fees', 'recommended-fees', $localize`:@@tx-taxi.doge.api.label.26:Get fee estimates`, '/v1/fees/recommended', $localize`:@@tx-taxi.doge.api.description.16:Returns source fee suggestions in koinu/B. They are observations from the configured provider and should be checked when creating a transaction.`, '{ "fastestFee": 1000, "halfHourFee": 1000, "hourFee": 1000, "minimumFee": 1000 }'),
  endpoint('fees', 'pending-sample-rest', $localize`:@@tx-taxi.doge.api.label.27:Get the bounded pending sample`, '/v1/fees/mempool-blocks', $localize`:@@tx-taxi.doge.api.description.17:Returns the explorer’s packed sample of recently observed pending transactions. It is capped at one million bytes and may be empty or stale during source outages; it is not a complete mempool view.`, '[{ "blockSize": 500, "nTx": 2, "sampled": true }]'),
  endpoint('fees', 'recent-pending', $localize`:@@tx-taxi.doge.api.label.28:Get recently observed pending transactions`, '/mempool/recent', $localize`:@@tx-taxi.doge.api.description.18:Returns the bounded recent pending observation used by the explorer. It does not enumerate every transaction relayed by the Dogecoin network.`, '[{ "txid": "<txid>", "fee": 100000000, "vsize": 225 }]'),
];

export const faqData = [
  { type: 'category', category: 'about', fragment: 'about', title: $localize`:@@tx-taxi.doge.faq.heading.1:Dogecoin basics`, showConditions: dogecoin },
  { type: 'endpoint', category: 'about', fragment: 'dogecoin-units', title: $localize`:@@tx-taxi.doge.faq.heading.2:What units does the explorer use?`, showConditions: dogecoin },
  { type: 'endpoint', category: 'about', fragment: 'block-time', title: $localize`:@@tx-taxi.doge.faq.heading.3:How quickly are blocks found?`, showConditions: dogecoin },
  { type: 'endpoint', category: 'about', fragment: 'merged-mining', title: $localize`:@@tx-taxi.doge.faq.heading.4:What is AuxPoW merged mining?`, showConditions: dogecoin },
  { type: 'category', category: 'explorer', fragment: 'explorer', title: $localize`:@@tx-taxi.doge.faq.heading.5:Using this explorer`, showConditions: dogecoin },
  { type: 'endpoint', category: 'explorer', fragment: 'searching', title: $localize`:@@tx-taxi.doge.faq.heading.6:What can I search for?`, showConditions: dogecoin },
  { type: 'endpoint', category: 'explorer', fragment: 'pending-sample-faq', title: $localize`:@@tx-taxi.doge.faq.heading.7:What does the pending strip represent?`, showConditions: dogecoin },
  { type: 'endpoint', category: 'explorer', fragment: 'fee-estimates', title: $localize`:@@tx-taxi.doge.faq.heading.8:How should I read fee estimates?`, showConditions: dogecoin },
  { type: 'endpoint', category: 'explorer', fragment: 'historical-data', title: $localize`:@@tx-taxi.doge.faq.heading.9:Why is historical data sometimes unavailable?`, showConditions: dogecoin },
  { type: 'category', category: 'transactions', fragment: 'transactions', title: $localize`:@@tx-taxi.doge.faq.heading.10:Transactions and confirmations`, showConditions: dogecoin },
  { type: 'endpoint', category: 'transactions', fragment: 'unconfirmed', title: $localize`:@@tx-taxi.doge.faq.heading.11:Why is my transaction still unconfirmed?`, showConditions: dogecoin },
  { type: 'endpoint', category: 'transactions', fragment: 'not-custodial', title: $localize`:@@tx-taxi.doge.faq.heading.12:Can this site change or recover a transaction?`, showConditions: dogecoin },
];
