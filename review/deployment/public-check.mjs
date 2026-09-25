import {chromium} from '/home/lukee/.local/share/pnpm/global/5/.pnpm/playwright@1.59.1/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const dir='review/deployment/doge-public';fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/home/lukee/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'}),rows=[];
for(const width of [1440,390])for(const theme of ['default','original']){
 const p=await browser.newPage({viewport:{width,height:width===390?844:900}}),errors=[],failed=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400&&!r.url().includes('/api/'))failed.push({status:r.status(),url:r.url()});});
 await p.addInitScript(t=>localStorage.setItem('theme-preference',t),theme);
 for(const [name,url] of [['root','/'],['pending','/mempool-block/0']]){
  await p.goto('https://doge.tx.taxi'+url,{waitUntil:'domcontentloaded'});await p.waitForTimeout(2500);
  await p.screenshot({path:`${dir}/${width}-${theme}-${name}.png`,fullPage:true});
  const data=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,h1:document.querySelector('h1')?.innerText,theme:document.documentElement.dataset.theme,body:getComputedStyle(document.body).backgroundColor,canvas:document.querySelectorAll('canvas').length}));
  if(name==='pending'&&data.h1!=='Pending sample')throw Error(JSON.stringify(data));
  if(data.overflow)throw Error('Overflow');rows.push({width,theme,name,...data,errors:[...errors],failed:[...failed]});
 }
 await p.close();
}
const p=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
for(const [name,url] of [['mining','/mining'],['block','/block/233766828adbd034c53c31f3f494c00a6cee45b85becc867b312dfc86c76c4b4']]){
 await p.goto('https://doge.tx.taxi'+url,{waitUntil:'domcontentloaded'});await p.waitForTimeout(5000);await p.screenshot({path:`${dir}/1440-default-${name}.png`,fullPage:true});rows.push({name,errors:[...errors],...await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,canvas:document.querySelectorAll('canvas').length,text:document.body.innerText.slice(0,500)}))});
}
await browser.close();fs.writeFileSync(dir+'/results.json',JSON.stringify(rows,null,2));console.log(rows.map(({width,theme,name,overflow,errors,failed,canvas})=>({width,theme,name,overflow,errors,failed,canvas})));
