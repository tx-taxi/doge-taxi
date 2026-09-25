'use strict';
// Historical daily observations, not fabricated per-block difficulty adjustments.
const DAY=86400;
async function history(){
 const chair=require('./blockchair.cjs');
 const response=await chair.request('/blocks?a=date,count(),sum(fee_total),avg(difficulty)&s=date(desc)&limit=31',{ttl:86400000,cost:64,lane:'history'});
 const today=new Date().toISOString().slice(0,10);
 const days=response.data.filter(d=>d.date<today&&Number.isFinite(d['avg(difficulty)'])&&d['count()']>0).slice(0,30).reverse();
 if(!days.length)throw Object.assign(new Error('Historical mining observations unavailable'),{status:503});
 const hashrates=days.map(d=>({timestamp:Date.parse(d.date+'T00:00:00Z')/1000,avgHashrate:d['avg(difficulty)']*2**32*d['count()']/DAY}));
 const difficulty=days.map(d=>({time:Date.parse(d.date+'T00:00:00Z')/1000,difficulty:d['avg(difficulty)']}));
 return {hashrates,difficulty,currentDifficulty:difficulty.at(-1).difficulty,currentHashrate:hashrates.at(-1).avgHashrate,coverage:{start:days[0].date,end:days.at(-1).date,days:days.length,interval:'day',difficulty:'daily average',hashrate:'estimated from observed blocks and mean difficulty',source:'Blockchair'}};
}
module.exports={history};
