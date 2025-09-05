import { ShaderMaterial } from "three";
import { Object3DNode } from "@react-three/fiber";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      waveShaderMaterial: Object3DNode<ShaderMaterial, typeof ShaderMaterial>;
    }
  }
}

export {};
