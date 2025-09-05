"use client"; // Safe to ignore in a Vite + React SPA, usually a Next.js directive

import { useEffect, useState } from "react";
import { Link } from "react-router"; // React Router v7
import { Menu, X } from "lucide-react";
import Button from "../Core/Button";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false); // Tracks mobile menu toggle

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
  }, [isOpen]);

  return (
    <nav className='w-full px-6 py-4 bg-base border-b-2 border-secondary'>
      <div className='px-40 mx-auto flex items-center justify-between'>
        {/* Logo that links to homepage */}
        <Link
          to='/'
          className='text-[32px] md:text-[44px] font-bold font-roboto text-secondary'
        >
          Hartibu Labs
        </Link>

        {/* Desktop Nav */}
        <div className='hidden md:flex items-center gap-10'>
          <div className='flex items-center gap-6'>
            {/* Use Link instead of anchor for SPA routing */}
            <Link
              to=''
              className='text-[20px] md:text-[24px] px-2 font-roboto text-secondary hover:bg-primary'
            >
              About Us
            </Link>
            <Link
              to=''
              className='text-[20px] md:text-[24px] px-2 font-roboto text-secondary'
            >
              Demo
            </Link>
          </div>
          <Button>Contact Us</Button>
        </div>

        {/* Mobile Toggle Button (hamburger icon) */}
        <div className='md:hidden'>
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label='Toggle Menu'
            className='text-body border-2 border-body rounded px-1 py-1 text-2xl'
          >
            {isOpen ? <X color='#0C0B22' /> : <Menu color='#0C0B22' />}
          </button>
        </div>
      </div>

      {/* Mobile Menu with Animation */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden flex flex-col items-center gap-4 ${
          isOpen ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
        }`}
      >
        <Link
          to='/about'
          className='text-[20px] font-cormorant text-background'
          onClick={() => setIsOpen(false)}
        >
          About Me
        </Link>
        <Link
          to='/projects'
          className='text-[20px] font-cormorant text-primary'
          onClick={() => setIsOpen(false)}
        >
          Projects
        </Link>
      </div>
    </nav>
  );
}
