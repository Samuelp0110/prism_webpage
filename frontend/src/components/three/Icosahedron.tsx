import type { FC, RefObject } from "react";
import { useEffect, useRef } from "react";
import { Canvas, extend, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";

declare global {
  interface Window {
    webkitAudioContext?: { new (): AudioContext };
    __appAudioCtx?: AudioContext; // singleton across HMR
  }
}

type IcoProps = {
  color?: THREE.ColorRepresentation; // 👈 allow string | number | THREE.Color
  radius?: number;
  detail?: number;
  autoRotate?: boolean;
  rotationSpeed?: number;
  className?: string;
  background?: string | null;
  audioRef?: RefObject<HTMLAudioElement | null>;
};

type IcoUniforms = {
  u_time: THREE.IUniform<number>;
  u_color: THREE.IUniform<THREE.Color>;
  u_resolution: THREE.IUniform<THREE.Vector2>;
  u_audio: THREE.IUniform<number>; // 0..1 envelope
  u_frequency: THREE.IUniform<number>; // 0..255 mirror (optional)
  u_peak: THREE.IUniform<number>;
};

const vert = `
uniform float u_time;
uniform float u_audio;      // 0..1 envelope
uniform float u_frequency;  // optional 0..255 mirror
uniform float u_peak;       // 0..1 transient impulse (for bounce)

varying vec3 vNormal;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+10.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec3 fade(vec3 t){ return t*t*t*(t*(t*6.0-15.0)+10.0); }

float pnoise(vec3 P, vec3 rep) {
  vec3 Pi0 = mod(floor(P), rep);
  vec3 Pi1 = mod(Pi0 + vec3(1.0), rep);
  Pi0 = mod289(Pi0); Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P); vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz; vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));

  float n000 = norm0.x * dot(g000, Pf0);
  float n010 = norm0.y * dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n100 = norm0.z * dot(g100, vec3(Pf1.x, Pf0.yz));
  float n110 = norm0.w * dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = norm1.x * dot(g001, vec3(Pf0.xy, Pf1.z));
  float n011 = norm1.y * dot(g011, vec3(Pf0.x, Pf1.yz));
  float n101 = norm1.z * dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n111 = norm1.w * dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}

void main() {
  // ---- Tunables ----
  const float NOISE_FREQ   = 0.85;
  const float NOISE_SPEED  = 0.18;
  const float NOISE_GAIN   = 0.98;
  const float BASE_GAIN    = 0.16;

  // Bounce feel
  const float PEAK_FREQ    = 50.0;  // Hz-ish feel of the bounce wobble
  const float PEAK_AMP     = 0.90; // how much bounce scales displacement
  // -------------------

  // Continuous evolving noise (no breathing)
  float n = pnoise(position * NOISE_FREQ + vec3(u_time * NOISE_SPEED), vec3(10.0));
  float n01 = 0.5 + 0.5 * n;

  // Sharpen peaks with audio level (0..1)
  float exponent = mix(1.6, 0.55, clamp(u_audio, 0.0, 1.0));  // quiet->soft, loud->sharp
  float nShaped  = pow(n01, exponent);

  // Base size grows with audio
  float gain = BASE_GAIN + NOISE_GAIN * mix(0.0, 1.25, clamp(u_audio, 0.0, 1.0));

  // 🔔 Bounce: a small oscillation whose amplitude follows u_peak (decays in JS),
  // multiplied into displacement so it “rings” around peaks
  float bounce = 1.0 + PEAK_AMP * u_peak * sin(u_time * PEAK_FREQ * 6.28318);

  float displacement = gain * nShaped * bounce;

  // (lighting)
  vNormal = normalize(normalMatrix * normal);

  vec3 newPosition = position + normal * displacement;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;

const frag = `
precision highp float;

uniform vec3 u_color;
uniform vec3 u_lightDir;     // view-space light direction
uniform vec3 u_lightColor;   // usually white
uniform vec3 u_shadowColor;  // your tinted “dark side”
uniform float u_ambient;     // 0..1 ambient amount

varying vec3 vNormal;

void main() {
  vec3 N = normalize(vNormal);
  vec3 L = normalize(u_lightDir);

  float lambert = max(dot(N, L), 0.0);

  // shadow base is a tint between shadow color and base color, weighted by ambient
  vec3 shadow = mix(u_shadowColor, u_color, clamp(u_ambient, 0.0, 1.0));

  // blend from shadow → lit color by lambert
  vec3 lit = mix(shadow, u_color * u_lightColor, lambert);

  gl_FragColor = vec4(lit, 1.0);
}

`;

// Use plain defaults (not { value: ... })
const IcoShaderMaterial = shaderMaterial(
  {
    u_time: 0,
    u_color: new THREE.Color("#b7ff00"),
    u_resolution: new THREE.Vector2(1, 1),
    u_audio: 0,
    u_frequency: 0,
    u_peak: 0,

    // NEW lighting uniforms
    u_lightDir: new THREE.Vector3(0.5, 0.8, 0.95).normalize(), // view-space dir
    u_lightColor: new THREE.Color(1, 1, 1),
    u_ambient: 0.25, // slight ambient so the dark side is visible
    u_shadowColor: new THREE.Color(0.9, 0.6, 0.9), // dark purple, for example
  },
  vert,
  frag
);

// register as JSX element
extend({ IcoShaderMaterial });

type IcoMeshProps = Omit<IcoProps, "className" | "background"> & {
  materialRef: React.MutableRefObject<THREE.ShaderMaterial | null>;
};

const IcoMesh: FC<IcoMeshProps> = ({
  color = "#b7ff00",
  radius = 4,
  detail = 30,
  autoRotate = false,
  rotationSpeed = 0.6,
  materialRef,
}) => {
  const meshRef = useRef<THREE.Mesh | null>(null);

  useFrame((state, delta) => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.y += rotationSpeed * delta;
      meshRef.current.rotation.x += rotationSpeed * 0.4 * delta;
    }
    if (materialRef.current?.uniforms?.u_time) {
      materialRef.current.uniforms.u_time.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[radius, detail]} />
      <primitive
        object={(() => {
          const mat = new IcoShaderMaterial({
            u_time: 0,
            u_color: new THREE.Color(color as THREE.ColorRepresentation),
            u_resolution: new THREE.Vector2(1, 1),
            u_audio: 0,
            u_frequency: 0,
            u_peak: 0,
          });
          mat.wireframe = true; // 👈 wireframe mode enabled here
          return mat;
        })()}
        attach='material'
        ref={(m: THREE.ShaderMaterial | null) => {
          materialRef.current = m;
          if (materialRef.current?.uniforms?.u_color) {
            materialRef.current.uniforms.u_color.value = new THREE.Color(
              color as THREE.ColorRepresentation
            );
          }
        }}
      />
    </mesh>
  );
};

const Icosahedron: FC<IcoProps> = ({
  className,
  background = null,
  audioRef,
  ...meshProps
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  // u_resolution from container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      if (materialRef.current?.uniforms?.u_resolution) {
        materialRef.current.uniforms.u_resolution.value.set(width, height);
      }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    return () => observer.disconnect();
  }, []);

  // --- Audio analysis — StrictMode-safe singleton + split routing ---
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    const el = audioRef?.current;
    if (!el || initializedRef.current) return;

    initializedRef.current = true;

    // 1) Singleton AudioContext
    const AudioCtxCtor = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioCtxCtor) {
      console.warn("Web Audio API not supported.");
      return;
    }
    if (!window.__appAudioCtx) {
      window.__appAudioCtx = new AudioCtxCtor();
    }
    audioCtxRef.current = window.__appAudioCtx;
    const ctx = audioCtxRef.current;

    const onStateChange = () => console.log("[AudioContext] state:", ctx.state);
    ctx.addEventListener?.("statechange", onStateChange);
    console.log("[AudioContext] init:", ctx.state);

    // 2) Ensure running on various triggers
    const ensureRunning = () => {
      if (ctx.state !== "running") {
        void ctx
          .resume()
          .catch((e) => console.warn("AudioContext resume failed:", e));
      }
    };

    const onUserAudioPlay = () => ensureRunning();
    window.addEventListener("user-audio-play", onUserAudioPlay);

    const onPointerDown = () => {
      document.removeEventListener("pointerdown", onPointerDown);
      ensureRunning();
    };
    document.addEventListener("pointerdown", onPointerDown, { once: true });

    const onPlay = () => ensureRunning();
    const onPlaying = () => ensureRunning();
    el.addEventListener("play", onPlay);
    el.addEventListener("playing", onPlaying);

    const onVisibility = () => {
      if (!document.hidden) ensureRunning();
    };
    const onPageShow = () => ensureRunning();
    const onFocus = () => ensureRunning();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("focus", onFocus);

    if (!el.paused) ensureRunning();

    // 3) create/reuse graph (split: source→analyser & source→destination)
    if (!sourceRef.current) {
      try {
        sourceRef.current = ctx.createMediaElementSource(el);
      } catch (e) {
        console.warn(
          "MediaElementSource already exists for this <audio>; reusing.",
          e
        );
      }
    }
    if (!analyserRef.current) {
      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = 64;
      if (sourceRef.current) {
        sourceRef.current.connect(analyserRef.current); // analysis
        sourceRef.current.connect(ctx.destination); // playback (audible)
      }
    }

    // 4) drive u_frequency (smoothed & clamped); grayscale frag will show it
    const analyser = analyserRef.current!;
    const data = new Uint8Array(analyser.frequencyBinCount);

    // Main envelope (0..1)
    let env = 0;
    const ATTACK = 0.25;
    const DECAY = 0.06;

    // Fast vs slow envelope for transient detection
    let envFast = 0;
    let envSlow = 0;
    const A_FAST = 0.5; // reacts quickly
    const A_SLOW = 0.06; // lags behind

    // Short-lived impulse that we’ll send to the shader
    let peakImpulse = 0;
    const PEAK_DECAY = 0.9; // 0.9..0.96 feels good

    const tick = () => {
      analyser.getByteFrequencyData(data);

      // Bass-weighted level 0..1 (feel free to use full average if you prefer)
      const N = Math.min(12, data.length);
      const bass = N
        ? data.slice(0, N).reduce((a, v) => a + v, 0) / (N * 255)
        : 0;

      // Main envelope (smooth, no pops)
      const target = Math.min(1, Math.max(0, bass));
      const rate = target > env ? ATTACK : DECAY;
      env += (target - env) * rate;

      // Transient detector: fast-minus-slow rise -> positive on attacks
      envFast += (target - envFast) * A_FAST;
      envSlow += (target - envSlow) * A_SLOW;
      const transient = Math.max(0, envFast - envSlow); // 0..1

      // Convert transient into a short impulse with decay (no “reset”)
      peakImpulse = Math.max(peakImpulse * PEAK_DECAY, transient * 1.6); // scale gives punch, adjust to taste
      peakImpulse = Math.min(1, peakImpulse);

      // Send uniforms (typed)
      const u = materialRef.current?.uniforms as IcoUniforms | undefined;
      if (u) {
        u.u_audio.value = env; // 0..1 envelope
        u.u_frequency.value = env * 255; // optional mirror
        // 👇 NEW
        u.u_peak.value = peakImpulse;
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    el.addEventListener("play", () => console.log("▶️ audio play event"));

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("user-audio-play", onUserAudioPlay);
      document.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("playing", onPlaying);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("focus", onFocus);
      ctx.removeEventListener?.("statechange", onStateChange);
      try {
        analyserRef.current?.disconnect();
      } catch (e) {
        console.warn("Analyser disconnect failed:", e);
      }
      initializedRef.current = false;
    };
  }, [audioRef]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ fov: 30, position: [0, 0, 100] }}
        onCreated={({ gl }) => {
          if (background === null) gl.setClearAlpha(0);
          else gl.setClearColor(new THREE.Color(background), 1);
        }}
      >
        <IcoMesh
          {...meshProps}
          materialRef={materialRef}
        />
      </Canvas>
    </div>
  );
};

export default Icosahedron;
