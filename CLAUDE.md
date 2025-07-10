# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development
- `yarn build` - Build the application using webpack
- `yarn start` - Start webpack dev server with legacy OpenSSL support (opens automatically)
- `yarn webpack serve` - Alternative dev server command (manual browser open)
- `yarn fetch_data` - Download sample shoulder kinematics dataset

### Access Points
- Main application: `http://localhost:9000/main.html`
- Single file analysis: `http://localhost:9000/single.html`

## Architecture Overview

This is a 3D biomechanical visualization application for analyzing shoulder joint kinematics using Three.js and Plotly.js.

### Key Entry Points
- `js/defaultAnalysis.js` - Main application with database selection UI
- `js/singleAnalysis.js` - Single-file analysis mode with URL parameters

### Core Architecture Components

**ShoulderVis** (`js/ShoulderVis.js`)
- Main application controller and data management
- Handles database/file selection UI
- Loads CSV trajectory data and STL bone models

**ViewManager** (`js/ViewManager.js`)
- Central coordinator for all visualization components
- Manages 4-pane layout with synchronized views
- Handles shared camera, renderer, and animation loop

**BaseView** (`js/BaseView.js`)
- Abstract base class for all view types
- Template method pattern with lifecycle: `previewFrame()`, `setFrame()`, `renderSceneGraph()`, `dispose()`

**View Types**
- `HumerusView` - Humerus bone analysis with multiple rotation decompositions
- `ScapulaView` - Scapula bone analysis
- `PreviewView` - Combined overview of both bones

**Scene Management**
- `EulerScene` - Core Three.js scene with Euler decomposition visualization
- Scene extensions (EulerScene_*.js) - Modular visualization capabilities

**Data Processing**
- `RotationHelper` - Core kinematic calculations and rotation decompositions
- `Csv_Processor` - Data parsing with classes for landmarks and trajectories

### Data Flow
```
CSV/STL Files → Csv_Processor → RotationHelper → ViewManager → Views → Three.js Rendering
                                                      ↓
                                                 PlotManager → Plotly.js
```

### Technology Stack
- **Three.js**: 3D rendering, scene management, cameras, controls
- **Plotly.js**: 2D plotting and data visualization
- **PapaParse**: CSV data parsing
- **dat.GUI**: Real-time configuration controls
- **Webpack**: Module bundling and build system

## Dataset Configuration

To use custom datasets:
1. Edit `DATA_DIR` variable in `webpack.config.js`
2. Ensure data structure matches requirements in `INPUT_FILES.md`
3. Restart dev server to apply changes

## Refactored Architecture (New)

A new component-based architecture has been implemented to improve maintainability and extensibility:

### New Architecture Components

**BaseScene** (`js/scene/BaseScene.js`)
- Core scene management with component orchestration
- Predictable lifecycle: `initialize()`, `reset()`, `setFrame()`, `dispose()`
- Component management: `addComponent()`, `removeComponent()`, `getComponent()`

**SceneComponent** (`js/scene/SceneComponent.js`)
- Interface for all scene features
- Lifecycle methods: `onInitialize()`, `onReset()`, `onSetFrame()`, `onDispose()`
- Clean separation of concerns

**EulerDecompositionScene** (`js/scene/EulerDecompositionScene.js`)
- Specialized scene for Euler angle decomposition
- Replaces the monolithic `EulerScene` approach
- Uses component system for features

**Scene Components** (`js/scene/components/`)
- `BoneComponent` - Bone visualization and animation
- `SphereComponent` - Sphere visualization
- `ConeComponent` - Cone visualization for swept motion
- Each component handles its own lifecycle and resources

**Refactored Views** (`js/view/`)
- `BaseView` - Simplified view management
- `HumerusView` - Uses new component-based scene system
- Clear separation between view logic and scene management

### Key Improvements

1. **Predictable Execution Order**: Components execute in the order they're added
2. **Clear Dependencies**: No hidden event-driven dependencies
3. **Easy Extension**: Add new features by creating new components
4. **Better Testing**: Components can be tested independently
5. **Improved Maintainability**: Clear separation of concerns

### Migration Notes

- New architecture coexists with existing code
- Gradual migration possible
- See `js/REFACTORING_GUIDE.md` for detailed migration instructions
- Examples available in `js/example/RefactoredExample.js`
- Test suite in `js/test/RefactoredArchitectureTest.js`

### Using the New Architecture

```javascript
// Create scene
const scene = new EulerDecompositionScene(element, renderer, camera, numFrames);

// Add components
scene.addComponent('bone', new BoneComponent(geometry));
scene.addComponent('sphere', new SphereComponent());
scene.addComponent('cone', new ConeComponent(length));

// Initialize
await scene.initialize();

// Update with data
await scene.reset({rotations: data});

// Set frame
await scene.setFrame(frameNum);
```

## File Structure Notes

- `js/` - Main application source code
  - `scene/` - New component-based scene architecture
  - `view/` - Refactored view classes
  - `example/` - Usage examples for new architecture
  - `test/` - Test suite for refactored components
- `data/healthy/` - Sample shoulder kinematics dataset
- `dist/` - Webpack build output
- `styles/` - CSS files
- `images/` - Static assets
- Two HTML entry points: `main.html` and `single.html`