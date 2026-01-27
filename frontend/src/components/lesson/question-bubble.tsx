import { Volume2 } from "lucide-react";
import { formatAssetUrl } from "@/lib/utils";

type Props = {
  question: string;
  audioSrc?: string;
};

export const QuestionBubble = ({ question, audioSrc }: Props) => {
  const onPlay = () => {
    const fullUrl = formatAssetUrl(audioSrc);
    if (fullUrl) {
      new Audio(fullUrl).play().catch(() => {});
    }
  };

  return (
    <div className="relative py-2 px-4 border-2 rounded-2xl text-sm lg:text-base text-neutral-700 font-bold bg-white flex items-center gap-x-3">
      {audioSrc && (
        <button
          onClick={onPlay}
          className="p-2 rounded-xl border-2 border-b-4 active:border-b-2 hover:bg-neutral-100 transition-all text-sky-500"
        >
          <Volume2 className="h-4 w-4 lg:h-6 lg:w-6" />
        </button>
      )}
      <span>{question}</span>
      <div
        className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white"
        style={{ transform: "rotate(90deg)" }}
      />
      <div
        className="absolute -left-[10px] top-1/2 -translate-y-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-neutral-200 -z-10"
        style={{ transform: "rotate(90deg)" }}
      />
    </div>
  );
};
