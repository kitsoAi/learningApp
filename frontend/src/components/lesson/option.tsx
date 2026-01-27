import React from "react";

type Props = {
    item: { id: string; content: string };
    provided: any;
};

export const Option = ({ item, provided }: Props) => {
    return (
        <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className="bg-white shadow-lg py-2 px-4 rounded-lg cursor-grab active:cursor-grabbing font-medium text-lg text-slate-700"
            style={{
                userSelect: "none",
                ...provided.draggableProps.style,
            }}
        >
            {item.content}
        </div>
    );
};
