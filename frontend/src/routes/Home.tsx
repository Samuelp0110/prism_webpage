import type { FC } from "react";
import HeroSection from "../components/Sections/HeroSection";
import PeopleIntro from "../components/Sections/PeopleIntro";
import Workflow from "../components/Sections/Workflow";
import AboutCompany from "../components/Sections/AboutCompany";
import Demo from "../components/Sections/Demo";

const Home: FC = () => {
  return (
    <main className='flex flex-col items-center justify-center bg-base'>
      <HeroSection />
      <AboutCompany />
      <Workflow />
      <Demo />
      <PeopleIntro />
    </main>
  );
};

export default Home;
