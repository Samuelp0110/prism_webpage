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
    uSaturation: 1.35, // >1 more colorful
    uAlpha: 0.8, // overall opacity (for additive punch)
    uCoreWidth: 0.095, // width of the white hot core (smaller = crisper)
    uCoreIntensity: 0.7, // strength of the white core
    uEdgeSoftness: 0.06, // tiny edge blur (smaller = crisper edge)
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

    float wave1 = sin(pos.x * 3.0 + uTime * 0.4) * 0.05;
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

uniform float uSaturation;    // >1 = more color
uniform float uAlpha;         // overall opacity
uniform float uCoreWidth;     // ~0.03..0.06
uniform float uCoreIntensity; // ~0.6..1.2
uniform float uEdgeSoftness;  // ~0.03..0.08

// Same subtle width variation along X
float bandVary(float x, float t) {
  return 0.10 + 0.05 * sin(x * 7.0 + t * 0.25);
}

// Simple saturation in linear space
vec3 saturateColor(vec3 c, float s) {
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  return mix(vec3(l), c, s);
}

void main() {
  float centerDist = abs(vUv.y - 0.5) * 2.0;

  // Base colored band (keep it mostly the ribbon color)
  float coreWidth = bandVary(vUv.x, uTime);
  float midThickness = 0.18;                  // colored middle thickness
  float tMid = smoothstep(coreWidth, coreWidth + midThickness, centerDist);
  vec3 bandColor = mix(vec3(1.0), uColorPrimary, 0.90); // almost pure color

  // Slight edge whitening (very subtle)
  float tEdge = smoothstep(coreWidth + midThickness,
                           coreWidth + midThickness + uEdgeSoftness,
                           centerDist);
  bandColor = mix(bandColor, vec3(1.0), tEdge * 0.12);  // tiny white at edge

  // Add a narrow white "hot core" using a Gaussian profile (crisp, ~10% blur)
  float core = exp(-pow(centerDist / max(1e-4, uCoreWidth), 2.0)); // 0..1
  vec3 highlight = vec3(1.0) * (core * uCoreIntensity);

  // Avoid subtracting light (only add shimmer)
  float shimmer = max(0.0, sin((vUv.x + uTime * 0.15) * 6.2831));
  bandColor += 0.02 * shimmer;

  // Saturation & gentle brightness
  bandColor = saturateColor(bandColor, uSaturation) * 1.03;

  // Vertical envelope (kept tight to avoid blur feel)
  float alphaBand =
      smoothstep(0.18, 0.40, vUv.y) *
      smoothstep(0.82, 0.60, vUv.y);

  // Base alpha (colored band), plus extra alpha for the hot core
  float alphaBase = mix(0.65, 0.90, tMid);
  float alpha = uAlpha * alphaBase * alphaBand + (core * uCoreIntensity * 0.65);

  // Output for additive blending
  vec3 color = bandColor + highlight;
  gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
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
    material.uniforms.uColorPrimary.value.copy(
      new THREE.Color(primary).convertSRGBToLinear()
    );
    material.uniforms.uColorSecondary.value.copy(
      new THREE.Color(secondary).convertSRGBToLinear()
    );
    material.uniforms.uDriftAmount.value = drift;
    material.uniforms.uDriftStart.value = driftStart;
    material.uniforms.uDriftRamp.value = driftRamp;

    // optional: tweak these if you like
    material.uniforms.uSaturation.value = 1.35;
    material.uniforms.uAlpha.value = 0.9;
    material.uniforms.uCoreWidth.value = 0.095; // narrower → crisper white line
    material.uniforms.uCoreIntensity.value = 0.9; // stronger white in core
    material.uniforms.uEdgeSoftness.value = 0.9; // smaller → crisper edges
  }, [
    material.uniforms.uColorPrimary,
    material.uniforms.uColorSecondary,
    material.uniforms.uDriftAmount,
    material.uniforms.uDriftStart,
    material.uniforms.uDriftRamp,
    material.uniforms.uSaturation,
    material.uniforms.uAlpha,
    material.uniforms.uCoreWidth,
    material.uniforms.uCoreIntensity,
    material.uniforms.uEdgeSoftness,
    primary,
    secondary,
    drift,
    driftStart,
    driftRamp,
  ]);

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
      {/* Blue (front) */}
      <ShaderPlane
        primary='#98ccc6'
        secondary='#ffffff'
        z={-2}
        offset={0}
        drift={0.0}
        driftStart={1}
        driftRamp={0.1}
      />

      {/* Yellow (middle) */}
      <ShaderPlane
        primary='#FEE440'
        secondary='#FFA500'
        z={-2.1}
        offset={0.6}
        drift={0.9}
        driftStart={0.5}
        driftRamp={0.8}
      />

      {/* Red (back) */}
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
