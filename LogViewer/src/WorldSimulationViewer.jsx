import React, { useState, useEffect } from 'react';
import 'cesium/Build/Cesium/Widgets/widgets.css'; // Import Cesium CSS here

const WorldSimulationViewer = ({ data }) => {
  const [viewer, setViewer] = useState(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cesium.com/downloads/cesiumjs/releases/1.82/Build/Cesium/Cesium.js';
    script.async = true;

    script.onload = () => {
      Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxZTlhNGM0OC02MWVmLTQxNTAtOTUxMS00YjkwZTkyZDkxYzkiLCJpZCI6MjE1NjczLCJpYXQiOjE3MTU4NTk1MDJ9.i-EiyR6lQUyGilKu8v4Sk6n02yTZRHKwV5A4JYnFukw';

      if (!viewer) {
        const cesiumViewer = new Cesium.Viewer('cesiumContainer', {
          terrainProvider: Cesium.createWorldTerrain(),
        });
        setViewer(cesiumViewer);
      }
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [viewer]);

  useEffect(() => {
    if (viewer && data) {
      initializeViewer(data);
    }
  }, [viewer, data]);

  const initializeViewer = (flightData) => {
    const timeStepInSeconds = 30;
    const totalSeconds = timeStepInSeconds * (flightData.length - 1);
    const start = Cesium.JulianDate.fromIso8601('2020-03-09T23:10:00Z');
    const stop = Cesium.JulianDate.addSeconds(start, totalSeconds, new Cesium.JulianDate());

    viewer.clock.startTime = start.clone();
    viewer.clock.stopTime = stop.clone();
    viewer.clock.currentTime = start.clone();
    viewer.timeline.zoomTo(start, stop);
    viewer.clock.multiplier = 50;
    viewer.clock.shouldAnimate = true;

    const positionProperty = new Cesium.SampledPositionProperty();

    flightData.forEach((dataPoint, i) => {
      const time = Cesium.JulianDate.addSeconds(start, i * timeStepInSeconds, new Cesium.JulianDate());
      const position = Cesium.Cartesian3.fromDegrees(dataPoint.longitude, dataPoint.latitude, dataPoint.height);
      positionProperty.addSample(time, position);

      viewer.entities.add({
        description: `Location: (${dataPoint.longitude}, ${dataPoint.latitude}, ${dataPoint.height})`,
        position: position,
        point: { pixelSize: 10, color: Cesium.Color.RED },
      });
    });

    const loadModel = async () => {
      const airplaneUri = await Cesium.IonResource.fromAssetId(2581825);
      const airplaneEntity = viewer.entities.add({
        availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({ start: start, stop: stop })]),
        position: positionProperty,
        model: { uri: airplaneUri },
        orientation: new Cesium.VelocityOrientationProperty(positionProperty),
        path: new Cesium.PathGraphics({ width: 3 }),
      });

      viewer.trackedEntity = airplaneEntity;
    };

    loadModel();
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div id="cesiumContainer" style={{ width: '100%', height: '90vh' }}></div>
    </div>
  );
};

export default WorldSimulationViewer;
