import type { FC } from "react";
import { HoverCard } from "radix-ui";
import { Ellipsis } from "lucide-react";

interface WorkflowNodeProps {
  icon?: FC<{ className?: string }>;
  headline: string;
  hoverCardContent: string;
  id: string;
}

const WorkflowNode: FC<WorkflowNodeProps> = ({
  icon: Icon = Ellipsis,
  headline = "Node headline",
  hoverCardContent = "Information About This Node",
  id,
}) => {
  return (
    <HoverCard.Root openDelay={0}>
      <HoverCard.Trigger
        id={id}
        className='relative flex flex-col items-center justify-center w-[180px] h-[180px] rounded-full m-8'
      >
        <span
          id={`${id}--top`}
          className='pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 opacity-0'
        />
        <span
          id={`${id}--right`}
          className='pointer-events-none absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-1 h-1 opacity-0'
        />
        <span
          id={`${id}--bottom`}
          className='pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1 h-1 opacity-0'
        />
        <span
          id={`${id}--left`}
          className='pointer-events-none absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 opacity-0'
        />

        <div className='w-[100px] h-[100px] rounded-full isolate item-center bg-white/10 shadow-lg ring-1 ring-primary/5 backdrop-blur-lg text-secondary flex items-center justify-center'>
          <Icon className='w-8/10 h-8/10' />
        </div>
        <div className='p-2 text-secondary font-roboto text-lg'>{headline}</div>
      </HoverCard.Trigger>

      <HoverCard.Portal>
        <HoverCard.Content
          className='
          data-[side=bottom]:animate-slide-up-and-fade data-[side=top]:animate-slide-down-and-fade
          data-[side=left]:animate-slide-right-and-fade data-[side=right]:animate-slide-left-and-fade 
          max-w-sm inline-block text-center p-4 font-roboto bg-secondary/10 shadow-lg ring-1 ring-primary/5 backdrop-blur-lg rounded-2xl text-secondary'
        >
          {hoverCardContent}
          <HoverCard.Arrow className='fill-secondary/10 shadow-lg ring-1 ring-primary/5' />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
};

export default WorkflowNode;
export type { WorkflowNodeProps };
