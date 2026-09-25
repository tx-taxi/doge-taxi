'use strict';
const fs=require('node:fs');
// Conservative local ceiling, not an assertion that an upstream subscription has this allowance.
function createBudget(file,{hourly=90,collector=76,detail=14,now=Date.now}={}) {
 let entries=[];try{entries=JSON.parse(fs.readFileSync(file));}catch{}
 const trim=()=>{entries=entries.filter(e=>Number.isFinite(e.at)&&now()-e.at<3600000&&e.at<=now());};
 const status=()=>{trim();return {hourly,collector,detail,used:entries.length,collectorUsed:entries.filter(e=>e.lane==='collector').length,detailUsed:entries.filter(e=>e.lane==='detail').length};};
 return {status,claim(lane){const s=status();const ceiling=lane==='collector'?collector:detail;const used=lane==='collector'?s.collectorUsed:s.detailUsed;if(s.used>=hourly||used>=ceiling)throw Object.assign(new Error('Temporarily unavailable'),{status:503,localBudget:true,lane});entries.push({at:now(),lane});fs.writeFileSync(file,JSON.stringify(entries));}};
}
module.exports={createBudget};
