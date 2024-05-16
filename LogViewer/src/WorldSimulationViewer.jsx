import React, { useState, useEffect } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import 'cesium/Build/Cesium/Widgets/InfoBox/InfoBox.css';
import 'cesium/Build/Cesium/Widgets/InfoBox/InfoBoxDescription.css';

const WorldSimulationViewer = ({ csvData }) => {
  const [viewer, setViewer] = useState(null);
  const [model, setModel] = useState(null);

  useEffect(() => {
    if (!window.Cesium) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/cesium/Build/Cesium/Cesium.js';
      script.async = true;
      script.onload = initializeCesium;
      document.body.appendChild(script);
    } else {
      initializeCesium();
    }
  }, []);

  const initializeCesium = () => {
    const cesiumViewer = new Cesium.Viewer('cesiumContainer', {
      shouldAnimate: true,
      animation: false,
      timeline: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
    });
    setViewer(cesiumViewer);
  };

  useEffect(() => {
    if (viewer && csvData) {
      loadModel();
    }
  }, [viewer, csvData]);

  const loadModel = () => {
    const modelEntity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(0, 0, 0),
      model: {
        uri: 'model.glb', // Update with the correct path to your 3D model
      },
    });
    setModel(modelEntity);
  };

  useEffect(() => {
    if (model && csvData) {
      updateModelPosition();
    }
  }, [model, csvData]);

  const updateModelPosition = () => {
    // Update model position based on CSV data or random coordinates
    // For simplicity, let's assume random coordinates for now
    const randomLatitude = Math.random() * 180 - 90;
    const randomLongitude = Math.random() * 360 - 180;
    const randomAltitude = Math.random() * 5000000;
    model.position = Cesium.Cartesian3.fromDegrees(randomLongitude, randomLatitude, randomAltitude);
  };

  return (
    <div id="cesiumContainer" style={{ width: '100%', height: '100%' }}>
      {/* Cesium container */}
    </div>
  );
};

export default WorldSimulationViewer;
