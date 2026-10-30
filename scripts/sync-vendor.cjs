const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
fs.mkdirSync(path.join(root, 'vendor'), {recursive:true});
fs.copyFileSync(require.resolve('qrcode-generator'), path.join(root, 'vendor', 'qrcode.js'));
console.log('Copied the installed qrcode-generator browser library, including its license header.');
