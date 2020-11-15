'use strict';

import {HUMERUS_BASE} from "./RotationHelper.js";
import {ShoulderVis} from "./ShoulderVis.js";

const guiOptions = {
    humerusBase: HUMERUS_BASE.TORSO,
    showAllBones: false,
    showAngles: false,
    showTriadsArcs: true,
    showBodyPlanes: false,
    showSphere: true
};

const initialViewLayout = new Map([['view1', 'HUM_EULER_YXY'], ['view2', 'HUM_EULER_XZY'], ['view3', 'HUM_SWING_TWIST']]);

const shoulderVis = new ShoulderVis('./csv', 'db_summary.json', 'N005_F_R_47', initialViewLayout, guiOptions, 'axialRot');
