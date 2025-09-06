import type { FC } from "react";
import { Link } from "react-router";

const CoreLinks: FC = () => {
  return (
    <div className='m-10 flex items-center justify-center gap-x-6 '>
      <Link
        to=''
        className='rounded-md bg-secondary px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs transition duration-200 hover:bg-secondary/80 hover:shadow-lg hover:ring-1 hover:ring-primary/5 hover:backdrop-blur-lg'
      >
        See a Demo
      </Link>
      <Link
        to=''
        className='text-sm font-semibold bg-transparent rounded-md px-3.5 py-2.5 text-black transition duration-200 hover:bg-white/80 hover:shadow-lg hover:ring-1 hover:ring-primary/5 hover:backdrop-blur-lg'
      >
        Learn more <span aria-hidden='true'>→</span>
      </Link>
    </div>
  );
};

export default CoreLinks;
