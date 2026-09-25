'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const {parseBlock}=require('./doge-raw-block.cjs');
const fixture=name=>JSON.parse(readFileSync(join(__dirname,'../review/doge/raw-block',name)));
const hex=fixture('block-6389384-raw.json').hex;
const indexed=fixture('block-6389384-indexed.json');
test('real AuxPoW block matches independently indexed transactions and detailed transaction size',()=>{
  const block=parseBlock(hex),detail=fixture('transaction-detail.json');
  assert.equal(block.hash,indexed.hash);
  assert.equal(block.size,indexed.size);
  assert.deepEqual(block.transactions.map(t=>t.txid),indexed.txs.map(t=>t.txid));
  assert.equal(block.transactions.length,indexed.txCount);
  const tx=block.transactions.find(t=>t.txid===detail.txid);
  assert.equal(tx.size,detail.size);
  assert.equal(tx.size,detail.hex.length/2);
  assert.match(block.parentCoinbase,/\/F2Pool\//);
});
test('truncated headers, AuxPoW data and transactions are rejected',()=>{
  for(const length of[0,1,79,80,84,99,914,915,hex.length/2-1])assert.throws(()=>parseBlock(hex.slice(0,length*2)));
});
test('trailing bytes and transaction merkle corruption are rejected',()=>{
  assert.throws(()=>parseBlock(hex+'00'),/trailing bytes/);
  const corrupt=Buffer.from(hex,'hex');corrupt[36]^=1;
  assert.throws(()=>parseBlock(corrupt.toString('hex')),/merkle root mismatch/);
});
test('noncanonical and oversized AuxPoW input counts are rejected before allocation',()=>{
  // Input count follows the child header and parent coinbase transaction version.
  assert.equal(Buffer.from(hex,'hex')[84],1);
  assert.throws(()=>parseBlock(hex.slice(0,168)+'fd0100'+hex.slice(170)),/noncanonical/);
  assert.throws(()=>parseBlock(hex.slice(0,168)+'ffffffffffffffffff'+hex.slice(170)),/oversized/);
});
test('malformed hex and oversized block payloads are rejected',()=>{
  for(const invalid of[null,'0','zz',hex+'x'])assert.throws(()=>parseBlock(invalid),/Invalid/);
  assert.throws(()=>parseBlock('00'.repeat(4_000_001)),/Invalid/);
});
