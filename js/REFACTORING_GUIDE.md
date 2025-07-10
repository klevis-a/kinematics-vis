# View and Scene Refactoring Guide

## Overview

This document describes the refactored View and Scene architecture that replaces the previous event-driven, monkey-patching approach with a cleaner, more maintainable component-based system.

## Key Changes

### 1. **Component-Based Scene System**
- **Before**: Features added via monkey-patching `EulerScene.prototype`
- **After**: Features implemented as `SceneComponent` instances

### 2. **Predictable Lifecycle**
- **Before**: Event-driven with unpredictable firing order
- **After**: Well-defined lifecycle with guaranteed execution order

### 3. **Clear Separation of Concerns**
- **Before**: Mixed scene management, rendering, and feature logic
- **After**: Separated into distinct layers

## New Architecture Components

### BaseScene
Core scene management with component orchestration:
```javascript
class BaseScene {
  addComponent(name, component)
  removeComponent(name)
  initialize()
  reset(data)
  setFrame(frameNum)
  dispose()
}
```

### SceneComponent
Interface for all scene features:
```javascript
class SceneComponent {
  onInitialize(scene)
  onReset(scene, data)
  onSetFrame(scene, frameNum)
  onDispose(scene)
}
```

### BaseView
Simplified view management:
```javascript
class BaseView {
  createScene()     // Abstract method
  setFrame(frameNum)
  previewFrame(frameNum)
  subscribeEvents(viewManager)
}
```

## Migration Examples

### Adding a New Scene Feature

**Before** (monkey-patching):
```javascript
// EulerScene_NewFeature.js
EulerScene.prototype.addNewFeature = function() {
  // Feature logic mixed with scene
};

export function enableNewFeature(scene) {
  scene.addEventListener('init', function(event) {
    // Complex event handling
  });
}
```

**After** (component-based):
```javascript
// components/NewFeatureComponent.js
export class NewFeatureComponent extends SceneComponent {
  constructor() {
    super('newFeature');
  }

  onInitialize(scene) {
    // Clean initialization
  }

  onReset(scene, data) {
    // Handle data updates
  }

  onSetFrame(scene, frameNum) {
    // Handle frame updates
  }

  onDispose(scene) {
    // Clean up resources
  }
}
```

### Using the New Architecture

```javascript
// Create scene
const scene = new EulerDecompositionScene(element, renderer, camera, numFrames);

// Add components in desired order
scene.addComponent('bone', new BoneComponent(geometry));
scene.addComponent('sphere', new SphereComponent());
scene.addComponent('cone', new ConeComponent(length));

// Initialize (components called in order)
await scene.initialize();

// Update with new data
await scene.reset({rotations: newRotations});

// Update frame
await scene.setFrame(frameNum);
```

## Benefits

### 1. **Predictable Execution Order**
Components execute in the order they're added, eliminating hidden dependencies.

### 2. **Clear Dependencies**
Each component declares its dependencies explicitly, making the system easier to understand.

### 3. **Easy Extension**
Adding new features is as simple as creating a new component class.

### 4. **Better Testing**
Components can be tested independently of the scene.

### 5. **Improved Maintainability**
Clear separation of concerns makes code easier to modify and debug.

## Migration Steps

### For Existing Features

1. **Identify the feature** in current `EulerScene_*.js` files
2. **Extract the logic** into a new `SceneComponent` subclass
3. **Move initialization** to `onInitialize()`
4. **Move event handlers** to appropriate lifecycle methods
5. **Update disposal** in `onDispose()`

### For New Features

1. **Create a new component** extending `SceneComponent`
2. **Implement lifecycle methods** as needed
3. **Add to scene** in the appropriate view
4. **Test independently** before integration

## Example: Converting EulerScene_Bone.js

**Before**:
```javascript
export function enableBone(boneScene, boneGeometry) {
  boneScene.boneGeometry = boneGeometry;
  
  boneScene.addEventListener('init', function (event) {
    const scene = event.target;
    scene.addBone();
  });
  
  boneScene.addEventListener('stepChange', function (event) {
    const scene = event.target;
    scene.updateBonesBasedOnStep();
  });
}
```

**After**:
```javascript
export class BoneComponent extends SceneComponent {
  constructor(boneGeometry) {
    super('bone');
    this.boneGeometry = boneGeometry;
  }

  onInitialize(scene) {
    this.createBones(scene);
  }

  onReset(scene, data) {
    this.updateBonePositions(scene, data);
  }

  onSetFrame(scene, frameNum) {
    this.updateBonesBasedOnStep(scene);
  }

  onDispose(scene) {
    this.disposeBones(scene);
  }
}
```

## Backwards Compatibility

The new architecture is designed to coexist with the existing code during migration. Key compatibility considerations:

1. **Gradual Migration**: Views can be migrated one at a time
2. **Shared Resources**: Components can share geometries and materials
3. **Event System**: New components can still listen to scene events if needed
4. **Existing APIs**: ViewManager and other external interfaces remain unchanged

## Performance Considerations

The new architecture provides several performance benefits:

1. **Reduced Event Overhead**: Direct method calls instead of event dispatching
2. **Better Resource Management**: Components handle their own cleanup
3. **Optimized Rendering**: Clear separation allows for rendering optimizations
4. **Memory Efficiency**: Components can be added/removed as needed

## Testing Strategy

1. **Unit Tests**: Test each component independently
2. **Integration Tests**: Test component interactions within scenes
3. **Regression Tests**: Ensure existing functionality still works
4. **Performance Tests**: Verify no performance degradation

## Future Enhancements

The new architecture enables several future improvements:

1. **Component Dependencies**: Automatic dependency resolution
2. **Lazy Loading**: Components loaded only when needed
3. **Plugin System**: Third-party components
4. **Serialization**: Save/load scene configurations
5. **Performance Profiling**: Per-component performance metrics