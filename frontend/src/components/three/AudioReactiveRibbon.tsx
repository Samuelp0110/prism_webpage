import { shaderMaterial } from "@react-three/drei";
import { extend, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Mesh } from "three";
import type { ColorRepresentation } from "three";

type RibbonProps = {
  width?: number;
  height?: number;
  segments?: number;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
  colors?: {
    primary: ColorRepresentation;
    secondary: ColorRepresentation;
    tertiary: ColorRepresentation;
  };
  opacity?: number;
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

  uniform vec3 uColorPrimary;   // center
  uniform vec3 uColorSecondary; // between
  uniform vec3 uColorTertiary;  // edges
  uniform float uOpacity;

  // helper: mix c1->c2 over [a..b] with smoothstep
  vec3 smoothband(vec3 c1, vec3 c2, float t, float a, float b){
    float x = clamp((t - a) / max(1e-5, (b - a)), 0.0, 1.0);
    float s = smoothstep(0.0, 1.0, x);
    return mix(c1, c2, s);
  }

  void main() {
    float t = clamp(vUv.y, 0.0, 1.0);

    // symmetric stops: 0.0 T → 0.33 S → 0.5 P → 0.67 S → 1.0 T
    vec3 col;
    if (t < 0.5) {
      // 0..0.33: T -> S, 0.33..0.5: S -> P
      vec3 a = smoothband(uColorTertiary, uColorSecondary, t, 0.0, 0.25);
      vec3 b = smoothband(uColorSecondary, uColorPrimary,  t, 0.25, 0.3);
      // blend the two segments (they overlap near 0.33)
      col = mix(a, b, smoothstep(0.2, 0.5, t));
    } else {
      // 0.5..0.67: P -> S, 0.67..1.0: S -> T
      vec3 a = smoothband(uColorPrimary,  uColorSecondary, t, 0.8, 0.90);
      vec3 b = smoothband(uColorSecondary,uColorTertiary,  t, 0.90, 1.0);
      col = mix(a, b, smoothstep(0.5, 0.8, t));
    }

    // soft horizontal edge falloff (halo)
    float distFromCenter = abs(vUv.x - 0.5) * 2.0;
    float coreBoost = mix(1.15, 1.0, distFromCenter);
    col *= coreBoost;
    float edgeFade = 1.0 - smoothstep(0.9, 1.0, distFromCenter);

    gl_FragColor = vec4(col, uOpacity * edgeFade);
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
    uThickness: 0.0,

    // 🎨 new
    uColorPrimary: new THREE.Color("#d38dd8"),
    uColorSecondary: new THREE.Color("#98ccc6"),
    uColorTertiary: new THREE.Color("#7baeff"),
    uOpacity: 0.45,
  },
  vert,
  frag
);

extend({ RibbonShaderMaterial });
extend({ RibbonDepthMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    ribbonShaderMaterial: ThreeElements["meshStandardMaterial"] & {
      uTime?: number;
      uAmplitude?: number;
      uSpeed?: number;
      uBaseAmp?: number;
      uAudioAmp?: number;
      uThickness?: number;
      uColorPrimary?: ColorRepresentation;
      uColorSecondary?: ColorRepresentation;
      uColorTertiary?: ColorRepresentation;
      uOpacity?: number;
    };
    ribbonDepthMaterial: ThreeElements["meshDepthMaterial"] & {
      uTime?: number;
      uAmplitude?: number;
      uSpeed?: number;
      uBaseAmp?: number;
      uAudioAmp?: number;
      uThickness?: number;
      colorWrite?: boolean;
    };
  }
}

export const AudioReactiveRibbon: React.FC<RibbonProps> = ({
  width = 20,
  height = 4,
  segments = 100,
  audioRef,
  colors, // ✅ pull from props
  opacity = 0.42, // ✅ optional default
}) => {
  const meshRef = useRef<Mesh>(null);
  const depthRef = useRef<THREE.ShaderMaterial>(null);
  const ampSmooth = useRef(0);

  const targetPrimary = useRef(new THREE.Color("#7baeff"));
  const targetSecondary = useRef(new THREE.Color("#d38dd8"));
  const targetTertiary = useRef(new THREE.Color("#98ccc6"));

  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // external control holders
  const timeUniform = useRef(0);
  const amplitudeUniform = useRef(0);

  useEffect(() => {
    if (!colors) return;
    targetPrimary.current.set(colors.primary);
    targetSecondary.current.set(colors.secondary);
    targetTertiary.current.set(colors.tertiary);
  }, [colors]);

  useFrame(({ clock }) => {
    const shader = shaderRef.current;
    const depth = depthRef.current;
    if (!shader) return;

    const mat = shaderRef.current;
    if (!mat) return;

    const time = clock.getElapsedTime();

    let intensity = 0;
    const analyser = analyserRef.current;
    const data = dataArrayRef.current;
    if (analyser && data) {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((s, v) => s + v, 0) / data.length;
      intensity = avg / 256;
    }

    // lerp current material colors toward targets
    const lerpT = 0.08; // lower = slower, smoother
    (mat.uniforms.uColorPrimary.value as THREE.Color).lerp(
      targetPrimary.current,
      lerpT
    );
    (mat.uniforms.uColorSecondary.value as THREE.Color).lerp(
      targetSecondary.current,
      lerpT
    );
    (mat.uniforms.uColorTertiary.value as THREE.Color).lerp(
      targetTertiary.current,
      lerpT
    );
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
          uThickness={0.01}
          /* 🎨 initial values; the useFrame lerp will smoothly move to new targets */
          uColorPrimary={colors?.primary ?? "#7baeff"}
          uColorSecondary={colors?.secondary ?? "#d38dd8"}
          uColorTertiary={colors?.tertiary ?? "#98ccc6"}
          uOpacity={opacity}
        />
      </mesh>
    </group>
  );
};
