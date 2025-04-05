// src/dto/ItemDto.js
import {
    BorderStyleType,
    FillColorType,
    FillOpacityType,
    FontFamilyType,
    FrameFormatType,
    FrameType,
    IconShapeType,
    RelativeType,
    ShapeType,
    StickyNoteFillColorType,
    StickyNoteShapeType, TextAlignType, TextAlignVerticalType
} from './Enums';

// Класс для позиции
export class Position {
    constructor({ x = 0, y = 0 } = {}) {
        this.x = Number(x);
        this.y = Number(y);
    }
}

// Класс для геометрии
export class Geometry {
    constructor({ width = 100, height = 100, rotation = 0 } = {}) {
        this.width = width;
        this.height = height;
        this.rotation = rotation;
    }
}

// Базовый класс для данных
export class Data {
    // Базовое поле dataType с дефолтным значением пустой строки
    dataType = '';

    constructor(obj = {}) {
        if (obj.dataType) {
            this.dataType = obj.dataType;
        }
        Object.assign(this, obj);
    }
}

// Наследники для конкретных типов данных
export class AppCardData extends Data {
    constructor({
                    description = "",
                    appCardFields,
                    status = "",
                    title = "",
                    owned = false,
                    dataType = "app_card"
                } = {}) {
        super({ dataType });
        this.description = description;
        // Если appCardFields передан, создаём его экземпляр, иначе null
        this.appCardFields = appCardFields ? new AppCardFields(appCardFields) : null;
        this.status = status;
        this.title = title;
        this.owned = owned;
    }
}

export class CardData extends Data {
    constructor({
                    assigneeId = null,
                    description = "",
                    title = "Card", // дефолт "Card" как на сервере
                    dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000), // текущее время + 1 день
                    dataType = "card"
                } = {}) {
        super({ dataType });
        this.assigneeId = assigneeId;
        this.description = description;
        this.title = title;
        // Если dueDate уже является объектом Date или строкой, можно добавить проверку:
        this.dueDate = dueDate instanceof Date ? dueDate : new Date(dueDate);
    }
}

export class FrameData extends Data {
    constructor({
                    title = "Frame", // дефолт "Frame"
                    showContent = true,
                    format = FrameFormatType.CUSTOM,
                    dataType = "frame"
                } = {}) {
        super({ dataType });
        this.title = title;
        this.showContent = showContent;
        this.format = format;
    }
}

export class ImageData extends Data {
    constructor({
                    imageUrl = "",
                    title = "",
                    altText = "",
                    dataType = "image"
                } = {}) {
        super({ dataType });
        this.imageUrl = imageUrl;
        this.title = title;
        this.altText = altText;
    }
}

export class ShapeData extends Data {
    constructor({
                    content = "Shape", // дефолт "Shape"
                    shape = ShapeType.RECTANGLE,
                    dataType = "shape"
                } = {}) {
        super({ dataType });
        this.content = content;
        this.shape = shape;
    }
}

export class StickyNoteData extends Data {
    constructor({
                    content = "StickyNote", // дефолт "StickyNote"
                    shape = StickyNoteShapeType.SQUARE,
                    dataType = "sticky_note"
                } = {}) {
        super({ dataType });
        this.content = content;
        this.shape = shape;
    }
}

export class TextData extends Data {
    constructor({
                    content = "Text", // дефолт "Text"
                    dataType = "text"
                } = {}) {
        super({ dataType });
        this.content = content;
    }
}
// export class AppCardData extends Data {
//     constructor({ description = "", appCardFields, status = "", title = "", owned = false, dataType = "app_card" } = {}) {
//         super({ dataType });
//         this.description = description;
//         this.appCardFields = appCardFields ? new AppCardFields(appCardFields) : null;
//         this.status = status;
//         this.title = title;
//         this.owned = owned;
//     }
// }
//
// export class CardData extends Data {
//     constructor({ assigneeId = null, description = "", title = "", dueDate = null, dataType = "card" } = {}) {
//         super({ dataType });
//         this.assigneeId = assigneeId;
//         this.description = description;
//         this.title = title;
//         this.dueDate = dueDate;
//     }
// }
//
// export class FrameData extends Data {
//     constructor({ title = "", showContent = true, type = FrameType.FREEFORM, format = FrameFormatType.CUSTOM, dataType = "frame" } = {}) {
//         super({ dataType });
//         this.title = title;
//         this.showContent = showContent;
//         this.type = type;
//         this.format = format;
//     }
// }
//
// export class ImageData extends Data {
//     constructor({ imageUrl = "", title = "", altText = "", dataType = "image" } = {}) {
//         super({ dataType });
//         this.imageUrl = imageUrl;
//         this.title = title;
//         this.altText = altText;
//     }
// }
//
// export class ShapeData extends Data {
//     constructor({ content = "", shape = ShapeType.RECTANGLE, dataType = "shape" } = {}) {
//         super({ dataType });
//         this.content = content;
//         this.shape = shape;
//     }
// }
//
// export class StickyNoteData extends Data {
//     constructor({ content = "", type = StickyNoteShapeType.SQUARE, dataType = "sticky_note" } = {}) {
//         super({ dataType });
//         this.content = content;
//         this.type = type;
//     }
// }
//
// export class TextData extends Data {
//     constructor({ content = "", dataType = "text" } = {}) {
//         super({ dataType });
//         this.content = content;
//     }
// }

// Дополнительные поля для данных карточки приложения
export class AppCardFields {
    constructor({ fillColor, iconShape, iconUrl, textColor, tooltip, value } = {}) {
        this.fillColor = fillColor;
        this.iconShape = iconShape;
        this.iconUrl = iconUrl;
        this.textColor = textColor;
        this.tooltip = tooltip;
        this.value = value;
    }
}

// Базовый класс стиля
export class Style {
    // Базовое поле styleType с дефолтным значением пустой строки
    styleType = '';

    constructor(obj = {}) {
        if (obj.styleType) {
            this.styleType = obj.styleType;
        }
        Object.assign(this, obj);
    }
}

// Конкретные классы стилей
export class TextStyle extends Style {
    constructor({
                    color = "#1a1a1a",
                    fillColor = FillColorType.WHITE,
                    fillOpacity = FillOpacityType.OPAQUE,
                    fontSize = 14,
                    fontFamily = FontFamilyType.ARIAL,
                    textAlign = TextAlignType.CENTER, // используем значение из enum
                    styleType = "text"
                } = {}) {
        super({ styleType });
        this.color = color;
        this.fillColor = fillColor;
        this.fillOpacity = fillOpacity;
        this.fontSize = fontSize;
        this.fontFamily = fontFamily;
        this.textAlign = textAlign;
    }
}

export class StickyNoteStyle extends Style {
    constructor({
                    fillColor = FillColorType.WHITE,
                    fontSize = 14,
                    fontFamily = FontFamilyType.ARIAL,
                    textAlign = TextAlignType.CENTER,        // используем значение из enum
                    textAlignVertical = TextAlignVerticalType.TOP, // используем значение из enum
                    styleType = "sticky_note"
                } = {}) {
        super({ styleType });
        this.fillColor = fillColor;
        this.textAlign = textAlign;
        this.fontSize = fontSize;
        this.fontFamily = fontFamily;
        this.textAlignVertical = textAlignVertical;
    }
}

export class ShapeStyle extends Style {
    constructor({
                    borderColor = "#1a1a1a",
                    borderOpacity = 1.0,
                    borderStyle = BorderStyleType.NORMAL,      // используем значение из enum
                    borderWidth = 2.0,
                    color = "#1a1a1a",
                    fillColor = FillColorType.WHITE,           // используем значение из enum
                    fillOpacity = FillOpacityType.OPAQUE,        // используем значение из enum
                    fontSize = 14,
                    fontFamily = FontFamilyType.ARIAL,           // используем значение из enum
                    textAlign = TextAlignType.CENTER,            // используем значение из enum
                    textAlignVertical = TextAlignVerticalType.TOP, // используем значение из enum
                    styleType = "shape"
                } = {}) {
        super({ styleType });
        this.borderColor = borderColor;
        this.borderOpacity = borderOpacity;
        this.borderStyle = borderStyle;
        this.borderWidth = borderWidth;
        this.color = color;
        this.fillColor = fillColor;
        this.fillOpacity = fillOpacity;
        this.fontSize = fontSize;
        this.fontFamily = fontFamily;
        this.textAlign = textAlign;
        this.textAlignVertical = textAlignVertical;
    }
}

export class ImageStyle extends Style {
    constructor({ styleType = "image", ...rest } = {}) {
        super({ styleType });
        Object.assign(this, rest);
    }
}

export class FrameStyle extends Style {
    constructor({ fillColor = "#2d9bf", styleType = "frame" } = {}) {
        super({ styleType });
        this.fillColor = fillColor;
    }
}

export class CardStyle extends Style {
    constructor({ cardTheme = "#2d9bf0", styleType = "card" } = {}) {
        super({ styleType });
        this.cardTheme = cardTheme;
    }
}

export class AppCardStyle extends Style {
    constructor({ fillColor = "#2d9bf", styleType = "app_card" } = {}) {
        super({ styleType });
        this.fillColor = fillColor;
    }
}
// export class TextStyle extends Style {
//     constructor({
//                     color = "#1a1a1a",
//                     fillColor = FillColorType.WHITE,
//                     fillOpacity = FillOpacityType.OPAQUE,
//                     fontSize = 14,
//                     fontFamily = FontFamilyType.ARIAL,
//                     textAlign = "CENTER",
//                     styleType = "text"
//                 } = {}) {
//         super({ styleType });
//         this.color = color;
//         this.fillColor = fillColor;
//         this.fillOpacity = fillOpacity;
//         this.fontSize = fontSize;
//         this.fontFamily = fontFamily;
//         this.textAlign = textAlign;
//     }
// }
//
// export class StickyNoteStyle extends Style {
//     constructor({
//                     fillColor = StickyNoteFillColorType.LIGHT_YELLOW,
//                     textAlign = "CENTER",
//                     textAlignVertical = "TOP",
//                     styleType = "sticky_note"
//                 } = {}) {
//         super({ styleType });
//         this.fillColor = fillColor;
//         this.textAlign = textAlign;
//         this.textAlignVertical = textAlignVertical;
//     }
// }
//
// export class ShapeStyle extends Style {
//     constructor({
//                     borderColor = "#1a1a1a",
//                     borderOpacity = 1.0,
//                     borderStyle = BorderStyleType.NORMAL,
//                     borderWidth = 2.0,
//                     color = "#1a1a1a",
//                     fillColor = FillColorType.WHITE,
//                     fillOpacity = FillOpacityType.OPAQUE,
//                     fontSize = 14,
//                     fontFamily = FontFamilyType.ARIAL,
//                     textAlign = "CENTER",
//                     textAlignVertical = "TOP",
//                     styleType = "shape"
//                 } = {}) {
//         super({ styleType });
//         this.borderColor = borderColor;
//         this.borderOpacity = borderOpacity;
//         this.borderStyle = borderStyle;
//         this.borderWidth = borderWidth;
//         this.color = color;
//         this.fillColor = fillColor;
//         this.fillOpacity = fillOpacity;
//         this.fontSize = fontSize;
//         this.fontFamily = fontFamily;
//         this.textAlign = textAlign;
//         this.textAlignVertical = textAlignVertical;
//     }
// }
//
// export class ImageStyle extends Style {
//     constructor({ styleType = "image", ...rest } = {}) {
//         super({ styleType });
//         Object.assign(this, rest);
//     }
// }
//
// export class FrameStyle extends Style {
//     constructor({ fillColor = "#2d9bf", styleType = "frame" } = {}) {
//         super({ styleType });
//         this.fillColor = fillColor;
//     }
// }
//
// export class CardStyle extends Style {
//     constructor({ cardTheme = "#2d9bf0", styleType = "card" } = {}) {
//         super({ styleType });
//         this.cardTheme = cardTheme;
//     }
// }
//
// export class AppCardStyle extends Style {
//     constructor({ fillColor = "#2d9bf", styleType = "app_card" } = {}) {
//         super({ styleType });
//         this.fillColor = fillColor;
//     }
// }

// DTO класс для элемента доски, создающий конкретные Data и Style на основе типа
export class ItemRs {
    constructor({ id = null, position, geometry, data, style, parentId, boardId, type } = {}) {
        this.id = id;
        this.position = new Position(position);
        this.geometry = new Geometry(geometry);
        this.parentId = parentId;
        this.boardId = boardId;
        this.type = type;

        // Создаем конкретные экземпляры Data и Style в зависимости от type
        switch (type) {
            case 'text':
                this.data = new TextData(data);
                this.style = style ? new TextStyle(style) : new TextStyle();
                break;
            case 'frame':
                this.data = new FrameData(data);
                this.style = style ? new FrameStyle(style) : new FrameStyle();
                break;
            case 'image':
                this.data = new ImageData(data);
                this.style = style ? new ImageStyle(style) : new ImageStyle();
                break;
            case 'shape':
                this.data = new ShapeData(data);
                this.style = style ? new ShapeStyle(style) : new ShapeStyle();
                break;
            case 'card':
                this.data = new CardData(data);
                this.style = style ? new CardStyle(style) : new CardStyle();
                break;
            case 'app_card':
                this.data = new AppCardData(data);
                this.style = style ? new AppCardStyle(style) : new AppCardStyle();
                break;
            case 'sticky_note':
                this.data = new StickyNoteData(data);
                this.style = style ? new StickyNoteStyle(style) : new StickyNoteStyle();
                break;
            default:
                this.data = new Data(data);
                this.style = style ? new Style(style) : null;
        }
    }

    // Статический метод для маппинга данных с сервера
    static fromServer(itemData) {
        // Если data передаётся в виде строки, преобразуем её в объект
        if (typeof itemData.data === 'string') {
            try {
                itemData.data = JSON.parse(itemData.data);
            } catch (e) {
                console.error("Ошибка парсинга поля data:", e);
                itemData.data = {};
            }
        }
        // Если style передаётся в виде строки, преобразуем её в объект
        if (typeof itemData.style === 'string') {
            try {
                itemData.style = JSON.parse(itemData.style);
            } catch (e) {
                console.error("Ошибка парсинга поля style:", e);
                itemData.style = {};
            }
        }
        return new ItemRs(itemData);
    }
}
