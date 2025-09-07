import type { FC } from "react";
import HeroSection from "../components/Sections/HeroSection";
import PeopleIntro from "../components/Sections/PeopleIntro";
import Workflow from "../components/Sections/Workflow";
import AboutCompany from "../components/Sections/AboutCompany";
import Demo from "../components/Sections/Demo";
import CoreLinks from "../components/Navigation/CoreLinks";

const Home: FC = () => {
  return (
    <main className='flex flex-col items-center justify-center bg-base'>
      <HeroSection />
      <CoreLinks />
      <AboutCompany />
      <div className='font-roboto font-bold py-10 text-secondary text-4xl'>
        Our Workflow
      </div>
      <Workflow />
      <Demo />

      <PeopleIntro />
    </main>
  );
};

export default Home;
