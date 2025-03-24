import { useRef, useEffect, useState } from 'react';
import React from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import * as THREE from 'three';
import { useTextures } from './Textures';
import { DragControls } from 'three/examples/jsm/controls/DragControls';
import { OrbitControls } from '@react-three/drei';
import { useCameraControls } from '../../context/context';

export default function Model({ url, materialUrl, position, isStarted, onPartsFound, onPartSelected }) {
  const groupRef = useRef();
  const propellerRefs = useRef({});
  const { textures, texturesLoaded } = useTextures();
  const controlsRef = useCameraControls();
  const materialsRef = useRef(null);
  const objRef = useRef(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const dragControlsRef = useRef(null);
  const { camera, gl } = useThree();
  const meshesRef = useRef([]);

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


  useEffect(() => {
    if (meshesRef.current.length > 0 && camera && gl) {
      // Create drag controls for all meshes
      dragControlsRef.current = new DragControls(meshesRef.current, camera, gl.domElement);

      
      // Set up event handlers
      dragControlsRef.current.addEventListener('dragstart', (event) => {
        setSelectedPart(event.object);
        if (onPartSelected) onPartSelected(event.object.name);
      });
      

      

      return () => {
        dragControlsRef.current.dispose();
      };
    }
  }, [camera, gl, meshesRef.current.length, onPartSelected]);

  useEffect(()=>{
    console.log("current ref is " , controlsRef)
  },[controlsRef, selectedPart])


  useEffect(()=>{
    if(selectedPart != null){
      console.log(controlsRef)
      controlsRef.current.enabled = false
    }else{
      controlsRef.current.enabled = true
    }
    console.log("selectPart", selectedPart)
  },[selectedPart])

  function applyTextures(obj) {
    if (!obj || !groupRef.current) return;

    groupRef.current.clear();
    groupRef.current.add(obj);

    const foundParts = [];
    propellerRefs.current = {};
    meshesRef.current = [];

    obj.traverse((child) => {
      if (child.isMesh) {
        foundParts.push(child.name || `unnamed_part_${foundParts.length}`);
        meshesRef.current.push(child); // Add all meshes to the meshes array for drag controls
        
        if (child.name.includes('GEO_Propeller')) {
          // Center the geometry and adjust position
          const geometry = child.geometry;
          geometry.computeBoundingBox(); // Ensure bounding box is calculated
          const originalCenter = new THREE.Vector3();
          geometry.boundingBox.getCenter(originalCenter);
          geometry.center(); // Center geometry at (0,0,0)
          child.position.add(originalCenter); // Maintain original position
    
          propellerRefs.current[child.name] = child;
        }

        const isFrame = /frame|body|fuselage/i.test(child.name);
        
        // Create new material
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

        // Set up click interaction
        child.userData.originalColor = child.material.color.clone();
        

        child.onClick = () => {
          selectPart(child);
        };

        child.material.needsUpdate = true;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    if (onPartsFound) {
      
      onPartsFound(foundParts);
    }
  }
  
  function selectPart(part) {
    // Reset color of previously selected part
    if (selectedPart && selectedPart !== part) {
      selectedPart.material.color.copy(selectedPart.userData.originalColor);
      selectedPart.material.emissive.set(0x000000);
    }
    
    // Set the new selected part
    setSelectedPart(part);
    
    // Highlight selected part
    if (part) {
      part.material.emissive.set(0x555555);
      part.material.color.set(0x0000ff);
      
      if (onPartSelected) {
        onPartSelected(part.name);
      }
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

  // Handle mesh clicking
  useEffect(() => {
    const handlePointerDown = (event) => {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      
      
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      
      raycaster.setFromCamera(mouse, camera);
      

      const intersects = raycaster.intersectObjects(meshesRef.current, true);
      
      if (intersects.length > 0) {
        // Handle the first intersected object
        selectPart(intersects[0].object);
      } else {
        // Deselect if clicked elsewhere
        if (selectedPart) {
          selectedPart.material.color.copy(selectedPart.userData.originalColor);
          selectedPart.material.emissive.set(0x000000);
          setSelectedPart(null);
          if (onPartSelected) onPartSelected(null);
        }
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [camera, selectedPart, onPartSelected]);

  return (
    <group ref={groupRef} position={position}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
     
    </group>
  );
}

