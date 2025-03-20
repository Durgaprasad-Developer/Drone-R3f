import { useRef, useEffect } from 'react';
import React from 'react';
import { useFrame } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import * as THREE from 'three';
import { useTextures } from './Textures';

export default function Model({ url, materialUrl, position, isStarted, onPartsFound }) {
  const groupRef = useRef();
  const propellerRefs = useRef({});
  const { textures, texturesLoaded } = useTextures();
  const materialsRef = useRef(null);
  const objRef = useRef(null);

  useEffect(() => {
    if (!materialUrl) return;

    const mtlLoader = new MTLLoader();
    mtlLoader.load(
      materialUrl,
      (loadedMaterials) => {
        loadedMaterials.preload();
        materialsRef.current = loadedMaterials;
      },
      undefined,
      (error) => console.warn('Failed to load material:', error)
    );
  }, [materialUrl]);

  useEffect(() => {
    if (!texturesLoaded) return;

    const objLoader = new OBJLoader();
    if (materialsRef.current) {
      objLoader.setMaterials(materialsRef.current);
    }

    objLoader.load(
      url,
      (loadedObj) => {
        objRef.current = loadedObj;
        applyTextures(loadedObj);
      },
      undefined,
      (error) => console.error('Failed to load model:', error)
    );
  }, [url, texturesLoaded]);

  function applyTextures(obj) {
    if (!obj || !groupRef.current) return;

    groupRef.current.clear();
    groupRef.current.add(obj);

    const foundParts = [];
    propellerRefs.current = {};

    obj.traverse((child) => {
      if (child.isMesh) {
        foundParts.push(child.name || `unnamed_part_${foundParts.length}`);
        
        if (child.name.includes('GEO_Propeller')) {
          // Center the geometry and adjust position
          const geometry = child.geometry;
          geometry.computeBoundingBox(); // Ensure bounding box is calculated
          const originalCenter = new THREE.Vector3();
          geometry.boundingBox.getCenter(originalCenter);
          geometry.center(); // Center geometry at (0,0,0)
          child.position.add(originalCenter); // Maintain original position
    
          propellerRefs.current[child.name] = child;
          // ... rest of your propeller setup ...
        }

        const isFrame = /frame|body|fuselage/i.test(child.name);
        child.material = new THREE.MeshStandardMaterial({
          map: isFrame ? textures.frame.diffuse : textures.parts.diffuse,
          normalMap: isFrame ? textures.frame.normal : textures.parts.normal,
          metalnessMap: isFrame ? textures.frame.metalness : textures.parts.metalness,
          roughnessMap: isFrame ? textures.frame.roughness : textures.parts.roughness,
          displacementMap: isFrame ? textures.frame.height : textures.parts.height,
          displacementScale: 0.02,
          metalness: isFrame ? 0 : 1,
          roughness: isFrame ? 0 : 1,
          envMapIntensity: 1.0,
          color: 0xffffff
        });

        child.material.needsUpdate = true;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    if (onPartsFound) {
      onPartsFound(foundParts);
    }
  }

  useFrame((_, delta) => {
    if (isStarted) {
      for (let i = 1; i <= 4; i++) {
        const propName = `GEO_Propeller_0${i}`;
        const propeller = propellerRefs.current[propName];
        if (propeller) {
          const direction = i % 2 === 0 ? 1 : -1;
          propeller.rotateY(delta * 40);
        }
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
    </group>
  );
}
