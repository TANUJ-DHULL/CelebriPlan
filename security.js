const MAX_BODY_BYTES = 64 * 1024;

class RequestError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
    }
}

function record(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new RequestError('Expected a JSON object');
    return value;
}

function text(value, name, max = 120) {
    if (typeof value !== 'string' || !value.trim() || value.length > max || /[\x00-\x1f<>]/.test(value)) {
        throw new RequestError(`${name} must be plain text between 1 and ${max} characters`);
    }
    return value.trim();
}

function number(value, name, min, max) {
    if (!['number', 'string'].includes(typeof value) || String(value).trim() === '' || !Number.isSafeInteger(Number(value)) || Number(value) < min || Number(value) > max) {
        throw new RequestError(`${name} must be an integer between ${min} and ${max}`);
    }
    return Number(value);
}

function validatePlan(value) {
    const input = record(value);
    const types = ['birthday', 'wedding', 'college-fest', 'fest', 'corporate', 'engagement', 'anniversary', 'baby-shower', 'farewell', 'housewarming', 'festival'];
    const themes = ['modern', 'traditional', 'rustic', 'glamorous', 'minimalist', 'bohemian', 'tropical', 'vintage'];
    const type = input.type ?? 'birthday';
    const theme = input.theme ?? 'modern';
    if (!types.includes(type) || !themes.includes(theme)) throw new RequestError('Unsupported event type or theme');
    const output = {
        type, theme,
        city: text(input.city ?? 'Jind', 'city'),
        guests: number(input.guests ?? 50, 'guests', 1, 10000),
        durationHours: number(input.durationHours ?? 4, 'durationHours', 1, 24),
    };
    const food = input.food ?? 'both';
    if (!['veg','nonveg','both','jain'].includes(food)) throw new RequestError('Unsupported food preference');
    output.food = food;
    if (input.notes !== undefined && (typeof input.notes !== 'string' || input.notes.length > 2000)) throw new RequestError('Notes must be text up to 2000 characters');
    output.notes = input.notes || '';
    if (input.budgetPaise !== undefined) output.budgetPaise = number(input.budgetPaise, 'budgetPaise', 100, 10000000000);
    else output.budget = number(input.budget ?? 50000, 'budget', 1, 100000000);
    return output;
}

async function readJSONBody(req) {
    if (!((req.headers['content-type'] || '').split(';')[0].trim().toLowerCase() === 'application/json')) throw new RequestError('Content-Type must be application/json', 415);
    if (Number(req.headers['content-length']) > MAX_BODY_BYTES) throw new RequestError('Request body is too large', 413);
    if (req.body !== undefined) {
        const body = typeof req.body === 'object' ? JSON.stringify(req.body) : String(req.body);
        if (Buffer.byteLength(body) > MAX_BODY_BYTES) throw new RequestError('Request body is too large', 413);
        try { return record(JSON.parse(body)); } catch (err) { throw new RequestError('Invalid JSON object'); }
    }
    return new Promise((resolve, reject) => {
        let body = '';
        let bytes = 0;
        req.setEncoding('utf8');
        req.on('data', chunk => {
            bytes += Buffer.byteLength(chunk);
            if (bytes > MAX_BODY_BYTES) { reject(new RequestError('Request body is too large', 413)); return; }
            body += chunk;
        });
        req.on('end', () => {
            if (bytes > MAX_BODY_BYTES) return;
            try { resolve(record(JSON.parse(body))); } catch { reject(new RequestError('Invalid JSON object')); }
        });
        req.on('error', () => reject(new RequestError('Unable to read request body')));
        req.on('aborted', () => reject(new RequestError('Request aborted')));
    });
}

function escapeICS(value) {
    return String(value).replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

const headers = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};

module.exports = { RequestError, record, text, number, validatePlan, readJSONBody, escapeICS, headers };
