/* Evolution Lab — deterministic browser + Node helpers. No network, DOM, storage or synthetic evidence. */
(function(root,factory){const o=factory();if(typeof module!=='undefined'&&module.exports)module.exports=o;if(root)root.RigUplift=o;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const fields=['title','problem','audience','mechanism','difference','plan','validation','benefit','constraints','risks'];
const metrics=['originality','feasibility','impact'];
const plain=s=>String(s??'');
const text=i=>fields.map(k=>plain(i?.[k])).join(' ').toLowerCase();
const terms=s=>new Set(plain(s).toLowerCase().match(/[a-z0-9]{3,}/g)||[]);
const intersect=(a,b)=>[...a].filter(x=>b.has(x));
const id=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'r-'+Date.now()+'-'+Math.random().toString(36).slice(2);
const safe=(s,n=1200)=>plain(s).trim().slice(0,n);
function ruleReport(rules,idea){const t=text(idea),violations=[];for(const r of rules||[]){const phrase=safe(r.phrase,120).toLowerCase();if(!phrase)continue;const present=t.includes(phrase);if(r.kind==='include'&&!present)violations.push({rule:r,reason:'Required literal absent'});if(r.kind==='exclude'&&present)violations.push({rule:r,reason:'Forbidden literal present'});}return{pass:violations.length===0,violations,checked:(rules||[]).length,disclaimer:'Literal text checks only; cannot establish semantic compliance.'};}
function exploreIdeas(parent,partner,objective,n=3,seq=0){
 const mechanisms=[
  ['Material-first','Make a printable physical protocol with evidence cards, human review stamps, and a short manual experiment that can be carried out without software.','Test with three paper prototypes; measure completion and errors.'],
  ['Peer-exchange','Use a local shared-folder exchange where each participant passes a portable record to another; record handoffs, conflicts, and independently observed outcomes.','Test exchange across two devices with no shared cloud account.'],
  ['Observation-first','Operate an offline field notebook that captures comparable observations before proposing interventions, then traces every hypothesis to its measurements.','Collect five manual observations and challenge one tempting false conclusion.'],
  ['Role-inversion','Transfer the first decision back to the affected participant with a reversible choice card, separating human consent from automated recommendations.','Run a scripted trial where the person rejects the suggested action.'],
  ['Micro-simulation','Prototype a local adversarial rehearsal in which the same starting case is run through competing plans; expose all assumptions and falsification criteria.','Test one known hard counterexample and show what diverged.'],
  ['Minimum-service','Deliver the main benefit as an explicit human service or teachable procedure before any software, with written handoff and a small repeatable checklist.','Run one facilitated session and measure whether a second facilitator can repeat it.']
 ];const out=[];
 for(let i=0;i<n;i++){const [prefix,mechanism,plan]=mechanisms[(seq+i)%mechanisms.length];const other=partner?' / '+partner.title:'';out.push({
 title:(prefix+' '+parent.title+other).slice(0,155),
 problem:parent.problem||'The board objective has not yet been validated.',
 audience:parent.audience||'Participants affected by the board objective.',
 mechanism:mechanism+' Target the stated problem without assuming the parent mechanism is necessary. '+(partner?'Validate a distinct contribution from the second parent. ':''),
 difference:'The delivery mechanism changes from the parent approach to '+prefix.toLowerCase()+'. The operator must still assess whether this is materially different in practice.',
 plan:plan+' Record actual costs and compare against the parent before scaling.',
 validation:'Compare task outcomes, failure rates, and human comprehension against the recorded parent over at least five cases.',
 benefit:parent.benefit||'Reduce uncertainty in a repeatable test.',
 constraints:[parent.constraints,partner?.constraints,'Remain within the board objective; do not claim any result without testing.'].filter(Boolean).join(' '),
 risks:'Changing delivery mechanisms may introduce new failure paths. Review all inherited risks. '+(parent.risks||'')
 });}
 return out;
}
function compareIdeas(ideas){return{fields,ideas:ideas.slice(0,3).map(i=>({id:i.id,title:i.title,fields:Object.fromEntries(fields.slice(1).map(k=>[k,plain(i[k])]))}))};}
function dominates(a,b){return metrics.every(k=>a[k]>=b[k])&&metrics.some(k=>a[k]>b[k]);}
function pareto(ideas,score){const records=ideas.map(i=>({idea:i,metrics:score(i).effective,total:score(i).total}));return records.map(a=>({...a,frontier:!records.some(b=>b.idea.id!==a.idea.id&&dominates(b.metrics,a.metrics))}));}
function search(boards,ideas,query){const q=safe(query,160).toLowerCase();if(!q)return[];const b=new Map(boards.map(x=>[x.id,x]));return ideas.filter(i=>text(i).includes(q)||plain(b.get(i.boardId)?.title).toLowerCase().includes(q)).slice(0,100).map(i=>({idea:i,board:b.get(i.boardId)}));}
function semanticEdges(ideas,limit=120){
 // Index only actual terms; common boilerplate is excluded to avoid falsely
 // connecting every idea. A bounded posting list avoids N^2 graph comparison.
 const stop=new Set('the and with this from that into your when use using can will for are not one first more than only such each some other then also their been have make which while'.split(' '));
 const termMaps=ideas.map(i=>terms(i.mechanism+' '+i.constraints+' '+i.problem));
 const postings=new Map();termMaps.forEach((set,n)=>{for(const term of set){if(stop.has(term))continue;if(!postings.has(term))postings.set(term,[]);postings.get(term).push(n);}});
 const related=new Map(),maxPosting=Math.min(80,Math.max(8,Math.ceil(ideas.length*.28)));
 for(const [term,ids] of postings){if(ids.length<2||ids.length>maxPosting||(ideas.length>2&&ids.length/ideas.length>=.85))continue;
  for(let a=0;a<ids.length;a++)for(let b=a+1;b<ids.length;b++){
    const x=ids[a],y=ids[b],key=x+'|'+y;let record=related.get(key);
    if(!record){record={x,y,shared:[]};related.set(key,record);}record.shared.push(term);
  }
 }
 const edges=[];for(const pair of related.values()){
  if(pair.shared.length<3)continue;const left=ideas[pair.x],right=ideas[pair.y];if(left.parents?.includes(right.id)||right.parents?.includes(left.id))continue;
  const union=new Set([...termMaps[pair.x],...termMaps[pair.y]]);const strength=union.size?pair.shared.length/union.size:0;
  if(strength>=.08)edges.push({a:left.id,b:right.id,shared:pair.shared.slice(0,9),strength:+strength.toFixed(4)});
 }
 return edges.sort((a,b)=>b.strength-a.strength).slice(0,limit);
}
function novelty(idea,parents,similarity){if(!parents.length)return{lexicalSimilarity:0,addedMechanismTerms:[],warning:false};const parentText=parents.map(p=>p.mechanism+' '+p.difference).join(' ');const a=terms(idea.mechanism+' '+idea.difference),b=terms(parentText);const added=[...a].filter(t=>!b.has(t));const lexicalSimilarity=Math.max(...parents.map(p=>similarity(idea.title+' '+idea.mechanism+' '+idea.difference,p.title+' '+p.mechanism+' '+p.difference)));return{lexicalSimilarity:+lexicalSimilarity.toFixed(3),addedMechanismTerms:added.slice(0,12),warning:lexicalSimilarity>=.72||added.length<2};}
function brief(idea,board,score,gold){const e=Array.isArray(idea.experiments)?idea.experiments:[];const sec=(label,value)=>'## '+label+'\n'+(plain(value).trim()||'_Not specified_')+'\n';return[
 '# '+safe(idea.title,160),'', 'Status: '+(idea.status==='archived'?'ARCHIVED':'ACTIVE')+' / '+(gold?'GOLD SHORTLIST':'UNQUALIFIED CANDIDATE'), 'Board: '+safe(board?.title), 'Generation: '+idea.generation, 'Structural jury: '+score.total+'/15. **This is not proof of real-world merit.**', '',...fields.slice(1).map(k=>sec(k[0].toUpperCase()+k.slice(1),idea[k])),
 '## Experimental evidence',e.length?e.map(x=>'- '+x.status+': '+x.hypothesis+' | observation: '+(x.result||'not yet recorded')+' | source: '+(x.source||'not supplied')).join('\n'):'No observed experimental outcomes recorded.', '',
 '## Provenance','Idea ID: '+idea.id,'Parent IDs: '+(idea.parents.join(', ')||'none'),'Source: '+idea.source,'',
 'Not a qualified project handoff. Verify assumptions before using this idea.'
 ].join('\n');}
function trace(idea,ideas){const byId=Object.fromEntries(ideas.map(i=>[i.id,i]));if(!idea)return[];const stack=[idea.id],visited=new Set(),chain=[];while(stack.length){const id=stack.pop();if(visited.has(id))continue;visited.add(id);const item=byId[id];if(!item)continue;chain.push({id:item.id,title:item.title,generation:item.generation,parents:item.parents,status:item.status,source:item.source});for(const p of item.parents||[])stack.push(p);}return chain.sort((a,b)=>a.generation-b.generation||a.title.localeCompare(b.title));}
function reviewComparison(ideas,score){const ratings=ideas.flatMap(i=>(i.reviews||[]).map(r=>({ideaId:i.id,review:r,computed:score(i).computed})));if(!ratings.length)return{count:0,meanAbsoluteError:null};let error=0;for(const r of ratings)for(const m of metrics)error+=Math.abs(r.review[m]-r.computed[m]);return{count:ratings.length,meanAbsoluteError:+(error/(ratings.length*3)).toFixed(3)};}
function autopilotPreview(ideas,score,step,prefs){const active=ideas.filter(i=>i.status!=='archived').sort((a,b)=>score(b).total-score(a).total||a.createdAt.localeCompare(b.createdAt));if(!active.length)return null;const top=active.slice(0,Math.min(5,active.length));const first=top[step%top.length];let second=null;if(active.length>=2&&step%3===2){second=active[(step+1)%active.length];if(second.id===first.id)second=active.find(i=>i.id!==first.id)||null;}const leaves=active.filter(i=>i.parents.length&&!active.some(k=>k.parents.includes(i.id))).sort((a,b)=>score(a).total-score(b).total);const possible=leaves[0]||null;return{first:first.id,firstTitle:first.title,second:second?.id||null,secondTitle:second?.title||null,possibleArchive:possible?.id||null,possibleArchiveTitle:possible?.title||null,cap:Math.max(4,Number(prefs.populationCap)||24),threshold:Math.max(3,Number(prefs.pruneThreshold)||7),disclaimer:'Preview of parent choice before generation. Future offspring, provider replies, and pruning outcomes are not known or promised.'};}
return{fields,metrics,id,safe,exploreIdeas,ruleReport,compareIdeas,dominates,pareto,search,semanticEdges,novelty,brief,trace,reviewComparison,autopilotPreview};
});
