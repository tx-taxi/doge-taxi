import {chromium} from '/home/lukee/.local/share/pnpm/global/5/.pnpm/playwright@1.59.1/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
const dir='/home/lukee/dev/doge-taxi/review/design-cleanup';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:'/home/lukee/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',headless:true,args:['--no-sandbox']});const report=[];
for(const [width,height] of [[1440,900],[390,844]])for(const theme of ['default','original']){
const context=await browser.newContext({viewport:{width,height}});await context.addInitScript(t=>localStorage.setItem('theme-preference',t),theme);const page=await context.newPage();let errors=[],failures=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().includes('/api/'))failures.push({url:r.url(),status:r.status()})});
for(const [name,path] of [['root','/'],['mining','/mining'],['graphs','/graphs/mining/hashrate-difficulty'],['calculator','/tools/calculator'],['docs','/docs/faq']]){
await page.goto('http://127.0.0.1:4351'+path,{waitUntil:'domcontentloaded'});await page.waitForTimeout(name==='root'?4500:1200);await page.screenshot({path:`${dir}/${name}-${width}-${theme}.png`,fullPage:true});report.push({name,width,theme,errors:[...errors],failures:[...failures],...await page.evaluate(()=>({text:document.querySelector('main')?.innerText||document.body.innerText,overflow:document.documentElement.scrollWidth>innerWidth}))});errors=[];failures=[];
}await context.close();}
await fs.writeFile(dir+'/report.json',JSON.stringify(report,null,2));await browser.close();
