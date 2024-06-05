import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const ThreeJSScene = ({ graph = { is3D: false }, csvData }) => {
  const mountRef = useRef(null);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [simulationEnabled, setSimulationEnabled] = useState(false);
  const [selectedXColumn, setSelectedXColumn] = useState('');
  const [selectedYColumn, setSelectedYColumn] = useState('');
  const [selectedZColumn, setSelectedZColumn] = useState('');

  useEffect(() => {
    const mount = mountRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 10, 10);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const points = csvData.map((row) => ({
      x: parseFloat(row[selectedXColumn || graph.selectedXColumn]),
      y: parseFloat(row[selectedYColumn || graph.selectedYColumns[0]]),
      z: graph.is3D ? parseFloat(row[selectedZColumn || graph.selectedZColumn]) : 0,
    }));

    if (points.length === 0) {
      console.error("No valid points found in csvData.");
      return;
    }

    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p.x, p.y, p.z)));

    const pathPoints = curve.getPoints(1000);
    const pathGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
    const pathMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
    const pathLine = new THREE.Line(pathGeometry, pathMaterial);
    scene.add(pathLine);

    const loader = new GLTFLoader();
    loader.load('plane.glb', (gltf) => {
      const plane = gltf.scene.children[0];
      plane.scale.set(0.5, 0.5, 0.5); // Adjust scale as needed
      plane.rotation.x = Math.PI / 4; // Rotate the model to be vertical
      scene.add(plane);

      // Calculate the bounding box of the curve
      const bbox = new THREE.Box3().setFromPoints(pathPoints);
      const center = bbox.getCenter(new THREE.Vector3());

      // Position the camera based on the center of the curve
      camera.position.set(center.x, center.y + 50, center.z + 50);
      camera.lookAt(center);

      let t = 0;

      const animate = () => {
        requestAnimationFrame(animate);

        if (simulationEnabled) {
          const point = curve.getPointAt(t % 1);
          plane.position.set(point.x, point.y, point.z);
          t += 0.001 * simulationSpeed;
        }

        controls.update();
        renderer.render(scene, camera);
      };

      animate();
    });

    const handleResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      mount.removeChild(renderer.domElement);
    };
  }, [csvData, graph, simulationEnabled, simulationSpeed, selectedXColumn, selectedYColumn, selectedZColumn]);

  const handleSimulateNow = () => {
    setSimulationEnabled(true);
  };

  const handleSimulate = () => {
    // Start the simulation with the selected columns
  };

  return (
    <div>
      { !simulationEnabled &&
        <button onClick={handleSimulateNow}>Simulate Now</button>
      }
      {simulationEnabled && (
        <div>
          <label>
            Simulation Speed:
            <select className="text-black "value={simulationSpeed} onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}>
              <option value={0.05}>0.05x</option>
              <option value={0.1}>0.1x</option>
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={5}>5x</option>
              <option value={10}>10x</option>
              <option value={50}>50x</option>
            </select>
          </label>
        </div>
      )}
      <div ref={mountRef} style={{ width: '100%', height: '500px' }} />
      {!simulationEnabled && (
        <div>
          <label>
            X Column:
            <select value={selectedXColumn} onChange={(e) => setSelectedXColumn(e.target.value)}>
              {Object.keys(csvData[0]).map((column) => (
                <option key={column} value={column}>
                  {column}
                </option>
              ))}
            </select>
          </label>
          <label>
            Y Column:
            <select value={selectedYColumn} onChange={(e) => setSelectedYColumn(e.target.value)}>
              {Object.keys(csvData[0]).map((column) => (
                <option key={column} value={column}>
                  {column}
                </option>
              ))}
            </select>
          </label>
          {graph.is3D && (
            <label>
              Z Column:
              <select value={selectedZColumn} onChange={(e) => setSelectedZColumn(e.target.value)}>
                {Object.keys(csvData[0]).map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button onClick={handleSimulate}>Simulate</button>
        </div>
      )}
    </div>
  );
};

export default ThreeJSScene;