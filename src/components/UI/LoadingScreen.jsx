import React from "react";
export default function LoadingScreen({ progress }) {


    return (
      <div className="fixed top-0 left-0 w-full h-full bg-black flex flex-col justify-center items-center z-50">
        <div className="mb-6">
          <h1 className="text-white text-3xl">Drone 3D Explorer</h1>
        </div>
        <div className="w-[300px] h-1.5 bg-gray-800 rounded">
          <div 
            className="h-full bg-blue-500 rounded transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-gray-300 mt-2">
          Loading assets: {progress.toFixed(0)}%
        </p>
        <div className="absolute bottom-5 text-gray-400 text-xs">
          <p>Loading model and textures...</p>
        </div>
      </div>
    );
  }
  