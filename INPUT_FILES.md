### Format for Input Files
To visualize a kinematic trajectory the following files are needed:
1. Humerus ASCII STL 3D model file
2. Scapula ASCII STL 3D model file
3. A CSV (see format below) file specifying the position of the humeral head center (HHC), lateral epicondyle (LE), and medial epicondyle (ME) in millimeters, in the humerus STL model file coordinate system. The specified landmark order must be utilized.
4. A CSV (see format below) file specifying the position of the glenoid center (GC), inferior angle (IA), trigonum spinae (TS), posterior lateral acromion (PLA), and acromion (AC) in millimeters, in the scapula STL model file coordinate system. The specified landmark order must be utilized.
5. A CSV file (see format below) specifying the pose trajectory of the torso, scapula, and humerus.

The provided sample dataset (downloadData.sh and downloadData.bat) contains many examples of the aforementioned files. Furthermore, if you do not have patient-specific bone models you may use any of the STL 3D models (and associated landmarks files) provided in the sample dataset.

##### Humerus landmarks file format

| Landmark | X       | Y       | Z       |
| -------- | ------- | ------- | ------- |
| HHC      | -108.61 | -124.11 | -112.29 |
| LE       | -157.13 | -86.69  | -384.3  |
| ME       | -97.39  | -91.46  | -394.46 |

##### Scapula landmarks file format

| Landmark | X       | Y       | Z       |
| -------- | ------- | ------- | ------- |
| GC       | -87.01  | -112.83 | -116.54 |
| IA       | -21.19  | -42.55  | -211.43 |
| TS       | -8.66   | -57.25  | -106.92 |
| PLA      | -119.27 | -99.63  | -90.29  |
| AC       | -98.14  | -128.33 | -71.56  |

##### Pose trajectory file specification

The pose trajectory file must contain columns for the position and orientation (scalar-last quaternion) for the torso, scapula, and humerus - in that order.

* torso_pos_x
* torso_pos_y
* torso_pos_z
* torso_quat_x
* torso_quat_y
* torso_quat_z
* torso_quat_w
* scapula_pos_x
* scapula_pos_y
* scapula_pos_z
* ...
* humerus_quat_x
* humerus_quat_y
* humerus_quat_z
* humerus_quat_w

Please note that the torso, scapula, and humerus must all be expressed in the same underlying coordinate system (e.g. biplane fluoroscopy or Vicon).

Each row of the pose trajectory file represents a time sample of the motion trajectory. The software assumes that time samples are equally spaced in time - i.e., constant sampling frequency. See details below about how this sampling frequency is defined.

### Specification of Input Files to Analyze

There are two primary ways to specify the input files to the web application: 1) via a database put together via a JSON file, 2) via manual file uploads. This section explores these two methods in more detail. The provided sample dataset (downloadData.sh or downloadData.bat) provides an example of a database put together via a JSON file and can be utilized as a reference for the rest of this section.

##### Specifying Input Files via a JSON file

This method is only possible if you have the ability to upload files to the server where the web app is running or if you are running the web app locally. Under the root application directory, create a `csv` directory and under the `csv` directory create a `db_summary.json` file. Within the `db_summary.json` file, the key for each top-level entry (object) specifies a subject identifier. Within each subject, `config` and `activities` entries must exist. Furthermore, one subject must be set as the default one that is selected when the subject selection dialog is rendered. This is done by setting the `default` entry for this subject to `1`.

The `config` entry specifies files that pertain to a particular subject and do not vary between the activities that the subject performed. Specifically the following files must be specified in relationship to the previously created `csv` directory:

* `humerus_landmarks_file` - the location of the humerus landmarks file in relationship to the `csv` directory.
* `scapula_landmarks_file` -  the location of the scapula landmarks file in relationship to the `csv` directory.
* `humerus_stl_file` - the location of the humerus ASCII STL 3D model file in relationship to the `csv` directory.
* `scapula_stl_file` - the location of the scapula ASCII STL 3D model file in relationship to the `csv` directory.

The `activities` entry contains pose trajectory files for one or more activities that the subject performed. The order that these activities are listed in this file will be preserved in the UI. Special characters for activity names may be specified via their corresponding HTML codes. For each activity, the following entries must be present:

* `trajectory` - the location of the pose trajectory file for this activity in relationship to the `csv` directory.
* `freq` - the capture frequency (in Hz) for this activity.

##### Specifying Input Files via Manual Upload

In the UI, click the folder icon (top of upper left quadrant) to open the database selection dialog. Click **Manual File Selection**. The files discussed in the **Specifying Input Files via a JSON file** section and the capture frequency can be specified here manually.