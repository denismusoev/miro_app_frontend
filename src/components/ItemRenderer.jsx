import React from "react";
import { CircleItem, StickyNoteItem } from "./ItemTypes"; // импортируем компоненты

export function ItemRenderer(props) {
    const { item } = props;

    switch (item.type) {
        case "circle":
            return <CircleItem {...props} />;
        case "sticky_note":
            return <StickyNoteItem {...props} />;
        // Пример: "rectangle", "card", "text" и т.п.
        default:
            // По умолчанию рендерим некий "прямоугольный" вариант
            return <CircleItem {...props} />;
    }
}
