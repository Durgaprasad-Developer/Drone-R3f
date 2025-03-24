import * as THREE from 'three';
import { useEffect, useState } from 'react';

const texturePaths = {
    parts: {
        
        diffuse: 'src/assets/uploads_files_3653841_Textures (extract.me)/Textures_Parts/Diffuse_Part.jpg',
        height: 'src/assets/uploads_files_3653841_Textures (extract.me)/Textures_Parts/Height_Part.png',
        metalness: 'src/assets/uploads_files_3653841_Textures (extract.me)/Textures_Parts/Metalness_Part.png',
        normal: 'src/assets/uploads_files_3653841_Textures (extract.me)/Textures_Parts/Normal_Part.png',
        roughness: 'src/assets/uploads_files_3653841_Textures (extract.me)/Textures_Parts/Roughness_Part.png',
    },
    frame: {
        diffuse: 'src/assets/uploads_files_3653841_Textures (extract.me)/Textures_Quadcopter frame/Diffuse_Quadcopter.png',
        height: 'src/assets/uploads_files_3653841_Textures (extract.me)/Textures_Quadcopter frame/Height_Quadcopter.png',
        metalness: 'src/assets/uploads_files_3653841_Textures (extract.me)/Textures_Quadcopter frame/Metalness_Quadcopter.png',
        normal: 'src/assets/uploads_files_3653841_Textures (extract.me)/Textures_Quadcopter frame/Normal_Quadcopter.png',
        roughness: 'src/assets/uploads_files_3653841_Textures (extract.me)/Textures_Quadcopter frame/Roughness_Quadcopter.png',
    },
};

export const useTextures = () => {
    const [textures, setTextures] = useState({ parts: {}, frame: {} });
    const [texturesLoaded, setTexturesLoaded] = useState(false);

    useEffect(() => {
        const textureLoader = new THREE.TextureLoader();
        const loadedTextures = { parts: {}, frame: {} };
        let loadCount = 0;
        const totalTextures = Object.keys(texturePaths.parts).length + Object.keys(texturePaths.frame).length;

        const loadTexture = (category, type, path) => {
            textureLoader.load(
                path,
                (texture) => {
                    if (type === 'normal') texture.encoding = THREE.LinearEncoding;
                    if (type === 'diffuse') texture.encoding = THREE.sRGBEncoding;

                    loadedTextures[category][type] = texture;
                    if (++loadCount === totalTextures) {
                        setTextures(loadedTextures);
                        setTexturesLoaded(true);
                    }
                },
                undefined,
                (error) => {
                    console.error(`Failed to load texture: ${path}`, error);
                    if (++loadCount === totalTextures) setTexturesLoaded(true);
                }
            );
        };

        Object.entries(texturePaths.parts).forEach(([type, path]) => loadTexture('parts', type, path));
        Object.entries(texturePaths.frame).forEach(([type, path]) => loadTexture('frame', type, path));
    }, []);

    return { textures, texturesLoaded };
};