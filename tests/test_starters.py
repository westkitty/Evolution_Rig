"""Browser-proof of the Seed Vault, full-value root creation, and <30% HUD.

The managed browser prohibits navigation to local/file origin, so this test uses
set_content with the same controlled localStorage shim as the existing suites.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
from test_browser import STORAGE_SHIM
from test_immersive import BUDGET

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')

async def choose(page, sid):
 await page.locator('#hudStarters').click()
 assert await page.locator('#starterDialog').evaluate('(x)=>x.open')
 await page.locator(f'[data-starter-id="{sid}"]').click()
 assert await page.locator(f'[data-starter-id="{sid}"]').get_attribute('aria-pressed')=='true'

async def main():
 errors=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,headless=True,args=['--no-sandbox'])
  ctx=await browser.new_context(viewport={'width':1440,'height':900},accept_downloads=True)
  page=await ctx.new_page()
  page.set_default_timeout(5000)
  page.on('pageerror',lambda e:errors.append(str(e)))
  await page.evaluate(STORAGE_SHIM)
  await page.set_content(HTML,wait_until='load')
  assert (await page.evaluate('EvolutionRigTest.getPublicState()'))['ideas']==0
  assert await page.locator('#hudStarters').is_visible()
  assert await page.locator('#fieldPrologueStarters').is_visible()
  await page.locator('#fieldPrologueStarters').click()
  assert await page.locator('.starter-entry').count()==20
  assert await page.locator('#starterIntoBoard').is_disabled()
  assert await page.locator('#starterEdit').is_disabled()
  assert not await page.locator('#starterNewBoard').is_disabled()
  await page.screenshot(path=str(ROOT/'tests'/'starter-vault-desktop.png'))
  await page.locator('[data-starter-category="Worlds"]').click()
  assert await page.locator('[data-starter-category="Worlds"]').evaluate('(x)=>x===document.activeElement')
  assert await page.locator('.starter-entry').count()==4
  await page.locator('#starterSearch').fill('museum')
  assert await page.locator('.starter-entry').count()==1
  assert 'Museum' in await page.locator('#starterName').inner_text()
  await page.locator('#starterSearch').fill('no-such-starter-anywhere')
  assert await page.locator('.starter-entry').count()==0
  assert await page.locator('#starterNewBoard').is_disabled()
  await page.locator('#starterSearch').fill('')
  await page.locator('[data-starter-category="All"]').click()
  assert await page.locator('.starter-entry').count()==20
  await page.locator('[data-starter-id="pollinator-steps"]').click()
  assert await page.locator('[data-starter-id="pollinator-steps"]').evaluate('(x)=>x===document.activeElement')
  assert await page.locator('#starterName').inner_text()=='Pollinator Stepping Stones'
  await page.keyboard.press('Escape')
  assert not await page.locator('#starterDialog').evaluate('(x)=>x.open')
  assert (await page.evaluate('EvolutionRigTest.getPublicState()'))['ideas']==0
  assert (await page.evaluate(BUDGET))['areaFraction']<.30

  await choose(page,'unbuilt-futures')
  await page.locator('#starterNewBoard').click()
  assert not await page.locator('#starterDialog').evaluate('(x)=>x.open')
  assert await page.locator('#statTotal').inner_text()=='1'
  data=await page.evaluate('JSON.parse(localStorage.getItem("evolution-rig:state:v1"))')
  assert len(data['boards'])==len(data['ideas'])==1
  assert data['ideas'][0]['title']=='Museum of Futures That Never Arrived'
  assert data['ideas'][0]['source']=='curated starter / unbuilt-futures'
  assert data['ideas'][0]['parents']==[] and data['ideas'][0]['generation']==0
  assert data['ideas'][0]['history'][0]['kind']=='created'
  assert 'scenario' in data['boards'][0]['objective'].lower() or 'alternate futures' in data['boards'][0]['objective'].lower()
  assert (await page.evaluate('EvolutionRigTest.getAtlasDiagnostics()'))['nodeCount']==1

  await choose(page,'offline-handoff')
  assert not await page.locator('#starterIntoBoard').is_disabled()
  await page.locator('#starterIntoBoard').click()
  data=await page.evaluate('JSON.parse(localStorage.getItem("evolution-rig:state:v1"))')
  assert len(data['boards'])==1 and len(data['ideas'])==2
  assert {x['title'] for x in data['ideas']}=={'The Offline Handoff Engine','Museum of Futures That Never Arrived'}
  assert all(x['parents']==[] for x in data['ideas'])
  assert await page.locator('#statTotal').inner_text()=='2'
  assert (await page.evaluate('EvolutionRigTest.getAtlasDiagnostics()'))['nodeCount']==2

  await choose(page,'conversation-rehearsal')
  await page.locator('#starterEdit').click()
  assert await page.locator('#ideaDialog').evaluate('(x)=>x.open')
  assert await page.locator('#ideaForm [name="title"]').input_value()=='The Conversation Rehearsal Lab'
  assert 'multiple readings' in await page.locator('#ideaForm [name="mechanism"]').input_value()
  await page.locator('#ideaForm [name="title"]').fill('My revised conversation laboratory')
  await page.locator('#submitIdea').click()
  assert await page.locator('#statTotal').inner_text()=='3'
  data=await page.evaluate('JSON.parse(localStorage.getItem("evolution-rig:state:v1"))')
  assert len(data['boards'])==1 and len(data['ideas'])==3
  assert any(x['title']=='My revised conversation laboratory' and x['source']=='manual seed' for x in data['ideas'])

  # Open from the board drawer; Escape closes only the modal, leaving the drawer.
  await page.locator('#hudBoards').click()
  await page.locator('#boardStarters').click()
  assert await page.locator('#starterDialog').evaluate('(x)=>x.open')
  await page.keyboard.press('Escape')
  assert not await page.locator('#starterDialog').evaluate('(x)=>x.open')
  assert 'ui-boards-open' in await page.locator('body').get_attribute('class')
  await page.keyboard.press('Escape')
  assert 'ui-boards-open' not in await page.locator('body').get_attribute('class')
  # Plant from the board drawer and confirm the drawer is dismissed and the field is usable.
  await page.locator('#hudBoards').click()
  await page.locator('#boardStarters').click()
  await page.locator('[data-starter-id="single-object-civilization"]').click()
  await page.locator('#starterIntoBoard').click()
  assert 'ui-boards-open' not in await page.locator('body').get_attribute('class')
  assert not await page.locator('#main').evaluate('(x)=>x.inert')
  assert await page.locator('#statTotal').inner_text()=='4'

  # New board never replaces or cross-pollinates earlier independent boards.
  await choose(page,'pollinator-steps')
  await page.locator('#starterNewBoard').click()
  assert await page.locator('#statTotal').inner_text()=='1'
  data=await page.evaluate('JSON.parse(localStorage.getItem("evolution-rig:state:v1"))')
  assert len(data['boards'])==2 and len(data['ideas'])==5
  assert data['ideas'][-1]['boardId']!=data['ideas'][0]['boardId']
  assert all(x['boardId']==data['boards'][0]['id'] for x in data['ideas'][:4])
  assert len(data['ideas'][-1]['history'])>=2
  await page.locator('#hudBoards').click()
  await page.locator('#boardList .board-entry').first.click()
  assert await page.locator('#statTotal').inner_text()=='4'
  await page.wait_for_function('!document.body.classList.contains("ui-boards-open")')
  await page.locator('#hudWorkbench').click()
  await page.locator('#workbenchStarters').click()
  assert await page.locator('#starterDialog').evaluate('(x)=>x.open')
  await page.locator('#starterClose').click()
  await page.locator('#resumeImmersion').click()
  await page.set_content(HTML,wait_until='load')
  assert (await page.evaluate('EvolutionRigTest.getPublicState()'))['boards']==2
  assert (await page.evaluate('EvolutionRigTest.getPublicState()'))['ideas']==5
  assert await page.locator('#statTotal').inner_text()=='4'
  assert len(await page.evaluate('window.__requests'))==0

  for w,h in [(1440,900),(390,844),(375,667),(320,568),(720,400)]:
   await page.set_viewport_size({'width':w,'height':h})
   await page.wait_for_timeout(80)
   budget=await page.evaluate(BUDGET)
   assert budget['areaFraction']<.30,(w,h,budget)
   assert not budget['pageOverflow'],(w,h,budget)
   await page.locator('#hudStarters').click()
   assert await page.locator('.starter-entry').count()==20
   assert await page.locator('#starterClose').is_visible()
   assert await page.locator('#starterNewBoard').is_visible()
   assert await page.locator('#starterIntoBoard').is_visible()
   overflow=await page.evaluate('''() => ({all:document.documentElement.scrollWidth>innerWidth,dialog:document.getElementById('starterDialog').getBoundingClientRect(),btn:document.getElementById('starterNewBoard').getBoundingClientRect()})''')
   assert not overflow['all'],(w,h,overflow)
   assert overflow['btn']['width']>65,(w,h,overflow)
   if w==390:await page.screenshot(path=str(ROOT/'tests'/'starter-vault-mobile.png'))
   await page.keyboard.press('Escape')
   assert not await page.locator('#starterDialog').evaluate('(x)=>x.open')
   print(f'PASS: {w}x{h}, persistent UI {budget["areaFraction"]*100:.1f}%, vault accessible')
  assert not errors,errors
  await browser.close()
  print('PASS: exactly 20 selectable starters; 5 themes + All filter, search, empty state, focus/Escape, full root receipts, independence, edit, additive planting, persistence, no fetch, responsive HUD')

if __name__=='__main__':asyncio.run(main())
