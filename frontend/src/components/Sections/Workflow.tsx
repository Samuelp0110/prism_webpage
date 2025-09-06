import type { FC } from "react";
import WorkflowNode from "../ui/WorkflowNode";
import ResponsiveAnchorArrowAuto from "../ui/ResponsiveAnchorArrowAuto";
import { BookText } from "lucide-react";

const Workflow: FC = () => {
  return (
    <section
      id='workflow-scope'
      className='relative flex flex-col items-center justify-center isolate w-full bg-linear-to-r from-white to-primary/20 py-24'
    >
      <div className='w-full flex flex-wrap items-center justify-evenly'>
        {/* your nodes */}
        <WorkflowNode
          id='wf-1'
          headline='Upload Your Novel'
          icon={BookText}
          hoverCardContent='Upload your novel to us in any of the available formats'
        />
        <WorkflowNode
          id='wf-2'
          headline='We Break It Down'
          hoverCardContent='We break it down into smaller, bite-size pieces like 
          chapters, sentences, and even plain old words'
        />
        <WorkflowNode
          id='wf-3'
          headline='AI Detects Meaning'
          hoverCardContent='Our AI Models detects meaning to every part of your novel, whether it be the emotion in a scene or a characters personality'
        />
        <WorkflowNode
          id='wf-4'
          headline='Put It Back Together'
          hoverCardContent='The AI now pieces the entire novel back together, now with directive for every scene, such as emotion, needed voices, music, sounds and more'
        />
        <WorkflowNode
          id='wf-5'
          headline='Get Your Audiobook'
          hoverCardContent='Lastly the AI generates your audiobook from the script and outputs it to you as an mp3 file, ready for you to use however you would like'
        />

        {/* your arrows — keep them inside this section */}
        <ResponsiveAnchorArrowAuto
          scopeId='workflow-scope'
          startBase='wf-1'
          endBase='wf-2'
        />
        <ResponsiveAnchorArrowAuto
          scopeId='workflow-scope'
          startBase='wf-2'
          endBase='wf-3'
        />
        <ResponsiveAnchorArrowAuto
          scopeId='workflow-scope'
          startBase='wf-3'
          endBase='wf-4'
        />
        <ResponsiveAnchorArrowAuto
          scopeId='workflow-scope'
          startBase='wf-4'
          endBase='wf-5'
        />
      </div>
    </section>
  );
};

export default Workflow;
