import { ChallengeOption } from "@/types/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";
import { Card } from "./card";
import { SentenceBuilder } from "./challenges/sentence-builder";
import { MatchingPairs } from "./challenges/matching-pairs";

type Props = {
  options: ChallengeOption[];
  onSelect: (id: number | string) => void;
  status: "none" | "correct" | "wrong";
  selectedOption?: number | string;
  disabled?: boolean;
  type: string;
  question: string;
  audioSrc?: string;
};

export const ChallengeComponent = ({
  options,
  onSelect,
  status,
  selectedOption,
  disabled,
  type,
  question,
  audioSrc,
}: Props) => {
  const isImageSelect = type === "SELECT_IMAGE";

  if (type === "TRANSLATE" || type === "TAP_HEAR") {
    // Treat as sentence builder
    const words = options.map(o => o.text);
    return (
      <SentenceBuilder 
        options={words}
        onUpdate={(val: string) => onSelect(val)}
        disabled={disabled || status !== "none"}
      />
    );
  }

  if (type === "MATCH") {
    // For Match, we expect options to come in pairs or be transformed
    // This is a simplified transformation for now
    const pairs = options.slice(0, 4).map((o) => ({
        id: o.id,
        source: o.text,
        target: o.image_src || "TARGET", // Placeholder
        audioSrc: o.audio_src || undefined
    }));

    return (
        <MatchingPairs 
            key={question}
            pairs={pairs}
            onComplete={(success: boolean) => onSelect(success ? "MATCHED" : "WRONG")}
            disabled={disabled || status !== "none"}
        />
    );
  }

  if (type === "LISTEN_TYPE") {
      return (
          <div className="flex flex-col gap-y-4">
               <Button 
                onClick={() => new Audio(audioSrc).play()}
                variant="secondary"
                className="w-fit"
               >
                   <Volume2 className="mr-2" /> Play Audio
               </Button>
               <textarea 
                className="w-full p-4 border-2 rounded-xl focus:border-sky-300 outline-none"
                placeholder="Type what you hear..."
                onChange={(e) => onSelect(e.target.value)}
                disabled={disabled || status !== "none"}
               />
          </div>
      )
  }

  if (type === "SPEAK") {
    return (
      <div className="flex flex-col items-center gap-y-8 w-full">
        <div className="flex items-center justify-center p-8 bg-sky-100 rounded-full border-2 border-sky-300">
          <Volume2 className="h-16 w-16 text-sky-500" />
        </div>
        <div className="flex flex-col items-center gap-y-2">
          <p className="text-neutral-600 text-center font-bold text-lg lg:text-2xl">
            Wave your hand and say it!
          </p>
          <div className="text-neutral-400 text-sm text-center italic">
            (Whisper scoring coming soon...)
          </div>
        </div>
        <Button 
          variant="secondary" 
          size="lg"
          className="w-full lg:max-w-xs"
          onClick={() => onSelect("SKIPPED")}
          disabled={disabled || status !== "none"}
        >
          I said it! (Continue)
        </Button>
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className="w-full rounded-xl border-2 border-dashed p-4 text-center text-sm font-medium text-neutral-500">
        No options configured for this challenge yet. Add options in Admin and save.
      </div>
    );
  }

  return (
    <div className={cn(
      "grid gap-2",
      type === "SELECT" && "grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]",
      isImageSelect && "grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]",
      (type === "ASSIST" || type === "LISTEN_SELECT") && "grid-cols-1"
    )}>
      {options.map((option, index) => (
        <Card
          key={option.id}
          id={option.id}
          text={option.text}
          imageSrc={option.image_src}
          shortcut={`${index + 1}`}
          selected={selectedOption === option.id}
          onClick={() => onSelect(option.id)}
          status={status}
          audioSrc={option.audio_src}
          disabled={disabled}
          type={type}
        />
      ))}
    </div>
  );
};
