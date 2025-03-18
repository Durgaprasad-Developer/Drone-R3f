import { createRoot } from 'react-dom/client'
import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { OrbitControls, Environment } from '@react-three/drei'
import * as THREE from 'three'
import './index.css'
import { bleach } from 'three/examples/jsm/tsl/display/BleachBypass.js'
import { color } from 'three/tsl'


function CameraController({ target, offset = [0, 0, 200], focusedPart}) {
  const { camera } = useThree();
  const targetRef = useRef(new THREE.Vector3());
  
  useFrame(() => {
    if (!target.current) return;
    
    const targetPosition = new THREE.Vector3();
    target.current.getWorldPosition(targetPosition);
    

    if (focusedPart && target.current) {
      let part = null;
      

      target.current.traverse((child) => {
        if (child.isMesh && child.name === focusedPart) {
          part = child;
        }
      });
      
      if (part) {
        
        console.log('FOUNT PART TO FOCUS' +   part)
        const partPosition = new THREE.Vector3();
        part.getWorldPosition(partPosition);
        
        // Position camera closer to the part (30 units away)
        const direction = new THREE.Vector3().subVectors(camera.position, partPosition).normalize();
        camera.position.copy(partPosition).add(direction.multiplyScalar(100));
        camera.lookAt(partPosition);
        return;
      }
    }
    
    const desiredPosition = targetPosition.clone().add(new THREE.Vector3(...offset));
    camera.position.lerp(desiredPosition, 0.1);
    camera.lookAt(targetPosition);
  });
  
  return null;
}

function Model({ url, materialUrl, position, rotationPart, dronePosition, onPartsFound, isStarted }) {
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
        foundParts.push(child.name || `unnamed_part_${foundParts.length}`);
        
        // Store references to propellers
        if (child.name && child.name.includes('GEO_Propeller')) {
          propellerRefs.current[child.name] = child;
        }
        
        // Compute center of each mesh
        child.geometry.computeBoundingBox();
        const center = new THREE.Vector3();
        child.geometry.boundingBox.getCenter(center);
        
        // Recenter geometry
        child.geometry.translate(-center.x, -center.y, -center.z);
        child.position.set(center.x, center.y, center.z);
        
        // Generate UVs if they don't exist
        if (!child.geometry.attributes.uv) {
          console.log(`Generating UVs for ${child.name}`);
          child.geometry = new THREE.SphereGeometry(1, 32, 32);
        }
        
        // Determine which material to use
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


  useEffect(() => {
    if (groupRef.current && dronePosition) {
      groupRef.current.position.x = dronePosition.x;
      groupRef.current.position.y = dronePosition.y;
      groupRef.current.position.z = dronePosition.z;
    }
  }, [dronePosition]);

  // Rotate parts and propellers
  const { camera } = useThree();
  useFrame((state, delta) => {
    if (obj) {
      let foundPartToRotate = false;
      
      if (isStarted && propellerRefs.current) {
        
        for (let i = 1; i <= 4; i++) {
          const propName = `GEO_Propeller_0${i}`;
          const propeller = propellerRefs.current[propName];
          if (propeller) {
            
            const direction = i % 2 === 0 ? 1 : -1;
            propeller.rotateY(delta * 20);
          }
        }
      }
      
      obj.traverse((child) => {
        if (child.isMesh && (child.name === rotationPart || '')) {
          
          //i have to implement the camera zoom
          const part = child
          console.log('FOUNT PART TO FOCUS' +   part)
          const partPosition = new THREE.Vector3();
          part.getWorldPosition(partPosition);
          
          // Position camera closer to the part (30 units away)
          const direction = new THREE.Vector3().subVectors(camera.position, partPosition).normalize();
          camera.position.copy(partPosition).add(direction.multiplyScalar(30));
          camera.lookAt(partPosition);
          return;
        }
        
      });
      
      if (partFound !== foundPartToRotate) {
        setPartFound(foundPartToRotate);
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

function App() {
  const [parts, setParts] = useState([]);
  const [selectedPart, setSelectedPart] = useState('entire_model');
  const [modelLoaded, setModelLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const modelRef = useRef();
  const controlsRef = useRef();
  
  const [dronePosition, setDronePosition] = useState({ x: 0, y: 0, z: 0 });
  
  const movementSpeed = 5;

  const handlePartsFound = (foundParts) => {
    setParts(foundParts);
    setModelLoaded(true);

    if (foundParts.length > 0 && !foundParts.includes(selectedPart) && selectedPart !== 'entire_model') {
      setSelectedPart('entire_model');
    }
  };
  
  const moveDrone = (direction) => {
    setDronePosition(prev => {
      const newPos = { ...prev };
      
      switch (direction) {
        case 'up':
          newPos.y += movementSpeed*10;
          break;
        case 'down':
          newPos.y -= movementSpeed*10;
          break;
        case 'forward':
          newPos.z -= movementSpeed*10;
          break;
        case 'backward':
          newPos.z += movementSpeed*10;
          break;
        case 'left':
          newPos.x -= movementSpeed*10;
          break;
        case 'right':
          newPos.x += movementSpeed*10;
          break;
        default:
          break;
      }
      
      return newPos;
    });
  };
  
  const handleStart = () => {
    setIsStarted(true);
    setShowControls(true);
    
    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }
  };
  const handleStop = () =>{
    setIsStarted(false);
    setShowControls(false);
    if (controlsRef.current) {
      controlsRef.current.enabled = true;
    }
  }
  
  // Handle part selection
  const handlePartSelect = (part) => {
    setSelectedPart(part);
    
    if (controlsRef.current) {
      controlsRef.current.enabled = true;
    }
  };

  // Global error handler
  useEffect(() => {
    const errorHandler = (event) => {
      console.error("Application error:", event.error);
      setError(event.error.message || "An unknown error occurred");
      event.preventDefault();
    };
    
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);
  
  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isStarted) return;
      
      switch (e.key) {
        case 'ArrowUp':
          moveDrone('forward');
          break;
        case 'ArrowDown':
          moveDrone('backward');
          break;
        case 'ArrowLeft':
          moveDrone('left');
          break;
        case 'ArrowRight':
          moveDrone('right');
          break;
        case 'w':
          moveDrone('up');
          break;
        case 's':
          moveDrone('down');
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStarted]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {error ? (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(255,0,0,0.7)',
          color: 'white',
          padding: 20,
          borderRadius: 5,
          zIndex: 1000
        }}>
          <h3>Error Loading Model</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : (
        <>
          <Canvas
            camera={{ position: [0, 0, 200], fov: 50 }}
            gl={{ antialias: true, outputEncoding: THREE.sRGBEncoding }}
          >
            <Environment 
            files="src/assets/golden_gate_hills_4k.exr" 
            background
            />
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
            <pointLight position={[-10, -10, -10]} intensity={0.8} />
            
            <Model
              url="src/assets/Drone_Ob.obj"  
              materialUrl="src/assets/Drone_Ob.mtl"  
              position={[0, 0, 0]}
              rotationPart={selectedPart}
              dronePosition={dronePosition}
              onPartsFound={handlePartsFound}
              isStarted={isStarted}
              ref={modelRef}
            />
            
            {/* Camera controller */}
            <CameraController 
              target={modelRef} 
              offset={[0, 20, 100]} 
              focusedPart={selectedPart !== 'entire_model' ? selectedPart : null} 
            />
            
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
          </Canvas>

          {/* Parts list UI */}
          <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: 10,
            borderRadius: 5,
            maxHeight: '80vh',
            overflowY: 'auto',
            zIndex: 100
          }}>
            <h3>Model Controls</h3>

            {modelLoaded ? (
              <>
                {!isStarted ? (
                  <button 
                    onClick={handleStart}
                    style={{
                      backgroundColor: '#4af',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: 4,
                      cursor: 'pointer',
                      marginBottom: 10,
                      fontWeight: 'bold'
                    }}
                  >
                    Start Drone
                  </button>

                ):(
                  <button 
                    onClick={handleStop}
                    style={{
                      backgroundColor: '#4af',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: 4,
                      cursor: 'pointer',
                      marginBottom: 10,
                      fontWeight: 'bold'
                    }}
                  >
                    Stop
                  </button>
                )}
                
                {isStarted && (
                  <div style={{ marginBottom: 15 }}>
                    <p><strong>Drone Position:</strong></p>
                    <p>X: {dronePosition.x.toFixed(1)} Y: {dronePosition.y.toFixed(1)} Z: {dronePosition.z.toFixed(1)}</p>
                  </div>
                )}

                <p><strong>Select part to focus:</strong></p>
                <ul>
                  <li
                    key="entire_model"
                    onClick={() => handlePartSelect('entire_model')}
                    style={{
                      cursor: 'pointer',
                      fontWeight: selectedPart === 'entire_model' ? 'bold' : 'normal',
                      color: selectedPart === 'entire_model' ? '#4af' : 'white',
                      marginBottom: 8
                    }}>
                    View entire model
                  </li>

                  {parts.map((part, index) => (
                    <li key={index}
                      onClick={() => handlePartSelect(part)}
                      style={{
                        cursor: 'pointer',
                        fontWeight: selectedPart === part ? 'bold' : 'normal',
                        color: selectedPart === part ? '#4af' : 'white'
                      }}>
                      {part}
                    </li>
                  ))}
                </ul>

                {showControls && (
                  <div style={{ marginTop: 20 }}>
                    <h4>Flight Controls</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                      <button 
                        onClick={() => moveDrone('up')}
                        style={{
                          backgroundColor: '#4af',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: 4,
                          cursor: 'pointer',
                          width: 100
                        }}
                      >
                        Up (W)
                      </button>
                      
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button 
                          onClick={() => moveDrone('left')}
                          style={{
                            backgroundColor: '#4af',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            width: 100
                          }}
                        >
                          Left (←)
                        </button>
                        
                        <button 
                          onClick={() => moveDrone('right')}
                          style={{
                            backgroundColor: '#4af',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            width: 100
                          }}
                        >
                          Right (→)
                        </button>
                      </div>
                      
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button 
                          onClick={() => moveDrone('forward')}
                          style={{
                            backgroundColor: '#4af',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            width: 100
                          }}
                        >
                          Forward (↑)
                        </button>
                        
                        <button 
                          onClick={() => moveDrone('backward')}
                          style={{
                            backgroundColor: '#4af',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            width: 100
                          }}
                        >
                          Back (↓)
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => moveDrone('down')}
                        style={{
                          backgroundColor: '#4af',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: 4,
                          cursor: 'pointer',
                          width: 100
                        }}
                      >
                        Down (S)
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p>Loading model and textures...</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)