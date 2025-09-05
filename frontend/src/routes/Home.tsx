import type { FC } from "react";
import HeroSection from "../components/HeroSection";
import PeopleIntro from "../components/PeopleIntro";

const Home: FC = () => {
  return (
    <main className='flex flex-col items-center justify-center bg-base'>
      <HeroSection />
      <PeopleIntro />
    </main>
  );
};

export default Home;
