"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  options: string[];
  onUpdate: (value: string) => void;
  disabled?: boolean;
};

export const SentenceBuilder = ({ options, onUpdate, disabled }: Props) => {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>(options);

  const addWord = (word: string, index: number) => {
    if (disabled) return;
    
    const newSelected = [...selectedWords, word];
    const newAvailable = [...availableWords];
    newAvailable.splice(index, 1);
    
    setSelectedWords(newSelected);
    setAvailableWords(newAvailable);
    onUpdate(newSelected.join(" "));
  };

  const removeWord = (index: number) => {
    if (disabled) return;
    
    const word = selectedWords[index];
    const newSelected = [...selectedWords];
    newSelected.splice(index, 1);
    
    setSelectedWords(newSelected);
    setAvailableWords([...availableWords, word]);
    onUpdate(newSelected.join(" "));
  };

  return (
    <div className="flex flex-col gap-y-12">
      {/* Target Slots */}
      <div className="flex flex-wrap gap-2 min-h-[60px] border-b-2 border-dashed border-neutral-200 py-2">
        {selectedWords.map((word, i) => (
          <Button
            key={`selected-${i}-${word}`}
            variant="outline"
            className="h-auto py-2 px-4 text-neutral-700 bg-white border-2 border-b-4 active:border-b-2"
            onClick={() => removeWord(i)}
            disabled={disabled}
          >
            {word}
          </Button>
        ))}
      </div>

      {/* Available Words */}
      <div className="flex flex-wrap justify-center gap-2">
        {availableWords.map((word, i) => (
          <Button
            key={`available-${i}-${word}`}
            variant="outline"
            className="h-auto py-2 px-4 text-neutral-700 bg-white border-2 border-b-4 active:border-b-2"
            onClick={() => addWord(word, i)}
            disabled={disabled}
          >
            {word}
          </Button>
        ))}
      </div>
    </div>
  );
};
