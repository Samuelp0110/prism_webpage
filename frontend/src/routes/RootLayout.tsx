import { Outlet } from "react-router";
import Navbar from "../components/Navigation/Navbar";
import Footer from "../components/Navigation/Footer";

const RootLayout = () => {
  return (
    <div className='min-h-screen flex flex-col'>
      <Navbar />
      <main className='flex-grow'>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default RootLayout;
