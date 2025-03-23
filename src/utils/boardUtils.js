// utils/boardUtils.js
import {
    AppCardData, AppCardStyle,
    CardData, CardStyle,
    FrameData,
    FrameStyle,
    ImageData,
    ImageStyle,
    ShapeData,
    ShapeStyle, StickyNoteData, StickyNoteStyle,
    TextData,
    TextStyle
} from "../model/ItemDto";

export const getDefaultLabel = (type, id) => {
    switch (type) {
        case 'text':
            return `Текст ${id}`;
        case 'frame':
            return `Рамка ${id}`;
        case 'image':
            return `Изображение ${id}`;
        case 'shape':
            return `Фигура ${id}`;
        case 'card':
            return `Карточка ${id}`;
        case 'app_card':
            return `Приложение ${id}`;
        case 'sticky_note':
            return `Стикер ${id}`;
        default:
            return `Элемент ${id}`;
    }
};

export const getDefaultItem = (type) => {
    switch (type) {
        case 'text':
            return { data: new TextData(), style: new TextStyle(), width: 100, height: 100 };
        case 'frame':
            return { data: new FrameData(), style: new FrameStyle(), width: 300, height: 300 };
        case 'image':
            return { data: new ImageData(), style: new ImageStyle(), width: 300, height: 300 };
        case 'shape':
            return { data: new ShapeData(), style: new ShapeStyle(), width: 300, height: 300 };
        case 'card':
            return { data: new CardData(), style: new CardStyle(), width: 300, height: 300 };
        case 'app_card':
            return { data: new AppCardData(), style: new AppCardStyle(), width: 300, height: 300 };
        case 'sticky_note':
            return { data: new StickyNoteData(), style: new StickyNoteStyle(), width: 300, height: 300 };
        default:
            return { data: {}, style: {} };
    }
};
