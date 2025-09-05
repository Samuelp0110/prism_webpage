import { Instagram, Linkedin } from "lucide-react";
import { Link } from "react-router"; // React Router v7

const Footer: React.FC = () => {
  return (
    <footer className='w-full px-6 py-6 bg-background border-t-2'>
      <div className='px-40 mx-auto flex items-center justify-between'>
        {/* Name */}
        <Link
          to='/'
          className='text-[18px] md:text-[24px] font-bold font-roboto text-secondary'
        >
          Hartibu Labs
        </Link>

        {/* Social Icons */}
        <div className='flex items-center gap-6'>
          <a
            href='https://www.linkedin.com/in/SamuelRMPreston/'
            target='_blank'
            rel='noopener noreferrer'
            aria-label='Linkedin'
            className='text-secondary hover:text-accent transition-colors duration-300'
          >
            <Linkedin size={24} />
          </a>
          <a
            href='https://www.instagram.com/sampreston110/'
            target='_blank'
            rel='noopener noreferrer'
            aria-label='Instagram'
            className='text-secondary hover:text-accent transition-colors duration-300'
          >
            <Instagram size={24} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
