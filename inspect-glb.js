const fs = require('fs');

const filename = process.argv[2] || 'public/pitik.glb';
const buffer = fs.readFileSync(filename);

const magic = buffer.readUInt32LE(0);
if (magic !== 0x46546C67) {
    console.log("Not a GLB file");
    process.exit(1);
}

const version = buffer.readUInt32LE(4);
const length = buffer.readUInt32LE(8);

const jsonChunkLength = buffer.readUInt32LE(12);
const jsonChunkType = buffer.readUInt32LE(16);

if (jsonChunkType !== 0x4E4F534A) {
    console.log("First chunk is not JSON");
    process.exit(1);
}

const jsonBuffer = buffer.slice(20, 20 + jsonChunkLength);
const jsonString = jsonBuffer.toString('utf8');
const gltf = JSON.parse(jsonString);

console.log("--- MATERIALS ---");
console.log(JSON.stringify(gltf.materials, null, 2));
console.log("--- TEXTURES ---");
console.log(JSON.stringify(gltf.textures, null, 2));
console.log("--- IMAGES ---");
console.log(JSON.stringify(gltf.images, null, 2));
console.log("--- MESHES ---");
console.log(JSON.stringify(gltf.meshes, null, 2));
