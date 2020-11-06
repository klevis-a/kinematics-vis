import * as THREE from "./vendor/three.js/build/three.module.js";

export function createArc(triad1, triad2, rotAxis, rotAngle, rotPlane, dim, stripBottomDistance, stripWidth, arcMaterial, radialSegments, heightSegments) {
    let coneAxis;
    let coneAngle;
    // it's easier to perform the calculations below if the unit vector we are rotating and the unit vector indicating
    // the axis of rotation point in the same general direction
    if (rotAxis.dot(triad1.arrowAxis(dim)) > 0) {
        coneAxis = new THREE.Vector3().copy(rotAxis);
        coneAngle = rotAngle;
    } else {
        coneAxis = new THREE.Vector3().copy(rotAxis).multiplyScalar(-1);
        coneAngle = -rotAngle;
    }

    const stripTopDistance = stripBottomDistance + stripWidth;
    const angleToRotAxis = triad1.arrowAxis(dim).angleTo(coneAxis);
    const radiusTop = stripTopDistance*Math.sin(angleToRotAxis);
    const radiusBottom = stripBottomDistance*Math.sin(angleToRotAxis);
    const height = stripWidth*Math.cos(angleToRotAxis);
    const arcGeometry = new THREE.CylinderBufferGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, true, 0, coneAngle);
    // the XZ plane bisects the created arc - we need to move it along the y-axis so it's placed properly
    arcGeometry.translate(0, (stripBottomDistance+stripWidth/2)*Math.cos(angleToRotAxis), 0);
    // we want the strip to appear during the animations so for now we don't draw anything
    arcGeometry.setDrawRange(0, 0);
    const arc = new THREE.Mesh(arcGeometry, arcMaterial);
    // the z-axis of the arc is its starting "point" - the arrow is projected onto the plane of the rotation because
    // this allows us to form a right-handed coordinate. Note that component perpendicular to the plane of the rotation
    // is not rotated (it can't be - it's parallel to the rotation axis). It's magnitude is account for in the radius
    // and geometry translation calculation
    const arc_ZAxis = rotPlane.projectPoint(triad1.arrowAxis(dim), new THREE.Vector3()).normalize();
    // the y-axis of arc is the rotAxis
    const arc_YAxis = coneAxis;
    // and the x-axis is created from the cross-product
    const arc_XAxis = new THREE.Vector3().crossVectors(arc_YAxis, arc_ZAxis);
    arc.setRotationFromMatrix(new THREE.Matrix4().makeBasis(arc_XAxis, arc_YAxis, arc_ZAxis));
    arc.updateMatrixWorld();
    return arc;
}

export function arrowGeometryFromArcGeometry(arcGeometry, numRadialSegments, numHeightSegments, arrowLength, arrowOffsetLength) {
    const arcGeometryPositions = arcGeometry.attributes.position.array;
    const arrowGeometry = new THREE.Geometry();
    // these comprise the base of the triangle
    const v1 = new THREE.Vector3(arcGeometryPositions[0], arcGeometryPositions[1], arcGeometryPositions[2]);
    const v1_adjacent = new THREE.Vector3(arcGeometryPositions[3], arcGeometryPositions[4], arcGeometryPositions[5]);
    const segmentDistance = new THREE.Vector3().subVectors(v1_adjacent, v1).length();
    const arrowSegmentLength = Math.round(arrowLength/segmentDistance);
    const topFirstIndex = ((numRadialSegments+1)*numHeightSegments);
    const v2 = new THREE.Vector3(arcGeometryPositions[topFirstIndex*3], arcGeometryPositions[topFirstIndex*3+1],
        arcGeometryPositions[topFirstIndex*3+2]);
    // now we compute the tip of the triangle
    const posBottom = new THREE.Vector3(arcGeometryPositions[arrowSegmentLength*3], arcGeometryPositions[arrowSegmentLength*3+1],
        arcGeometryPositions[arrowSegmentLength*3+2]);
    const posTop = new THREE.Vector3(arcGeometryPositions[(topFirstIndex+arrowSegmentLength)*3], arcGeometryPositions[(topFirstIndex+arrowSegmentLength)*3+1],
        arcGeometryPositions[(topFirstIndex+arrowSegmentLength)*3+2]);
    const v3 = new THREE.Vector3().addVectors(posBottom, posTop).multiplyScalar(0.5);

    //add vertices and normalize by v1
    arrowGeometry.vertices.push(new THREE.Vector3());
    arrowGeometry.vertices.push(v2.sub(v1));
    arrowGeometry.vertices.push(v3.sub(v1));

    arrowGeometry.faces.push(new THREE.Face3(0, 2, 1));

    //now we'll make it so the x-axis is defined by the, the y-axis points toward the tip, and the z-axis is perpendicular to the triangle plane
    const x_axis = new THREE.Vector3().copy(v2);
    const z_axis = new THREE.Vector3().crossVectors(v2, v3);
    const y_axis = new THREE.Vector3().crossVectors(z_axis, x_axis);
    //normalize
    x_axis.normalize();
    y_axis.normalize();
    z_axis.normalize();

    //rotation of triangle with respect to coordinate system
    arrowGeometry.applyMatrix4(new THREE.Matrix4().getInverse(new THREE.Matrix4().makeBasis(x_axis, y_axis, z_axis)));
    const arrowSegmentOffsetLength = Math.ceil(arrowOffsetLength/segmentDistance);
    return {arrowGeometry, arrowSegmentLength, arrowSegmentOffsetLength};
}

export function updateFlatArcArrow(arcArrow, arrowGeometry, drawRange, numRadialSegments, numHeightSegments, arrowSegmentLength, arrowSegmentOffset) {
    const arcArrowV1Idx = arrowGeometry.index.array[drawRange - 1] - arrowSegmentLength - arrowSegmentOffset;
    const arcPositions = arrowGeometry.attributes.position.array;
    const v1 = new THREE.Vector3().set(arcPositions[arcArrowV1Idx * 3], arcPositions[arcArrowV1Idx * 3 + 1], arcPositions[arcArrowV1Idx * 3 + 2]);
    arcArrow.position.copy(v1);

    //although it's not necessary to compute the midpoint for determining the orientation of the arrow we do so to mirror the geometry creation step
    const arcArrowV2Idx =  arcArrowV1Idx + ((numRadialSegments + 1) * numHeightSegments);
    const arcE1ArrowV3BottomIdx = arrowGeometry.index.array[drawRange - 1] - arrowSegmentOffset;
    const arcE1ArrowV3TopIdx = arcE1ArrowV3BottomIdx + ((numRadialSegments + 1) * numHeightSegments);
    const v2 = new THREE.Vector3().set(arcPositions[arcArrowV2Idx * 3], arcPositions[arcArrowV2Idx * 3 + 1],
        arcPositions[arcArrowV2Idx * 3 + 2]);
    const v3Top = new THREE.Vector3().set(arcPositions[arcE1ArrowV3TopIdx * 3], arcPositions[arcE1ArrowV3TopIdx * 3 + 1],
        arcPositions[arcE1ArrowV3TopIdx * 3 + 2]);
    const v3Bottom = new THREE.Vector3().set(arcPositions[arcE1ArrowV3BottomIdx * 3], arcPositions[arcE1ArrowV3BottomIdx * 3 + 1],
        arcPositions[arcE1ArrowV3BottomIdx * 3 + 2]);
    const v3 = new THREE.Vector3().addVectors(v3Top, v3Bottom).multiplyScalar(0.5);
    //create CS and normalize
    const x_axis = new THREE.Vector3().subVectors(v2,v1);
    const z_axis = new THREE.Vector3().crossVectors(x_axis, new THREE.Vector3().subVectors(v3,v1));
    const y_axis = new THREE.Vector3().crossVectors(z_axis, x_axis);
    x_axis.normalize();
    y_axis.normalize();
    z_axis.normalize();
    arcArrow.setRotationFromMatrix(new THREE.Matrix4().makeBasis(x_axis, y_axis, z_axis));
}