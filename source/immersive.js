/* Causal Field: progressive disclosure without rewriting the project state.
   All operations delegate to existing workbench controls and the original
   observatory; no new source of truth, provider, or generation path. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const body=document.body,rail=$('workspaceRail'),scrim=$('hudScrim');
  const boardButton=$('hudBoards'),infoButton=$('hudInfo');
  const prefKey='evolution-rig:ui:surface:v1';
  let prefer='immersive';
  try{prefer=localStorage.getItem(prefKey)||'immersive';}catch{}
  const immersive=()=>body.classList.contains('mode-immersive');
  const save=v=>{try{localStorage.setItem(prefKey,v);}catch{}};
  let reportReturn=infoButton,boardsReturn=boardButton;
  function closeBoards(focus=false){body.classList.remove('ui-boards-open');scrim.hidden=true;boardButton.setAttribute('aria-expanded','false');rail.inert=immersive();$('main').inert=false;if(focus && immersive())boardsReturn.focus({preventScroll:true});}
  function showBoards(){if(!immersive())return;boardsReturn=document.activeElement instanceof HTMLElement?document.activeElement:boardButton;body.classList.add('ui-boards-open');scrim.hidden=false;boardButton.setAttribute('aria-expanded','true');rail.inert=false;$('main').inert=true;const b=$('boardList').querySelector('.selected')||$('boardComposer summary');requestAnimationFrame(()=>b?.focus({preventScroll:true}));}
  function closeReport(focus=false){body.classList.remove('ui-notes-open');infoButton.setAttribute('aria-expanded','false');$('atlasNotebook').inert=immersive();if(focus && immersive())reportReturn?.focus({preventScroll:true});}
  function showReport(){if(!immersive())return;reportReturn=document.activeElement instanceof HTMLElement?document.activeElement:infoButton;body.classList.add('ui-notes-open');infoButton.setAttribute('aria-expanded','true');$('atlasNotebook').inert=false;$('atlasCloseNotebook').focus({preventScroll:true});}
  function adapt(){const active=immersive();rail.inert=active&&!body.classList.contains('ui-boards-open');$('atlasNotebook').inert=active&&!body.classList.contains('ui-notes-open');$('hudWorkbench').setAttribute('aria-pressed',String(!active));$('resumeImmersion').setAttribute('aria-pressed',String(active));requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));}
  function setMode(value){closeBoards();closeReport();body.classList.toggle('mode-immersive',value==='immersive');save(value);if(value==='immersive')$('viewTabs').querySelector('[data-view="studio"]').click();adapt();}
  $('hudWorkbench').addEventListener('click',()=>{setMode('workbench');$('resumeImmersion').focus({preventScroll:true});});
  $('resumeImmersion').addEventListener('click',()=>{setMode('immersive');$('atlasCanvas').focus({preventScroll:true});});
  boardButton.addEventListener('click',()=>body.classList.contains('ui-boards-open')?closeBoards(true):showBoards());
  scrim.addEventListener('click',()=>closeBoards(true));
  rail.addEventListener('click',e=>{if(e.target.closest('[data-board]'))requestAnimationFrame(()=>closeBoards(true));},true);
  $('boardForm').addEventListener('submit',()=>{const form=$('boardForm');if(form.elements.namedItem('title').value.trim()&&form.elements.namedItem('objective').value.trim())requestAnimationFrame(()=>closeBoards(true));},true);
  $('hudNewSeed').addEventListener('click',()=>{if($('newSeed').disabled){showBoards();$('boardComposer').open=true;$('boardForm').elements.namedItem('title').focus({preventScroll:true});}else $('newSeed').click();});
  $('fieldPrologueStart').addEventListener('click',()=>$('hudNewSeed').click());
  const delegate={hudZoomOut:'atlasZoomOut',hudZoomIn:'atlasZoomIn',hudFit:'atlasReset',hudTrace:'atlasFocus'};
  for(const [id,target] of Object.entries(delegate))$(id).addEventListener('click',()=>$(target).click());
  infoButton.addEventListener('click',()=>body.classList.contains('ui-notes-open')?closeReport(true):showReport());
  $('atlasCloseNotebook').addEventListener('click',()=>closeReport(true));
  window.addEventListener('evolution-rig:starter-planted',()=>{if(body.classList.contains('ui-boards-open'))closeBoards(true);});
  document.addEventListener('keydown',e=>{
    if($('starterDialog').open||$('guideDialog').open||$('ideaDialog').open)return;
    if(e.key==='Escape'){if(body.classList.contains('ui-boards-open')){e.preventDefault();closeBoards(true);}else if(body.classList.contains('ui-notes-open')){e.preventDefault();closeReport(true);}return;}
    if(!immersive()||e.altKey||e.ctrlKey||e.metaKey||e.repeat)return;
    if(e.target.closest('input,textarea,select,button,[contenteditable="true"],dialog')||$('ideaDialog').open)return;
    if(e.key.toLowerCase()==='b'){e.preventDefault();showBoards();}
    if(e.key.toLowerCase()==='n'){e.preventDefault();$('hudNewSeed').click();}
    if(e.key==='?' ){e.preventDefault();showReport();}
  });
  function sync(){
    const boardTitle=$('boardTitle').textContent.trim();
    const hasBoard=!$('newSeed').disabled;
    $('hudBoardName').textContent=hasBoard?boardTitle:'Choose a board';
    $('hudNewSeed').textContent=hasBoard?'+ Seed':'+ Begin';
    $('hudIdeaCount').textContent=$('statTotal').textContent+' ideas';
    $('hudGeneration').textContent='Generation '+$('statGenerations').textContent;
    const isEmpty=Number($('statTotal').textContent)===0;
    $('fieldPrologue').hidden=!isEmpty;
    $('fieldPrologueStart').firstChild.textContent=hasBoard?'Create first idea ':'Open a board ';
    $('fieldPrologueTitle').textContent=hasBoard?'Now give the field its first cause.':'Everything begins with a choice.';
    const status=$('autoStatusLabel').textContent;
    $('hudRoute').textContent=status.includes('RUNNING')?'AUTO / ACTIVE':'LOCAL / CONTROLLED';
    $('hudTrace').disabled=$('atlasFocus').disabled;
  }
  const nodes=['boardTitle','newSeed','statTotal','statGenerations','autoStatusLabel','atlasFocus'];
  const observer=new MutationObserver(sync);
  for(const id of nodes)observer.observe($(id),{childList:true,characterData:true,subtree:true,attributes:id==='newSeed'||id==='atlasFocus',attributeFilter:id==='newSeed'||id==='atlasFocus'?['disabled']:undefined});
  window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
  if(prefer==='workbench')body.classList.remove('mode-immersive');
  adapt();sync();
  // Keeps canvas backing dimensions in step with browser address-bar / panel changes.
  const field=document.querySelector('.atlas-field');
  if('ResizeObserver' in window){const ro=new ResizeObserver(()=>{if(immersive())window.dispatchEvent(new Event('resize'));});ro.observe(field);window.addEventListener('pagehide',()=>ro.disconnect(),{once:true});}
})();
