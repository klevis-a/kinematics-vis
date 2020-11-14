import {Matrix4, Quaternion, Vector3} from "./vendor/three.js/build/three.module.js";
import {EulerDecomposition_RY$$_RX$_RY, EulerDecomposition_RY$$_RZ$_RX, EulerDecomposition_RZ$$_RX$_RY,
    ShortestPath, SwingTwist, svdDecomp} from "./RotDecompositions.js";

export const HUMERUS_BASE = {
    TORSO: 'T',
    SCAPULA: 'S'
};

export class RotationHelper {
    constructor(trajectory) {
        this.trajectory = trajectory;
        this.humerus_svdDecompClass = svdDecomp(this.trajectory);
        // do not make an attempt to call this.humerus_methods before humerus_svdDecompClass is set
        this.th_rotations = new Map(Array.from(this.humerus_methods, ([method_name, value]) => [method_name, []]));
        this.gh_rotations = new Map(Array.from(this.humerus_methods, ([method_name, value]) => [method_name, []]));
        this.st_rotations = new Map(Array.from(this.scapula_methods, ([method_name, value]) => [method_name, []]));
        this.th_quat = [];
        this.st_quat = [];
        this.gh_quat = [];
        this.th_pos = [];
        this.st_pos = [];
        this.gh_pos = [];
        for(let i=0; i<this.trajectory.NumFrames; i++) {
            const torsoPose = new Matrix4().makeRotationFromQuaternion(this.trajectory.torsoOrientQuat(i)).setPosition(this.trajectory.torsoPosVector(i));
            const scapulaPose = new Matrix4().makeRotationFromQuaternion(this.trajectory.scapOrientQuat(i)).setPosition(this.trajectory.scapPosVector(i));
            const humerusPose = new Matrix4().makeRotationFromQuaternion(this.trajectory.humOrientQuat(i)).setPosition(this.trajectory.humPosVector(i));
            const thPose = new Matrix4().getInverse(torsoPose).multiply(humerusPose);
            const ghPose = new Matrix4().getInverse(scapulaPose).multiply(humerusPose);
            const stPose = new Matrix4().getInverse(torsoPose).multiply(scapulaPose);
            const th_quat = new Quaternion().setFromRotationMatrix(thPose);
            const gh_quat = new Quaternion().setFromRotationMatrix(ghPose);
            const st_quat = new Quaternion().setFromRotationMatrix(stPose);
            const th_pos = new Vector3().setFromMatrixPosition(thPose);
            const gh_pos = new Vector3().setFromMatrixPosition(ghPose);
            const st_pos = new Vector3().setFromMatrixPosition(stPose);

            this.th_quat.push(th_quat);
            this.gh_quat.push(gh_quat);
            this.st_quat.push(st_quat);
            this.th_pos.push(th_pos);
            this.gh_pos.push(gh_pos);
            this.st_pos.push(st_pos);
            this.th_rotations.forEach((method_traj, method_name) => {
                method_traj.push(this.humerus_methods.get(method_name)(th_quat));
            });
            this.gh_rotations.forEach((method_traj, method_name) => {
                method_traj.push(this.humerus_methods.get(method_name)(gh_quat));
            });
            this.st_rotations.forEach((method_traj, method_name) => {
                method_traj.push(this.scapula_methods.get(method_name)(st_quat));
            });
        }
    }

    humerusQuat_torso(frameNum) {
        return this.th_quat[frameNum];
    }

    humerusPos_torso(frameNum) {
        return this.th_pos[frameNum];
    }

    humerusRotation_torso(method_name, frameNum) {
        return this.th_rotations.get(method_name)[frameNum];
    }

    humerusQuat_scapula(frameNum) {
        return this.gh_quat[frameNum];
    }

    humerusPos_scapula(frameNum) {
        return this.gh_pos[frameNum];
    }

    humerusRotation_scapula(method_name, frameNum) {
        return this.gh_rotations.get(method_name)[frameNum];
    }

    scapQuat(framenum) {
        return this.st_quat[framenum];
    }

    scapPos(frameNum) {
        return this.st_pos[frameNum];
    }

    scapulaRotation(method_name, frameNum) {
        return this.st_rotations.get(method_name)[frameNum];
    }
}

// lazy methods getter
Object.defineProperty(RotationHelper.prototype, 'humerus_methods', {
    get: function() {
        const methods = new Map([
            ['HUM_EULER_YXY', frameQuat => {
                const frameMat = new Matrix4().makeRotationFromQuaternion(frameQuat);
                const eulerDecomp = new EulerDecomposition_RY$$_RX$_RY(frameMat);
                return eulerDecomp.R3$$_R2$_R1;
            }],

            ['HUM_EULER_XZY', frameQuat => {
                const frameMat = new Matrix4().makeRotationFromQuaternion(frameQuat);
                const eulerDecomp = new EulerDecomposition_RY$$_RZ$_RX(frameMat);
                return eulerDecomp.R3$$_R2$_R1;
            }],

            ['HUM_SVD', frameQuat => {
                const svdDecomp = new this.humerus_svdDecompClass(frameQuat);
                return svdDecomp.rotationSequence;
            }],

            ['HUM_SHORTEST_PATH', frameQuat => {
                const oneStepDecomp = new ShortestPath(frameQuat);
                return oneStepDecomp.rotationSequence;
            }],

            ['HUM_SWING_TWIST', frameQuat => {
                const frameMat = new Matrix4().makeRotationFromQuaternion(frameQuat);
                const axialDecomp = new SwingTwist(frameQuat, new Vector3().setFromMatrixColumn(frameMat,1));
                return axialDecomp.rotationSequence;
            }],

            ['HUM_SIMULTANEOUS', frameQuat => {
                const frameMat = new Matrix4().makeRotationFromQuaternion(frameQuat);
                const axialDecomp = new SwingTwist(frameQuat, new Vector3().setFromMatrixColumn(frameMat,1));
                return axialDecomp.rotationSequence;
            }]
        ]);

        Object.defineProperty(this, 'humerus_methods', {
            value: methods
        });

        return methods;
    }
});

// lazy methods getter
Object.defineProperty(RotationHelper.prototype, 'scapula_methods', {
    get: function() {
        const methods = new Map([
            ['SCAP_EULER_YXZ', frameQuat => {
                const frameMat = new Matrix4().makeRotationFromQuaternion(frameQuat);
                const eulerDecomp = new EulerDecomposition_RZ$$_RX$_RY(frameMat);
                return eulerDecomp.R3$$_R2$_R1;
            }]
        ]);

        Object.defineProperty(this, 'scapula_methods', {
            value: methods
        });

        return methods;
    }
});
