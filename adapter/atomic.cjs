'use strict';
// Shared Blockbook collector: two requests per new block, never per viewer.
const fs=require('node:fs'),path=require('node:path');
const {prune}=require('./cache-limits.cjs');
const dir=path.join(process.env.DOGE_DATA_DIR||path.join(__dirname,'../.local'),'atomic');fs.mkdirSync(dir,{recursive:true});
const root=process.env.DOGE_ATOMIC_URL||'https://dogecoin.atomicwallet.io/api/v2';
const budget=require('./request-budget.cjs').createBudget(path.join(dir,'budget.json'),{hourly:240,collector:240,detail:60});
const queue=require('./provider-queue.cjs').createQueue();
const cooldownFile=path.join(dir,'cooldown.json');let cooldown=0;try{cooldown=JSON.parse(fs.readFileSync(cooldownFile)).until;}catch{}
let next=0;const health={source:'atomicwallet-blockbook',lastSuccess:null,lastFailure:null};
async function request(p,lane='collector'){return queue.schedule(async()=>{
 if(Date.now()<cooldown)throw new Error('AtomicWallet provider cooling down');
 await new Promise(r=>setTimeout(r,Math.max(0,next-Date.now())));budget.claim(lane);next=Date.now()+1100;
 try{
  const r=await fetch(root+p,{signal:AbortSignal.timeout(12000)});
  if(!r.ok){if([403,429,503].includes(r.status)){cooldown=Date.now()+Math.max(300000,Number(r.headers.get('retry-after')||0)*1000);fs.writeFileSync(cooldownFile,JSON.stringify({until:cooldown}));}const body=await r.text();let error;try{error=JSON.parse(body).error}catch{};const missing=r.status===400&&/^Transaction '[a-f0-9]{64}' not found$/.test(error||'');throw Object.assign(new Error(missing?'Transaction not found':'AtomicWallet HTTP '+r.status),{status:missing?404:r.status});}
  const text=await r.text();if(text.length>12000000)throw new Error('Provider response exceeds bound');const d=JSON.parse(text);if(d.error)throw new Error('AtomicWallet data unavailable');health.lastSuccess=Date.now();return d;
 }catch(e){if(e.status!==404)health.lastFailure={at:Date.now(),message:e.message};throw e;}
 },lane);}
const pools=[['AntPool','antpool'],['ViaBTC','viabtc'],['F2Pool','f2pool'],['Litecoinpool','litecoinpool'],['Poolin','poolin'],['Binance','binance'],['SpiderPool','spiderpool'],['Mining-Dutch','mining-dutch']];
function verifiedBlock(b,raw){
 const parsed=require('./doge-raw-block.cjs').parseBlock(raw.hex);
 if(parsed.hash!==b.hash||parsed.transactions.length!==b.txCount||b.txs.length!==b.txCount||raw.hex.length/2!==b.size)throw new Error('Incomplete or mismatched block data');
 let sum=0n;const rates=[];
 for(let i=0;i<b.txs.length;i++){
  const t=b.txs[i],p=parsed.transactions[i];if(t.txid!==p.txid||!p.size)throw new Error('Block transaction identity mismatch');
  if(i===0)continue;
  const fee=BigInt(t.fees);if(fee<0n||BigInt(t.valueIn)-BigInt(t.value)!==fee||fee>BigInt(Number.MAX_SAFE_INTEGER))throw new Error('Invalid transaction fee');sum+=fee;rates.push(Number(fee)/p.size);
 }
 const reward=BigInt(b.txs[0].value);if(reward!==1000000000000n+sum||sum>BigInt(Number.MAX_SAFE_INTEGER))throw new Error('Coinbase reward does not reconcile with fees');
 rates.sort((a,b)=>a-b);const mid=Math.floor(rates.length/2),median=rates.length?(rates.length%2?rates[mid]:(rates[mid-1]+rates[mid])/2):0;
 const payout=b.txs[0].vout.filter(o=>o.isAddress&&o.addresses?.length===1).sort((a,b)=>BigInt(a.value)>BigInt(b.value)?-1:1)[0]?.addresses[0];
 const marker=parsed.parentCoinbase||'';const match=pools.find(([name])=>marker.toLowerCase().includes(name.toLowerCase()));
 return {id:b.hash,height:b.height,version:b.version,timestamp:b.time,tx_count:b.txCount,size:b.size,weight:b.size*4,merkle_root:b.merkleRoot,previousblockhash:b.previousBlockHash,nonce:Number(b.nonce),bits:parseInt(b.bits,16),difficulty:Number(b.difficulty),extras:{summaryAvailable:b.txCount<=500,totalFees:Number(sum),avgFee:rates.length?Number(sum)/rates.length:0,medianFee:median,feeRange:rates.length?[rates[0],rates.at(-1)]:[0,0],reward:Number(reward),pool:{id:0,name:match?.[0]||'',slug:match?.[1]||'',...(payout?{address:payout}:{})},matchRate:null},doge:{isAuxPow:true,sizeSource:'raw-block',feeSource:'atomicwallet-index+verified-raw-block'}};
}
function cached(hash){try{const saved=JSON.parse(fs.readFileSync(path.join(dir,hash+'.json')));saved.extras.summaryAvailable=saved.tx_count<=500;return saved;}catch{return null;}}
async function block(id,lane='collector'){
 if(/^[a-f0-9]{64}$/.test(String(id))){const saved=cached(id);if(saved)return saved;}
 const b=await request('/block/'+id+'?pageSize=1000',lane);
 if(!/^[a-f0-9]{64}$/.test(b.hash)||!Number.isInteger(b.txCount)||b.txCount<1||b.txCount>10000)throw new Error('Invalid block envelope');
 const saved=cached(b.hash);if(saved)return saved;
 const pages=b.totalPages||1;if(pages>10)throw new Error('Block pagination exceeds bound');
 for(let page=2;page<=pages;page++){const part=await request('/block/'+b.hash+'?pageSize=1000&page='+page,lane);if(part.hash!==b.hash||part.txCount!==b.txCount)throw new Error('Block pagination changed');b.txs.push(...part.txs);}
 const out=verifiedBlock(b,await request('/rawblock/'+b.hash,lane));
 fs.writeFileSync(path.join(dir,b.hash+'.json'),JSON.stringify(out));prune(dir,{matches:name=>/^[a-f0-9]{64}\.json$/.test(name)});return out;
}
async function strip(){
 const s=await request('');const observedAt=Date.now();
 if(!s.blockbook?.inSync||s.blockbook.initialSync||s.backend?.chain!=='main'||!Number.isInteger(s.backend.blocks)||!/^[a-f0-9]{64}$/.test(s.backend.bestBlockHash))throw new Error('Dogecoin index is not synchronized');
 const blocks=[];let hash=s.backend.bestBlockHash;
 for(let i=0;i<8;i++){const b=await block(hash);if(b.id!==hash||b.height!==s.backend.blocks-i)throw new Error('Noncontiguous canonical strip');blocks.push(b);hash=b.previousblockhash;}
 health.lastSuccess=observedAt;return {blocks,observedAt};
}
const transactionInflight=new Map();
async function transaction(id){
 const file=path.join(dir,'tx-'+id+'.json');
 try{const saved=JSON.parse(fs.readFileSync(file));const ttl=saved.confirmations>=6?86400000:15000;if(Date.now()-saved.at<ttl)return saved.data;}catch{}
 if(transactionInflight.has(id))return transactionInflight.get(id);
 const work=(async()=>{const raw=await request('/tx/'+id,'detail');const data=require('./blockbook-transaction.cjs').transaction(raw,id);fs.writeFileSync(file,JSON.stringify({at:Date.now(),confirmations:raw.confirmations,data}));prune(dir,{matches:name=>/^(?:tx-)?[a-f0-9]{64}\.json$/.test(name)});return data;})();transactionInflight.set(id,work);
 try{return await work;}finally{transactionInflight.delete(id);}
}
module.exports={strip,cached,verifiedBlock,block,transaction,health,status:()=>({...budget.status(),cooldownUntil:cooldown})};

const detailInflight=new Map();
async function detail(p,ttl=30000){
 const key=require('node:crypto').createHash('sha256').update(p).digest('hex'),file=path.join(dir,'detail-'+key+'.json');
 try{const saved=JSON.parse(fs.readFileSync(file));if(Date.now()-saved.at<ttl)return saved.data;}catch{}
 if(detailInflight.has(p))return detailInflight.get(p);
 const work=request(p,'detail').then(data=>{fs.writeFileSync(file,JSON.stringify({at:Date.now(),data}));prune(dir,{matches:name=>/^(?:tx-|detail-)?[a-f0-9]{64}\.json$/.test(name)});return data;}).finally(()=>detailInflight.delete(p));detailInflight.set(p,work);return work;
}
async function rawTransaction(id,spending=false){const raw=await detail('/tx/'+id+(spending?'?spending=true':''),15000);require('./blockbook-transaction.cjs').transaction(raw,id);return raw;}
const addressCursors=new Map();
async function address(id,cursor,history=false){
 const first=cursor?(addressCursors.get(id+':'+cursor)||1):1;let rows=[],a;
 for(let page=first;page<=first+1;page++){
  a=await detail('/address/'+id+'?details=txs&pageSize=25&page='+page,30000);if(a.address!==id||!Array.isArray(a.transactions))throw Error('Incomplete address data');
  rows.push(...a.transactions.map(t=>require('./blockbook-transaction.cjs').transaction(t,t.txid)));
  const offset=cursor?rows.findIndex(t=>t.txid===cursor)+1:0;
  if(!cursor||offset>0){const selected=rows.slice(offset,offset+25);if(selected.length>=25||page>=a.totalPages){if(selected.length){addressCursors.set(id+':'+selected.at(-1).txid,page);while(addressCursors.size>500)addressCursors.delete(addressCursors.keys().next().value);}if(history)return selected;break;}}
  if(page>=a.totalPages)break;
 }
 if(history)throw Object.assign(Error('Address history changed; reload the first page'),{status:503});
 const received=BigInt(a.totalReceived),sent=BigInt(a.totalSent),unconfirmed=BigInt(a.unconfirmedBalance??'0');if([received,sent,unconfirmed<0n?-unconfirmed:unconfirmed].some(v=>v<0n||v>BigInt(Number.MAX_SAFE_INTEGER)))throw Error('Address values exceed safe display precision');
 return{address:id,chain_stats:{funded_txo_sum:Number(received),funded_txo_sum_exact:String(received),spent_txo_sum:Number(sent),spent_txo_sum_exact:String(sent),tx_count:a.txs},mempool_stats:{tx_count:a.unconfirmedTxs||0,funded_txo_sum:Number(unconfirmed>0n?unconfirmed:0n),spent_txo_sum:Number(unconfirmed<0n?-unconfirmed:0n)}};
}
module.exports.rawTransaction=rawTransaction;module.exports.address=address;

async function blockPage(id){
 const b=await detail('/block/'+id+'?pageSize=1000',60000);if(!Number.isInteger(b.txCount)||b.txCount<1||b.txCount>10000||(/^\d+$/.test(String(id))?b.height!==Number(id):b.hash!==id))throw Error('Block identity mismatch');
 const txs=[...b.txs];for(let page=2;page<=b.totalPages;page++){if(page>10)throw Error('Block page bound');const part=await detail('/block/'+b.hash+'?pageSize=1000&page='+page,3600000);if(part.hash!==b.hash||part.txCount!==b.txCount)throw Error('Block page identity mismatch');txs.push(...part.txs);}
 const raw=await detail('/rawblock/'+b.hash,86400000),header=verifiedBlock({...b,txs},raw),wire=require('./doge-raw-block.cjs').parseBlock(raw.hex);
 return{block:header,txs:txs.map((t,i)=>{const decoded=require('./legacy-transaction.cjs').decode(wire.transactions[i].hex);const vin=t.vin.map((v,j)=>({...v,txid:decoded.vin[j].txid,vout:decoded.vin[j].vout}));return require('./blockbook-transaction.cjs').transaction({...t,vin,hex:wire.transactions[i].hex,blockHeight:b.height,blockHash:b.hash,blockTime:b.time,confirmations:b.confirmations},t.txid);})};
}
module.exports.blockPage=blockPage;
