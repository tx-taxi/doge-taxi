'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {prune}=require('./cache-limits.cjs');
const queue=require('./provider-queue.cjs').createQueue();
const root=process.env.DOGE_BLOCKCHAIR_URL||'https://api.blockchair.com/dogecoin';
const key=process.env.DOGE_BLOCKCHAIR_KEY;
const allowed=()=>!process.env.DOGE_STATIC_ROOT&&process.env.NODE_ENV!=='production'||!!key||process.env.DOGE_BLOCKCHAIR_NONCOMMERCIAL==='1';
const dir=path.join(process.env.DOGE_DATA_DIR||path.join(__dirname,'../.local'),'blockchair');fs.mkdirSync(dir,{recursive:true});
const pruneCache=()=>prune(dir,{matches:name=>/^(?:enriched-)?[a-f0-9]{64}\.json$/.test(name)});pruneCache();
const stateFile=path.join(dir,'budget.json');let state={day:'',used:0,lanes:{},recent:[],cooldownUntil:0};try{state={...state,...JSON.parse(fs.readFileSync(stateFile))};}catch{}
const ceilings={collector:612,detail:224,history:64},daily=900;
const save=()=>{fs.writeFileSync(stateFile+'.tmp',JSON.stringify(state));fs.renameSync(stateFile+'.tmp',stateFile);};
function status(){const day=new Date().toISOString().slice(0,10);if(state.day!==day)state={...state,day,used:0,lanes:{},recent:[]};state.recent=state.recent.filter(t=>Date.now()-t<60000);return{allowed:allowed(),daily,used:state.used,lanes:state.lanes,ceilings,cooldownUntil:state.cooldownUntil};}
function claim(cost,lane){status();if(!allowed())throw Object.assign(new Error('Blockchair production requires a configured API key or explicit noncommercial eligibility'),{status:503});if(Date.now()<state.cooldownUntil||state.used+cost>daily+1e-8||(state.lanes[lane]||0)+cost>(ceilings[lane]||0)+1e-8||state.recent.length>=25)throw Object.assign(new Error('Provider request budget temporarily unavailable'),{status:503,localBudget:true});state.used+=cost;state.lanes[lane]=(state.lanes[lane]||0)+cost;state.recent.push(Date.now());save();}
const health={source:'blockchair',lastSuccess:null,lastFailure:null,requests:0};const inflight=new Map();let next=0;
async function request(p,{ttl=240000,cost=1,lane='detail'}={}){
 if(!p.startsWith('/')||/[?&]key=/.test(p))throw new Error('Invalid provider path');
 if(!allowed())throw Object.assign(new Error('Blockchair production requires a configured API key or explicit noncommercial eligibility'),{status:503});
 const file=path.join(dir,crypto.createHash('sha256').update(p).digest('hex')+'.json');
 try{const saved=JSON.parse(fs.readFileSync(file));const duration=typeof ttl==='function'?ttl(saved.data):ttl;if(Date.now()-saved.fetchedAt<duration)return saved.data;}catch{}
 if(inflight.has(p))return inflight.get(p);
 const run=queue.schedule(async()=>{
  await new Promise(r=>setTimeout(r,Math.max(0,next-Date.now())));claim(cost,lane);next=Date.now()+2500;
  const url=new URL(root+p);if(key)url.searchParams.set('key',key);
  const res=await fetch(url,{signal:AbortSignal.timeout(12000)});health.requests++;
  const raw=await res.text();let data;try{data=JSON.parse(raw,(k,v,c)=>typeof v==='number'&&Number.isInteger(v)&&!Number.isSafeInteger(v)?c.source:v);}catch{throw Object.assign(new Error('Provider returned invalid JSON'),{status:503});}
  if(!res.ok||data.context?.code!==200){if([402,429,430,434,503].includes(res.status)){state.cooldownUntil=Date.now()+Math.max(300000,Number(res.headers.get('retry-after')||0)*1000);save();}throw Object.assign(new Error('Blockchair request temporarily unavailable'),{status:res.status});}
  const actual=Number(data.context?.request_cost);if(Number.isFinite(actual)&&actual>cost){state.used+=actual-cost;state.lanes[lane]+=actual-cost;save();}
  const since=Date.parse((data.context?.cache?.since||'').replace(' ','T')+'Z');data.observedAt=Number.isFinite(since)?since:Date.now();
  fs.writeFileSync(file+'.tmp',JSON.stringify({fetchedAt:Date.now(),data}));fs.renameSync(file+'.tmp',file);pruneCache();health.lastSuccess=data.observedAt;return data;
 },lane);inflight.set(p,run);try{return await run;}catch(e){if(!e.localQueue&&!e.localBudget)health.lastFailure={at:Date.now(),message:e.message};throw e;}finally{inflight.delete(p);}
}
const timestamp=s=>Math.floor(Date.parse(s?.includes('T')?s:s+'Z')/1000);
function block(b){return{id:b.hash,height:b.id,version:b.version,timestamp:timestamp(b.time),tx_count:b.transaction_count,size:b.size,weight:b.size*4,merkle_root:b.merkle_root,nonce:b.nonce,bits:b.bits,difficulty:b.difficulty,extras:{totalFees:b.fee_total,avgFee:b.transaction_count>1?b.fee_total/(b.transaction_count-1):0,avgFeeRate:b.fee_per_kb/1000,medianFee:null,feeRange:[],reward:b.reward,pool:{id:0,name:'',slug:''},matchRate:null},doge:{isAuxPow:b.is_aux,sizeSource:'blockchair'}};}
async function blocks(heights,lane='detail') {const ids=heights.join(',');const d=await request('/dashboards/blocks/'+ids+'?limit=0',{ttl:240000,cost:1+.1*(heights.length-1),lane});return{blocks:heights.map(h=>{if(!d.data[String(h)]?.block)throw new Error('Provider block missing');return cachedEnrichment(block(d.data[String(h)].block));}),observedAt:d.observedAt};}
async function blockPage(id,offset=0,limit=25){const d=await request('/dashboards/block/'+id+'?limit='+limit+'&offset='+offset,{ttl:/^\d+$/.test(String(id))?30000:86400000,cost:1});const item=Object.values(d.data)[0];if(!item)throw Object.assign(new Error('Block not found'),{status:404});return item;}
const output=o=>({scriptpubkey:o.script_hex||'',scriptpubkey_asm:'',scriptpubkey_type:({pubkeyhash:'p2pkh',scripthash:'p2sh',pubkey:'p2pk',nulldata:'op_return'})[o.type]||'unknown',scriptpubkey_address:o.recipient||undefined,value:Number(o.value),valueExact:String(o.value)});
function transaction(item){const t=item.transaction;if(item.inputs.length!==t.input_count&&!t.is_coinbase||item.outputs.length!==t.output_count)throw new Error('Incomplete transaction inputs or outputs');return{txid:t.hash,version:t.version,locktime:t.lock_time,size:t.size,weight:t.size*4,fee:t.fee,status:{confirmed:t.block_id>=0,block_height:t.block_id>=0?t.block_id:undefined,block_time:t.block_id>=0?timestamp(t.time):undefined},vin:t.is_coinbase?[{txid:'0'.repeat(64),vout:4294967295,scriptsig:'',scriptsig_asm:'',is_coinbase:true,sequence:4294967295,prevout:null}]:item.inputs.map(i=>({txid:i.transaction_hash,vout:i.index,scriptsig:i.spending_signature_hex||'',scriptsig_asm:'',is_coinbase:false,sequence:i.spending_sequence,prevout:output(i)})),vout:item.outputs.map(output),doge:{value:t.output_total}};}
async function transactions(ids){const out=[];for(let i=0;i<ids.length;i+=10){const batch=ids.slice(i,i+10);const d=await request('/dashboards/transactions/'+batch.join(','),{ttl:data=>Object.values(data.data).every(x=>x.transaction.block_id>=0&&data.context.state-x.transaction.block_id>=6)?86400000:30000,cost:1+.1*(batch.length-1)});for(const id of batch){if(!d.data[id])throw new Error('Provider transaction missing');out.push(transaction(d.data[id]));}}return out;}
async function outspends(id){const d=await request('/dashboards/transaction/'+id,{ttl:30000,cost:1});const item=d.data[id];if(!item||item.outputs.length!==item.transaction.output_count)throw new Error('Incomplete transaction outputs');return item.outputs.map(o=>({spent:!!o.is_spent,txid:o.spending_transaction_hash||undefined,vin:o.spending_index??undefined,status:o.is_spent?{confirmed:o.spending_block_id>=0,block_height:o.spending_block_id>=0?o.spending_block_id:undefined}:undefined}));}
async function enrichBlock(item){
 const b=block(item.block),file=path.join(dir,'enriched-'+b.id+'.json');
 try{const saved=JSON.parse(fs.readFileSync(file));saved.extras.summaryAvailable=saved.tx_count<=100&&saved.extras.feeRange.length>0;return saved;}catch{}
 // Bound on-demand fee enrichment, never present a partial range as complete.
 if(b.tx_count<=100){
  const all=item.transactions.length===b.tx_count?item:await blockPage(b.id,0,100);
  if(all.transactions.length===b.tx_count){
   const txs=await transactions(all.transactions),paid=txs.filter(t=>!t.vin[0]?.is_coinbase);
   const rates=paid.map(t=>t.fee/t.size).sort((a,b)=>a-b);
   const sum=paid.reduce((n,t)=>n+t.fee,0);
   if(sum!==Number(b.extras.totalFees))throw new Error('Block fee index is incomplete');
   b.extras.summaryAvailable=true;
   if(rates.length){const mid=Math.floor(rates.length/2);b.extras.feeRange=[rates[0],rates.at(-1)];b.extras.medianFee=rates.length%2?rates[mid]:(rates[mid-1]+rates[mid])/2;}
   const coinbase=txs.find(t=>t.vin[0]?.is_coinbase);const payout=coinbase?.vout.filter(o=>o.scriptpubkey_address).sort((a,b)=>b.value-a.value)[0]?.scriptpubkey_address;
   if(payout)b.extras.pool.address=payout;
  }
 }
 const raw=await request('/raw/block/'+b.id,{ttl:86400000,cost:1});const decoded=Object.values(raw.data)[0]?.decoded_raw_block;
 if(decoded){b.previousblockhash=decoded.previousblockhash;b.size=decoded.size;b.weight=decoded.size*4;
  const marker=Buffer.from(decoded.auxpow?.tx?.vin?.[0]?.coinbase||'','hex').toString('utf8');
  const pools=[['AntPool','antpool'],['ViaBTC','viabtc'],['F2Pool','f2pool'],['Litecoinpool','litecoinpool'],['Poolin','poolin'],['Binance','binance'],['SpiderPool','spiderpool'],['Mining-Dutch','mining-dutch']];
  const matched=pools.find(([name])=>marker.toLowerCase().includes(name.toLowerCase()));if(matched)b.extras.pool={...b.extras.pool,name:matched[0],slug:matched[1]};
 }
 fs.writeFileSync(file+'.tmp',JSON.stringify(b));fs.renameSync(file+'.tmp',file);pruneCache();return b;
}
function cachedEnrichment(b){try{const saved=JSON.parse(fs.readFileSync(path.join(dir,'enriched-'+b.id+'.json')));return{...b,extras:saved.extras,previousblockhash:saved.previousblockhash};}catch{return b;}}
module.exports={enrichBlock,request,status,health,allowed,block,blocks,blockPage,transaction,transactions,outspends};
