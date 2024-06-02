import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeJSScene = ({ parsedData }) => {
  const sceneRef = useRef(null);
  const requestRef = useRef(null);

  useEffect(() => {
    if (!sceneRef.current || !parsedData || parsedData.length === 0) return;

    // Setup Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1); // Set background color to black
    sceneRef.current.appendChild(renderer.domElement);

    // Create a line geometry from parsed data
    const vertices = [];
    parsedData.forEach(dataPoint => {
      const { x, y, z } = dataPoint;
      vertices.push(x, y, z);
    });

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(line);

    // Create a plane that will move along the line
    const planeGeometry = new THREE.PlaneGeometry(0.5, 0.5);
    const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    scene.add(plane);

    // Setup camera position
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);

    // Function to move the plane along the line
    let t = 0;
    const movePlane = () => {
      t += 0.01;
      const pointAIndex = Math.floor(t) * 3;
      const pointBIndex = (Math.ceil(t) * 3) % vertices.length;
      const pointA = new THREE.Vector3(vertices[pointAIndex], vertices[pointAIndex + 1], vertices[pointAIndex + 2]);
      const pointB = new THREE.Vector3(vertices[pointBIndex], vertices[pointBIndex + 1], vertices[pointBIndex + 2]);
      const position = pointA.clone().lerp(pointB, t - Math.floor(t));
      plane.position.copy(position);

      // Adjust the plane's orientation to face the next point
      const direction = new THREE.Vector3().subVectors(pointB, pointA).normalize();
      plane.lookAt(position.clone().add(direction));
    };

    // Animation loop
    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);
      movePlane();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(requestRef.current);
      renderer.dispose();
      sceneRef.current.removeChild(renderer.domElement);
    };
  }, [parsedData]);

  return <div ref={sceneRef} style={{ width: '100vw', height: '100vh' }} />;
};

export default ThreeJSScene;
