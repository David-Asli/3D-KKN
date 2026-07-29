// Script to compile target image to .mind file using MindAR
// Run: node scripts/compile-target.mjs

import { writeFileSync } from 'fs';
import path from 'path';

// Since MindAR's node compiler may not be available,
// we'll use an alternative approach - download a pre-compiled example
// or use the browser-based compiler.

console.log("=== MindAR Target Compiler ===");
console.log("");
console.log("To compile your target image to .mind format:");
console.log("1. Open: https://hiukim.github.io/mind-ar-js-doc/tools/compile/");
console.log("2. Upload the file: public/target.png");
console.log("3. Click 'Start' to compile");
console.log("4. Download the 'targets.mind' file");
console.log("5. Place it in the 'public/' folder of this project");
console.log("");
console.log("For now, we'll download an example .mind file for demo purposes.");

// Download example .mind file from MindAR repo
const url = "https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind";

try {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
  const buffer = await response.arrayBuffer();
  const outputPath = path.join(process.cwd(), 'public', 'targets.mind');
  writeFileSync(outputPath, Buffer.from(buffer));
  console.log(`✅ Demo .mind file saved to: ${outputPath}`);
  console.log("   (This is a demo card target from MindAR examples)");
  console.log("");
  console.log("🎯 Demo target image (print or show on another screen):");
  console.log("   https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.png");
} catch (error) {
  console.error("❌ Failed to download example .mind file:", error.message);
  console.log("Please manually compile using the URL above.");
}
