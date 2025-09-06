import type { FC } from "react";
import { lazy, Suspense } from "react";

const WebGLCanvas = lazy(() => import("../three/WebGLCanvas"));

const HeroSection: FC = () => {
  return (
    <section className='relative w-full justify-center py-48 bg-white overflow-hidden'>
      {/* 🔵 WebGL shader background */}
      <Suspense fallback={null}>
        <WebGLCanvas />
      </Suspense>
      {/* 🧾 Foreground content */}

      <div className='relative z-10 flex justify-evenly p-16'>
        <div className='max-w-4xl font-roboto'>
          <div className='text-background text-7xl font-bold pb-10'>
            Let Your Book Be{" "}
            <a className='text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-500 to-primary'>
              Heard
            </a>
          </div>
          <div className='text-background text-3xl font-semibold'>
            We take your novel and give you an Audiobook with Voice Acting
            powered by AI, beautiful music, and perfectly placed sounds
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
