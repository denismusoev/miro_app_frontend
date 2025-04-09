import {
    BorderStyleType,
    FontFamilyType,
    FrameFormatType,
    ShapeType,
    StickyNoteShapeType,
    TextAlignType,
    TextAlignVerticalType
} from './Enums';

export class Position {
    constructor({ x = 0, y = 0 } = {}) {
        this.x = Number(x);
        this.y = Number(y);
    }
}

export class Geometry {
    constructor({ width = 100, height = 100, rotation = 0 } = {}) {
        this.width = width;
        this.height = height;
        this.rotation = rotation;
    }
}

export class Data {
    dataType = '';

    constructor(obj = {}) {
        if (obj.dataType) {
            this.dataType = obj.dataType;
        }
        Object.assign(this, obj);
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

export class Style {
    styleType = '';

    constructor(obj = {}) {
        if (obj.styleType) {
            this.styleType = obj.styleType;
        }
        Object.assign(this, obj);
    }
}

export class TextStyle extends Style {
    constructor({
                    color = "#1a1a1a",
                    fillColor = "#ffffff",
                    fillOpacity = 1.0,
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
                    fillColor = "#F1EB9C",
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
                    fillColor = "#ffffff",           // используем значение из enum
                    fillOpacity = 1.0,        // используем значение из enum
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

export class ItemRs {
    constructor({ id = null, position, geometry, data, style, parentId, boardId, type } = {}) {
        this.id = id;
        this.position = new Position(position);
        this.geometry = new Geometry(geometry);
        this.parentId = parentId;
        this.boardId = boardId;
        this.type = type;

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
            case 'sticky_note':
                this.data = new StickyNoteData(data);
                this.style = style ? new StickyNoteStyle(style) : new StickyNoteStyle();
                break;
            default:
                this.data = new Data(data);
                this.style = style ? new Style(style) : null;
        }
    }

    static fromServer(itemData) {
        if (typeof itemData.data === 'string') {
            try {
                itemData.data = JSON.parse(itemData.data);
            } catch (e) {
                console.error("Ошибка парсинга поля data:", e);
                itemData.data = {};
            }
        }
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
