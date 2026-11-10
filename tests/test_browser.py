"""Chromium UI test. Managed browser blocks file/http navigation, so set_content uses an in-page storage and fetch shim."""
import asyncio, json, zipfile, subprocess
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text()
STORAGE_SHIM=r'''(() => {
 function store(){let v={};return {getItem:k=>Object.prototype.hasOwnProperty.call(v,k)?v[k]:null,setItem:(k,x)=>{v[k]=String(x);},removeItem:k=>{delete v[k];},clear:()=>{v={}},key:i=>Object.keys(v)[i]||null,get length(){return Object.keys(v).length}}}
 Object.defineProperty(window,'localStorage',{configurable:true,value:store()});
 Object.defineProperty(window,'sessionStorage',{configurable:true,value:store()});
 window.__requests=[];
 window.fetch=async(url,opt)=>{
   window.__requests.push({url:String(url),body:JSON.parse(opt.body),authorization:opt.headers.Authorization||''});
   const result={choices:[{message:{content:JSON.stringify({ideas:[{title:'Mock model proposal',problem:'A small business has no offline repair log for real customer requests.',audience:'Local repair technicians and service managers.',mechanism:'Offline log with one decision record per maintenance intervention.',difference:'Links evidence and observations to reproducible decision trails.',plan:'Build one local page and test three customer cases in an afternoon.',validation:'Compare five paper trials before and after the prototype.',benefit:'Reduce repeated work and record auditable evidence.',constraints:'No cloud, no accounts and one small pilot.',risks:'Operators may record incomplete evidence.'}]})}}]};
   result.message={content:result.choices[0].message.content};
   return {ok:true,status:200,text:async()=>JSON.stringify(result)};
 };
})()'''

async def main():
 errors=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,headless=True,args=['--no-sandbox'])
  context=await browser.new_context(accept_downloads=True,viewport={'width':1440,'height':960})
  page=await context.new_page()
  page.on('pageerror',lambda e:errors.append(str(e)))
  await page.evaluate(STORAGE_SHIM)
  await page.set_content(HTML,wait_until='load')
  await page.locator('#hudWorkbench').click() # Original workbench regression path
  assert await page.locator('#calibrationBadge').inner_text()=='ANCHORS / PASS'
  assert await page.locator('#newSeed').is_disabled()
  await page.locator('#boardForm [name=title]').fill('Offline decision tools')
  await page.locator('#boardForm [name=objective]').fill('Find useful offline-first tools for technical operators, scored by concrete feasibility and measurable outcomes.')
  await page.locator('#boardForm button[type=submit]').click()
  assert await page.locator('#statTotal').inner_text()=='0'
  await page.locator('#newSeed').click()
  fixture=json.loads(subprocess.check_output(['node','-e',"console.log(JSON.stringify(require('./source/core.js').TEST_IDEAS.strong))"],cwd=ROOT,text=True))
  for name,value in fixture.items():await page.locator(f'#ideaForm [name="{name}"]').fill(value)
  await page.locator('#submitIdea').click()
  assert await page.locator('#statTotal').inner_text()=='1'
  assert await page.locator('#statGold').inner_text()=='1'
  assert (await page.locator('#inspector .total-display strong').inner_text()).replace(' ','')=='15/15'
  async with page.expect_download() as d:await page.locator('#inspector [data-action="exportZip"]').click()
  file=await (await d.value).path()
  with zipfile.ZipFile(file) as z:
   names=z.namelist()
   assert any(n.endswith('/claude.md') for n in names)
   assert any(n.endswith('/jury/verdict.json') for n in names)
   assert any(n.endswith('/lineage/family-tree.json') for n in names)
   c=z.read(next(n for n in names if n.endswith('/claude.md'))).decode('utf-8')
   assert 'Historical lineage' in c and 'Smallest testable build increment' in c
  await page.locator('#branchCount').fill('2')
  await page.locator('#branchSelected').click()
  assert await page.locator('#statTotal').inner_text()=='3'
  assert await page.locator('.idea-card').count()==3
  assert await page.locator('#statGenerations').inner_text()=='1'
  assert await page.locator('#inspector .evolution-lens').count()==1
  assert 'same peer set' in await page.locator('#inspector .evolution-lens').inner_text()
  await page.locator('.idea-card').nth(0).click()
  await page.locator('#inspector [data-action="pick"]').click()
  await page.locator('.idea-card').nth(1).click()
  await page.locator('#inspector [data-action="pick"]').click()
  assert not await page.locator('#crossPicked').is_disabled()
  await page.locator('#branchCount').fill('1')
  await page.locator('#crossPicked').click()
  assert await page.locator('#statTotal').inner_text()=='4'
  await page.locator('#overrideReason').fill('Deliberately pessimistic pilot assessment')
  await page.locator('#inspector [data-override="originality"]').select_option('1')
  assert 'jury.manual-override' in await page.locator('#inspector').inner_text()
  assert await page.locator('#inspector [data-override="originality"]').input_value()=='1'
  await page.locator('[data-view="autopilot"]').click()
  await page.locator('#stepOnce').click()
  await page.wait_for_function("document.querySelector('#statTotal').textContent === '5'")
  assert 'Autopilot' in await page.locator('#runtimeLog').inner_text()
  # Simulate reload by rebuilding the page against the same browser storage (managed chromium blocks navigation).
  await page.set_content(HTML,wait_until='load')
  assert await page.locator('#statTotal').inner_text()=='5'
  await page.locator('#boardForm [name=title]').fill('Board B')
  await page.locator('#boardForm [name=objective]').fill('Entirely separate line of research.')
  await page.locator('#boardForm button[type=submit]').click()
  assert await page.locator('#statTotal').inner_text()=='0'
  await page.locator('.board-entry').first.click()
  assert await page.locator('#statTotal').inner_text()=='5'
  await page.locator('[data-view="models"]').click()
  await page.locator('#provider').select_option('lmstudio')
  await page.locator('#endpoint').fill('http://127.0.0.1:1234/v1/chat/completions')
  await page.locator('#modelId').fill('mock-test-model')
  await page.locator('#apiKey').fill('test-session-key-never-export')
  await page.locator('#saveRouter').click()
  await page.locator('#probeRouter').click()
  await page.wait_for_function("document.querySelector('#toast').textContent.includes('Model endpoint responded.')")
  req=await page.evaluate('window.__requests.at(-1)')
  assert req['authorization']=='Bearer test-session-key-never-export'
  await page.locator('[data-view="studio"]').click()
  await page.locator('.idea-card').first.click()
  await page.locator('#branchCount').fill('1')
  await page.locator('#branchSelected').click()
  await page.wait_for_function("document.querySelector('#statTotal').textContent === '6'")
  assert await page.get_by_text('Mock model proposal',exact=True).count()>=1
  # Actual HTML drag and drop between distinct cards creates a hybrid descendant.
  await page.locator('.idea-card').first.drag_to(page.locator('.idea-card').nth(1))
  await page.wait_for_function("document.querySelector('#statTotal').textContent === '7'")
  # Per-provider profiles survive route switching.
  await page.locator('[data-view="models"]').click()
  await page.locator('#provider').select_option('ollama')
  await page.locator('#provider').select_option('lmstudio')
  assert await page.locator('#modelId').input_value()=='mock-test-model'
  await page.locator('[data-view="autopilot"]').click()
  await page.locator('#populationCap').fill('4')
  await page.locator('#pruneThreshold').fill('10')
  await page.locator('#stepOnce').click()
  await page.wait_for_function("document.querySelector('#statTotal').textContent === '8'")
  assert int(await page.locator('#statActive').inner_text())<=4
  async with page.expect_download() as d:await page.locator('#downloadWorkspace').click()
  workspace=json.loads(Path(await (await d.value).path()).read_text())
  assert workspace['schema']==1 and len(workspace['boards'])==2
  assert 'test-session-key-never-export' not in json.dumps(workspace)
  assert sum(x['status']=='archived' for x in workspace['ideas'])>=1
  assert any(len(x['parents'])==2 for x in workspace['ideas'])
  # Native Ollama schema is an explicit contract; parser still validates replies.
  await page.locator('[data-view="models"]').click()
  await page.locator('#provider').select_option('ollama')
  await page.locator('#modelId').fill('local-test-model')
  await page.locator('#saveRouter').click()
  await page.locator('[data-view="studio"]').click()
  await page.locator('.idea-card').first.click()
  await page.locator('#branchSelected').click()
  await page.wait_for_function("document.querySelector('#statTotal').textContent === '9'")
  req=await page.evaluate('window.__requests.at(-1)')
  assert req['body']['format']['type']=='object'
  assert req['body']['format']['properties']['ideas']['minItems']==1
  await page.locator('[data-view="studio"]').click()
  await page.screenshot(path=str(ROOT/'tests'/'desktop-preview.png'),full_page=True)
  # New independent mobile document with populated state for visual and overflow inspection.
  mctx=await browser.new_context(viewport={'width':390,'height':844},is_mobile=True,device_scale_factor=1)
  mobile=await mctx.new_page();await mobile.evaluate(STORAGE_SHIM)
  await mobile.evaluate('(v)=>localStorage.setItem("evolution-rig:state:v1",v)',json.dumps(workspace))
  await mobile.set_content(HTML,wait_until='load')
  await mobile.locator('#hudWorkbench').click()
  await mobile.screenshot(path=str(ROOT/'tests'/'mobile-preview.png'),full_page=True)
  overflow=await mobile.evaluate('document.documentElement.scrollWidth > document.documentElement.clientWidth')
  assert not overflow,'Mobile document overflows horizontally'
  assert not errors,errors
  print('PASS: Chromium UI flows, ZIP parsing, local evolution, real drag/drop, pruning, persistence shim, profiles, boards, override, mock endpoint, secret exclusion, mobile viewport')
  print('NOTE: file/http navigation and real network/CORS are blocked by this managed Chromium; model call was intercepted in-page.')
  await mctx.close();await context.close();await browser.close()
if __name__=='__main__':asyncio.run(main())
