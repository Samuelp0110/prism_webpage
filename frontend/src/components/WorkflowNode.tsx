import type { FC } from "react";
import { useState } from "react";

interface WorkflowNodeProps {
  icon: string;
  label: string;
  description: string;
  position: { top: string; left: string }; // % based positioning
}

const WorkflowNode: FC<WorkflowNodeProps> = ({
  icon,
  label,
  description,
  position,
}) => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div
      className='absolute flex flex-col items-center group'
      style={{ top: position.top, left: position.left }}
      onMouseEnter={() => setShowInfo(true)}
      onMouseLeave={() => setShowInfo(false)}
      onClick={() => setShowInfo(!showInfo)}
    >
      <div className='w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg cursor-pointer transition-transform duration-300 hover:scale-105'>
        <img
          src={icon}
          alt={label}
          className='w-8 h-8'
        />
      </div>
      <div className='mt-2 text-sm text-secondary'>{label}</div>

      {showInfo && (
        <div className='absolute top-20 z-10 bg-white/90 text-primary border border-secondary p-3 rounded shadow-md w-60'>
          {description}
        </div>
      )}
    </div>
  );
};

export default WorkflowNode;
