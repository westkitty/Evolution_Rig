"""True HTTP-origin smoke on systems that allow loopback browser navigation.
No real model, API credential, or paid inference. A block by managed browser is SKIP,
not a pass. CI is expected to run this with a normal browser.
"""
import asyncio,functools,json,threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler, BaseHTTPRequestHandler
from pathlib import Path
from playwright.async_api import async_playwright,Error as PlaywrightError
ROOT=Path(__file__).resolve().parents[1]
class QuietStatic(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
class FakeOllama(BaseHTTPRequestHandler):
 last=None
 def log_message(self,*args):pass
 def do_OPTIONS(self):
  self.send_response(204);self.send_header('Access-Control-Allow-Origin','*');self.send_header('Access-Control-Allow-Headers','content-type, authorization');self.send_header('Access-Control-Allow-Methods','POST, OPTIONS');self.end_headers()
 def do_POST(self):
  FakeOllama.last=json.loads(self.rfile.read(int(self.headers.get('Content-Length','0'))))
  idea={'title':'Local repair decision ledger','problem':'Technicians cannot easily compare prior maintenance notes and often repeat failed diagnosis paths.', 'audience':'Maintenance crews with unreliable mobile connectivity.', 'mechanism':'An on-device evidence card links symptom observations and each decision to rollback notes.', 'difference':'Each branch retains a searchable record of prior evidence and alternatives.', 'plan':'Build one offline HTML tool covering three faults and run five field trials.', 'validation':'Compare recovery time and count missed evidence across five trials.', 'benefit':'Reduce repeated inspection steps while preserving a history.', 'constraints':'Offline local pilot, no identity collection and no cloud database.', 'risks':'Incomplete evidence may mislead; require human review.'}
  body=json.dumps({'message':{'content':json.dumps({'ideas':[idea]})}}).encode()
  self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(body)));self.send_header('Access-Control-Allow-Origin','*');self.end_headers();self.wfile.write(body)
async def main():
 static=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(QuietStatic,directory=str(ROOT)))
 fake=ThreadingHTTPServer(('127.0.0.1',0),FakeOllama)
 for server in (static,fake):threading.Thread(target=server.serve_forever,daemon=True).start()
 try:
  async with async_playwright() as p:
   browser=await p.chromium.launch(executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,headless=True,args=['--no-sandbox'])
   ctx=await browser.new_context(viewport={'width':1280,'height':800},accept_downloads=True)
   page=await ctx.new_page()
   try:await page.goto(f'http://127.0.0.1:{static.server_port}/index.html',wait_until='load',timeout=18000)
   except PlaywrightError as err:
    if 'ERR_BLOCKED_BY_ADMINISTRATOR' in str(err):
     print('SKIP: browser blocks loopback HTTP navigation; real-origin persistence, IndexedDB, reload and CORS are UNVERIFIED in this environment.')
     await browser.close();return
    raise
   assert await page.locator('#calibrationBadge').inner_text()=='ANCHORS / PASS'
   await page.locator('#hudBoards').click()
   await page.locator('#boardForm [name=title]').fill('Real origin test')
   await page.locator('#boardForm [name=objective]').fill('Make offline maintenance evidence easier to inspect.')
   await page.locator('#boardForm button[type=submit]').click()
   await page.locator('#hudNewSeed').click()
   fields={'title':'Repair evidence ledger','problem':'Maintenance personnel cannot inspect old decisions reliably offline.', 'audience':'Technicians in remote buildings.', 'mechanism':'Browser evidence ledger with local linked decisions.', 'difference':'Complete local evidence log with explicit uncertainty.', 'plan':'Build one offline trial.', 'validation':'Count repeated faults before and after.', 'benefit':'Fewer wasted visits.', 'constraints':'No server or account.', 'risks':'Misleading entries could be reused.'}
   for name,value in fields.items():await page.locator(f'#ideaForm [name={name}]').fill(value)
   await page.locator('#submitIdea').click()
   assert await page.locator('#statTotal').inner_text()=='1'
   await page.reload()
   assert await page.locator('#statTotal').inner_text()=='1'
   assert await page.locator('#boardTitle').inner_text()=='Real origin test'
   # Local persistence backed by IndexedDB, independent from the workspace JSON key.
   await page.locator('#hudLab').click()
   await page.locator('[data-lab-section=recovery]').click()
   await page.locator('[data-lab-action=checkpoint]').click()
   await page.wait_for_function("document.querySelector('#rigLabBody').textContent.includes('manual')",timeout=12000)
   assert await page.locator('[data-lab-action=restore]').count()>=1
   await page.locator('#labClose').click()
   # Actual network + CORS, but only to a fake loopback model server.
   await page.locator('#hudWorkbench').click()
   await page.locator('[data-view=models]').click()
   await page.locator('#provider').select_option('ollama')
   await page.locator('#endpoint').fill(f'http://127.0.0.1:{fake.server_port}/api/chat')
   await page.locator('#modelId').fill('fake-local-chat')
   await page.locator('#saveRouter').click()
   await page.locator('[data-view=studio]').click()
   await page.locator('#branchCount').fill('1')
   await page.locator('#branchSelected').click()
   await page.wait_for_function("document.getElementById('statTotal').textContent === '2'",timeout=15000)
   assert FakeOllama.last['format']['properties']['ideas']['minItems']==1
   assert FakeOllama.last['format']['properties']['ideas']['maxItems']==1
   assert await page.locator('#inspector .evolution-lens').count()==1
   await page.reload()
   assert await page.locator('#statTotal').inner_text()=='2'
   await page.locator('#hudLab').click()
   await page.locator('[data-lab-section=recovery]').click()
   await page.wait_for_function("document.querySelectorAll('[data-lab-action=restore]').length > 0",timeout=12000)
   page.once('dialog',lambda d:asyncio.create_task(d.accept()))
   await page.locator('[data-lab-action=restore]').last.click()
   await page.wait_for_function("document.getElementById('statTotal').textContent === '1'",timeout=12000)
   print('PASS: true HTTP origin, browser reload storage, IndexedDB checkpoint and restore, local CORS, model schema and ancestry.')
   await browser.close()
 finally:
  for server in (fake,static):server.shutdown();server.server_close()
if __name__=='__main__':asyncio.run(main())
