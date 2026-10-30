const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test('all routes load without JavaScript errors and keep JSON/code panels absent', async ({page}) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    for (const route of ['ai-planner','budget-calculator','vendor-marketplace','invitations','venue-3d','guest-management','expense-tracker','dashboard','vendor-dashboard','theme-generator']) {
        await page.goto('/#/' + route);
        await expect(page.locator('#page-' + route)).toBeVisible();
        await expect(page.locator('#tab-btn-engine, #blueprint-modal')).toHaveCount(0);
    }
    expect(errors).toEqual([]);
});
test('planner generates immediately, keeps exact budget, and applies tasks to dashboard', async ({page}) => {
    await page.goto('/#/ai-planner');
    await page.locator('#event-type').selectOption('birthday');
    await page.locator('#event-budget').fill('75005');
    await page.locator('#generate-plan-btn').click();
    await expect(page.locator('#plan-result')).toContainText('75,005');
    await page.getByRole('button', {name:'Apply to Dashboard'}).click();
    await page.goto('/#/dashboard');
    await expect(page.locator('#tasks-list .task-item')).toHaveCount(4);
    await page.goto('/#/expense-tracker');
    await expect(page.locator('#exp-total-budget')).toContainText('75,005');
});
test('malicious guest, task, city and chat input renders as text without executing', async ({page}) => {
    const attack = '<img src=x onerror="window.__xss=1">';
    await page.goto('/#/ai-planner');
    await page.locator('#event-type').selectOption('birthday');
    await page.locator('#event-city').fill(attack);
    await page.locator('#generate-plan-btn').click();
    await expect(page.locator('#plan-result')).toContainText(attack);
    await expect(page.locator('#plan-result img')).toHaveCount(0);
    await page.goto('/#/dashboard');
    await page.locator('#add-task-btn').click();
    await page.locator('#task-title').fill(attack);
    await page.locator('#add-task-form button[type="submit"]').click();
    await expect(page.locator('#tasks-list')).toContainText(attack);
    await expect(page.locator('#tasks-list img')).toHaveCount(0);
    await page.goto('/#/guest-management');
    await page.locator('#guest-name').fill(attack);
    await page.locator('#guest-phone').fill('9876543210');
    await page.locator('#add-guest-form button[type="submit"]').click();
    await expect(page.locator('#guest-table-body')).toContainText(attack);
    await expect(page.locator('#guest-table-body img')).toHaveCount(0);
    await page.locator('#chatbot-toggle').click();
    await page.locator('#chatbot-input').fill(attack);
    await page.locator('#chatbot-send').click();
    await expect(page.locator('.chat-message.user').last()).toContainText(attack);
    await expect(page.locator('.chat-message.user img')).toHaveCount(0);
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
});
test('footer placeholders show message, real social links point to personal profiles', async ({page}) => {
    await page.goto('/');
    await page.getByRole('link', {name:'About Us', exact:true}).click();
    await expect(page.getByRole('status')).toContainText('We will be right back');
    await expect(page.getByRole('link', {name:'GitHub', exact:true})).toHaveAttribute('href','https://github.com/TANUJ-DHULL');
});
test('mobile menu is keyboard-operable and exposes expanded state', async ({page}) => {
    await page.setViewportSize({width:390,height:844});
    await page.goto('/');
    const menu = page.getByRole('button', {name:'Toggle Navigation'});
    await menu.focus();
    await page.keyboard.press('Enter');
    await expect(menu).toHaveAttribute('aria-expanded','true');
    await page.locator('#nav-links').getByRole('link',{name:'AI Planner',exact:true}).click();
    await expect(menu).toHaveAttribute('aria-expanded','false');
    await expect(page.locator('#page-ai-planner')).toBeVisible();
});
test('primary pages pass WCAG A/AA automated accessibility checks', async ({page}) => {
    test.setTimeout(150000);
    for (const route of ['','ai-planner','budget-calculator','vendor-marketplace','invitations','venue-3d','guest-management','expense-tracker','dashboard','vendor-dashboard','theme-generator']) {
        await page.goto(route ? '/#/' + route : '/');
        const results = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
        expect.soft(results.violations.map(v => ({route, id:v.id, impact:v.impact, nodes:v.nodes.map(n => n.target)}))).toEqual([]);
    }
});
test('invitation QR is decodable and card download contains a real PNG', async ({page}) => {
    const jsQR = require('jsqr');
    await page.goto('/#/invitations');
    await page.locator('#inv-name').fill('Birthday Celebration');
    await page.locator('#inv-date').fill('2026-12-01');
    await page.locator('#inv-time').fill('18:00');
    await page.locator('#inv-venue').fill('Delhi');
    await page.locator('#invitation-form button[type="submit"]').click();
    const pixels = await page.locator('#inv-qr-code').evaluate(canvas => ({width:canvas.width, height:canvas.height, data:Array.from(canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data)}));
    const decoded = jsQR(Uint8ClampedArray.from(pixels.data), pixels.width, pixels.height);
    expect(decoded.data).toContain('Birthday Celebration');
    expect(decoded.data).toContain('Delhi');
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#download-invitation').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('celebriplan-invitation.png');
    const fs = require('fs');
    const bytes = fs.readFileSync(await download.path());
    expect(bytes.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
});
test('dialog traps keyboard focus and returns focus when closed with Escape', async ({page}) => {
    await page.goto('/#/dashboard');
    await page.locator('#add-task-btn').click();
    const dialog = page.locator('#task-modal');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('role','dialog');
    await expect(page.locator('#task-modal-close')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#add-task-form button[type="submit"]')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.locator('#add-task-btn')).toBeFocused();
});
test('3D preview loads only when visited', async ({page}) => {
    await page.goto('/#/ai-planner');
    expect(await page.evaluate(() => typeof window.redrawVenue3D)).toBe('undefined');
    await page.goto('/#/venue-3d');
    expect(await page.evaluate(() => typeof window.redrawVenue3D)).toBe('function');
});
