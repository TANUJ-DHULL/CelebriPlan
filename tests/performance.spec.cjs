const { test, expect } = require('@playwright/test');

test('homepage defers optional features and keeps startup assets within budget', async ({ page }) => {
    const requested = [];
    page.on('request', request => requested.push(new URL(request.url()).pathname));
    await page.goto('/');
    await expect(page.locator('#page-home')).toBeVisible();
    expect(requested.filter(path => path.startsWith('/features/'))).toEqual([]);
    const sizes = await page.evaluate(async () => {
        return Promise.all(['/app.js', '/styles.css'].map(async path => {
            const response = await fetch(path);
            return (await response.arrayBuffer()).byteLength;
        }));
    });
    // Prevent accidental return to the previous 161KB app / 95KB stylesheet.
    expect(sizes[0]).toBeLessThan(130000);
    expect(sizes[1]).toBeLessThan(85000);
});

test('optional routes load once and retain controls when revisited', async ({ page }) => {
    const requests = [];
    const errors = [];
    page.on('request', request => requests.push(new URL(request.url()).pathname));
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/#/venue-3d');
    await expect(page.locator('#page-venue-3d')).toHaveAttribute('data-ready', 'true');
    await page.locator('#v3d-zoom-in').click();
    await page.locator('.lighting-btn').last().click();
    await page.locator('.lighting-btn').first().click();
    expect(await page.locator('#venue-canvas').evaluate(canvas => canvas.getContext('2d').getTransform().a)).toBeCloseTo(1.1);
    await page.goto('/#/theme-generator');
    await expect(page.locator('#theme-gen-results .theme-concept-card').first()).toBeVisible();
    await page.goto('/#/vendor-dashboard');
    await expect(page.locator('#vd-services-list .vd-service-card')).toHaveCount(3);
    await page.goto('/#/venue-3d');
    await expect(page.locator('#venue-canvas')).toHaveAttribute('data-zoom', '1.1');
    for (const name of ['venue', 'themes', 'vendor-dashboard']) {
        expect(requests.filter(path => path === `/features/${name}.mjs`)).toHaveLength(1);
    }
    expect(errors).toEqual([]);
});

test('failed optional feature leaves navigation usable and explains recovery', async ({ page }) => {
    await page.route('**/features/venue.mjs', route => route.abort());
    await page.goto('/#/venue-3d');
    await expect(page.getByRole('alert')).toContainText('Reload the page to try again');
    await expect(page.locator('#page-venue-3d')).toHaveAttribute('aria-busy', 'false');
    await page.locator('#nav-links [data-page="ai-planner"]').click();
    await expect(page.locator('#page-ai-planner')).toBeVisible();
});

test('countdown pauses off dashboard and catches up on return', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-30T12:00:00Z') });
    await page.goto('/#/dashboard');
    const readCountdown = () => page.locator('#cd-minutes, #cd-seconds').allTextContents();
    await page.goto('/#/ai-planner');
    const before = await readCountdown();
    await page.clock.fastForward(65000);
    expect(await readCountdown()).toEqual(before);
    await page.goto('/#/dashboard');
    expect(await readCountdown()).not.toEqual(before);
});
