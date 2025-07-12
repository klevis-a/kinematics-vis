'use strict';

import {AxialOrientationTrajectoryView} from "./AxialOrientationTrajectoryView.js";
import {FrameSelectorController} from "./FrameSelectorController.js";
import {WebGLRenderer} from "three";

// Simple standalone analysis for the custom Axial Orientation Trajectory view
class CustomAnalysis {
    constructor() {
        this.renderer = null;
        this.view = null;
        this.frameSelectorController = null;
    }

    async initialize() {
        try {
            // Create renderer
            this.renderer = new WebGLRenderer({ antialias: true });
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.shadowMap.enabled = true;

            // Create the custom view
            this.view = new AxialOrientationTrajectoryView(this.renderer);
            
            // Initialize view (loads custom data)
            await this.view.initialize();

            // Add to DOM
            const container = document.getElementById('view-container') || document.body;
            container.appendChild(this.view.parent_div);
            
            // Post DOM attach
            await this.view.postDomAttach(null);

            // Create frame selector if timeline container exists
            const timelineContainer = document.getElementById('timeline-container');
            if (timelineContainer) {
                const maxFrames = this.view.getMaxFrames();
                this.frameSelectorController = new FrameSelectorController(
                    timelineContainer,
                    maxFrames,
                    (frameNum) => this.view.previewFrame(frameNum),
                    (frameNum) => this.view.setFrame(frameNum)
                );
            }

            // Set up rendering
            this.startRenderLoop();
            
            // Set initial frame
            this.view.setFrame(0);

            console.log('Custom analysis initialized successfully');
            return true;

        } catch (error) {
            console.error('Failed to initialize custom analysis:', error);
            return false;
        }
    }

    startRenderLoop() {
        const render = () => {
            if (this.view && this.view.controls) {
                this.view.updateControls();
            }
            
            if (this.view) {
                this.updateRendererSize();
                this.view.renderSceneGraph();
            }
            
            requestAnimationFrame(render);
        };
        render();
    }

    updateRendererSize() {
        if (!this.renderer || !this.view) return;
        
        const container = this.view.parent_div.parentElement;
        if (container) {
            const rect = container.getBoundingClientRect();
            this.renderer.setSize(rect.width, rect.height);
            this.view.updateCamera();
        }
    }

    dispose() {
        if (this.view) {
            this.view.dispose();
        }
        if (this.frameSelectorController) {
            // Frame selector controller doesn't have a dispose method in the current implementation
            // but we can clear its container
            const timelineContainer = document.getElementById('timeline-container');
            if (timelineContainer) {
                timelineContainer.innerHTML = '';
            }
        }
    }
}

// Export for use in other files
export { CustomAnalysis };

// Auto-initialize if this is the main script
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', async () => {
        const customAnalysis = new CustomAnalysis();
        const success = await customAnalysis.initialize();
        
        if (!success) {
            console.error('Failed to initialize custom analysis');
        }
    });
}