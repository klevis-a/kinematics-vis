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

## File Structure Notes

- `js/` - Main application source code
- `data/healthy/` - Sample shoulder kinematics dataset
- `dist/` - Webpack build output
- `styles/` - CSS files
- `images/` - Static assets
- Two HTML entry points: `main.html` and `single.html`