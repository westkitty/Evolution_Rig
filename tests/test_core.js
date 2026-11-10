'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const C=require('../source/core.js');

test('reference calibration is separated and gold-eligible',()=>{
 const a=C.anchors();assert.equal(a.passes,true);assert.ok(a.totals.weak<=5);assert.ok(a.totals.medium>=6 && a.totals.medium<=12);assert.ok(a.totals.strong>=13);
});
test('judge is code-computed, uses a 1-5 scale and preserves overrides',()=>{
 const item=C.normalizeIdea(C.TEST_IDEAS.strong,'board-a');let j=C.judge(item,[item]);assert.equal(j.total,15);
 item.overrides={originality:2};j=C.judge(item,[item]);assert.equal(j.computed.originality,5);assert.equal(j.effective.originality,2);assert.equal(j.total,12);
 assert.ok(j.notes.some(s=>s.includes('overridden')));
});
test('gold remains scarce and never includes archived ideas',()=>{
 const b=C.board('B','Goal');const list=[];
 for(let k=0;k<25;k++){const x=C.normalizeIdea(k===0?C.TEST_IDEAS.strong:C.TEST_IDEAS.weak,b.id);if(k===0)x.overrides={originality:5,feasibility:5,impact:5};list.push(x);}
 const ids=C.goldIds(list);assert.ok(ids.size<=2);assert.ok(ids.has(list[0].id));list[0].status='archived';assert.ok(!C.goldIds(list).has(list[0].id));
});
test('branches and hybrids have correct cross-board lineage',()=>{
 const a=C.normalizeIdea(C.TEST_IDEAS.medium,'A'),b=C.normalizeIdea(C.TEST_IDEAS.weak,'A');const h=C.normalizeIdea(C.localIdeas(a,b,'Goal',1)[0],'A',[a.id,b.id],1,'hybrid');
 const byId=Object.fromEntries([a,b,h].map(i=>[i.id,i]));const tree=C.familyTree(h,byId);
 assert.equal(tree.length,3);assert.equal(tree.at(-1).id,h.id);assert.deepEqual(new Set(tree.at(-1).parents),new Set([a.id,b.id]));
});
test('export contains required agent-ready files and no model secrets',()=>{
 const b=C.board('A','Goal');const item=C.normalizeIdea(C.TEST_IDEAS.strong,b.id);C.record(item,'jury.manual-override',{reason:'Review'});
 const project=C.projectFiles(item,b,[item]);assert.ok(Object.keys(project.files).some(x=>x.endsWith('/claude.md')));
 const text=Object.values(project.files).join('\n');assert.match(text,/Smallest testable build increment/);assert.match(text,/Historical lineage/);assert.match(text,/Jury verdict/);assert.match(text,/Open questions/);
 assert.equal(C.zipFiles(project.files).type,'application/zip');
});
test('import normalizes dangerous shape and rejects unsupported schema',()=>{
 const b=C.board('A','Goal'), i=C.normalizeIdea(C.TEST_IDEAS.medium,b.id);
 assert.throws(()=>C.validateImport({schema:99,boards:[],ideas:[]}));
 const clean=C.validateImport({schema:1,boards:[b],ideas:[{...i,status:'unknown',overrides:{feasibility:9,impact:4},parents:[i.id,'not-exist']}],selectedBoardId:b.id});
 assert.equal(clean.ideas[0].status,'active');assert.equal(clean.ideas[0].overrides.feasibility,undefined);assert.equal(clean.ideas[0].overrides.impact,4);assert.deepEqual(clean.ideas[0].parents,[]);
});

test('imports are board-isolated and refuse cyclic lineage',()=>{
 const a=C.board('A','Goal A'),b=C.board('B','Goal B');
 const x=C.normalizeIdea(C.TEST_IDEAS.medium,a.id),y=C.normalizeIdea(C.TEST_IDEAS.medium,b.id);
 y.parents=[x.id];
 const sanitized=C.validateImport({schema:1,boards:[a,b],ideas:[x,y],selectedBoardId:b.id});
 assert.deepEqual(sanitized.ideas.find(i=>i.id===y.id).parents,[]);
 const p=C.normalizeIdea(C.TEST_IDEAS.medium,a.id),q=C.normalizeIdea(C.TEST_IDEAS.medium,a.id);
 p.parents=[q.id];q.parents=[p.id];
 assert.throws(()=>C.validateImport({schema:1,boards:[a],ideas:[p,q]}),/cyclic ancestry/);
});

test('adversarial verbosity fixture cannot win gold or disable reference gate',()=>{
 const a=C.anchors();assert.equal(a.passes,true);assert.ok(a.paddingTotal<=11);
 const item=C.normalizeIdea(C.TEST_IDEAS.padding,'A');
 const verdict=C.judge(item,[item]);
 assert.ok(verdict.total<13,`padded idea earned ${verdict.total}`);
 assert.ok(!C.goldIds([item]).has(item.id));
});

test('duplicate suppression keeps one legitimate source winner and cached jury is identical to direct jury',()=>{
 const a=C.normalizeIdea(C.TEST_IDEAS.strong,'A');
 const b=C.normalizeIdea(C.TEST_IDEAS.strong,'A');
 const arr=[a,b], benchmark=C.anchors();
 const verdicts=new Map(arr.map(i=>[i.id,C.judge(i,arr,benchmark)]));
 assert.ok(verdicts.get(a.id).raw.overlap>=.85);
 assert.equal(C.goldIds(arr,benchmark,verdicts).size,1);
 assert.deepEqual(C.goldIds(arr,benchmark,verdicts),C.goldIds(arr,benchmark));
});

test('evolution lens reports observable lexical changes without claiming semantic novelty',()=>{
 const a=C.normalizeIdea(C.TEST_IDEAS.medium,'A');
 const b=C.normalizeIdea(C.localIdeas(a,null,'Goal',1,0)[0],'A',[a.id],1);
 const delta=C.lineageDelta(b,[a]);
 assert.equal(delta.parentCount,1);
 assert.ok(delta.changedFields.length>0);
 assert.ok(delta.newMechanismTerms.length>0);
 assert.deepEqual(C.lineageDelta(a,[]).changedFields,[]);
});

test('deep ancestry and historical jury receipts are never silently truncated',()=>{
 const b=C.board('Long tree','Test import preservation');const list=[];
 for(let i=0;i<701;i++){
  const parents=i?[list[i-1].id]:[];
  list.push(C.normalizeIdea({title:'Generation '+i},b.id,parents,i));
 }
 const byId=Object.fromEntries(list.map(x=>[x.id,x]));
 const chain=C.familyTree(list.at(-1),byId);
 assert.equal(chain.length,701);
 assert.equal(chain[0].id,list[0].id);
 for(let i=0;i<155;i++)C.record(list[0],'jury.computed',{index:i});
 assert.equal(list[0].history.length,155);
 const restored=C.validateImport({schema:1,boards:[b],ideas:list,selectedBoardId:b.id});
 assert.equal(restored.ideas[0].history.length,155);
 assert.equal(C.familyTree(restored.ideas.at(-1),Object.fromEntries(restored.ideas.map(x=>[x.id,x]))).length,701);
});

test('import rejects dangerous identity collisions after normalization',()=>{
 const a=C.board('One','Goal');
 assert.throws(()=>C.validateImport({schema:1,boards:[a,a],ideas:[]}),/duplicate board IDs/);
 const long={...a,id:'b-'+('x'.repeat(120))};
 assert.throws(()=>C.validateImport({schema:1,boards:[long],ideas:[]}),/overlong identity/);
});

test('an established strong root does not lose gold eligibility merely by branching',()=>{
 const root=C.normalizeIdea(C.TEST_IDEAS.strong,'A',[],0);
 const child=C.normalizeIdea(C.localIdeas(root,null,'Goal',1,0)[0],'A',[root.id],1);
 const gold=C.goldIds([root,child]);
 assert.ok(gold.has(root.id),'root should retain a valid gold slot');
});
