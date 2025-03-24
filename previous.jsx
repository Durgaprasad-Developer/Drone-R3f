Drone v1  import { createRoot } from 'react-dom/client'
import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { OrbitControls, Environment } from '@react-three/drei'
import * as THREE from 'three'
import './index.css'





function Model({ url, materialUrl, position, rotationPart, onPartsFound, isStarted }) {
  const groupRef = useRef()
  const [partFound, setPartFound] = useState(false)
  const [materialLoaded, setMaterialLoaded] = useState(false)
  const [materials, setMaterials] = useState(null)
  const [obj, setObj] = useState(null)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [texturesLoaded, setTexturesLoaded] = useState(false)
  const propellerRefs = useRef({});

  const textureLoader = new THREE.TextureLoader();

  const texturePaths = {
    parts: {
      diffuse: 'src/assets/uploads_files_3653841_Textures (extract.me)/Textures_Parts/Diffuse_Part.jpg',
      height: 'src/assets/uploads_files_3653841_Textures (extract.me)/Textures_Parts/Height_Part.png',
      metalness: 'src/assets/uploads_files_3653841_Textures (extract.me)/Textures_Parts/Metalness _Part.png',
      normal: 'src/assets/uploads_files_3653841_Textures (extract.me)/Textures_Parts/Normal_Part.png',
      roughness: 'src/assets/uploads_files_3653841_Textures (extract.me)/Textures_Parts/Roughness_Part.png',
    },
    frame: {
      diffuse: 'src/assets/uploads_files_3653841_Textures (extract.me)/Textures_Quadcopter frame/Diffuse_Quadcopter frame.png',
      height: 'src/assets/uploads_files_3653841_Textures (extract.me)/Textures_Quadcopter frame/Height_Quadcopter frame.png',
      metalness: 'src/assets/uploads_files_3653841_Textures (extract.me)/Textures_Quadcopter frame/Metalness_Quadcopter frame.png',
      normal: 'src/assets/uploads_files_3653841_Textures (extract.me)/Textures_Quadcopter frame/Normal_Quadcopter frame.png',
      roughness: 'src/assets/uploads_files_3653841_Textures (extract.me)/Textures_Quadcopter frame/Roughness_Quadcopter frame.png',
    }
  };

  const [textures, setTextures] = useState({
    parts: {},
    frame: {}
  });

  useEffect(() => {
    const loadedTextures = {
      parts: {},
      frame: {}
    };

    let loadCount = 0;
    const totalTextures = Object.keys(texturePaths.parts).length + Object.keys(texturePaths.frame).length;

    // Load parts textures
    Object.entries(texturePaths.parts).forEach(([type, path]) => {
      textureLoader.load(
        path,
        (texture) => {
          loadedTextures.parts[type] = texture;

          // Apply specific settings based on texture type
          if (type === 'normal') {
            texture.encoding = THREE.LinearEncoding;
          } else if (type === 'diffuse') {
            texture.encoding = THREE.sRGBEncoding;
          }

          loadCount++;
          if (loadCount === totalTextures) {
            setTextures(loadedTextures);
            setTexturesLoaded(true);
          }
        },
        undefined,
        (error) => {
          console.error(`Failed to load texture: ${path}`, error);
          loadCount++;
          if (loadCount === totalTextures) {
            setTexturesLoaded(true);
          }
        }
      );
    });

    // Load frame textures
    Object.entries(texturePaths.frame).forEach(([type, path]) => {
      textureLoader.load(
        path,
        (texture) => {
          loadedTextures.frame[type] = texture;

          if (type === 'normal') {
            texture.encoding = THREE.LinearEncoding;
          } else if (type === 'diffuse') {
            texture.encoding = THREE.sRGBEncoding;
          }

          loadCount++;
          if (loadCount === totalTextures) {
            setTextures(loadedTextures);
            setTexturesLoaded(true);
          }
        },
        undefined,
        (error) => {
          console.error(`Failed to load texture: ${path}`, error);
          loadCount++;
          if (loadCount === totalTextures) {
            setTexturesLoaded(true);
          }
        }
      );
    });
  }, []);

  // Load MTL materials
  useEffect(() => {
    if (!materialUrl) {
      setMaterialLoaded(true);
      return;
    }

    const mtlLoader = new MTLLoader();
    mtlLoader.load(
      materialUrl,
      (loadedMaterials) => {
        loadedMaterials.preload();
        setMaterials(loadedMaterials);
        setMaterialLoaded(true);
      },
      undefined,
      (error) => {
        console.warn("Failed to load material:", error);
        setMaterialLoaded(true);
      }
    );
  }, [materialUrl]);

  // Load OBJ model
  useEffect(() => {
    if (!materialLoaded) return;

    const objLoader = new OBJLoader();
    if (materials) {
      objLoader.setMaterials(materials);
    }

    objLoader.load(
      url,
      (loadedObj) => {
        setObj(loadedObj);
        setModelLoaded(true);
      },
      undefined,
      (error) => {
        console.error("Failed to load model:", error);
        setModelLoaded(true);
      }
    );
  }, [url, materials, materialLoaded]);

  // Apply textures to the model
  useEffect(() => {
    if (!obj || !groupRef.current || !texturesLoaded) return;

    // Clear previous children
    while (groupRef.current.children.length) {
      groupRef.current.remove(groupRef.current.children[0]);
    }
    groupRef.current.add(obj);

    const foundParts = [];
    propellerRefs.current = {};

    // Create materials once and reuse them
    const frameMaterial = new THREE.MeshStandardMaterial({
      map: textures.frame.diffuse,
      normalMap: textures.frame.normal,
      metalnessMap: textures.frame.metalness,
      roughnessMap: textures.frame.roughness,
      displacementMap: textures.frame.height,
      displacementScale: 0.02,
      metalness: 0,
      roughness: 0,
      envMapIntensity: 1.0,
      color: 0xffffff
    });

    const partsMaterial = new THREE.MeshStandardMaterial({
      map: textures.parts.diffuse,
      normalMap: textures.parts.normal,
      metalnessMap: textures.parts.metalness,
      roughnessMap: textures.parts.roughness,
      displacementMap: textures.parts.height,
      displacementScale: 0.02,
      metalness: 1.0,
      roughness: 1.0,
      envMapIntensity: 1.0,
      color: 0xffffff
    });

    // Apply materials to meshes
    obj.traverse((child) => {
        
      if (child.isMesh) {
        console.log('Part name:', child.name);
        foundParts.push(child.name || `unnamed_part_${foundParts.length}`);

        // Store references to propellers
        if (child.name && child.name.includes('GEO_Propeller')) {
          propellerRefs.current[child.name] = child;
        }


        child.geometry.computeBoundingBox();
        const center = new THREE.Vector3();
        child.geometry.boundingBox.getCenter(center);

        // Recenter geometry
        child.geometry.translate(-center.x, -center.y, -center.z);
        child.position.set(center.x, center.y, center.z);


        if (!child.geometry.attributes.uv) {
          console.log(`Generating UVs for ${child.name}`);
          child.geometry = new THREE.SphereGeometry(1, 32, 32);
        }

        const isFrame = child.name.toLowerCase().includes('frame') ||
          child.name.toLowerCase().includes('body') ||
          child.name.toLowerCase().includes('fuselage');

        // Apply material
        child.material = isFrame ? frameMaterial.clone() : partsMaterial.clone();

        // Ensure the material is configured correctly
        child.material.needsUpdate = true;

        // Add additional property to ensure material is used
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    if (onPartsFound) {
      onPartsFound(foundParts);
    }
  }, [obj, texturesLoaded, textures]);

  // Rotate propellers
  useFrame((state, delta) => {
    if (obj && isStarted && propellerRefs.current) {
      for (let i = 1; i <= 4; i++) {
        const propName = `GEO_Propeller_0${i}`;
        const propeller = propellerRefs.current[propName];
        if (propeller) {
          const direction = i % 2 === 0 ? 1 : -1;
          propeller.rotateY(delta * 30);
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

const partDescriptions = {
  'GEO_Propeller_01': {
    title: 'Front Left Propeller',
    description: 'Generates lift and propulsion for the front left quadrant of the drone. Rotates counter-clockwise to balance the torque from other propellers.',
    specs: ['Diameter: 8 inches', 'Material: Carbon fiber composite', 'Max RPM: 15,000']
  },
  'GEO_Propeller_02': {
    title: 'Front Right Propeller',
    description: 'Generates lift and propulsion for the front right quadrant of the drone. Rotates clockwise to balance the torque from other propellers.',
    specs: ['Diameter: 8 inches', 'Material: Carbon fiber composite', 'Max RPM: 15,000']
  },
  'GEO_Propeller_03': {
    title: 'Rear Left Propeller',
    description: 'Generates lift and propulsion for the rear left quadrant of the drone. Rotates clockwise to balance the torque from other propellers.',
    specs: ['Diameter: 8 inches', 'Material: Carbon fiber composite', 'Max RPM: 15,000']
  },
  'GEO_Propeller_04': {
    title: 'Rear Right Propeller',
    description: 'Generates lift and propulsion for the rear right quadrant of the drone. Rotates counter-clockwise to balance the torque from other propellers.',
    specs: ['Diameter: 8 inches', 'Material: Carbon fiber composite', 'Max RPM: 15,000']
  },
  'GEO_Arm_01': {
    title: 'Drone Arm',
    description: 'Structural component that extends from the central body to support the motors and propellers. Designed for optimal weight distribution and stability during flight.',
    specs: ['Material: Carbon fiber', 'Length: 20cm', 'Weight: 45g']
  },
  'GEO_Battery': {
    title: 'Battery Pack',
    description: 'High-capacity lithium polymer battery that powers all drone systems. Positioned centrally for balanced weight distribution.',
    specs: ['Capacity: 5200mAh', 'Voltage: 11.1V (3S)', 'Max Discharge: 25C', 'Flight Time: ~25 minutes']
  },
  'GEO_Body': {
    title: 'Main Frame',
    description: 'Central chassis that houses the flight controller, battery, and connects all components. Designed for structural integrity while minimizing weight.',
    specs: ['Material: Carbon fiber composite', 'Weight: 120g', 'Dimensions: 30cm x 30cm']
  },
  'GEO_Camera': {
    title: 'Camera Module',
    description: 'High-definition camera system for aerial photography and videography. Features electronic stabilization for smooth footage.',
    specs: ['Resolution: 4K/60fps', '120° Field of View', '3-axis electronic stabilization', 'Low-light enhancement']
  },
  'GEO_Motor': {
    title: 'Brushless Motor',
    description: 'High-efficiency brushless DC motor that drives the propellers. Designed for maximum power output with minimal heat generation.',
    specs: ['Type: 2306 Brushless', 'KV Rating: 2450KV', 'Max Power: 220W', 'Max Thrust: 950g']
  },
  'entire_model': {
    title: 'Quadcopter Drone',
    description: 'A versatile unmanned aerial vehicle designed for photography, surveying, and recreational flight. Features a lightweight frame, high-efficiency motors, and advanced stabilization systems.',
    specs: ['Flight Time: ~25 minutes', 'Max Speed: 60 km/h', 'Range: 5 km', 'Weight: 1500g']
  }
};

function getPartDescription(partName) {
  // Check if we have a specific description for this part
  if (partDescriptions[partName]) {
    return partDescriptions[partName];
  }

  // Generate a generic description based on part name
  let title = partName.replace('GEO_', '').replace(/_/g, ' ');
  title = title.charAt(0).toUpperCase() + title.slice(1);

  return {
    title: title,
    description: `This is a ${title.toLowerCase()} component of the drone. It contributes to the overall structure and functionality of the aircraft.`,
    specs: ['Material: Composite', 'Weight: Variable']
  };
}
function LoadingScreen({ progress }) {
  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black flex flex-col justify-center items-center z-50 codeB">
      <div className="mb-6">
        <h1 className="text-white text-3xl codeB">
          Drone 3D Explorer
        </h1>
      </div>

      <div style={{ width: '300px', height: '6px', backgroundColor: '#333', borderRadius: '3px' }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          backgroundColor: '#4af',
          borderRadius: '3px',
          transition: 'width 0.3s ease-in-out'
        }} />
      </div>

      <p className="text-gray-300 mt-2 codeB">
        Loading assets: {progress.toFixed(0)}%
      </p>

      <div className="absolute bottom-5 text-gray-400 codeB text-xs">
        <p>Loading model and textures...</p>
      </div>
    </div>
  );
}

function ErrorScreen({ error, onRetry }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.9)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: '#222',
        padding: '30px',
        borderRadius: '10px',
        border: '1px solid #444',
        maxWidth: '500px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#ff4d4d', marginBottom: '20px' }}>Error Loading Model</h2>
        <p style={{ color: '#ddd', marginBottom: '20px' }}>{error}</p>
        <button
          onClick={onRetry}
          style={{
            backgroundColor: '#4af',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function CameraController({ targetPart, isStarted }) {
  const { camera, scene } = useThree();
  const controlsRef = useRef();
  const targetPosition = useRef(new THREE.Vector3());
  const currentCenter = useRef(new THREE.Vector3());
  const animationStage = useRef(0); // 0: idle, 1: moving to origin, 2: moving to target
  const originalPosition = new THREE.Vector3(0, 0, 200);
  const originalLookAt = new THREE.Vector3(0, 0, 0);
  

  const prevTargetPart = useRef(null);
  
  useFrame(() => {
    if (animationStage.current === 1) {
      // Stage 1: Moving back to original position
      camera.position.lerp(originalPosition, 0.05);
      
      // Gradually look back at center
      currentCenter.current.lerp(originalLookAt, 0.08);
      camera.lookAt(currentCenter.current);
      
      // When we get close enough to original position, move to stage 2
      if (camera.position.distanceTo(originalPosition) < 0.5) {
        animationStage.current = 2;
      }
    } 
    else if (animationStage.current === 2) {
      // Stage 2: Moving to the target position
      camera.position.lerp(targetPosition.current, 0.08);
      
      // Gradually look at target center
      camera.lookAt(currentCenter.current);
      
      // When we get close enough to the target position, stop animating
      if (camera.position.distanceTo(targetPosition.current) < 0.5) {
        animationStage.current = 0; // Back to idle
        
        // Re-enable controls
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
          controlsRef.current.target.copy(currentCenter.current);
        }
      }
    }
  });
  
  // Function to focus camera on a part
  useEffect(() => {
    // Skip if no target part or it's the same as before
    if (!targetPart || targetPart === prevTargetPart.current) return;
    
    // Update previous target reference
    prevTargetPart.current = targetPart;
    
    // Disable controls during transition
    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }
    
    if (targetPart === 'entire_model') {
      // For entire model, just go to original position
      targetPosition.current = originalPosition.clone();
      currentCenter.current = originalLookAt.clone();
      animationStage.current = 1; // Skip to stage 2 directly
      return;
    }
    
    // Find the target object in the scene
    let targetObject = null;
    scene.traverse((child) => {
      if (child.name === targetPart) {
        targetObject = child;
      }
    });
    
    if (!targetObject) {
 
      targetPosition.current = originalPosition.clone();
      currentCenter.current = originalLookAt.clone();
      animationStage.current = 1;
      return;
    }
    
    const bbox = new THREE.Box3().setFromObject(targetObject);
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    
    const size = bbox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const distance = Math.max((maxDim * 1.5) / Math.tan(fov / 2), 20);
    
    const direction = new THREE.Vector3(1, 0.5, 1).normalize();
    targetPosition.current = center.clone().add(direction.multiplyScalar(distance));
    currentCenter.current = center.clone();
    
    animationStage.current = 2;
    
    return () => {
      if (controlsRef.current && animationStage.current !== 0) {
        controlsRef.current.enabled = true;
      }
    };
  }, [targetPart, scene, camera]);
  

  useEffect(() => {
    if (isStarted) {
      camera.position.set(originalPosition.x, originalPosition.y, originalPosition.z);
      camera.lookAt(originalLookAt);
      if (controlsRef.current) {
        controlsRef.current.target.copy(originalLookAt);
      }
    }
  }, [isStarted, camera]);
  
  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      makeDefault
      addEventListener={undefined}
      removeEventListener={undefined}
      options={{ passive: true }}
    />
  );
}

function App() {
  const [parts, setParts] = useState([]);
  const [selectedPart, setSelectedPart] = useState('entire_model');
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const modelRef = useRef();
  
  useEffect(() => {
    if (modelLoaded) {
      setLoadingProgress(100);
      return;
    }

    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        const newProgress = prev + (Math.random() * 20);
        return newProgress < 90 ? newProgress : 100;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [modelLoaded]);

  const handlePartsFound = (foundParts) => {
    setParts(foundParts);
    setModelLoaded(true);

    if (foundParts.length > 0 && !foundParts.includes(selectedPart) && selectedPart !== 'entire_model') {
      setSelectedPart(selectedPart);
    }
  };

  const handleStart = () => {
    setIsStarted(true);
  };

  const handleStop = () => {
    setIsStarted(false);
  };

  const handlePartSelect = (part) => {
    setSelectedPart(part);
  };

  useEffect(() => {
    const errorHandler = (event) => {
      console.error("Application error:", event.error);
      setError(event.error.message || "An unknown error occurred");
      event.preventDefault();
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (!modelLoaded && loadingProgress < 100) {
    return <LoadingScreen progress={loadingProgress} />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {error ? (
        <ErrorScreen
          error={error}
          onRetry={() => window.location.reload()}
        />
      ) : (
        <>
          <Canvas
            camera={{ position: [0, 0, 200], fov: 50 }}
            gl={{ antialias: true, outputEncoding: THREE.sRGBEncoding }}
          >
            <gridHelper args={[1000,100, 'white', 'gray']} />
            <Environment files="src/assets/lab.exr" background />
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
            <pointLight position={[-10, -10, -10]} intensity={0.8} />
            <Model
              url="src/assets/Drone_Ob.obj"
              materialUrl="src/assets/Drone_Ob.mtl"
              position={[0, 0, 0]}
              rotationPart={selectedPart}
              onPartsFound={handlePartsFound}
              isStarted={isStarted}
              ref={modelRef}
            />
            
            <CameraController 
              targetPart={selectedPart}
              modelRef={modelRef}
              isStarted={isStarted}
            />
          </Canvas>

          <div style={{
            position: 'absolute',
            top: 20,
            left: 20,
            backgroundColor: 'rgba(20, 20, 20, 0.4)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            padding: 20,
            borderRadius: 10,
            maxHeight: '80vh',
            overflowY: 'auto',
            zIndex: 100,
            maxWidth: '300px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h2 style={{
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
              paddingBottom: '10px',
              marginTop: 0,
              color: '#4af'
            }}>
              Drone Explorer
            </h2>

            {!isStarted ? (
              <button
                className=''
                onClick={handleStart}
                style={{
                  backgroundColor: '#4af',
                  color: 'white',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  marginBottom: 15,
                  fontWeight: 'bold',
                  width: '100%',
                  transition: 'background-color 0.2s',
                  boxShadow: '0 2px 10px rgba(74, 170, 255, 0.3)'
                }}
              >
                Start Animation
              </button>
            ) : (
              <button
                onClick={handleStop}
                style={{
                  backgroundColor: '#ff4d4d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  marginBottom: 15,
                  fontWeight: 'bold',
                  width: '100%',
                  transition: 'background-color 0.2s',
                  boxShadow: '0 2px 10px rgba(255, 77, 77, 0.3)'
                }}
              >
                Stop Animation
              </button>
            )}

            <h3 style={{ marginBottom: '10px', color: '#ddd' }}>Select Component:</h3>
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              padding: '5px',
              borderRadius: '5px',
              backgroundColor: 'rgba(0, 0, 0, 0.2)'
            }}>
              <div
                key="entire_model"
                onClick={() => handlePartSelect('entire_model')}
                style={{
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  marginBottom: '4px',
                  backgroundColor: selectedPart === 'entire_model' ? 'rgba(74, 170, 255, 0.2)' : 'transparent',
                  color: selectedPart === 'entire_model' ? '#4af' : '#ddd',
                  borderLeft: selectedPart === 'entire_model' ? '3px solid #4af' : '3px solid transparent',
                  transition: 'all 0.2s'
                }}>
                Entire Drone
              </div>

              {parts
                .sort((a, b) => a.localeCompare(b))
                .filter(part => part !== 'undefined' && part.trim() !== '')
                .map((part, index) => (
                  <div
                    key={index}
                    onClick={() => handlePartSelect(part)}
                    style={{
                      cursor: 'pointer',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      backgroundColor: selectedPart === part ? 'rgba(74, 170, 255, 0.2)' : 'transparent',
                      color: selectedPart === part ? '#4af' : '#ddd',
                      borderLeft: selectedPart === part ? '3px solid #4af' : '3px solid transparent',
                      transition: 'all 0.2s'
                    }}>
                    {part.replace('GEO_', '')}
                  </div>
                ))}
            </div>

            <div style={{
              fontSize: '12px',
              color: '#888',
              marginTop: '15px',
              textAlign: 'center'
            }}>
              Rotate: Click + Drag | Zoom: Scroll
            </div>
          </div>

          {selectedPart && (
            <div style={{
              position: 'absolute',
              top: 20,
              right: 20,
              backgroundColor: 'rgba(20, 20, 20, 0.85)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              padding: 20,
              borderRadius: 10,
              maxWidth: '350px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              zIndex: 100
            }}>
              <h2 style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                paddingBottom: '10px',
                marginTop: 0,
                color: '#4af'
              }}>
                {getPartDescription(selectedPart).title}
              </h2>

              <p style={{
                fontSize: '15px',
                lineHeight: '1.5',
                color: '#ddd'
              }}>
                {getPartDescription(selectedPart).description}
              </p>

              <div style={{
                marginTop: '15px',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                padding: '15px',
                borderRadius: '5px'
              }}>
                <h3 style={{
                  marginTop: 0,
                  fontSize: '16px',
                  color: '#aaa',
                  marginBottom: '10px'
                }}>
                  Specifications
                </h3>
                <ul style={{
                  paddingLeft: '20px',
                  marginBottom: 0,
                  color: '#bbb'
                }}>
                  {getPartDescription(selectedPart).specs.map((spec, index) => (
                    <li key={index} style={{ marginBottom: '5px' }}>{spec}</li>
                  ))}
                </ul>
              </div>

              {selectedPart.includes('Propeller') && isStarted && (
                <div style={{
                  marginTop: '15px',
                  padding: '10px',
                  backgroundColor: 'rgba(74, 170, 255, 0.1)',
                  borderRadius: '5px',
                  borderLeft: '3px solid #4af',
                  fontSize: '14px'
                }}>
                  <p style={{ margin: 0 }}>
                    <span style={{ color: '#4af', fontWeight: 'bold' }}>Active</span> - Propeller is currently spinning
                  </p>
                </div>
              )}

              {selectedPart === 'entire_model' && (
                <div style={{
                  marginTop: '15px',
                  padding: '10px',
                  backgroundColor: 'rgba(74, 170, 255, 0.1)',
                  borderRadius: '5px',
                  borderLeft: '3px solid #4af',
                  fontSize: '14px'
                }}>
                  <p style={{ margin: 0 }}>
                    <span style={{ color: '#4af', fontWeight: 'bold' }}>Tip:</span> Click on individual components to explore them in detail.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(<App />);
