# Kinematics Visualization Architecture Documentation

## Overview

This document provides comprehensive documentation of the kinematics visualization codebase architecture, including component relationships, data flow patterns, and event communication systems.

## Architecture Overview

The kinematics visualization system is built using a **layered, event-driven architecture** with clear separation between data processing, scene management, and visualization components. The system supports multiple rotation decomposition methods and provides interactive 3D visualization of shoulder joint kinematics.

## Core Architecture Layers

### 1. Data Processing Layer

#### **CSV Processing (`Csv_Processor.js`)**
- **HumerusLandmarks**: Parses anatomical landmark data (HHC, LE, ME)
- **ScapulaLandmarks**: Parses scapula landmark data (GC, IA, TS, PLA, AC)
- **Trajectory**: Processes time-series motion data with position/orientation

#### **Rotation Pipeline (`RotationHelper.js`)**
- Central processing hub for rotation calculations
- Manages coordinate system transformations:
  - **Thoraco-humeral (TH)**: Humerus relative to torso
  - **Gleno-humeral (GH)**: Humerus relative to scapula
  - **Scapulo-thoracic (ST)**: Scapula relative to torso

#### **Decomposition Methods (`RotDecompositions.js`)**
- **Euler Decompositions**: YXY (ISB), XZY (Phadke), YXZ (Scapula)
- **Swing-Twist**: Separates axial from elevation rotations
- **SVD-Based**: Data-driven decomposition using singular value decomposition
- **Shortest Path**: Single-axis rotation representation

### 2. Geometry and Visualization Layer

#### **Core Geometry (`EulerGeometry.js`)**
- **FatArrow**: 3D arrow primitives with markings
- **Triad**: Three orthogonal arrows representing coordinate systems
- **RotAxisWithArrow**: Rotation axis visualization with curved arrows

#### **Animation Steps (`EulerStep.js`)**
- Represents individual rotation steps in a sequence
- Manages frame-by-frame animation interpolation
- Handles arc visualization and arrow indicators

#### **Specialized Geometries (`EulerAnglesGeometry.js`)**
- **Euler_yxy_angle_geometry**: Y-X-Y Euler angle visualization
- **Euler_xzy_angle_geometry**: X-Z-Y Euler angle visualization  
- **AnglesVisualizationSVD**: SVD-based angle visualization

### 3. Scene Management Layer

#### **Core Scene (`EulerScene.js`)**
- Central 3D scene management with Three.js
- Manages Euler step creation and animation
- Event dispatcher for scene state changes
- Lighting and camera setup

#### **Scene Extensions (EulerScene_*.js)**
Uses **monkey-patching** pattern for modular feature addition:
- **EulerScene_Bone.js**: Bone mesh rendering
- **EulerScene_Sphere.js**: Sphere visualization
- **EulerScene_Axial.js**: Axial rotation visualization
- **EulerScene_AngleVis.js**: Angle visualization overlays
- **EulerScene_ConeVis.js**: Cone visualization
- **EulerScene_SphereAreaVis.js**: Spherical area visualization

#### **Animation Management (`EulerSceneAnimationHelper.js`)**
- Timeline UI controls
- Animation state management (play/pause/seek)
- Frame interpolation and timing

### 4. View Management Layer

#### **Base View (`BaseView.js`)**
- Abstract base class for all view types
- Lifecycle management: `postDomAttach()`, `initializeVisualOptions()`, `renderSceneGraph()`
- DOM element creation and camera utilities

#### **Specialized Views**
- **HumerusView**: Humerus bone analysis with multiple rotation methods
- **ScapulaView**: Scapula bone analysis
- **PreviewView**: Combined overview of both bones

#### **View Coordination (`ViewManager.js`)**
- Central coordinator for all views
- Event broadcasting and synchronization
- Renderer and camera management
- GUI options coordination

### 5. Application Control Layer

#### **Main Controller (`ShoulderVis.js`)**
- Top-level application controller
- Data loading and preprocessing
- ViewManager lifecycle management
- UI setup (database vs manual file selection)

## Component Relationship Diagrams

### Data Flow Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CSV Files     │───▶│  Csv_Processor  │───▶│ Trajectory Data │
│ (Motion Data)   │    │   (Parsing)     │    │  (Structured)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   STL Files     │───▶│StlGeometryTools │───▶│  Bone Geometry  │
│ (Bone Models)   │    │ (Normalization) │    │ (Normalized)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│RotationHelper   │───▶│RotDecompositions│───▶│Scene Visualization│
│(Calculations)   │    │   (Methods)     │    │  (3D Rendering)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Scene Architecture Hierarchy

```
┌─────────────────┐
│   ShoulderVis   │
│ (Application)   │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   ViewManager   │
│ (Coordination)  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   HumerusView   │    │   ScapulaView   │    │   PreviewView   │
│     (Bone 1)    │    │     (Bone 2)    │    │   (Combined)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   EulerScene    │    │   EulerScene    │    │HumerusScapulaScene│
│    (3D Scene)   │    │    (3D Scene)   │    │    (3D Scene)   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│Scene Extensions │    │Scene Extensions │    │Scene Extensions │
│(Bone, Sphere,   │    │(Bone, Sphere,   │    │(Preview-specific│
│ Axial, etc.)    │    │ Axial, etc.)    │    │   features)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Event Communication Flow

```
┌─────────────────┐
│   User Input    │
│ (GUI/Timeline)  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   ViewManager   │◄─── Events: 'showTriadsArcs', 'showAllBones',
│ (Event Hub)     │     'showBodyPlanes', 'showSphere', 'humerusBase'
└─────────┬───────┘
          │
          ▼ (Broadcast to all views)
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   HumerusView   │    │   ScapulaView   │    │   PreviewView   │
│   (Listener)    │    │   (Listener)    │    │   (Listener)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   EulerScene    │    │   EulerScene    │    │HumerusScapulaScene│
│    (Updates)    │    │    (Updates)    │    │    (Updates)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│Scene Extensions │    │Scene Extensions │    │Scene Extensions │
│  (Respond to    │    │  (Respond to    │    │  (Respond to    │
│ scene events)   │    │ scene events)   │    │ scene events)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Event System Architecture

### Event Types and Flow

#### **Scene-Level Events (`EulerScene.js`)**
- `'init'` → Scene initialized with rotations
- `'createSteps'` → Rotation steps created
- `'stepChange'` → Animation step changed
- `'frameChange'` → Frame updated within step
- `'reset'` → Scene reset with new rotations
- `'preRender'` → Before rendering
- `'dispose'` → Scene disposal

#### **View-Level Events (`ViewManager.js`)**
- `'showTriadsArcs'` → Toggle triads/arcs visibility
- `'showAllBones'` → Toggle all bones visibility
- `'showBodyPlanes'` → Toggle body plane visibility
- `'showSphere'` → Toggle sphere visibility
- `'humerusBase'` → Change humerus coordinate base

#### **Event Subscription Pattern**
```javascript
// Standard pattern used throughout codebase
subscribeEvents(viewManager) {
    const listener = event => this.handleEvent(event);
    viewManager.addEventListener('eventName', listener);
    this.eventListeners.set('eventName', listener);
}

dispose() {
    this.eventListeners.forEach((listener, eventName) => {
        viewManager.removeEventListener(eventName, listener);
    });
}
```

## Key Design Patterns

### 1. **Event-Driven Architecture**
- All major interactions flow through events
- Loose coupling between components
- Easy to add new features without modifying existing code

### 2. **Observer Pattern**
- Components subscribe to events they care about
- Automatic notification of state changes
- Centralized event coordination

### 3. **Extension Pattern (Monkey-Patching)**
- Scene features added via separate modules
- Modular and composable functionality
- Event-driven coordination between extensions

### 4. **Factory Pattern**
- ViewManager creates views based on configuration
- Rotation method factories for different decompositions
- Flexible object creation

### 5. **Strategy Pattern**
- Multiple rotation methods with pluggable strategies
- Different visualization approaches
- Runtime method selection

### 6. **Template Method Pattern**
- BaseView defines structure, subclasses implement specifics
- Consistent lifecycle management
- Extensible view hierarchy

## Data Processing Pipeline

### Mathematical Transformations

```
Raw CSV Data
    ↓
Trajectory Objects (position + orientation quaternions)
    ↓
4x4 Transformation Matrices
    ↓
Relative Rotation Matrices (TH, GH, ST)
    ↓
Rotation Decomposition Methods
    ↓
Angle Sequences (for visualization)
    ↓
EulerStep Objects (for animation)
    ↓
3D Scene Rendering
```

### Coordinate Systems

#### **Anatomical Coordinate Systems**
- **Humerus**: Y-axis (shaft), X-axis (flex/ext), Z-axis (abd/add)
- **Scapula**: Anatomically-defined based on landmarks
- **Torso**: Global reference frame

#### **Transformation Pipeline**
```javascript
// Key transformation calculations
const thPose = new Matrix4().getInverse(torsoPose).multiply(humerusPose);
const ghPose = new Matrix4().getInverse(scapulaPose).multiply(humerusPose);
const stPose = new Matrix4().getInverse(torsoPose).multiply(scapulaPose);
```

## Extension Points

### Adding New Visualization Features

1. **Create Extension Module** (`EulerScene_NewFeature.js`)
2. **Define Event Handlers** for scene lifecycle events
3. **Extend Scene Prototype** with new methods
4. **Add to View Configuration** in appropriate view classes

### Adding New Rotation Methods

1. **Create Decomposition Class** in `RotDecompositions.js`
2. **Add Method Configuration** in view method maps
3. **Implement Visualization Support** in angle geometry classes
4. **Add GUI Options** for method selection

## Performance Considerations

### Optimization Strategies

1. **Efficient Event Handling**: Event listeners stored in Maps for fast cleanup
2. **Geometry Reuse**: Shared geometries and materials between components
3. **Selective Updates**: Only update components that need changes
4. **Disposal Management**: Explicit cleanup of Three.js resources

### Memory Management

- **Explicit Disposal**: All components implement `dispose()` methods
- **Event Cleanup**: Listeners removed when components are disposed
- **Geometry Sharing**: Reuse of geometry objects where possible
- **Material Pooling**: Shared materials for similar objects

## Testing and Debugging

### Development Tools

1. **Console Logging**: Extensive logging for debugging event flow
2. **Event Tracing**: Track event propagation through system
3. **Performance Monitoring**: Monitor rendering performance
4. **State Inspection**: GUI controls for runtime state examination

### Common Debugging Patterns

1. **Event Flow Tracing**: Follow events from user input to scene updates
2. **Component State Inspection**: Check component initialization and disposal
3. **Data Pipeline Validation**: Verify data transformations at each step
4. **Rendering Pipeline Analysis**: Debug visualization artifacts

This architecture provides a robust foundation for biomechanical visualization with clear separation of concerns, extensible design patterns, and efficient event-driven communication.