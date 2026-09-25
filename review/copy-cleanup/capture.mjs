import {chromium} from '/home/lukee/.local/share/pnpm/global/5/.pnpm/playwright@1.59.1/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
const dir='/home/lukee/dev/doge-taxi/review/copy-cleanup';const b=await chromium.launch({executablePath:'/home/lukee/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',headless:true,args:['--no-sandbox']});const records=[];
for(const width of [1440,390])for(const theme of ['default','original']){
const c=await b.newContext({viewport:{width,height:width===390?844:900}});await c.addInitScript(t=>{try{localStorage.setItem('theme-preference',t)}catch{}},theme);
let intercepted=0;await c.route('**/api/**',r=>{intercepted++;return r.fulfill({status:503,json:{error:'Temporarily unavailable'}})});await c.routeWebSocket('**/api/v1/ws',ws=>ws.close());
const p=await c.newPage();let errors=[];p.on('pageerror',e=>errors.push(e.message));
for(const [name,path] of [['root','/'],['mining','/mining'],['about','/about']]){await p.goto('http://127.0.0.1:4351'+path,{waitUntil:'domcontentloaded'});await p.waitForTimeout(1400);await p.screenshot({path:`${dir}/${name}-${width}-${theme}.png`,fullPage:true});records.push({name,width,theme,errors:[...errors],intercepted,...await p.evaluate(()=>({text:document.body.innerText,tooltips:[...document.querySelectorAll('[title],[ngbtooltip]')].map(x=>x.getAttribute('title')||x.getAttribute('ngbtooltip')),overflow:document.documentElement.scrollWidth>innerWidth}))});errors=[];}
await c.close();}await b.close();await fs.writeFile(dir+'/report.json',JSON.stringify(records,null,2));
