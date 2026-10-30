const {test}=require('node:test');
const assert=require('node:assert/strict');
const data=require('../event-data');
const snapshot=()=>({version:1,budget:75005,timeline:[],guests:[{id:1,name:'Guest',phone:'9876543210',email:'',group:'friends',rsvp:'pending',table:0,checkedIn:false}],tasks:[{id:1,title:'Book venue',assignee:'Self',priority:'high',due:'2026-12-01',completed:false}],expenses:[{id:1,desc:'Venue',category:'venue',amount:12000,status:'pending'}]});
const storage=()=>{const items=new Map();return {getItem:key=>items.get(key)||null,setItem:(key,value)=>items.set(key,value)};};
test('saved event round-trips guests, tasks, expenses and budget',()=>{const store=storage();data.save(store,snapshot());assert.deepEqual(data.load(store),snapshot());});
test('corrupt, future-version and script-bearing enums cannot break restoration',()=>{
    const store=storage();
    for(const value of ['{broken',JSON.stringify({...snapshot(),version:99}),JSON.stringify({...snapshot(),guests:[{...snapshot().guests[0],group:'" onload="alert(1)'}]})]){
        store.setItem(data.KEY,value);assert.equal(data.load(store),null);
    }
});
test('storage denial is safe and save failures are observable',()=>{const denied={getItem(){throw new Error('denied');},setItem(){throw new Error('denied');}};assert.equal(data.load(denied),null);assert.throws(()=>data.save(denied,snapshot()),/denied/);});
test('empty guest lists survive reload instead of restoring demo guests',()=>{const store=storage();data.save(store,{...snapshot(),guests:[]});assert.deepEqual(data.load(store).guests,[]);});
test('CSV supports quoted commas, escaped quotes, BOM and CRLF',()=>{const guests=data.parseCSV('\uFEFFname,phone,email,group\r\n"Doe, Jane",123,jane@example.com,friends\r\n"Sam ""Sunny""",456,,family\r\n');assert.equal(guests.length,2);assert.equal(guests[0].name,'Doe, Jane');assert.equal(guests[1].name,'Sam "Sunny"');});
test('CSV rejects malformed headers, unclosed quotes and oversized input',()=>{for(const text of ['phone,email\n123,a@b.com','name,name\na,b','name\n"bad','x'.repeat(1048577)])assert.throws(()=>data.parseCSV(text));});
test('CSV exports escape quotes and neutralise spreadsheet formula injection',()=>{const csv=data.guestCSV([{name:'=HYPERLINK("bad")',phone:'+123',email:'',group:'friends'}]);assert(csv.includes('"\'=HYPERLINK(""bad"")"'));assert(csv.includes('"\'+123"'));});
test('invalid amounts and excessive collections are rejected before saving',()=>{assert.throws(()=>data.validate({...snapshot(),expenses:[{...snapshot().expenses[0],amount:-1}]}));assert.throws(()=>data.validate({...snapshot(),guests:new Array(5001).fill(snapshot().guests[0])}));});
