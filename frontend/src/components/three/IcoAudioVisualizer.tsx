import type { FC } from "react";
import { shaderMaterial } from "@react-three/drei";
import { useMemo, useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import audioDemo from "../../assets/audio/demoAudio.wav";
import PlayAudioFile from "../ui/PlayAudioFile";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

type IcoProps = {
  radius?: number;
  detail?: number;
  bassRef?: React.MutableRefObject<number>;
  midRef?: React.MutableRefObject<number>;
  highRef?: React.MutableRefObject<number>;
};

const Vert = `uniform float u_amp;          // overall gain from CPU (mix of bands)
uniform vec3  u_bands;        // x=bass, y=mids, z=highs
varying vec2 vUv;

void main() {
  vUv = uv;

  // orientation-based influences using the vertex normal
  // bass -> equator (low |normal.y|)
  float bassInfluence = 1.0 - abs(normal.y);

  // mids -> front/back (|normal.z| high)
  float midInfluence  = abs(normal.z);

  // highs -> poles (|normal.y| high)
  float highInfluence = abs(normal.y);

  // normalize weights so total stays within reasonable range
  float wSum = bassInfluence + midInfluence + highInfluence + 1e-5;
  vec3 weights = vec3(bassInfluence, midInfluence, highInfluence) / wSum;

  // band drive from CPU
  float bandDrive = dot(u_bands, weights);  // 0..1 approx

  // final displacement along normal
  float disp = u_amp * bandDrive;
  vec3 displaced = position + normal * disp;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}`;

const Frag = `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
varying vec2 vUv;

// small cosine palette (nice, soft cycling colors)
vec3 palette(float t){
  return 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + t));
}

void main() {
  // subtle vertical stripe that scrolls over time
  float stripe = 0.5 + 0.5 * sin( (vUv.y * 4.0 - u_time * 0.6) * 6.28318 );

  // color changes slowly with time; stripe modulates brightness
  vec3 color = palette(u_time * 0.15) * mix(0.6, 1.0, stripe);

  gl_FragColor = vec4(color, 1.0);
}`;

const Uniforms = {
  u_time: 0,
  u_resolution: new THREE.Vector2(1, 1),
  u_amp: 0,
  u_bands: new THREE.Vector3(0, 0, 0), // bass, mids, highs
};

const IcoShaderMaterial = shaderMaterial(Uniforms, Vert, Frag);

const IcoMesh: FC<IcoProps> = ({
  radius = 4,
  detail = 30,
  bassRef,
  midRef,
  highRef,
}) => {
  const material = useMemo(() => new IcoShaderMaterial(), []);
  material.wireframe = true;

  //   const meshRef = useRef<THREE.Mesh>(null);

  // keep u_resolution in device pixels (because we’ll use gl_FragCoord)
  const { size, gl } = useThree();
  useEffect(() => {
    const dpr = gl.getPixelRatio();
    material.uniforms.u_resolution.value.set(
      size.width * dpr,
      size.height * dpr
    );
  }, [size, gl, material]);

  // tick u_time every frame
  useFrame(({ clock }) => {
    material.uniforms.u_time.value = clock.getElapsedTime();

    const b = bassRef?.current ?? 0;
    const m = midRef?.current ?? 0;
    const h = highRef?.current ?? 0;

    // overall amplitude floor + gain from mixed bands
    const overall = 0.12 + (0.7 * b + 0.5 * m + 0.35 * h) * 1.2;
    const current = material.uniforms.u_amp.value as number;
    material.uniforms.u_amp.value = THREE.MathUtils.lerp(
      current,
      overall,
      0.15
    );

    material.uniforms.u_bands.value.set(b, m, h);
  });

  return (
    <mesh /* ref={meshRef} if rotating */>
      <icosahedronGeometry args={[radius, detail]} />
      <primitive
        attach='material'
        object={material}
      />
    </mesh>
  );
};

const IcoAudioVisualizer: FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null); // Web Audio context
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const levelRef = useRef(0); // <-- live audio level 0..1
  const rafRef = useRef<number | null>(null);
  const timeBufRef = useRef<Float32Array | null>(null);
  const bassRef = useRef(0);
  const midRef = useRef(0);
  const highRef = useRef(0);
  const freqBufRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const Ctor = window.AudioContext ?? window.webkitAudioContext;
    if (!Ctor) return;

    const onPlay = async () => {
      if (!audioCtxRef.current) audioCtxRef.current = new Ctor();
      const ctx = audioCtxRef.current!;
      if (ctx.state === "suspended") await ctx.resume();

      if (!sourceRef.current) {
        sourceRef.current = ctx.createMediaElementSource(el);
      }
      if (!analyserRef.current) {
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.7;
        analyserRef.current = analyser;
        sourceRef.current.connect(analyser);
      }

      // --- start RAF loop to compute level (RMS of time-domain) ---
      const analyser = analyserRef.current!;
      if (!timeBufRef.current) {
        timeBufRef.current = new Float32Array(analyser.fftSize);
      }
      if (rafRef.current == null) {
        const loop = () => {
          const analyser = analyserRef.current!;
          const timeBuf = timeBufRef.current!;
          // keep time-domain if you still use levelRef
          (analyser.getFloatTimeDomainData as (a: Float32Array) => void)(
            timeBuf
          );

          // --- NEW: frequency-domain for bands ---
          if (!freqBufRef.current) {
            freqBufRef.current = new Uint8Array(analyser.frequencyBinCount);
          }
          const freq = freqBufRef.current;
          analyser.getByteFrequencyData(freq);

          // simple index ranges (low/mid/high)
          const n = freq.length;
          const iBassEnd = Math.floor(n * 0.12); // ~0–12% of spectrum
          const iMidEnd = Math.floor(n * 0.5); // ~12–50%
          // bass avg
          let s = 0,
            c = 0;
          for (let i = 0; i < iBassEnd; i++) {
            s += freq[i];
            c++;
          }
          const bass = c ? s / (c * 255) : 0;

          // mids avg
          s = 0;
          c = 0;
          for (let i = iBassEnd; i < iMidEnd; i++) {
            s += freq[i];
            c++;
          }
          const mids = c ? s / (c * 255) : 0;

          // highs avg
          s = 0;
          c = 0;
          for (let i = iMidEnd; i < n; i++) {
            s += freq[i];
            c++;
          }
          const highs = c ? s / (c * 255) : 0;

          // smooth them a touch
          const a = 0.15; // smoothing factor
          bassRef.current = (1 - a) * bassRef.current + a * bass;
          midRef.current = (1 - a) * midRef.current + a * mids;
          highRef.current = (1 - a) * highRef.current + a * highs;

          // (optional) keep your RMS levelRef if you still use it
          // ...

          rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
      }
    };

    const stop = () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      levelRef.current = 0;
    };

    el.addEventListener("play", onPlay);
    el.addEventListener("pause", stop);
    el.addEventListener("ended", stop);

    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", stop);
      el.removeEventListener("ended", stop);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className='relative w-[420px] aspect-square'>
      {" "}
      {/* give it some size */}
      <Canvas
        dpr={[1, 2]}
        camera={{ fov: 30, position: [0, 0, 100] }}
      >
        <IcoMesh
          radius={20}
          detail={30}
          bassRef={bassRef}
          midRef={midRef}
          highRef={highRef}
        />
      </Canvas>
      {/* centered overlay */}
      <div
        className='absolute left-1/2 top-1/2'
        style={{ transform: "translate(-50%, -50%)", zIndex: 10 }}
      >
        <PlayAudioFile
          src={audioDemo}
          audioRef={audioRef}
        />
      </div>
    </div>
  );
};

export default IcoAudioVisualizer;
