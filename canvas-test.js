// canvas-test.js
const { createCanvas } = require('canvas');
const fs = require('fs');

const canvas = createCanvas(800, 600);
const ctx = canvas.getContext('2d');

// Background
ctx.fillStyle = '#34495E';
ctx.fillRect(0, 0, 800, 600);

// Header bar (RED)
ctx.fillStyle = '#ff0000';
ctx.fillRect(0, 0, 800, 80);

// Footer bar (GREEN)
ctx.fillStyle = '#00ff00';
ctx.fillRect(0, 600 - 60, 800, 60);

// Label text
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 24px Arial';
ctx.fillText('Header', 20, 40);
ctx.fillText('Footer', 20, 590);

// Save output
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./test-output.png', buffer);
console.log('✅ Saved test-output.png');
