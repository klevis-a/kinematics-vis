import {divGeometry} from "./SceneHelpers.js";
import {WebGLRenderer, Vector3, EventDispatcher} from "./vendor/three.js/build/three.module.js";
import {FrameSelectorController} from "./FrameSelectorController.js";
import {GUI} from "./vendor/three.js/examples/jsm/libs/dat.gui.module.js";
import {normalizeHumerusGeometry, normalizeScapulaGeometry} from "./StlGeometryTools.js";
import {RotationHelper, HUMERUS_BASE} from "./RotationHelper.js";
import {HumerusView} from "./HumerusView.js";
import {PlotManager} from "./PlotManager.js";
import {removeAllChildNodes} from "./JSHelpers.js";
import {PreviewView} from "./PreviewView.js";
import {ScapulaView} from "./ScapulaView.js";
import {defaultCamera} from "./BaseView.js";

export class ViewManager {

    constructor(humerusLandmarks, scapulaLandmarks, trajectory, humerusGeometry, scapulaGeometry, initialLayout=null, guiOptions=null, defaultPlot='axialRot') {
        // humerus and scapula geometry
        this.humerusLandmarks = humerusLandmarks;
        this.scapulaLandmarks = scapulaLandmarks;
        this.humerusGeometry = humerusGeometry;
        this.scapulaGeometry = scapulaGeometry;
        normalizeHumerusGeometry(this.humerusLandmarks, this.humerusGeometry);
        normalizeScapulaGeometry(this.scapulaLandmarks, this.scapulaGeometry);
        this.humerusLength = new Vector3().subVectors(this.humerusLandmarks.hhc,
            new Vector3().addVectors(this.humerusLandmarks.me, this.humerusLandmarks.le).multiplyScalar(0.5)).length();

        // visual elements
        this.getPlottingElements();
        this.getViewElements();
        this.getCaptureFrameCtrlElements();

        // gui options
        if (guiOptions==null) {
            this.guiOptions = {
                humerusBase: HUMERUS_BASE.TORSO,
                showAllBones: false,
                showAngles: false,
                showTriadsArcs: true,
                showBodyPlanes: false,
                showSphere: true
            };
        } else {
            this.guiOptions = guiOptions;
        }

        // torso, scapula, and humerus rotations
        this.trajectory = trajectory;
        this.rotationHelper = new RotationHelper(this.trajectory);

        // create scenes
        this.currentExplodedFrame = 0;
        this.createCamera();
        this.createRenderer();
        this.trackballStartEventListener = event => this.CurrentControl = event.target;
        this.trackballEndEventListener = event => {
            this.viewsMap.forEach(scene => scene.controls.target.copy(event.target.target));
        };
        this.active_view_id = null;
        this.anglesVisLayer = 1;
        this.presentedMethods = new Map([
            ['HUM_EULER_YXY', {creationFnc: method_name => this.createHumerusView(method_name), friendly_name: "Humerus ISB: yx'y''"}],
            ['HUM_EULER_XZY', {creationFnc: method_name => this.createHumerusView(method_name), friendly_name: "Humerus Phadke: xz'y''"}],
            ['HUM_SWING_TWIST', {creationFnc: method_name => this.createHumerusView(method_name), friendly_name: "Humerus Swing Twist"}],
            ['HUM_SIMULTANEOUS', {creationFnc: method_name => this.createHumerusView(method_name), friendly_name: "Humerus Simultaneous"}],
            ['PREVIEW', {creationFnc: method_name => this.createPreviewView(method_name), friendly_name: "Preview"}],
            ['SCAP_EULER_YXZ', {creationFnc: method_name => this.createScapulaView(method_name), friendly_name: "Scapula ISB: yx'z''"}]
        ]);

        if (initialLayout == null) {
            this.initialViewLayout = new Map([['view1', 'HUM_EULER_YXY'], ['view2', 'SCAP_EULER_YXZ'], ['view3', 'PREVIEW']]);
        } else {
            this.initialViewLayout = initialLayout;
        }
        this.createViews();
        this.createMethodDropdowns();
        this.frameSelectorController = new FrameSelectorController(this.frameTimeline, this.frameFrameNum, this.frameGoCtrl,
            this.trajectory.NumFrames, (frameNum) => this.previewFrame(frameNum), (frameNum) => this.setFrame(frameNum));

        // options gui
        this.createOptionsGUI();

        // event listeners
        this.addDblClickDivListener();
        this.addWindowResizeListener();

        // switch to displaying angles if the guiOptions dictate it
        if (this.guiOptions.showAngles) {
            this.camera.layers.set(this.anglesVisLayer);
        }
        else {
            this.camera.layers.set(0);
        }

        // render scenes
        this.render();

        // add plot
        this.defaultPlot = defaultPlot;
        this.addPlot();
    }

    dispose() {
        cancelAnimationFrame(this.animationHandle);
        // dispose of timeline events
        this.frameSelectorController.dispose();
        // dispose of each view
        this.viewsMap.forEach((view, view_id) => {
            const container_div = document.getElementById(view_id);
            this.clearView(view_id);
            container_div.removeEventListener('dblclick', this.dblClickListener);
            removeAllChildNodes(container_div.getElementsByClassName('method_selector')[0]);
        });
        // dispose of the plotter
        this.plotter.dispose();
        // remove resize listener for window
        window.removeEventListener('resize', this.resizeListener);
        // dispose of the render
        this.renderer.dispose();
        // dispose of datGUI
        this.optionsGUI.destroy();
        removeAllChildNodes(document.getElementById('datGUI'));
    }

    addPlot() {
        const on_Click = data => {
            if (data.points.length > 0) {
                const frameNum = Math.round(data.points[0].x) - 1;
                this.setFrame(frameNum);
                this.frameSelectorController.updateTimeLine(frameNum);
            }
        };

        const on_Hover = data => {
            if (data.points.length > 0) {
                const frameNum = Math.round(data.points[0].x) - 1;
                this.previewFrame(frameNum);
                this.frameSelectorController.updateTimeLine(frameNum);
            }
        };

        const on_Unhover = data => {
            this.viewsMap.forEach(scene_obj => {
                this.previewFrame(this.currentExplodedFrame);
                this.frameSelectorController.updateTimeLine(this.currentExplodedFrame);
            });
        };

        this.plotter = new PlotManager(this.rotationHelper, on_Click, on_Hover, on_Unhover, this.plotsContainerDiv, this.plotSelectorDiv, this.defaultPlot, this.guiOptions.humerusBase);
        this.addEventListener('humerusBase', event => this.plotter.changeHumerusBase(event.humerusBase));
    }

    previewFrame(frameNum) {
        if (frameNum < 0)  frameNum = 0;
        if (frameNum >= this.trajectory.NumFrames) frameNum = this.trajectory.NumFrames - 1;
        this.viewsMap.forEach((scene, view_id) => scene.previewFrame(frameNum));
    }

    setFrame(frameNum) {
        if (frameNum < 0)  frameNum = 0;
        if (frameNum >= this.trajectory.NumFrames) frameNum = this.trajectory.NumFrames - 1;
        this.viewsMap.forEach((scene, view_id) => scene.setFrame(frameNum));
        this.currentExplodedFrame = frameNum;
    }

    createHumerusView(method_name) {
        const view =  new HumerusView(this.camera, this.renderer, this.rotationHelper, method_name, this.humerusGeometry, this.humerusLength, this.anglesVisLayer, this.guiOptions.humerusBase);
        view.subscribeEvents(this);
        view.initializeVisualOptions(this);
        return {scene: view, div: view.parent_div};
    }

    createPreviewView(method_name) {
        const view = new PreviewView(this.renderer, this.rotationHelper, this.humerusGeometry, this.scapulaGeometry, this.humerusLength);
        return {scene: view, div: view.parent_div};
    }

    createScapulaView(method_name) {
        const view = new ScapulaView(this.renderer, this.rotationHelper, this.scapulaGeometry);
        view.subscribeEvents(this);
        return {scene: view, div: view.parent_div};
    }

    createView(method_name) {
        const sceneCreationFnc = this.presentedMethods.get(method_name).creationFnc;
        return sceneCreationFnc(method_name);
    }

    createViews() {
        this.viewsMap = new Map();
        this.initialViewLayout.forEach((method_name, view_id) => {
            const container_div = document.getElementById(view_id);
            const {scene: view, div} = this.createView(method_name);
            container_div.getElementsByClassName('view_container_div')[0].appendChild(div);
            view.postDomAttach(this);
            this.viewsMap.set(view_id, view);
        });
    }

    clearView(view_id) {
        const old_view = this.viewsMap.get(view_id);
        const container_div = document.getElementById(view_id);
        old_view.sceneManagerEventListeners.forEach((fnc, event_name) => {
            this.removeEventListener(event_name, fnc);
        });
        old_view.dispose();
        removeAllChildNodes(container_div.getElementsByClassName('view_container_div')[0]);
    }

    changeView(view_id, method_name) {
        cancelAnimationFrame(this.animationHandle);
        this.clearView(view_id);
        const container_div = document.getElementById(view_id);
        const {scene: view, div} = this.createView(method_name);
        view.setFrame(this.frameSelectorController.Timeline.value - 1);
        container_div.getElementsByClassName('view_container_div')[0].appendChild(div);
        view.postDomAttach(this);
        this.viewsMap.set(view_id, view);
        this.render();
    }

    createMethodDropdowns() {
        this.initialViewLayout.forEach((specified_method_name, view_id) => {
            const container_div = document.getElementById(view_id);
            const selectorDiv = container_div.getElementsByClassName('method_selector')[0];
            const selector = selectorDiv.appendChild(document.createElement('select'));
            selector.addEventListener('change', e => {
                this.changeView(view_id, e.target.value);
            });

            this.presentedMethods.forEach((method_info, method_name) => {
                const option = selector.appendChild(document.createElement('option'));
                option.setAttribute('value', method_name);
                option.innerHTML = method_info.friendly_name;
                if (specified_method_name === method_name) {
                    option.setAttribute('selected', 'selected');
                }
            });
        });
    }

    getPlottingElements() {
        this.plotsContainerDiv = document.getElementById('plots');
        this.plotSelectorDiv = document.getElementById('plotSelector');
    }

    getViewElements() {
        this.canvas = document.getElementById('canvas');
        this.viewsContainer = document.getElementById('views');
        this.views = [document.getElementById('view1'), document.getElementById('view2'), document.getElementById('view3'), document.getElementById('view4')];
    }

    getCaptureFrameCtrlElements() {
        this.frameTimeline = document.getElementById('captureFrameTimeline');
        this.frameFrameNum = document.getElementById('captureFrameNum');
        this.frameGoCtrl = document.getElementById('captureFrameGoCtrl');
    }

    createCamera() {
        const {aspectRatio} = divGeometry(this.viewsContainer);
        this.camera = defaultCamera(aspectRatio);
    }

    updateCamera() {
        const {aspectRatio} = divGeometry(this.viewsContainer);
        this.camera.aspect = aspectRatio;
        this.camera.updateProjectionMatrix();
    }

    createRenderer() {
        this.renderer = new WebGLRenderer({canvas: this.canvas});
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.viewsContainer.clientWidth, this.viewsContainer.clientHeight);
    }

    render(time) {
        this.viewsMap.forEach(view => view.animationHelper.CurrentAnimationFnc(time));
        if (this.active_view_id == null) {
            this.renderer.setScissorTest(true);
            this.viewsMap.forEach(view => {
                const {contentLeft: left, contentTop: top, contentWidth: width, contentHeight: height} = view.viewGeometry;
                const {contentHeight: parentHeight} = divGeometry(this.viewsContainer);
                this.renderer.setScissor(left, parentHeight-top-height, width, height);
                this.renderer.setViewport(left, parentHeight-top-height, width, height);
                if (this.CurrentControl != null) this.CurrentControl.update();
                view.renderSceneGraph();
            });
        }
        else {
            this.renderer.setScissorTest(false);
            const {contentLeft: left, contentTop: top, contentWidth: width, contentHeight: height} = this.viewsMap.get(this.active_view_id).viewGeometry;
            this.renderer.setViewport(left, top, width, height);
            if (this.CurrentControl != null) this.CurrentControl.update();
            this.viewsMap.get(this.active_view_id).renderSceneGraph();
        }
        this.viewsMap.forEach(scene => scene.updateControls());
        this.animationHandle = requestAnimationFrame((t) => this.render(t));
    }

    addDblClickDivListener() {
        const sceneManager = this;
        this.dblClickListener = function () {
            if (sceneManager.active_view_id == null) {
                sceneManager.active_view_id = this.id;
                sceneManager.viewsMap.forEach((view, view_id) => {
                    const current_view = document.getElementById(view_id);
                    if (view_id === this.id) {
                        current_view.className = 'full';
                        current_view.display = 'block';
                    }
                    else {
                        current_view.className = 'zero';
                        current_view.style.display = 'none';
                    }
                });
            } else {
                sceneManager.active_view_id = null;
                sceneManager.viewsMap.forEach((scene, view_id) => {
                    const current_view = document.getElementById(view_id);
                    current_view.className='quarter';
                    current_view.style.display = 'block';
                });
            }
            sceneManager.updateCamera();
            sceneManager.viewsMap.forEach((view, view_id) => view.updateCamera());
        };
        this.viewsMap.forEach((scene, view_id) => document.getElementById(view_id).addEventListener('dblclick', this.dblClickListener));
    }

    addWindowResizeListener() {
        this.resizeListener = () => {
            this.renderer.setSize(this.viewsContainer.clientWidth, this.viewsContainer.clientHeight);
            // there is only one camera in order to enable linking between the scenes
            this.updateCamera();
        };
        window.addEventListener('resize', this.resizeListener);
    }

    createOptionsGUI() {
        this.optionsGUI = new GUI({resizable : false, name: 'visGUI', autoPlace: false});

        this.optionsGUI.add(this.guiOptions, 'humerusBase', {Torso: HUMERUS_BASE.TORSO, Scapula: HUMERUS_BASE.SCAPULA})
            .name('Humerus Base').onChange(value => {this.dispatchEvent({type: 'humerusBase', humerusBase: value, frameNum: this.frameSelectorController.Timeline.value - 1});
        });

        this.optionsGUI.add(this.guiOptions, 'showTriadsArcs').name('Show Triads/Arcs').onChange(value => {
            this.dispatchEvent({type: 'showTriadsArcs', visibility: value});
        });

        this.optionsGUI.add(this.guiOptions, 'showAllBones').name('Prior Steps Bones').onChange(value => {
            this.dispatchEvent({type:'showAllBones', visibility: value});
        });

        this.optionsGUI.add(this.guiOptions, 'showAngles').name('Visualize Angles').onChange(value => {
            if (value) {
                this.camera.layers.set(this.anglesVisLayer);
            }
            else {
                this.camera.layers.set(0);
            }
        });

        this.optionsGUI.add(this.guiOptions, 'showBodyPlanes').name('Show Body Planes').onChange(value => {
            this.dispatchEvent({type: 'showBodyPlanes', visibility: value});
        });

        this.optionsGUI.add(this.guiOptions, 'showSphere').name('Show Sphere').onChange(value => {
            this.dispatchEvent({type: 'showSphere', visibility: value});
        });

        this.optionsGUI.close();
        document.getElementById('datGUI').appendChild(this.optionsGUI.domElement);
    }
}

Object.assign(ViewManager.prototype, EventDispatcher.prototype);