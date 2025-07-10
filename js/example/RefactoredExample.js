'use strict';

import {EulerDecompositionScene} from "../scene/EulerDecompositionScene.js";
import {BoneComponent} from "../scene/components/BoneComponent.js";
import {SphereComponent} from "../scene/components/SphereComponent.js";
import {ConeComponent} from "../scene/components/ConeComponent.js";
import {HumerusView} from "../view/HumerusView.js";

/**
 * Example demonstrating the new refactored architecture
 */

// Example 1: Creating a custom scene with components
export async function createCustomScene(element, renderer, camera, humerusGeometry) {
    // Create the base scene
    const scene = new EulerDecompositionScene(element, renderer, camera, 100);
    
    // Add components in the order they should be processed
    scene.addComponent('bone', new BoneComponent(humerusGeometry));
    scene.addComponent('sphere', new SphereComponent(100, 32, 16));
    scene.addComponent('cone', new ConeComponent(300));
    
    // Initialize the scene (components are initialized in order)
    await scene.initialize();
    
    // Set up some sample data
    const sampleRotations = [
        { axis: { x: 1, y: 0, z: 0 }, angle: Math.PI / 4 },
        { axis: { x: 0, y: 1, z: 0 }, angle: Math.PI / 6 },
        { axis: { x: 0, y: 0, z: 1 }, angle: Math.PI / 8 }
    ];
    
    // Reset with new data
    await scene.reset({ rotations: sampleRotations });
    
    // Update to a specific frame
    await scene.setFrame(50);
    
    return scene;
}

// Example 2: Creating a custom component
export class CustomVisualizationComponent extends SceneComponent {
    constructor(customOptions = {}) {
        super('customVisualization');
        this.options = customOptions;
        this.customObjects = [];
    }

    onInitialize(scene) {
        console.log('Initializing custom visualization component');
        // Create custom 3D objects
        this.createCustomObjects(scene);
    }

    onReset(scene, data) {
        console.log('Resetting custom visualization with new data');
        // Update custom objects based on new data
        this.updateCustomObjects(scene, data);
    }

    onSetFrame(scene, frameNum) {
        console.log(`Updating custom visualization for frame ${frameNum}`);
        // Update custom objects for current frame
        this.updateFrameSpecificObjects(scene, frameNum);
    }

    onDispose(scene) {
        console.log('Disposing custom visualization component');
        // Clean up custom objects
        this.disposeCustomObjects(scene);
    }

    createCustomObjects(scene) {
        // Implementation for creating custom 3D objects
        // Add objects to scene.scene
    }

    updateCustomObjects(scene, data) {
        // Implementation for updating objects with new data
    }

    updateFrameSpecificObjects(scene, frameNum) {
        // Implementation for frame-specific updates
    }

    disposeCustomObjects(scene) {
        // Implementation for cleanup
        this.customObjects.forEach(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
            scene.scene.remove(obj);
        });
        this.customObjects = [];
    }
}

// Example 3: Creating a custom view
export class CustomHumerusView extends BaseView {
    constructor(renderer, rotationHelper, humerusGeometry, humerusLength) {
        super(renderer);
        this.rotationHelper = rotationHelper;
        this.humerusGeometry = humerusGeometry;
        this.humerusLength = humerusLength;
    }

    createScene() {
        const scene = new EulerDecompositionScene(
            this.scene_div,
            this.renderer,
            this.camera,
            100
        );

        // Add standard components
        scene.addComponent('bone', new BoneComponent(this.humerusGeometry));
        scene.addComponent('sphere', new SphereComponent());
        
        // Add custom component
        scene.addComponent('custom', new CustomVisualizationComponent({
            humerusLength: this.humerusLength
        }));

        return scene;
    }

    async setFrame(frameNum) {
        // Custom frame handling logic
        console.log(`Setting frame to ${frameNum}`);
        
        // Call parent implementation
        await super.setFrame(frameNum);
        
        // Additional custom logic
        this.updateCustomVisualization(frameNum);
    }

    updateCustomVisualization(frameNum) {
        // Custom visualization updates
        const customComponent = this.scene.getComponent('custom');
        if (customComponent) {
            // Custom logic for updating visualization
        }
    }
}

// Example 4: Usage in existing code
export async function integrateNewArchitecture(viewManager, rotationHelper, humerusGeometry) {
    // Create a new view using the refactored architecture
    const customView = new CustomHumerusView(
        viewManager.renderer,
        rotationHelper,
        humerusGeometry,
        300 // humerusLength
    );

    // Initialize the view
    await customView.initialize();

    // Attach to DOM
    viewManager.attachView(customView);

    // Set up event subscriptions
    customView.subscribeEvents(viewManager);

    // Update with initial frame
    await customView.setFrame(0);

    return customView;
}

// Example 5: Component communication
export class CommunicatingComponent extends SceneComponent {
    constructor() {
        super('communicating');
    }

    onInitialize(scene) {
        // Access other components
        const boneComponent = scene.getComponent('bone');
        const sphereComponent = scene.getComponent('sphere');
        
        if (boneComponent && sphereComponent) {
            // Set up communication between components
            this.setupComponentCommunication(boneComponent, sphereComponent);
        }
    }

    setupComponentCommunication(boneComponent, sphereComponent) {
        // Example of component interaction
        // Components can share data or coordinate their behavior
        this.boneComponent = boneComponent;
        this.sphereComponent = sphereComponent;
    }

    onSetFrame(scene, frameNum) {
        // Use information from other components
        if (this.boneComponent && this.sphereComponent) {
            // Custom logic based on other components' state
            this.updateBasedOnOtherComponents(scene, frameNum);
        }
    }

    updateBasedOnOtherComponents(scene, frameNum) {
        // Implementation that uses other components
    }
}

// Example 6: Conditional component loading
export function createAdaptiveScene(element, renderer, camera, options) {
    const scene = new EulerDecompositionScene(element, renderer, camera, 100);
    
    // Always add bone component
    scene.addComponent('bone', new BoneComponent(options.humerusGeometry));
    
    // Conditionally add other components
    if (options.showSphere) {
        scene.addComponent('sphere', new SphereComponent());
    }
    
    if (options.showCone && options.method === 'HUM_SHORTEST_PATH_START_END') {
        scene.addComponent('cone', new ConeComponent(options.humerusLength));
    }
    
    if (options.customVisualization) {
        scene.addComponent('custom', new CustomVisualizationComponent(options.customOptions));
    }
    
    return scene;
}