import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";

// Vertex shader (GLSL)
const vertexShader = `
  varying vec2 vUv;
  uniform float uTime;

  void main() {
    vUv = uv;
    vec3 pos = position;

    float wave = sin(pos.x * 4.0 + uTime * 1.5) * 0.1;
    pos.z += wave;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Fragment shader (GLSL)
const fragmentShader = `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uTime;

  void main() {
    float strength = sin(vUv.x * 10.0 + uTime * 2.0) * 0.5 + 0.5;
    vec3 color = mix(vec3(0.1, 0.1, 0.2), uColor, strength);
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Create and export the shader material
const WaveShaderMaterial = shaderMaterial(
  { uTime: 0, uColor: new THREE.Color(0.2, 0.6, 1.0) },
  vertexShader,
  fragmentShader
);

extend({ WaveShaderMaterial });

export { WaveShaderMaterial };
