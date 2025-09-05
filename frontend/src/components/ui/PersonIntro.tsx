import type { FC } from "react";
import NoImage from "../../../public/NoImage.svg";

interface PersonIntroProps {
  name: string;
  imageSrc: string;
  imageAlt: string;
  link: string;
  description: string;
  role: string;
}

const PersonIntro: FC<PersonIntroProps> = ({
  name = "Person Name",
  imageSrc = NoImage,
  imageAlt = "Person Image",
  link = "https://www.linkedin.com/",
  description = "Person Bio",
  role,
}) => {
  return (
    <div className='flex flex-col items-center p-12'>
      <div className='py-t-4 font-roboto font-semibold sm:text-xl md:text-2xl lg:text-3xl text-secondary '>
        {name}
      </div>
      <div className='font-roboto font-semibold sm:text-lg md:text-xl lg:text-2xl text-primary '>
        {role}
      </div>
      <a href={link}>
        {" "}
        <img
          src={imageSrc}
          alt={imageAlt}
          className='w-[200px] h-[200px] rounded-full border border-secondary object-cover'
        />
      </a>

      <div className='py-4 font-roboto font-bold sm:text-md md:text-lg lg:text-xl text-secondary '>
        {description}
      </div>
    </div>
  );
};

export default PersonIntro;
