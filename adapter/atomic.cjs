'use strict';
// Shared Blockbook collector: two requests per new block, never per viewer.
const fs=require('node:fs'),path=require('node:path');
const {prune}=require('./cache-limits.cjs');
const dir=path.join(process.env.DOGE_DATA_DIR||path.join(__dirname,'../.local'),'atomic');fs.mkdirSync(dir,{recursive:true});
const root=process.env.DOGE_ATOMIC_URL||'https://dogecoin.atomicwallet.io/api/v2';
const budget=require('./request-budget.cjs').createBudget(path.join(dir,'budget.json'),{hourly:240,collector:240,detail:0});
const queue=require('./provider-queue.cjs').createQueue();
const cooldownFile=path.join(dir,'cooldown.json');let cooldown=0;try{cooldown=JSON.parse(fs.readFileSync(cooldownFile)).until;}catch{}
let next=0;const health={source:'atomicwallet-blockbook',lastSuccess:null,lastFailure:null};
async function request(p){return queue.schedule(async()=>{
 if(Date.now()<cooldown)throw new Error('AtomicWallet provider cooling down');
 await new Promise(r=>setTimeout(r,Math.max(0,next-Date.now())));budget.claim('collector');next=Date.now()+1100;
 try{
  const r=await fetch(root+p,{signal:AbortSignal.timeout(12000)});
  if(!r.ok){if([403,429,503].includes(r.status)){cooldown=Date.now()+Math.max(300000,Number(r.headers.get('retry-after')||0)*1000);fs.writeFileSync(cooldownFile,JSON.stringify({until:cooldown}));}throw new Error('AtomicWallet HTTP '+r.status);}
  const text=await r.text();if(text.length>12000000)throw new Error('Provider response exceeds bound');const d=JSON.parse(text);if(d.error)throw new Error('AtomicWallet data unavailable');return d;
 }catch(e){health.lastFailure={at:Date.now(),message:e.message};throw e;}
 },'collector');}
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
 return {id:b.hash,height:b.height,version:b.version,timestamp:b.time,tx_count:b.txCount,size:b.size,weight:b.size*4,merkle_root:b.merkleRoot,previousblockhash:b.previousBlockHash,nonce:Number(b.nonce),bits:parseInt(b.bits,16),difficulty:Number(b.difficulty),extras:{totalFees:Number(sum),avgFee:rates.length?Number(sum)/rates.length:0,medianFee:median,feeRange:rates.length?[rates[0],rates.at(-1)]:[0,0],reward:Number(reward),pool:{id:0,name:match?.[0]||'',slug:match?.[1]||'',...(payout?{address:payout}:{})},matchRate:null},doge:{isAuxPow:true,sizeSource:'raw-block',feeSource:'atomicwallet-index+verified-raw-block'}};
}
function cached(hash){try{return JSON.parse(fs.readFileSync(path.join(dir,hash+'.json')));}catch{return null;}}
async function block(id){
 if(/^[a-f0-9]{64}$/.test(String(id))){const saved=cached(id);if(saved)return saved;}
 const b=await request('/block/'+id+'?pageSize=1000');
 if(!/^[a-f0-9]{64}$/.test(b.hash)||!Number.isInteger(b.txCount)||b.txCount<1||b.txCount>10000)throw new Error('Invalid block envelope');
 const saved=cached(b.hash);if(saved)return saved;
 const pages=b.totalPages||1;if(pages>10)throw new Error('Block pagination exceeds bound');
 for(let page=2;page<=pages;page++){const part=await request('/block/'+b.hash+'?pageSize=1000&page='+page);if(part.hash!==b.hash||part.txCount!==b.txCount)throw new Error('Block pagination changed');b.txs.push(...part.txs);}
 const out=verifiedBlock(b,await request('/rawblock/'+b.hash));
 fs.writeFileSync(path.join(dir,b.hash+'.json'),JSON.stringify(out));prune(dir,{matches:name=>/^[a-f0-9]{64}\.json$/.test(name)});return out;
}
async function strip(){
 const s=await request('');const observedAt=Date.now();
 if(!s.blockbook?.inSync||s.blockbook.initialSync||s.backend?.chain!=='main'||!Number.isInteger(s.backend.blocks)||!/^[a-f0-9]{64}$/.test(s.backend.bestBlockHash))throw new Error('Dogecoin index is not synchronized');
 const blocks=[];let hash=s.backend.bestBlockHash;
 for(let i=0;i<8;i++){const b=await block(hash);if(b.id!==hash||b.height!==s.backend.blocks-i)throw new Error('Noncontiguous canonical strip');blocks.push(b);hash=b.previousblockhash;}
 health.lastSuccess=observedAt;return {blocks,observedAt};
}
module.exports={strip,cached,verifiedBlock,health,status:()=>({...budget.status(),cooldownUntil:cooldown})};
