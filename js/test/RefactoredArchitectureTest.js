'use strict';

import {EulerDecompositionScene} from "../scene/EulerDecompositionScene.js";
import {BoneComponent} from "../scene/components/BoneComponent.js";
import {SphereComponent} from "../scene/components/SphereComponent.js";
import {ConeComponent} from "../scene/components/ConeComponent.js";
import {HumerusView} from "../view/HumerusView.js";
import {WebGLRenderer, PerspectiveCamera, BoxGeometry} from "three";

/**
 * Test suite for the refactored architecture
 * Run this in a browser environment with the codebase loaded
 */

// Mock DOM element for testing
function createMockElement() {
    const element = document.createElement('div');
    element.style.width = '400px';
    element.style.height = '300px';
    document.body.appendChild(element);
    return element;
}

// Mock renderer for testing
function createMockRenderer() {
    const renderer = new WebGLRenderer();
    renderer.setSize(400, 300);
    return renderer;
}

// Mock camera for testing
function createMockCamera() {
    const camera = new PerspectiveCamera(75, 400/300, 1, 2000);
    camera.position.set(-425, 200, -225);
    return camera;
}

// Mock geometry for testing
function createMockGeometry() {
    return new BoxGeometry(10, 100, 10);
}

// Test 1: Basic Scene Creation and Component Management
export async function testBasicSceneCreation() {
    console.log('Testing basic scene creation...');
    
    const element = createMockElement();
    const renderer = createMockRenderer();
    const camera = createMockCamera();
    
    const scene = new EulerDecompositionScene(element, renderer, camera, 100);
    
    // Test component addition
    const boneComponent = new BoneComponent(createMockGeometry());
    scene.addComponent('bone', boneComponent);
    
    // Test component retrieval
    const retrievedComponent = scene.getComponent('bone');
    console.assert(retrievedComponent === boneComponent, 'Component retrieval failed');
    
    // Test component list
    console.assert(scene.componentOrder.includes('bone'), 'Component not in order list');
    
    // Test initialization
    await scene.initialize();
    console.assert(scene.isInitialized, 'Scene not initialized');
    console.assert(boneComponent.isInitialized, 'Component not initialized');
    
    // Test component removal
    scene.removeComponent('bone');
    console.assert(!scene.getComponent('bone'), 'Component not removed');
    
    // Cleanup
    scene.dispose();
    element.remove();
    
    console.log('✓ Basic scene creation test passed');
}

// Test 2: Component Lifecycle
export async function testComponentLifecycle() {
    console.log('Testing component lifecycle...');
    
    const element = createMockElement();
    const renderer = createMockRenderer();
    const camera = createMockCamera();
    
    const scene = new EulerDecompositionScene(element, renderer, camera, 100);
    
    // Track lifecycle calls
    let initializeCalled = false;
    let resetCalled = false;
    let setFrameCalled = false;
    let disposeCalled = false;
    
    class TestComponent extends SceneComponent {
        constructor() {
            super('test');
        }
        
        onInitialize(scene) {
            initializeCalled = true;
        }
        
        onReset(scene, data) {
            resetCalled = true;
        }
        
        onSetFrame(scene, frameNum) {
            setFrameCalled = true;
        }
        
        onDispose(scene) {
            disposeCalled = true;
        }
    }
    
    const testComponent = new TestComponent();
    scene.addComponent('test', testComponent);
    
    // Test initialization
    await scene.initialize();
    console.assert(initializeCalled, 'Initialize not called');
    
    // Test reset
    await scene.reset({test: 'data'});
    console.assert(resetCalled, 'Reset not called');
    
    // Test setFrame
    await scene.setFrame(50);
    console.assert(setFrameCalled, 'SetFrame not called');
    
    // Test disposal
    scene.dispose();
    console.assert(disposeCalled, 'Dispose not called');
    
    // Cleanup
    element.remove();
    
    console.log('✓ Component lifecycle test passed');
}

// Test 3: Component Order and Dependencies
export async function testComponentOrder() {
    console.log('Testing component execution order...');
    
    const element = createMockElement();
    const renderer = createMockRenderer();
    const camera = createMockCamera();
    
    const scene = new EulerDecompositionScene(element, renderer, camera, 100);
    
    const executionOrder = [];
    
    class OrderedComponent extends SceneComponent {
        constructor(name) {
            super(name);
            this.componentName = name;
        }
        
        onInitialize(scene) {
            executionOrder.push(`${this.componentName}_init`);
        }
        
        onReset(scene, data) {
            executionOrder.push(`${this.componentName}_reset`);
        }
        
        onSetFrame(scene, frameNum) {
            executionOrder.push(`${this.componentName}_frame`);
        }
    }
    
    // Add components in specific order
    scene.addComponent('first', new OrderedComponent('first'));
    scene.addComponent('second', new OrderedComponent('second'));
    scene.addComponent('third', new OrderedComponent('third'));
    
    // Test initialization order
    await scene.initialize();
    console.assert(executionOrder[0] === 'first_init', 'Wrong initialization order');
    console.assert(executionOrder[1] === 'second_init', 'Wrong initialization order');
    console.assert(executionOrder[2] === 'third_init', 'Wrong initialization order');
    
    // Test reset order
    await scene.reset({});
    const resetStart = executionOrder.indexOf('first_reset');
    console.assert(resetStart > -1, 'Reset not called');
    console.assert(executionOrder[resetStart + 1] === 'second_reset', 'Wrong reset order');
    console.assert(executionOrder[resetStart + 2] === 'third_reset', 'Wrong reset order');
    
    // Test setFrame order
    await scene.setFrame(10);
    const frameStart = executionOrder.indexOf('first_frame');
    console.assert(frameStart > -1, 'SetFrame not called');
    console.assert(executionOrder[frameStart + 1] === 'second_frame', 'Wrong frame order');
    console.assert(executionOrder[frameStart + 2] === 'third_frame', 'Wrong frame order');
    
    // Cleanup
    scene.dispose();
    element.remove();
    
    console.log('✓ Component order test passed');
}

// Test 4: View Integration
export async function testViewIntegration() {
    console.log('Testing view integration...');
    
    const renderer = createMockRenderer();
    const camera = createMockCamera();
    
    // Mock rotation helper
    const mockRotationHelper = {
        humerusRotation_torso: (method, frame) => [
            {axis: {x: 1, y: 0, z: 0}, angle: Math.PI/4}
        ],
        humerusQuat_torso: (frame) => ({x: 0, y: 0, z: 0, w: 1})
    };
    
    const view = new HumerusView(
        camera,
        renderer,
        mockRotationHelper,
        'HUM_EULER_YXY',
        createMockGeometry(),
        300,
        null, // anglesVisLayer
        null, // areaVisLayer
        'TORSO' // humerusBase
    );
    
    // Test initialization
    await view.initialize();
    console.assert(view.isInitialized, 'View not initialized');
    console.assert(view.scene, 'Scene not created');
    
    // Test frame setting
    await view.setFrame(0);
    
    // Test component access
    const boneComponent = view.scene.getComponent('bone');
    console.assert(boneComponent, 'Bone component not found');
    
    const sphereComponent = view.scene.getComponent('sphere');
    console.assert(sphereComponent, 'Sphere component not found');
    
    // Test visual option methods
    view.showTriadsArcs(true);
    view.toggleSphereVisibility(true);
    view.toggleBodyPlaneVisibility(true);
    
    // Cleanup
    view.dispose();
    
    console.log('✓ View integration test passed');
}

// Test 5: Component Communication
export async function testComponentCommunication() {
    console.log('Testing component communication...');
    
    const element = createMockElement();
    const renderer = createMockRenderer();
    const camera = createMockCamera();
    
    const scene = new EulerDecompositionScene(element, renderer, camera, 100);
    
    let communicationWorked = false;
    
    class ProducerComponent extends SceneComponent {
        constructor() {
            super('producer');
            this.data = 'test-data';
        }
        
        getData() {
            return this.data;
        }
    }
    
    class ConsumerComponent extends SceneComponent {
        constructor() {
            super('consumer');
        }
        
        onInitialize(scene) {
            const producer = scene.getComponent('producer');
            if (producer && producer.getData() === 'test-data') {
                communicationWorked = true;
            }
        }
    }
    
    scene.addComponent('producer', new ProducerComponent());
    scene.addComponent('consumer', new ConsumerComponent());
    
    await scene.initialize();
    
    console.assert(communicationWorked, 'Component communication failed');
    
    // Cleanup
    scene.dispose();
    element.remove();
    
    console.log('✓ Component communication test passed');
}

// Test 6: Error Handling
export async function testErrorHandling() {
    console.log('Testing error handling...');
    
    const element = createMockElement();
    const renderer = createMockRenderer();
    const camera = createMockCamera();
    
    const scene = new EulerDecompositionScene(element, renderer, camera, 100);
    
    // Test duplicate component names
    const component1 = new BoneComponent(createMockGeometry());
    const component2 = new BoneComponent(createMockGeometry());
    
    scene.addComponent('bone', component1);
    
    try {
        scene.addComponent('bone', component2);
        console.assert(false, 'Should have thrown error for duplicate component name');
    } catch (e) {
        console.assert(e.message.includes('already exists'), 'Wrong error message');
    }
    
    // Test component not found
    const nonExistentComponent = scene.getComponent('nonexistent');
    console.assert(nonExistentComponent === undefined, 'Should return undefined for non-existent component');
    
    // Cleanup
    scene.dispose();
    element.remove();
    
    console.log('✓ Error handling test passed');
}

// Run all tests
export async function runAllTests() {
    console.log('Running refactored architecture tests...');
    
    try {
        await testBasicSceneCreation();
        await testComponentLifecycle();
        await testComponentOrder();
        await testViewIntegration();
        await testComponentCommunication();
        await testErrorHandling();
        
        console.log('🎉 All tests passed!');
    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

// Auto-run tests if this file is loaded directly
if (typeof window !== 'undefined' && window.document) {
    window.addEventListener('DOMContentLoaded', () => {
        runAllTests().catch(console.error);
    });
}