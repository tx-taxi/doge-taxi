'use strict';
const {decode}=require('./legacy-transaction.cjs');
function transaction(t,id){
 const raw=decode(t.hex);if(raw.txid!==id||t.txid!==id||t.vin.length!==raw.vin.length||t.vout.length!==raw.vout.length)throw Error('Transaction identity or count mismatch');
 let incoming=0n,outgoing=0n;const coinbase=raw.vin[0]?.coinbase;
 const vin=raw.vin.map((input,i)=>{const v=t.vin[i];if(!input.coinbase&&(v.txid!==input.txid||v.vout!==input.vout))throw Error('Transaction input mismatch');const value=input.coinbase?0n:BigInt(v.value);if(value<0n||value>BigInt(Number.MAX_SAFE_INTEGER))throw Error('Invalid transaction input value');incoming+=value;return{txid:input.txid,vout:input.vout,is_coinbase:input.coinbase,scriptsig:input.script,scriptsig_asm:'',sequence:input.sequence,prevout:input.coinbase?null:{value:Number(value),valueExact:value.toString(),scriptpubkey_address:v.addresses?.[0],scriptpubkey_type:'unknown',scriptpubkey:'',scriptpubkey_asm:''}};});
 const vout=raw.vout.map((output,i)=>{if(output.value!==t.vout[i].value)throw Error('Transaction output mismatch');const v=BigInt(output.value);if(v>BigInt(Number.MAX_SAFE_INTEGER))throw Error('Invalid transaction output value');outgoing+=v;const script=output.script,type=/^76a914[0-9a-f]{40}88ac$/.test(script)?'p2pkh':/^a914[0-9a-f]{40}87$/.test(script)?'p2sh':script.startsWith('6a')?'op_return':'unknown';return{value:Number(v),valueExact:output.value,scriptpubkey:script,scriptpubkey_asm:'',scriptpubkey_type:type,scriptpubkey_address:t.vout[i].isAddress?t.vout[i].addresses?.[0]:undefined};});
 const fee=BigInt(t.fees);if(fee<0n||fee>BigInt(Number.MAX_SAFE_INTEGER)||(!coinbase&&incoming-outgoing!==fee)||outgoing!==BigInt(t.value))throw Error('Transaction fees or values do not reconcile');
 const confirmed=t.confirmations>0&&Number.isInteger(t.blockHeight)&&t.blockHeight>=0;
 return{txid:id,version:raw.version,locktime:raw.locktime,size:raw.size,weight:raw.size*4,fee:Number(fee),vin,vout,status:{confirmed,...(confirmed?{block_height:t.blockHeight,block_hash:t.blockHash,block_time:t.blockTime}:{})},doge:{value:Number(outgoing)}};
}
module.exports={transaction};
