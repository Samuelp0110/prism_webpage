import type { FC } from "react";
import audioDemo from "../../assets/audio/demoAudio.wav";
import IcoAudioPlayer from "../ui/IcoAudioPlayer";

const Demo: FC = () => {
  return (
    <section className='w-full flex flex-col p-16 bg-gradient-to-r from-purple-400/20 via-cyan-500/20 to-primary/20'>
      <div className='flex justify-evenly items-center'>
        <div className='bg-secondary/15 shadow-lg ring-1 ring-primary/5 backdrop-blur-lg rounded-2xl p-6'>
          The Text Passage used in the Demo Audio File
        </div>
        <div className='flex-1 max-w-3/8'>
          <IcoAudioPlayer
            src={audioDemo}
            icoRadius={15}
          />
        </div>
      </div>
    </section>
  );
};

export default Demo;
