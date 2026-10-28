'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'doge-collector-reuse-'));process.env.DOGE_DATA_DIR=dir;
fs.mkdirSync(path.join(dir,'atomic'));fs.writeFileSync(path.join(dir,'atomic','budget.json'),JSON.stringify(Array.from({length:60},()=>({at:Date.now(),lane:'detail'}))));
const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'../review/doge/raw-block/block-6389384-indexed.json'))),raw=JSON.parse(fs.readFileSync(path.join(__dirname,'../review/doge/raw-block/block-6389384-raw.json')));
let requests=0;global.fetch=async url=>{requests++;return new Response(JSON.stringify(url.includes('/rawblock/')?raw:fixture));};
let atomic=require('./atomic.cjs');
test('verified collector data serves current block pages and transactions during exhausted detail budget without rereading or fetching',async()=>{
 await atomic.block(fixture.hash,'collector');const page=await atomic.blockPage(fixture.hash,true),tx=page.txs[1];assert.equal(page.txs.length,fixture.txCount);assert.equal(requests,2);assert.equal(atomic.status().detailUsed,60);
 const read=fs.readFileSync;fs.readFileSync=()=>{throw Error('unexpected synchronous file read')};try{assert.equal(await atomic.blockPage(fixture.hash,true),page);assert.deepEqual(atomic.collectedTransaction(tx.txid,[fixture.hash]),tx);assert.equal(atomic.collectedTransaction(tx.txid,[]),null);}finally{fs.readFileSync=read;}
 await assert.rejects(atomic.blockPage(fixture.hash,false),e=>e.localBudget===true);assert.equal(requests,2);
});
test('restart rehydrates only verified collector data; corrupted payload is not returned',async()=>{
 delete require.cache[require.resolve('./atomic.cjs')];atomic=require('./atomic.cjs');await atomic.block(fixture.hash,'collector');const page=await atomic.blockPage(fixture.hash,true);assert.equal(atomic.collectedTransaction(page.txs[1].txid,[fixture.hash]).txid,page.txs[1].txid);assert.equal(requests,2);
 const file=path.join(dir,'atomic','collector-'+fixture.hash+'.json'),saved=JSON.parse(fs.readFileSync(file));saved.block.txs[1].fees='1';fs.writeFileSync(file,JSON.stringify(saved));
 delete require.cache[require.resolve('./atomic.cjs')];atomic=require('./atomic.cjs');await atomic.block(fixture.hash,'collector');assert.equal(atomic.collectedTransaction(page.txs[1].txid,[fixture.hash]),null);await assert.rejects(atomic.blockPage(fixture.hash,true),e=>e.localBudget===true);
});
