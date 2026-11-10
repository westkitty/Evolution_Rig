"""Real Chromium guard for the Causal Field viewport budget and preserved editing.

The occupancy budget applies to always-visible controls and the empty-state card;
open-on-request drawers, modal editors, and the full workbench are intentional
expanded states, and are tested separately for accessibility and reversibility.
"""
import asyncio, json, subprocess
from pathlib import Path
from playwright.async_api import async_playwright
from test_browser import STORAGE_SHIM

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')

BUDGET="""() => {
  const ids=['immersionHud','immersionDock','fieldPrologue'];
  const els=ids.map(id=>document.getElementById(id)).concat([
     document.querySelector('.depth-bar'),document.querySelector('.atlas-readout')]);
  const surfaces=els.filter(x=>x.getClientRects().length && getComputedStyle(x).visibility !== 'hidden' && getComputedStyle(x).display !== 'none' && !x.hidden);
  const rects=surfaces.map(el=>el.getBoundingClientRect());
  const area=rects.reduce((n,r)=>n+r.width*r.height,0);
  const c=document.getElementById('atlasCanvas').getBoundingClientRect();
  return {areaFraction:area/(innerWidth*innerHeight),canvasWidth:c.width,canvasHeight:c.height,
          viewportWidth:innerWidth,viewportHeight:innerHeight,
          pageOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,
          chrome:surfaces.map(x=>x.id||x.className)};
}"""

async def main():
    errors=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,headless=True,args=['--no-sandbox'])
        ctx=await browser.new_context(viewport={'width':1440,'height':900},accept_downloads=True)
        page=await ctx.new_page()
        page.on('pageerror',lambda e:errors.append(str(e)))
        await page.evaluate(STORAGE_SHIM)
        await page.set_content(HTML,wait_until='load')
        assert 'mode-immersive' in await page.locator('body').get_attribute('class')
        assert await page.locator('#workspaceRail').evaluate('(x)=>x.inert')
        assert not await page.locator('#boardForm [name=title]').is_visible()
        assert await page.locator('#fieldPrologue').is_visible()
        assert 'NO RECORDED GENERATIONS' in await page.locator('#atlasReadout').inner_text()
        b=await page.evaluate(BUDGET)
        assert b['areaFraction']<.30,b
        assert abs(b['canvasWidth']-b['viewportWidth'])<=1,b
        assert abs(b['canvasHeight']-b['viewportHeight'])<=1,b
        await page.screenshot(path=str(ROOT/'tests'/'immersive-desktop-blank.png'))
        # Onboarding from the minimally visible prologue (not the hidden workbench).
        await page.locator('#fieldPrologueStart').click()
        await page.locator('#boardForm [name=title]').fill('Lineage of tested claims')
        await page.locator('#boardForm [name=objective]').fill('Develop testable local-first workflows while preserving ancestry, failure history and score provenance.')
        await page.locator('#boardForm button[type=submit]').click()
        await page.wait_for_function("!document.body.classList.contains('ui-boards-open')")
        assert await page.locator('#hudBoardName').inner_text()=='Lineage of tested claims'
        assert await page.locator('#workspaceRail').evaluate('(x)=>x.inert')
        assert (await page.locator('#fieldPrologueStart').inner_text()).startswith('Create first idea')
        await page.locator('#hudNewSeed').click()
        assert await page.locator('#ideaDialog').evaluate('(x)=>x.open')
        strong=json.loads(subprocess.check_output(['node','-e',"console.log(JSON.stringify(require('./source/core.js').TEST_IDEAS.strong))"],cwd=ROOT,text=True))
        for name,value in strong.items():await page.locator(f'#ideaForm [name="{name}"]').fill(value)
        await page.locator('#submitIdea').click()
        assert await page.locator('#hudIdeaCount').inner_text()=='1 ideas'
        assert not await page.locator('#fieldPrologue').is_visible()
        assert (await page.evaluate('EvolutionRigTest.getAtlasDiagnostics()'))['nodeCount']==1
        await page.locator('#hudInfo').click()
        assert await page.locator('#hudInfo').get_attribute('aria-expanded')=='true'
        assert await page.locator('#atlasNotebook').is_visible()
        assert 'Offline repair triage' in await page.locator('#atlasFocusTitle').inner_text()
        await page.keyboard.press('Escape')
        assert not await page.locator('#atlasNotebook').is_visible()
        assert await page.locator('#hudInfo').get_attribute('aria-expanded')=='false'
        # Full editor has not been deleted or reimplemented behind a second state.
        await page.locator('#hudWorkbench').click()
        assert not await page.locator('#atlasCanvas').bounding_box() is None
        assert await page.locator('#newSeed').is_visible()
        await page.locator('#branchCount').fill('3')
        await page.locator('#branchSelected').click()
        await page.wait_for_function("document.querySelector('#statTotal').textContent === '4'")
        await page.locator('[data-view="jury"]').click()
        assert await page.locator('#jury').is_visible()
        await page.locator('[data-view="autopilot"]').click()
        assert await page.locator('#autopilot').is_visible()
        await page.locator('[data-view="models"]').click()
        assert await page.locator('#models').is_visible()
        await page.locator('#resumeImmersion').click()
        assert not await page.locator('#studio').evaluate('(x)=>x.hidden')
        assert await page.locator('#atlasCanvas').is_visible()
        assert await page.locator('#hudIdeaCount').inner_text()=='4 ideas'
        diag=await page.evaluate('EvolutionRigTest.getAtlasDiagnostics()')
        assert diag['nodeCount']==4 and diag['edgeCount']==3,diag
        # The HUD drives the existing causal-map handlers; state is unchanged.
        before=diag['zoom']
        await page.locator('#hudZoomIn').click()
        assert (await page.evaluate('EvolutionRigTest.getAtlasDiagnostics()'))['zoom']>before
        await page.locator('#hudFit').click()
        assert abs((await page.evaluate('EvolutionRigTest.getAtlasDiagnostics()'))['zoom']-1)<.001
        root=next(x for x in (await page.evaluate('EvolutionRigTest.getAtlasDiagnostics().points')) if x['generation']==0)
        box=await page.locator('#atlasCanvas').bounding_box()
        await page.mouse.click(box['x']+root['x'],box['y']+root['y'])
        assert (await page.evaluate('EvolutionRigTest.getAtlasDiagnostics()'))['selectedId']==root['id']
        await page.locator('#hudTrace').click()
        assert (await page.evaluate('EvolutionRigTest.getAtlasDiagnostics()'))['zoom']>1
        await page.locator('#hudFit').click()
        await page.locator('#atlasDepth').fill('0')
        await page.locator('#atlasDepth').dispatch_event('input')
        assert (await page.evaluate('EvolutionRigTest.getAtlasDiagnostics()'))['displayed']==1
        await page.locator('#atlasUnfoldAll').click()
        assert (await page.evaluate('EvolutionRigTest.getAtlasDiagnostics()'))['displayed']==4
        await page.screenshot(path=str(ROOT/'tests'/'immersive-desktop-populated.png'))
        # Real board switching still isolates both graphs; Escape restores the field.
        await page.locator('#hudBoards').click()
        await page.locator('#boardForm [name=title]').wait_for(state='visible')
        assert await page.locator('#main').evaluate('(x)=>x.inert')
        await page.keyboard.press('Escape')
        assert not await page.locator('#main').evaluate('(x)=>x.inert')
        assert await page.locator('#workspaceRail').evaluate('(x)=>x.inert')
        # View preference is independent of workspace schema/state and persists on reload.
        await page.locator('#hudWorkbench').click()
        await page.set_content(HTML,wait_until='load')
        assert 'mode-immersive' not in await page.locator('body').get_attribute('class')
        assert (await page.evaluate('EvolutionRigTest.getPublicState()'))['ideas']==4
        await page.locator('#resumeImmersion').click()
        assert 'mode-immersive' in await page.locator('body').get_attribute('class')
        assert (await page.evaluate('EvolutionRigTest.getPublicState()'))['ideas']==4
        for w,h in [(1440,900),(1300,850),(1024,768),(390,844),(375,667),(320,568),(720,400)]:
            await page.set_viewport_size({'width':w,'height':h})
            await page.wait_for_timeout(70)
            b=await page.evaluate(BUDGET)
            assert b['areaFraction']<.30,(w,h,b)
            assert abs(b['canvasWidth']-b['viewportWidth'])<=1,(w,h,b)
            assert abs(b['canvasHeight']-b['viewportHeight'])<=1,(w,h,b)
            assert not b['pageOverflow'],(w,h,b)
            if w==390:await page.screenshot(path=str(ROOT/'tests'/'immersive-mobile-populated.png'))
            print(f'VIEWPORT {w}x{h}: {b["areaFraction"]*100:.1f}% always-visible interface; field full viewport')
        # At touch width, the mode button remains reachable, the board drawer opens,
        # and the original controls return without an invisible trap.
        await page.locator('#hudBoards').click()
        await page.locator('#boardForm [name=title]').wait_for(state='visible')
        await page.locator('#hudScrim').click(position={'x':min(715,720-5),'y':200},force=True)
        assert not await page.locator('#main').evaluate('(x)=>x.inert')
        await page.locator('#hudWorkbench').click()
        assert await page.locator('#viewTabs').is_visible()
        await page.emulate_media(reduced_motion='reduce')
        await page.locator('#resumeImmersion').click()
        assert await page.locator('#atlasCanvas').is_visible()
        assert not errors,errors
        await ctx.close();await browser.close()
        print('PASS: measured <30% persistent UI including empty state; interactive field, board/seed, zoom, trace, depth, notebook, drawer, accessibility Escape, all legacy views, persisted preferences, mobile and reduced motion')
if __name__=='__main__':asyncio.run(main())
