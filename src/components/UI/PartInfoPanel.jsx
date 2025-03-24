import { getPartDescription } from '../../constants/partDescription';
import React from 'react';
import { motion } from "framer-motion"; // Fixed import

export default function PartInfoPanel({ part, isStarted }) {
  const description = getPartDescription(part);

  console.log(part, description);

  if (!description || isStarted) return null;

  return (
    <motion.div 
      key={part.id || part} 
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3 }}
      className="absolute top-5 right-5 bg-gray-800/40 backdrop-blur-md text-white p-4 rounded-lg w-[300px] shadow-xl border border-white/10"
    >
      <h3 className="text-blue-400 text-lg font-semibold mb-3">{description.title}</h3>
      <p className="text-gray-300 text-sm mb-4">{description.description}</p>
      <div className="border-t border-white/20 pt-4">
        <h4 className="text-sm font-medium text-blue-300 mb-2">Technical Specifications:</h4>
        <ul className="list-disc list-inside space-y-1 text-gray-400 text-sm">
          {description.specs.map((spec, i) => (
            <li key={i}>{spec}</li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}