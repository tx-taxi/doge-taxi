const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
test('deep block windows survive repeated milestone visits while recent windows refresh',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'doge-history-'));
 process.env.DOGE_DATA_DIR=dir;process.env.DOGE_BLOCKCHAIR_NONCOMMERCIAL='1';
 const originalFetch=global.fetch,originalNow=Date.now;let now=originalNow(),calls=0;
 Date.now=()=>now;
 global.fetch=async url=>{calls++;const heights=new URL(url).pathname.split('/').at(-1).split(',').map(Number);return new Response(JSON.stringify({context:{code:200,state:6400000},data:Object.fromEntries(heights.map(h=>[h,{block:{id:h,hash:h.toString(16).padStart(64,'0'),time:'2020-01-01 00:00:00',transaction_count:1,size:100,fee_total:0,reward:1000000000000}}]))}),{status:200});};
 try{
  const chair=require('./blockchair.cjs');
  assert.equal((await chair.blocks([1000000])).blocks[0].height,1000000);
  now+=300000;await chair.blocks([1000000]);assert.equal(calls,1);
  await chair.blocks([6400000]);assert.equal(calls,2);
  now+=300000;await chair.blocks([6400000]);assert.equal(calls,3);
 }finally{global.fetch=originalFetch;Date.now=originalNow;fs.rmSync(dir,{recursive:true,force:true});}
});
