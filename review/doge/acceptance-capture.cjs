const {chromium}=require('/home/lukee/dev/usoftware-landing/node_modules/playwright');const fs=require('fs');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader']});const out=[];
for(const vp of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]){
const page=await browser.newPage({viewport:vp});const errors=[];page.on('pageerror',e=>errors.push(e.message));
for(const [name,url] of [['root','/'],['historical-tx','/tx/19220173c151925d493a25dbe67798fa11e6e4db01b927b1c04cddead85d3d12']]){
 await page.goto('http://127.0.0.1:4351'+url,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForTimeout(4500);
 for(const theme of ['default','original']){
 const selector=page.locator('app-theme-selector select:visible').first();await selector.selectOption(theme);await page.waitForTimeout(600);await page.screenshot({path:`review/doge/${name}-${vp.name}-${theme}.png`,fullPage:true});
 out.push({name,viewport:vp,theme,url:page.url(),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),title:await page.title(),errors:[...errors],text:await page.locator('body').innerText()});
 }
}
await page.close();}
fs.writeFileSync('review/doge/acceptance-browser.json',JSON.stringify(out,null,2));await browser.close();})();
