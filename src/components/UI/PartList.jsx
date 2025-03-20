import React from 'react';
export default function PartList({ parts, selectedPart, onSelect }) {
    return (
      <div className="space-y-1">
        <div
          onClick={() => onSelect('entire_model')}
          className={`p-2 cursor-pointer rounded ${
            selectedPart === 'entire_model' 
              ? 'bg-blue-500/20 border-l-4 border-blue-500 text-blue-400'
              : 'hover:bg-gray-700/20'
          }`}
        >
          Entire Drone
        </div>
        {parts.map((part) => (
          <div
            key={part}
            onClick={() => onSelect(part)}
            className={`p-2 cursor-pointer rounded ${
              selectedPart === part
                ? 'bg-blue-500/20 border-l-4 border-blue-500 text-blue-400'
                : 'hover:bg-gray-700/20'
            }`}
          >
            {part.replace('GEO_', '')}
          </div>
        ))}
      </div>
    );
  }