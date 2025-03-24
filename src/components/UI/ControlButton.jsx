
import React from 'react';

export default function ControlButton({ isStarted, onStart, onStop }) {

    return (
      <button
        onClick={isStarted ? onStop : onStart}
        className={`w-full mb-4 py-2 rounded-md transition-all duration-300 ${
          isStarted 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-green-500 hover:bg-green-600'
        }`}
      >
        {isStarted ? 'Stop Propellers' : 'Start Propellers'}
      </button>
    );
  }