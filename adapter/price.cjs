'use strict';
let quote=null,inflight=null;
async function current(){
 if(quote&&Date.now()<quote.expiresAt)return quote;
 if(inflight)return inflight;
 inflight=(async()=>{const r=await fetch('https://api.kraken.com/0/public/Ticker?pair=XDGUSD',{signal:AbortSignal.timeout(6000)});if(!r.ok)throw new Error('DOGE quote unavailable');const d=await r.json();const price=Number(d.result?.XDGUSD?.c?.[0]);if(d.error?.length||!(price>0))throw new Error('DOGE quote unavailable');quote={USD:price,source:'Kraken XDGUSD last trade',fetchedAt:Date.now(),expiresAt:Date.now()+60000};return quote;})();
 try{return await inflight;}finally{inflight=null;}
}
module.exports={current};
