'use strict';
// Dogecoin API gateway and native explorer runtime; local mode proxies Angular.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {WebSocket, WebSocketServer} = require('ws');
const sharp = require('sharp');
const {providerStatus} = require('./provider-health.cjs');
const STATIC_ROOT = process.env.DOGE_STATIC_ROOT && path.resolve(process.env.DOGE_STATIC_ROOT);
const FRONTEND_ORIGIN = process.env.DOGE_FRONTEND_ORIGIN || 'http://127.0.0.1:4350';
const ROUTER_ORIGIN = process.env.DOGE_ROUTER_ORIGIN || 'http://127.0.0.1:4340';
const SITE_ORIGIN = process.env.DOGE_SITE_ORIGIN || 'http://127.0.0.1:4351';
const PRIMARY = process.env.DOGE_BLOCKCYPHER_URL || 'https://api.blockcypher.com/v1/doge/main';
const cache = new Map(), inflight = new Map(), failedPaths = new Map();
const health = {primary: PRIMARY, lastSuccess: null, lastFailure: null, websocket: 'connecting'};
const MAX_CACHE = 500;
function result(data, source='dogecoin', status=200) {return {data,source,status};}
async function fetchData(url, timeout=7000, metadata=false) {
 const r=await fetch(url,{signal:AbortSignal.timeout(timeout)});
 const raw=await r.text(); let data;try {data=JSON.parse(raw);}catch {data=raw;}
 if(!r.ok) throw Object.assign(new Error(`Provider HTTP ${r.status}`),{status:r.status});
 return metadata ? {data,headers:Object.fromEntries(['x-total-count','retry-after'].filter(h=>r.headers.has(h)).map(h=>[h,r.headers.get(h)]))} : data;
}
const dogecoin = require('./dogecoin.cjs');
// Both health views read the same provider state; liveness must never probe upstream.
function currentProviderStatus(now = Date.now()) {
 const base = providerStatus(health, failedPaths, now);
 const cooldownUntil = dogecoin.cooldown();
 const limited = now < cooldownUntil;
 const observedAt = dogecoin.liveObservedAt();
 const budget = dogecoin.budget();
 const eligible = budget.blockchair?.allowed !== false;
 return {...base, source: dogecoin.health,
  stale: !eligible || limited || !observedAt || now - observedAt > dogecoin.refreshInterval * 2,
  degraded: !eligible || base.degraded || limited,
  cooldownUntil: cooldownUntil || null, budget, cacheEntries: cache.size};
}

async function api(path) {
 try {const data=await dogecoin.route(path);health.lastSuccess=dogecoin.liveObservedAt();const r=result(data,dogecoin.health.source);if(data?.doge?.observedAt){r.at=data.doge.observedAt;r.stale=Date.now()-r.at>dogecoin.refreshInterval*2;}return r;}
 catch(e){health.lastFailure={at:Date.now(),message:e.message};return result({error:e.message,retryable:true},'unavailable',e.status===404?404:503);}
}

function send(res,status,data,type='application/json',headers={}) {
 res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store',...headers});res.end(typeof data==='string'||Buffer.isBuffer(data)?data:JSON.stringify(data));
}
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function metadata(path) {
 const m=path.match(/^\/(tx|block|address)\/([A-Za-z0-9]+)$/);
 let cardDescription='Entity data temporarily unavailable. Please retry.';
 let title='doge.tx.taxi - Dogecoin Explorer', description='Explore Dogecoin blocks, transactions, addresses, fees and mining activity.';
 if(m) {
  const kind=m[1],id=m[2];title=`Dogecoin ${kind} ${id} - doge.tx.taxi`;
  let p=kind==='block'?'/api/v1/block/'+id:'/api/'+kind+'/'+id;
  if(kind==='block' && /^\d+$/.test(id)) {const h=await api('/api/block-height/'+id);if(h.status===200)p='/api/v1/block/'+h.data;}
  const r=await api(p);
  if(r.status===200) {
   if(kind==='tx')description=`${r.data.status?.confirmed?'Confirmed':'Pending'} Dogecoin transaction. Fee: ${(r.data.fee/1e8).toFixed(8)} DOGE. Scrypt proof of work.`;
   if(kind==='block')description=`Dogecoin block ${r.data.height}. ${r.data.tx_count} transactions. Mined ${new Date(r.data.timestamp*1000).toISOString()}.`;
   if(kind==='address')description=`Dogecoin address with ${r.data.chain_stats?.tx_count ?? 'indexed'} confirmed transactions. Indexed history.`;
   if(kind==='tx')cardDescription=`${r.data.status?.confirmed?'Confirmed':'Pending'} transaction · Fee: ${(r.data.fee/1e8).toFixed(8)} DOGE`;
   if(kind==='block')cardDescription=`Block ${r.data.height} · ${r.data.tx_count} transaction${r.data.tx_count===1?'':'s'} · ${new Date(r.data.timestamp*1000).toISOString().slice(0,10)}`;
   if(kind==='address')cardDescription=`${r.data.chain_stats?.tx_count ?? 'Indexed'} confirmed transaction${r.data.chain_stats?.tx_count===1?'':'s'}`;
  } else description='Dogecoin entity data is temporarily unavailable. Retry to retrieve current details.';
 }
 return {title,description,cardDescription,path:m?path:'/'};
}
const cardTemplate=fs.readFileSync(__dirname+'/assets/social-card.svg','utf8');
const cardLogo='data:image/svg+xml;base64,'+fs.readFileSync(__dirname+'/../frontend/src/resources/branding/doge-dark-navbar.svg').toString('base64');
async function card(path) {
 const m=await metadata(path), entity=m.path.match(/^\/(tx|block|address)\/([A-Za-z0-9]+)$/);
 const headline=entity?({tx:'transaction',block:'block',address:'address'}[entity[1]]):'explorer';
 const subtitle=entity?m.cardDescription:'Dogecoin blocks, transactions and fees.';
 const bounded=subtitle.length>61?subtitle.slice(0,60).trimEnd()+'…':subtitle;
 const identifier=entity?`<text x="80" y="548" fill="#747474" font-family="DejaVu Sans Mono, monospace" font-size="18">${escape(entity[2])}</text>`:'';
 const values={headline:escape(headline),subtitle:escape(bounded),logo:cardLogo,identifier};
 const svg=cardTemplate.replace(/\{\{(headline|subtitle|logo|identifier)\}\}/g,(_,key)=>values[key]);
 return sharp(Buffer.from(svg)).png().toBuffer();
}
const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://localhost');
 try {
  if(req.method!=='GET' && req.method!=='HEAD')return send(res,405,{error:'Read-only local explorer'});
  if(u.pathname.startsWith('/local-router/')) {
   const path=u.pathname.slice('/local-router'.length)+u.search;
   if(!/^\/(api|assets)\//.test(path)) {res.writeHead(302,{location:ROUTER_ORIGIN+path});return res.end();}
   const r=await fetch(ROUTER_ORIGIN+path,{signal:AbortSignal.timeout(12000),redirect:'manual'});
   if(r.status>=300&&r.status<400) { const dest=r.headers.get('location');res.writeHead(r.status,{location:dest});return res.end(); }
   return send(res,r.status,Buffer.from(await r.arrayBuffer()),r.headers.get('content-type')||'application/json');
  }
  if(u.pathname==='/api/provider-health') {
   return send(res,200,currentProviderStatus());
  }
  if(u.pathname==='/healthz')return send(res,200,currentProviderStatus());
  if(u.pathname==='/api/local-resolve') {
   try {return send(res,200,await fetchData(ROUTER_ORIGIN+'/api/v1/resolve?value='+encodeURIComponent(u.searchParams.get('value')||''),12000));} catch {return send(res,503,{unavailable:true});}
  }
  if(u.pathname.startsWith('/api/')) {
   const r=await api(u.pathname+u.search);
   return send(res,r.status,r.data,typeof r.data==='string'?'text/plain':'application/json',{...r.headers,'X-DOGE-Source':r.source,...(r.at?{'X-DOGE-Stale':String(r.stale),'X-DOGE-Observed-At':String(r.at)}:{})});
  }
  if(u.pathname.startsWith('/resources/mining-pools/')) return send(res,200,fs.readFileSync(STATIC_ROOT?path.join(STATIC_ROOT,'resources/mining-pools/default.svg'):path.join(__dirname,'../frontend/src/resources/mining-pools/default.svg')),'image/svg+xml');
  if(u.pathname==='/og.png') return send(res,200,await card(u.searchParams.get('path')||'/'),'image/png');
  if(u.pathname.startsWith('/source/')||u.pathname.endsWith('.map'))return send(res,404,{error:'Not found'});
  let r;
  if(STATIC_ROOT) {
   const relative=decodeURIComponent(u.pathname).replace(/^\/+/, '');
   let file=path.resolve(STATIC_ROOT,relative);
   if(file!==STATIC_ROOT&&!file.startsWith(STATIC_ROOT+path.sep))return send(res,404,{error:'Not found'});
   if(!path.extname(relative))file=path.join(STATIC_ROOT,'index.html');
   let bytes;try{bytes=await fs.promises.readFile(file);}catch{return send(res,404,{error:'Not found'});}
   const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.webmanifest':'application/manifest+json','.txt':'text/plain','.wasm':'application/wasm'};
   r=new Response(bytes,{headers:{'content-type':types[path.extname(file)]||'application/octet-stream'}});
  } else r=await fetch(FRONTEND_ORIGIN+req.url,{headers:{accept:req.headers.accept||'*/*'},signal:AbortSignal.timeout(15000)});
  const type=r.headers.get('content-type')||'text/plain';
  if(type.includes('text/html')) {
   let html=await r.text();const m=await metadata(u.pathname),origin=SITE_ORIGIN;
   html=html.replace(/<title>[\s\S]*?<\/title>/,'').replace(/<meta[^>]+(?:name|property)=["'](?:description|og:[^"']+|twitter:[^"']+)["'][^>]*>/g,'').replace(/<link[^>]+rel=["']canonical["'][^>]*>/g,'');
   html=html.replace('</head>',`<title>${escape(m.title)}</title><meta name="description" content="${escape(m.description)}"><link id="canonical" rel="canonical" href="https://doge.tx.taxi${escape(m.path)}"><meta property="og:title" content="${escape(m.title)}"><meta property="og:description" content="${escape(m.description)}"><meta property="og:type" content="website"><meta property="og:site_name" content="doge.tx.taxi"><meta property="og:locale" content="en_US"><meta property="og:image" content="${origin}/og.png?v=4&amp;path=${encodeURIComponent(m.path)}"><meta property="og:url" content="https://doge.tx.taxi${escape(m.path)}"><meta property="og:image:type" content="image/png"><meta property="og:image:alt" content="${escape(m.title)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:domain" content="doge.tx.taxi"><meta name="twitter:image:alt" content="${escape(m.title)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(m.title)}"><meta name="twitter:description" content="${escape(m.description)}"><meta name="twitter:image" content="${origin}/og.png?v=4&amp;path=${encodeURIComponent(m.path)}"></head>`);
   return send(res,r.status,html,type);
  }
  return send(res,r.status,Buffer.from(await r.arrayBuffer()),type);
 }catch(e){send(res,503,{error:'Local service unavailable',message:e.message});}
});
const wss=new WebSocketServer({noServer:true});
server.on('upgrade',(req,socket,head)=>{
 socket.on('error',()=>socket.destroy());
 if(req.url==='/api/v1/ws')wss.handleUpgrade(req,socket,head,client=>wss.emit('connection',client));
 else {
  if(STATIC_ROOT){socket.destroy();return;}
  // Preserve Angular incremental rebuild notifications.
  const upstream=http.request({hostname:new URL(FRONTEND_ORIGIN).hostname,port:new URL(FRONTEND_ORIGIN).port,path:req.url,headers:req.headers});
  upstream.on('upgrade',(r,s,h)=>{const close=()=>{s.destroy();socket.destroy();};s.on('error',close);socket.on('error',close);s.on('close',()=>socket.destroy());socket.on('close',()=>s.destroy());if(socket.destroyed){s.destroy();return;}socket.write('HTTP/1.1 101 Switching Protocols\r\n'+Object.entries(r.headers).map(([k,v])=>`${k}: ${v}`).join('\r\n')+'\r\n\r\n');if(h.length)socket.write(h);if(head.length)s.write(head);s.pipe(socket).pipe(s);});upstream.on('error',()=>socket.destroy());upstream.end();
 }
});
// One collector and one fanout, independent of visitor count. Detail requests coalesce
// through the adapter cache; subscription generations prevent cross-page leakage.
let lastSnapshot=null, collection=null, sequence=0;
const emit=(client,data)=>{if(client.readyState===1)client.send(JSON.stringify(data));};
function pendingFrame(d){const ids=new Set(d['mempool-blocks']?.[0]?.transactionIds||[]);return {'projected-block-transactions':{index:0,sequence,blockTransactions:d.transactions.filter(t=>ids.has(t.txid)).map(t=>[t.txid,t.fee,t.vsize,t.value,t.fee/t.vsize,0])}};}
async function updateDetail(client){
 const id=client.trackedTx,generation=client.generation;
 if(!id)return;
 const r=await api('/api/tx/'+id);
 if(client.trackedTx!==id||client.generation!==generation)return;
 if(r.status===200){emit(client,{tx:r.data});if(r.data.status?.confirmed)client.trackedTx=null;}
 else emit(client,{'tracking-unavailable':true});
}
async function updateAddress(client){
 const address=client.trackedAddress,generation=client.addressGeneration;
 if(!address)return;
 const r=await api('/api/address/'+address+'/txs');
 if(client.trackedAddress!==address||client.addressGeneration!==generation)return;
 if(r.status!==200||!Array.isArray(r.data)){emit(client,{'tracking-unavailable':true});return;}
 const before=client.addressSeen;
 const current=new Map(r.data.map(t=>[t.txid,t.status.confirmed]));
 if(before){
  const added=r.data.filter(t=>!before.has(t.txid));
  const confirmed=r.data.filter(t=>t.status.confirmed&&before.get(t.txid)===false);
  emit(client,{'address-transactions':added.filter(t=>!t.status.confirmed),'block-transactions':[...added.filter(t=>t.status.confirmed),...confirmed]});
  for(const [id,status] of before)if(!current.has(id))current.set(id,status);
 }
 client.addressSeen=new Map([...current].slice(0,500));
}
async function collect(){
 if(collection)return collection;
 collection=(async()=>{
  try{
   const d=await dogecoin.snapshot();lastSnapshot=d;sequence++;health.lastSuccess=dogecoin.liveObservedAt();health.websocket='live';
   for(const client of wss.clients){emit(client,{...d,blocks:[...d.blocks].reverse(),'provider-freshness':{state:currentProviderStatus().stale?'stale':'live',observedAt:dogecoin.liveObservedAt()}});if(client.pendingSample)emit(client,pendingFrame(d));}
   await Promise.allSettled([...wss.clients].flatMap(client=>[updateDetail(client),updateAddress(client)]));
  }catch(e){health.websocket='unavailable';health.lastFailure={at:Date.now(),message:e.message};for(const client of wss.clients)emit(client,{'provider-freshness':{state:'stale',observedAt:dogecoin.liveObservedAt()}});}
 })();try{await collection;}finally{collection=null;}
}
wss.on('connection',client=>{
 client.generation=0;client.addressGeneration=0;
 client.on('message',async raw=>{let m;try{m=JSON.parse(raw);}catch{return;}
  if(m.action==='ping'){emit(client,{pong:true});return;}
  if(m.action==='init'||m['refresh-blocks']){
   if(lastSnapshot&&Date.now()-dogecoin.liveObservedAt()<dogecoin.refreshInterval)emit(client,{...lastSnapshot,blocks:[...lastSnapshot.blocks].reverse()});
   else await collect();
  }
  if(m['track-tx']!==undefined){client.generation++;client.trackedTx=/^[a-f0-9]{64}$/.test(m['track-tx'])?m['track-tx']:null;await updateDetail(client);}
  if(m['track-address']!==undefined){client.addressGeneration++;client.trackedAddress=/^[DA9][1-9A-HJ-NP-Za-km-z]{25,34}$/.test(m['track-address'])?m['track-address']:null;client.addressSeen=null;await updateAddress(client);}
  if(m['track-mempool-block']!==undefined){client.pendingSample=m['track-mempool-block']===0;if(client.pendingSample){if(!lastSnapshot)await collect();if(lastSnapshot)emit(client,pendingFrame(lastSnapshot));}}
 });
});
setInterval(collect,dogecoin.refreshInterval).unref();
setInterval(()=>{for(const client of wss.clients)emit(client,{heartbeat:Date.now(),'provider-freshness':{state:currentProviderStatus().stale?'stale':'live',observedAt:dogecoin.liveObservedAt()}});},20000).unref();
collect();
server.listen(Number(process.env.PORT||4351),process.env.DOGE_HOST||'127.0.0.1',()=>console.log('DOGE adapter on 127.0.0.1:'+ (process.env.PORT||4351)));
