import { useEffect, useRef } from 'react';
import React from 'react';
import { useThree,useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

export default function CameraController({ targetPart, isStarted }) {
  const { camera, scene } = useThree();
  const controlsRef = useRef();
  const targetPosition = useRef(new THREE.Vector3());
  const currentCenter = useRef(new THREE.Vector3());
  const animationStage = useRef(0); // 0: idle, 1: moving to origin, 2: moving to target
  const originalPosition = new THREE.Vector3(0, 0, 200);
  const originalLookAt = new THREE.Vector3(0, 0, 0);


  const prevTargetPart = useRef(null);

  useFrame(() => {
    if (animationStage.current === 1) {
      // Stage 1: Moving back to original position
      camera.position.lerp(originalPosition, 0.05);

      // Gradually look back at center
      currentCenter.current.lerp(originalLookAt, 0.08);
      camera.lookAt(currentCenter.current);

      // When we get close enough to original position, move to stage 2
      if (camera.position.distanceTo(originalPosition) < 0.5) {
        animationStage.current = 2;
      }
    }
    else if (animationStage.current === 2) {
      // Stage 2: Moving to the target position
      camera.position.lerp(targetPosition.current, 0.08);

      // Gradually look at target center
      camera.lookAt(currentCenter.current);

      // When we get close enough to the target position, stop animating
      if (camera.position.distanceTo(targetPosition.current) < 0.01) {
        animationStage.current = 0; // Back to idle

        // Re-enable controls
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
          controlsRef.current.target.copy(currentCenter.current);
        }
      }
    }
  });

  // Function to focus camera on a part
  useEffect(() => {
    // Skip if no target part or it's the same as before
    if (!targetPart || targetPart === prevTargetPart.current) return;

    // Update previous target reference
    prevTargetPart.current = targetPart;

    // Disable controls during transition
    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }

    if (targetPart === 'entire_model') {
      // For entire model, just go to original position
      targetPosition.current = originalPosition.clone();
      currentCenter.current = originalLookAt.clone();
      animationStage.current = 1; // Skip to stage 2 directly
      return;
    }

    // Find the target object in the scene
    let targetObject = null;
    scene.traverse((child) => {
      if (child.name === targetPart) {
        targetObject = child;
      }
    });

    if (!targetObject) {

      targetPosition.current = originalPosition.clone();
      currentCenter.current = originalLookAt.clone();
      animationStage.current = 1;
      return;
    }

    const bbox = new THREE.Box3().setFromObject(targetObject);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    const size = bbox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const distance = Math.max((maxDim * 1.5) / Math.tan(fov / 2), 20);

    const direction = new THREE.Vector3(1, 0.5, 1).normalize();
    targetPosition.current = center.clone().add(direction.multiplyScalar(distance));
    currentCenter.current = center.clone();

    animationStage.current = 2;

    return () => {
      if (controlsRef.current && animationStage.current !== 0) {
        controlsRef.current.enabled = true;
      }
    };
  }, [targetPart, scene, camera]);


  useEffect(() => {
    if (isStarted) {
      camera.position.set(originalPosition.x, originalPosition.y, originalPosition.z);
      camera.lookAt(originalLookAt);
      if (controlsRef.current) {
        controlsRef.current.target.copy(originalLookAt);
      }
    }
  }, [isStarted, camera]);

  return (
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
  );
}