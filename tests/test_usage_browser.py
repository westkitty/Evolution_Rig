"""Proof of hosted model allowance and hard request cap; synthetic fetch only."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
from test_browser import STORAGE_SHIM
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text()
async def main():
 errors=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,headless=True,args=['--no-sandbox'])
  page=await browser.new_page()
  page.on('pageerror',lambda x:errors.append(str(x)))
  await page.evaluate(STORAGE_SHIM);await page.set_content(HTML)
  await page.locator('#hudWorkbench').click()
  await page.locator('#boardForm [name=title]').fill('Usage test')
  await page.locator('#boardForm [name=objective]').fill('Stay under the selected request ceiling')
  await page.locator('#boardForm button[type=submit]').click()
  await page.locator('#newSeed').click()
  fields={'title':'Usage governor root','problem':'A system can send more model calls than users intend.', 'audience':'Small teams operating limited budgets.', 'mechanism':'Local counter restricts model-call attempts within a browser session.', 'difference':'No remote keys or telemetry needed.', 'plan':'Test one remote call with a mocked endpoint.', 'validation':'Count mocked requests before and after enabling access.', 'benefit':'No surprise unapproved calls.', 'constraints':'No hosted requests by default.', 'risks':'Estimates do not reflect exact billing.'}
  for k,v in fields.items():await page.locator(f'#ideaForm [name={k}]').fill(v)
  await page.locator('#submitIdea').click()
  await page.locator('[data-view=models]').click()
  await page.locator('#provider').select_option('openrouter')
  await page.locator('#apiKey').fill('fake-review-only-key')
  await page.locator('#saveRouter').click()
  await page.locator('[data-view=studio]').click()
  await page.locator('#branchCount').fill('1')
  await page.locator('#branchSelected').click()
  await page.wait_for_function("document.getElementById('toast').textContent.includes('Hosted requests are disabled')")
  assert await page.evaluate('window.__requests.length')==0
  assert await page.locator('#statTotal').inner_text()=='1'
  await page.locator('#workbenchLab').click()
  await page.locator('[data-lab-section=usage]').click()
  await page.locator('[data-lab-form=usage] [name=allow]').check()
  await page.locator('[data-lab-form=usage] [name=cap]').fill('1')
  await page.locator('[data-lab-form=usage] button[type=submit]').click()
  await page.locator('#labClose').click()
  await page.locator('#branchSelected').click()
  await page.wait_for_function("document.getElementById('statTotal').textContent === '2'")
  assert await page.evaluate('window.__requests.length')==1
  await page.locator('#branchSelected').click()
  await page.wait_for_function("document.getElementById('toast').textContent.includes('request cap')")
  assert await page.evaluate('window.__requests.length')==1
  assert await page.locator('#statTotal').inner_text()=='2'
  assert not errors,errors
  await browser.close()
  print('PASS: hosted model calls blocked by default, explicit session opt-in, hard request cap prevents second fetch, no unintended mutation.')
if __name__=='__main__':asyncio.run(main())
