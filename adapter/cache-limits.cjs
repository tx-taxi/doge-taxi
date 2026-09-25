'use strict';
const fs=require('node:fs'),path=require('node:path');
// Callers explicitly select only owned entity files; operational state is never evicted.
const stateNames=new Set(['budget.json','request-budget.json','provider-cooldown.json','live-snapshot.json','pending-observations.json']);
function prune(dir,{matches,maxFiles=1000,maxBytes=256*1024*1024,maxAge=7*86400000,now=Date.now()}={}){
 let entries=[];for(const name of fs.readdirSync(dir)){if(stateNames.has(name)||!matches(name))continue;try{const file=path.join(dir,name),s=fs.lstatSync(file);if(s.isFile())entries.push({file,size:s.size,mtime:s.mtimeMs});}catch{}}
 entries.sort((a,b)=>a.mtime-b.mtime);let bytes=entries.reduce((n,e)=>n+e.size,0),count=entries.length;
 for(const e of entries){if(count<=maxFiles&&bytes<=maxBytes&&now-e.mtime<=maxAge)break;try{fs.unlinkSync(e.file);count--;bytes-=e.size;}catch{}}
 return{files:count,bytes};
}
function setBounded(map,key,value,max=500){map.delete(key);map.set(key,value);while(map.size>max)map.delete(map.keys().next().value);}
module.exports={prune,setBounded};
