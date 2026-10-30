const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
    testDir: './tests', testMatch: '**/*.spec.cjs', fullyParallel: false, workers: 1,
    timeout: 60000, reporter: 'list',
    use: { baseURL:'http://127.0.0.1:3100', headless:true, channel:process.platform === 'win32' ? 'msedge' : undefined, reducedMotion:'reduce', screenshot:'only-on-failure', trace:'retain-on-failure' },
    webServer: {command:'node server.js', env:{PORT:'3100',GEMINI_API_KEY:'',GOOGLE_API_KEY:''}, url:'http://127.0.0.1:3100', reuseExistingServer:false},
});
