import { useRef, useState, type FC } from "react";
import { Canvas } from "@react-three/fiber";
import audio1 from "../../assets/audio/demoAudio.wav";
import { DropdownMenu } from "radix-ui";
import PlayAudioFile from "../ui/PlayAudioFile";
import { AudioReactiveRibbon } from "../three/AudioReactiveRibbon";
import { Suspense } from "react";
import { DepthOfField, EffectComposer } from "@react-three/postprocessing";

const audioBooks = [
  {
    title: "Mistborn",
    src: audio1,
    text: "It amazes me how many nations have united behind our purpose. There are still dissenters, of course—and some kingdoms, regrettably, have fallen to wars that I could not stop. Still, this general unity is glorious, even humbling, to contemplate. I wish that the nations of mankind hadn’t required such a dire threat to make them see the value of peace and cooperation.",
    genre: "High Fantasy",
    author: "Brandon Sanderson",
  },
];

const Demo: FC = () => {
  const [selectedAudio, setSelectedAudio] = useState(audioBooks[0]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  return (
    <section className='w-full flex flex-col py-28 my-8 bg-gradient-to-r from-purple-400/20 via-cyan-500/20 to-primary/20 shadow-none [box-shadow:0_-12px_15px_-3px_rgba(0,0,0,0.1),0_12px_15px_-3px_rgba(0,0,0,0.1)]'>
      <div className='relative w-full min-h-[500px]'>
        {/* Background 3D ribbon */}
        <div className='absolute inset-0 z-0'>
          <Canvas camera={{ position: [0, 1.25, 7], fov: 45 }}>
            <EffectComposer>
              <DepthOfField
                focusDistance={0.02} // where sharpness starts
                focalLength={0.035} // the sharp slice thickness
                bokehScale={2.0} // blur strength
              />
            </EffectComposer>
            <ambientLight intensity={0.5} />
            <Suspense fallback={null}>
              <AudioReactiveRibbon
                audioRef={audioRef}
                width={30}
                height={1.5}
                segments={150}
              />
            </Suspense>
          </Canvas>
        </div>

        {/* Foreground content */}
        <div className='relative z-10 flex flex-col lg:flex-row justify-evenly items-center w-full h-full'>
          <div className='max-w-5xl mx-10 rounded-2xl outline-2 outline-secondary/30 bg-secondary/15 shadow-lg ring-1 ring-primary/5 backdrop-blur-lg'>
            <div className='px-4'>
              <div className='relative w-full min-h-[350px] py-4 font-roboto'>
                <div className='mb-2'>{selectedAudio.text}</div>
                <div className='absolute right-0 bottom-0 pr-2 font-roboto italic text-sm'>
                  {selectedAudio.author}
                </div>
              </div>

              <div className='w-full flex flex-row justify-between border-t-1 mt-2 border-secondary/10'>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger>
                    <button className='inline-flex rounded-2xl px-2 py-1 outline-1 outline-secondary/20 my-3 font-roboto font-semibold text-sm'>
                      {selectedAudio.title}
                    </button>
                  </DropdownMenu.Trigger>
                </DropdownMenu.Root>
                <PlayAudioFile
                  audioRef={audioRef}
                  src={selectedAudio.src}
                  className='my-4'
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Demo;
