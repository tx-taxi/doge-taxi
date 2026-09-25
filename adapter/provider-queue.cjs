'use strict';
// One in-flight request. A waiting collector takes the next available slot.
function createQueue({detail=8,collector=2,history=2}={}){
 const queues={collector:[],detail:[],history:[]},limits={detail,collector,history};let running=false;
 function advance(){if(running)return;const lane=['collector','detail','history'].find(k=>queues[k].length);if(!lane)return;const job=queues[lane].shift();running=true;Promise.resolve().then(job.run).then(job.resolve,job.reject).finally(()=>{running=false;advance();});}
 return{status:()=>({running,queued:Object.fromEntries(Object.entries(queues).map(([k,v])=>[k,v.length]))}),schedule(run,lane='detail'){
  if(!queues[lane]||queues[lane].length>=limits[lane])return Promise.reject(Object.assign(new Error('Provider request queue temporarily full'),{status:503,localQueue:true}));
  return new Promise((resolve,reject)=>{queues[lane].push({run,resolve,reject});advance();});
 }};
}
module.exports={createQueue};
