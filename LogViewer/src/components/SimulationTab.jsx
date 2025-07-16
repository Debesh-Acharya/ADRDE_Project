import React, { useState, useRef, useEffect } from 'react';

const SimulationTab = ({ csvData, headers }) => {
  const cesiumContainerRef = useRef(null);
  const viewerRef = useRef(null);
  const aircraftEntityRef = useRef(null);
  const isInitializingRef = useRef(false); // Prevent double initialization
  const cleanupListenersRef = useRef([]); // Track event listeners for cleanup
  
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [coordinateSystem, setCoordinateSystem] = useState('gps');
  const [selectedColumns, setSelectedColumns] = useState({
    lat: 'LAT',
    lon: 'LON',
    alt: 'ALT',
    heading: 'HDG',
    x: 'X',
    y: 'Y'
  });
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentTelemetry, setCurrentTelemetry] = useState(null);
  const [trajectoryPoints, setTrajectoryPoints] = useState([]);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [cesiumLoaded, setCesiumLoaded] = useState(false);
  const [viewerReady, setViewerReady] = useState(false);

  // Auto-detect coordinate system
  useEffect(() => {
    if (headers && headers.length > 0) {
      const hasGPSCoords = headers.includes('LAT') && headers.includes('LON');
      const hasLocalCoords = headers.includes('X') && headers.includes('Y');
      
      if (hasGPSCoords) {
        setCoordinateSystem('gps');
      } else if (hasLocalCoords) {
        setCoordinateSystem('local');
      }
    }
  }, [headers]);

  // ENHANCED CESIUM INITIALIZATION WITH PROPER CLEANUP
  useEffect(() => {
    // Prevent multiple initializations
    if (isInitializingRef.current) {
      console.log('🔄 Initialization already in progress, skipping...');
      return;
    }

    // Check if viewer already exists
    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      console.log('✅ Viewer already exists, skipping initialization');
      return;
    }

    const initializeCesium = async () => {
      if (!cesiumContainerRef.current) {
        console.log('⚠️ Container ref not available yet');
        return;
      }

      isInitializingRef.current = true;
      console.log('🚀 Starting Cesium initialization...');

      try {
        // Load Cesium if not already loaded
        if (!window.Cesium) {
          await loadCesiumScript();
        }

        // Double-check that we don't already have a viewer
        if (viewerRef.current && !viewerRef.current.isDestroyed()) {
          console.log('✅ Viewer created during script loading, using existing one');
          isInitializingRef.current = false;
          return;
        }

        // Set token
        window.Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxZTlhNGM0OC02MWVmLTQxNTAtOTUxMS00YjkwZTkyZDkxYzkiLCJpZCI6MjE1NjczLCJpYXQiOjE3MTU4NTk1MDJ9.i-EiyR6lQUyGilKu8v4Sk6n02yTZRHKwV5A4JYnFukw';

        console.log('Creating Cesium viewer in container:', cesiumContainerRef.current);
        console.log('Container dimensions:', cesiumContainerRef.current.clientWidth, 'x', cesiumContainerRef.current.clientHeight);

        // Create viewer with unique container
        const viewer = new window.Cesium.Viewer(cesiumContainerRef.current, {
          animation: true,
          baseLayerPicker: false,
          fullscreenButton: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          sceneModePicker: false,
          selectionIndicator: false,
          timeline: true,
          navigationHelpButton: false,
          scene3DOnly: false,
          shouldAnimate: true,
          terrain: window.Cesium.Terrain.fromWorldTerrain()
        });

        // Force the viewer to be visible
        viewer.cesiumWidget.container.style.width = '100%';
        viewer.cesiumWidget.container.style.height = '100%';
        viewer.cesiumWidget.container.style.position = 'absolute';
        viewer.cesiumWidget.container.style.top = '0';
        viewer.cesiumWidget.container.style.left = '0';

        // Configure viewer
        viewer.scene.backgroundColor = window.Cesium.Color.fromCssColorString('#0B1426');
        viewer.scene.globe.enableLighting = true;
        viewer.scene.fog.enabled = true;

        // Store viewer reference
        viewerRef.current = viewer;
        setCesiumLoaded(true);
        setViewerReady(true);

        console.log('✅ Cesium viewer created successfully');
        console.log('Viewer container:', viewer.cesiumWidget.container);

        // Force resize to ensure proper display
        setTimeout(() => {
          if (viewer && !viewer.isDestroyed()) {
            viewer.resize();
          }
        }, 100);

      } catch (error) {
        console.error('❌ Error initializing Cesium:', error);
      } finally {
        isInitializingRef.current = false;
      }
    };

    initializeCesium();

    // ENHANCED CLEANUP FUNCTION
    return () => {
      console.log('🧹 Cleaning up Cesium viewer...');
      
      // Clean up event listeners
      cleanupListenersRef.current.forEach(removeListener => {
        try {
          removeListener();
        } catch (error) {
          console.warn('⚠️ Error removing event listener:', error);
        }
      });
      cleanupListenersRef.current = [];

      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        try {
          // Remove all entities
          viewerRef.current.entities.removeAll();
          
          // Destroy the viewer
          viewerRef.current.destroy();
          console.log('✅ Viewer destroyed successfully');
        } catch (error) {
          console.warn('⚠️ Error during viewer cleanup:', error);
        } finally {
          viewerRef.current = null;
          setViewerReady(false);
          setCesiumLoaded(false);
          isInitializingRef.current = false;
        }
      }
    };
  }, []); // Empty dependency array - only run once

  // SEPARATE EFFECT FOR SIMULATION CREATION
  useEffect(() => {
    if (viewerReady && csvData && csvData.length > 0 && !isInitializingRef.current) {
      console.log('🎯 Creating flight simulation...');
      createFlightSimulation();
    }
  }, [viewerReady, csvData, selectedColumns, coordinateSystem]);

  // Helper function to load Cesium script
  const loadCesiumScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Cesium) {
        resolve();
        return;
      }

      // Add CSS
      const link = document.createElement('link');
      link.href = 'https://cesium.com/downloads/cesiumjs/releases/1.115/Build/Cesium/Widgets/widgets.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      // Add script
      const script = document.createElement('script');
      script.src = 'https://cesium.com/downloads/cesiumjs/releases/1.115/Build/Cesium/Cesium.js';
      script.async = true;
      script.onload = () => {
        console.log('✅ Cesium script loaded');
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const createFlightSimulation = () => {
    if (!viewerRef.current || !csvData || csvData.length === 0) return;

    const viewer = viewerRef.current;
    const Cesium = window.Cesium;

    try {
      // Clear existing entities
      viewer.entities.removeAll();

      // Clear existing event listeners
      cleanupListenersRef.current.forEach(removeListener => {
        try {
          removeListener();
        } catch (error) {
          console.warn('⚠️ Error removing event listener:', error);
        }
      });
      cleanupListenersRef.current = [];

      // Generate flight path
      const flightData = generateFlightPath();
      setTrajectoryPoints(flightData);

      if (flightData.length === 0) return;

      console.log(`Creating simulation with ${flightData.length} data points`);

      // Time setup
      const timeStepInSeconds = 2;
      const totalSeconds = timeStepInSeconds * (flightData.length - 1);
      const start = Cesium.JulianDate.fromDate(new Date());
      const stop = Cesium.JulianDate.addSeconds(start, totalSeconds, new Cesium.JulianDate());

      // Configure clock
      viewer.clock.startTime = start.clone();
      viewer.clock.stopTime = stop.clone();
      viewer.clock.currentTime = start.clone();
      viewer.timeline.zoomTo(start, stop);
      viewer.clock.multiplier = simulationSpeed;
      viewer.clock.shouldAnimate = isSimulationRunning;

      // Create position property
      const positionProperty = new Cesium.SampledPositionProperty();

      // Add samples and waypoints
      flightData.forEach((dataPoint, i) => {
        const time = Cesium.JulianDate.addSeconds(start, i * timeStepInSeconds, new Cesium.JulianDate());
        const position = Cesium.Cartesian3.fromDegrees(
          dataPoint.longitude,
          dataPoint.latitude,
          dataPoint.altitude + 50
        );
        positionProperty.addSample(time, position);

        // Add waypoint markers
        if (i % 20 === 0) {
          viewer.entities.add({
            position: position,
            point: {
              pixelSize: 8,
              color: Cesium.Color.YELLOW,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2
            }
          });
        }
      });

      // SIMPLE MODEL LOADING - Using your preferred technique
      const loadModel = async () => {
        try {
          console.log('🔍 Loading aircraft model...');
          
          // Try your plane.glb first
          let airplaneUri = './plane.glb';
          let modelSource = 'LOCAL';
          
          // Test if local file exists
          try {
            const response = await fetch('./plane.glb');
            if (!response.ok) {
              throw new Error('Local GLB not found');
            }
            console.log('✅ Using local plane.glb');
          } catch (error) {
            console.warn('⚠️ Local plane.glb not found, using Cesium Ion model');
            airplaneUri = await Cesium.IonResource.fromAssetId(2581825);
            modelSource = 'CESIUM_ION';
          }

          // Create aircraft entity - Clean and simple approach
          const airplaneEntity = viewer.entities.add({
            id: 'military-aircraft',
            availability: new Cesium.TimeIntervalCollection([
              new Cesium.TimeInterval({ start: start, stop: stop })
            ]),
            position: positionProperty,
            model: { 
              uri: airplaneUri,
              minimumPixelSize: 64,
              maximumScale: 20000,
              scale: 3.0
            },
            orientation: new Cesium.VelocityOrientationProperty(positionProperty),
            path: new Cesium.PathGraphics({ 
              width: 5,
              material: Cesium.Color.CYAN,
              show: true,
              leadTime: 0,
              trailTime: 120
            }),
            label: {
              text: `MILITARY AIRCRAFT (${modelSource})`,
              font: '16pt Arial Bold',
              fillColor: Cesium.Color.CYAN,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              pixelOffset: new Cesium.Cartesian2(0, -60),
              horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              scale: 0.8
            }
          });

          aircraftEntityRef.current = airplaneEntity;
          
          // Set camera to track the aircraft
          viewer.trackedEntity = airplaneEntity;
          
          // Set model loaded status
          setModelLoaded(modelSource === 'LOCAL');
          
          console.log(`✅ Aircraft model loaded successfully (${modelSource})`);

        } catch (error) {
          console.error('❌ Error loading aircraft model:', error);
          
          // Create fallback box aircraft
          const fallbackAircraft = viewer.entities.add({
            id: 'fallback-aircraft',
            availability: new Cesium.TimeIntervalCollection([
              new Cesium.TimeInterval({ start: start, stop: stop })
            ]),
            position: positionProperty,
            box: {
              dimensions: new Cesium.Cartesian3(50, 10, 8),
              material: Cesium.Color.RED,
              outline: true,
              outlineColor: Cesium.Color.CYAN
            },
            orientation: new Cesium.VelocityOrientationProperty(positionProperty),
            path: new Cesium.PathGraphics({ 
              width: 5,
              material: Cesium.Color.CYAN,
              show: true,
              leadTime: 0,
              trailTime: 120
            }),
            label: {
              text: 'FALLBACK AIRCRAFT',
              font: '16pt Arial Bold',
              fillColor: Cesium.Color.RED,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              pixelOffset: new Cesium.Cartesian2(0, -60)
            }
          });

          aircraftEntityRef.current = fallbackAircraft;
          viewer.trackedEntity = fallbackAircraft;
          setModelLoaded(false);
          
          console.log('✅ Fallback aircraft created');
        }
      };

      // Load the model
      loadModel();

      // Add flight path polyline
      const pathPositions = flightData.map(point => 
        Cesium.Cartesian3.fromDegrees(point.longitude, point.latitude, point.altitude)
      );

      viewer.entities.add({
        polyline: {
          positions: pathPositions,
          width: 3,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.2,
            color: Cesium.Color.YELLOW.withAlpha(0.8)
          }),
          clampToGround: false
        }
      });

      // Setup telemetry updates with proper cleanup tracking
      const telemetryListener = viewer.clock.onTick.addEventListener((clock) => {
        const currentTime = clock.currentTime;
        const elapsed = Cesium.JulianDate.secondsDifference(currentTime, start);
        const progress = Math.min(elapsed / totalSeconds, 1) * 100;
        
        setCurrentProgress(progress);
        
        const dataIndex = Math.floor((progress / 100) * (flightData.length - 1));
        const telemetry = flightData[dataIndex];
        if (telemetry) {
          setCurrentTelemetry(telemetry);
        }
      });

      // Store listener for cleanup
      cleanupListenersRef.current.push(() => {
        viewer.clock.onTick.removeEventListener(telemetryListener);
      });

      console.log('✅ Flight simulation created successfully');

    } catch (error) {
      console.error('❌ Error creating flight simulation:', error);
    }
  };

  const generateFlightPath = () => {
    if (!csvData || csvData.length === 0) return [];

    const points = [];
    
    if (coordinateSystem === 'gps') {
      csvData.forEach((row, index) => {
        const lat = parseFloat(row[selectedColumns.lat]);
        const lon = parseFloat(row[selectedColumns.lon]);
        const alt = parseFloat(row[selectedColumns.alt]);

        if (!isNaN(lat) && !isNaN(lon) && !isNaN(alt)) {
          points.push({
            latitude: lat,
            longitude: lon,
            altitude: alt,
            heading: parseFloat(row[selectedColumns.heading]) || 0,
            frame: row['Frame'] || index,
            speed: parseFloat(row['SOG']) || 0,
            mode: row['MODE'] || 'N/A',
            temp: parseFloat(row['TEMP']) || 0,
            gpsValid: row['GPSVAL'] || 'N/A'
          });
        }
      });
    } else {
      // Local coordinate conversion
      const centerLat = 28.6139;
      const centerLon = 77.2090;
      
      csvData.forEach((row, index) => {
        const x = parseFloat(row[selectedColumns.x]);
        const y = parseFloat(row[selectedColumns.y]);
        const alt = parseFloat(row[selectedColumns.alt]);

        if (!isNaN(x) && !isNaN(y) && !isNaN(alt)) {
          const lat = centerLat + (y / 111320);
          const lon = centerLon + (x / (111320 * Math.cos(centerLat * Math.PI / 180)));

          points.push({
            latitude: lat,
            longitude: lon,
            altitude: alt,
            heading: parseFloat(row[selectedColumns.heading]) || 0,
            frame: row['Frame'] || index,
            speed: parseFloat(row['SOG']) || 0,
            mode: row['MODE'] || 'N/A',
            temp: parseFloat(row['TEMP']) || 0,
            gpsValid: row['GPSVAL'] || 'N/A'
          });
        }
      });
    }

    return points;
  };

  const handleSimulationToggle = () => {
    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      const newState = !isSimulationRunning;
      setIsSimulationRunning(newState);
      viewerRef.current.clock.shouldAnimate = newState;
      viewerRef.current.clock.multiplier = simulationSpeed;
      console.log(`Simulation ${newState ? 'started' : 'paused'}`);
    }
  };

  const handleSpeedChange = (speed) => {
    setSimulationSpeed(speed);
    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      viewerRef.current.clock.multiplier = speed;
    }
  };

  const resetSimulation = () => {
    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      viewerRef.current.clock.currentTime = viewerRef.current.clock.startTime.clone();
      setCurrentProgress(0);
      setCurrentTelemetry(null);
      setIsSimulationRunning(false);
      viewerRef.current.clock.shouldAnimate = false;
    }
  };

  const handleColumnChange = (axis, value) => {
    setSelectedColumns(prev => ({ ...prev, [axis]: value }));
  };

  if (!csvData || csvData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">🌍</div>
          <h3 className="text-xl text-gray-300 mb-2">No Flight Data Available</h3>
          <p className="text-gray-500">Please upload data in the Plotting tab first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Controls */}
      <div className="bg-gray-800 p-4 border-b border-gray-700 flex-shrink-0">
        <div className="flex flex-wrap items-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-300">Coordinate:</label>
            <select
              value={coordinateSystem}
              onChange={(e) => setCoordinateSystem(e.target.value)}
              className="px-3 py-1 bg-gray-700 text-white rounded border border-gray-600"
            >
              <option value="gps">GPS</option>
              <option value="local">Local</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-300">Speed:</label>
            <select
              value={simulationSpeed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="px-3 py-1 bg-gray-700 text-white rounded border border-gray-600"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={5}>5x</option>
            </select>
          </div>
          
          <button
            onClick={handleSimulationToggle}
            disabled={!viewerReady}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              isSimulationRunning 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            } ${!viewerReady ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSimulationRunning ? '⏸️ Pause' : '▶️ Start'}
          </button>
          
          <button
            onClick={resetSimulation}
            disabled={!viewerReady}
            className={`px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium ${!viewerReady ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            🔄 Reset
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-300">Status:</span>
            <span className={`text-sm font-medium ${viewerReady ? 'text-green-400' : 'text-yellow-400'}`}>
              {viewerReady ? '✅ Ready' : '⏳ Loading...'}
            </span>
            <span className="text-sm text-gray-300">|</span>
            <span className={`text-sm font-medium ${viewerRef.current && !viewerRef.current.isDestroyed() ? 'text-green-400' : 'text-red-400'}`}>
              {viewerRef.current && !viewerRef.current.isDestroyed() ? '🟢 Active' : '🔴 Inactive'}
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm text-gray-300 mb-1">
            <span>Progress: {currentProgress.toFixed(1)}%</span>
            <span>Points: {trajectoryPoints.length}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Cesium Container */}
      <div className="flex-1 relative">
        <div 
          ref={cesiumContainerRef}
          className="absolute inset-0"
          style={{
            width: '100%',
            height: '100%',
            minHeight: '500px',
            backgroundColor: '#0B1426',
            zIndex: 1
          }}
        />
        
        {/* Enhanced Telemetry Overlay */}
        {currentTelemetry && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-90 text-white p-4 rounded-lg z-10 border border-cyan-500">
            <h4 className="text-lg font-bold mb-2 text-cyan-400">🛰️ AIRCRAFT TELEMETRY</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Model Status:</span>
                <span className={modelLoaded ? 'text-green-400' : 'text-yellow-400'}>
                  {modelLoaded ? '✅ plane.glb' : '⚠️ Fallback'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Frame:</span>
                <span className="text-cyan-400">{currentTelemetry.frame}</span>
              </div>
              <div className="flex justify-between">
                <span>Latitude:</span>
                <span className="text-cyan-400">{currentTelemetry.latitude?.toFixed(6)}°</span>
              </div>
              <div className="flex justify-between">
                <span>Longitude:</span>
                <span className="text-cyan-400">{currentTelemetry.longitude?.toFixed(6)}°</span>
              </div>
              <div className="flex justify-between">
                <span>Altitude:</span>
                <span className="text-cyan-400">{currentTelemetry.altitude?.toFixed(1)}m</span>
              </div>
              <div className="flex justify-between">
                <span>Heading:</span>
                <span className="text-cyan-400">{currentTelemetry.heading?.toFixed(1)}°</span>
              </div>
              <div className="flex justify-between">
                <span>Speed:</span>
                <span className="text-cyan-400">{currentTelemetry.speed?.toFixed(1)}m/s</span>
              </div>
              <div className="flex justify-between">
                <span>Mode:</span>
                <span className="text-cyan-400">{currentTelemetry.mode}</span>
              </div>
              <div className="flex justify-between">
                <span>Temperature:</span>
                <span className="text-cyan-400">{currentTelemetry.temp?.toFixed(1)}°C</span>
              </div>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {!viewerReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-white">Loading Cesium Globe...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulationTab;
