const fs = require('fs');

const filename = 'tikus.glb';
const buffer = fs.readFileSync(filename);

const magic = buffer.readUInt32LE(0);
if (magic !== 0x46546C67) {
    console.log("Not a GLB file");
    process.exit(1);
}

const version = buffer.readUInt32LE(4);
const length = buffer.readUInt32LE(8);

const chunkLength = buffer.readUInt32LE(12);
const chunkType = buffer.readUInt32LE(16);

if (chunkType !== 0x4E4F534A) {
    console.log("First chunk is not JSON");
    process.exit(1);
}

const jsonChunkData = buffer.slice(20, 20 + chunkLength);
const jsonText = jsonChunkData.toString('utf8');
const gltf = JSON.parse(jsonText);

console.log("Materials:");
if (gltf.materials) {
    gltf.materials.forEach((m, i) => {
        console.log(`Material ${i}: ${m.name}`);
        if (m.pbrMetallicRoughness) {
            console.log(`  pbrMetallicRoughness:`, m.pbrMetallicRoughness);
        }
        if (m.extensions) {
            console.log(`  extensions:`, m.extensions);
        }
    });
} else {
    console.log("No materials found!");
}

console.log("\nTextures:");
if (gltf.textures) {
    console.log(`Found ${gltf.textures.length} textures.`);
} else {
    console.log("No textures found!");
}

console.log("\nImages:");
if (gltf.images) {
    console.log(`Found ${gltf.images.length} images.`);
    gltf.images.forEach((img, i) => {
        console.log(`Image ${i}: mimeType=${img.mimeType}, bufferView=${img.bufferView}`);
    });
} else {
    console.log("No images found!");
}
