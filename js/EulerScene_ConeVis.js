import {ConeGeometry, MeshPhongMaterial, DoubleSide, Mesh, Vector3, ConeBufferGeometry, Matrix4} from "three";

// Add this function to EulerScene.js or create a new EulerScene_ConeVis.js file
export function enableConeVis(boneScene) {
    boneScene.addEventListener('reset', function(event) {
        const scene = event.target;

        scene.scene.remove(scene.cone);
        scene.cone = null;

        const currentQuat = scene.bone.quaternion;
        const currentMat = new Matrix4().makeRotationFromQuaternion(currentQuat);
        const longAxis = new Vector3();
        currentMat.extractBasis(new Vector3(), longAxis, new Vector3());

        // Get rotation axis and angle from the shortest path rotation
        const rotation = scene.rotations[0]; // In shortest path, there's only one rotation
        const axis = rotation.axis;
        const angle = 2 * axis.angleTo(longAxis);

        // Create cone geometry
        // Radius = humerusLength * sin(angle/2)
        // Height = 2 * humerusLength * sin(angle/2)
        const radius = scene.humerusLength * Math.sin(angle/2);
        const height = scene.humerusLength * Math.cos(angle/2);
        console.log(`radius = ${radius}, height = ${height}, humerus = ${scene.humerusLength}`);
        const coneGeometry = new ConeBufferGeometry(radius, height, 32, 2, true);
        coneGeometry.translate(0, -height/2, 0);

        // Create transparent material for the cone
        const coneMaterial = new MeshPhongMaterial({
            color: 0x0088ff,
            transparent: true,
            opacity: 0.6,
            side: DoubleSide
        });

        // Create cone mesh
        scene.cone = new Mesh(coneGeometry, coneMaterial);

        // Position and orient the cone
        // Move cone to center of rotation
        scene.cone.position.set(0, 0, 0);

        // Rotate cone to align with rotation axis
        scene.cone.quaternion.setFromUnitVectors(
            new Vector3(0, 1, 0), // Cone's default axis
            axis
        );

        scene.scene.add(scene.cone);
    });

    boneScene.addEventListener('dispose', function(event) {
        const scene = event.target;
        if (scene.cone) {
            scene.cone.geometry.dispose();
            scene.cone.material.dispose();
            scene.scene.remove(scene.cone);
        }
    });
}