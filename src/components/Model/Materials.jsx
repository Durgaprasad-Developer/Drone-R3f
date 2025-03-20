import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { useEffect, useState } from 'react';
import React from 'react';

export const useMaterials = (materialUrl) => {
  const [materials, setMaterials] = useState(null);
  const [materialLoaded, setMaterialLoaded] = useState(false);

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

  return { materials, materialLoaded };
};