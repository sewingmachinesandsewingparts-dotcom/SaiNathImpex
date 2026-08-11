const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// create dummy images
fs.mkdirSync('test-bulk', { recursive: true });
fs.writeFileSync('test-bulk/1.jpeg', 'dummy image 1');
fs.writeFileSync('test-bulk/2.jpeg', 'dummy image 2');
fs.writeFileSync('test-bulk/3.jpeg', 'dummy image 3');
fs.writeFileSync('test-bulk/doc.txt', 'this is invalid');

console.log('Created test files. Please zip them manually or use a command if you want.');
