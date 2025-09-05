"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";

const WaveShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorPrimary: new THREE.Color(0x98ccc6),
    uColorSecondary: new THREE.Color(0x394368),
    uDriftAmount: 0,
    uDriftStart: 0.66, // <-- start drifting at ~2/3 across
    uDriftRamp: 0.08, // <-- how softly to ramp in (try 0.05..0.15)
  },
  /* vertex shader */ `
  varying vec2 vUv;
  varying float vWaveStrength;
  uniform float uTime;
  uniform float uDriftAmount;
  uniform float uDriftStart;
  uniform float uDriftRamp;

  void main() {
    vUv = uv;
    vec3 pos = position;

    float wave1 = sin(pos.x * 3.0 + uTime * 0.4) * 0.2;
    float wave2 = cos(pos.x * 1.9 - uTime * 0.6) * 0.1;
    float combinedWave = mix(wave1, wave2, 0.5);

    // --- DRIFT: start later using a smooth threshold
    // t = 0 before start; ramps to 1 over [uDriftStart, uDriftStart + uDriftRamp]
    float t = smoothstep(uDriftStart, min(1.0, uDriftStart + uDriftRamp), vUv.x);

    // optional shaping so drift grows a bit more as we approach the far right
    float shape = pow(vUv.x, 2.0);

    pos.y += uDriftAmount * t * shape;

    pos.z += combinedWave;
    vWaveStrength = combinedWave;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
  `,
  /* fragment shader (unchanged) */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uColorPrimary;
  uniform vec3 uColorSecondary;

  // Subtle variation of core width along X so it doesn't look uniform
  float bandVary(float x, float t) {
    return 0.20 + 0.10 * sin(x * 5.0 + t * 0.25);
  }

  void main() {
    float centerDist = abs(vUv.y - 0.5) * 2.0;

    float coreWidth = bandVary(vUv.x, uTime);
    float coreMix   = 1.0 - smoothstep(0.0, coreWidth, centerDist);
    vec3 coreColor  = mix(vec3(1.0), uColorPrimary, 0.60);

    float midThickness = 0.20;
    float midStart  = coreWidth;
    float midEnd    = coreWidth + midThickness;
    float midMix    = smoothstep(midStart, midEnd, centerDist);
    vec3 midColor   = uColorPrimary;

    float edgeStart = midEnd;
    float edgeEnd   = 0.52;
    float edgeMix   = smoothstep(edgeStart, edgeEnd, centerDist);
    float edgeWhiteStrength = 0.45;
    vec3 edgeColor  = mix(midColor, vec3(1.0), edgeMix * edgeWhiteStrength);

    vec3 color = coreColor;
    color = mix(color, midColor, clamp(midMix, 0.0, 1.0));
    color = mix(color, edgeColor, clamp(edgeMix, 0.0, 1.0));

    color += 0.02 * sin((vUv.x + uTime * 0.15) * 6.2831);

    float alphaBand =
        smoothstep(0.14, 0.42, vUv.y) *
        smoothstep(0.86, 0.58, vUv.y);

    float alphaProfile = mix(0.55, 0.80, smoothstep(coreWidth * 0.6, edgeEnd, centerDist));
    float alpha = alphaProfile * alphaBand;

    gl_FragColor = vec4(color, alpha);
  }
  `
);

extend({ WaveShaderMaterial });

const ShaderPlane = ({
  offset = 0,
  y = 0,
  z = -2,
  primary = "#98ccc6",
  secondary = "#394368",
  drift = 0,
  driftStart = 0.66, // 2/3 across
  driftRamp = 0.08, // softness of ramp-in
}: {
  offset?: number;
  y?: number;
  z?: number;
  primary?: string;
  secondary?: string;
  drift?: number;
  driftStart?: number;
  driftRamp?: number;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const material = useMemo(() => {
    const m = new WaveShaderMaterial();
    m.transparent = true;
    m.depthWrite = false;
    m.blending = THREE.AdditiveBlending;
    m.toneMapped = false;
    return m;
  }, []);

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime() + offset;
  });

  useMemo(() => {
    material.uniforms.uColorPrimary.value = new THREE.Color(primary);
    material.uniforms.uColorSecondary.value = new THREE.Color(secondary);
    material.uniforms.uDriftAmount.value = drift;
    material.uniforms.uDriftStart.value = driftStart;
    material.uniforms.uDriftRamp.value = driftRamp;
  }, [primary, secondary, drift, driftStart, driftRamp]);

  return (
    <mesh
      ref={meshRef}
      position={[0, y, z]}
    >
      <planeGeometry args={[20, 0.5, 200, 200]} />
      <primitive
        object={material}
        attach='material'
      />
    </mesh>
  );
};

const WebGLCanvas = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 2], fov: 75 }}
      gl={{ alpha: true, premultipliedAlpha: false }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0); // fully transparent canvas
      }}
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
      {/* Blue (front) — starts drifting at 70% across, soft ramp */}
      <ShaderPlane
        primary='#98ccc6'
        secondary='#394368'
        z={-2}
        offset={0}
        drift={0.0}
        driftStart={0.7}
        driftRamp={0.1}
      />

      {/* Yellow (middle) — same start, stronger upward drift */}
      <ShaderPlane
        primary='#FEE440'
        secondary='#FFA500'
        z={-2.1}
        offset={0.6}
        drift={0.9}
        driftStart={0.5}
        driftRamp={0.8}
      />

      {/* Red (back) — same start, strong downward drift */}
      <ShaderPlane
        primary='#EF476F'
        secondary='#8B1E3F'
        z={-2.2}
        offset={1.2}
        drift={-0.9}
        driftStart={0.5}
        driftRamp={0.8}
      />
    </Canvas>
  );
};

export default WebGLCanvas;
