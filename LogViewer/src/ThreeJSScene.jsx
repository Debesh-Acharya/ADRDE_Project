import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const ThreeJSScene = ({ graph, csvData }) => {
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

    // Create a path from the data points
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p.x, p.y, p.z)));

    // Draw path
    const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
    const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(1000));
    const line = new THREE.Line(geometry, material);
    scene.add(line);

    // Create a sphere that will travel along the path
    const sphereGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);

    camera.position.set(0, 10, 10);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    let t = 0;

    const animate = () => {
      requestAnimationFrame(animate);

      // Update the position of the sphere along the path
      const point = curve.getPointAt(t % 1);
      sphere.position.set(point.x, point.y, point.z);
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
