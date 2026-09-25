'use strict';
// Public read-only Dogecoin mapping. Never turn unavailable capabilities into empty data.
const fs=require('node:fs'),path=require('node:path');
const cache=new Map(), inflight=new Map();
const root=process.env.DOGE_BLOCKCYPHER_URL||'https://api.blockcypher.com/v1/doge/main';
const token=process.env.BLOCKCYPHER_TOKEN;
const health={lastSuccess:null,lastFailure:null,source:'blockcypher',requests:0};
const disk=path.join(__dirname,'../.local/provider-cache');fs.mkdirSync(disk,{recursive:true});
const cooldownFile=path.join(disk,'../provider-cooldown.json');
let cooldownUntil=0;try{cooldownUntil=JSON.parse(fs.readFileSync(cooldownFile)).until;}catch{}
let queue=Promise.resolve(), next=0;
async function fetchJson(p,ttl=120000){
 const saved=cache.get(p);if(saved&&Date.now()-saved.at<ttl)return saved.data;
 const file=path.join(disk,Buffer.from(p).toString('base64url')+'.json');
 if(!saved){try{const d=JSON.parse(fs.readFileSync(file));cache.set(p,d);if(Date.now()-d.at<ttl)return d.data;}catch{}}
 if(inflight.has(p))return inflight.get(p);
 if(Date.now()<cooldownUntil)throw Object.assign(new Error('Provider rate limit: retry after '+new Date(cooldownUntil).toISOString()),{status:503});
 if(health.lastFailure && Date.now()-health.lastFailure.at<60000)throw new Error('Provider cooldown: '+health.lastFailure.message);
 const run=queue.catch(()=>{}).then(async()=>{
  if(Date.now()<cooldownUntil)throw Object.assign(new Error('Provider rate limit: retry after '+new Date(cooldownUntil).toISOString()),{status:503});
  await new Promise(r=>setTimeout(r,Math.max(0,next-Date.now())));next=Date.now()+1100;
  const u=new URL(root+p);if(token)u.searchParams.set('token',token);
  const res=await fetch(u,{signal:AbortSignal.timeout(9000)});health.requests++;
  const d=JSON.parse(await res.text(),(key,value,context)=>typeof value==='number'&&Number.isInteger(value)&&!Number.isSafeInteger(value)?context.source:value);if(!res.ok){if(res.status===429){cooldownUntil=Math.max((Math.floor(Date.now()/3600000)+1)*3600000,Date.now()+Number(res.headers.get('retry-after')||0)*1000);fs.writeFileSync(cooldownFile,JSON.stringify({until:cooldownUntil,status:429,path:p,at:Date.now()}));}throw Object.assign(new Error(d.error||`Provider HTTP ${res.status}`),{status:res.status});}
  const entry={data:d,at:Date.now()};cache.set(p,entry);fs.writeFileSync(file,JSON.stringify(entry));health.lastSuccess=Date.now();return d;
 });queue=run;inflight.set(p,run);
 try{return await run;}catch(e){health.lastFailure={at:Date.now(),path:p,status:e.status,message:e.message};throw e;}finally{inflight.delete(p);}
}
const timestamp=s=>Math.floor(Date.parse(s)/1000);
const scriptType=t=>({'pay-to-pubkey-hash':'p2pkh','pay-to-script-hash':'p2sh','pay-to-pubkey':'p2pk','null-data':'op_return'}[t]||'unknown');
function tx(t){return {txid:t.hash,version:t.ver,locktime:t.lock_time||0,size:t.size,weight:t.size*4,fee:t.fees,status:{confirmed:t.block_height>=0,block_height:t.block_height>=0?t.block_height:undefined,block_hash:t.block_hash,block_time:t.confirmed?timestamp(t.confirmed):undefined},vin:t.inputs.map(i=>({txid:i.prev_hash||'0'.repeat(64),vout:i.output_index,scriptsig:i.script||'',scriptsig_asm:'',is_coinbase:i.output_index===-1,sequence:i.sequence,prevout:i.output_index===-1?null:{scriptpubkey:'',scriptpubkey_asm:'',scriptpubkey_type:scriptType(i.script_type),scriptpubkey_address:i.addresses?.[0],value:Number(i.output_value),valueExact:String(i.output_value)}})),vout:t.outputs.map(o=>({scriptpubkey:o.script||'',scriptpubkey_asm:'',scriptpubkey_type:scriptType(o.script_type),scriptpubkey_address:o.addresses?.[0],value:Number(o.value),valueExact:String(o.value)})),doge:{value:t.total}};}
function block(b){const exponent=b.bits>>>24,mantissa=b.bits&0xffffff;const difficulty=0xffff*Math.pow(2,8*(0x1d-exponent))/mantissa;return {id:b.hash,height:b.height,version:b.ver,timestamp:timestamp(b.time),tx_count:b.n_tx,size:b.size,weight:b.size*4,merkle_root:b.mrkl_root,previousblockhash:b.prev_block,nonce:b.nonce,bits:b.bits,difficulty,extras:{totalFees:b.fees,avgFee:b.n_tx>1?b.fees/(b.n_tx-1):0,avgFeeRate:null,medianFee:null,feeRange:[],reward:b.height>=600000?10000e8+b.fees:null,pool:{id:0,name:'Unknown',slug:'unknown'},matchRate:null}};}
async function getBlock(id){return block(await fetchJson('/blocks/'+id+'?txstart=0&limit=500',id==='latest'?120000:86400000));}
async function getTx(id){return tx(await fetchJson('/txs/'+id+'?limit=10000',86400000));}
async function getAddress(id,before){return fetchJson('/addrs/'+id+'/full?limit=25&txlimit=10000'+(before?'&before='+before:''),120000);}
let latest=null, snapshotAt=0;
async function snapshot(){
 if(latest&&Date.now()-snapshotAt<120000)return latest;
 const tip=await fetchJson('');
 let blocks=latest?.blocks||[];
 if(!blocks.length){for(let n=0;n<6;n++)blocks.push(await getBlock(tip.height-n));}
 else if(blocks[0].height!==tip.height){const b=await getBlock(tip.height);blocks=[b,...blocks.filter(x=>x.height<b.height)].slice(0,8);}
 const pending=await fetchJson('/txs?limit=50');
 const txs=pending.map(tx);const fees={fastestFee:tip.high_fee_per_kb/1000,halfHourFee:tip.medium_fee_per_kb/1000,hourFee:tip.low_fee_per_kb/1000,economyFee:tip.low_fee_per_kb/1000,minimumFee:1000};
 latest={blocks,fees,transactions:txs.map(t=>({txid:t.txid,fee:t.fee,vsize:t.size,value:t.doge.value})),mempoolInfo:{loaded:true,size:tip.unconfirmed_count},backend:'esplora',loadingIndicators:{mempool:100},backendInfo:{gitCommit:'doge-candidate',version:'0.1'},doge:{targetBlockTime:60,subsidy:10000e8,pendingSample:txs.length,observedAt:Date.now(),tip},'mempool-blocks':[]};snapshotAt=Date.now();return latest;
}
async function route(p){let m;const pathname=p.split('?')[0];
 if(pathname==='/api/v1/prices')return require('./price.cjs').current();
 if(pathname==='/api/v1/historical-price'&&!new URL(p,'http://localhost').searchParams.has('timestamp')){const q=await require('./price.cjs').current();return {prices:[{time:Math.floor(q.fetchedAt/1000),USD:q.USD}],exchangeRates:{}};}
 if(pathname==='/api/v1/init-data')return snapshot();
 if(pathname==='/api/blocks/tip/height')return String((await fetchJson('')).height);
 if(pathname==='/api/blocks/tip/hash')return (await fetchJson('')).hash;
 if(m=pathname.match(/^\/api\/block-height\/(\d+)$/))return (await getBlock(m[1])).id;
 if(m=pathname.match(/^\/api\/(?:v1\/)?blocks(?:\/(\d+))?$/)){let h=m[1]?Number(m[1]):(await fetchJson('')).height;const out=[];for(let i=0;i<Math.min(10,h+1);i++)out.push(await getBlock(h-i));return out;}
 if(m=pathname.match(/^\/api\/(?:v1\/)?block\/([a-f0-9]{64}|\d+)(?:\/(txids|txs)(?:\/(\d+))?)?$/)){
  const b=await fetchJson('/blocks/'+m[1]+'?txstart=0&limit=500',86400000);
  if(m[2]==='txids')return b.txids;
  if(m[2]==='txs'){const ids=b.txids.slice(Number(m[3]||0),Number(m[3]||0)+25);const out=[];for(const id of ids)out.push(await getTx(id));return out;}
  return block(b);
 }
 if(pathname==='/api/txs/outspends'){const ids=new URL(p,'http://localhost').searchParams.get('txids')?.split(',')||[];return Promise.all(ids.map(id=>route('/api/tx/'+id+'/outspends')));}
 if(m=pathname.match(/^\/api\/tx\/([a-f0-9]{64})(?:\/(status|outspends|hex))?$/)){
  const t=await fetchJson('/txs/'+m[1]+'?limit=10000',86400000);
  if(m[2]==='status')return tx(t).status;
  if(m[2]==='outspends')return t.outputs.map(o=>({spent:!!o.spent_by,txid:o.spent_by}));
  if(m[2]==='hex')return (await fetchJson('/txs/'+m[1]+'?includeHex=true',86400000)).hex;
  return tx(t);
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
module.exports={route,snapshot,health,tx,block,cooldown:()=>cooldownUntil,liveObservedAt:()=>cache.get('')?.at||null};
