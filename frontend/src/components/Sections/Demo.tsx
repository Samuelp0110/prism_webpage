import type { FC } from "react";

const Demo: FC = () => {
  return (
    <section className='w-full p-16 bg-gradient-to-r from-purple-400/20 via-cyan-500/20 to-primary/20'>
      <div className='flex justify-evenly items-center'>
        <div className='max-w-3/8 bg-secondary/15 shadow-lg ring-1 ring-primary/5 backdrop-blur-lg rounded-2xl p-28'>
          The Text Passage used in the Demo Audio File
        </div>
        <div className='max-w-3/8 p-28'>Audio</div>
      </div>
    </section>
  );
};

export default Demo;
