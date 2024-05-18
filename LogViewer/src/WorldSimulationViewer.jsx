import React, { useState, useEffect } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import 'cesium/Build/Cesium/Widgets/InfoBox/InfoBox.css';
import 'cesium/Build/Cesium/Widgets/InfoBox/InfoBoxDescription.css';
import { parseCSV, parseXLS, parseJSON, parseYAML } from './utils/fileParserUtils';

const WorldSimulationViewer = () => {
  const [viewer, setViewer] = useState(null);
  const [model, setModel] = useState(null);
  const [csvData, setCsvData] = useState(null);

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
        uri: './plane.glb', // Update with the correct path to your 3D model
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
    if (!csvData || csvData.length === 0) return;

    // Assuming the first row contains the data for the model's position
    const positionData = csvData[0];
    const latitude = parseFloat(positionData.latitude);
    const longitude = parseFloat(positionData.longitude);
    const height = parseFloat(positionData.height);

    if (!isNaN(latitude) && !isNaN(longitude) && !isNaN(height)) {
      model.position = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
    } else {
      console.error('Invalid position data:', positionData);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const extension = file.name.split('.').pop().toLowerCase();

    switch (extension) {
      case 'csv':
        parseCSV(file, handleParsedData);
        break;
      case 'xls':
      case 'xlsx':
        import('xlsx').then((XLSX) => {
          parseXLS(file, XLSX, handleParsedData);
        });
        break;
      case 'json':
        parseJSON(file, handleParsedData);
        break;
      case 'yml':
      case 'yaml':
        parseYAML(file, handleParsedData);
        break;
      default:
        console.error('Unsupported file format');
    }
  };

  const handleParsedData = (results) => {
    if (results.errors && results.errors.length > 0) {
      console.error('File parsing error:', results.errors);
      return;
    }
    setCsvData(results.data);
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="mb-4">
        <label htmlFor="fileUpload" className="mr-2">
          Upload File:
        </label>
        <input
          type="file"
          id="fileUpload"
          accept=".csv,.xls,.xlsx,.json,.yml,.yaml"
          onChange={handleFileUpload}
          className="border border-gray-300 rounded-md p-2"
        />
      </div>
      <div id="cesiumContainer" style={{ width: '100%', height: '100%' }}>
        {/* Cesium container */}
      </div>
    </div>
  );
};

export default WorldSimulationViewer;
