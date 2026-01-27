import { v4 as uuid } from "uuid";

export const onDragEnd = (result: any, rows: any, setRows: any) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId !== destination.droppableId) {
        const sourceColumn = rows[source.droppableId];
        const destColumn = rows[destination.droppableId];
        const sourceItems = [...sourceColumn.items];
        const destItems = [...destColumn.items];
        const [removed] = sourceItems.splice(source.index, 1);
        destItems.splice(destination.index, 0, removed);
        setRows({
            ...rows,
            [source.droppableId]: {
                ...sourceColumn,
                items: sourceItems,
            },
            [destination.droppableId]: {
                ...destColumn,
                items: destItems,
            },
        });
    } else {
        const column = rows[source.droppableId];
        const copiedItems = [...column.items];
        const [removed] = copiedItems.splice(source.index, 1);
        copiedItems.splice(destination.index, 0, removed);
        setRows({
            ...rows,
            [source.droppableId]: {
                ...column,
                items: copiedItems,
            },
        });
    }
};

export const handleSubmit = (rows: any, setRows: any, items: any[], onCorrect: () => void, onWrong: () => void) => {
    const answerItems = rows["Answer"].items;
    // Assuming the correct order is the original items list order for now
    // In a real app, you would compare against a correct answer string or id sequence
    const isCorrect = JSON.stringify(answerItems.map((i: any) => i.content)) === JSON.stringify(items.map((i: any) => i.content));

    if (isCorrect) {
        onCorrect();
    } else {
        onWrong();
        // Resetting logic could be added here if desired
    }
};

const services = {
    onDragEnd,
    handleSubmit
};

export default services;
