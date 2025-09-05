import type { FC } from "react";
import PersonIntro from "../ui/PersonIntro";
import Eoin from "../../assets/people/cSuite/Eoin.jpg";
import ChillGuy from "../../assets/people/cSuite/Chill Guy.png";

const PeopleIntro: FC = () => {
  return (
    <section className='w-full bg-base py-24'>
      <div className='flex flex-col items-center mb-8 text-5xl font-roboto text-secondary font-bold'>
        Meet The Founders
      </div>
      <div className='flex flex-wrap gap-24 justify-evenly'>
        <PersonIntro
          name="Eoin O'Gara"
          link='https://www.linkedin.com/in/eoin-ogara/'
          imageSrc={Eoin}
          imageAlt="Eoin O'Gara Image"
          description='About Eoin'
          role='CEO'
        />
        <PersonIntro
          name='Sam Preston'
          link='https://www.linkedin.com/in/SamuelRMPreston/'
          imageAlt='Sam Preston Image'
          imageSrc={ChillGuy}
          description='About Sam'
          role='COO'
        />
        <PersonIntro
          name='Danny Zheng'
          link='https://www.linkedin.com/in/danny-zheng-257840264/'
          imageAlt='Danny Zheng Image'
          imageSrc={ChillGuy}
          description='About Danny'
          role='CTO'
        />
      </div>
    </section>
  );
};

export default PeopleIntro;
