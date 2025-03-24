import React from "react";

import { createContext, useContext, useRef } from "react";



const CameraContext = createContext();

export const CameraProvider = ({ children }) => {
  const controlsRef = useRef(null);
  
  return (
    <CameraContext.Provider value={controlsRef}>
      {children}
    </CameraContext.Provider>
  );
};

export const useCameraControls = () => useContext(CameraContext);