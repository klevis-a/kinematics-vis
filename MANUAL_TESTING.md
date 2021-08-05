Before proceeding with the test cases below, follow the instructions in the [README](README.md) to install the software and download the sample dataset.

### Test Cases

#### 1. Open a motion trial

**Steps**

1. Click the folder button (top of upper left hand quadrant) to open the trial selection dialog.
2. Select subject `O45_001_F_47_R` and `Scapular Plane Abduction`.
3. Click Analyze.

**Expected Outcome**

The UI should briefly flash `Loading...` then the trial analysis should be loaded.

* The upper left pane should have the `Humerus ISB: yx'y''` view.
* The upper right pane should have the `Scapula ISB: yx'z''` view.
* The lower left pane should have the `Preview` view.
* The lower right panel should contain plots and the default plot selected should be `Humerus ISB: yx'y''`.

#### 2. Orbital Controls

In all non-plot views the following controls should work:

1. Left-button dragging rotates the view.
2. Right-button dragging pans the view.
3. Middle-button scrolling zooms in and out.

#### 3. Motion capture frame preview (slider bar)

**Steps**

Drag the button of the slider bar (middle top of UI) to the right.

**Expected Outcome**

* The frame number indicator to the right of the slider bar should increase.
* All non-plot views should be updated. The slightly transparent scapula and humerus should be elevating.

#### 4. Analyzing a particular motion capture frame (slider bar)

**Steps**

Press the downward facing arrow to the left of the slider bar (once a motion capture frame has been selected via the slider bar).

**Expected Outcome**

* All views that start with Humerus or Scapula should be updated. The scapula view does not have a visual indication that updating completed successfully (subsequent test cases can validate that the update did complete successfully, however). The current longitude and latitude lines (indicated by yellow) on the Humerus views will update.

#### 5. Motion capture frame preview (plots)

**Steps**

Hover the mouse button over any plot curve. Trace the curve with the mouse pointer towards the right of the screen.

**Expected Outcome**

* The frame number indicator to the right of the slider bar should increase.
* All non-plot views should be updated. The slightly transparent scapula and humerus should be elevating.

#### 6. Analyzing a particular motion capture frame (plots)

**Steps**

Once a particular motion capture frame of interest has been determined (by hovering over the plot curves), click the left mouse button.

**Expected Outcome**

* All views that start with Humerus or Scapula should be updated. The scapula view does not have a visual indication that updating completed successfully (subsequent test cases can validate that the update did complete successfully, however). The current longitude and latitude lines (indicated by yellow) on the Humerus views will update.

#### 7. Switching the displayed view in a quadrant

**Steps**

Apart from the lower right quadrant, the views for all other quadrants can be switched via their drop-down selector. For each of the other 3 quadrants, make sure that each of the following views can be selected:

1. `Humerus ISB: yx'y''`
2. `Humerus Phadke: xz'y''`
3. `Humerus Swing Twist`
4. `Humerus Simultaneous`
5. `Preview`
6. `Scapula ISB: yx'z''`

**Expected Outcome**

All of the quadrants apart form the lower right one should update once the view that it displays is updated via the drop-down box.

#### 7. Correct number of steps for each view

**Steps**

This test case assures that the correct number of steps are associated with each view. The number of steps can be seen on the lower left corner of each view.

**Expected Outcome**

The following number of steps should be associated with views:

`Humerus ISB: yx'y''`: 3

`Humerus Phadke xz'y''`: 3

`Humerus Swing Twist`: 2

`Humerus Simultaneous`: 1

`Scapula ISB yxz''`: 3

`Preview`: None

#### 8. Euler angle step animations

**Steps**

Select any view that starts with Humerus or Scapula. Click each Step Number (lower left corner of view) to update the view. Click the Play button to animate a particular step. Click the last step for the particular view and animate until the end.

**Expected Outcome**

* When a step number is clicked the view is updated. The animation bar (to the right of the steps) is in its starting position after a step is clicked.
* When the play button is clicked the step animates and the animation bar slides to the right over a period of roughly 2 seconds.
* In the final step, once the animation has finished, the moving humerus/scapula will completely overlap the transparent humerus/scapula (which indicates the orientation of the humerus/scapula for that particular motion capture frame). This is how you know that the Humerus/Scapula view updated correctly when the downward facing arrow was clicked.

#### 9. Cycling through available plots

**Steps**

Use the drop-down selector of the lower right quadrant to cycle through available plots.

**Expected Outcome**

The following plots are available:

* Humerus Plane of Elevation
* Humerus Angle of Elevation
* Humerus Axial Orientation
* Humerus Axial Rotation
* Humerus ISB: yx'y''
* Humerus Phadke: xz'y''
* Humerus Swing Twist
* Scapula ISB: yx'z''

Selecting a plot updates the lower right quadrant and the title of the plot matches the selected value.

#### 10. Double-clicking to magnify a view

**Steps**

Double-click on any non-plot view. Once the view is magnified, double-click again to return to the standard view layout.

**Expected Outcome**

When a view is in a quadrant, double-clicking on it magnifies the view so it takes up the entire browser window. When the view is magnified, double-clicking restores the standard 4 pane layout.

#### 11. Getting Help

**Steps**

Click the `?` to the right of the frame selection bar (top middle of web app). Click the `X` in the upper right corner of the displayed help to close it.

**Expected Outcome**

* A brief description of how to interact with the software is displayed when the `?` button is clicked.
* The help closes when the `X` button is clicked.

#### 12. Additional options exclusive to Humerus views

**Steps**

Click the `Open Controls` button on the lower right corner of the web app. With a Humerus view displayed on any quadrant change the following options:

* Humerus Base
* Visualize Angles
* Spherical Area
* Show Sphere

Click `Close Controls`.

**Expected Outcome**

The Humerus view(s) will update as each option is changed. The controls should minimize when `Close Controls` is clicked.

#### 13. Additional options affecting both Humerus and Scapula views

**Steps**

Click the `Open Controls` button on the lower right corner of the web app. In both the Humerus and Scapula views select the final step for the view and animate to the end of the step. Then, change the following options:

* Show Triads/Arcs
* Prior Step Bones
* Show Body Planes

**Expected Outcome**

The Humerus and Scapula views will update as each option is changed.

#### 14. Humerus views are linked

**Steps**

In one quadrant select a Humerus view (say `Humerus ISB: yx'y''`). In another quadrant select another Humerus view (say `Humerus Phadke xz'y''`).

Now, rotate, pan, and zoom in/out of one view.

**Expected Outcome**

The other Humerus view will mimic the rotation, panning, and zooming of the controlled Humerus view.