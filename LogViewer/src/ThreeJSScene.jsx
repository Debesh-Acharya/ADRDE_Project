import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const ThreeJSScene = ({ graph = { is3D: false }, csvData }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // Adding orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Setting up the light
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 10, 10);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(ambientLight);

    // Extracting data points from the csvData
    const points = csvData.map((row) => ({
      x: parseFloat(row[graph.selectedXColumn]),
      y: parseFloat(row[graph.selectedYColumns[0]]),
      z: graph.is3D ? parseFloat(row[graph.selectedZColumn]) : 0,
    }));

    if (points.length === 0) {
      console.error("No valid points found in csvData.");
      return;
    }

    // Create a path from the data points using CatmullRomCurve3
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p.x, p.y, p.z)));

    // Draw path
    const pathPoints = curve.getPoints(1000);
    const pathGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
    const pathMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
    const pathLine = new THREE.Line(pathGeometry, pathMaterial);
    scene.add(pathLine);

    // Create an object (cube) that will travel along the path
    const cubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    scene.add(cube);

    camera.position.set(0, 50, 50); // Adjusted camera position for better visibility
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    let t = 0;

    const animate = () => {
      requestAnimationFrame(animate);

      // Update the position of the cube along the path
      const point = curve.getPointAt(t % 1);
      cube.position.set(point.x, point.y, point.z);
      t += 0.001; // Adjust speed as needed

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

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
  }, [csvData, graph]);

  return <div ref={mountRef} style={{ width: '100%', height: '500px' }} />;
};

export default ThreeJSScene;
