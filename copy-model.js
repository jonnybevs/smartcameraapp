#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Copying TFLite model files...');

const sourceModel = path.join(__dirname, 'demo_model.tflite');
const assetsTarget = path.join(__dirname, 'android', 'app', 'src', 'main', 'assets', 'demo_model.tflite');
const rawTarget = path.join(__dirname, 'android', 'app', 'src', 'main', 'res', 'raw', 'demo_model.tflite');

// Ensure directories exist
const assetsDir = path.dirname(assetsTarget);
const rawDir = path.dirname(rawTarget);

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

if (!fs.existsSync(rawDir)) {
  fs.mkdirSync(rawDir, { recursive: true });
}

// Copy model to both locations
if (fs.existsSync(sourceModel)) {
  const stats = fs.statSync(sourceModel);
  console.log(`📦 Source model size: ${stats.size} bytes`);
  
  fs.copyFileSync(sourceModel, assetsTarget);
  console.log(`✅ Copied to assets: ${assetsTarget}`);
  
  fs.copyFileSync(sourceModel, rawTarget);
  console.log(`✅ Copied to raw: ${rawTarget}`);
  
  // Verify copies
  const assetsStats = fs.statSync(assetsTarget);
  const rawStats = fs.statSync(rawTarget);
  
  console.log(`✅ Assets copy size: ${assetsStats.size} bytes`);
  console.log(`✅ Raw copy size: ${rawStats.size} bytes`);
  
  if (assetsStats.size === stats.size && rawStats.size === stats.size) {
    console.log('✅ Model files copied successfully!');
  } else {
    console.error('❌ File size mismatch!');
    process.exit(1);
  }
} else {
  console.error(`❌ Source model not found: ${sourceModel}`);
  process.exit(1);
}
