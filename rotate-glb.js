const fs = require('fs');
const { Document, NodeIO } = require('@gltf-transform/core');
const { KHRONOS_EXTENSIONS } = require('@gltf-transform/extensions');
const { center } = require('@gltf-transform/functions');

async function main() {
    const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);
    
    // Read the file
    const doc = await io.read('tikus-fixed.glb');
    const root = doc.getRoot();
    const scene = root.getDefaultScene() || root.listScenes()[0];
    
    if (!scene) {
        console.error("No scene found");
        return;
    }

    // A rotation of 180 degrees around Y axis (in radians: PI)
    // Quaternion for Y-rotation: [0, Math.sin(PI/2), 0, Math.cos(PI/2)] = [0, 1, 0, 0]
    // Or we can just create a wrapper node, rotate it, and put all scene nodes inside it.
    
    const wrapper = doc.createNode('RotationWrapper')
        .setRotation([0, 1, 0, 0]); // 180 degrees around Y

    const nodes = scene.listChildren();
    for (const node of nodes) {
        wrapper.addChild(node);
        scene.removeChild(node);
    }
    
    scene.addChild(wrapper);

    // Write back to the same file
    await io.write('tikus-fixed.glb', doc);
    console.log("Successfully rotated tikus-fixed.glb by 180 degrees on Y axis.");
}

main().catch(console.error);
