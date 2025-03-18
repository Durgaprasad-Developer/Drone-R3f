import { createRoot } from 'react-dom/client'
import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

function Model({ url, materialUrl, position, rotationPart = 'part1', onPartsFound }) {
  const groupRef = useRef()
  const [partFound, setPartFound] = useState(false)

  // Load materials if provided with error handling
  const [materialLoaded, setMaterialLoaded] = useState(false)
  const [materials, setMaterials] = useState(null)

  useEffect(() => {
    if (!materialUrl) {
      setMaterialLoaded(true)
      return
    }
    
    const mtlLoader = new MTLLoader()
    mtlLoader.load(
      materialUrl,
      (loadedMaterials) => {
        loadedMaterials.preload()
        setMaterials(loadedMaterials)
        setMaterialLoaded(true)
      },
      undefined,
      (error) => {
        console.warn("Failed to load material:", error)
        setMaterialLoaded(true) // Continue without materials
      }
    )
  }, [materialUrl])

  // Load OBJ model with error handling
  const [obj, setObj] = useState(null)
  const [modelLoaded, setModelLoaded] = useState(false)

  useEffect(() => {
    if (!materialLoaded) return
    
    const objLoader = new OBJLoader()
    if (materials) {
      objLoader.setMaterials(materials)
    }
    
    objLoader.load(
      url,
      (loadedObj) => {
        setObj(loadedObj)
        setModelLoaded(true)
      },
      undefined,
      (error) => {
        console.error("Failed to load model:", error)
        setModelLoaded(true) // Mark as loaded to remove loading indicator
      }
    )
  }, [url, materials, materialLoaded])

  // Process model after loading
  useEffect(() => {
    if (obj && groupRef.current) {
      // Clear previous children
      while (groupRef.current.children.length) {
        groupRef.current.remove(groupRef.current.children[0])
      }
      groupRef.current.add(obj)

      const foundParts = []
      obj.traverse((child) => {
        if (child.isMesh) {
          foundParts.push(child.name || `unnamed_part_${foundParts.length}`)

          // Compute center of each mesh
          child.geometry.computeBoundingBox()
          const center = new THREE.Vector3()
          child.geometry.boundingBox.getCenter(center)

          // Recenter geometry
          child.geometry.translate(-center.x, -center.y, -center.z)
          child.position.set(center.x, center.y, center.z)

          // Use a basic material instead of trying to load textures that fail
          child.material = new THREE.MeshStandardMaterial({
            color: 0x7a7a7a,
            metalness: 0.5,
            roughness: 0.5
          })
        }
      })

      if (onPartsFound) {
        onPartsFound(foundParts)
      }
    }
  }, [obj])

  // Rotate each part around its own axis
  useFrame((state, delta) => {
    if (obj) {
      let foundPartToRotate = false

      obj.traverse((child) => {
        if (child.isMesh && (child.name === rotationPart || rotationPart === 'entire_model')) {
          child.rotateY(delta * 10) // Apply rotation to its own center
          foundPartToRotate = true
        }
      })

      if (partFound !== foundPartToRotate) {
        setPartFound(foundPartToRotate)
      }
    }
  })

  return <group ref={groupRef} position={position} />
}

function App() {
  const [parts, setParts] = useState([])
  const [selectedPart, setSelectedPart] = useState('entire_model')
  const [modelLoaded, setModelLoaded] = useState(false)
  const [error, setError] = useState(null)

  const handlePartsFound = (foundParts) => {
    setParts(foundParts)
    setModelLoaded(true)

    if (foundParts.length > 0 && !foundParts.includes(selectedPart)) {
      setSelectedPart(foundParts[0] || 'entire_model')
    }
  }

  // Global error handler for the entire app
  const handleError = (error) => {
    console.error("Application error:", error)
    setError(error.message || "An unknown error occurred")
  }

  // Create error boundary effect
  useEffect(() => {
    const errorHandler = (event) => {
      handleError(event.error)
      event.preventDefault()
    }
    
    window.addEventListener('error', errorHandler)
    
    return () => {
      window.removeEventListener('error', errorHandler)
    }
  }, [])

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
          <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
            <pointLight position={[-10, -10, -10]} />

            <Model
              url="src/assets/Drone_Ob.obj"  
              materialUrl="src/assets/Drone_Ob.mtl"  
              position={[0, 0, 0]}
              rotationPart={selectedPart}
              onPartsFound={handlePartsFound}
            />

            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              makeDefault
              // Fix for the wheel event passive listener warning
              addEventListener={undefined}
              removeEventListener={undefined}
              options={{
                passive: true
              }}
            />
          </Canvas>

          {/* Parts list UI */}
          <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            backgroundColor: 'rgba(0,0,0,0.7)',
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
                <p><strong>Select part to rotate:</strong></p>
                <ul>
                  <li
                    key="entire_model"
                    onClick={() => setSelectedPart('entire_model')}
                    style={{
                      cursor: 'pointer',
                      fontWeight: selectedPart === 'entire_model' ? 'bold' : 'normal',
                      color: selectedPart === 'entire_model' ? '#4af' : 'white',
                      marginBottom: 8
                    }}>
                    Rotate entire model
                  </li>

                  {parts.map((part, index) => (
                    <li key={index}
                      onClick={() => setSelectedPart(part)}
                      style={{
                        cursor: 'pointer',
                        fontWeight: selectedPart === part ? 'bold' : 'normal',
                        color: selectedPart === part ? '#4af' : 'white'
                      }}>
                      {part}
                    </li>
                  ))}
                </ul>

                <div>
                  <p>Currently rotating: <strong>{selectedPart}</strong></p>
                  <p><small>Click on a part name to rotate it</small></p>
                </div>
              </>
            ) : (
              <p>Loading model...</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)