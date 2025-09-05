"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Menu, X } from "lucide-react";
import Button from "../ui/Button";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
  }, [isOpen]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // If scrolling down, hide the navbar
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <nav
      className={`transition-transform duration-300 ease-in-out 
        ${showNavbar ? "translate-y-0" : "-translate-y-full"} 
        sticky top-0 z-50 
        bg-white shadow-lg ring-1 ring-primary/5
        px-6 py-3`}
    >
      <div className='sm:px-16 md:px-16 lg:px-40 mx-auto flex items-center justify-between'>
        {/* Logo that links to homepage */}
        <Link
          to='/'
          className='text-2xl font-bold font-roboto '
        >
          Hartibu Labs
        </Link>

        {/* Desktop Nav */}
        <div className='hidden md:flex items-center gap-10'>
          <div className='flex items-center gap-6'>
            {/* Use Link instead of anchor for SPA routing */}
            <Link
              to=''
              className='text-xl font-roboto transition-colors duration-100 ease-in hover:text-primary'
            >
              About Us
            </Link>
            <Link
              to=''
              className='text-xl font-roboto transition-colors duration-100 ease-in hover:text-primary'
            >
              Demo
            </Link>
          </div>
          <Link to=''>
            <Button className='text-xl transition-colors ease-in'>
              Contact Us
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle Button (hamburger icon) */}
        <div className='md:hidden'>
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label='Toggle Menu'
            className='text-body rounded px-1 py-1 text-2xl'
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
          className='text-[20px] font-cormorant'
          onClick={() => setIsOpen(false)}
        >
          About Us
        </Link>
        <Link
          to='/projects'
          className='text-[20px] font-cormorant '
          onClick={() => setIsOpen(false)}
        >
          Demo
        </Link>
      </div>
    </nav>
  );
}
