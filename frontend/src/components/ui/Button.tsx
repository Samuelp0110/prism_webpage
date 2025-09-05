// Importing the ReactNode type ONLY (not runtime code), which represents anything React can render
import type { ReactNode } from "react";

// Define the props that our Button component will accept
interface ButtonProps {
  children: ReactNode; // `children` is what will be displayed inside the button (text, icon, etc.)
  onClick?: () => void; // Optional click handler function
  type?: "button" | "submit" | "reset"; // Optional button type (default will be "button")
  className?: string; // Optional additional Tailwind classes for styling customization
}

// Define the reusable Button component
const Button = ({
  children, // Content inside the button
  onClick, // Function to run on click
  type = "button", // Default button type is "button"
  className = "", // Default to empty if no extra styles provided
}: ButtonProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-secondary bg-primary transition-opacity duration-300 hover:opacity-50 font-roboto text-2xl font-semibold ${className}`}
    >
      {children}
    </button>
  );
};

// Export the Button component so it can be used elsewhere
export default Button;
