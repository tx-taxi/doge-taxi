'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fixture=require('./fixtures/blockbook-transaction.json');
const {transaction}=require('./blockbook-transaction.cjs');
test('confirmed Blockbook transaction preserves exact public fields and reconciles raw identity, outputs and fees',()=>{
 const t=transaction(fixture,fixture.txid);assert.equal(t.fee,11504530);assert.equal(t.status.block_height,6434366);assert.equal(t.vout[0].value,11128564041);assert.equal(t.vin[0].prevout.value,15340558767);
 const bad=structuredClone(fixture);bad.vout[0].value='11128564042';assert.throws(()=>transaction(bad,bad.txid),/output mismatch/);
 const fee=structuredClone(fixture);fee.fees='1';assert.throws(()=>transaction(fee,fee.txid),/reconcile/);
 assert.throws(()=>transaction(fixture,'0'.repeat(64)),/identity/);
});
test('Blockbook omits a zero previous-output index, but other omitted indices cannot pass raw-byte verification',()=>{
 const raw=require('./legacy-transaction.cjs').decode(fixture.hex),copy=structuredClone(fixture);
 const index=raw.vin.findIndex(v=>v.vout!==0);delete copy.vin[index].vout;assert.throws(()=>transaction(copy,copy.txid),/input mismatch/);
});
