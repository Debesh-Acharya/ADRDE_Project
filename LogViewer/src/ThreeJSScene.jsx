import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const ThreeJSScene = ({ graph = { is3D: false }, csvData = [] }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationIdRef = useRef(null);
  const planeRef = useRef(null);
  const curveRef = useRef(null);
  
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [simulationEnabled, setSimulationEnabled] = useState(false);
  const [selectedXColumn, setSelectedXColumn] = useState('');
  const [selectedYColumn, setSelectedYColumn] = useState('');
  const [selectedZColumn, setSelectedZColumn] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get available columns
  const columns = csvData.length > 0 ? Object.keys(csvData[0]) : [];

  // Set default columns on data load
  useEffect(() => {
    if (columns.length > 0) {
      setSelectedXColumn(prev => prev || columns[0]);
      setSelectedYColumn(prev => prev || columns[1] || columns[0]);
      setSelectedZColumn(prev => prev || columns[2] || columns[0]);
    }
  }, [columns]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current || csvData.length === 0) return;

    const mount = mountRef.current;
    
    // Clear any existing content
    while (mount.firstChild) {
      mount.removeChild(mount.firstChild);
    }

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75, 
      mount.clientWidth / mount.clientHeight, 
      0.1, 
      1000
    );

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lighting
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    // Process data points
    const xCol = selectedXColumn || graph.selectedXColumn || columns[0];
    const yCol = selectedYColumn || graph.selectedYColumns?.[0] || columns[1] || columns[0];
    const zCol = graph.is3D ? (selectedZColumn || graph.selectedZColumn || columns[2]) : null;

    const points = csvData.map((row, index) => {
      const x = parseFloat(row[xCol]) || 0;
      const y = parseFloat(row[yCol]) || 0;
      const z = graph.is3D ? (parseFloat(row[zCol]) || 0) : 0;
      return new THREE.Vector3(x, y, z);
    }).filter(point => !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z));

    if (points.length === 0) {
      setError("No valid data points found");
      return;
    }

    // Create curve
    const curve = new THREE.CatmullRomCurve3(points);
    curveRef.current = curve;

    // Create path visualization
    const pathPoints = curve.getPoints(1000);
    const pathGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
    const pathMaterial = new THREE.LineBasicMaterial({ 
      color: 0x00ff80,
      linewidth: 3
    });
    const pathLine = new THREE.Line(pathGeometry, pathMaterial);
    scene.add(pathLine);

    // Add data points as small spheres
    points.forEach((point, index) => {
      const sphereGeometry = new THREE.SphereGeometry(0.2, 8, 8);
      const sphereMaterial = new THREE.MeshBasicMaterial({ 
        color: index === 0 ? 0xff0000 : index === points.length - 1 ? 0x0000ff : 0xffffff
      });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.copy(point);
      scene.add(sphere);
    });

    // Calculate scene bounds and position camera
    const box = new THREE.Box3().setFromPoints(pathPoints);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 2;

    camera.position.set(center.x, center.y + cameraZ * 0.5, center.z + cameraZ);
    camera.lookAt(center);
    controls.target.copy(center);

    // Load 3D model
    setIsLoading(true);
    const loader = new GLTFLoader();
    loader.load(
      'plane.glb',
      (gltf) => {
        const plane = gltf.scene;
        plane.scale.set(maxDim * 0.01, maxDim * 0.01, maxDim * 0.01);
        plane.position.copy(points[0]);
        plane.castShadow = true;
        plane.receiveShadow = true;
        scene.add(plane);
        planeRef.current = plane;
        setIsLoading(false);
        setError(null);
      },
      (progress) => {
        // Loading progress
      },
      (error) => {
        console.error('Model loading error:', error);
        setError('Failed to load 3D model');
        setIsLoading(false);
      }
    );

    // Animation loop
    let t = 0;
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (simulationEnabled && planeRef.current && curveRef.current) {
        const point = curveRef.current.getPointAt(t % 1);
        planeRef.current.position.copy(point);
        
        // Orient plane along curve
        const tangent = curveRef.current.getTangentAt(t % 1);
        planeRef.current.lookAt(
          point.clone().add(tangent)
        );
        
        t += 0.001 * simulationSpeed;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!mount) return;
      
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      window.removeEventListener('resize', handleResize);
      
      if (mount && renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      
      // Dispose of Three.js objects
      pathGeometry.dispose();
      pathMaterial.dispose();
      renderer.dispose();
      controls.dispose();
    };
  }, [csvData, graph, selectedXColumn, selectedYColumn, selectedZColumn, simulationEnabled, simulationSpeed]);

  const handleSimulateNow = useCallback(() => {
    setSimulationEnabled(true);
  }, []);

  const handleStopSimulation = useCallback(() => {
    setSimulationEnabled(false);
  }, []);

  const handleSimulate = useCallback(() => {
    if (selectedXColumn && selectedYColumn && (selectedZColumn || !graph.is3D)) {
      setSimulationEnabled(true);
    } else {
      setError('Please select all required columns');
    }
  }, [selectedXColumn, selectedYColumn, selectedZColumn, graph.is3D]);

  if (csvData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No data available for visualization</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="mb-4 p-4 bg-gray-800 rounded-lg">
        <div className="flex flex-wrap gap-4 items-center">
          {!simulationEnabled ? (
            <>
              <button 
                onClick={handleSimulateNow}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isLoading ? 'Loading...' : 'Simulate Now'}
              </button>
              
              <div className="flex gap-4">
                <label className="text-white">
                  X Column:
                  <select 
                    value={selectedXColumn} 
                    onChange={(e) => setSelectedXColumn(e.target.value)}
                    className="ml-2 p-1 bg-gray-700 text-white rounded"
                  >
                    {columns.map((column) => (
                      <option key={column} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-white">
                  Y Column:
                  <select 
                    value={selectedYColumn} 
                    onChange={(e) => setSelectedYColumn(e.target.value)}
                    className="ml-2 p-1 bg-gray-700 text-white rounded"
                  >
                    {columns.map((column) => (
                      <option key={column} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>
                </label>

                {graph.is3D && (
                  <label className="text-white">
                    Z Column:
                    <select 
                      value={selectedZColumn} 
                      onChange={(e) => setSelectedZColumn(e.target.value)}
                      className="ml-2 p-1 bg-gray-700 text-white rounded"
                    >
                      {columns.map((column) => (
                        <option key={column} value={column}>
                          {column}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            </>
          ) : (
            <>
              <button 
                onClick={handleStopSimulation}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Stop Simulation
              </button>
              
              <label className="text-white">
                Speed:
                <select 
                  value={simulationSpeed} 
                  onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}
                  className="ml-2 p-1 bg-gray-700 text-white rounded"
                >
                  <option value={0.05}>0.05x</option>
                  <option value={0.1}>0.1x</option>
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={2}>2x</option>
                  <option value={5}>5x</option>
                  <option value={10}>10x</option>
                </select>
              </label>
            </>
          )}
        </div>
        
        {error && (
          <div className="mt-2 p-2 bg-red-600 text-white rounded">
            {error}
          </div>
        )}
      </div>

      {/* Three.js Scene */}
      <div 
        ref={mountRef} 
        className="w-full h-96 bg-gray-900 rounded-lg border border-gray-700"
        style={{ minHeight: '500px' }}
      />
      
      {/* Info Panel */}
      <div className="mt-4 p-4 bg-gray-800 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-300">
          <div>
            <strong>Data Points:</strong> {csvData.length}
          </div>
          <div>
            <strong>X Column:</strong> {selectedXColumn || 'Not selected'}
          </div>
          <div>
            <strong>Y Column:</strong> {selectedYColumn || 'Not selected'}
          </div>
          {graph.is3D && (
            <div>
              <strong>Z Column:</strong> {selectedZColumn || 'Not selected'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThreeJSScene;
