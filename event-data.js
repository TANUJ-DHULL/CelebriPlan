(function(root){
    'use strict';
    const KEY='celebriplan:event:v1';
    const groups=['family','friends','colleagues','vip','others'];
    const str=(value,max=500)=>typeof value==='string'&&value.length<=max;
    const integer=(value,max=100000000)=>Number.isSafeInteger(value)&&value>=0&&value<=max;
    const id=value=>Number.isSafeInteger(value)&&value>0;
    function validate(value){
        if(!value||value.version!==1||!integer(value.budget,100000000)||value.budget<1)throw new Error('Invalid saved event');
        const list=(items,check)=>{if(!Array.isArray(items)||items.length>5000||items.some(item=>!item||!check(item)))throw new Error('Invalid saved event');return items;};
        return {
            version:1,budget:value.budget,
            timeline:list(value.timeline||[],item=>str(item.start,5)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(item.start)&&str(item.activity)),
            guests:list(value.guests,g=>id(g.id)&&str(g.name,120)&&g.name.trim()&&str(g.phone,40)&&str(g.email,160)&&groups.includes(g.group)&&['accepted','declined','pending','maybe'].includes(g.rsvp)&&integer(g.table,1000)&&typeof g.checkedIn==='boolean'),
            tasks:list(value.tasks,t=>id(t.id)&&str(t.title)&&str(t.assignee,160)&&['high','medium','low'].includes(t.priority)&&str(t.due,10)&&(!t.due||/^\d{4}-\d{2}-\d{2}$/.test(t.due))&&typeof t.completed==='boolean'),
            expenses:list(value.expenses,e=>id(e.id)&&str(e.desc)&&['venue','food','decoration','photography','entertainment','music','transport','other','decorator','caterer','dj','planner'].includes(e.category)&&integer(e.amount)&&['paid','pending','partial'].includes(e.status)),
        };
    }
    function load(storage){try{const raw=storage.getItem(KEY);if(!raw||raw.length>262144)return null;return validate(JSON.parse(raw));}catch{return null;}}
    function save(storage,value){const text=JSON.stringify(validate(value));if(text.length>262144)throw new Error('Saved event is too large');storage.setItem(KEY,text);}
    function parseCSV(text){
        if(typeof text!=='string'||text.length>1048576)throw new Error('CSV must be smaller than 1 MB');
        text=text.replace(/^\uFEFF/,'');
        const rows=[];let row=[],cell='',quoted=false;
        for(let i=0;i<text.length;i++){
            const ch=text[i];
            if(ch==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else if(!quoted&&cell){throw new Error('Invalid CSV quoting');}else quoted=!quoted;}
            else if(ch===','&&!quoted){row.push(cell);cell='';}
            else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell='';}
            else cell+=ch;
            if(rows.length>1001)throw new Error('Import up to 1000 guests at a time');
        }
        if(quoted)throw new Error('Unclosed CSV quote');
        row.push(cell);if(row.some(v=>v.trim()))rows.push(row);
        const headers=(rows.shift()||[]).map(v=>v.trim().toLowerCase());
        if(!headers.includes('name')||new Set(headers).size!==headers.length)throw new Error('CSV needs a unique name column');
        if(rows.length>1000)throw new Error('Import up to 1000 guests at a time');
        return rows.map((values,index)=>{
            const data=Object.fromEntries(headers.map((key,i)=>[key,(values[i]||'').trim()]));
            if(!data.name||data.name.length>120||(data.phone||'').length>40||(data.email||'').length>160)throw new Error(`Invalid guest at row ${index+2}`);
            return {id:Date.now()+index,name:data.name.replace(/\s+/g,' '),phone:data.phone||'',email:data.email||'',group:groups.includes(data.group)?data.group:'others',rsvp:'pending',table:0,checkedIn:false};
        });
    }
    function guestCSV(guests){
        const cell=value=>'"'+String(value||'').replace(/^([\s]*[=+@-])/,'\'$1').replace(/"/g,'""')+'"';
        return ['name,phone,email,group',...guests.map(g=>[g.name,g.phone,g.email,g.group].map(cell).join(','))].join('\r\n');
    }
    const api={KEY,validate,load,save,parseCSV,guestCSV};
    if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CelebrationData=api;
})(typeof globalThis!=='undefined'?globalThis:this);
