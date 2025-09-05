"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
// import { WaveShaderMaterial } from "./WaveShaderMaterial";

const ShaderPlane = () => {
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh
      rotation={[0, 0, 0]}
      position={[0, 0, -2]}
    >
      <planeGeometry args={[10, 10, 100, 100]} />
      <waveShaderMaterial
        ref={materialRef}
        attach='material'
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

const WebGLCanvas = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 2], fov: 75 }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      <ShaderPlane />
    </Canvas>
  );
};

export default WebGLCanvas;
