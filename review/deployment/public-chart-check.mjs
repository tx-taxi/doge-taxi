import {chromium} from '/home/lukee/.local/share/pnpm/global/5/.pnpm/playwright@1.59.1/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const dir='review/deployment/doge-public/chart-fix';fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/home/lukee/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'}),rows=[];
for(const theme of ['default','original']){
 const p=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(t=>localStorage.setItem('theme-preference',t),theme);
 for(const [name,url] of [['root','/'],['pending','/mempool-block/0']]){
  await p.goto('https://doge.tx.taxi'+url,{waitUntil:'domcontentloaded'});await p.waitForTimeout(7000);
  await p.screenshot({path:`${dir}/${theme}-${name}.png`,fullPage:true});
  rows.push({theme,name,errors:[...errors],...await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,graphLabel:document.querySelector('#btn-graphs a')?.getAttribute('aria-label')}))});
 }await p.close();
}
await browser.close();fs.writeFileSync(dir+'/results.json',JSON.stringify(rows,null,2));console.log(rows);if(rows.some(r=>r.errors.length||r.overflow||r.graphLabel!=='Dogecoin graphs'))process.exit(1);
