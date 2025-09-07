// PlayAudioFile.tsx
import type { FC, RefObject, MutableRefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

type AudioRef =
  | RefObject<HTMLAudioElement | null>
  | MutableRefObject<HTMLAudioElement | null>;

type PlayAudioFileProps = {
  src: string;
  autoPlay?: boolean;
  className?: string;
  audioRef?: AudioRef;
};

const PlayAudioFile: FC<PlayAudioFileProps> = ({
  src,
  autoPlay = false,
  className,
  audioRef,
}) => {
  const internalRef = useRef<HTMLAudioElement | null>(null);
  const ref: AudioRef = audioRef ?? internalRef;

  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = ref.current;
    if (!audio) return;

    audio.crossOrigin = "anonymous";

    audio.src = src;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onPause);

    if (autoPlay) {
      audio.play().catch(() => {});
    }

    return () => {
      audio.pause();
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onPause);
    };
  }, [src, autoPlay, ref]);

  const toggle = async () => {
    const audio = ref.current;
    if (!audio) return;
    try {
      if (audio.paused) {
        await audio.play();
        window.dispatchEvent(new Event("user-audio-play"));
      } else {
        audio.pause();
      }
    } catch (err) {
      console.error("Audio play failed:", err);
    }
  };

  return (
    <div
      className={[
        "inline-block rounded-full overflow-hidden bg-white",
        className ?? "",
      ].join(" ")}
    >
      <button
        type='button'
        onClick={toggle}
        aria-pressed={isPlaying}
        aria-label={isPlaying ? "Pause audio" : "Play audio"}
        className='inline-flex items-center p-4 bg-gradient-to-r from-purple-400/10 via-cyan-500/10 to-primary/10 shadow-lg ring-1 ring-primary/5 backdrop-blur-lg rounded-full text-secondary'
      >
        {isPlaying ? (
          <Pause className='text-secondary' />
        ) : (
          <Play className='text-secondary' />
        )}
      </button>

      {/* Hidden audio element (we control it via ref) */}
      <audio
        ref={ref}
        preload='auto'
      />
    </div>
  );
};

export default PlayAudioFile;
