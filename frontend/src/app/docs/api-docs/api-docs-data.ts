const dogecoin = [''];

const example = (path: string, response: string) => ({
  codeTemplate: { curl: 'curl -s %{1}' },
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
  { type: 'category', category: 'connection', fragment: 'connection', title: 'Connection', showConditions: dogecoin },
  { type: 'endpoint', category: 'connection', fragment: 'initialize', title: 'Initialize the stream', description: { default: 'Connect to <code>wss://doge.tx.taxi/api/v1/ws</code>, then send this message. The service returns the current block, fee, pending-sample, and provider-freshness snapshot when available.' }, payload: '{ "action": "init" }', showConditions: dogecoin, showJsExamples: { '': false }, httpRequestMethod: 'websocket', codeExample: { default: example('', '') } },
  { type: 'endpoint', category: 'connection', fragment: 'track-transaction', title: 'Track one transaction', description: { default: 'Track a 64-character transaction ID. The service sends <code>tx</code> when it can retrieve the transaction and stops tracking it after confirmation.' }, payload: '{ "track-tx": "<txid>" }', showConditions: dogecoin, showJsExamples: { '': false }, httpRequestMethod: 'websocket', codeExample: { default: example('', '') } },
  { type: 'endpoint', category: 'connection', fragment: 'track-address', title: 'Track an address', description: { default: 'Track a standard Dogecoin address. New unconfirmed transactions arrive as <code>address-transactions</code>; confirmations arrive as <code>block-transactions</code>. Address history remains subject to provider availability.' }, payload: '{ "track-address": "<address>" }', showConditions: dogecoin, showJsExamples: { '': false }, httpRequestMethod: 'websocket', codeExample: { default: example('', '') } },
  { type: 'endpoint', category: 'connection', fragment: 'pending-sample', title: 'Inspect the pending sample', description: { default: 'Request the transactions included in the explorer’s bounded pending sample. This is a sampled visualization of the latest provider observation, not the network-wide mempool and not a confirmation promise.' }, payload: '{ "track-mempool-block": 0 }', showConditions: dogecoin, showJsExamples: { '': false }, httpRequestMethod: 'websocket', codeExample: { default: example('', '') } },
];

export const restApiDocsData = [
  { type: 'category', category: 'network', fragment: 'network', title: 'Network', showConditions: dogecoin },
  endpoint('network', 'tip-height', 'Get the tip height', '/blocks/tip/height', 'Returns the current best-chain height as plain text.', '5400000'),
  endpoint('network', 'tip-hash', 'Get the tip hash', '/blocks/tip/hash', 'Returns the current best-chain block hash as plain text.', '0000000000000000000000000000000000000000000000000000000000000000'),
  endpoint('network', 'dogecoin-network', 'Get explorer network data', '/v1/doge/network', 'Returns the latest observed Dogecoin target block time, permanent subsidy, provider observation timestamps, and tip snapshot. Timestamps describe the source observation, not a guarantee of live network state.', '{\n  "targetBlockTime": 60,\n  "subsidy": 1000000000000,\n  "pendingSample": 50\n}'),
  { type: 'category', category: 'blocks', fragment: 'blocks', title: 'Blocks', showConditions: dogecoin },
  endpoint('blocks', 'block-height', 'Get a block hash by height', '/block-height/:height', 'Resolves a decimal block height to its canonical block hash.', '0000000000000000000000000000000000000000000000000000000000000000'),
  endpoint('blocks', 'block', 'Get a block', '/block/:hash', 'Returns indexed block data including height, timestamp, header fields, transaction count, fees when available, and reward. Recent strip data is cross-checked against raw Dogecoin block data before use; older detail availability depends on the historical provider.', '{\n  "id": "<hash>",\n  "height": 5400000,\n  "tx_count": 1,\n  "timestamp": 1710000000\n}'),
  endpoint('blocks', 'block-transactions', 'Get a block transaction page', '/block/:hash/txs/:start_index', 'Returns up to 25 indexed transactions from a block. The gateway rejects incomplete pages rather than silently returning partial data.', '[{ "txid": "<txid>", "fee": 100000000, "status": { "confirmed": true } }]'),
  endpoint('blocks', 'block-transaction-ids', 'Get all indexed transaction IDs', '/block/:hash/txids', 'Returns a complete transaction-ID list only when the provider can supply the whole block.', '["<txid>"]'),
  { type: 'category', category: 'transactions', fragment: 'transactions', title: 'Transactions', showConditions: dogecoin },
  endpoint('transactions', 'transaction', 'Get a transaction', '/tx/:txid', 'Returns a transaction with inputs, outputs, koinu values, and confirmation status. Amounts are in koinu; 100,000,000 koinu equals 1 DOGE.', '{\n  "txid": "<txid>",\n  "fee": 100000000,\n  "size": 225,\n  "status": { "confirmed": true }\n}'),
  endpoint('transactions', 'transaction-status', 'Get transaction status', '/tx/:txid/status', 'Returns only the confirmation status and, when known, the containing block.', '{ "confirmed": true, "block_height": 5400000, "block_hash": "<hash>" }'),
  endpoint('transactions', 'transaction-outspends', 'Get output spends', '/tx/:txid/outspends', 'Returns one entry per output describing whether it has been spent, when the historical provider has the data.', '[{ "spent": false }]'),
  endpoint('transactions', 'transaction-hex', 'Get raw transaction data', '/tx/:txid/hex', 'Returns a transaction serialized as hexadecimal when it remains available from the provider.', '<hex>'),
  { type: 'category', category: 'addresses', fragment: 'addresses', title: 'Addresses', showConditions: dogecoin },
  endpoint('addresses', 'address', 'Get address statistics', '/address/:address', 'Returns indexed funded, spent, and transaction totals for a standard Dogecoin address. The explorer does not provide wallet balances or private-key services.', '{ "address": "<address>", "chain_stats": { "tx_count": 4 } }'),
  endpoint('addresses', 'address-transactions', 'Get address transactions', '/address/:address/txs', 'Returns the current provider page of transactions for an address. Use the chain cursor endpoint to continue through confirmed history.', '[{ "txid": "<txid>", "status": { "confirmed": true } }]'),
  endpoint('addresses', 'address-history', 'Continue confirmed address history', '/address/:address/txs/chain/:last_seen_txid', 'Returns the next historical page before a confirmed transaction ID. Historical depth is limited by the upstream indexed provider.', '[{ "txid": "<older-txid>" }]'),
  endpoint('addresses', 'validate-address', 'Validate an address format', '/v1/validate-address/:address', 'Checks whether a value matches the gateway’s standard Dogecoin address format. This is format validation, not an ownership or balance check.', '{ "isvalid": true, "address": "<address>" }'),
  { type: 'category', category: 'fees', fragment: 'fees', title: 'Fees and pending sample', showConditions: dogecoin },
  endpoint('fees', 'recommended-fees', 'Get fee estimates', '/v1/fees/recommended', 'Returns source fee suggestions in koinu/B. They are observations from the configured provider and should be checked when creating a transaction.', '{ "fastestFee": 1000, "halfHourFee": 1000, "hourFee": 1000, "minimumFee": 1000 }'),
  endpoint('fees', 'pending-sample-rest', 'Get the bounded pending sample', '/v1/fees/mempool-blocks', 'Returns the explorer’s packed sample of recently observed pending transactions. It is capped at one million bytes and may be empty or stale during source outages; it is not a complete mempool view.', '[{ "blockSize": 500, "nTx": 2, "sampled": true }]'),
  endpoint('fees', 'recent-pending', 'Get recently observed pending transactions', '/mempool/recent', 'Returns the bounded recent pending observation used by the explorer. It does not enumerate every transaction relayed by the Dogecoin network.', '[{ "txid": "<txid>", "fee": 100000000, "vsize": 225 }]'),
];

export const faqData = [
  { type: 'category', category: 'about', fragment: 'about', title: 'Dogecoin basics', showConditions: dogecoin },
  { type: 'endpoint', category: 'about', fragment: 'dogecoin-units', title: 'What units does the explorer use?', showConditions: dogecoin },
  { type: 'endpoint', category: 'about', fragment: 'block-time', title: 'How quickly are blocks found?', showConditions: dogecoin },
  { type: 'endpoint', category: 'about', fragment: 'merged-mining', title: 'What is AuxPoW merged mining?', showConditions: dogecoin },
  { type: 'category', category: 'explorer', fragment: 'explorer', title: 'Using this explorer', showConditions: dogecoin },
  { type: 'endpoint', category: 'explorer', fragment: 'searching', title: 'What can I search for?', showConditions: dogecoin },
  { type: 'endpoint', category: 'explorer', fragment: 'pending-sample-faq', title: 'What does the pending strip represent?', showConditions: dogecoin },
  { type: 'endpoint', category: 'explorer', fragment: 'fee-estimates', title: 'How should I read fee estimates?', showConditions: dogecoin },
  { type: 'endpoint', category: 'explorer', fragment: 'historical-data', title: 'Why is historical data sometimes unavailable?', showConditions: dogecoin },
  { type: 'category', category: 'transactions', fragment: 'transactions', title: 'Transactions and confirmations', showConditions: dogecoin },
  { type: 'endpoint', category: 'transactions', fragment: 'unconfirmed', title: 'Why is my transaction still unconfirmed?', showConditions: dogecoin },
  { type: 'endpoint', category: 'transactions', fragment: 'not-custodial', title: 'Can this site change or recover a transaction?', showConditions: dogecoin },
];
