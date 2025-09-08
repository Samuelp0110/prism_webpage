import { shaderMaterial } from "@react-three/drei";
import { extend, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Mesh } from "three";

type RibbonProps = {
  width?: number;
  height?: number;
  segments?: number;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
};

// 👇 vertex shader: pass UVs to the fragment, keep the same wave
const vert = /* glsl */ `
  uniform float uTime;
  uniform float uAmplitude;   // will be smoothed in JS
  uniform float uSpeed;       // time speed
  uniform float uBaseAmp;     // idle amplitude
  uniform float uAudioAmp;    // how much audio boosts movement
  uniform float uThickness; // world-space offset along vertex normal

  varying vec2 vUv;
  varying float vDepth;

  void main() {
    vUv = uv;
    vec3 pos = position;

    float t = uTime * uSpeed;

    // 0 at center → 1 at edges; edges move a bit more
    float edge = smoothstep(0.0, 1.0, abs(vUv.x - 0.5) * 2.0);

    float amp = uBaseAmp + uAudioAmp * uAmplitude;
    amp *= mix(0.8, 1.3, edge); // boost edges subtly

    // layered waves for organic motion
    float w1 = sin(pos.x * 2.2 + t * 2.0);
    float w2 = sin((pos.x + pos.y * 0.5) * 4.0 - t * 1.2);
    float w3 = sin(pos.x * 0.6 + t * 0.4);

    // primary displacement in Z
    pos.z += (w1 * 0.6 + w2 * 0.3 + w3 * 0.4) * amp;

    // tiny vertical flutter, stronger at edges
    pos.y += sin(pos.x * 3.0 + t * 1.5) * (amp * 0.15) * edge;

    // tiny extrusion along normal (positive/negative per instance)
    pos += normal * uThickness;

    // pass view-space depth to frag for optional use
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vDepth = -mv.z;

    gl_Position = projectionMatrix * mv;

  }
`;

// 👇 fragment shader: smooth vertical gradient using vUv.y
const frag = /* glsl */ `
  precision mediump float;

  varying vec2 vUv;

  uniform vec3 uColorA; // bottom
  uniform vec3 uColorB; // middle
  uniform vec3 uColorC; // top
  uniform float uOpacity;

  void main() {
    // vertical gradient
    float t = clamp(vUv.y, 0.0, 1.0);
    vec3 ab = mix(uColorA, uColorB, smoothstep(0.0, 0.5, t));
    vec3 col = mix(ab,      uColorC, smoothstep(0.5, 1.0, t));

    // horizontal edge falloff (soft halo effect)
    float distFromCenter = abs(vUv.x - 0.5) * 2.0;
    float coreBoost = mix(1.15, 1.0, distFromCenter);
    col *= coreBoost;
    float edgeFade = 1.0 - smoothstep(0.9, 1.0, distFromCenter);

    // apply falloff to opacity
    float finalAlpha = uOpacity * edgeFade;

    gl_FragColor = vec4(col, finalAlpha);
  }
`;

const depthFrag = /* glsl */ `
  void main() { /* no color needed */ }
`;

const RibbonDepthMaterial = shaderMaterial(
  {
    uTime: 0,
    uAmplitude: 0,
    uSpeed: 1.0,
    uBaseAmp: 0.12,
    uAudioAmp: 0.6,
    uThickness: 0.0, // ✅ include it here too
  },
  vert,
  depthFrag
);

const RibbonShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uAmplitude: 0,
    uSpeed: 1.0,
    uBaseAmp: 0.12,
    uAudioAmp: 0.6,

    uColorA: new THREE.Color("#7baeff"),
    uColorB: new THREE.Color("#d38dd8"),
    uColorC: new THREE.Color("#98ccc6"),
    uOpacity: 0.45,

    uThickness: 0.0, // ✅ include it here too
  },
  vert,
  frag
);

extend({ RibbonShaderMaterial });
extend({ RibbonDepthMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    ribbonDepthMaterial: ThreeElements["meshDepthMaterial"] & {
      uTime?: number;
      uAmplitude?: number;
      uSpeed?: number;
      uBaseAmp?: number;
      uAudioAmp?: number;
      uThickness?: number;
      colorWrite?: boolean;
    };
    ribbonShaderMaterial: ThreeElements["meshStandardMaterial"] & {
      uTime?: number;
      uAmplitude?: number;
      uSpeed?: number;
      uBaseAmp?: number;
      uAudioAmp?: number;
      uThickness?: number;
      uColorA?: THREE.Color | string | number;
      uColorB?: THREE.Color | string | number;
      uColorC?: THREE.Color | string | number;
      uOpacity?: number;
    };
  }
}

export const AudioReactiveRibbon: React.FC<RibbonProps> = ({
  width = 20,
  height = 4,
  segments = 100,
  audioRef,
}) => {
  const meshRef = useRef<Mesh>(null);
  const depthRef = useRef<THREE.ShaderMaterial>(null);
  const ampSmooth = useRef(0);

  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // external control holders
  const timeUniform = useRef(0);
  const amplitudeUniform = useRef(0);

  useFrame(({ clock }) => {
    const shader = shaderRef.current;
    const depth = depthRef.current;
    if (!shader) return;

    const time = clock.getElapsedTime();

    let intensity = 0;
    const analyser = analyserRef.current;
    const data = dataArrayRef.current;
    if (analyser && data) {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((s, v) => s + v, 0) / data.length;
      intensity = avg / 256;
    }

    // 🔥 smooth attack/decay so motion isn’t jittery
    // tweak 0.08 → smaller = smoother, larger = snappier
    ampSmooth.current += (intensity - ampSmooth.current) * 0.08;

    // update uniforms (color pass)
    shader.uniforms.uTime.value = time;
    shader.uniforms.uAmplitude.value = ampSmooth.current;

    // update uniforms (depth pass must match)
    if (depth) {
      depth.uniforms.uTime.value = time;
      depth.uniforms.uAmplitude.value = ampSmooth.current;
    }

    // optional external control you’re exposing
    timeUniform.current = time;
    amplitudeUniform.current = ampSmooth.current;
  });

  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio) return;

    const ctx = new AudioContext();
    const source = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;

    const data = new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);
    analyser.connect(ctx.destination);

    analyserRef.current = analyser;
    dataArrayRef.current = data;

    const resume = () => {
      if (ctx.state === "suspended") ctx.resume().catch(console.warn);
    };
    window.addEventListener("click", resume);

    return () => {
      window.removeEventListener("click", resume);
      analyser.disconnect();
      source.disconnect();
      ctx.close().catch(console.warn);
    };
  }, [audioRef]);

  return (
    <group
      rotation={[-1.15, 0, 0]}
      position={[0, -0.2, 0]}
    >
      <mesh
        ref={meshRef}
        renderOrder={0}
      >
        <planeGeometry args={[width, height, segments, segments]} />

        {/* depth-only prepass (same vertex displacement) */}
        <ribbonDepthMaterial
          ref={depthRef}
          attach='customDepthMaterial'
          colorWrite={false}
          depthWrite
          depthTest
          uThickness={0.0}
        />
        {/* additive color pass */}
        <ribbonShaderMaterial
          ref={shaderRef}
          key={RibbonShaderMaterial.key}
          transparent
          blending={THREE.AdditiveBlending}
          depthTest
          depthWrite={false}
          toneMapped={false}
          side={THREE.DoubleSide}
          uTime={timeUniform.current}
          uAmplitude={amplitudeUniform.current}
          uSpeed={1.0}
          uBaseAmp={0.14}
          uAudioAmp={0.8}
          uThickness={0.01} // try 0.01–0.015 later if you want subtle edge thickness
          uColorA={"#7baeff"}
          uColorB={"#d38dd8"}
          uColorC={"#98ccc6"}
          uOpacity={0.42}
        />
      </mesh>
    </group>
  );
};
