import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import Model from './components/Model/Model';
import CameraController from './components/UI/CameraController';
import LoadingScreen from './components/UI/LoadingScreen';
import ErrorScreen from './components/UI/ErrorScreen';
import PartList from './components/UI/PartList';
import PartInfoPanel from './components/UI/PartInfoPanel';
import ControlButton from './components/UI/ControlButton';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { CameraProvider } from './context/context';
import { useCameraControls } from '../src/context/context';
// import { getPartDescription } from './constants/parts';

export default function App() {
  const [state, setState] = useState({
    parts: [],
    selectedPart: 'entire_model',
    modelLoaded: false,
    loadingProgress: 0,
    error: null,
    isStarted: false,
  });
  const controlsRef = useCameraControls();


  

  useEffect(() => {
    if (state.modelLoaded) {
      setState(prevState => ({ ...prevState, loadingProgress: 100 }));
      return;
    }

    const interval = setInterval(() => {
      setState(prevState => {
        const newProgress = prevState.loadingProgress + (Math.random() * 20);
        return { ...prevState, loadingProgress: newProgress < 90 ? newProgress : 100 };
      });
    }, 200);

    return () => clearInterval(interval);
  }, [state.modelLoaded]);

  const handlePartsFound = (foundParts) => {
    setState(prevState => ({
      ...prevState,
      parts: foundParts,
      modelLoaded: true,
    }));

    if (foundParts.length > 0 && !foundParts.includes(state.selectedPart) && state.selectedPart !== 'entire_model') {
      setState(prevState => ({ ...prevState, selectedPart: 'entire_model' }));
    }
  };

  const handleStart = () => {
    setState(prevState => ({ ...prevState, isStarted: true }));
  };

  const handleStop = () => {
    setState(prevState => ({ ...prevState, isStarted: false }));
  };

  const handlePartSelect = (part) => {
    setState(prevState => ({ ...prevState, selectedPart: part }));
  };

  useEffect(() => {
    const errorHandler = (event) => {
      console.error("Application error:", event.error);
      setState(prevState => ({ ...prevState, error: event.error.message || "An unknown error occurred" }));
      event.preventDefault();
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (!state.modelLoaded && state.loadingProgress < 100) {
    return <LoadingScreen progress={state.loadingProgress} />;
  }

  return (
    <div className="w-screen h-screen relative">
      {state.error ? (
        <ErrorScreen error={state.error} onRetry={() => window.location.reload()} />
      ) : (
        <>
          <CameraProvider>
            <Canvas
              camera={{ position: [0, 0, 200], fov: 50 }}
              gl={{ antialias: true, outputEncoding: THREE.sRGBEncoding }}
            >

              <Environment files="src/assets/lab.exr" background />

              <Model
                url="src/assets/Drone_Ob.obj"
                materialUrl="src/assets/Drone_Ob.mtl"
                isStarted={state.isStarted}
                onPartsFound={handlePartsFound}
              />
              <CameraController

                targetPart={state.selectedPart}
                isStarted={state.isStarted}
              />
          
        </Canvas>


      <div className="absolute top-5 left-5 bg-gray-800/40 backdrop-blur-md text-white p-4 rounded-lg w-[300px] max-h-[80vh] overflow-y-auto shadow-xl border border-white/10">
        <h2 className="text-blue-400 border-b border-white/20 pb-2 mb-4">Drone Explorer</h2>
        <ControlButton
          isStarted={state.isStarted}
          onStart={handleStart}
          onStop={handleStop}
        />


        <button
          className="w-full mb-4 py-2 rounded-md transition-all duration-300 bg-green-500 hover:bg-green-600"
          onClick={() => {
            console.log(controlsRef)
            if (controlsRef != null) {
              controlsRef.current.enabled = true;
            } else {
              console.error("controlsRef is null");
            }
          }}>
          Enable Dragging View
        </button>
        

        <PartList
          parts={state.parts}
          selectedPart={state.selectedPart}
          onSelect={handlePartSelect}
        />
      </div>

      {state.selectedPart && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}>
          <PartInfoPanel
            part={state.selectedPart}
            isStarted={state.isStarted}
          />
        </motion.div>
      )}
      </CameraProvider>
    </>
  )
}
    </div >
  );
}