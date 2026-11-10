/* Data contract for the finite Seed Vault roster. */
const test=require('node:test');
const assert=require('node:assert/strict');
const seeds=require('../source/starter-ideas.js');
const C=require('../source/core.js');

test('exactly twenty distinct, categorized, immutable launch vectors',()=>{
 assert.equal(seeds.length,20);
 assert.equal(new Set(seeds.map(x=>x.id)).size,20);
 assert.equal(new Set(seeds.map(x=>x.title)).size,20);
 assert.equal(Object.isFrozen(seeds),true);
 const counts=Object.fromEntries(['Systems','Worlds','People','Planet','Strange'].map(c=>[c,seeds.filter(s=>s.category===c).length]));
 assert.deepEqual(counts,{Systems:4,Worlds:4,People:4,Planet:4,Strange:4});
 const offlineLesson=seeds.find(s=>s.id==='skills-that-travel');
 assert.ok(offlineLesson);
 assert.equal(offlineLesson.category,'People');
 assert.match(offlineLesson.mechanism,/illustrated checklist/i);
 assert.equal(seeds.filter(s=>s.category==='People').length,4);
 for(const s of seeds){assert.equal(Object.isFrozen(s),true,s.id);assert.match(s.id,/^[a-z]+(?:-[a-z]+)*$/);}
});

test('every starter is a complete, bounded, valid idea and board objective',()=>{
 for(const s of seeds){
  assert.ok(s.objective.length>35&&s.objective.length<=1600,s.id+' objective');
  assert.ok(s.tagline.length>12&&s.tagline.length<150,s.id+' tagline');
  assert.ok(s.title.length>8&&s.title.length<=120,s.id+' board title');
  for(const field of C.FIELDS){
   assert.equal(typeof s[field],'string',s.id+' '+field);
   assert.ok(s[field].trim().length>(field==='title'?8:25),s.id+' '+field);
   assert.ok(s[field].length<=(field==='title'?160:2000),s.id+' '+field+' too long');
  }
  const b=C.board(s.title,s.objective);
  const normalized=C.normalizeIdea(s,b.id,[],0,'curated starter / '+s.id);
  assert.equal(normalized.title,s.title);
  assert.deepEqual(normalized.parents,[]);
  assert.equal(normalized.generation,0);
  assert.equal(normalized.source,'curated starter / '+s.id);
  assert.ok(normalized.id);
 }
});
