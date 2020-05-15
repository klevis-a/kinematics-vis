import {EulerScene} from "./EulerScene.js";

const eulerScene = new EulerScene(document.getElementById('container'), document.getElementById('canvas'));

function render(time) {
    eulerScene.renderScene();
    requestAnimationFrame(render);
}

requestAnimationFrame(render);
