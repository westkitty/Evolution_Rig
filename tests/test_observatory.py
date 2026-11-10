"""Actual browser validation of the data-backed Causal Observatory overlay.
Never tests art through nonexistent DOM snapshots: exercises real pointer, slider,
keyboard, board switching, and compatibility with original operational controls."""
import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright
from test_browser import STORAGE_SHIM
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')

async def main():
    errors=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,headless=True,args=['--no-sandbox'])
        ctx=await browser.new_context(viewport={'width':1420,'height':970})
        page=await ctx.new_page()
        page.on('pageerror',lambda e:errors.append(str(e)))
        await page.evaluate(STORAGE_SHIM)
        await page.set_content(HTML,wait_until='load')
        await page.locator('#hudWorkbench').click() # Test the preserved full workbench
        assert await page.locator('#atlasCanvas').count()==1
        assert (await page.locator('#atlasFocusTitle').inner_text())=='No idea selected.'
        assert (await page.evaluate('EvolutionRigTest.getAtlasDiagnostics()'))['nodeCount']==0
        await page.locator('#boardForm [name=title]').fill('Field atlas research')
        await page.locator('#boardForm [name=objective]').fill('Compare practical offline field triage mechanisms while preserving auditable evidence and useful ancestry.')
        await page.locator('#boardForm button[type=submit]').click()
        await page.locator('#newSeed').click()
        strong=json.loads(__import__('subprocess').check_output(['node','-e',"console.log(JSON.stringify(require('./source/core.js').TEST_IDEAS.strong))"],cwd=ROOT,text=True))
        for name,value in strong.items():await page.locator(f'#ideaForm [name="{name}"]').fill(value)
        await page.locator('#submitIdea').click()
        assert (await page.evaluate('EvolutionRigTest.getAtlasDiagnostics()'))['nodeCount']==1
        assert (await page.locator('#atlasAncestorCount').inner_text())=='0'
        await page.locator('#branchCount').fill('2')
        await page.locator('#branchSelected').click()
        dia=await page.evaluate('EvolutionRigTest.getAtlasDiagnostics()')
        assert dia['nodeCount']==3 and dia['edgeCount']==2,dia
        assert (await page.locator('#atlasDescendantCount').inner_text())=='0'
        await page.locator('#atlasUnfoldAll').click()
        await page.locator('#atlasDepth').fill('0')
        await page.locator('#atlasDepth').dispatch_event('input')
        diag=await page.evaluate('EvolutionRigTest.getAtlasDiagnostics()')
        assert diag['depthCap']==0 and diag['displayed']==1,diag
        assert 'THROUGH / GEN 00' in await page.locator('#atlasDepthLabel').inner_text()
        await page.locator('#atlasUnfoldAll').click()
        assert (await page.evaluate('EvolutionRigTest.getAtlasDiagnostics()'))['displayed']==3
        # Actual pixel-to-node hit target, not merely an event handler assertion.
        points=await page.evaluate('EvolutionRigTest.getAtlasDiagnostics().points')
        root=next(x for x in points if x['generation']==0)
        box=await page.locator('#atlasCanvas').bounding_box()
        await page.mouse.click(box['x']+root['x'],box['y']+root['y'])
        assert (await page.evaluate('EvolutionRigTest.getAtlasDiagnostics()'))['selectedId']==root['id']
        assert (await page.locator('#atlasDescendantCount').inner_text())=='2'
        assert (await page.locator('#atlasIndex [aria-current="true"]').count())==1
        await page.locator('#atlasFocus').click()
        focused=await page.evaluate('EvolutionRigTest.getAtlasDiagnostics()')
        assert focused['zoom']>1.1 and focused['depthCap'] is None,focused
        await page.locator('#atlasZoomOut').click()
        assert (await page.evaluate('EvolutionRigTest.getAtlasDiagnostics()'))['zoom']<focused['zoom']
        await page.locator('#atlasReset').click()
        assert abs((await page.evaluate('EvolutionRigTest.getAtlasDiagnostics()'))['zoom']-1)<.001
        await page.locator('#atlasCanvas').focus()
        await page.keyboard.press('ArrowRight')
        assert (await page.evaluate('EvolutionRigTest.getAtlasDiagnostics()'))['selectedId']!=root['id']
        # Tablist keyboard navigation reaches every original work area.
        await page.locator('[data-view="studio"]').focus()
        await page.keyboard.press('ArrowRight')
        assert await page.locator('[data-view="jury"]').get_attribute('aria-selected')=='true'
        await page.keyboard.press('Home')
        assert await page.locator('[data-view="studio"]').get_attribute('aria-selected')=='true'
        # Reduced-motion preference leaves the same data and controls operable.
        await page.emulate_media(reduced_motion='reduce')
        assert (await page.evaluate('EvolutionRigTest.getAtlasDiagnostics()'))['nodeCount']==3
        # Original Studio still operates after canvas interactions.
        assert not await page.locator('#branchSelected').is_disabled()
        await page.locator('#branchSelected').click()
        assert await page.locator('#statTotal').inner_text()=='5'
        assert (await page.evaluate('EvolutionRigTest.getAtlasDiagnostics()'))['nodeCount']==5
        await page.locator('#boardForm [name=title]').fill('No shared data')
        await page.locator('#boardForm [name=objective]').fill('Independent field research.')
        await page.locator('#boardForm button[type=submit]').click()
        assert (await page.evaluate('EvolutionRigTest.getAtlasDiagnostics()'))['nodeCount']==0
        assert await page.locator('#statTotal').inner_text()=='0'
        assert await page.locator('#atlasIndex button').count()==0
        await page.locator('.board-entry').first.click()
        assert (await page.evaluate('EvolutionRigTest.getAtlasDiagnostics()'))['nodeCount']==5
        # A meaningful mobile affordance: existing boards do not bury work below a creation form.
        mctx=await browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True)
        mobile=await mctx.new_page();await mobile.evaluate(STORAGE_SHIM)
        workspace=await page.evaluate('JSON.stringify(JSON.parse(localStorage.getItem("evolution-rig:state:v1")))')
        await mobile.evaluate('(s)=>localStorage.setItem("evolution-rig:state:v1",s)',workspace)
        await mobile.set_content(HTML,wait_until='load')
        await mobile.locator('#hudWorkbench').click()
        assert not await mobile.locator('#boardComposer').get_attribute('open')
        assert not await mobile.evaluate('document.documentElement.scrollWidth>document.documentElement.clientWidth')
        assert await mobile.locator('#atlasCanvas').is_visible()
        await mobile.locator('#boardComposer summary').click()
        assert await mobile.locator('#boardForm [name=title]').is_visible()
        assert not errors,errors
        await mctx.close();await ctx.close();await browser.close()
        print('PASS: actual atlas pointer hit, selection sync, lineage, depth reveal, focus/zoom/fit, keyboard, core flows, board isolation, responsive/expandable mobile entry; no page errors')

if __name__=='__main__':asyncio.run(main())
