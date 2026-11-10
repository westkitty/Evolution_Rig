"""End-to-end Lab proof in managed Chromium; browser storage is shimmed (real-origin separate)."""
import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright
from test_browser import STORAGE_SHIM
from test_immersive import BUDGET
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
async def section(page, name):
    await page.locator(f'#rigLabNav [data-lab-section="{name}"]').click()
    assert await page.locator(f'#rigLabNav [data-lab-section="{name}"]').get_attribute('aria-current')=='true'
async def snapshot(page):
    return await page.evaluate('JSON.parse(localStorage.getItem("evolution-rig:state:v1"))')
async def main():
    errors=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,headless=True,args=['--no-sandbox'])
        ctx=await browser.new_context(viewport={'width':1280,'height':800},accept_downloads=True)
        page=await ctx.new_page();page.set_default_timeout(7000)
        page.on('pageerror',lambda err:errors.append(str(err)))
        await page.evaluate(STORAGE_SHIM)
        await page.set_content(HTML,wait_until='load')
        assert not errors,errors
        await page.locator('#hudLab').click()
        assert await page.locator('#rigLab').evaluate('(x)=>x.open')
        assert await page.locator('#rigLabNav button').count()==17
        assert 'three-step' in (await page.locator('#rigLabBody').inner_text()).lower()
        await page.keyboard.press('Escape')
        assert not await page.locator('#rigLab').evaluate('(x)=>x.open')
        assert (await page.evaluate(BUDGET))['areaFraction']<.30
        await page.locator('#hudStarters').click()
        await page.locator('[data-starter-id="offline-handoff"]').click()
        await page.locator('#starterNewBoard').click()
        s=await snapshot(page); assert len(s['boards'])==len(s['ideas'])==1
        root=s['ideas'][0]['id']; rootboard=s['boards'][0]['id']
        await page.locator('#hudLab').click()
        await section(page,'rules')
        await page.locator('[data-lab-form="rule"] [name="kind"]').select_option('include')
        await page.locator('[data-lab-form="rule"] [name="phrase"]').fill('offline')
        await page.locator('[data-lab-form="rule"] button[type="submit"]').click()
        s=await snapshot(page); assert s['boards'][0]['rules'][0]['phrase']=='offline'
        await section(page,'evidence')
        await page.locator('[data-lab-form="evidence"] [name="status"]').select_option('observed')
        await page.locator('[data-lab-form="evidence"] [name="hypothesis"]').fill('Example conditions have a measurable difference')
        await page.locator('[data-lab-form="evidence"] [name="result"]').fill('Observed one manual run')
        await page.locator('[data-lab-form="evidence"] button[type="submit"]').click()
        s=await snapshot(page); assert len(s['ideas'][0]['experiments'])==1
        assert s['ideas'][0]['experiments'][0]['status']=='observed'
        await section(page,'review')
        assert 'computed' not in (await page.locator('#rigLabBody').inner_text()).lower()
        await page.locator('[data-lab-form="review"] [name="originality"]').select_option('4')
        await page.locator('[data-lab-form="review"] [name="feasibility"]').select_option('2')
        await page.locator('[data-lab-form="review"] button[type="submit"]').click()
        s=await snapshot(page);assert s['ideas'][0]['reviews'][0]['originality']==4
        await section(page,'export')
        async with page.expect_download() as d:
            await page.locator('[data-lab-action="brief"]').click()
        assert (await d.value).suggested_filename.endswith('-candidate-brief.md')
        await section(page,'compass')
        assert await page.locator('.lab-plot').count()==1
        await section(page,'recovery')
        assert await page.locator('[data-lab-action="checkpoint"]').count()==1
        await page.locator('#labClose').click()
        await page.locator('#hudWorkbench').click()
        await page.locator('#branchSelected').click()
        await page.wait_for_function('document.getElementById("statTotal").textContent==="4"')
        s=await snapshot(page);assert len(s['ideas'])==4
        for i in s['ideas'][1:]:assert any(h['kind']=='diversity.lexical' for h in i['history'])
        await page.locator('#newSeed').click()
        await page.locator('#ideaForm [name="title"]').fill('A second root for analysis')
        await page.locator('#submitIdea').click()
        await page.locator('#workbenchLab').click()
        await section(page,'diversity')
        await page.locator('[data-lab-form="diversity"] [name="style"]').select_option('explore')
        await page.locator('[data-lab-form="diversity"] button[type="submit"]').click()
        assert (await snapshot(page))['boards'][0]['generationStyle']=='explore'
        await section(page,'compare')
        options=await page.locator('[data-lab-form="compare"] select').count();assert options==3
        ids=[x['id'] for x in (await snapshot(page))['ideas']]
        await page.locator('[data-lab-form="compare"] [name="pick0"]').select_option(ids[0])
        await page.locator('[data-lab-form="compare"] [name="pick1"]').select_option(ids[1])
        await page.locator('[data-lab-form="compare"] button[type="submit"]').click()
        assert await page.locator('#rigLabBody table th').count()>2
        await section(page,'sky')
        await page.locator('[data-lab-action="semantic"]').click()
        diag=await page.evaluate('EvolutionRigTest.getAtlasDiagnostics()')
        assert 'semanticEdgeCount' in diag
        await section(page,'lineage')
        assert await page.locator('.lab-row').count()>0
        await section(page,'search')
        await page.locator('[data-lab-form="search"] [name="query"]').fill('offline')
        await page.locator('[data-lab-form="search"] button[type="submit"]').click()
        assert await page.locator('[data-lab-action="select"]').count()>0
        await section(page,'usage')
        await page.locator('[data-lab-form="usage"] [name="allow"]').check()
        await page.locator('[data-lab-form="usage"] [name="cap"]').fill('2')
        await page.locator('[data-lab-form="usage"] button[type="submit"]').click()
        assert '2' in await page.locator('#rigLabBody').inner_text()
        await section(page,'autopilot')
        assert 'First parent' in await page.locator('#rigLabBody').inner_text()
        await section(page,'scale')
        await page.locator('[data-lab-action="benchmark"]').click()
        assert 'Derived' in await page.locator('#labBenchmark').inner_text()
        await page.locator('#labClose').click()
        # Edit and undo through the native idea editor and the Lab.
        await page.locator('#graphLayout [data-node]').first.click()
        selected=(await page.evaluate('EvolutionRigTest.getAtlasDiagnostics()'))['selectedId']
        before=(await snapshot(page));beforeTitle=next(i for i in before['ideas'] if i['id']==selected)['title']
        await page.locator('[data-action="edit"]').click()
        await page.locator('#ideaForm [name="title"]').fill('Edited for undo test')
        await page.locator('#submitIdea').click()
        await page.locator('#workbenchLab').click()
        await section(page,'history')
        assert await page.locator('[data-lab-action="undo"]').count()>=1
        page.once('dialog',lambda d:asyncio.create_task(d.accept()))
        await page.locator('[data-lab-action="undo"]').first.click()
        s=await snapshot(page);assert next(i for i in s['ideas'] if i['id']==selected)['title']==beforeTitle
        await page.locator('#labClose').click()
        # Two-board copy as independent root.
        await page.locator('#boardForm [name="title"]').fill('Second universe')
        await page.locator('#boardForm [name="objective"]').fill('Explore a distinct goal')
        await page.locator('#boardForm button[type="submit"]').click()
        await page.locator('#boardList .board-entry').first.click()
        await page.locator(f'#graphLayout [data-node="{selected}"]').click()
        await page.locator('#workbenchLab').click()
        await section(page,'reuse')
        assert await page.locator('[data-lab-form="copy"] select').count()==1
        await page.locator('[data-lab-form="copy"] button[type="submit"]').click()
        s=await snapshot(page);assert len(s['boards'])==2
        assert s['ideas'][-1]['parents']==[]
        assert s['ideas'][-1]['sourceLink']['ideaId']==selected
        assert s['ideas'][-1]['boardId']!=rootboard
        await page.locator('#labClose').click()
        assert not errors,errors
        await browser.close()
        print('PASS: Evolution Lab UI; rule, evidence, human reviews, exports, comparison, Pareto, search, semantic overlay, lineage, automatic novelty receipts, undo, re-use, autopilot preview, usage, performance and 30% layout')
if __name__=='__main__':asyncio.run(main())
