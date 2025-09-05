import type { FC } from "react";
import { HoverCard } from "radix-ui";
import { Ellipsis } from "lucide-react";

interface WorkflowNodeProps {
  icon?: FC<{ className?: string }>;
  headline: string;
  hoverCardContent: string;
}

const WorkflowNode: FC<WorkflowNodeProps> = ({
  icon: Icon = Ellipsis, // default to Ellipsis
  headline = "Node headline",
  hoverCardContent = "Information About This Node",
}) => {
  return (
    <section className='flex flex-col w-full items-center py-50 bg-linear-to-r from-white to-secondaryTwo '>
      <HoverCard.Root>
        <HoverCard.Trigger className='flex flex-col items-center justify-center w-[150px] h-[150px] rounded-full'>
          <div className='w-[100px] h-[100px] rounded-full isolate item-center bg-white/10 shadow-lg ring-1 ring-primary/5 backdrop-blur-lg text-secondary flex items-center justify-center'>
            <Icon className='w-full h-full' />
          </div>
          <div className='p-2 text-secondary font-roboto text-lg'>
            {headline}
          </div>
        </HoverCard.Trigger>
        <HoverCard.Portal>
          <HoverCard.Content className='rounded-2xl p-4 font-roboto bg-secondary/10 shadow-lg ring-1 ring-primary/5 backdrop-blur-lg text-secondary'>
            {hoverCardContent}
            <HoverCard.Arrow className='fill-secondary/10 shadow-lg ring-1 ring-primary/5' />
          </HoverCard.Content>
        </HoverCard.Portal>
      </HoverCard.Root>
    </section>
  );
};

export default WorkflowNode;
