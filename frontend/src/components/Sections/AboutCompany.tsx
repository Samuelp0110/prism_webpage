import type { FC } from "react";

type AboutCompanyProps = {
  id: string;
};

const AboutCompany: FC<AboutCompanyProps> = ({ id }) => {
  return (
    <section id={id}>
      <div>About Company Section</div>
    </section>
  );
};

export default AboutCompany;
