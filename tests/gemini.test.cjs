const {test,before,after} = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
delete process.env.GEMINI_API_KEY;
delete process.env.GOOGLE_API_KEY;
const gemini = require('../gemini');
const handleRequest = require('../server');
const input = {type:'birthday',theme:'modern',city:'Delhi',guests:50,budget:75005,durationHours:4,food:'jain',notes:'No onion or garlic'};
const fixture = () => ({title:'A Garden Birthday',budgetWeights:{venue:25,food:35,decoration:15,photography:10,entertainment:10,other:5},tasks:['Book an accessible garden','Confirm Jain catering'],timeline:[{start:'18:00',activity:'Welcome'},{start:'19:00',activity:'Cake and music'},{start:'20:00',activity:'Dinner'}],decorSuggestions:['Reusable floral arches','Warm lanterns'],recommendations:['Confirm dietary needs','Keep a rain backup'],foodMenu:['Jain starters','Onion and garlic free mains']});
const mockFetch = payload => async () => ({ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify(payload)}]}}]})});

test('Gemini receives validated event details with its key confined to request headers', async()=>{
    let request;
    const plan = await gemini.generatePlan(input,{apiKey:'unit-test-key',fetchImpl:async(url,options)=>{request={url,options};return mockFetch(fixture())();}});
    assert.equal(plan.mode,'generative');
    assert.equal(plan.provider,'Google Gemini');
    assert.equal(Object.values(plan.budget).reduce((a,b)=>a+b),75005);
    assert(!request.url.includes('unit-test-key'));
    assert(!request.options.body.includes('unit-test-key'));
    assert.equal(request.options.headers['x-goog-api-key'],'unit-test-key');
    assert.match(request.options.body,/No onion or garlic/);
    assert(!JSON.stringify(plan).includes('unit-test-key'));
});
test('missing credentials never make a network call',async()=>{
    assert.equal(await gemini.generatePlan(input,{apiKey:'',fetchImpl:()=>{throw new Error('Must not call');}}),null);
});
test('provider failures return safe messages without credential or upstream body leakage',async()=>{
    await assert.rejects(()=>gemini.generatePlan(input,{apiKey:'unit-test-key',fetchImpl:async()=>({ok:false,status:429})}),/quota temporarily unavailable/);
});
test('malformed, blocked or incomplete model output is rejected',async()=>{
    for(const response of [{}, {...fixture(),timeline:[{start:'99:90',activity:'Bad time'}]}, {...fixture(),budgetWeights:{...fixture().budgetWeights,food:-1}}, {...fixture(),tasks:['Only one']}, {...fixture(),title:'x'.repeat(161)}]) {
        await assert.rejects(()=>gemini.generatePlan(input,{apiKey:'unit-test-key',fetchImpl:mockFetch(response)}));
    }
});
test('model-proposed weights cannot change total budget or create a negative amount',()=>{
    for(const budget of [1,5,101,75005]) {
        const plan = gemini.validateOutput(fixture(),{...input,budget});
        assert.equal(Object.values(plan.budget).reduce((a,b)=>a+b),budget);
        assert(Object.values(plan.budget).every(value=>value>=0));
    }
});
test('AI timelines cannot run backwards or exceed the requested event duration',()=>{
    assert.throws(()=>gemini.validateOutput({...fixture(),timeline:[{start:'18:00',activity:'Start'},{start:'19:00',activity:'Middle'},{start:'23:00',activity:'Too late'}]},input));
    assert.throws(()=>gemini.validateOutput({...fixture(),timeline:[{start:'18:00',activity:'Start'},{start:'20:00',activity:'Middle'},{start:'19:00',activity:'Backwards'}]},input));
});
test('chat uses the real provider interface and validates replies',async()=>{
    const response=await gemini.generateReply('Suggest a Jain menu',{apiKey:'unit-test-key',fetchImpl:mockFetch({reply:'Try a Jain buffet with separate serving utensils.'})});
    assert.equal(response.mode,'generative');
    assert.match(response.reply,/Jain buffet/);
    await assert.rejects(()=>gemini.generateReply('hello',{apiKey:'unit-test-key',fetchImpl:mockFetch({reply:{}})}));
});

let server,base;
const originalKey=process.env.GEMINI_API_KEY;
before(async()=>{server=http.createServer(handleRequest);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;});
after(async()=>{if(originalKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=originalKey;await new Promise(resolve=>server.close(resolve));});
test('API integrates Gemini and explicitly falls back on provider failure',async()=>{
    const original=gemini.generatePlan;
    process.env.GEMINI_API_KEY='unit-test-key';
    try {
        gemini.generatePlan=async()=>({...gemini.validateOutput(fixture(),input),model:'test-model'});
        const options={method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)};
        let response=await fetch(base+'/api/ai/plan',options);
        assert.equal((await response.json()).mode,'generative');
        gemini.generatePlan=async()=>{throw new Error('provider body should stay private');};
        response=await fetch(base+'/api/ai/plan',options);
        const plan=await response.json();
        assert.equal(plan.mode,'rules');assert.match(plan.notice,/temporarily unavailable/);
        assert(!JSON.stringify(plan).includes('provider body'));
    } finally {gemini.generatePlan=original;delete process.env.GEMINI_API_KEY;}
});
test('chat endpoint validates messages and exposes configuration failure safely',async()=>{
    let response=await fetch(base+'/api/ai/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Plan a party'})});
    assert.equal(response.status,503);
    response=await fetch(base+'/api/ai/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'x'.repeat(2001)})});
    assert.equal(response.status,400);
});
