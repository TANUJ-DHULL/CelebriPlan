/**
 * CelebriPlan — Startup Backend Engine (Node.js)
 * AI-Powered Celebration & Event Planning Platform
 *
 * Implements Section 9 AI Event Planning Engine, Vendor Marketplace API,
 * Google Calendar automatic scheduling, and RSVP tracking.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

// ─── Vendor Database ───
const vendorsDB = [
    { id: 1, name: 'Royal Palace Banquets', category: 'venue', city: 'Delhi', rating: 4.8, reviews: 324, priceMin: 50000, priceMax: 200000, priceDisplay: '₹50,000 - ₹2,00,000', badge: 'featured', capacity: '100-600 guests', services: ['AC Banquet Hall', 'Valet Parking', 'In-house Catering Option', 'Grand Stage', 'JBL Sound System'], description: 'Premier luxury banquet hall in Central Delhi with state-of-the-art acoustics and royal chandeliers.' },
    { id: 2, name: 'Dream Decorators', category: 'decorator', city: 'Mumbai', rating: 4.9, reviews: 215, priceMin: 15000, priceMax: 100000, priceDisplay: '₹15,000 - ₹1,00,000', badge: 'verified', capacity: 'Any size', services: ['Theme Décor', 'Floral Mandap', 'Neon Signage', 'Fairy Light Canopies', 'Stage Design'], description: 'Award-winning decoration team specializing in contemporary aesthetics and bespoke botanical setups.' },
    { id: 3, name: 'ClickPerfect Studios', category: 'photographer', city: 'Bangalore', rating: 4.7, reviews: 189, priceMin: 10000, priceMax: 75000, priceDisplay: '₹10,000 - ₹75,000', badge: 'verified', capacity: 'Full event', services: ['Candid Photography', '4K Cinematic Film', 'Drone Coverage', 'Premium Hardbound Album', 'Same-Day Teaser'], description: 'Storytelling photography crew equipped with Sony FX cinema rigs and DJI Mavic 3 Cine drones.' },
    { id: 4, name: 'Taste of Punjab', category: 'caterer', city: 'Chandigarh', rating: 4.6, reviews: 456, priceMin: 300, priceMax: 800, priceDisplay: '₹300 - ₹800/plate', badge: 'featured', capacity: '50-2000 guests', services: ['Authentic Amritsari Buffet', 'Live Chaat & Kulfi Counters', 'Jain & Vegan Menus', 'Uniformed Service Crew', 'Designer Tableware'], description: 'Heritage culinary masters offering five-star wedding catering and live food experiences.' },
    { id: 5, name: 'DJ Rhythm', category: 'dj', city: 'Jaipur', rating: 4.5, reviews: 167, priceMin: 8000, priceMax: 50000, priceDisplay: '₹8,000 - ₹50,000', badge: 'verified', capacity: 'Up to 1000 guests', services: ['High-Power Line Array Sound', 'Intelligent Moving Head Lights', 'CO2 Jets & Cold Pyros', 'Live Dhol Integration', 'Bollywood & EDM Sets'], description: 'Celebrity DJ and MC with over a decade of experience energizing wedding sangeets and corporate bashes.' },
    { id: 6, name: 'Elegant Events & Co', category: 'planner', city: 'Delhi', rating: 4.9, reviews: 98, priceMin: 25000, priceMax: 300000, priceDisplay: '₹25,000 - ₹3,00,000', badge: 'featured', capacity: 'End-to-End', services: ['Turnkey Event Production', 'Vendor Contract Negotiation', 'Day-of Logistics Team', 'VIP Guest Concierge'], description: 'Turnkey event planners delivering stress-free milestones and immaculate execution.' },
    { id: 7, name: 'Green Garden Grandeur', category: 'venue', city: 'Gurgaon', rating: 4.4, reviews: 201, priceMin: 30000, priceMax: 150000, priceDisplay: '₹30,000 - ₹1,50,000', badge: 'verified', capacity: '150-500 guests', services: ['Manicured Lawn', 'Poolside Deck', 'Weatherproof Glass Cabana', 'Ample Parking'], description: 'Sprawling 2-acre lawn venue with natural trees, ambient night illumination, and poolside setup.' },
    { id: 8, name: 'Floral Fantasy Jind', category: 'decorator', city: 'Jind', rating: 4.6, reviews: 87, priceMin: 10000, priceMax: 75000, priceDisplay: '₹10,000 - ₹75,000', badge: 'verified', capacity: 'Local & Regional', services: ['Exotic Floral Arches', 'Mandap Styling', 'Balloon Scaffolding', 'Entrance Welcome Board'], description: 'Top-rated decorator in Jind offering modern balloon garlands and royal marigold installations.' },
    { id: 9, name: 'Bass Beats DJ Sound', category: 'dj', city: 'Mumbai', rating: 4.3, reviews: 124, priceMin: 12000, priceMax: 60000, priceDisplay: '₹12,000 - ₹60,000', badge: 'verified', capacity: 'Up to 800 guests', services: ['P3 LED Video Wall', 'Digital Sound Console', 'Wireless Microphones', 'Fog & Bubble Machines'], description: 'Audio-visual powerhouses specializing in corporate galas and college festivals.' }
];

// In-memory bookings and guests
const bookingsDB = [];
const guestsDB = [];

// ─── Section 9 AI Event Planning Engine ───
function runAIEngine(input) {
    const type = (input.type || 'birthday').toLowerCase();
    const city = input.city || 'Jind';
    const guests = parseInt(input.guests, 10) || 50;
    const theme = (input.theme || 'modern').toLowerCase();
    const durationHours = parseInt(input.durationHours, 10) || 4;

    // Budget conversion: Support budgetPaise (paise -> INR) or direct INR budget
    let budgetInRupees = 50000;
    if (input.budgetPaise !== undefined && input.budgetPaise !== null) {
        budgetInRupees = Math.round(Number(input.budgetPaise) / 100);
    } else if (input.budget !== undefined && input.budget !== null) {
        budgetInRupees = Math.round(Number(input.budget));
    }

    // Capitalize words
    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    // Compute title
    let title = `${capitalize(theme)} ${capitalize(type)} Celebration`;
    if (type === 'college-fest' || type === 'fest') title = `${capitalize(theme)} College Fest`;
    if (type === 'corporate') title = `${capitalize(theme)} Corporate Event`;
    if (type === 'wedding') title = `${capitalize(theme)} Royal Wedding`;

    // Dynamic budget ratios matching the specification
    let ratios;
    if (type === 'birthday') {
        ratios = { venue: 0.30, food: 0.35, decoration: 0.15, photography: 0.10, other: 0.10 };
    } else if (type === 'wedding') {
        ratios = { venue: 0.30, food: 0.30, decoration: 0.15, photography: 0.15, other: 0.10 };
    } else if (type === 'college-fest') {
        ratios = { venue: 0.20, food: 0.25, decoration: 0.15, photography: 0.10, other: 0.30 };
    } else {
        ratios = { venue: 0.28, food: 0.32, decoration: 0.16, photography: 0.12, other: 0.12 };
    }

    // Allocate budget
    const budget = {
        venue: Math.round(budgetInRupees * ratios.venue),
        food: Math.round(budgetInRupees * ratios.food),
        decoration: Math.round(budgetInRupees * ratios.decoration),
        photography: Math.round(budgetInRupees * ratios.photography),
        other: 0
    };
    budget.other = budgetInRupees - (budget.venue + budget.food + budget.decoration + budget.photography);

    // Tasks
    let tasks;
    if (type === 'birthday') {
        tasks = [
            "Confirm venue",
            "Finalize food menu",
            "Send invitations",
            "Confirm photographer"
        ];
    } else if (type === 'wedding') {
        tasks = [
            "Book wedding banquet and mandap",
            "Finalize catering menu and food tasting",
            "Send digital invitations with QR entry passes",
            "Book candid photographer & cinematic videographer"
        ];
    } else if (type === 'college-fest') {
        tasks = [
            "Secure campus auditorium / open arena",
            "Finalize food stall and student refreshments",
            "Launch online registration & entry passes",
            "Book guest artist / DJ and sound setup"
        ];
    } else {
        tasks = [
            "Reserve event hall and audio-visual equipment",
            "Finalize banquet lunch/dinner menu",
            "Send RSVP invitations to attendees",
            "Confirm event photographer and keynote speakers"
        ];
    }

    // Timeline based on durationHours
    const timeline = [];
    const baseHour = 18; // 18:00 (6:00 PM)

    if (type === 'birthday') {
        timeline.push({ start: "18:00", activity: "Guest arrival" });
        timeline.push({ start: "19:00", activity: "Cake ceremony" });
        if (durationHours >= 3) {
            timeline.push({ start: "19:45", activity: "Games, music & dance" });
        }
        if (durationHours >= 4) {
            timeline.push({ start: "20:45", activity: "Dinner buffet & return gifts" });
        }
    } else if (type === 'wedding') {
        timeline.push({ start: "18:00", activity: "Baraat welcome & guest reception" });
        timeline.push({ start: "19:30", activity: "Jaimala / garland exchange ceremony" });
        timeline.push({ start: "20:30", activity: "Grand banquet dinner service" });
        timeline.push({ start: "22:00", activity: "Pheras and sacred rituals" });
    } else {
        timeline.push({ start: "10:00", activity: "Registration & welcome refreshments" });
        timeline.push({ start: "11:00", activity: "Inaugural ceremony & keynote" });
        timeline.push({ start: "13:00", activity: "Networking luncheon" });
        timeline.push({ start: "15:00", activity: "Awards & closing performance" });
    }

    return {
        title,
        budget,
        tasks,
        timeline
    };
}

// ─── Generate iCal (.ics) Payload ───
function generateICS(events) {
    let ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//CelebriPlan//Event Planning Engine//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
    ];

    events.forEach((ev, idx) => {
        const uid = `celebriplan-${Date.now()}-${idx}@celebriplan.com`;
        const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const start = ev.start || new Date(Date.now() + 86400000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const end = ev.end || new Date(Date.now() + 86400000 + 7200000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        ics.push('BEGIN:VEVENT');
        ics.push(`UID:${uid}`);
        ics.push(`DTSTAMP:${dtstamp}`);
        ics.push(`DTSTART:${start}`);
        ics.push(`DTEND:${end}`);
        ics.push(`SUMMARY:${ev.title || 'CelebriPlan Event Task'}`);
        ics.push(`DESCRIPTION:${(ev.description || 'Task scheduled via CelebriPlan AI Planner').replace(/\n/g, '\\n')}`);
        ics.push(`LOCATION:${ev.location || 'Celebration Venue'}`);
        ics.push('STATUS:CONFIRMED');
        ics.push('END:VEVENT');
    });

    ics.push('END:VCALENDAR');
    return ics.join('\r\n');
}

// ─── Request Body Helper ───
function readJSONBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
            if (body.length > 1e6) req.destroy(); // 1MB limit
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (err) {
                reject(err);
            }
        });
        req.on('error', reject);
    });
}

// ─── MIME Types Map ───
const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// ─── HTTP Server ───
const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // ── API: Section 9 AI Event Planning Engine ──
    if (req.method === 'POST' && pathname === '/api/ai/plan') {
        try {
            const input = await readJSONBody(req);
            const planOutput = runAIEngine(input);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(planOutput, null, 2));
        } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON request payload', details: err.message }));
        }
        return;
    }

    // ── API: Vendor Marketplace List & Filter ──
    if (req.method === 'GET' && pathname === '/api/vendors') {
        const category = parsedUrl.query.category;
        const city = parsedUrl.query.city;
        let result = vendorsDB;

        if (category && category !== 'all') {
            result = result.filter(v => v.category.toLowerCase() === category.toLowerCase());
        }
        if (city) {
            result = result.filter(v => v.city.toLowerCase().includes(city.toLowerCase()));
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result, null, 2));
        return;
    }

    // ── API: Vendor Comparison ──
    if (req.method === 'POST' && pathname === '/api/vendors/compare') {
        try {
            const { ids } = await readJSONBody(req);
            const idList = Array.isArray(ids) ? ids.map(Number) : [];
            const vendors = vendorsDB.filter(v => idList.includes(v.id));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ vendors, count: vendors.length }, null, 2));
        } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
        return;
    }

    // ── API: Vendor Booking ──
    if (req.method === 'POST' && pathname === '/api/vendors/book') {
        try {
            const booking = await readJSONBody(req);
            booking.id = 'BK-' + Date.now().toString(36).toUpperCase();
            booking.status = 'confirmed';
            booking.createdAt = new Date().toISOString();
            bookingsDB.push(booking);

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, booking }, null, 2));
        } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
        return;
    }

    // ── API: RSVP Submission ──
    if (req.method === 'POST' && pathname === '/api/guests/rsvp') {
        try {
            const rsvp = await readJSONBody(req);
            rsvp.id = Date.now();
            rsvp.timestamp = new Date().toISOString();
            guestsDB.push(rsvp);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, rsvp, totalGuests: guestsDB.length }, null, 2));
        } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
        return;
    }

    // ── API: Export Google Calendar .ICS ──
    if (req.method === 'GET' && pathname === '/api/calendar/export') {
        const events = [
            { title: 'Confirm Venue & Walkthrough', description: 'CelebriPlan task reminder: Finalize venue setup and check lighting.', location: 'Banquet Hall' },
            { title: 'Finalize Catering Menu', description: 'Review food menu, live counters and plate count.', location: 'Caterer Office' },
            { title: 'Send Smart Invitations & QR Passes', description: 'Broadcast WhatsApp invites with digital QR code pass.', location: 'Online' },
            { title: 'Celebration Day Event', description: 'Main event celebration commences! Check in guests via QR scanner.', location: 'Main Event Venue' }
        ];

        const icsContent = generateICS(events);
        res.writeHead(200, {
            'Content-Type': 'text/calendar; charset=UTF-8',
            'Content-Disposition': 'attachment; filename="celebriplan-schedule.ics"'
        });
        res.end(icsContent);
        return;
    }

    // ── Static Files Serving ──
    let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
    filePath = path.normalize(filePath);

    // Security check
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Access Denied');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`\n========================================================`);
    console.log(`  🎉 CelebriPlan Server is active!`);
    console.log(`  🌐 Frontend: http://localhost:${PORT}`);
    console.log(`  🤖 AI Planning Engine: POST http://localhost:${PORT}/api/ai/plan`);
    console.log(`  🏪 Vendor Marketplace: GET http://localhost:${PORT}/api/vendors`);
    console.log(`  📅 Calendar Sync .ICS: GET http://localhost:${PORT}/api/calendar/export`);
    console.log(`========================================================\n`);
});
