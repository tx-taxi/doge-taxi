const assert=require('node:assert/strict'),http=require('node:http');
let probes=0; const dogePath='/home/lukee/dev/doge-taxi/adapter/dogecoin.cjs';
const until=Date.now()+600000;
require.cache[require.resolve(dogePath)]={id:dogePath,filename:dogePath,loaded:true,exports:{health:{requests:0},budget:()=>({used:0}),cooldown:()=>until,liveObservedAt:()=>null,route:()=>{probes++;throw new Error('Unexpected provider probe');}}};
global.fetch=()=>{probes++;throw new Error('Unexpected outbound fetch');};
process.env.PORT='4398';require('/home/lukee/dev/doge-taxi/adapter/server.cjs');
setTimeout(async()=>{try {const results=[];for(let i=0;i<3;i++)results.push(await new Promise((resolve,reject)=>http.get('http://127.0.0.1:4398/healthz',r=>{let s='';r.on('data',d=>s+=d);r.on('end',()=>resolve({status:r.statusCode,body:JSON.parse(s)}));}).on('error',reject)));assert.equal(probes,0);for(const r of results){assert.equal(r.status,200);assert.equal(r.body.degraded,true);assert.equal(r.body.stale,true);assert.equal(r.body.cooldownUntil,until);}console.log(JSON.stringify({case:'Persisted cooldown health consistency without upstream probe',probes,results},null,2));process.exit(0);}catch(e){console.error(e);process.exit(1);}},100);
