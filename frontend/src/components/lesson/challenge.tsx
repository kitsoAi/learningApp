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

  return (
    <div className={cn(
      "grid gap-2",
      type === "SELECT" && "grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]",
      (type === "ASSIST" || type === "LISTEN_SELECT") && "grid-cols-1"
    )}>
      {options.map((option) => (
        <Card
          key={option.id}
          id={option.id}
          text={option.text}
          imageSrc={option.image_src}
          shortcut={`1`} // TODO: dynamic shortcut
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
