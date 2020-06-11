'use strict';

import * as THREE from "./vendor/three.js/build/three.module.js";


export class Euler_yxy_angle_geometry {
    static POE_LINES_MATERIAL = new THREE.LineBasicMaterial({ color: 0xff0000 });
    static POE_ANGLE_MATERIAL = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
    static EA_LINES_MATERIAL = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    static EA_ANGLE_MATERIAL = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });

    static createAngleObjects(y_axis, humerusLength, layerId) {
        const [poe_lines_geometry, poe_angle_geometry] = Euler_yxy_angle_geometry.poe_geometry(y_axis, humerusLength);
        const poe_lines = new THREE.Line(poe_lines_geometry, Euler_yxy_angle_geometry.POE_LINES_MATERIAL);
        poe_lines.layers.set(layerId);
        const poe_angle = new THREE.Mesh(poe_angle_geometry, Euler_yxy_angle_geometry.POE_ANGLE_MATERIAL);
        poe_angle.layers.set(layerId);

        const poe_object = new THREE.Group();
        poe_object.add(poe_lines);
        poe_object.add(poe_angle);

        const [ea_lines_geometry, ea_angle_geometry] = Euler_yxy_angle_geometry.ea_geometry(y_axis, humerusLength);
        const ea_lines = new THREE.Line(ea_lines_geometry, Euler_yxy_angle_geometry.EA_LINES_MATERIAL);
        ea_lines.layers.set(layerId);
        const ea_angle = new THREE.Mesh(ea_angle_geometry, Euler_yxy_angle_geometry.EA_ANGLE_MATERIAL);
        ea_angle.layers.set(layerId);

        const ea_object = new THREE.Group();
        ea_object.add(ea_lines);
        ea_object.add(ea_angle);

        const ea_angle_x = new THREE.Vector3(0, -1, 0);
        const ea_angle_z = new THREE.Vector3().crossVectors(ea_angle_x, new THREE.Vector3().copy(y_axis).multiplyScalar(-1)).normalize();
        const ea_angle_y = new THREE.Vector3().crossVectors(ea_angle_z, ea_angle_x).normalize();
        ea_angle.setRotationFromMatrix(new THREE.Matrix4().makeBasis(ea_angle_x, ea_angle_y, ea_angle_z));

        return [poe_object, ea_object];
    }

    static poe_geometry(y_axis, humerusLength) {
        const poe_lines_points = [];
        const y_neg = new THREE.Vector3().copy(y_axis).multiplyScalar(-humerusLength);
        const y_neg_xz = new THREE.Vector3().set(y_neg.x, 0, y_neg.z);
        const y_neg_xz_z = new THREE.Vector3().set(0, 0, y_neg.z);
        const y_neg_xz_x = new THREE.Vector3().set(y_neg.x, 0, 0);
        poe_lines_points.push(y_neg);
        poe_lines_points.push(y_neg_xz);
        poe_lines_points.push(new THREE.Vector3());
        poe_lines_points.push(y_neg_xz_z);
        poe_lines_points.push(y_neg_xz);
        const poe_lines_geometry = new THREE.BufferGeometry().setFromPoints(poe_lines_points);

        const innerRadius = y_neg_xz_z.length()/2;
        const outerRadius = innerRadius + humerusLength/10;
        const poe_angle_geometry = new THREE.RingBufferGeometry(innerRadius, outerRadius, 20, 1, 0, Math.atan(y_neg_xz_x.length()/y_neg_xz_z.length()));
        poe_angle_geometry.rotateY(-Math.PI/2);
        poe_angle_geometry.rotateZ(-Math.PI/2);
        return [poe_lines_geometry, poe_angle_geometry];
    }

    static ea_geometry(y_axis, humerusLength) {
        const ea_lines_points = [];
        const y_init_neg = new THREE.Vector3(0, 1, 0).multiplyScalar(-humerusLength);
        const y_neg = new THREE.Vector3().copy(y_axis).multiplyScalar(-humerusLength);
        const y_neg_y = new THREE.Vector3().set(0, y_neg.y, 0);
        ea_lines_points.push(y_neg);
        ea_lines_points.push(new THREE.Vector3());
        ea_lines_points.push(y_init_neg);
        const ea_lines_geometry = new THREE.BufferGeometry().setFromPoints(ea_lines_points);

        const innerRadius = humerusLength * 0.9;
        const outerRadius = innerRadius + humerusLength/10;
        const ea_angle_geometry = new THREE.RingBufferGeometry(innerRadius, outerRadius, 20, 1, 0, Math.acos(y_axis.y));
        return [ea_lines_geometry, ea_angle_geometry];
    }
}