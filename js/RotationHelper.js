import {Matrix4, Quaternion, Vector3} from "./vendor/three.js/build/three.module.js";
import {
    EulerDecomposition_RY$$_RX$_RY,
    EulerDecomposition_RY$$_RZ$_RX,
    ShortestPath,
    SwingTwist,
    svdDecomp
} from "./RotDecompositions.js";

export const HUMERUS_BASE = {
    TORSO: 0,
    SCAPULA: 1
};

export class RotationHelper {
    constructor(trajectory) {
        this.trajectory = trajectory;
        this.humerus_svdDecompClass = svdDecomp(this.trajectory);
        // do not make an attempt to call this.humerus_methods before humerus_svdDecompClass is set
        this.th_rotations = new Map(Array.from(this.humerus_methods, ([method_name, value]) => [method_name, []]));
        this.gh_rotations = new Map(Array.from(this.humerus_methods, ([method_name, value]) => [method_name, []]));
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
        }
        this.currentHumerusBase = HUMERUS_BASE.TORSO;
        this.humQuatTraj = this.th_quat;
        this.humRotTraj = this.th_rotations;
        this.humPosTraj = this.th_pos;

    }

    changeHumerusBase(newBase) {
        switch (newBase) {
            case HUMERUS_BASE.TORSO:
                this.currentHumerusBase = HUMERUS_BASE.TORSO;
                this.humQuatTraj = this.th_quat;
                this.humRotTraj = this.th_rotations;
                this.humPosTraj = this.th_pos;
                break;
            case HUMERUS_BASE.SCAPULA:
                this.currentHumerusBase = HUMERUS_BASE.SCAPULA;
                this.humQuatTraj = this.gh_quat;
                this.humRotTraj = this.gh_rotations;
                this.humPosTraj = this.gh_pos;
                break;
            default:
                this.currentHumerusBase = HUMERUS_BASE.TORSO;
                this.humQuatTraj = this.th_quat;
                this.humRotTraj = this.th_rotations;
                this.humPosTraj = this.th_pos;
        }
    }

    humerusQuat(frameNum) {
        return this.humQuatTraj[frameNum];
    }

    humerusPos(frameNum) {
        return this.humPosTraj[frameNum];
    }

    humerusRotation(method_name, frameNum) {
        return this.humRotTraj.get(method_name)[frameNum];
    }

    scapQuat(framenum) {
        return this.st_quat[framenum];
    }

    scapPos(frameNum) {
        return this.st_pos[frameNum];
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