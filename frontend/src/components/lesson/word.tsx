import React from "react";

type Props = {
    text: string;
    hint: string;
};

export const Word = ({ text, hint }: Props) => {
    return (
        <div className="word font-medium text-xl hover:text-gray-600 tracking-wide decoration-dotted group cursor-pointer select-none decoration-gray-600 relative inline-block mx-1">
            <span className="border-b-2 border-dotted border-gray-400 pb-1">{text}</span>
            <span className="tooltip-text text-lg bg-white border-[#58cc02] border-solid border-2 p-3 -top-16 left-1/2 -translate-x-1/2 transition-all rounded hidden group-hover:block absolute text-center py-2 px-6 z-50 shadow-md whitespace-nowrap">
                {hint}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b-2 border-r-2 border-[#58cc02] rotate-45"></div>
            </span>
        </div>
    );
};
