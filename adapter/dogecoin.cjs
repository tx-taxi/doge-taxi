'use strict';
// Public read-only Dogecoin mapping. Never turn unavailable capabilities into empty data.
const fs=require('node:fs'),path=require('node:path');
const cache=new Map(), inflight=new Map();
const chair=require('./blockchair.cjs');
const {prune,setBounded}=require('./cache-limits.cjs');
const queue=require('./provider-queue.cjs').createQueue();
const root=process.env.DOGE_BLOCKCYPHER_URL||'https://api.blockcypher.com/v1/doge/main';
const token=process.env.BLOCKCYPHER_TOKEN;
const health={lastSuccess:null,lastFailure:null,source:'blockcypher+blockchair',requests:0};
const dataDir=process.env.DOGE_DATA_DIR||path.join(__dirname,'../.local');
const disk=path.join(dataDir,'provider-cache');fs.mkdirSync(disk,{recursive:true});
const pruneCache=()=>prune(disk,{matches:name=>/^[A-Za-z0-9_-]+\.json$/.test(name)});pruneCache();
const cooldownFile=path.join(disk,'../provider-cooldown.json');
let cooldownUntil=0;try{cooldownUntil=JSON.parse(fs.readFileSync(cooldownFile)).until;}catch{}
const budget=require('./request-budget.cjs').createBudget(path.join(dataDir,'request-budget.json'),{collector:36,detail:54});
const refreshInterval=240000;
let next=0;
async function fetchJson(p,ttl=120000,lane='detail'){
 const fresh=entry=>entry&&Date.now()-entry.at<(typeof ttl==='function'?ttl(entry.data):ttl);
 const saved=cache.get(p);if(fresh(saved))return saved.data;
 const file=path.join(disk,Buffer.from(p).toString('base64url')+'.json');
 if(!saved){try{const d=JSON.parse(fs.readFileSync(file));setBounded(cache,p,d);if(fresh(d))return d.data;}catch{}}
 if(inflight.has(p))return inflight.get(p);
 if(Date.now()<cooldownUntil)throw Object.assign(new Error('Provider rate limit: retry after '+new Date(cooldownUntil).toISOString()),{status:503});
 if(health.lastFailure && Date.now()-health.lastFailure.at<60000)throw new Error('Provider cooldown: '+health.lastFailure.message);
 const run=queue.schedule(async()=>{
  if(Date.now()<cooldownUntil)throw Object.assign(new Error('Provider rate limit: retry after '+new Date(cooldownUntil).toISOString()),{status:503});
  await new Promise(r=>setTimeout(r,Math.max(0,next-Date.now())));budget.claim(lane);next=Date.now()+1100;
  const u=new URL(root+p);if(token)u.searchParams.set('token',token);
  const res=await fetch(u,{signal:AbortSignal.timeout(9000)});health.requests++;
  const d=JSON.parse(await res.text(),(key,value,context)=>typeof value==='number'&&Number.isInteger(value)&&!Number.isSafeInteger(value)?context.source:value);if(!res.ok){if(res.status===429){cooldownUntil=Math.max((Math.floor(Date.now()/3600000)+1)*3600000,Date.now()+Number(res.headers.get('retry-after')||0)*1000);fs.writeFileSync(cooldownFile,JSON.stringify({until:cooldownUntil,status:429,path:p,at:Date.now()}));}throw Object.assign(new Error(d.error||`Provider HTTP ${res.status}`),{status:res.status});}
  const entry={data:d,at:Date.now()};setBounded(cache,p,entry);fs.writeFileSync(file,JSON.stringify(entry));pruneCache();health.lastSuccess=Date.now();return d;
 },lane);inflight.set(p,run);
 try{return await run;}catch(e){if(!e.localBudget&&!e.localQueue)health.lastFailure={at:Date.now(),path:p,status:e.status,message:e.message};throw e;}finally{inflight.delete(p);}
}
const timestamp=s=>Math.floor(Date.parse(s)/1000);
function knownBlockTime(hash){const inStrip=latest?.blocks.find(b=>b.id===hash);if(inStrip)return inStrip.timestamp;for(const e of cache.values())if(e.data.hash===hash&&e.data.height!==undefined&&e.data.time)return timestamp(e.data.time);return undefined;}
const scriptType=t=>({'pay-to-pubkey-hash':'p2pkh','pay-to-script-hash':'p2sh','pay-to-pubkey':'p2pk','null-data':'op_return'}[t]||'unknown');
function tx(t){if(!Array.isArray(t.inputs)||!Array.isArray(t.outputs)||t.inputs.length!==t.vin_sz||t.outputs.length!==t.vout_sz)throw Object.assign(new Error('Incomplete transaction inputs or outputs'),{status:503});return {txid:t.hash,version:t.ver,locktime:t.lock_time||0,size:t.size,weight:t.size*4,fee:t.fees,status:{confirmed:t.block_height>=0,block_height:t.block_height>=0?t.block_height:undefined,block_hash:t.block_hash,block_time:t.block_height>=0?knownBlockTime(t.block_hash):undefined},vin:t.inputs.map(i=>({txid:i.prev_hash||'0'.repeat(64),vout:i.output_index,scriptsig:i.script||'',scriptsig_asm:'',is_coinbase:i.output_index===-1,sequence:i.sequence,prevout:i.output_index===-1?null:{scriptpubkey:'',scriptpubkey_asm:'',scriptpubkey_type:scriptType(i.script_type),scriptpubkey_address:i.addresses?.[0],value:Number(i.output_value),valueExact:String(i.output_value)}})),vout:t.outputs.map(o=>({scriptpubkey:o.script||'',scriptpubkey_asm:'',scriptpubkey_type:scriptType(o.script_type),scriptpubkey_address:o.addresses?.[0],value:Number(o.value),valueExact:String(o.value)})),doge:{value:t.total}};}
function block(b){const exponent=b.bits>>>24,mantissa=b.bits&0xffffff;const difficulty=0xffff*Math.pow(2,8*(0x1d-exponent))/mantissa;return {id:b.hash,height:b.height,version:b.ver,timestamp:timestamp(b.time),tx_count:b.n_tx,size:b.size,weight:b.size*4,merkle_root:b.mrkl_root,previousblockhash:b.prev_block,nonce:b.nonce,bits:b.bits,difficulty,extras:{totalFees:b.fees,avgFee:b.n_tx>1?b.fees/(b.n_tx-1):0,avgFeeRate:null,medianFee:null,feeRange:[],reward:b.height>=600000?10000e8+b.fees:null,pool:{id:0,name:'Unknown',slug:'unknown'},matchRate:null}};}
async function getBlock(id,lane='detail'){
 try{return chair.block((await chair.blockPage(id)).block);}catch(e){if(!chair.allowed())throw e;return block(await fetchJson('/blocks/'+id+'?txstart=0&limit=500',/^\d+$/.test(String(id))?30000:86400000,lane));}
}
// Pending/recent transactions must be observed again to discover confirmation or reorg.
const transactionTTL=t=>t.block_height>=0&&t.confirmations>=6?86400000:30000;
async function getTx(id){try{return (await chair.transactions([id]))[0];}catch(e){if(!chair.allowed())throw e;return tx(await fetchJson('/txs/'+id+'?limit=10000',transactionTTL));}}
async function getAddress(id,before){return fetchJson('/addrs/'+id+'/full?limit=25&txlimit=10000'+(before?'&before='+before:''),120000);}
let latest=null, snapshotAt=0;
const snapshotFile=path.join(dataDir,'live-snapshot.json');
try{const saved=JSON.parse(fs.readFileSync(snapshotFile));if(saved.schema===3&&Array.isArray(saved.data?.blocks)&&saved.data.blocks.length===8){latest=saved.data;snapshotAt=saved.at;}}catch{}
const observationsFile=path.join(disk,'../pending-observations.json');
let observations={at:0,ids:[],points:[]};try{observations=JSON.parse(fs.readFileSync(observationsFile));}catch{}
function recordPending(txs,at){
 if(!at||at<=observations.at)return;
 const elapsed=(at-observations.at)/1000, previous=new Set(observations.ids);
 // A provider outage is a gap, never an invented zero or a rate across an unknown interval.
 if(elapsed>refreshInterval*2/1000&&observations.points.length) observations.points.push({added:Math.floor(at/1000),vbytes_per_second:null});
 if(elapsed>=60&&elapsed<=refreshInterval*2/1000){const bytes=txs.filter(t=>!previous.has(t.txid)).reduce((n,t)=>n+t.size,0);observations.points.push({added:Math.floor(at/1000),vbytes_per_second:bytes/elapsed});}
 observations={at,ids:txs.map(t=>t.txid),points:observations.points.filter(p=>p.added>at/1000-7200).slice(-120)};
 fs.writeFileSync(observationsFile,JSON.stringify(observations));
}
let snapshotInFlight;
async function snapshot(){
 if(snapshotInFlight)return snapshotInFlight;
 snapshotInFlight=collectSnapshot();try{return await snapshotInFlight;}finally{snapshotInFlight=null;}
}
async function collectSnapshot(){
 if(!chair.allowed())throw Object.assign(new Error('Production provider configuration required'),{status:503});
 if(Date.now()<cooldownUntil)throw Object.assign(new Error('Temporarily unavailable'),{status:503});
 if(latest&&Date.now()-snapshotAt<refreshInterval)return latest;
 if(!chair.allowed())throw Object.assign(new Error('Production provider configuration required'),{status:503});
 const collectionStarted=Date.now();
 const tip=await fetchJson('',refreshInterval,'collector');
 const heights=Array.from({length:Math.min(8,tip.height+1)},(_,i)=>tip.height-i);
 let blocks,blocksObservedAt;
 const strip=await chair.blocks(heights,'collector');blocks=strip.blocks;blocksObservedAt=strip.observedAt;
 // A complete contiguous strip is mandatory; no sampled/skipped heights.
 if(blocks[0].id!==tip.hash)throw new Error('Providers disagree on canonical tip');
 blocks[0].previousblockhash=tip.previous_hash;
 const pending=await fetchJson('/txs?limit=50',refreshInterval,'collector');
 const txs=pending.map(t=>({txid:t.hash,size:t.size,fee:t.fees,doge:{value:t.total}}));recordPending(txs,cache.get('/txs?limit=50')?.at);const fees={fastestFee:tip.high_fee_per_kb/1000,halfHourFee:tip.medium_fee_per_kb/1000,hourFee:tip.low_fee_per_kb/1000,economyFee:tip.low_fee_per_kb/1000,minimumFee:1000};
 const ordered=[...txs].sort((a,b)=>b.fee/b.size-a.fee/a.size),packed=[];let sampleBytes=0;for(const t of ordered){if(sampleBytes+t.size<=1000000){packed.push(t);sampleBytes+=t.size;}}
 const rates=packed.map(t=>t.fee/t.size).sort((a,b)=>a-b);const middle=Math.floor(rates.length/2);
 const projection=packed.length?[{blockSize:sampleBytes,blockVSize:sampleBytes,nTx:packed.length,totalFees:packed.reduce((n,t)=>n+t.fee,0),medianFee:rates.length%2?rates[middle]:(rates[middle-1]+rates[middle])/2,feeRange:[rates[0],rates.at(-1)],transactionIds:packed.map(t=>t.txid),sampled:true}]:[];
 latest={da:{adjustedTimeAvg:60000,timeOffset:0},'live-2h-chart':observations.points.at(-1),blocks,fees,transactions:txs.map(t=>({txid:t.txid,fee:t.fee,vsize:t.size,value:t.doge.value})),mempoolInfo:{loaded:true,size:tip.unconfirmed_count},backend:'esplora',loadingIndicators:{mempool:100},backendInfo:{gitCommit:'doge-candidate',version:'0.1'},doge:{targetBlockTime:60,subsidy:10000e8,pendingSample:txs.length,observedAt:Math.min(cache.get('')?.at||collectionStarted,blocksObservedAt),tip},'mempool-blocks':projection};snapshotAt=collectionStarted;fs.writeFileSync(snapshotFile,JSON.stringify({schema:3,at:snapshotAt,data:latest}));return latest;
}
async function route(p){let m;const pathname=p.split('?')[0];
 if(/^\/api\/v1\/mining\/hashrate(?:\/1m)?$/.test(pathname))return require('./mining.cjs').history();
 if(pathname==='/api/v1/prices')return require('./price.cjs').current();
 if(pathname==='/api/v1/historical-price'&&!new URL(p,'http://localhost').searchParams.has('timestamp')){const q=await require('./price.cjs').current();return {prices:[{time:Math.floor(q.fetchedAt/1000),USD:q.USD}],exchangeRates:{}};}
 if(pathname==='/api/v1/statistics/2h')return observations.points.filter(p=>p.added>Date.now()/1000-7200).slice().reverse();
 if(pathname==='/api/v1/init-data')return snapshot();
 if(pathname==='/api/blocks/tip/height')return String((await fetchJson('',refreshInterval,'collector')).height);
 if(pathname==='/api/blocks/tip/hash')return (await fetchJson('',refreshInterval,'collector')).hash;
 if(m=pathname.match(/^\/api\/block-height\/(\d+)$/))return (await getBlock(m[1])).id;
 if(m=pathname.match(/^\/api\/(?:v1\/)?blocks(?:\/(\d+))?$/)){if(!m[1])return (await snapshot()).blocks;const h=Number(m[1]);return(await chair.blocks(Array.from({length:Math.min(10,h+1)},(_,i)=>h-i))).blocks;}
 if(m=pathname.match(/^\/api\/(?:v1\/)?block\/([a-f0-9]{64}|\d+)(?:\/(txids|txs)(?:\/(\d+))?)?$/)){
  const item=await chair.blockPage(m[1],Number(m[3]||0),m[2]==='txids'?10000:25);
  if(m[2]==='txids'){if(item.transactions.length!==item.block.transaction_count)throw new Error('Complete block transaction list unavailable');return item.transactions;}
  if(m[2]==='txs'){const expected=Math.max(0,Math.min(25,item.block.transaction_count-Number(m[3]||0)));if(item.transactions.length!==expected)throw new Error('Incomplete block transaction page');const txs=await chair.transactions(item.transactions);return txs.map(t=>({...t,status:{...t.status,block_hash:item.block.hash}}));}
  try{return await chair.enrichBlock(item);}catch(e){if(!chair.allowed())throw e;return chair.block(item.block);}
 }
 if(pathname==='/api/txs/outspends'){const ids=new URL(p,'http://localhost').searchParams.get('txids')?.split(',')||[];return Promise.all(ids.map(id=>route('/api/tx/'+id+'/outspends')));}
 if(m=pathname.match(/^\/api\/tx\/([a-f0-9]{64})(?:\/(status|outspends|hex))?$/)){
  if(m[2]==='outspends')return chair.outspends(m[1]);
  if(m[2]==='hex')return(await fetchJson('/txs/'+m[1]+'?includeHex=true',transactionTTL)).hex;
  const t=await getTx(m[1]);if(t.status.confirmed&&(!t.status.block_hash||!t.status.block_time)){const header=await getBlock(t.status.block_height);t.status.block_hash=header.id;t.status.block_time=header.timestamp;}
  return m[2]==='status'?t.status:t;
 }
 if(m=pathname.match(/^\/api\/address\/([A-Za-z0-9]+)(?:\/txs(?:\/chain(?:\/([a-f0-9]{64}))?)?)?$/)){
  let before;if(m[2])before=(await getTx(m[2])).status.block_height;
  const a=await getAddress(m[1],before);
  if(pathname.includes('/txs'))return a.txs.map(tx);
  return {address:a.address,chain_stats:{funded_txo_sum:Number(a.total_received),funded_txo_sum_exact:String(a.total_received),spent_txo_sum:Number(a.total_sent),spent_txo_sum_exact:String(a.total_sent),tx_count:a.n_tx},mempool_stats:{tx_count:a.unconfirmed_n_tx,funded_txo_sum:Math.max(0,a.unconfirmed_balance),spent_txo_sum:Math.max(0,-a.unconfirmed_balance)}};
 }
 if(pathname==='/api/v1/fees/recommended')return (await snapshot()).fees;
 if(pathname==='/api/mempool/recent')return (await snapshot()).transactions;
 if(pathname==='/api/v1/fees/mempool-blocks')return (await snapshot())['mempool-blocks'];
 if(m=pathname.match(/^\/api\/v1\/validate-address\/(.+)$/)){return {isvalid:/^[DA9][1-9A-HJ-NP-Za-km-z]{25,34}$/.test(m[1]),address:m[1]};}
 if(pathname==='/api/v1/doge/network')return (await snapshot()).doge;
 throw Object.assign(new Error('Required provider capability unavailable: '+pathname),{status:503});
}
module.exports={route,snapshot,health,tx,block,refreshInterval,budget:()=>({blockcypher:budget.status(),blockchair:chair.status()}),cooldown:()=>cooldownUntil,liveObservedAt:()=>latest?.doge?.observedAt||null};
