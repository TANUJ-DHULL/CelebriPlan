const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
delete process.env.GEMINI_API_KEY;
delete process.env.GOOGLE_API_KEY;
const handleRequest = require('../server');
const { allocateBudget } = require('../planning');
const { escapeICS } = require('../security');
let server, base;
before(async () => {
    server = http.createServer(handleRequest);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));
const post = (path, body, headers = {}) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });

test('all public assets are served with safe content types and security headers', async () => {
    for (const path of ['/', '/app.js', '/styles.css', '/planning.js', '/features/venue.mjs', '/features/themes.mjs', '/features/vendor-dashboard.mjs']) {
        const response = await fetch(base + path);
        assert.equal(response.status, 200);
        assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
        assert.equal(response.headers.get('x-frame-options'), 'DENY');
        assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
    }
});
test('source files, environment files and repository metadata cannot be downloaded', async () => {
    for (const path of ['/server.js', '/security.js', '/package.json', '/.env.local', '/.git/config', '/api/index.js', '/%2e%2e%2fserver.js']) {
        assert.equal((await fetch(base + path)).status, 404, path);
    }
});
test('every allocation is non-negative and totals the supplied budget, including rounding edges', () => {
    for (const total of [0, 1, 2, 3, 5, 7, 99, 50000, 100000001]) {
        const allocation = allocateBudget(total, {venue:.3, food:.35, decoration:.15, photography:.1, other:.1});
        assert.equal(Object.values(allocation).reduce((a,b) => a+b), total);
        assert(Object.values(allocation).every(value => Number.isInteger(value) && value >= 0));
    }
    assert.throws(() => allocateBudget(-1, {food:1}));
    assert.throws(() => allocateBudget(10, {food:-1}));
});
test('planner validates input and conserves budget for different event types', async () => {
    for (const type of ['birthday', 'wedding', 'corporate', 'college-fest']) {
        const response = await post('/api/ai/plan', {type, city:'Jind', guests:50, budget:50005, theme:'modern', durationHours:4});
        assert.equal(response.status, 200);
        const plan = await response.json();
        assert.equal(Object.values(plan.budget).reduce((a,b) => a+b), 50005);
        assert(plan.tasks.length && plan.timeline.length);
    }
});
test('planner supports paise input and defaults', async () => {
    const response = await post('/api/ai/plan', {budgetPaise:5000000});
    assert.equal(response.status, 200);
    assert.equal(Object.values((await response.json()).budget).reduce((a,b) => a+b), 50000);
});
test('invalid numeric, enum, object and script inputs are rejected', async () => {
    for (const body of [null, [], {guests:-1}, {guests:0}, {guests:1.5}, {budget:'Infinity'}, {budget:-5}, {durationHours:25}, {type:{}}, {theme:'<script>'}, {city:'<img src=x onerror=alert(1)>'}]) {
        assert.equal((await post('/api/ai/plan', body)).status, 400, JSON.stringify(body));
    }
});
test('malformed, oversized and non-JSON requests return useful errors', async () => {
    assert.equal((await post('/api/ai/plan', '{broken')).status, 400);
    assert.equal((await post('/api/ai/plan', {city:'a'.repeat(70000)})).status, 413);
    assert.equal((await post('/api/ai/plan', '{}', {'Content-Type':'text/plain'})).status, 415);
});
test('cross-site origins are rejected instead of wildcard CORS', async () => {
    assert.equal((await post('/api/ai/plan', {}, {Origin:'https://evil.example'})).status, 403);
    const allowed = await post('/api/ai/plan', {}, {Origin:'https://celebri-plan.vercel.app'});
    assert.equal(allowed.status, 200);
    assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://celebri-plan.vercel.app');
});
test('vendor search and comparison return relevant results', async () => {
    const vendors = await (await fetch(base + '/api/vendors?city=Delhi&category=venue')).json();
    assert(vendors.length && vendors.every(v => v.city === 'Delhi' && v.category === 'venue'));
    const compare = await post('/api/vendors/compare', {ids:[1,2]});
    assert.equal((await compare.json()).count, 2);
    assert.equal((await post('/api/vendors/compare', {ids:[1,2,3,4,5]})).status, 400);
});
test('booking and RSVP reject bad input and explicitly disclose demo receipts', async () => {
    assert.equal((await post('/api/vendors/book', {})).status, 400);
    const receipt = await (await post('/api/vendors/book', {vendorId:1, name:'Test Guest', guests:20})).json();
    assert.equal(receipt.booking.status, 'request-received');
    assert.match(receipt.notice, /no reservation/);
    assert.equal((await post('/api/guests/rsvp', {name:'Test', status:'invalid'})).status, 400);
    assert.equal((await post('/api/guests/rsvp', {name:'Test', status:'accepted'})).status, 200);
});
test('calendar downloads are valid iCalendar and escape injected properties', async () => {
    const response = await fetch(base + '/api/calendar/export');
    assert.match(response.headers.get('content-type'), /text\/calendar/);
    const body = await response.text();
    assert(body.startsWith('BEGIN:VCALENDAR\r\n'));
    assert(body.endsWith('END:VCALENDAR'));
    assert.equal(escapeICS('Name\r\nATTENDEE:evil,;'), 'Name\\nATTENDEE:evil\\,\\;');
});
test('public page retains requested footer and excludes developer code panels', async () => {
    const html = await (await fetch(base)).text();
    assert.match(html, /celebration &amp; event planning platform that makes every occasion unforgettable\./);
    assert(!/engine-json-input|plan-json-result|blueprint-modal/.test(html));
});
test('vendored QR encoder matches the locked dependency', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    assert.equal(fs.readFileSync(path.join(__dirname, '../vendor/qrcode.js'), 'utf8'), fs.readFileSync(require.resolve('qrcode-generator'), 'utf8'));
});
