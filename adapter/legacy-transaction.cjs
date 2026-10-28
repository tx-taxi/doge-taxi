'use strict';
const {createHash}=require('node:crypto');
const hash=bytes=>Buffer.from(createHash('sha256').update(createHash('sha256').update(bytes).digest()).digest()).reverse().toString('hex');
function decode(hex,{special=false,block=false}={}) {
 if(typeof hex!=='string'||hex.length%2||!/^[a-f0-9]+$/i.test(hex)||hex.length>8_000_000)throw Error('Invalid raw transaction bytes');
 const bytes=Buffer.from(hex,'hex');let offset=block?80:0;
 const take=n=>{if(n<0||n>bytes.length-offset)throw Error('Truncated raw transaction');const out=bytes.subarray(offset,offset+n);offset+=n;return out;};
 const compact=()=>{const n=take(1)[0];if(n<253)return n;const b=take(n===253?2:n===254?4:8);const v=n===253?BigInt(b.readUInt16LE()):n===254?BigInt(b.readUInt32LE()):b.readBigUInt64LE();if(v>BigInt(Number.MAX_SAFE_INTEGER)||v<(n===253?253n:n===254?65536n:4294967296n))throw Error('Invalid raw count');return Number(v);};
 function tx(){const start=offset,version=take(4).readUInt32LE(),type=special?version>>>16:0;const vinCount=compact();if((!special||!type)&&!vinCount||vinCount>Math.floor((bytes.length-offset)/41))throw Error('Invalid raw input count');const vin=[];
  for(let i=0;i<vinCount;i++){const txid=Buffer.from(take(32)).reverse().toString('hex'),vout=take(4).readUInt32LE(),script=take(compact()).toString('hex'),sequence=take(4).readUInt32LE();vin.push({txid,vout,script,sequence,coinbase:txid==='0'.repeat(64)&&vout===0xffffffff});}
  const count=compact();if(count>Math.floor((bytes.length-offset)/9))throw Error('Invalid raw output count');const vout=[];for(let i=0;i<count;i++)vout.push({value:take(8).readBigUInt64LE().toString(),script:take(compact()).toString('hex')});
  const locktime=take(4).readUInt32LE(),extraPayload=type?take(compact()).toString('hex'):null,raw=bytes.subarray(start,offset);return{txid:hash(raw),version:special?version&65535:version,type,vin,vout,locktime,extraPayload,size:raw.length,hex:raw.toString('hex')};
 }
 let result;if(block){const count=compact();if(!count||count>Math.floor((bytes.length-offset)/10))throw Error('Invalid raw block count');result=[];for(let i=0;i<count;i++)result.push(tx());let merkle=result.map(t=>Buffer.from(t.txid,'hex').reverse());while(merkle.length>1){const next=[];for(let i=0;i<merkle.length;i+=2){const pair=Buffer.concat([merkle[i],merkle[i+1]||merkle[i]]);next.push(Buffer.from(hash(pair),'hex').reverse());}merkle=next;}if(!merkle[0].equals(bytes.subarray(36,68)))throw Error('Transaction merkle root mismatch');}else result=tx();
 if(offset!==bytes.length)throw Error('Unexpected raw transaction bytes');return result;
}
const decimal=value=>{const n=BigInt(value),sign=n<0n?'-':'',v=n<0n?-n:n;return sign+(v/100000000n)+'.'+(v%100000000n).toString().padStart(8,'0');};
module.exports={decode,decimal};
