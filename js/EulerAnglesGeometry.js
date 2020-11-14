'use strict';

import {LineBasicMaterial, MeshBasicMaterial, Line, Mesh, Group, Vector3, BufferGeometry,
    RingBufferGeometry, PlaneBufferGeometry, DoubleSide, Matrix4} from "./vendor/three.js/build/three.module.js";


export class Euler_yxy_angle_geometry {
    static POE_LINES_MATERIAL = new LineBasicMaterial({ color: 0xff0000 });
    static POE_ANGLE_MATERIAL = new MeshBasicMaterial({ color: 0xff0000, side: DoubleSide });
    static EA_LINES_MATERIAL = new LineBasicMaterial({ color: 0x00ff00 });
    static EA_ANGLE_MATERIAL = new MeshBasicMaterial({ color: 0x00ff00, side: DoubleSide });

    static createAngleObjects(eulerScene) {
        const triad = eulerScene.finalTriad_angles;
        const humerusLength = eulerScene.humerusLength;
        const y_axis = triad.arrowAxis(1);
        const [poe_lines_geometry, poe_angle_geometry] = Euler_yxy_angle_geometry.poe_geometry(y_axis, humerusLength);
        const poe_lines = new Line(poe_lines_geometry, Euler_yxy_angle_geometry.POE_LINES_MATERIAL);
        const poe_angle = new Mesh(poe_angle_geometry, Euler_yxy_angle_geometry.POE_ANGLE_MATERIAL);

        const poe_object = new Group();
        poe_object.add(poe_lines);
        poe_object.add(poe_angle);

        const [ea_lines_geometry, ea_angle_geometry] = Euler_yxy_angle_geometry.ea_geometry(y_axis, humerusLength);
        const ea_lines = new Line(ea_lines_geometry, Euler_yxy_angle_geometry.EA_LINES_MATERIAL);
        const ea_angle = new Mesh(ea_angle_geometry, Euler_yxy_angle_geometry.EA_ANGLE_MATERIAL);

        const ea_object = new Group();
        ea_object.add(ea_lines);
        ea_object.add(ea_angle);

        const ea_angle_x = new Vector3(0, -1, 0);
        const ea_angle_z = new Vector3().crossVectors(ea_angle_x, new Vector3().copy(y_axis).multiplyScalar(-1)).normalize();
        const ea_angle_y = new Vector3().crossVectors(ea_angle_z, ea_angle_x).normalize();
        ea_angle.setRotationFromMatrix(new Matrix4().makeBasis(ea_angle_x, ea_angle_y, ea_angle_z));

        return [poe_object, ea_object];
    }

    static poe_geometry(y_axis, humerusLength) {
        const poe_lines_points = [];
        const y_neg = new Vector3().copy(y_axis).multiplyScalar(-humerusLength);
        const y_neg_xz = new Vector3().set(y_neg.x, 0, y_neg.z);
        const y_neg_xz_z = new Vector3().set(0, 0, y_neg.z);
        poe_lines_points.push(y_neg);
        poe_lines_points.push(y_neg_xz);
        poe_lines_points.push(new Vector3());
        poe_lines_points.push(y_neg_xz_z);
        poe_lines_points.push(y_neg_xz);
        const poe_lines_geometry = new BufferGeometry().setFromPoints(poe_lines_points);

        const innerRadius = y_neg_xz_z.length()/2;
        const outerRadius = innerRadius + humerusLength/10;
        const poe_angle_geometry = new RingBufferGeometry(innerRadius, outerRadius, 20, 1, 0, Math.atan2(y_neg.x,y_neg.z));
        // the rotations below are to align the RingBufferGeometry with the humerus CS
        poe_angle_geometry.rotateY(-Math.PI/2);
        poe_angle_geometry.rotateZ(-Math.PI/2);
        return [poe_lines_geometry, poe_angle_geometry];
    }

    static ea_geometry(y_axis, humerusLength) {
        const ea_lines_points = [];
        const y_init_neg = new Vector3(0, 1, 0).multiplyScalar(-humerusLength);
        const y_neg = new Vector3().copy(y_axis).multiplyScalar(-humerusLength);
        ea_lines_points.push(y_neg);
        ea_lines_points.push(new Vector3());
        ea_lines_points.push(y_init_neg);
        const ea_lines_geometry = new BufferGeometry().setFromPoints(ea_lines_points);

        const innerRadius = humerusLength * 0.9;
        const outerRadius = innerRadius + humerusLength/10;
        const ea_angle_geometry = new RingBufferGeometry(innerRadius, outerRadius, 20, 1, 0, Math.acos(y_axis.y));
        return [ea_lines_geometry, ea_angle_geometry];
    }
}

export class Euler_xzy_angle_geometry {
    static EA_LINES_MATERIAL = new LineBasicMaterial({ color: 0xff0000 });
    static EA_ANGLE_MATERIAL = new MeshBasicMaterial({ color: 0xff0000, side: DoubleSide });
    static POE_LINES_MATERIAL = new LineBasicMaterial({ color: 0x00ff00 });
    static POE_ANGLE_MATERIAL = new MeshBasicMaterial({ color: 0x00ff00, side: DoubleSide });

    static createAngleObjects(eulerScene) {
        const triad = eulerScene.finalTriad_angles;
        const humerusLength = eulerScene.humerusLength;
        const y_axis = triad.arrowAxis(1);
        const [ea_lines_geometry, ea_angle_geometry] = Euler_xzy_angle_geometry.ea_geometry(y_axis, humerusLength);
        const ea_lines = new Line(ea_lines_geometry, Euler_xzy_angle_geometry.EA_LINES_MATERIAL);
        const ea_angle = new Mesh(ea_angle_geometry, Euler_xzy_angle_geometry.EA_ANGLE_MATERIAL);

        const ea_object = new Group();
        ea_object.add(ea_lines);
        ea_object.add(ea_angle);

        const [poe_lines_geometry, poe_angle_geometry] = Euler_xzy_angle_geometry.poe_geometry(y_axis, humerusLength);
        const poe_lines = new Line(poe_lines_geometry, Euler_xzy_angle_geometry.POE_LINES_MATERIAL);
        const poe_angle = new Mesh(poe_angle_geometry, Euler_xzy_angle_geometry.POE_ANGLE_MATERIAL);

        const poe_object = new Group();
        poe_object.add(poe_lines);
        poe_object.add(poe_angle);

        const y_axis_neg = new Vector3().copy(y_axis).multiplyScalar(-1);
        const y_axis_neg_x = new Vector3(y_axis_neg.x, 0, 0);
        const poe_angle_x = new Vector3().subVectors(y_axis_neg, y_axis_neg_x).normalize();
        const poe_angle_z = new Vector3().crossVectors(poe_angle_x, y_axis_neg).normalize();
        const poe_angle_y = new Vector3().crossVectors(poe_angle_z, poe_angle_x).normalize();
        poe_angle.setRotationFromMatrix(new Matrix4().makeBasis(poe_angle_x, poe_angle_y, poe_angle_z));

        return [poe_object, ea_object];
    }

    static ea_geometry(y_axis, humerusLength) {
        const ea_lines_points = [];
        const y_neg = new Vector3().copy(y_axis).multiplyScalar(-humerusLength);
        const y_neg_yz = new Vector3().set(0, y_neg.y, y_neg.z);
        const y_neg_yz_z = new Vector3().set(0, 0, y_neg.z);
        ea_lines_points.push(y_neg);
        ea_lines_points.push(y_neg_yz);
        ea_lines_points.push(new Vector3());
        ea_lines_points.push(y_neg_yz_z);
        ea_lines_points.push(y_neg_yz);
        const ea_lines_geometry = new BufferGeometry().setFromPoints(ea_lines_points);

        const innerRadius = y_neg_yz_z.length()/2;
        const outerRadius = innerRadius + humerusLength/10;
        const ea_angle_geometry = new RingBufferGeometry(innerRadius, outerRadius, 20, 1, 0, -Math.atan2(y_axis.z, y_axis.y));
        ea_angle_geometry.rotateY(-Math.PI/2);
        ea_angle_geometry.rotateX(Math.PI/2);
        return [ea_lines_geometry, ea_angle_geometry];
    }

    static poe_geometry(y_axis, humerusLength) {
        const poe_lines_points = [];
        const y_neg = new Vector3().copy(y_axis).multiplyScalar(-humerusLength);
        const y_neg_yz = new Vector3().set(0, y_neg.y, y_neg.z);
        const y_neg_x = new Vector3(y_neg.x, 0, 0);
        poe_lines_points.push(y_neg);
        poe_lines_points.push(new Vector3());
        poe_lines_points.push(y_neg_x);
        poe_lines_points.push(y_neg);
        const poe_lines_geometry = new BufferGeometry().setFromPoints(poe_lines_points);

        const innerRadius = y_neg_yz.length() * 0.7;
        const outerRadius = innerRadius + humerusLength/10;
        const poe_angle_geometry = new RingBufferGeometry(innerRadius, outerRadius, 20, 1, 0, Math.asin(-y_axis.x));
        return [poe_lines_geometry, poe_angle_geometry];
    }
}

export class AnglesVisualizationSVD {
    static PLANE_MATERIAL = new MeshBasicMaterial({ color: 0xf47460, side: DoubleSide, transparent: true, opacity: 0.3});
    static POE_ANGLE_MATERIAL = new MeshBasicMaterial({ color: 0xffffff, side: DoubleSide });
    static EA_ANGLE_MATERIAL = new MeshBasicMaterial({ color: 0xff0000, side: DoubleSide, polygonOffset: true, polygonOffsetFactor: -1.0, polygonOffsetUnits: -2 });

    static createAngleObjects(eulerScene) {
        const triad = eulerScene.finalTriad_angles;
        const humerusLength = eulerScene.humerusLength;
        const y_axis = triad.arrowAxis(1);

        //create plane
        const rotAxis = eulerScene.rotations[0].axis;
        const planeGeometry = new PlaneBufferGeometry(humerusLength*2, humerusLength*2, 1, 1);
        const poe = new Mesh(planeGeometry, AnglesVisualizationSVD.PLANE_MATERIAL);
        poe.setRotationFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), rotAxis));

        //create arrow
        const rotAxisPerp = new Vector3().crossVectors(new Vector3(0, 1, 0), rotAxis).normalize();
        const y_neg = new Vector3().copy(y_axis).multiplyScalar(-humerusLength);
        const y_neg_xz = new Vector3().set(y_neg.x, 0, y_neg.z);
        if (rotAxisPerp.dot(y_neg) < 0) {
            rotAxisPerp.multiplyScalar(-1);
        }
        const rotAngle_poe = rotAxisPerp.x;
        const innerRadius = y_neg_xz.length() * 0.7;
        const outerRadius = innerRadius + humerusLength/10;
        const poe_angle_geometry = new RingBufferGeometry(innerRadius, outerRadius, 20, 1, 0, rotAngle_poe);
        poe_angle_geometry.rotateY(-Math.PI/2);
        poe_angle_geometry.rotateZ(-Math.PI/2);
        const poe_angle = new Mesh(poe_angle_geometry, AnglesVisualizationSVD.POE_ANGLE_MATERIAL);

        const poeGroup = new Group();
        poeGroup.add(poe);
        poeGroup.add(poe_angle);

        //create ea arrow
        const rotAngle_ea = Math.abs(eulerScene.rotations[0].angle);
        const ea_angle_geometry = new RingBufferGeometry(innerRadius, outerRadius, 20, 1, 0, rotAngle_ea);
        const ea_angle = new Mesh(ea_angle_geometry, AnglesVisualizationSVD.EA_ANGLE_MATERIAL);

        const ea_angle_x = new Vector3(0, -1, 0);
        const ea_angle_y = new Vector3().crossVectors(rotAxis, ea_angle_x).normalize();
        ea_angle.setRotationFromMatrix(new Matrix4().makeBasis(ea_angle_x, ea_angle_y, rotAxis));

        const eaGroup = new Group();
        eaGroup.add(ea_angle);

        return [poeGroup, eaGroup];
    }
}