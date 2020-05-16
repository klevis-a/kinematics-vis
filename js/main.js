import {EulerScene} from "./EulerScene.js";

const eulerScene = new EulerScene(document.getElementById('container'), document.getElementById('canvas'));
requestAnimationFrame(render);

function render(time) {
    eulerScene.renderScene();
    requestAnimationFrame(render);
}
