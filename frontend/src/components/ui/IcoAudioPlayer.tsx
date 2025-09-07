import { useRef, type FC } from "react";
import Icosahedron from "../three/Icosahedron";
import PlayAudioFile from "./PlayAudioFile"; // your button component

type IcoAudioPlayerProps = {
  src: string;
  //   haloSize?: number; // px
  //   blur?: number; // px
  className?: string; // controls the outer box size
  /** optional: override sphere size without touching container */
  icoRadius?: number; // default 20 (same as your Ico component)
};

const IcoAudioPlayer: FC<IcoAudioPlayerProps> = ({
  src,
  //   haloSize = 160,
  //   blur = 14,
  className = "w-[480px] aspect-square", // <- give it size (responsive square)
  icoRadius = 20,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  return (
    <div className={`relative ${className}`}>
      <Icosahedron
        className='absolute inset-0'
        color='#98CCC6'
        detail={50}
        radius={icoRadius}
        autoRotate
        rotationSpeed={0.0}
        background={null}
        audioRef={audioRef}
      />

      <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-400/20 via-cyan-500/20 to-primary/20'>
        <PlayAudioFile
          src={src}
          audioRef={audioRef}
        />
      </div>
    </div>
  );
};

export default IcoAudioPlayer;
