import { useRef, type FC } from "react";
import Icosahedron from "../three/Icosahedron";
import PlayAudioFile from "./PlayAudioFile"; // your button component

type IcoAudioPlayerProps = {
  src: string;
  className?: string;
  icoRadius?: number;
};

const IcoAudioPlayer: FC<IcoAudioPlayerProps> = ({
  src,
  className = "w-[480px] aspect-square",
  icoRadius = 20,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  return (
    <div className={`relative ${className}`}>
      <Icosahedron
        className='absolute inset-0'
        color='#98CCC6'
        detail={90}
        radius={icoRadius}
        autoRotate
        rotationSpeed={0.01}
        background={null}
        audioRef={audioRef}
      />

      <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'>
        <PlayAudioFile
          src={src}
          audioRef={audioRef}
        />
      </div>
    </div>
  );
};

export default IcoAudioPlayer;
