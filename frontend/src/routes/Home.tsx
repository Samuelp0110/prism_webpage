import type { FC } from "react";
import HeroSection from "../components/Sections/HeroSection";
import PeopleIntro from "../components/Sections/PeopleIntro";
import WorkflowNode from "../components/ui/WorkflowNode";

const Home: FC = () => {
  return (
    <main className='flex flex-col items-center justify-center bg-base'>
      <HeroSection />
      <PeopleIntro />
      <WorkflowNode />
    </main>
  );
};

export default Home;
