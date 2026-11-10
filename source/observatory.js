/* Causal Observatory. A read-only view of real board ideas and recorded parent edges.
   No synthetic nodes, scores, telemetry, clocks, external assets or data mutation. */
(function (root) {
'use strict';
function createObservatory(canvas, onSelect) {
  const ctx = canvas.getContext('2d', {alpha:false});
  let data=[], byId=new Map(), verdicts=new Map(), gold=new Set(), selectedId=null;
  let positions=new Map(), ancestors=new Set(), descendants=new Set();
  let width=1,height=1,dpr=1,baseScale=1,worldRadius=100;
  let pan={x:0,y:0}, zoom=1, focused=false, hoverId=null, activePointer=null;
  let frame=0, visible=true, depthCap=null, semanticEdges=[], semanticMode=false;
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  const hash=str=>{let x=2166136261;for(let i=0;i<str.length;i++){x^=str.charCodeAt(i);x=Math.imul(x,16777619);}return x>>>0;};
  function layout() {
    byId=new Map(data.map(n=>[n.id,n]));positions=new Map();
    const groups=new Map();
    for(const n of data){const g=Number.isFinite(n.generation)?n.generation:0;if(!groups.has(g))groups.set(g,[]);groups.get(g).push(n);}
    const generations=[...groups.keys()].sort((a,b)=>a-b);
    const maxGen=generations.at(-1)||0;
    worldRadius=Math.max(110,78+maxGen*144);
    for(const generation of generations){
      const group=groups.get(generation).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt))||a.id.localeCompare(b.id));
      const count=group.length;
      group.forEach((n,i)=>{
        const radius=78+generation*144;
        const a=-Math.PI/2+(2*Math.PI*(i+.5))/(Math.max(1,count));
        const drift=(hash(n.id)%1000/1000-.5)*Math.min(.12,1/Math.max(count,1));
        positions.set(n.id,{x:Math.cos(a+drift)*radius,y:Math.sin(a+drift)*radius,generation});
      });
    }
    const ancestorWalk=[selectedId];ancestors=new Set();
    while(ancestorWalk.length){const id=ancestorWalk.pop();const n=byId.get(id);if(!n)continue;for(const p of n.parents||[]){if(!ancestors.has(p)){ancestors.add(p);ancestorWalk.push(p);}}}
    const children=new Map();for(const n of data)for(const p of n.parents||[]){if(!children.has(p))children.set(p,[]);children.get(p).push(n.id);}
    descendants=new Set();const queue=[selectedId];while(queue.length){const id=queue.pop();for(const c of children.get(id)||[]){if(!descendants.has(c)){descendants.add(c);queue.push(c);}}}
    ancestors.delete(selectedId);descendants.delete(selectedId);
    if(focused && positions.has(selectedId)){const n=positions.get(selectedId);pan={x:-n.x,y:-n.y};}
  }
  function size(){
    const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return false;
    width=rect.width;height=rect.height;dpr=clamp(window.devicePixelRatio||1,1,2);
    const pxw=Math.round(width*dpr),pxh=Math.round(height*dpr);
    if(canvas.width!==pxw||canvas.height!==pxh){canvas.width=pxw;canvas.height=pxh;}
    ctx.setTransform(dpr,0,0,dpr,0,0);
    baseScale=clamp(Math.min((width-108)/(worldRadius*2+120),(height-84)/(worldRadius*2+120)),.055,1.5);
    return true;
  }
  const worldToScreen=p=>({x:width/2+(p.x+pan.x)*baseScale*zoom,y:height/2+(p.y+pan.y)*baseScale*zoom});
  const screenToWorld=p=>({x:(p.x-width/2)/(baseScale*zoom)-pan.x,y:(p.y-height/2)/(baseScale*zoom)-pan.y});
  function ring(x,y,r,color,lw=1){ctx.strokeStyle=color;ctx.lineWidth=lw;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();}
  function draw(){
    frame=0;if(!visible||!size())return;
    ctx.fillStyle='#091216';ctx.fillRect(0,0,width,height);
    const bg=ctx.createRadialGradient(width*.43,height*.51,20,width*.45,height*.52,Math.max(width,height)*.8);
    bg.addColorStop(0,'#172c2c');bg.addColorStop(.58,'#0c2022');bg.addColorStop(1,'#071013');ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
    // Fixed drafting grid: a coordinate aid, never a simulated star field.
    ctx.strokeStyle='rgba(139,181,169,.065)';ctx.lineWidth=1;
    for(let x=24.5;x<width;x+=36){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke();}
    for(let y=16.5;y<height;y+=36){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}
    const origin=worldToScreen({x:0,y:0});
    ctx.strokeStyle='rgba(201,205,184,.17)';ctx.beginPath();ctx.moveTo(0,origin.y+.5);ctx.lineTo(width,origin.y+.5);ctx.moveTo(origin.x+.5,0);ctx.lineTo(origin.x+.5,height);ctx.stroke();
    const drawn=data.filter(n=>depthCap===null||n.generation<=depthCap);
    const drawnIds=new Set(drawn.map(n=>n.id));
    const gs=new Set(drawn.map(n=>n.generation));
    if(!gs.size && !document.body.classList.contains('mode-immersive'))gs.add(0);
    for(const g of [...gs].sort((a,b)=>a-b)){
      const r=(78+g*144)*baseScale*zoom;
      if(r>Math.max(width,height)*2.2)continue;
      ring(origin.x,origin.y,r,'rgba(189,195,174,.18)',1);
      ctx.fillStyle='rgba(201,214,201,.58)';ctx.font='10px ui-monospace,SFMono-Regular,monospace';
      const tx=origin.x+r+11,ty=origin.y-8;if(tx>18&&tx<width-80&&ty>12&&ty<height-14)ctx.fillText('GEN '+String(g).padStart(2,'0'),tx,ty);
    }
    // Optional shared-term overlay: each edge is supported by explicit fields and
    // inspected in the Lab. It is never presented as an actual parent relation.
    if(semanticMode){
      for(const edge of semanticEdges){if(!drawnIds.has(edge.a)||!drawnIds.has(edge.b))continue;
        const pa=positions.get(edge.a),pb=positions.get(edge.b);if(!pa||!pb)continue;
        const a=worldToScreen(pa),b=worldToScreen(pb);
        if((a.x<-40&&b.x<-40)||(a.x>width+40&&b.x>width+40)||(a.y<-40&&b.y<-40)||(a.y>height+40&&b.y>height+40))continue;
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineWidth=1;
        ctx.setLineDash([3,7]);ctx.strokeStyle='rgba(168,155,255,.55)';ctx.stroke();ctx.setLineDash([]);
      }
    }
    // Connections are actual parent IDs. Archived ancestry is still drawn.
    for(const n of drawn){const dst=positions.get(n.id);if(!dst)continue;
      for(const pid of n.parents||[]){if(!drawnIds.has(pid))continue;const src=positions.get(pid);if(!src)continue;
        const a=worldToScreen(src),b=worldToScreen(dst);
        if((a.x<-40&&b.x<-40)||(a.x>width+40&&b.x>width+40)||(a.y<-40&&b.y<-40)||(a.y>height+40&&b.y>height+40))continue;
        const inTrace=selectedId && ((n.id===selectedId&&ancestors.has(pid))||(ancestors.has(n.id)&&ancestors.has(pid))||(descendants.has(n.id)&&(pid===selectedId||descendants.has(pid))));
        ctx.beginPath();ctx.moveTo(a.x,a.y);
        const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
        ctx.quadraticCurveTo(mx+(b.y-a.y)*.075,my-(b.x-a.x)*.075,b.x,b.y);
        ctx.lineWidth=inTrace?2.25:1;
        ctx.strokeStyle=inTrace?'rgba(242,191,116,.9)':selectedId?'rgba(112,167,160,.17)':'rgba(123,166,161,.35)';
        ctx.stroke();
      }
    }
    // Draw quiet nodes first, selected last, keeping the selected trace legible.
    const nodes=[...drawn].sort((a,b)=>Number(a.id===selectedId)-Number(b.id===selectedId));
    for(const n of nodes){const p=positions.get(n.id);if(!p)continue;const s=worldToScreen(p);if(s.x<-26||s.x>width+26||s.y<-26||s.y>height+26)continue;
      const focus=n.id===selectedId,related=ancestors.has(n.id)||descendants.has(n.id),isGold=gold.has(n.id),archived=n.status==='archived';
      const score=verdicts.get(n.id)?.total??3;
      const r=clamp((2.8+score*.25)*Math.sqrt(clamp(zoom,.65,2.8)),3.5,13);
      const faded=selectedId&&!focus&&!related;
      if(focus){ring(s.x,s.y,r+13,'rgba(242,191,116,.25)',2);ring(s.x,s.y,r+7,'rgba(242,191,116,.9)',1.3);}
      else if(isGold){ring(s.x,s.y,r+5,faded?'rgba(232,175,104,.3)':'rgba(232,175,104,.8)',1.3);}
      ctx.beginPath();ctx.arc(s.x,s.y,r,0,Math.PI*2);
      ctx.fillStyle=archived?(faded?'#293738':'#556764'):isGold?(faded?'#775e44':'#eabd77'):faded?'#29474a':'#85c7b5';ctx.fill();
      if(archived){ring(s.x,s.y,r,'rgba(191,201,184,.7)',1.1);ring(s.x,s.y,Math.max(1,r-2),'#0b1b20',1.5);}
      if(n.parents?.length===2){ctx.fillStyle=isGold?'#1b1c18':'#071719';ctx.fillRect(s.x-1.15,s.y-1.15,2.3,2.3);}
      const label=focus||n.id===hoverId||(!selectedId&&isGold&&data.length<=180);
      if(label){const short=n.title.length>30?n.title.slice(0,28)+'…':n.title;
        ctx.font=focus?'600 12px system-ui,sans-serif':'11px system-ui,sans-serif';
        const textw=ctx.measureText(short).width;const bx=clamp(s.x-textw/2-9,6,width-textw-20);const by=s.y-r-36;
        if(by>5&&by<height-22){ctx.fillStyle='rgba(5,16,19,.9)';ctx.fillRect(bx,by,textw+18,24);ctx.strokeStyle='rgba(178,189,170,.3)';ctx.strokeRect(bx+.5,by+.5,textw+17,23);ctx.fillStyle=focus?'#f6d7aa':'#f2eee2';ctx.fillText(short,bx+9,by+16);}
      }
    }
    // The magnified ledger translates a sprawling genealogy into a concrete
    // generational score trajectory. Values are jury heuristics, not outcomes.
    if(selectedId && width>=610 && ancestors.size){
      const trail=data.filter(n=>n.id===selectedId||ancestors.has(n.id));
      const peaks=new Map();
      for(const node of trail){const v=verdicts.get(node.id)?.total??3;peaks.set(node.generation,Math.max(v,peaks.get(node.generation)??3));}
      const records=[...peaks].sort((a,b)=>a[0]-b[0]);
      if(records.length>=2){
        const bx=18,by=height-164,bw=234,bh=125;
        ctx.fillStyle='rgba(7,22,24,.94)';ctx.fillRect(bx,by,bw,bh);
        ctx.strokeStyle='rgba(198,173,129,.52)';ctx.strokeRect(bx+.5,by+.5,bw-1,bh-1);
        ctx.fillStyle='#e8c28e';ctx.font='700 10px ui-monospace,monospace';ctx.fillText('ANCESTRAL SCORE / GENERATIONS',bx+12,by+19);
        ctx.fillStyle='#a5beb2';ctx.font='9px ui-monospace,monospace';ctx.fillText('BEST JURY TOTAL AT EACH ANCESTRAL LEVEL',bx+12,by+35);
        const minGen=records[0][0],maxGen=records.at(-1)[0];const px=g=>bx+18+(g-minGen)/(maxGen-minGen)*(bw-36);const py=v=>by+96-(v-3)/12*48;
        for(const tick of [3,9,15]){const yy=py(tick);ctx.strokeStyle='rgba(160,187,164,.12)';ctx.beginPath();ctx.moveTo(bx+18,yy);ctx.lineTo(bx+bw-18,yy);ctx.stroke();}
        ctx.lineWidth=2;ctx.strokeStyle='#e0ae77';ctx.beginPath();records.forEach(([g,v],i)=>{const x=px(g),y=py(v);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});ctx.stroke();
        records.forEach(([g,v])=>{const x=px(g),y=py(v);ctx.fillStyle='#f0cc91';ctx.beginPath();ctx.arc(x,y,3.3,0,Math.PI*2);ctx.fill();});
        ctx.font='10px ui-monospace,monospace';ctx.fillStyle='#cbd7c3';ctx.fillText('G'+minGen+' / '+records[0][1],bx+12,by+115);
        ctx.textAlign='right';ctx.fillText('G'+maxGen+' / '+records.at(-1)[1],bx+bw-12,by+115);ctx.textAlign='left';
      }
    }
    // Physical scale legend derived from zoom; no invented time, distance or counts.
    ctx.fillStyle='rgba(180,199,186,.69)';ctx.font='10px ui-monospace,SFMono-Regular,monospace';ctx.fillText('CAUSAL DISTANCE / GENERATIONS',20,height-20);
    if(!data.length && (!document.body.classList.contains('mode-immersive') || !matchMedia('(min-width:1300px) and (min-height:850px)').matches)){ctx.textAlign='center';ctx.fillStyle='#d4d9cd';ctx.font='18px Georgia,serif';ctx.fillText('The field has no recorded ideas.',width/2,height/2-16);ctx.font='12px system-ui,sans-serif';ctx.fillStyle='#9eafa8';ctx.fillText('Create a seed. Its consequences will become visible here.',width/2,height/2+13);ctx.textAlign='left';}
  }
  function schedule(){if(frame||!visible)return;frame=requestAnimationFrame(draw);}
  function localPoint(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
  function near(point){let best=null,dist=Infinity;for(const n of data){const p=positions.get(n.id);if(!p||(depthCap!==null&&n.generation>depthCap))continue;const q=worldToScreen(p);const d=Math.hypot(q.x-point.x,q.y-point.y);if(d<dist){dist=d;best=n;}}return dist<Math.max(14,10*zoom)?best:null;}
  function pointerDown(e){if(e.button!==0&&e.pointerType==='mouse')return;activePointer={id:e.pointerId,start:localPoint(e),previous:localPoint(e),moved:false};canvas.setPointerCapture?.(e.pointerId);}
  function pointerMove(e){const p=localPoint(e);
    if(activePointer?.id===e.pointerId){const d=Math.hypot(p.x-activePointer.start.x,p.y-activePointer.start.y);if(d>5)activePointer.moved=true;
      if(activePointer.moved){pan.x+=(p.x-activePointer.previous.x)/(baseScale*zoom);pan.y+=(p.y-activePointer.previous.y)/(baseScale*zoom);activePointer.previous=p;focused=false;canvas.style.cursor='grabbing';schedule();}return;
    }
    const next=near(p)?.id||null;if(next!==hoverId){hoverId=next;canvas.style.cursor=hoverId?'pointer':'grab';schedule();}
  }
  function pointerUp(e){if(!activePointer||activePointer.id!==e.pointerId)return;const p=localPoint(e);if(!activePointer.moved){const hit=near(p);if(hit)onSelect(hit.id);}activePointer=null;canvas.style.cursor=hoverId?'pointer':'grab';schedule();}
  function wheel(e){e.preventDefault();const at=localPoint(e),before=screenToWorld(at);zoom=clamp(zoom*Math.exp(-e.deltaY*.0014),.36,5);const after=screenToWorld(at);pan.x+=after.x-before.x;pan.y+=after.y-before.y;focused=false;schedule();}
  function key(e){if(e.key==='+'||e.key==='='){e.preventDefault();api.zoom(1.25);}else if(e.key==='-'||e.key==='_'){e.preventDefault();api.zoom(.8);}else if(e.key==='Home'){e.preventDefault();api.reset();}else if(['ArrowLeft','ArrowRight'].includes(e.key)&&data.length){e.preventDefault();const ordered=[...data].sort((a,b)=>a.generation-b.generation||String(a.createdAt).localeCompare(String(b.createdAt)));let index=ordered.findIndex(n=>n.id===selectedId);index=clamp(index+(e.key==='ArrowRight'?1:-1),0,ordered.length-1);onSelect(ordered[index].id);}}
  canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);canvas.addEventListener('pointerleave',()=>{hoverId=null;schedule();});canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('keydown',key);
  const api={
    update(ideas,id,scores,goldIds){const boardChanged=data[0]?.boardId!==ideas[0]?.boardId;data=ideas;verdicts=scores;gold=goldIds;selectedId=id;
      if(boardChanged){pan={x:0,y:0};zoom=1;focused=false;depthCap=null;}layout();schedule();},
    reset(){pan={x:0,y:0};zoom=1;focused=false;depthCap=null;schedule();},
    setDepth(n){depthCap=n===null?null:Math.max(0,Math.floor(n));schedule();},
    setSemanticEdges(edges,enabled){semanticEdges=Array.isArray(edges)?edges.slice(0,120):[];semanticMode=!!enabled;schedule();},
    zoom(factor){zoom=clamp(zoom*factor,.36,5);focused=false;schedule();},
    focus(){const p=positions.get(selectedId);if(!p)return false;pan={x:-p.x,y:-p.y};zoom=clamp(1.65/Math.max(baseScale,.12),1.2,5);focused=true;schedule();return true;},
    resize:schedule,
    show(flag){visible=flag;if(flag)schedule();},
    diagnostics(){return{nodeCount:data.length,edgeCount:data.reduce((a,n)=>a+(n.parents?.length||0),0),semanticEdgeCount:semanticMode?semanticEdges.length:0,selectedId,ancestors:[...ancestors],descendants:[...descendants],zoom,depthCap,displayed:depthCap===null?data.length:data.filter(n=>n.generation<=depthCap).length,points:data.map(n=>{const s=worldToScreen(positions.get(n.id));return{id:n.id,generation:n.generation,x:s.x,y:s.y};})};},
    destroy(){canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',pointerUp);canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('keydown',key);cancelAnimationFrame(frame);}
  };
  schedule();return api;
}
root.RigObservatory={createObservatory};
})(globalThis);
