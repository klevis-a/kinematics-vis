---
title: 'Kinematics-vis: A Visualization Tool for the Mathematics of Human Motion'
tags:
  - JavaScript
  - three.js
  - WebGL
  - motion capture
  - kinematics
  - visualization
  - shoulder
  - Euler angles
  - swing-twist
  - true axial rotation
authors:
  - name: Klevis Aliaj, PhD
    orcid: 0000-0001-7324-6931
    affiliation: "1, 2"
  - name: Heath B. Henninger, PhD^[corresponding author]
    orcid: 0000-0002-3635-1289
    affiliation: "1, 2, 3"
affiliations:
 - name: University of Utah, Department of Orthopaedics
   index: 1
 - name: University of Utah, Department of Biomedical Engineering
   index: 2
 - name: University of Utah, Department of Mechanical Engineering
   index: 3
date: 11 June 2021
bibliography: paper.bib

---

# Summary

Kinematic analysis studies characterize human motion in healthy, pathologic, and rehabilitated subjects. These studies provide rich datasets which enable clinicians and researchers to understand disease progression, and the effects of surgical intervention and physical therapy. A variety of techniques – ranging from optical skin marker tracking to biplane fluoroscopy – are utilized to collect these datasets. The quantification and physical interpretation of these motion capture datasets (i.e. kinematic analysis) are predominantly conducted using Euler/Cardan angles, whose output - time series of 3 angles - is presented in peer-reviewed manuscripts in 2D graphs [@Ludewig:2009]. This rudimentary presentation, however, obscures the physical meaning behind Euler/Cardan analysis. As other authors have noted, the visualization of these angles enables meaningful discussion between biomechanics researchers and clinicians [@Baker:2011].  A ubiquitous open-source method to concurrently visualize recorded human motion and the results of kinematic analysis is presently lacking in the biomechanics community. ‘Kinematics-vis’ is a JavaScript web application that visualizes kinematic analysis output resulting from motion capture studies.


# Statement of need

3D rotations are utilized to quantify human motion and in kinematic analysis. However, because 3D rotations belong to the SO(3) mathematical group, they can be difficult to understand – especially for biomechanics researchers and clinicians with a limited mathematical background. Euler/Cardan angles are typically utilized to infuse physical meaning into kinematic analysis. However, they are described abstractly and attempts towards visualizing their physical underpinning is rarely made [@Baker:2011]. Furthermore, 12 Euler/Cardan angle sequences exist for quantifying 3D orientations, and which sequence is most appropriate for quantifying human motion is debatable and varies by study [@Krishnan:2019]. It has previously been shown that incorrect usage of Euler/Cardan sequences can significantly misrepresent human motion [@Aliaj:2021]. Furthermore, studies rarely present multiple Euler/Cardan sequences in publications – which clouds data interpretation and limits the ability to compare results between laboratory groups and studies.

‘Kinematics-vis’ is a JavaScript web application that visualizes different methods of quantifying and decomposing human motion including, but not limited to, Euler/Cardan angles \autoref{fig:fig1}. The software enables researchers to visualize different kinematic analysis methods while outputting the 2D time-series graphs that are typically presented in peer-reviewed manuscripts [@Ludewig:2009]. Presently, ‘kinematics-vis’ is specialized to study shoulder kinematic analysis. However, it is easily expandable to accommodate the decomposition sequences of other joints, including subject-specific 3D anatomic models. ‘Kinematics-vis’ is designed to work from a central motion capture dataset, but also enables the visualization of singular motion files. JavaScript and WebGL, the technologies which underlie ‘kinematics-vis’, are ubiquitous and a standard in modern web browsers – which facilitates collaboration between researchers and clinicians.

A variety of commercial musculoskeletal modeling software are utilized in biomechanics, including [AnyBody](https://www.anybodytech.com/) and [Visual3D](https://www.c-motion.com/#visual3d). Computational kinematics packages (e.g. rotation matrices, trajectory generation, quaternions) are abundant and are typically provided as part of scientific computing environments (e.g. [SciPy Spatial Transform package](https://docs.scipy.org/doc/scipy/reference/spatial.transform.html)) - but, visualization software is scarce. The open-source musculoskeletal modeling software [OpenSim](https://opensim.stanford.edu/work/index.html) does provide the ability to visualize the movement of bones and joints. However, what is missing from all the aforementioned software is the ability to visualize how decomposition methods (particularly Euler/Cardan angles) quantify human motion. Because 12 Euler/Cardan angle sequences exist, the choice of such a sequence can have a meaningful effect on the kinematic plots presented in biomechanics studies to researchers and clinicians [@Aliaj:2021; @Baker:2011]. Notably, [@Baker:2011] visually demonstrates how the measured joint angles are affected by the chosen Euler/Cardan angle sequence and argues that "only when we can adequately visualise these angles that we can engage in meaningful consideration of which orientation this is." Although [@Baker:2011] represents the first attempt at visualizing these angles in biomechanics literature, the presented analysis is static. It consists of a series of screenshots in a journal article.

The solution presented herein enables biomechanics researchers to visualize the 3D angles that Euler/Cardan decompositions quantify, and to associate these 3D angles with typical 2D plots. The interactive nature of the software also enables exploration that is not possible within the confines of a journal article page. The presented software can be especially useful to novice biomechanics researchers (e.g. undergraduate and graduate students) for learning kinematic analysis. The downside of the presented software is that it offers only kinematic analysis within the musculoskeletal modeling and analysis domain. Perhaps a better approach is to include this software as a plug-in to [OpenSim](https://opensim.stanford.edu/work/index.html). The downside of the plug-in approach is that researchers that perform kinematic analysis may not perform subsequent modeling. Regardless, it would be a good idea to consider whether future iterations of this software should be developed as a plug-in to OpenSim.

Human motion analysis is a complex topic. Biomechanists, clinicians, and trainees typically accept the results of research papers without having a consistent way to validate these results. ‘Kinematics-vis’ enables discussion amongst all parties interested in human motion analysis and obviates the need for a significant mathematical background. ‘Kinematics-vis’ provides a means for researchers to make their motion capture datasets visually explorable.  This provides insight which is missing in the 2D graphs accompanying peer-reviewed publications. This software can be used as an adjunct to published manuscripts to allow readers to analyze a motion of interest both visually and quantitatively. 

# Mathematics

The reader is referred to the following relevant references for the underlying mathematical frameworks that underpin ‘kinematics-vis’: 

* ISB recommendation on definitions of joint coordinate systems of various joints for the reporting of human joint motion--part II: shoulder, elbow, wrist and hand [@Wu:2005].
* Comparison of glenohumeral motion using different rotation sequences [@Phadke:2011].
* Determination of axial rotation angles of limb segments — a new method [@Cheng:2000]. 
* New mathematical definition and calculation of axial rotation of anatomical joints [@Miyazaki:1991].
* Beyond Euler/Cardan analysis: True glenohumeral axial rotation during arm elevation and rotation [@Aliaj:2021].
* A survey of human shoulder kinematic representations [@Krishnan:2019].

# Figures

![Example display of a shoulder motion analyzed using kinematics-vis. Arm elevation is shown with the humerus motion decomposed using the International Society of Biomechanics (ISB) yx’y’’ sequence (top left) and scapular motion decomposed using the ISB yx’z’’ sequence (top right). The 3D \“Preview\” view (bottom left) visualizes the simultaneous motion of the humerus and scapula. The 2D kinematic curves typically presented in peer-reviewed articles are also presented (bottom right). \label{fig:fig1}](fig1.png)

# Acknowledgements

Research reported in this publication was supported by the National Institute of Arthritis and Musculoskeletal and Skin Diseases (NIAMS) of the National Institutes of Health under award number R01 AR067196, and a Shared Instrumentation Grant S10 OD021644. The research content herein is solely the responsibility of the authors and does not necessarily represent the official views of the National Institutes of Health.

# References
