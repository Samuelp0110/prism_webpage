import type { FC } from "react";

const HeroSection: FC = () => {
  return (
    <section className='w-full justify-center py-48 bg-linear-to-l from-white to-primary'>
      <div className='flex justify-evenly p-16'>
        <div className='max-w-4xl opacity-50 font-roboto'>
          <div className='text-background text-7xl font-bold pb-10'>
            Letting Books be Heard
          </div>
          <div className='text-background text-3xl font-semibold'>
            We mix AI voice models, premium sounds and beautiful music together
            to make sure your book isn't just told, it's heard
          </div>
        </div>
        <div className='bg-black opacity-50 p-16 text-background font-roboto'>
          Hello
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
