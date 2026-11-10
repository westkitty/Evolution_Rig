"""Deterministic Chromium performance benchmark (managed browser set_content)."""
import asyncio, json, statistics, sys, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
SHIM="""() => { const store={}; Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>Object.hasOwn(store,k)?store[k]:null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k]}}); Object.defineProperty(window,'sessionStorage',{configurable:true,value:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}}); }"""

def fixture(n):
    b={'id':'b-bench','title':'Performance board','objective':'Find offline-first operator tools with measurable reductions in repetitive work and bounded deployment plans.','createdAt':'2026-11-09T00:00:00Z'}
    ideas=[]
    for i in range(n):
        family=i%12
        ideas.append({'id':f'i-{i}', 'boardId':b['id'], 'parents':[f'i-{i-12}'] if i>=12 else [], 'generation':i//12, 'createdAt':f'2026-11-09T00:{i%60:02}:00Z','status':'active','source':'synthetic','overrides':{},'history':[],
        'title':f'Offline intake method {i} division {family}',
        'problem':f'Technicians in region {family} repeat error-prone reporting because written evidence and their records are scattered and unreliable in cramped field conditions.',
        'audience':'Field maintenance technicians working without wireless access in regional repair stations.',
        'mechanism':f'Local evidence viewer for route {family} presents a tiny checklist, captures observations and links each specific trial to the preceding recorded decision and source.',
        'difference':f'Instead of a centralized service, option {i} keeps audit records on device with a reversible pilot and explicit branch evidence.',
        'plan':'Create a standalone offline page, test the first three workflows, then trial with five staff and compare the resulting decision records.',
        'validation':'Compare the median intake latency before and after over fifteen examples and record missed evidence and wrong decisions.',
        'benefit':'Reduce repeated intake time 25 percent for a small maintenance team while retaining transparent recovery evidence.',
        'constraints':'Use no servers, accounts, paid dependencies or unnecessary build requirements.',
        'risks':'Local storage loss is possible; export regular backups and label uncertain diagnostic suggestions.'})
    return {'schema':1,'boards':[b],'ideas':ideas,'selectedBoardId':b['id'],'selectedIdeaId':ideas[-1]['id'],'preferences':{'stepsPerHour':12,'secondsBetween':30,'populationCap':250,'pruneThreshold':7}}

async def run():
    result={}
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,headless=True,args=['--no-sandbox'])
        for n in (60,180):
            page=await browser.new_page(viewport={'width':1380,'height':920})
            await page.evaluate(SHIM)
            await page.evaluate('(state) => localStorage.setItem("evolution-rig:state:v1",JSON.stringify(state))',fixture(n))
            begin=time.perf_counter()
            await page.set_content(HTML,wait_until='load',timeout=120000)
            end=time.perf_counter()
            await page.wait_for_function('document.querySelectorAll(".idea-card").length>0',timeout=120000)
            samples=[]
            for j in range(4):
                duration=await page.evaluate('''() => {const inp=document.querySelector('#nodeSearch');inp.value='';const start=performance.now();inp.dispatchEvent(new Event('input',{bubbles:true}));return performance.now()-start;}''')
                samples.append(duration)
            graph_count=await page.locator('.idea-card').count()
            result[n]={'initial_load_ms':round((end-begin)*1000,1),'graph_filter_median_ms':round(statistics.median(samples),1),'graph_filter_runs_ms':[round(x,1) for x in samples], 'rendered_cards':graph_count}
            await page.close()
        await browser.close()
    print(json.dumps(result,indent=2))
    return result
if __name__=='__main__': asyncio.run(run())
