'use strict';
// Dogecoin Core serialization: primitives/pureheader.h, block.h,
// transaction.h and auxpow.h. Parse bytes; never infer transaction sizes.
const {createHash}=require('node:crypto');
const sha256d=b=>createHash('sha256').update(createHash('sha256').update(b).digest()).digest();
const hash=b=>Buffer.from(sha256d(b)).reverse().toString('hex');
function parseBlock(hex){
  if(typeof hex!=='string'||hex.length%2||!/^[a-f0-9]+$/i.test(hex)||hex.length>8_000_000)throw new Error('Invalid raw Dogecoin block hex');
  const bytes=Buffer.from(hex,'hex');let offset=0;
  const fail=message=>{throw new Error(`Malformed Dogecoin block at ${offset}: ${message}`);};
  function take(n){if(!Number.isSafeInteger(n)||n<0||n>bytes.length-offset)fail('truncated field');const b=bytes.subarray(offset,offset+n);offset+=n;return b;}
  function compact(){const n=take(1)[0];if(n<253)return n;const size=n===253?2:n===254?4:8,b=take(size);const value=size===2?BigInt(b.readUInt16LE()):size===4?BigInt(b.readUInt32LE()):b.readBigUInt64LE();if(value<(size===2?253n:size===4?65536n:4294967296n)||value>BigInt(Number.MAX_SAFE_INTEGER))fail('noncanonical or oversized CompactSize');return Number(value);}
  function count(minBytes){const n=compact();if(n>Math.floor((bytes.length-offset)/minBytes))fail('count exceeds remaining bytes');return n;}
  function vector(){return take(compact());}
  function transaction(allowWitness=false){
    const start=offset,version=take(4);let inputs=compact(),witness=false;
    if(inputs===0&&allowWitness){if(take(1)[0]!==1)fail('unsupported transaction flags');witness=true;inputs=compact();}
    if(inputs<1||inputs>Math.floor((bytes.length-offset)/41))fail('invalid input count');
    const inputStart=offset;let coinbaseScript=null;
    for(let i=0;i<inputs;i++){const prev=take(32),index=take(4).readUInt32LE(),script=vector();take(4);if(i===0&&inputs===1&&prev.equals(Buffer.alloc(32))&&index===0xffffffff)coinbaseScript=script;}
    const inputEnd=offset,outputStart=offset,outputs=count(9);if(!outputs)fail('empty outputs');
    for(let i=0;i<outputs;i++){take(8);vector();}
    const outputEnd=offset;
    if(witness){let nonempty=false;for(let i=0;i<inputs;i++){const items=count(1);if(items)nonempty=true;for(let j=0;j<items;j++)vector();}if(!nonempty)fail('superfluous witness record');}
    const locktime=take(4),serialized=bytes.subarray(start,offset);
    // Parent AuxPoW coinbase may use transaction witness serialization; DOGE
    // transactions below are strictly legacy. Txids never include witness.
    const compactInputs=bytes.subarray(inputStart-(inputs<253?1:inputs<=65535?3:5),inputStart);
    const txbytes=witness?Buffer.concat([version,compactInputs,bytes.subarray(inputStart,inputEnd),bytes.subarray(outputStart,outputEnd),locktime]):serialized;
    return {txid:hash(txbytes),size:serialized.length,coinbaseScript};
  }
  const header=take(80),version=header.readUInt32LE();let parentCoinbase=null,auxpow=null;
  if(version&0x100){
    const coinbase=transaction(true);if(!coinbase.coinbaseScript)fail('AuxPoW transaction is not coinbase');
    const parentHash=Buffer.from(take(32)).reverse().toString('hex');
    const merkleCount=count(32);if(merkleCount>64)fail('oversized parent merkle branch');take(merkleCount*32);take(4);
    const chainCount=count(32);if(chainCount>30)fail('oversized chain merkle branch');take(chainCount*32);take(4);
    const parentHeader=take(80);parentCoinbase=coinbase.coinbaseScript.toString('utf8');auxpow={parentHash,parentHeaderHash:hash(parentHeader),coinbaseTxid:coinbase.txid,coinbaseScriptHex:coinbase.coinbaseScript.toString('hex')};
  }
  const txCount=count(10);if(!txCount)fail('empty block');const transactions=[];
  for(let i=0;i<txCount;i++){const tx=transaction();if((i===0)!==(tx.coinbaseScript!==null))fail('invalid coinbase position');transactions.push({txid:tx.txid,size:tx.size});}
  if(offset!==bytes.length)fail('trailing bytes');
  let merkle=transactions.map(tx=>Buffer.from(tx.txid,'hex').reverse());while(merkle.length>1){const next=[];for(let i=0;i<merkle.length;i+=2)next.push(sha256d(Buffer.concat([merkle[i],merkle[i+1]||merkle[i]])));merkle=next;}
  if(!merkle[0].equals(header.subarray(36,68)))fail('transaction merkle root mismatch');
  return {hash:hash(header),transactions,parentCoinbase,auxpow,size:bytes.length};
}
module.exports={parseBlock};
