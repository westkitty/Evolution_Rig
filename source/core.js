/* Evolution Rig core: deterministic, dependency-free, and shared by browser and Node tests. */
(function (root, factory) {
  const lib = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = lib;
  if (root) root.RigCore = lib;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SCHEMA_VERSION = 1;
  const FIELDS = ['title','problem','audience','mechanism','difference','plan','validation','benefit','constraints','risks'];
  const METRICS = ['originality', 'feasibility', 'impact'];
  const stopwords = new Set('a an the and or but for to of in on at with from this that is are be by as it we our their will could should would into can when then using use make an app tool idea system solution which where who one each through rather than'.split(' '));
  const TEST_IDEAS = {
    weak: {
      title: 'An app that changes everything', problem: 'Problems', audience: 'Everyone',
      mechanism: 'Magic technology', difference: '', plan: 'Build it',
      validation: '', benefit: 'Amazing results', constraints: '', risks: ''
    },
    medium: {
      title: 'Simple household task organizer',
      problem: 'Roommates sometimes lose track of recurring chores and reminders.',
      audience: 'Small households sharing ordinary tasks.',
      mechanism: 'A browser checklist lets housemates mark tasks complete and filter by person.',
      difference: 'Works without an account and allows a local download of tasks.',
      plan: 'Build one list, then add local storage and export.',
      validation: 'Try it for a week and count missed tasks.',
      benefit: 'Fewer forgotten recurring tasks and less confusion.',
      constraints: 'No server or new services.', risks: 'Browser data can be deleted.'
    },
    strong: {
      title: 'Offline repair triage cards with field-proven recovery paths',
      problem: 'Technicians without connectivity waste repeat visits repeating uncertain troubleshooting and lose the evidence behind decisions.',
      audience: 'Small municipal maintenance teams working in basements and remote mechanical rooms with unreliable connectivity.',
      mechanism: 'A fully local browser decision tree stores concise symptom cards, measured evidence, reversible checks, and next-step recovery instructions; it links every decision to its predecessor.',
      difference: 'Unlike static checklists, each offline symptom card records the reason for its branch, unresolved alternatives, provenance and a one-click rollback path.',
      plan: 'Build one HTML page with three known fault scenarios, local persistence and JSON export in two afternoons; run a field simulation with five technicians.',
      validation: 'Measure median diagnosis time in minutes, incorrect branches and number of recovered decisions across 15 blinded scenarios before and after.',
      benefit: 'Cut repeat troubleshooting time by 25 percent while keeping an auditable record and reducing unnecessary site visits for 5 technicians.',
      constraints: 'No external server, no paid dependencies, no user identity collection and only three initial scenarios.',
      risks: 'An incorrect decision card could mislead users; label uncertainty and require expert signoff before field use.'
    },
    padding: Object.fromEntries(FIELDS.map(field => [field,field==='title' ? 'Generic repetitive claim' : 'test pilot measure one local specific solution process '.repeat(15)]))
  };
  const MUTATIONS = [
    {name:'Narrow the audience',prefix:'Focused', angle:'Start with one high-friction subgroup and optimize the first measurable outcome.',constraint:'Limit the pilot to one defined user segment and document excluded use cases.'},
    {name:'Manual-first proof',prefix:'Field-tested',angle:'Replace the first automation with a manual test and measure the failure modes.',constraint:'Use paper or a small offline checklist before building complex software.'},
    {name:'Reverse the workflow',prefix:'Reverse-flow',angle:'Start from the desired outcome and trace decisions backward to the minimum input.',constraint:'Show the complete decision path and allow the user to undo every step.'},
    {name:'Audit trail',prefix:'Traceable',angle:'Attach evidence, uncertainty and source decisions to every consequential output.',constraint:'Keep a small local event log that exports with the project.'},
    {name:'Constraint-led redesign',prefix:'Resilient',angle:'Design for no network, no account and graceful recovery from interruptions.',constraint:'No external dependency is necessary for the first useful increment.'},
    {name:'Measure before scaling',prefix:'Measured',angle:'Add an explicit benchmark and reject versions that fail the baseline.',constraint:'Test against five examples before increasing scope.'},
    {name:'Human veto',prefix:'Operator-led',angle:'Provide a reversible review gate before any consequential suggestion is acted on.',constraint:'No automatic destructive actions; the user can inspect and reject each step.'},
    {name:'Smallest useful slice',prefix:'One-slice',angle:'Reduce the experience to one end-to-end task that can be completed in an afternoon.',constraint:'Build exactly one representative workflow before expanding.'},
    {name:'Adversarial contrast',prefix:'Counterexample-driven',angle:'Design around a deliberately hard counterexample instead of a happy path.',constraint:'Document one known failure and a clear stop condition.'},
    {name:'Portable handoff',prefix:'Portable',angle:'Turn every decision into a portable brief so another person can reproduce it.',constraint:'Export plain text and JSON without a proprietary format.'}
  ];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  function words(str) { return String(str || '').trim().split(/\s+/).filter(Boolean); }
  // Text length alone is gameable: 100 repetitions of the same phrase are not
  // 100 independent pieces of evidence. Reward informative vocabulary coverage.
  function lengthSignal(str, needed) {
    const count=words(str).length;
    const distinct=terms(str).size;
    return Math.min(clamp(count / needed),clamp(distinct / Math.max(3, needed*.58)));
  }
  function terms(text) {
    return new Set(String(text || '').toLowerCase().match(/[a-z0-9]{3,}/g)?.filter(s=> !stopwords.has(s)) || []);
  }
  function similarity(a, b) {
    const aa = terms(a), bb = terms(b);
    if (!aa.size || !bb.size) return 0;
    let common = 0; for (const s of aa) if (bb.has(s)) common++;
    return common / (aa.size + bb.size - common);
  }
  function ideaText(i) {return [i.title,i.problem,i.mechanism,i.difference].join(' ');}
  function hasMatch(text, re) {return re.test(String(text || '').toLowerCase()) ? 1 : 0;}
  function feature(name, value, weight, reason) { return {name, value: +clamp(value).toFixed(4), weight, points: +(clamp(value)*weight).toFixed(4), reason}; }
  function rawMetrics(idea, peers = []) {
    const safePeers = peers.filter(p=>p.id !== idea.id && p.status !== 'archived');
    let maxSim = 0;
    for (const p of safePeers) maxSim = Math.max(maxSim, similarity(ideaText(idea), ideaText(p)));
    const novelty = safePeers.length ? 1 - maxSim : 0.8;
    const all = [idea.title,idea.problem,idea.mechanism,idea.difference,idea.plan,idea.validation,idea.benefit,idea.constraints].join(' ');
    const of = [
      feature('Explicit differentiation', lengthSignal(idea.difference,16), .25, 'A concrete distinction from ordinary alternatives.'),
      feature('Described mechanism', lengthSignal(idea.mechanism,22), .22, 'How this would actually work.'),
      feature('Novelty relative to board', novelty, .20, 'Maximum Jaccard token overlap with peer ideas, inverted.'),
      feature('Specific problem framing', lengthSignal(idea.problem,17), .18, 'The problem is concrete rather than vague.'),
      feature('Meaningful constraints', lengthSignal(idea.constraints,14), .15, 'Constraints force design choices rather than slogans.')
    ];
    const ff = [
      feature('Execution plan',lengthSignal(idea.plan,25),.30,'A bounded build sequence exists.'),
      feature('Test and validation',lengthSignal(idea.validation,22),.28,'A trial can falsify the proposal.'),
      feature('Practical constraints',lengthSignal(idea.constraints,16),.16,'Scope and available resources are constrained.'),
      feature('Named risks',lengthSignal(idea.risks,15),.13,'Failure modes have been acknowledged.'),
      feature('Pilot/boundary signals',hasMatch(all,/\b(pilot|prototype|first|one|week|days|hour|local|offline|manual|limited|three|five|test)\b/),.13,'The text suggests a smaller testable increment.')
    ];
    const im = [
      feature('Defined audience',lengthSignal(idea.audience,12),.20,'A real group is identified.'),
      feature('Concrete pain point',lengthSignal(idea.problem,20),.24,'A relevant issue is described.'),
      feature('Outcome statement',lengthSignal(idea.benefit,22),.26,'The benefit is understandable and specific.'),
      feature('Measurable outcome',lengthSignal(idea.validation,22),.20,'A measurable proof of impact is proposed.'),
      feature('Numeric or observational target',hasMatch(idea.benefit+' '+idea.validation,/\b\d+(?:\.\d+)?\b|\b(measure|count|rate|reduce|increase|compare|fewer|median|percentage)\b/),.10,'A target or observable change is specified.')
    ];
    const fantasy = hasMatch(all,/\b(magic|magical|infinite|instantaneously|teleport|solve everything|everyone will|guaranteed cure)\b/);
    const weighted = fs => +(fs.reduce((s,f)=>s+f.points,0)).toFixed(4);
    return { originality:weighted(of), feasibility:+clamp(weighted(ff)-fantasy*.2).toFixed(4), impact:weighted(im),
      features:{originality:of,feasibility:ff,impact:im}, overlap:+maxSim.toFixed(4), fantasyPenalty: fantasy ? .2 : 0 };
  }
  function anchors() {
    const names = ['weak','medium','strong'];
    const computed = Object.fromEntries(names.map(n=>[n,rawMetrics(TEST_IDEAS[n],[])]));
    const separated = METRICS.every(metric=>computed.strong[metric] - computed.weak[metric] >= .45);
    const scores = Object.fromEntries(names.map(n=>[n,Object.fromEntries(METRICS.map(metric=>[metric,scoreRaw(computed[n][metric],computed.weak[metric],computed.strong[metric])]))]));
    const totals=Object.fromEntries(names.map(n=>[n,METRICS.reduce((a,m)=>a+scores[n][m],0)]));
    // Negative control: fluent repetition is not equivalent to evidence-rich reasoning.
    const padded=rawMetrics(TEST_IDEAS.padding,[]);
    const paddingTotal=METRICS.reduce((sum,m)=>sum+scoreRaw(padded[m],computed.weak[m],computed.strong[m]),0);
    const passes=separated && totals.weak<=6 && totals.strong>=12 && totals.medium>=5 && totals.medium<=12 && paddingTotal<=11;
    return {computed,scores,totals,passes,separated,paddingTotal,version:'reference-fixtures-v2'};
  }
  function scoreRaw(raw, weak, strong) {
    if (strong-weak < .01) return 1;
    return 1 + Math.round(4*clamp((raw-weak)/(strong-weak)));
  }
  function judge(idea, peers=[], benchmark=anchors()) {
    const raw = rawMetrics(idea, peers);
    const computed = Object.fromEntries(METRICS.map(m=>[m,scoreRaw(raw[m],benchmark.computed.weak[m],benchmark.computed.strong[m])]));
    const overrides = {};
    for (const m of METRICS) {
      const v=idea?.overrides?.[m];
      if (Number.isInteger(v) && v>=1 && v<=5) overrides[m]=v;
    }
    const effective=Object.fromEntries(METRICS.map(m=>[m,overrides[m] || computed[m]]));
    const total=METRICS.reduce((sum,m)=>sum+effective[m],0);
    const notes=[];
    for (const m of METRICS) {
      const f=raw.features[m];
      notes.push(`${m}: raw ${raw[m].toFixed(2)}; weak anchor ${benchmark.computed.weak[m].toFixed(2)}; strong anchor ${benchmark.computed.strong[m].toFixed(2)}; computed ${computed[m]}/5${overrides[m]?' => overridden '+overrides[m]+'/5':''}.`);
      notes.push('Signals: '+f.map(x=>`${x.name} ${(x.points*100).toFixed(1)}/${(x.weight*100).toFixed(0)} pts`).join('; '));
    }
    if (raw.fantasyPenalty) notes.push('Feasibility penalty applied to unsupported extraordinary claims.');
    notes.push(`Reference gate ${benchmark.passes ? 'PASS':'FAIL'}; gold requires 13/15, all metrics >=4, no later non-improving near-duplicate and a top-decile slot.`);
    return {raw,computed,overrides,effective,total,notes,benchmarkVersion:benchmark.version,calibrationPass:benchmark.passes,at:new Date().toISOString()};
  }
  function goldIds(ideas, benchmark=anchors(), verdicts=null) {
    if (!benchmark.passes) return new Set();
    const active=ideas.filter(i=>i.status!=='archived');
    const assessed=active.map(i=>({idea:i,verdict:verdicts?.get(i.id)||judge(i,active,benchmark)}));
    const earlier=(a,b)=>a.generation<b.generation || (a.generation===b.generation && (a.createdAt<b.createdAt || (a.createdAt===b.createdAt && a.id<b.id)));
    const redundant=x=>assessed.some(y=>y.idea.id!==x.idea.id && earlier(y.idea,x.idea) && y.verdict.total>=x.verdict.total && similarity(ideaText(y.idea),ideaText(x.idea))>=.85);
    // A strong source remains eligible when it spawns similar descendants. Only
    // later near-copies that cannot beat their earlier peer are disqualified.
    const qualified=assessed.filter(x=>x.verdict.total>=13 && METRICS.every(m=>x.verdict.effective[m]>=4) && !redundant(x))
      .sort((a,b)=>b.verdict.total-a.verdict.total || b.verdict.effective.originality-a.verdict.effective.originality || a.idea.createdAt.localeCompare(b.idea.createdAt));
    const slots=Math.max(1,Math.floor(active.length*.1));
    return new Set(qualified.slice(0,slots).map(x=>x.idea.id));
  }
  function uid(prefix='n') { return prefix+'-'+(typeof crypto!=='undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,11)}`); }
  function board(title, objective) {return {id:uid('b'),title:String(title).trim().slice(0,120),objective:String(objective).trim().slice(0,1600),createdAt:new Date().toISOString(),rules:[],generationStyle:'refine'};}
  function normalizeIdea(payload,boardId,parents=[],generation=0,source='manual') {
    const item={id:uid('i'),boardId,parents:[...new Set(parents)],generation,createdAt:new Date().toISOString(),status:'active',source,overrides:{},history:[],experiments:[],reviews:[],editSnapshots:[],sourceLink:null};
    for(const k of FIELDS) item[k]=String(payload[k] || '').trim().slice(0,k==='title'?160:2000);
    return item;
  }
  // Never silently truncate an idea's audit trail. Storage pressure is surfaced
  // by the browser persist() warning and the operator can export an archive.
  function record(item,kind,details) {item.history.push({time:new Date().toISOString(),kind,details:JSON.parse(JSON.stringify(details))});}
  function localIdeas(parent,partner,objective,n=3,seq=0) {
    const ideas=[];
    const parents=partner?[parent,partner]:[parent];
    for(let i=0;i<n;i++) {
      const m=MUTATIONS[(seq+i+Number.parseInt(String(parent.id).replace(/[^0-9a-z]/gi,'').slice(-2),36)||0)%MUTATIONS.length];
      const pick=v=>parents.map(p=>String(p[v]||'').trim()).filter(Boolean);
      const join=v=>[...new Set(pick(v))].join(' / ');
      const shortTitle=String(parent.title||'Untitled').replace(/^(Focused|Resilient|Measured|Traceable|Portable|Field-tested|One-slice|Operator-led|Reverse-flow|Counterexample-driven)\s+/,'');
      const hybrid=partner ? ` + ${String(partner.title||'').slice(0,35)}` : '';
      const title=`${m.prefix} ${shortTitle}${hybrid}`.slice(0,150);
      ideas.push({
        title,
        problem:join('problem') || `Address the board goal: ${objective.slice(0,180)}`,
        audience:join('audience') || 'People directly affected by the stated board goal.',
        mechanism:`${join('mechanism')||'A deliberately small, inspectable workflow.'} ${m.angle}${partner?' Integrate both parent mechanisms with explicit checks at the seam.':''}`,
        difference:`${join('difference')||'Differentiate with a testable operating constraint.'} ${m.angle}`,
        plan:`${join('plan')||'Draft a minimum viable trial.'} Start with one test case, build the narrowest working slice, observe actual use, then decide whether to expand.`,
        validation:`${join('validation')||'Record baseline and post-test outcomes.'} Compare five examples to the original idea and count measurable improvement and failure rates.`,
        benefit:join('benefit')||'Reduce uncertainty and make the core outcome more reliable for a defined group.',
        constraints:`${join('constraints')} ${m.constraint}`.trim(),
        risks:`${join('risks')||'Unverified assumptions may undermine the expected benefit.'} Keep a rollback path and reject the idea if pilot evidence disagrees.`
      });
    }
    return ideas;
  }
  // A lexical change receipt, not a semantic novelty judgment. Helps the
  // operator inspect what a child inherited and which fields genuinely changed.
  function lineageDelta(item, parents) {
    const fields=['problem','audience','mechanism','difference','plan','validation','benefit','constraints','risks'];
    if (!parents.length)return {changedFields:[],newMechanismTerms:[],parentCount:0};
    const changedFields=fields.filter(field=>parents.every(p=>similarity(item[field],p[field])<.85));
    const parentTerms=new Set(parents.flatMap(p=>[...terms(p.mechanism+' '+p.difference)]));
    const newMechanismTerms=[...terms(item.mechanism+' '+item.difference)].filter(t=>!parentTerms.has(t)).slice(0,9);
    return {changedFields,newMechanismTerms,parentCount:parents.length};
  }
  function familyTree(item,byId) {
    // Iterative post-order walk: protects deep imported DAGs from stack limits
    // and preserves every ancestor, not merely the first 500 generations.
    const completed=new Set(),inProgress=new Set(),chain=[];
    const stack=[{id:item.id,expanded:false}];
    while(stack.length){
      const frame=stack.pop(),cur=byId[frame.id];if(!cur||completed.has(frame.id))continue;
      if(frame.expanded){
        inProgress.delete(frame.id);completed.add(frame.id);
        chain.push({id:cur.id,title:cur.title,generation:cur.generation,parents:cur.parents,source:cur.source,status:cur.status,createdAt:cur.createdAt});
        continue;
      }
      if(inProgress.has(frame.id))continue; // malformed caller graph cycle
      inProgress.add(frame.id);stack.push({id:frame.id,expanded:true});
      for(let i=cur.parents.length-1;i>=0;i--){const id=cur.parents[i];if(!completed.has(id)&&!inProgress.has(id))stack.push({id,expanded:false});}
    }
    return chain;
  }
  function slug(s) {return String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,65)||'idea';}
  function cleanText(s) {return String(s||'').replace(/\r/g,'').replace(/\u0000/g,'');}
  function md(s) {return cleanText(s).replace(/^#/gm,'\\#').trim() || '_Not specified_';}
  function projectFiles(idea,boardInfo,allIdeas,benchmark=anchors()) {
    const byId=Object.fromEntries(allIdeas.map(i=>[i.id,i]));
    const chain=familyTree(idea,byId);
    const verdict=judge(idea,allIdeas,benchmark);
    const path=slug(idea.title);
    const verdictExplain=verdict.notes.map(t=>'- '+t).join('\n');
    const parents=chain.map(c=>`- Gen ${c.generation}: ${c.title} (${c.id}; ${c.status})`).join('\n');
    const first=idea.plan||'Build one working representation of the central mechanism; test with one real example.';
    const files={};
    files[path+'/claude.md']=`# ${md(idea.title)}\n\n## Goal / board directive\n${md(boardInfo.objective)}\n\n## Core brief\nProblem: ${md(idea.problem)}\n\nAudience: ${md(idea.audience)}\n\nMechanism: ${md(idea.mechanism)}\n\nDifference: ${md(idea.difference)}\n\nExpected impact: ${md(idea.benefit)}\n\n## Smallest testable build increment\n${md(first)}\n\n**Validation:** ${md(idea.validation)}\n\n## Constraints and risks\nConstraints: ${md(idea.constraints)}\n\nRisks: ${md(idea.risks)}\n\n## Open questions\n- Which assumption is most likely to be wrong in a first trial?\n- What result would stop further work?\n- Who will validate the result and by what measure?\n\n## Historical lineage\n${parents}\n\n## Jury verdict\nOriginality ${verdict.effective.originality}/5; Feasibility ${verdict.effective.feasibility}/5; Impact ${verdict.effective.impact}/5; Total ${verdict.total}/15.\n\n${verdictExplain}\n\nThe jury is a transparent text-structure heuristic, not proof of real-world novelty, feasibility or impact. Independently validate before committing resources.\n`;
    files[path+'/README.md']=`# ${md(idea.title)}\n\nPortable handoff generated by Evolution Rig. Begin with **claude.md**, then inspect the jury evidence and lineage JSON. No API keys are included.\n\n## First step\n${md(first)}\n\n## Structure\n- claude.md - agent-ready project directive\n- brief/first-increment.md - bounded first experiment\n- jury/verdict.json - score details, overrides and evidence\n- lineage/family-tree.json - ancestors and parent edges\n- source/idea.json - selected structured idea\n`;
    files[path+'/brief/first-increment.md']=`# First increment\n\n${md(first)}\n\n## Evidence to collect\n${md(idea.validation)}\n\n## Stop rule\nDo not expand beyond this increment until measured outcomes and user review support the next step.\n`;
    files[path+'/jury/verdict.json']=JSON.stringify({ideaId:idea.id,benchmark:{version:benchmark.version,passes:benchmark.passes,totals:benchmark.totals},verdict,history:idea.history},null,2);
    files[path+'/lineage/family-tree.json']=JSON.stringify({currentIdeaId:idea.id,nodes:chain},null,2);
    files[path+'/source/idea.json']=JSON.stringify({board:boardInfo,idea},null,2);
    return {path,files,verdict};
  }
  const crcTable=(()=>{let t=[];for(let i=0;i<256;i++){let c=i;for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[i]=c>>>0;}return t;})();
  function crc32(bytes){let c=0xffffffff;for(const x of bytes)c=crcTable[(c^x)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
  function zipFiles(files){
    const encoder=new TextEncoder();const local=[],central=[];let offset=0;const now=new Date();
    const time=((now.getHours()&31)<<11)|((now.getMinutes()&63)<<5)|((Math.floor(now.getSeconds()/2))&31);
    const date=(((Math.max(1980,now.getFullYear())-1980)&127)<<9)|(((now.getMonth()+1)&15)<<5)|(now.getDate()&31);
    function header(len){const b=new Uint8Array(len);return {b,v:new DataView(b.buffer)};}
    for(const [name,str] of Object.entries(files)){
      const filename=encoder.encode(name),data=encoder.encode(str),crc=crc32(data);
      if(filename.length>65535||data.length>0xffffffff)throw Error('File too large for portable ZIP');
      const l=header(30+filename.length);
      l.v.setUint32(0,0x04034b50,true);l.v.setUint16(4,20,true);l.v.setUint16(6,0x0800,true);l.v.setUint16(8,0,true);
      l.v.setUint16(10,time,true);l.v.setUint16(12,date,true);l.v.setUint32(14,crc,true);l.v.setUint32(18,data.length,true);l.v.setUint32(22,data.length,true);l.v.setUint16(26,filename.length,true);l.b.set(filename,30);
      local.push(l.b,data);
      const c=header(46+filename.length);
      c.v.setUint32(0,0x02014b50,true);c.v.setUint16(4,20,true);c.v.setUint16(6,20,true);c.v.setUint16(8,0x0800,true);c.v.setUint16(10,0,true);
      c.v.setUint16(12,time,true);c.v.setUint16(14,date,true);c.v.setUint32(16,crc,true);c.v.setUint32(20,data.length,true);c.v.setUint32(24,data.length,true);
      c.v.setUint16(28,filename.length,true);c.v.setUint32(42,offset,true);c.b.set(filename,46);central.push(c.b);
      offset+=l.b.length+data.length;
    }
    const centralSize=central.reduce((s,x)=>s+x.length,0);
    const end=header(22);end.v.setUint32(0,0x06054b50,true);end.v.setUint16(8,central.length,true);end.v.setUint16(10,central.length,true);end.v.setUint32(12,centralSize,true);end.v.setUint32(16,offset,true);
    return new Blob([...local,...central,end.b],{type:'application/zip'});
  }
  function validateImport(raw) {
    if(!raw || raw.schema!==SCHEMA_VERSION || !Array.isArray(raw.boards) || !Array.isArray(raw.ideas))throw Error('Unsupported or malformed workspace JSON');
    if(raw.boards.length>200||raw.ideas.length>4000)throw Error('Import exceeds safe size limit');
    if(raw.boards.some(b=>typeof b.id==='string'&&b.id.length>90)||raw.ideas.some(i=>typeof i.id==='string'&&i.id.length>100))throw Error('Import contains overlong identity strings; no changes applied');
    const boards=raw.boards.filter(b=>typeof b.id==='string'&&typeof b.title==='string'&&typeof b.objective==='string').map(b=>({id:b.id,title:b.title.slice(0,120),objective:b.objective.slice(0,1600),createdAt:String(b.createdAt||new Date().toISOString()).slice(0,40),generationStyle:b.generationStyle==='explore'?'explore':'refine',rules:Array.isArray(b.rules)?b.rules.slice(0,25).filter(x=>x&&['include','exclude'].includes(x.kind)&&typeof x.phrase==='string').map(x=>({id:String(x.id||'').slice(0,80),kind:x.kind,phrase:x.phrase.trim().slice(0,120)})).filter(x=>x.phrase):[]}));
    const ids=new Set(boards.map(b=>b.id)),used=new Set();
    if(ids.size!==boards.length)throw Error('Import contains duplicate board IDs; no changes applied');
    const ideas=raw.ideas.filter(i=>typeof i.id==='string' && !used.has(i.id) && ids.has(i.boardId) && Array.isArray(i.parents))
      .map(i=>{used.add(i.id);const o={id:i.id.slice(0,100),boardId:i.boardId,parents:i.parents.filter(x=>typeof x==='string').slice(0,2),generation:Math.max(0,Math.min(10000,Number(i.generation)||0)),createdAt:String(i.createdAt||new Date().toISOString()).slice(0,40),status:i.status==='archived'?'archived':'active',source:String(i.source||'import').slice(0,60),overrides:{},history:Array.isArray(i.history)?i.history.map(h=>({time:String(h?.time||'').slice(0,40),kind:String(h?.kind||'').slice(0,100),details:h?.details&&typeof h.details==='object' ? h.details : {}})):[]};for(const f of FIELDS)o[f]=String(i[f]||'').slice(0,f==='title'?160:2000);for(const m of METRICS)if(Number.isInteger(i.overrides?.[m])&&i.overrides[m]>=1&&i.overrides[m]<=5)o.overrides[m]=i.overrides[m];
      // Additive v2 metadata lives inside schema-1-compatible optional fields.
      o.experiments=Array.isArray(i.experiments)?i.experiments.slice(-100).filter(x=>x&&typeof x==='object').map(x=>({id:String(x.id||'').slice(0,80),status:['planned','observed','inconclusive','contradicted'].includes(x.status)?x.status:'planned',hypothesis:String(x.hypothesis||'').slice(0,1000),method:String(x.method||'').slice(0,1000),baseline:String(x.baseline||'').slice(0,1000),result:String(x.result||'').slice(0,1800),source:String(x.source||'').slice(0,800),at:String(x.at||'').slice(0,40)})):[];
      o.reviews=Array.isArray(i.reviews)?i.reviews.slice(-100).filter(x=>x&&typeof x==='object').map(x=>({id:String(x.id||'').slice(0,80),at:String(x.at||'').slice(0,40),originality:Math.max(1,Math.min(5,Number(x.originality)||1)),feasibility:Math.max(1,Math.min(5,Number(x.feasibility)||1)),impact:Math.max(1,Math.min(5,Number(x.impact)||1)),note:String(x.note||'').slice(0,1000)})):[];
      o.editSnapshots=Array.isArray(i.editSnapshots)?i.editSnapshots.slice(-30).filter(x=>x&&typeof x==='object').map(x=>({at:String(x.at||'').slice(0,40),fields:Object.fromEntries(FIELDS.map(k=>[k,String(x.fields?.[k]||'').slice(0,k==='title'?160:2000)]))})):[];
      o.sourceLink=i.sourceLink&&typeof i.sourceLink==='object'?{boardId:String(i.sourceLink.boardId||'').slice(0,100),ideaId:String(i.sourceLink.ideaId||'').slice(0,100),title:String(i.sourceLink.title||'').slice(0,160),at:String(i.sourceLink.at||'').slice(0,40)}:null;
      return o;});
    const byId=new Map(ideas.map(i=>[i.id,i]));
    for(const i of ideas)i.parents=[...new Set(i.parents)].filter(p=>p!==i.id && byId.has(p) && byId.get(p).boardId===i.boardId);
    const complete=new Map(),visiting=new Set();
    function getGen(item){
      if(complete.has(item.id))return complete.get(item.id);
      if(visiting.has(item.id))throw Error('Import contains cyclic ancestry; no changes applied');
      visiting.add(item.id);const gen=item.parents.length?1+Math.max(...item.parents.map(p=>getGen(byId.get(p)))):0;visiting.delete(item.id);complete.set(item.id,gen);return gen;
    }
    for(const item of ideas)item.generation=getGen(item);
    return {schema:SCHEMA_VERSION,boards,ideas,selectedBoardId:ids.has(raw.selectedBoardId)?raw.selectedBoardId:boards[0]?.id||null,selectedIdeaId:byId.has(raw.selectedIdeaId)?raw.selectedIdeaId:null,preferences:raw.preferences&&typeof raw.preferences==='object'?{...raw.preferences}: {}};
  }
  return {SCHEMA_VERSION,FIELDS,METRICS,TEST_IDEAS,MUTATIONS,rawMetrics,anchors,judge,goldIds,board,normalizeIdea,record,localIdeas,lineageDelta,familyTree,slug,projectFiles,zipFiles,validateImport,similarity};
});
