/* Evolution Rig browser UI. No npm, server, CDN, or framework. */
(function () {
'use strict';
const C=globalThis.RigCore;
if(!C)throw Error('Core library failed to load');
const $=id=>document.getElementById(id);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time=s=>{try{return new Date(s).toLocaleString();}catch{return String(s||'unknown');}};
const STORE='evolution-rig:state:v1', CONF_STORE='evolution-rig:config:v1', KEY_PREFIX='evolution-rig:secret:';
const PRESETS={
 offline:{endpoint:'',model:''},
 ollama:{endpoint:'http://127.0.0.1:11434/api/chat',model:'gemma3:4b'},
 lmstudio:{endpoint:'http://127.0.0.1:1234/v1/chat/completions',model:'loaded-model-id'},
 mlx:{endpoint:'http://127.0.0.1:8080/v1/chat/completions',model:'loaded-model-id'},
 openrouter:{endpoint:'https://openrouter.ai/api/v1/chat/completions',model:'openai/gpt-4.1-mini'},
 anthropic:{endpoint:'https://api.anthropic.com/v1/messages',model:'claude-sonnet-4-5'},
 openai:{endpoint:'https://api.openai.com/v1/chat/completions',model:'gpt-4.1-mini'},
 azure:{endpoint:'https://YOUR-RESOURCE.openai.azure.com/openai/deployments/YOUR-DEPLOYMENT/chat/completions?api-version=2024-10-21',model:'YOUR-DEPLOYMENT'}
};
const defaultPrefs={stepsPerHour:12,secondsBetween:30,populationCap:24,pruneThreshold:7};
let volatile=false, selectedView='studio', boardInDialog=null, editingId=null, picked=[], mode='idle', busy=false, autoTimer=null, autoStep=0, runtimeLogs=[];
let calibrator=C.anchors();
let lab=null; // Initialized after original app functions, before first render.
// The observatory is a second, non-authoritative view onto the existing graph.
// No board data or model credentials are copied into the visualization.
const observatory=globalThis.RigObservatory.createObservatory($('atlasCanvas'),setSelection);
let atlasDepthChoice=null;
function traceDescendants(id,ideas){
 const childIds=new Map();
 for(const idea of ideas)for(const parent of idea.parents){if(!childIds.has(parent))childIds.set(parent,[]);childIds.get(parent).push(idea.id);}
 const found=new Set(),todo=[id];
 while(todo.length){for(const child of childIds.get(todo.pop())||[]){if(!found.has(child)){found.add(child);todo.push(child);}}}
 found.delete(id);return ideas.filter(i=>found.has(i.id));
}
function renderObservatory(){
 const board=currentBoard(),ideas=currentIdeas(),selected=selectedIdea(),snapshot=getJurySnapshot();
 observatory.update(ideas,selected?.id||null,snapshot.verdicts,snapshot.gold);
 const count=ideas.length,archived=ideas.filter(i=>i.status==='archived').length;
 const roots=ideas.filter(i=>i.parents.length===0).length;
 const links=ideas.reduce((n,i)=>n+i.parents.length,0);
 const deepest=ideas.length?Math.max(...ideas.map(i=>i.generation)):0;
 const maxDepth=ideas.length?Math.max(...ideas.map(i=>i.generation)):0;
 $('atlasDepth').max=maxDepth; $('atlasDepth').disabled=!ideas.length||maxDepth===0;
 $('atlasDepth').value=atlasDepthChoice===null?maxDepth:Math.min(maxDepth,atlasDepthChoice);
 $('atlasUnfoldAll').disabled=!ideas.length||maxDepth===0;
 const shownDepth=atlasDepthChoice===null?maxDepth:Math.min(maxDepth,atlasDepthChoice);
 const shownIdeas=ideas.filter(i=>i.generation<=shownDepth);
 const shownIds=new Set(shownIdeas.map(i=>i.id));
 const shownLinks=shownIdeas.reduce((n,i)=>n+i.parents.filter(id=>shownIds.has(id)).length,0);
 if(!count){
  $('atlasReadout').innerHTML='<strong>0 IDEAS · 0 LINKS</strong><br>NO RECORDED GENERATIONS';
  $('atlasDepthLabel').textContent='NO GENERATIONS';
 }else{
  $('atlasReadout').innerHTML=`<strong>${shownIdeas.length} / ${ideas.length} IDEAS · ${shownLinks} / ${links} LINKS</strong><br>${shownDepth+1} OF ${maxDepth+1} GENERATIONS DISCLOSED`;
  $('atlasDepthLabel').textContent=atlasDepthChoice===null?'ALL / GEN '+String(maxDepth).padStart(2,'0'):'THROUGH / GEN '+String(shownDepth).padStart(2,'0');
 }
 observatory.setDepth(atlasDepthChoice);
 $('atlasModeLabel').textContent=selected?'TRACE / '+String(selected.generation).padStart(2,'0'):count?'OVERVIEW / ALL GENERATIONS':'UNPOPULATED';
 $('atlasFootSummary').textContent=count?`${roots} roots / ${Math.max(0,count-roots)} descendants / ${archived} archived`:'No generations recorded';
 $('atlasFocus').disabled=!selected;
 const notable=[...ideas].sort((a,b)=>(snapshot.verdicts.get(b.id)?.total||0)-(snapshot.verdicts.get(a.id)?.total||0)||a.createdAt.localeCompare(b.createdAt));
 const index=$('atlasIndex');index.replaceChildren();
 const shown=notable.slice(0,5);
 if(selected&&!shown.some(n=>n.id===selected.id))shown.unshift(selected);
 if(!shown.length){const note=document.createElement('span');note.className='tiny-note';note.textContent='No recorded signals. Add a seed below.';index.append(note);}
 for(const idea of shown){const button=document.createElement('button');button.type='button';button.dataset.atlasSelect=idea.id;button.setAttribute('aria-current',String(selected?.id===idea.id));
  const score=snapshot.verdicts.get(idea.id)?.total||0;button.textContent=score+'/15  ·  '+idea.title;button.title='Select and inspect '+idea.title;index.append(button);}
 if(!selected){
  $('atlasFocusKicker').textContent=count?'SURVEY / NO ACTIVE TRACE':'FIELD REPORT / AWAITING INPUT';
  $('atlasFocusTitle').textContent=count?'The field remembers.':'No idea selected.';
  $('atlasNarrative').textContent=count?`This board has ${count} recorded ideas across ${deepest+1} generation${deepest===0?'':'s'}. ${archived} archived route${archived===1?'':'s'} remain visible. Choose a signal to expose the causal record.`:'Create a board and place a seed. The field will show the lineages you actually construct.';
  $('atlasAncestorCount').textContent=roots;
  $('atlasDescendantCount').textContent=Math.max(0,count-roots);
  $('atlasArchiveCount').textContent=archived;
  $('atlasTraceText').textContent='The jury measures textual structure. No rating proves originality, feasibility or real-world impact.';
  return;
 }
 const byId=Object.fromEntries(ideas.map(i=>[i.id,i]));
 const ancestry=C.familyTree(selected,byId).filter(i=>i.id!==selected.id);
 const descendants=traceDescendants(selected.id,ideas);
 const archivedRelated=descendants.filter(i=>i.status==='archived').length;
 const current=snapshot.verdicts.get(selected.id);
 const sourceParents=selected.parents.map(id=>byId[id]?.title||'missing reference');
 const recent=(selected.history||[]).at(-1);
 const genesis=sourceParents.length===2?`A hybrid built from “${sourceParents[0]}” and “${sourceParents[1]}”.`:sourceParents.length===1?`This branch descends from “${sourceParents[0]}”.`:'A root proposal with no recorded parents.';
 const archiveStatement=archivedRelated?`${archivedRelated} descendant route${archivedRelated===1?' was':'s were'} archived but remain traceable.`:'No descendant routes have been archived.';
 $('atlasFocusKicker').textContent=`RECORD / GENERATION ${String(selected.generation).padStart(2,'0')} / ${selected.status.toUpperCase()}`;
 $('atlasFocusTitle').textContent=selected.title;
 $('atlasNarrative').textContent=`${genesis} ${descendants.length} recorded descendant${descendants.length===1?'':'s'}. ${archiveStatement}`;
 $('atlasAncestorCount').textContent=ancestry.length;
 $('atlasDescendantCount').textContent=descendants.length;
 $('atlasArchiveCount').textContent=archivedRelated;
 const historyText=recent?` Latest recorded event: ${recent.kind} (${time(recent.time)}).`:'';
 const strongestDescendant=descendants.length?[...descendants].sort((a,b)=>(snapshot.verdicts.get(b.id)?.total||0)-(snapshot.verdicts.get(a.id)?.total||0))[0]:null;
 const bestDelta=strongestDescendant?(snapshot.verdicts.get(strongestDescendant.id).total-current.total):null;
 const bestText=strongestDescendant?` Highest-scoring descendant: ${strongestDescendant.title} (${snapshot.verdicts.get(strongestDescendant.id).total}/15, ${bestDelta>0?'+':''}${bestDelta} versus this record).`:'';
 if(selected.generation>shownDepth)$('atlasNarrative').textContent+=' This record lies beyond the currently disclosed depth; reveal all or trace selected to see it.';
 const safety=' A score reflects text structure, not proof of usefulness.';
 $('atlasTraceText').textContent=`Jury ${current?.total??'—'}/15 · originality ${current?.effective?.originality??'—'} · feasibility ${current?.effective?.feasibility??'—'} · impact ${current?.effective?.impact??'—'}.${historyText}${bestText}${safety}`;
}
$('atlasIndex').addEventListener('click',e=>{const el=e.target.closest('[data-atlas-select]');if(el)setSelection(el.dataset.atlasSelect);});
$('atlasDepth').addEventListener('input',e=>{atlasDepthChoice=Math.round(Number(e.target.value));observatory.setDepth(atlasDepthChoice);$('atlasDepthLabel').textContent='THROUGH / GEN '+String(atlasDepthChoice).padStart(2,'0');$('atlasModeLabel').textContent='UNFOLDED / GEN '+String(atlasDepthChoice).padStart(2,'0');renderObservatory();});
$('atlasUnfoldAll').addEventListener('click',()=>{atlasDepthChoice=null;renderObservatory();});
$('atlasZoomIn').addEventListener('click',()=>observatory.zoom(1.25));
$('atlasZoomOut').addEventListener('click',()=>observatory.zoom(.8));
$('atlasReset').addEventListener('click',()=>{atlasDepthChoice=null;observatory.reset();renderObservatory();});
$('atlasFocus').addEventListener('click',()=>{atlasDepthChoice=null;renderObservatory();if(observatory.focus())$('atlasCanvas').focus({preventScroll:true});});

function emptyState(){return {schema:1,boards:[],ideas:[],selectedBoardId:null,selectedIdeaId:null,preferences:{...defaultPrefs}};}
function loadState(){try{const s=localStorage.getItem(STORE);if(s)return C.validateImport(JSON.parse(s));}catch(e){console.warn('Storage read failed',e);}return emptyState();}
let state=loadState();
let config={provider:'offline',endpoint:'',model:'',persistKey:false,profiles:{}};
try{const v=JSON.parse(localStorage.getItem(CONF_STORE)||'null');if(v&&PRESETS[v.provider])config={...config,...v,profiles:v.profiles&&typeof v.profiles==='object'?v.profiles:{}};}catch{}
const keyState={};
function getKey(provider=config.provider){
 if(keyState[provider]!==undefined)return keyState[provider];
 try{const key=sessionStorage.getItem(KEY_PREFIX+provider)||localStorage.getItem(KEY_PREFIX+provider)||'';keyState[provider]=key;return key;}catch{return '';}
}
function saveKey(provider,key,persist){
 keyState[provider]=key;
 try{sessionStorage.removeItem(KEY_PREFIX+provider);localStorage.removeItem(KEY_PREFIX+provider);if(key)(persist?localStorage:sessionStorage).setItem(KEY_PREFIX+provider,key);}catch{notify('Credential storage unavailable; key stays in this page memory only.',true);}
}
function persist(options={}){
 if(!options.preserveJury)invalidateJury();
 if(lab?.crossTabConflict){volatile=true;$('storageNotice').textContent='Another tab changed your workspace; this tab cannot save. Export your edits and reload.';return false;}
 try{localStorage.setItem(STORE,JSON.stringify(state));volatile=false;$('storageNotice').textContent='Local storage active. Export JSON for backup.';if(!options.preserveJury)lab?.scheduleCheckpoint();return true;}
 catch(e){volatile=true;$('storageNotice').textContent='Storage blocked or full: current changes may be lost on reload. Export JSON now.';return false;}
}
function persistConfig(){
 try{localStorage.setItem(CONF_STORE,JSON.stringify(config));}catch{notify('Could not persist model settings in this browser.',true);}
}
function notify(msg,error=false){const el=$('toast');el.textContent=msg;el.classList.toggle('error',error);el.hidden=false;clearTimeout(notify.timer);notify.timer=setTimeout(()=>el.hidden=true,5200);}
function log(msg){runtimeLogs.unshift({at:new Date().toISOString(),msg});runtimeLogs=runtimeLogs.slice(0,150);renderRuntimeLog();}
function renderRuntimeLog(){const el=$('runtimeLog');el.replaceChildren();if(!runtimeLogs.length){el.textContent='No evolution steps yet. Run one step to inspect the process.';return;}
 for(const l of runtimeLogs){const p=document.createElement('p');const s=document.createElement('span');s.textContent='['+time(l.at)+'] ';p.append(s,document.createTextNode(l.msg));el.appendChild(p);}}
function currentBoard(){return state.boards.find(x=>x.id===state.selectedBoardId)||null;}
function currentIdeas(){return state.ideas.filter(i=>i.boardId===state.selectedBoardId);}
function activeIdeas(){return currentIdeas().filter(i=>i.status!=='archived');}
function selectedIdea(){const b=currentBoard();return state.ideas.find(i=>i.id===state.selectedIdeaId && i.boardId===b?.id)||null;}
// One authoritative jury snapshot per board mutation. A 180-node board used to
// rescore all peers repeatedly during one render (and again for every gold query).
let jurySnapshot=null;
function invalidateJury(){jurySnapshot=null;}
function getJurySnapshot(){
 if(jurySnapshot && jurySnapshot.boardId===state.selectedBoardId)return jurySnapshot;
 const ideas=currentIdeas();const verdicts=new Map();
 for(const idea of ideas)verdicts.set(idea.id,C.judge(idea,ideas,calibrator));
 jurySnapshot={boardId:state.selectedBoardId,verdicts,gold:C.goldIds(ideas,calibrator,verdicts)};
 return jurySnapshot;
}
function getScores(idea){return getJurySnapshot().verdicts.get(idea.id)||C.judge(idea,currentIdeas(),calibrator);}
function getGold(){return getJurySnapshot().gold;}
function setSelection(id){if(!currentIdeas().some(i=>i.id===id))return;state.selectedIdeaId=id;persist({preserveJury:true});renderHeader();renderGraph();renderInspector();renderJury();renderObservatory();lab?.refresh();}
function renderHeader(){
 const b=currentBoard(), arr=currentIdeas(), active=activeIdeas(), gold=getGold();
 $('boardKicker').textContent=b?'BOARD / '+b.id.slice(0,11).toUpperCase():'BOARD / NONE';
 $('boardTitle').textContent=b?b.title:'Create a board to begin.';
 $('boardObjective').textContent=b?b.objective:'Define a goal, grow candidate ideas, compare them with an inspectable jury and export a strong candidate as a project.';
 $('statTotal').textContent=arr.length;$('statActive').textContent=active.length;$('statGold').textContent=gold.size;
 $('statGenerations').textContent=arr.length?Math.max(...arr.map(i=>i.generation)):0;
 $('autoStatusLabel').textContent=mode==='running'?'AUTOPILOT / RUNNING':busy?'GENERATING / WAIT': 'AUTOPILOT / IDLE';$('autoDot').classList.toggle('running',mode==='running');
 $('newSeed').disabled=!b;$('branchSelected').disabled=!selectedIdea()||busy;
 $('crossPicked').disabled=picked.length!==2||busy;$('startAuto').disabled=mode==='running'||busy||!active.length;$('stopAuto').disabled=mode!=='running';$('stepOnce').disabled=busy||!active.length;
}
function renderBoardList(){
 const target=$('boardList');target.replaceChildren();
 if(!state.boards.length){const div=document.createElement('div');div.className='tiny-note';div.textContent='No boards yet.';target.append(div);return;}
 for(const b of state.boards){const btn=document.createElement('button');btn.className='board-entry'+(b.id===state.selectedBoardId?' selected':'');btn.dataset.board=b.id;btn.type='button';
 const name=document.createElement('span');name.textContent=b.title;const meta=document.createElement('small');meta.textContent=state.ideas.filter(i=>i.boardId===b.id).length+' IDEAS';btn.append(name,meta);target.append(btn);}
}
function renderGraph(){
 const b=currentBoard(), ideas=currentIdeas(), gold=getGold(), filter=$('nodeFilter').value, query=$('nodeSearch').value.trim().toLowerCase();
 const cards=ideas.filter(i=>(filter==='all'||(filter==='gold'?gold.has(i.id):i.status==='active')) && (!query || (i.title+' '+i.mechanism+' '+i.problem).toLowerCase().includes(query)));
 const layout=$('graphLayout');layout.querySelectorAll('.generation').forEach(el=>el.remove());
 const empty=$('graphEmpty');empty.hidden=cards.length>0;
 if(!cards.length){empty.textContent=!b?'Create a board first.':!ideas.length?'Add your first seed to start an ancestry graph.':'No ideas match this filter.';$('graphEdges').innerHTML='';$('pickedLabel').textContent='PARENTS / '+(picked.length?picked.map(id=>ideas.find(i=>i.id===id)?.title||id).join(' + '):'none');return;}
 const generations=[...new Set(cards.map(i=>i.generation))].sort((a,b)=>a-b);
 for(const gen of generations){const col=document.createElement('div');col.className='generation';const subset=cards.filter(i=>i.generation===gen).sort((a,b)=>getScores(b).total-getScores(a).total || a.createdAt.localeCompare(b.createdAt));
 col.innerHTML=`<div class="generation-head"><span>GEN ${String(gen).padStart(2,'0')}</span><span>${subset.length} NODES</span></div>`;
 for(const i of subset){const v=getScores(i);const node=document.createElement('article');node.className='idea-card'+(i.id===state.selectedIdeaId?' selected':'')+(i.status==='archived'?' archived':'');node.tabIndex=0;node.setAttribute('role','button');node.draggable=true;node.dataset.node=i.id;node.setAttribute('aria-label',`Select ${i.title}; score ${v.total} of 15; drag onto another card to crossbreed`);
 node.innerHTML=`<div class="card-head"><div class="card-title">${escape(i.title)}</div><span class="badge ${gold.has(i.id)?'gold':''}">${gold.has(i.id)?'GOLD':i.status==='archived'?'ARCHIVE':'GEN '+i.generation}</span></div><div class="card-desc">${escape(i.problem || i.mechanism || 'No problem or mechanism defined yet.')}</div><div class="micro-score"><b>${v.total}/15</b> <span>O${v.effective.originality} F${v.effective.feasibility} I${v.effective.impact}</span> ${i.parents.length>1?' / HYBRID':''}</div>`;
 col.append(node);
 }
 layout.append(col);
 }
 $('pickedLabel').textContent='PARENTS / '+(picked.length?picked.map(id=>ideas.find(i=>i.id===id)?.title||id).join(' + '):'none');
 requestAnimationFrame(drawEdges);
}
function drawEdges(){
 const svg=$('graphEdges'),layout=$('graphLayout');svg.innerHTML='';
 const rect=layout.getBoundingClientRect();svg.setAttribute('viewBox',`0 0 ${Math.ceil(layout.scrollWidth)} ${Math.ceil(layout.scrollHeight)}`);svg.setAttribute('width',layout.scrollWidth);svg.setAttribute('height',layout.scrollHeight);
 const nodes=new Map([...layout.querySelectorAll('.idea-card')].map(el=>[el.dataset.node,el]));
 const NS='http://www.w3.org/2000/svg';
 for(const i of currentIdeas()){
   const to=nodes.get(i.id);if(!to)continue;
   for(const pid of i.parents){const from=nodes.get(pid);if(!from)continue;
    const a=from.getBoundingClientRect(),b=to.getBoundingClientRect();const x1=a.right-rect.left,y1=a.top-rect.top+a.height/2,x2=b.left-rect.left,y2=b.top-rect.top+b.height/2;
    const path=document.createElementNS(NS,'path');const d=Math.max(17,(x2-x1)*.45);path.setAttribute('d',`M${x1},${y1} C${x1+d},${y1} ${x2-d},${y2} ${x2},${y2}`);path.setAttribute('fill','none');path.setAttribute('stroke',i.parents.length>1?'#bba478':'#537a70');path.setAttribute('stroke-width',i.id===state.selectedIdeaId?'2.8':'1.5');path.setAttribute('opacity','.85');svg.append(path);
   }
 }
}
function valueBlock(k,val){const labels={problem:'Problem',audience:'Audience',mechanism:'Mechanism',difference:'Differentiation',plan:'Build path',validation:'Validation',benefit:'Expected benefit',constraints:'Constraints',risks:'Risks'};return `<div class="detail-box"><div class="eyebrow">${labels[k]}</div><p>${escape(val || 'Not specified')}</p></div>`;}
function renderInspector(){
 const el=$('inspector'),idea=selectedIdea();$('inspectId').textContent=idea?idea.id.slice(0,10).toUpperCase():'NO SELECTION';
 if(!idea){el.className='inspector-empty';el.innerHTML='Select an idea node to see its fields, scores, overrides, history and lineage.';return;}
 el.className='inspector';const jury=getScores(idea), gold=getGold(), byId=Object.fromEntries(currentIdeas().map(i=>[i.id,i]));const chain=C.familyTree(idea,byId);
 const overrides=C.METRICS.map(m=>`<label>${m.slice(0,1).toUpperCase()+m.slice(1)}<select data-override="${m}" aria-label="Override ${m} score"><option value="auto" ${!idea.overrides?.[m]?'selected':''}>Auto (${jury.computed[m]})</option>${[1,2,3,4,5].map(n=>`<option value="${n}" ${idea.overrides?.[m]===n?'selected':''}>${n} / 5</option>`).join('')}</select></label>`).join('');
 const parents=idea.parents.map(id=>byId[id]).filter(Boolean);
 const delta=C.lineageDelta(idea,parents);
 const strongestParent=parents.reduce((best,parent)=>Math.max(best,getScores(parent).total),0);
 const scoreChange=jury.total-strongestParent;
 const lens=parents.length?`<details class="detail-box evolution-lens" open><summary><strong>EVOLUTION LENS</strong> / ${parents.length===2?'HYBRID':'BRANCH'} RECEIPT</summary>
  <p class="hint">Current ${jury.total}/15 vs strongest parent ${strongestParent}/15: <strong class="${scoreChange>0?'gain':scoreChange<0?'loss':''}">${scoreChange>0?'+':''}${scoreChange} points</strong> (same peer set).</p>
  <p class="hint">Changed fields vs ${parents.length===2?'both parents':'parent'}: ${delta.changedFields.map(escape).join(', ')||'none clearly detected'}.</p>
  <p class="hint">New mechanism terms: ${delta.newMechanismTerms.map(escape).join(' · ')||'none detected'}.</p>
  <p class="tiny-note">Word-level comparison only. A score increase or unfamiliar phrase does not prove a better real-world idea.</p></details>`:'';
 const history=(idea.history||[]).slice(-14).reverse().map(h=>`${time(h.time)} / ${h.kind}\n${JSON.stringify(h.details).slice(0,1200)}`).join('\n\n');
 el.innerHTML=`<div class="bar"><span class="badge ${gold.has(idea.id)?'gold':''}">${gold.has(idea.id)?'GOLD / SHORTLISTED':idea.status==='archived'?'ARCHIVED':'ACTIVE'}</span><span class="chip">GEN ${idea.generation}</span><span class="tiny-note">${escape(idea.source)}</span></div>
 <h2>${escape(idea.title)}</h2><p class="hint">Created ${escape(time(idea.createdAt))}</p>
 <div class="total-display"><span class="eyebrow">JURY TOTAL</span><strong>${jury.total}<small style="font-size:15px">/15</small></strong></div>
 ${lens}
 ${C.METRICS.map(m=>`<div class="metric"><span style="text-transform:capitalize">${m}</span><strong>${jury.effective[m]}/5</strong><div class="bar-bg"><i class="${idea.overrides?.[m]?'overridden':''}" style="width:${jury.effective[m]*20}%"></i></div></div>`).join('')}
 <div class="bar" style="margin-top:16px"><button class="sm primary" data-action="branch" ${busy?'disabled':''}>Branch this idea</button><button class="sm" data-action="edit">Edit fields</button><button class="sm" data-action="pick">${picked.includes(idea.id)?'Unpick parent':'Pick parent'}</button><button class="sm ${idea.status==='archived'?'':'danger'}" data-action="archive">${idea.status==='archived'?'Restore':'Archive'}</button></div>
 <div class="two-action" style="margin-top:9px"><button data-action="exportZip" ${gold.has(idea.id)?'':'disabled title="Gold qualification required"'}>Export gold ZIP</button><button data-action="exportFolder" ${gold.has(idea.id)?'':'disabled title="Gold qualification required"'}>Export to folder</button></div>
 ${!gold.has(idea.id)?'<p class="tiny-note">Gold needs 13+/15, no metric below 4, passing anchors, no later non-improving near-duplicate, and an available top-decile slot. Manual overrides remain visible in the jury history.</p>':''}
 <div class="detail-box"><div class="eyebrow">MANUAL JURY OVERRIDE</div><p class="hint">Select 1-5 or revert to auto. Only your explicit changes override computed values.</p><div class="score-override">${overrides}</div><label style="margin-top:10px">Reason for override (recommended)<input id="overrideReason" placeholder="Why should the score differ?"></label></div>
 ${['problem','audience','mechanism','difference','plan','validation','benefit','constraints','risks'].map(k=>valueBlock(k,idea[k])).join('')}
 <div class="detail-box"><div class="eyebrow">FULL ANCESTRY / ${chain.length} NODES</div><div class="lineage">${chain.map(x=>`<button class="ancestor" data-ancestor="${escape(x.id)}" title="Select ancestor">${escape('G'+x.generation+' / '+x.title)}</button>`).join('')}</div></div>
 <div class="detail-box"><div class="eyebrow">CURRENT INSPECTABLE VERDICT</div><div class="code-log">${jury.notes.map(t=>`<div>${escape(t)}</div>`).join('')}<div>Peer similarity: ${jury.raw.overlap}. All fields and anchor baselines are inspectable in Jury.</div></div></div>
 <div class="detail-box"><div class="eyebrow">EVENT HISTORY</div><div class="code-log">${escape(history||'No recorded events yet.')}</div></div>`;
}
function renderJury(){
 const target=$('juryRows'),arr=currentIdeas(),gold=getGold();target.replaceChildren();
 if(!arr.length){const tr=document.createElement('tr');tr.innerHTML='<td colspan="7" class="muted">No candidates in the selected board.</td>';target.append(tr);return;}
 arr.sort((a,b)=>getScores(b).total-getScores(a).total || a.createdAt.localeCompare(b.createdAt));
 for(const i of arr){const j=getScores(i),tr=document.createElement('tr');tr.innerHTML=`<td><button class="ghost sm" data-jury-id="${escape(i.id)}">${escape(i.title)}</button><br><small>${i.status==='archived'?'ARCHIVED':i.parents.length>1?'HYBRID':'GEN '+i.generation}</small></td><td>${escape(i.source)}</td><td>${j.effective.originality}${i.overrides.originality?' *':''}</td><td>${j.effective.feasibility}${i.overrides.feasibility?' *':''}</td><td>${j.effective.impact}${i.overrides.impact?' *':''}</td><td><strong>${j.total}/15</strong></td><td>${gold.has(i.id)?'<span class="badge gold">GOLD</span>':i.status==='archived'?'Archived':'Review'}</td>`;target.append(tr);}
}
function renderAnchors(){
 calibrator=C.anchors();$('calibrationBadge').textContent=calibrator.passes?'ANCHORS / PASS':'ANCHORS / FAIL';$('calibrationBadge').style.color=calibrator.passes?'var(--accent)':'var(--red)';
 $('anchorCards').innerHTML=['weak','medium','strong'].map(name=>{
  const total=calibrator.totals[name],scores=calibrator.scores[name];return `<div class="cal-card"><div class="eyebrow">${name.toUpperCase()} / FIXED FIXTURE</div><strong>${total}<span style="font-size:14px"> / 15</span></strong><p>${escape(C.TEST_IDEAS[name].title)}</p><div class="micro-score" style="margin-top:12px">O${scores.originality} / F${scores.feasibility} / I${scores.impact}</div></div>`;
 }).join('');
 $('anchorCards').innerHTML+=`<div class="cal-card"><div class="eyebrow">NEGATIVE CONTROL / PADDING</div><strong>${calibrator.paddingTotal}<span style="font-size:14px"> / 15</span></strong><p>Repeated boilerplate must not qualify as a strong idea.</p><div class="micro-score" style="margin-top:12px">REQUIRED ≤ 11 / 15</div></div>`;
}
function pickIdea(id){const item=currentIdeas().find(i=>i.id===id);if(!item)return;if(picked.includes(id))picked=picked.filter(x=>x!==id);else if(picked.length>=2)picked=[picked[1],id];else picked.push(id);renderHeader();renderGraph();renderInspector();}
function openIdeaDialog(item=null){
 if(!currentBoard())return notify('Create a board first.',true);
 editingId=item?.id||null;boardInDialog=state.selectedBoardId;
 $('dialogKicker').textContent=item?'EDIT / NODE':'NEW / ROOT SEED';$('dialogTitle').textContent=item?'Edit idea':'Create seed';
 for(const f of C.FIELDS){const field=$('ideaForm').elements.namedItem(f);if(field)field.value=item?.[f]||'';}
 const dlg=$('ideaDialog');if(!dlg.open)dlg.showModal();$('ideaForm').elements.namedItem('title').focus();
}
function closeIdeaDialog(){$('ideaDialog').close();editingId=null;boardInDialog=null;}
function verdictReceipt(item,kind='jury.computed'){
 const v=getScores(item);C.record(item,kind,{computed:v.computed,effective:v.effective,total:v.total,anchorVersion:v.benchmarkVersion,calibrationPass:v.calibrationPass,notes:v.notes});
}
function addIdeas(list,parents,source){
 const board=currentBoard();if(!board)throw Error('No selected board');const existing=currentIdeas();let added=[];
 const gen=parents.length?1+Math.max(...parents.map(id=>existing.find(i=>i.id===id)?.generation??0)):0;
 for(const idea of list){if(!idea.title?.trim())continue;
 const item=C.normalizeIdea(idea,board.id,parents,gen,source);C.record(item,'created',{source,parentIds:parents,boardId:board.id});state.ideas.push(item);added.push(item);}
 if(added.length){invalidateJury();for(const item of added)verdictReceipt(item);state.selectedIdeaId=added[0].id;persist();renderAll();}
 return added;
}
function editIdea(event){event.preventDefault();const data=Object.fromEntries(new FormData($('ideaForm')).entries());
 if(!String(data.title||'').trim())return notify('Title is required.',true);
 if(boardInDialog!==state.selectedBoardId)return notify('Board changed; close and reopen the editor.',true);
 if(editingId){const idea=selectedIdea();if(!idea || idea.id!==editingId)return notify('Edited node is no longer selected.',true);
 lab?.captureEdit(idea);
 for(const f of C.FIELDS)idea[f]=String(data[f]||'').trim().slice(0,f==='title'?160:2000);
 C.record(idea,'fields.edited',{fields:C.FIELDS});invalidateJury();verdictReceipt(idea,'jury.recomputed-after-edit');persist();closeIdeaDialog();renderAll();notify('Idea updated; jury recomputed.');}
 else{const added=addIdeas([data],[],'manual seed');closeIdeaDialog();notify(added.length?'Root seed created.':'No idea created.',!added.length);}
}
function updateOverride(metric,val,reason){
 const idea=selectedIdea();if(!idea||!C.METRICS.includes(metric))return;
 const before=idea.overrides[metric]??'auto';if(val==='auto')delete idea.overrides[metric];else{const n=Number(val);if(!Number.isInteger(n)||n<1||n>5)return;idea.overrides[metric]=n;}
 C.record(idea,'jury.manual-override',{metric,from:before,to:idea.overrides[metric]??'auto',reason:reason.trim()||'No reason supplied'});
 invalidateJury();verdictReceipt(idea,'jury.recomputed-after-override');persist();renderAll();notify('Manual score override recorded.');
}
function archiveIdea(){const idea=selectedIdea();if(!idea)return;idea.status=idea.status==='archived'?'active':'archived';C.record(idea,'status.change',{status:idea.status});persist();renderAll();notify('Idea '+(idea.status==='archived'?'archived; lineage retained.':'restored.'));}
function exportBlob(blob,filename){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);}
function downloadWorkspace(){const safe={schema:C.SCHEMA_VERSION,boards:state.boards,ideas:state.ideas,selectedBoardId:state.selectedBoardId,selectedIdeaId:state.selectedIdeaId,preferences:state.preferences};const blob=new Blob([JSON.stringify(safe,null,2)],{type:'application/json'});exportBlob(blob,'evolution-rig-workspace-'+new Date().toISOString().slice(0,10)+'.json');log('Workspace JSON exported. Model keys excluded.');}
async function importWorkspaceFile(file){
 if(!file)return;try{if(file.size>12000000)throw Error('JSON file is too large (12 MB cap).');const data=C.validateImport(JSON.parse(await file.text()));if(!confirm('Replace all current boards and ideas with this imported workspace? Export a backup first.'))return;
 stopAuto('Stopped for workspace import');atlasDepthChoice=null;state=data;picked=[];persist();renderAll();log('Workspace imported: '+state.boards.length+' boards, '+state.ideas.length+' ideas.');notify('Workspace imported.');}
 catch(e){notify('Import rejected: '+e.message,true);}finally{$('workspaceFile').value='';}
}
function downloadProject(){const idea=selectedIdea();if(!idea)return;if(!getGold().has(idea.id))return notify('Only qualified gold ideas can be exported as projects.',true);
 const project=C.projectFiles(idea,currentBoard(),currentIdeas(),calibrator);exportBlob(C.zipFiles(project.files),project.path+'-handoff.zip');C.record(idea,'project.export',{format:'zip',root:project.path});persist();renderInspector();log('Project ZIP exported for '+idea.title+'.');}
async function exportProjectFolder(){const idea=selectedIdea();if(!idea||!getGold().has(idea.id))return notify('Select a qualified gold idea.',true);
 if(typeof window.showDirectoryPicker!=='function')return notify('Directory write is unavailable in this browser. Use Export gold ZIP.',true);
 try{
   const parent=await window.showDirectoryPicker({mode:'readwrite'});const obj=C.projectFiles(idea,currentBoard(),currentIdeas(),calibrator);
   const suffix=new Date().toISOString().replace(/[-:]/g,'').slice(0,15);const safeRoot=obj.path+'-'+suffix;
   for(const [fileName,content] of Object.entries(obj.files)){
     let dir=await parent.getDirectoryHandle(safeRoot,{create:true});const parts=fileName.split('/').slice(1);const base=parts.pop();
     for(const folder of parts)dir=await dir.getDirectoryHandle(folder,{create:true});
     const handle=await dir.getFileHandle(base,{create:true});const writable=await handle.createWritable();await writable.write(content);await writable.close();
   }
   C.record(idea,'project.export',{format:'directory',root:safeRoot});persist();renderInspector();log('Project folder written: '+safeRoot);notify('Project folder created: '+safeRoot);
 }catch(e){if(e.name==='AbortError')return;notify('Folder export failed: '+e.message,true);}
}
function calcInterval(){const prefs=state.preferences;const perHour=clampNumber(prefs.stepsPerHour,1,120,12),secs=clampNumber(prefs.secondsBetween,5,3600,30);return Math.ceil(Math.max(3600/perHour,secs));}
function clampNumber(val,min,max,fallback){let n=Number(val);return Number.isFinite(n)?Math.min(max,Math.max(min,Math.round(n))):fallback;}
function renderCadence(){for(const id of Object.keys(defaultPrefs))$(id).value=state.preferences[id]??defaultPrefs[id];$('effectiveCadence').textContent=`Effective interval: ${calcInterval()} seconds per step (slower of the hourly cap and minimum-spacing limit).`;
 $('autoStatusLabel').title='While page is open. Browser may throttle or suspend background tabs.';
}
function saveAutopilotPrefs(){for(const k of Object.keys(defaultPrefs)){const range={stepsPerHour:[1,120],secondsBetween:[5,3600],populationCap:[4,250],pruneThreshold:[3,12]}[k];state.preferences[k]=clampNumber($(k).value,...range,defaultPrefs[k]);}persist();renderCadence();if(mode==='running')scheduleNext();}
function sortedCandidates(){return activeIdeas().sort((a,b)=>getScores(b).total-getScores(a).total || a.createdAt.localeCompare(b.createdAt));}
function selectParents(){const active=sortedCandidates();if(!active.length)throw Error('Add a seed first');const top=active.slice(0,Math.min(5,active.length));const first=top[autoStep % top.length];let second=null;if(active.length>=2 && autoStep%3===2){second=active[(autoStep+1)%active.length];if(second.id===first.id)second=active.find(i=>i.id!==first.id)||null;}return [first,second];}
function prune(){
 const prefs=state.preferences;let active=activeIdeas(),cut=[];
 const cap=clampNumber(prefs.populationCap,4,250,24),threshold=clampNumber(prefs.pruneThreshold,3,12,7);
 // Every evolution step may prune one demonstrably weak leaf, even below the cap.
 // Over-cap populations continue archiving the lowest-scoring leaves until bounded.
 while(active.length>3){
   const parentsOfActive=new Set(active.flatMap(i=>i.parents));
   const leaves=active.filter(i=>i.parents.length>0 && !parentsOfActive.has(i.id)).sort((a,b)=>getScores(a).total-getScores(b).total);
   if(!leaves.length)break;
   const weak=leaves.find(i=>getScores(i).total<=threshold);
   const overCap=active.length>cap;
   if(!weak&&!overCap)break;
   if(!overCap&&cut.length>=1)break;
   const victim=weak||leaves[0];const score=getScores(victim).total;
   victim.status='archived';
   C.record(victim,'autopilot.pruned',{reason:weak?'score under pruning threshold':'population cap exceeded; archived lowest-scoring leaf',score,cap,threshold});
   cut.push(victim.id);active=active.filter(i=>i.id!==victim.id);invalidateJury();
 }
 return cut;
}
function ideaSchema(count){
 const properties=Object.fromEntries(C.FIELDS.map(field=>[field,{type:'string'}]));
 return {type:'object',properties:{ideas:{type:'array',minItems:count,maxItems:count,items:{type:'object',properties,required:C.FIELDS,additionalProperties:false}}},required:['ideas'],additionalProperties:false};
}
async function modelCall(system,user,signal,structuredSchema=null){
 const type=config.provider;if(type==='offline')throw Error('Offline route has no model endpoint');
 const endpoint=String(config.endpoint||'').trim();const model=String(config.model||'').trim(),key=getKey();
 if(!endpoint||!model)throw Error('Endpoint and model are required. Open Models to configure them.');
 let url;try{url=new URL(endpoint);}catch{throw Error('Enter a valid endpoint URL.');}
 if(!['http:','https:'].includes(url.protocol))throw Error('Only HTTP(S) model endpoints are supported.');
 const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 if(url.protocol!=='https:'&&!local)throw Error('Remote endpoints must use HTTPS. HTTP is only allowed on this device (localhost/loopback).');
 if(!local&&!key)throw Error('A key is required for non-local routes.');
 const headers={'Content-Type':'application/json'};let body;
 if(type==='ollama'){
   if(key)headers.Authorization='Bearer '+key;
   body={model,messages:[{role:'system',content:system},{role:'user',content:user}],stream:false,format:structuredSchema||'json',options:{temperature:.75}};
 }else if(type==='anthropic'){
   headers['x-api-key']=key;headers['anthropic-version']='2023-06-01';headers['anthropic-dangerous-direct-browser-access']='true';
   body={model,max_tokens:1600,system,messages:[{role:'user',content:user}]};
 }else{
   if(type==='azure')headers['api-key']=key;else if(key)headers.Authorization='Bearer '+key;
   body={model,messages:[{role:'system',content:system},{role:'user',content:user}],temperature:.75,max_tokens:1800};
 }
 const receipt=lab?.beforeModelRequest(type,system.length+user.length);
 const controller=new AbortController();const cancel=()=>controller.abort();if(signal)signal.addEventListener('abort',cancel,{once:true});const timeout=setTimeout(()=>controller.abort(),65000);
 try{
 const res=await fetch(url.href,{method:'POST',headers,body:JSON.stringify(body),signal:controller.signal,cache:'no-store'});
 const text=await res.text();if(!res.ok)throw Error(`${type} HTTP ${res.status}: ${text.slice(0,250)}`);
 let json;try{json=JSON.parse(text);}catch{throw Error('Endpoint did not return valid JSON.');}
 let content=type==='ollama'?json.message?.content:type==='anthropic'?json.content?.map(x=>x.text||'').join('\n'):json.choices?.[0]?.message?.content;
 if(Array.isArray(content))content=content.map(x=>x.text||'').join('\n');
 if(typeof content!=='string'||!content.trim())throw Error('Model returned no readable content.');
 lab?.afterModelRequest(receipt,content,null);
 return content;
 }catch(e){if(receipt&&receipt.status==='pending')lab?.afterModelRequest(receipt,'',e);if(e.name==='AbortError')throw Error('Model request cancelled or timed out.');if(e instanceof TypeError)throw Error('Network/CORS failure. Verify endpoint, local server state and permitted browser Origin.');throw e;}
 finally{clearTimeout(timeout);if(signal)signal.removeEventListener('abort',cancel);}
}
function parseModelIdeas(content,requested){
 const cleaned=content.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');let parsed;
 try{parsed=JSON.parse(cleaned);}catch{
  const a=cleaned.indexOf('{'),b=cleaned.lastIndexOf('}'),c=cleaned.indexOf('['),d=cleaned.lastIndexOf(']');
  const candidate=(a>=0&&b>a)?cleaned.slice(a,b+1):(c>=0&&d>c)?cleaned.slice(c,d+1):'';
  try{parsed=JSON.parse(candidate);}catch{throw Error('Model did not return valid structured JSON. No ideas were added.');}
 }
 const records=Array.isArray(parsed)?parsed:Array.isArray(parsed.ideas)?parsed.ideas:null;
 if(!records)throw Error('Model response must contain an ideas array.');
 const ideas=records.slice(0,requested).filter(x=>x&&typeof x==='object'&&typeof x.title==='string'&&x.title.trim()).map(x=>Object.fromEntries(C.FIELDS.map(k=>[k,typeof x[k]==='string'?x[k].slice(0,2000):''])));
 if(ideas.length!==requested)throw Error(`Model returned ${ideas.length} valid ideas, expected ${requested}; no partial branch saved.`);
 return ideas;
}
async function generateChildren(parent,partner,n,sourceTag){
 if(config.provider==='offline')return currentBoard().generationStyle==='explore'?globalThis.RigUplift.exploreIdeas(parent,partner,currentBoard().objective,n,currentIdeas().length+autoStep):C.localIdeas(parent,partner,currentBoard().objective,n,currentIdeas().length+autoStep);
 const system=`You are a rigorous idea variation engine. Generate exactly ${n} materially distinct new ideas, not scores. Respond with ONLY valid JSON: {"ideas":[{"title":"","problem":"","audience":"","mechanism":"","difference":"","plan":"","validation":"","benefit":"","constraints":"","risks":""}]}. Every field must be a useful concise string. Match the user's goal; include a minimum testable build and falsifiable test. No marketing slogans; avoid unsupported factual claims. The code, not you, computes all scores.`;
 const brief={goal:currentBoard().objective,mutation:partner?'Crossbreed the two distinct parent ideas into hybrid descendants. Preserve both contributions.':'Branch from one parent with different operating mechanisms and constraints.',parents:[parent,partner].filter(Boolean).map(p=>Object.fromEntries(C.FIELDS.map(k=>[k,p[k]])))};
 const output=await modelCall(system,JSON.stringify(brief),null,config.provider==='ollama'?ideaSchema(n):null);return parseModelIdeas(output,n);
}
async function branchIdea(parentId,partnerId=null,n=3,autonomous=false){
 if(busy)throw Error('Generation already in progress');const board=currentBoard();if(!board)throw Error('No board is selected');const routeAtStart=config.provider;const ids=[parentId,partnerId].filter(Boolean);
 if(new Set(ids).size!==ids.length)throw Error('Choose two distinct ideas to crossbreed');
 const parents=ids.map(id=>currentIdeas().find(i=>i.id===id));if(parents.some(p=>!p))throw Error('The chosen parent is missing from this board');
 busy=true;renderHeader();try{
  const proposals=await generateChildren(parents[0],parents[1]||null,n,autonomous?'autopilot':'manual');
  if(state.selectedBoardId!==board.id)throw Error('Board changed while generating; results discarded');
  lab?.guard(proposals,board);
  const added=addIdeas(proposals,ids,routeAtStart==='offline'?'procedural':'model: '+routeAtStart);
  lab?.noveltyReceipt(added,parents);
  log(`${autonomous?'Autopilot':'Manual'} ${parents.length>1?'crossbreeding':'branching'}: ${ids.join(' + ')} -> ${added.map(i=>i.id).join(', ')||'none'} (${routeAtStart})`);
  if(autonomous){const removed=prune();if(removed.length){persist();log('Archived low-priority leaves: '+removed.join(', '));}}
  persist();renderAll();if(!autonomous)notify(added.length+' descendants generated.');return added;
 }catch(e){log('Generation failed: '+e.message);if(!autonomous)notify(e.message,true);throw e;}
 finally{busy=false;renderAll();}
}
async function runOneStep(){if(busy)return;const [a,b]=selectParents();autoStep++;await branchIdea(a.id,b?.id||null,1,true);}
function scheduleNext(){clearTimeout(autoTimer);if(mode!=='running')return;autoTimer=setTimeout(async()=>{if(mode!=='running')return;try{await runOneStep();}catch(e){stopAuto('Paused on generation failure: '+e.message);notify('Autopilot paused: '+e.message,true);return;}scheduleNext();},calcInterval()*1000);}
function startAuto(){if(mode==='running')return;if(!activeIdeas().length)return notify('Add an idea first.',true);saveAutopilotPrefs();mode='running';log('Autopilot started: '+calcInterval()+' seconds/step; model route '+config.provider+'.');scheduleNext();renderAll();}
function stopAuto(reason='Operator stopped autopilot'){clearTimeout(autoTimer);autoTimer=null;const was=mode==='running';mode='idle';if(was)log(reason);renderHeader();}
function renderProvider(){const p=config.provider;if(!PRESETS[p])config.provider='offline';$('provider').value=config.provider;$('endpoint').value=config.endpoint||'';$('modelId').value=config.model||'';$('apiKey').value=getKey(config.provider);$('persistKey').checked=!!config.persistKey;
 $('endpoint').disabled=config.provider==='offline';$('modelId').disabled=config.provider==='offline';$('apiKey').disabled=config.provider==='offline';$('persistKey').disabled=config.provider==='offline';$('probeRouter').disabled=config.provider==='offline';
 $('routerWarning').textContent=config.provider==='offline'?'Offline mode: deterministic recombinations, no network and no credentials.':
 ['ollama','lmstudio','mlx'].includes(config.provider)?'Local model route: start your model server and allow this page Origin if the browser blocks requests. The app sends a prompt only when you generate or probe.':'Hosted API: the browser sends your key directly to the endpoint. Some vendors block browser CORS; browser keys are exposed to scripts on this page. Use restricted keys and review provider policies.';
 $('routerState').textContent=`ACTIVE ROUTE: ${config.provider}\nENDPOINT: ${config.endpoint||'(none)'}\nMODEL: ${config.model||'(none)'}\nKEY: ${getKey()?'provided / '+(config.persistKey?'local storage':'session storage'):'none'}\nNo key is exported or stored on a server by this application.`;
}
function switchProvider(newP){
 if(!PRESETS[newP])return;
 if(config.provider!=='offline'){
   config.profiles[config.provider]={endpoint:$('endpoint').value.trim(),model:$('modelId').value.trim(),persistKey:$('persistKey').checked};
   saveKey(config.provider,$('apiKey').value.trim(),$('persistKey').checked);
 }
 config.provider=newP;const profile=config.profiles[newP]||PRESETS[newP];
 config.endpoint=profile.endpoint;config.model=profile.model;config.persistKey=!!profile.persistKey;
 persistConfig();renderProvider();log('Generator route selected: '+newP+'.');
}
function saveRouterSettings(){config.endpoint=$('endpoint').value.trim();config.model=$('modelId').value.trim();config.persistKey=$('persistKey').checked;config.profiles[config.provider]={endpoint:config.endpoint,model:config.model,persistKey:config.persistKey};saveKey(config.provider,$('apiKey').value.trim(),config.persistKey);persistConfig();renderProvider();notify('Routing saved in browser-only settings.');}
async function probeRouter(){saveRouterSettings();if(config.provider==='offline')return notify('Offline mode is ready and uses no endpoint.');$('probeRouter').disabled=true;try{const response=await modelCall('Return only JSON with the object {"ok":true}.','Probe the connection.');
 const valid=response.trim().length>0;log('Endpoint probe '+(valid?'succeeded':'returned empty')+' for '+config.provider+'.');notify(valid?'Model endpoint responded.':'Endpoint response was empty.',!valid);}
 catch(e){log('Endpoint probe failed: '+e.message);notify('Probe failed: '+e.message,true);}finally{$('probeRouter').disabled=false;}
}
function renderAll(){renderBoardList();renderHeader();renderAnchors();renderGraph();renderInspector();renderJury();renderObservatory();renderRuntimeLog();lab?.setSemanticAfterBoard();lab?.refresh();}
function changeView(view){if(!['studio','jury','autopilot','models'].includes(view))return;selectedView=view;
 for(const el of document.querySelectorAll('.view'))el.hidden=el.id!==view;
 for(const tab of document.querySelectorAll('.tab'))tab.setAttribute('aria-selected',String(tab.dataset.view===view));
 if(view==='studio'){requestAnimationFrame(drawEdges);observatory.show(true);observatory.resize();}else observatory.show(false);
}
// The Seed Vault is a catalog, not a second workspace or scoring engine.
// All planted records pass through the same board, normalization, jury, history,
// persistence, and ancestry paths as seeds authored in the workbench.
const starterIdeas=globalThis.RigStarterIdeas;
if(!Array.isArray(starterIdeas)||starterIdeas.length!==20)throw Error('Starter catalog is incomplete');
const starterCategories=['All','Systems','Worlds','People','Planet','Strange'];
let starterCategory='All',starterQuery='',starterSelected=starterIdeas[0].id,starterOrigin=null;
const selectedStarter=()=>starterIdeas.find(item=>item.id===starterSelected)||null;
const starterFields=item=>Object.fromEntries(C.FIELDS.map(key=>[key,item[key]||'']));
function renderStarterFilters(){
 const el=$('starterFilters');el.replaceChildren();
 for(const category of starterCategories){
  const button=document.createElement('button');button.type='button';button.dataset.starterCategory=category;
  button.textContent=category==='All'?'All / 20':category;
  button.setAttribute('aria-pressed',String(starterCategory===category));el.append(button);
 }
}
function renderStarterCatalog(){
 const items=starterIdeas.filter(item=>(starterCategory==='All'||item.category===starterCategory)&&
  [item.title,item.tagline,item.category,item.problem,item.mechanism].some(field=>field.toLowerCase().includes(starterQuery)));
 if(!items.some(item=>item.id===starterSelected))starterSelected=items[0]?.id||null;
 const list=$('starterList');list.replaceChildren();
 $('starterCount').textContent=`${items.length} / 20`;
 for(const item of items){
  const button=document.createElement('button');button.type='button';button.className='starter-entry';
  button.dataset.starterId=item.id;button.setAttribute('aria-pressed',String(item.id===starterSelected));
  const number=document.createElement('span');number.className='starter-index';number.textContent=String(starterIdeas.indexOf(item)+1).padStart(2,'0');
  const copy=document.createElement('span');copy.className='starter-copy';
  const name=document.createElement('b');name.textContent=item.title;
  const desc=document.createElement('small');desc.textContent=item.tagline;
  const arrow=document.createElement('span');arrow.className='starter-arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent='→';
  copy.append(name,desc);button.append(number,copy,arrow);list.append(button);
 }
 if(!items.length){const p=document.createElement('p');p.className='starter-empty';p.textContent='No matching origins. Change the theme or clear the search.';list.append(p);}
 renderStarterDetail();
}
function renderStarterDetail(){
 const item=selectedStarter();
 $('starterCurrentIndex').textContent=item?'ORIGIN '+String(starterIdeas.indexOf(item)+1).padStart(2,'0')+' / 20':'NO MATCH';
 $('starterCurrentCategory').textContent=item?.category.toUpperCase()||'FILTERED';
 $('starterName').textContent=item?.title||'No matching beginning';
 $('starterPromise').textContent=item?.tagline||'Try a different search.';
 for(const [id,key] of [['starterProblem','problem'],['starterMechanism','mechanism'],['starterPlan','plan'],['starterValidation','validation'],['starterRisks','risks']])$(id).textContent=item?.[key]||'—';
 const board=currentBoard();
 $('starterBoardContext').textContent=board?'CURRENT BOARD / '+board.title:'NO BOARD / START AN INDEPENDENT LINEAGE';
 $('starterIntoBoard').disabled=!item||!board||busy;
 $('starterEdit').disabled=!item||!board||busy;
 $('starterNewBoard').disabled=!item||busy;
}
function openStarterVault(opener){
 starterOrigin=opener||document.activeElement;
 starterCategory='All';starterQuery='';starterSelected=starterIdeas[0].id;
 $('starterSearch').value='';renderStarterFilters();renderStarterCatalog();
 if(!$('starterDialog').open)$('starterDialog').showModal();
 $('starterSearch').focus({preventScroll:true});
}
function closeStarterVault(){if($('starterDialog').open)$('starterDialog').close();}
function plantStarter(newBoard){
 const item=selectedStarter();if(!item)return;
 if(busy)return notify('Finish the current generation before planting another seed.',true);
 if(newBoard){
  stopAuto('Stopped to start a new origin');atlasDepthChoice=null;
  const board=C.board(item.title,item.objective);
  state.boards.push(board);state.selectedBoardId=board.id;state.selectedIdeaId=null;picked=[];
 }else if(!currentBoard())return notify('Choose a board or start an independent origin.',true);
 else{stopAuto('Stopped to plant a new origin');atlasDepthChoice=null;}
 const added=addIdeas([starterFields(item)],[],'curated starter / '+item.id);
 closeStarterVault();changeView('studio');
 window.dispatchEvent(new CustomEvent('evolution-rig:starter-planted',{detail:{newBoard,starterId:item.id}}));
 notify(added.length?(newBoard?'Independent board and root idea created.':'Starter added as a root idea to this board.'):'No idea was created.',!added.length);
}
for(const id of ['hudStarters','boardStarters','workbenchStarters','fieldPrologueStarters'])
 $(id).addEventListener('click',event=>openStarterVault(event.currentTarget));
let guideOrigin=null;
function openGuide(opener){guideOrigin=opener||document.activeElement;if(!$('guideDialog').open)$('guideDialog').showModal();$('guideClose').focus({preventScroll:true});}
function closeGuide(){if($('guideDialog').open)$('guideDialog').close();}
for(const id of ['boardGuide','workbenchGuide','hudGuide','fieldPrologueGuide'])$(id).addEventListener('click',event=>openGuide(event.currentTarget));
$('guideClose').addEventListener('click',closeGuide);$('guideCloseAction').addEventListener('click',closeGuide);
$('guideDialog').addEventListener('click',event=>{if(event.target===$('guideDialog'))closeGuide();});
$('guideDialog').addEventListener('close',()=>{if(guideOrigin?.isConnected&&!guideOrigin.closest('[inert]'))guideOrigin.focus({preventScroll:true});guideOrigin=null;});
$('starterClose').addEventListener('click',closeStarterVault);
$('starterDialog').addEventListener('close',()=>{if(starterOrigin?.isConnected&&!starterOrigin.closest('[inert]'))starterOrigin.focus({preventScroll:true});starterOrigin=null;});
$('starterFilters').addEventListener('click',event=>{const button=event.target.closest('[data-starter-category]');if(!button)return;starterCategory=button.dataset.starterCategory;for(const b of $('starterFilters').querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.starterCategory===starterCategory));renderStarterCatalog();$('starterDetailPanel').scrollTop=0;});
$('starterSearch').addEventListener('input',event=>{starterQuery=event.target.value.trim().toLowerCase();renderStarterCatalog();});
$('starterList').addEventListener('click',event=>{
 const button=event.target.closest('[data-starter-id]');if(!button)return;
 starterSelected=button.dataset.starterId;for(const b of $('starterList').querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.starterId===starterSelected));renderStarterDetail();$('starterDetailPanel').scrollTop=0;
});
$('starterNewBoard').addEventListener('click',()=>plantStarter(true));
$('starterIntoBoard').addEventListener('click',()=>plantStarter(false));
$('starterEdit').addEventListener('click',()=>{
 const item=selectedStarter();if(!item||!currentBoard()||busy)return;
 closeStarterVault();openIdeaDialog();
 for(const key of C.FIELDS)$('ideaForm').elements.namedItem(key).value=item[key]||'';
 $('dialogKicker').textContent='STARTER / EDIT BEFORE PLANTING';
});

// Board and editor events
$('boardForm').addEventListener('submit',e=>{e.preventDefault();const form=e.currentTarget,title=form.elements.namedItem('title').value.trim(),objective=form.elements.namedItem('objective').value.trim();if(!title||!objective)return;stopAuto('Stopped on board change');atlasDepthChoice=null;const b=C.board(title,objective);state.boards.push(b);state.selectedBoardId=b.id;state.selectedIdeaId=null;picked=[];persist();form.reset();if(window.innerWidth<=760)$('boardComposer').open=false;renderAll();changeView('studio');notify('Board created. Add its first seed.');});
$('boardList').addEventListener('click',e=>{const b=e.target.closest('[data-board]');if(!b)return;stopAuto('Stopped on board change');atlasDepthChoice=null;state.selectedBoardId=b.dataset.board;state.selectedIdeaId=null;picked=[];persist();renderAll();changeView('studio');});
$('viewTabs').addEventListener('click',e=>{const t=e.target.closest('[data-view]');if(t)changeView(t.dataset.view);});
$('viewTabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;const tabs=[...$('viewTabs').querySelectorAll('[role=tab]')];let i=tabs.indexOf(e.target);if(i<0)return;e.preventDefault();if(e.key==='Home')i=0;else if(e.key==='End')i=tabs.length-1;else i=(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;changeView(tabs[i].dataset.view);tabs[i].focus();});
$('newSeed').addEventListener('click',()=>openIdeaDialog());$('closeDialog').addEventListener('click',closeIdeaDialog);$('cancelIdea').addEventListener('click',closeIdeaDialog);$('ideaForm').addEventListener('submit',editIdea);
$('ideaDialog').addEventListener('click',e=>{if(e.target===$('ideaDialog'))closeIdeaDialog();});
$('ideaDialog').addEventListener('close',()=>{editingId=null;boardInDialog=null;});
$('branchSelected').addEventListener('click',async()=>{const idea=selectedIdea();if(!idea)return;try{await branchIdea(idea.id,null,clampNumber($('branchCount').value,1,8,3));}catch{}});
$('crossPicked').addEventListener('click',async()=>{if(picked.length!==2)return;try{await branchIdea(picked[0],picked[1],clampNumber($('branchCount').value,1,8,3));picked=[];renderAll();}catch{}});
$('clearPick').addEventListener('click',()=>{picked=[];renderAll();});$('nodeFilter').addEventListener('change',renderGraph);$('nodeSearch').addEventListener('input',renderGraph);
$('graphLayout').addEventListener('click',e=>{const card=e.target.closest('[data-node]');if(card)setSelection(card.dataset.node);});
$('graphLayout').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-node]')){e.preventDefault();setSelection(e.target.dataset.node);}});
$('graphLayout').addEventListener('dragstart',e=>{const card=e.target.closest('[data-node]');if(!card)return;e.dataTransfer.effectAllowed='copy';e.dataTransfer.setData('text/plain',card.dataset.node);card.classList.add('dragging');});
$('graphLayout').addEventListener('dragend',()=>{document.querySelectorAll('.dragging,.drag-over').forEach(el=>el.classList.remove('dragging','drag-over'));});
$('graphLayout').addEventListener('dragover',e=>{const card=e.target.closest('[data-node]');if(!card||!e.dataTransfer)return;e.preventDefault();e.dataTransfer.dropEffect='copy';card.classList.add('drag-over');});
$('graphLayout').addEventListener('dragleave',e=>{const card=e.target.closest('[data-node]');if(card)card.classList.remove('drag-over');});
$('graphLayout').addEventListener('drop',async e=>{const card=e.target.closest('[data-node]');if(!card)return;e.preventDefault();document.querySelectorAll('.drag-over,.dragging').forEach(el=>el.classList.remove('drag-over','dragging'));const source=e.dataTransfer.getData('text/plain');if(!source||source===card.dataset.node)return notify('Drop one distinct idea onto another to crossbreed.',true);
 try{await branchIdea(source,card.dataset.node,clampNumber($('branchCount').value,1,8,3));}catch{}});
$('inspector').addEventListener('click',e=>{const ancestor=e.target.closest('[data-ancestor]');if(ancestor){setSelection(ancestor.dataset.ancestor);return;}
 const action=e.target.closest('[data-action]')?.dataset.action;if(!action)return;
 if(action==='branch'){const idea=selectedIdea();if(idea)branchIdea(idea.id,null,clampNumber($('branchCount').value,1,8,3)).catch(()=>{});}
 if(action==='edit')openIdeaDialog(selectedIdea());
 if(action==='pick')pickIdea(selectedIdea()?.id);
 if(action==='archive')archiveIdea();
 if(action==='exportZip')downloadProject();
 if(action==='exportFolder')exportProjectFolder();
});
$('inspector').addEventListener('change',e=>{const field=e.target.closest('[data-override]');if(field){const reason=$('overrideReason')?.value||'';updateOverride(field.dataset.override,field.value,reason);}});
$('juryRows').addEventListener('click',e=>{const el=e.target.closest('[data-jury-id]');if(el){setSelection(el.dataset.juryId);changeView('studio');}});
$('rerunAnchors').addEventListener('click',()=>{renderAll();notify(calibrator.passes?'Reference calibration passed.':'Reference calibration FAILED: gold is disabled.',!calibrator.passes);});
$('downloadWorkspace').addEventListener('click',downloadWorkspace);$('importWorkspace').addEventListener('click',()=>$('workspaceFile').click());$('workspaceFile').addEventListener('change',e=>importWorkspaceFile(e.target.files[0]));
// Autopilot controls
for(const id of Object.keys(defaultPrefs))$(id).addEventListener('change',saveAutopilotPrefs);
$('startAuto').addEventListener('click',startAuto);$('stopAuto').addEventListener('click',()=>stopAuto());$('stepOnce').addEventListener('click',async()=>{if(busy)return;saveAutopilotPrefs();try{await runOneStep();notify('One evolution step finished.');}catch(e){notify('Evolution step failed: '+e.message,true);}});
$('clearRuntimeLog').addEventListener('click',()=>{runtimeLogs=[];renderRuntimeLog();});
// Model controls
$('provider').addEventListener('change',e=>switchProvider(e.target.value));$('saveRouter').addEventListener('click',saveRouterSettings);$('probeRouter').addEventListener('click',probeRouter);
$('forgetKey').addEventListener('click',()=>{saveKey(config.provider,'',false);$('apiKey').value='';config.persistKey=false;if(config.profiles[config.provider])config.profiles[config.provider].persistKey=false;persistConfig();renderProvider();notify('Key cleared from session and localStorage for current provider.');});
window.addEventListener('resize',()=>{if(selectedView==='studio'){requestAnimationFrame(drawEdges);observatory.resize();}});
window.addEventListener('beforeunload',()=>{clearTimeout(autoTimer);});
// The Lab is an opt-in view of the existing authority/state, not a parallel database.
lab=globalThis.RigLab.createLab({
 getState:()=>state,currentBoard,currentIdeas,selected:selectedIdea,score:getScores,isGold:i=>getGold().has(i.id),
 invalidate:invalidateJury,persist,render:renderAll,autoStep:()=>autoStep,
 selectAcrossBoards(id){const target=state.ideas.find(i=>i.id===id);if(!target)return false;
  if(target.boardId!==state.selectedBoardId){stopAuto('Board changed via global search');state.selectedBoardId=target.boardId;picked=[];atlasDepthChoice=null;}
  state.selectedIdeaId=id;persist({preserveJury:true});renderAll();return true;
 },
 restoreWorkspace(snapshot){stopAuto('Stopped to restore a checkpoint');state=C.validateImport(snapshot);atlasDepthChoice=null;picked=[];if(!persist())throw Error('Could not save restored workspace');renderAll();},
 setSemantic(edges,enabled){observatory.setSemanticEdges(edges,enabled);},
 exportWorkspace:downloadWorkspace,
 exportBrief(content,i){exportBlob(new Blob([content],{type:'text/markdown;charset=utf-8'}),C.slug(i.title)+'-candidate-brief.md');},
 openAutoSettings(){if(document.body.classList.contains('mode-immersive'))$('hudWorkbench').click();$('viewTabs').querySelector('[data-view="autopilot"]').click();$('startAuto').focus({preventScroll:true});}
});
// Deliberate public pure-core diagnostics, with no access to credentials or private state.
globalThis.EvolutionRigTest={core:C,calibration:()=>C.anchors(),getPublicState:()=>({boards:state.boards.length,ideas:state.ideas.length,provider:config.provider,mode}),getAtlasDiagnostics:()=>observatory.diagnostics()};
if(window.innerWidth<=760 && state.boards.length)$('boardComposer').open=false;
renderCadence();renderProvider();renderAll();changeView('studio');
if(!calibrator.passes)notify('Scoring reference gate failed. Gold export is disabled.',true);
})();
