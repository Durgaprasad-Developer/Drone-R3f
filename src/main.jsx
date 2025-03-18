import { createRoot } from 'react-dom/client'
import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { OrbitControls, Environment } from '@react-three/drei'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import './index.css'

// Physics world setup
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0) // Earth gravity
});

function Physics({ children }) {
  const [physicsReady, setPhysicsReady] = useState(false);
  
  useEffect(() => {
    // Configure physics world
    world.defaultContactMaterial.restitution = 0.3;
    world.defaultContactMaterial.friction = 0.3;
    
    // Add ground plane
    const groundBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Plane(),
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // Rotate plane to be horizontal
    groundBody.position.set(0, -50, 0);
    world.addBody(groundBody);
    
    setPhysicsReady(true);
  }, []);
  
  useFrame((state, delta) => {
    // Update physics world
    world.step(1/60, delta, 3);
  });
  
  return physicsReady ? children : null;
}

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

function Model({ url, materialUrl, position, rotationPart, dronePosition, onPartsFound, isStarted, physicsBody }) {
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

  // Update position from physics
  useFrame(() => {
    if (groupRef.current && physicsBody) {
      const { position, quaternion } = physicsBody;
      groupRef.current.position.set(position.x, position.y, position.z);
      groupRef.current.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
    }
  });

  // Rotate propellers
  useFrame((state, delta) => {
    if (obj && isStarted) {
      // Rotate propellers when drone is started
      for (let i = 1; i <= 4; i++) {
        const propName = `GEO_Propeller_0${i}`;
        const propeller = propellerRefs.current[propName];
        if (propeller) {
          const direction = i % 2 === 0 ? 1 : -1;
          propeller.rotateY(delta * 20 * direction);
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

function App() {
  const [parts, setParts] = useState([]);
  const [selectedPart, setSelectedPart] = useState('entire_model');
  const [modelLoaded, setModelLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const modelRef = useRef();
  const controlsRef = useRef();
  
  // Physics refs
  const physicsBodyRef = useRef(null);
  const [dronePosition, setDronePosition] = useState({ x: 0, y: 0, z: 0 });
  const [droneRotation, setDroneRotation] = useState({ x: 0, y: 0, z: 0 });
  const [droneVelocity, setDroneVelocity] = useState({ x: 0, y: 0, z: 0 });
  const [droneAngularVelocity, setDroneAngularVelocity] = useState({ x: 0, y: 0, z: 0 });
  
  // Thrust forces
  const [thrustForce, setThrustForce] = useState(0);
  const [stabilityForce, setStabilityForce] = useState(0);
  const maxThrust = 200;
  const thrustStep = 20;
  const movementSpeed = 5;
  const rotationSpeed = 0.5;
  
  // Key states for smooth controls
  const [keysPressed, setKeysPressed] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
    forward: false,
    backward: false,
    rotateLeft: false,
    rotateRight: false,
    pitchUp: false,
    pitchDown: false
  });
  
  // Initialize physics on mount
  useEffect(() => {
    if (!physicsBodyRef.current) {
      // Create a drone body
      const droneBody = new CANNON.Body({
        mass: 1, // kg
        position: new CANNON.Vec3(0, 0, 0),
        shape: new CANNON.Box(new CANNON.Vec3(10, 2, 10)), // Approximate size of drone
      });
      
      // Add damping to simulate air resistance
      droneBody.linearDamping = 0.7;
      droneBody.angularDamping = 0.8;
      
      // Add to world
      world.addBody(droneBody);
      physicsBodyRef.current = droneBody;
    }
  }, []);
  
  // Update UI position data from physics
  useEffect(() => {
    if (!physicsBodyRef.current) return;
    
    const updatePositionData = () => {
      const pos = physicsBodyRef.current.position;
      const rot = new CANNON.Vec3();
      physicsBodyRef.current.quaternion.toEuler(rot);
      const vel = physicsBodyRef.current.velocity;
      const angVel = physicsBodyRef.current.angularVelocity;
      
      setDronePosition({ x: pos.x, y: pos.y, z: pos.z });
      setDroneRotation({ x: rot.x, y: rot.y, z: rot.z });
      setDroneVelocity({ x: vel.x, y: vel.y, z: vel.z });
      setDroneAngularVelocity({ x: angVel.x, y: angVel.y, z: angVel.z });
    };
    
    const interval = setInterval(updatePositionData, 50);
    return () => clearInterval(interval);
  }, []);
  
  // Apply continuous forces based on keys pressed
  useFrame(() => {
    if (!isStarted || !physicsBodyRef.current) return;
    
    const applyForces = () => {
      const body = physicsBodyRef.current;
      
      // Reset forces
      body.force.set(0, 0, 0);
      body.torque.set(0, 0, 0);
      
      // Apply gravity compensation when started
      if (isStarted) {
        body.force.y += 9.82 * body.mass; // Counteract gravity
      }
      
      // Apply thrust
      body.force.y += thrustForce;
      
      // Apply stability (auto-leveling)
      const upVector = new CANNON.Vec3(0, 1, 0);
      const currentUp = new CANNON.Vec3();
      body.quaternion.vmult(upVector, currentUp);
      
      // Calculate correction torque to level the drone
      const correctionTorque = new CANNON.Vec3();
      upVector.cross(currentUp, correctionTorque);
      correctionTorque.scale(stabilityForce, correctionTorque);
      body.torque.vadd(correctionTorque, body.torque);
      
      // Apply directional forces
      const forwardDir = new CANNON.Vec3(0, 0, -1);
      const rightDir = new CANNON.Vec3(1, 0, 0);
      const bodyForward = new CANNON.Vec3();
      const bodyRight = new CANNON.Vec3();
      
      body.quaternion.vmult(forwardDir, bodyForward);
      body.quaternion.vmult(rightDir, bodyRight);
      
      if (keysPressed.forward) {
        // Apply force in body's forward direction
        bodyForward.scale(movementSpeed, bodyForward);
        body.force.vadd(bodyForward, body.force);
      }
      
      if (keysPressed.backward) {
        // Apply force in body's backward direction
        bodyForward.scale(-movementSpeed, bodyForward);
        body.force.vadd(bodyForward, body.force);
      }
      
      if (keysPressed.right) {
        // Apply force in body's right direction
        bodyRight.scale(movementSpeed, bodyRight);
        body.force.vadd(bodyRight, body.force);
      }
      
      if (keysPressed.left) {
        // Apply force in body's left direction
        bodyRight.scale(-movementSpeed, bodyRight);
        body.force.vadd(bodyRight, body.force);
      }
      
      // Apply rotational forces
      if (keysPressed.rotateLeft) {
        body.torque.y += rotationSpeed;
      }
      
      if (keysPressed.rotateRight) {
        body.torque.y -= rotationSpeed;
      }
      
      if (keysPressed.pitchUp) {
        body.torque.x += rotationSpeed;
      }
      
      if (keysPressed.pitchDown) {
        body.torque.x -= rotationSpeed;
      }
      
      // Apply thrust changes
      if (keysPressed.up && thrustForce < maxThrust) {
        setThrustForce(prev => Math.min(prev + thrustStep, maxThrust));
      }
      
      if (keysPressed.down && thrustForce > 0) {
        setThrustForce(prev => Math.max(prev - thrustStep, 0));
      }
    };
    
    applyForces();
  });
  
  const handlePartsFound = (foundParts) => {
    setParts(foundParts);
    setModelLoaded(true);

    if (foundParts.length > 0 && !foundParts.includes(selectedPart) && selectedPart !== 'entire_model') {
      setSelectedPart('entire_model');
    }
  };
  
  // Start the drone
  const handleStart = () => {
    setIsStarted(true);
    setShowControls(true);
    setThrustForce(9.82 * (physicsBodyRef.current?.mass || 1)); // Initial thrust = gravity
    setStabilityForce(5); // Auto-leveling
    
    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }
  };
  
  // Stop the drone
  const handleStop = () => {
    setIsStarted(false);
    setShowControls(false);
    setThrustForce(0);
    setStabilityForce(0);
    
    if (controlsRef.current) {
      controlsRef.current.enabled = true;
    }
    
    // Reset physics body
    if (physicsBodyRef.current) {
      physicsBodyRef.current.velocity.set(0, 0, 0);
      physicsBodyRef.current.angularVelocity.set(0, 0, 0);
    }
  };
  
  // Reset the drone position
  const handleReset = () => {
    if (physicsBodyRef.current) {
      physicsBodyRef.current.position.set(0, 0, 0);
      physicsBodyRef.current.quaternion.set(0, 0, 0, 1);
      physicsBodyRef.current.velocity.set(0, 0, 0);
      physicsBodyRef.current.angularVelocity.set(0, 0, 0);
    }
  };
  
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
      
      const updateKeys = { ...keysPressed };
      
      switch (e.key) {
        case 'ArrowUp':
          updateKeys.forward = true;
          break;
        case 'ArrowDown':
          updateKeys.backward = true;
          break;
        case 'ArrowLeft':
          updateKeys.left = true;
          break;
        case 'ArrowRight':
          updateKeys.right = true;
          break;
        case 'w':
          updateKeys.up = true;
          break;
        case 's':
          updateKeys.down = true;
          break;
        case 'a':
          updateKeys.rotateLeft = true;
          break;
        case 'd':
          updateKeys.rotateRight = true;
          break;
        case 'i':
          updateKeys.pitchUp = true;
          break;
        case 'k':
          updateKeys.pitchDown = true;
          break;
        case 'r':
          handleReset();
          break;
        default:
          break;
      }
      
      setKeysPressed(updateKeys);
    };
    
    const handleKeyUp = (e) => {
      const updateKeys = { ...keysPressed };
      
      switch (e.key) {
        case 'ArrowUp':
          updateKeys.forward = false;
          break;
        case 'ArrowDown':
          updateKeys.backward = false;
          break;
        case 'ArrowLeft':
          updateKeys.left = false;
          break;
        case 'ArrowRight':
          updateKeys.right = false;
          break;
        case 'w':
          updateKeys.up = false;
          break;
        case 's':
          updateKeys.down = false;
          break;
        case 'a':
          updateKeys.rotateLeft = false;
          break;
        case 'd':
          updateKeys.rotateRight = false;
          break;
        case 'i':
          updateKeys.pitchUp = false;
          break;
        case 'k':
          updateKeys.pitchDown = false;
          break;
        default:
          break;
      }
      
      setKeysPressed(updateKeys);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isStarted, keysPressed]);

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
            <Physics>
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
                onPartsFound={handlePartsFound}
                isStarted={isStarted}
                ref={modelRef}
                physicsBody={physicsBodyRef.current}
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
            </Physics>
          </Canvas>

          {/* UI Panel */}
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
            <h3>Drone Controls</h3>

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
                ) : (
                  <div>
                    <button 
                      onClick={handleStop}
                      style={{
                        backgroundColor: '#f44',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: 4,
                        cursor: 'pointer',
                        marginBottom: 10,
                        marginRight: 10,
                        fontWeight: 'bold'
                      }}
                    >
                      Stop
                    </button>
                    
                    <button 
                      onClick={handleReset}
                      style={{
                        backgroundColor: '#f80',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: 4,
                        cursor: 'pointer',
                        marginBottom: 10,
                        fontWeight: 'bold'
                      }}
                    >
                      Reset Position
                    </button>
                  </div>
                )}
                
                {isStarted && (
                  <div style={{ marginBottom: 15 }}>
                    <p><strong>Drone Stats:</strong></p>
                    <p>Position: X: {dronePosition.x.toFixed(1)} Y: {dronePosition.y.toFixed(1)} Z: {dronePosition.z.toFixed(1)}</p>
                    <p>Rotation: X: {(droneRotation.x * 180 / Math.PI).toFixed(1)}° Y: {(droneRotation.y * 180 / Math.PI).toFixed(1)}° Z: {(droneRotation.z * 180 / Math.PI).toFixed(1)}°</p>
                    <p>Velocity: X: {droneVelocity.x.toFixed(1)} Y: {droneVelocity.y.toFixed(1)} Z: {droneVelocity.z.toFixed(1)}</p>
    <p>Thrust: {thrustForce.toFixed(1)}</p>
                    
    <div>
      <h4>Controls:</h4>
      <p>W/S: Increase/Decrease Thrust</p>
      <p>Arrow Keys: Move Forward/Back/Left/Right</p>
      <p>A/D: Rotate Left/Right</p>
      <p>I/K: Pitch Up/Down</p>
      <p>R: Reset Position</p>
    </div>
  </div>
)}

<h3>Part Selection</h3>
<select 
  value={selectedPart} 
  onChange={(e) => handlePartSelect(e.target.value)}
  style={{
    padding: '5px 10px',
    marginBottom: 10,
    width: '100%',
    borderRadius: 4
  }}
>
  <option value="entire_model">Entire Model</option>
  {parts.map(part => (
    <option key={part} value={part}>{part}</option>
  ))}
</select>
</>
) : (
  <p>Loading drone model...</p>
)}
</div>
</>
)}
</div>
);
}

createRoot(document.getElementById('root')).render(<App />);