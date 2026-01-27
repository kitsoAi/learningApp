import { useCallback } from "react";
import Image from "next/image";
import { useKey } from "react-use";

import { cn, formatAssetUrl } from "@/lib/utils";

type Props = {
  id: number;
  imageSrc: string | null;
  audioSrc: string | null;
  text: string;
  shortcut: string;
  selected?: boolean;
  onClick: () => void;
  status?: "none" | "correct" | "wrong";
  disabled?: boolean;
  type: string;
};

export const Card = ({
  imageSrc,
  audioSrc,
  text,
  shortcut,
  selected,
  onClick,
  status,
  disabled,
  type,
}: Props) => {
  const handleClick = useCallback(() => {
    if (disabled) return;
    onClick();
  }, [disabled, onClick]);

  useKey(shortcut, handleClick, {}, [handleClick]);

  return (
    <div
      onClick={handleClick}
      className={cn(
        "h-full border-2 rounded-xl border-b-4 hover:bg-black/5 p-4 lg:p-6 cursor-pointer active:border-b-2 transition-all duration-200",
        selected && "border-sky-300 bg-sky-100 hover:bg-sky-100",
        selected && status === "correct" && "border-green-300 bg-green-100 hover:bg-green-100",
        selected && status === "wrong" && "border-rose-300 bg-rose-100 hover:bg-rose-100",
        disabled && "pointer-events-none opacity-50",
        type === "ASSIST" && "lg:p-3 w-full"
      )}
    >
      {audioSrc && <div className="hidden" />}
      {imageSrc && (
        <div className="relative aspect-square mb-4 max-h-[80px] lg:max-h-[150px] w-full">
          <Image src={formatAssetUrl(imageSrc) || ""} fill alt={text} className="object-contain" />
        </div>
      )}
      <div className={cn(
        "flex items-center justify-between",
        type === "ASSIST" && "flex-row-reverse",
      )}>
        {type === "ASSIST" && <div />}
        <p className={cn(
          "text-neutral-600 text-sm lg:text-base font-bold",
          selected && "text-sky-500",
          selected && status === "correct" && "text-green-500",
          selected && status === "wrong" && "text-rose-500",
        )}>
          {text}
        </p>
        <div className={cn(
          "lg:w-[30px] lg:h-[30px] w-[20px] h-[20px] border-2 flex items-center justify-center rounded-lg text-neutral-400 lg:text-[15px] text-[10px] font-semibold transition-all",
          selected && "border-sky-300 text-sky-500",
          selected && status === "correct" && "border-green-500 text-green-500",
          selected && status === "wrong" && "border-rose-500 text-rose-500",
        )}>
          {shortcut}
        </div>
      </div>
    </div>
  );
};
