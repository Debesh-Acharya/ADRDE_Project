import React, { useState, useEffect } from 'react';
import Papa from 'papaparse'; // Library for parsing CSV files

const PlaneTrajectoryViewer = ({ csvData }) => {
  const [viewer, setViewer] = useState(null);
  const [trajectoryData, setTrajectoryData] = useState([]);

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
    const cesiumViewer = new window.Cesium.Viewer('cesiumContainer');
    setViewer(cesiumViewer);
  };

  useEffect(() => {
    if (csvData) {
      parseCSV(csvData);
    }
  }, [csvData]);

  const parseCSV = (data) => {
    Papa.parse(data, {
      header: true,
      complete: (results) => {
        const parsedData = results.data.map((row) => ({
          latitude: parseFloat(row.latitude),
          longitude: parseFloat(row.longitude),
          altitude: parseFloat(row.altitude),
          yaw: parseFloat(row.yaw),
          pitch: parseFloat(row.pitch),
          roll: parseFloat(row.roll),
        }));
        setTrajectoryData(parsedData);
      },
    });
  };

  const plotTrajectory = () => {
    if (!viewer) return;

    const entity = viewer.entities.add({
      availability: new window.Cesium.TimeIntervalCollection([new window.Cesium.TimeInterval({
        start: window.Cesium.JulianDate.fromIso8601(trajectoryData[0].time), // Assuming time attribute in CSV
        stop: window.Cesium.JulianDate.fromIso8601(trajectoryData[trajectoryData.length - 1].time), // Assuming time attribute in CSV
      })]),
      position: new window.Cesium.SampledPositionProperty(),
      orientation: new window.Cesium.VelocityOrientationProperty(),
      model: {
        uri: 'plane.glb',
        minimumPixelSize: 15,
      },
    });

    trajectoryData.forEach((point) => {
      const time = window.Cesium.JulianDate.fromIso8601(point.time); // Assuming time attribute in CSV
      const position = window.Cesium.Cartesian3.fromDegrees(point.longitude, point.latitude, point.altitude);
      const orientation = window.Cesium.Transforms.headingPitchRollQuaternion(
        position,
        new window.Cesium.HeadingPitchRoll(point.yaw, point.pitch, point.roll)
      );
      entity.position.addSample(time, position);
      entity.orientation.addSample(time, orientation);
    });

    viewer.flyTo(entity);
  };

  useEffect(() => {
    if (viewer && trajectoryData.length > 0) {
      plotTrajectory();
    }
  }, [viewer, trajectoryData]);

  return (
    <div id="cesiumContainer" style={{ width: '100%', height: '100%' }}>
      {/* Cesium container */}
    </div>
  );
};

export default PlaneTrajectoryViewer;
