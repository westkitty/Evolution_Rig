"""Regression: Field Manual controls initialize and remain operable above the board scrim."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
from test_browser import STORAGE_SHIM

HTML=(Path(__file__).resolve().parents[1]/'index.html').read_text(encoding='utf-8')

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,headless=True,args=['--no-sandbox'])
  page=await browser.new_page(viewport={'width':375,'height':667})
  page.set_default_timeout(5000)
  errors=[]
  page.on('pageerror',lambda error:errors.append(str(error)))
  await page.evaluate(STORAGE_SHIM)
  await page.set_content(HTML,wait_until='load')
  assert await page.evaluate('typeof EvolutionRigTest')=='object'
  await page.locator('#hudGuide').click()
  assert await page.locator('#guideDialog').evaluate('(element)=>element.open')
  assert await page.locator('.guide-card').count()==8
  await page.keyboard.press('Escape')
  assert not await page.locator('#guideDialog').evaluate('(element)=>element.open')
  await page.locator('#hudBoards').click()
  await page.locator('#boardGuide').wait_for(state='visible')
  await page.locator('#boardGuide').click()
  assert await page.locator('#guideDialog').evaluate('(element)=>element.open')
  await page.locator('#guideCloseAction').click()
  assert not await page.locator('#guideDialog').evaluate('(element)=>element.open')
  assert 'ui-boards-open' in await page.locator('body').get_attribute('class')
  await page.keyboard.press('Escape')
  assert 'ui-boards-open' not in await page.locator('body').get_attribute('class')
  await page.locator('#hudStarters').click()
  await page.locator('[data-starter-category="People"]').click()
  assert await page.locator('.starter-entry').count()==4
  await page.locator('[data-starter-id="skills-that-travel"]').click()
  assert await page.locator('#starterName').inner_text()=='Skills That Travel'
  await page.locator('#starterNewBoard').click()
  assert (await page.evaluate('EvolutionRigTest.getPublicState()'))['boards']==1
  assert (await page.evaluate('EvolutionRigTest.getPublicState()'))['ideas']==1
  assert not errors,errors
  await browser.close()
  print('PASS: guide HUD/drawer, 8 chapters, native modal close, board scrim layering, restored People starter plant, no JS errors')

if __name__=='__main__':asyncio.run(main())
