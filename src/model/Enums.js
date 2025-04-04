// src/dto/Enums.js

// --------------------
// Если на сервере BorderStyleType:
//   NORMAL("normal "),
//   DOTTED("dotted "),
//   DASHED("dashed");
// то на клиенте обычно повторяем "normal", "dotted", "dashed" (без лишних пробелов).
// --------------------
export const BorderStyleType = {
    NORMAL: "normal",
    DOTTED: "dotted",
    DASHED: "dashed",
};

// --------------------
// FillColorType
// --------------------
export const FillColorType = {
    F5F6F8: "#F5F6F8",
    D5F692: "#D5F692",
    D0E17A: "#D0E17A",
    N93D275: "#93D275",
    N67C6C0: "#67C6C0",
    N23BFE7: "#23BFE7",
    A6CCF5: "#A6CCF5",
    N7B92FF: "#7B92FF",
    FFF9B1: "#FFF9B1",
    F5D128: "#F5D128",
    FF9D48: "#FF9D48",
    F16C7F: "#F16C7F",
    EA94BB: "#EA94BB",
    FFCEE0: "#FFCEE0",
    B3B4BB: "#B3B4BB",
    BLACK: "#000000",
    WHITE: "#FFFFFF",
};

// --------------------
// FillOpacityType
// --------------------
export const FillOpacityType = {
    TRANSPARENT: "0.0",       // Полностью прозрачный
    SEMI_TRANSPARENT: "0.5",  // Полупрозрачный
    OPAQUE: "1.0",            // Полностью непрозрачный
    DEFAULT: "default",       // Когда явно не задано
};

// --------------------
// FontFamilyType
// --------------------
export const FontFamilyType = {
    ARIAL: "arial",
    ABRIL_FATFACE: "abril_fatface",
    BANGERS: "bangers",
    EB_GARAMOND: "eb_garamond",
    GEORGIA: "georgia",
    GRADUATE: "graduate",
    GRAVITAS_ONE: "gravitas_one",
    FREDOKA_ONE: "fredoka_one",
    NIXIE_ONE: "nixie_one",
    OPEN_SANS: "open_sans",
    PERMANENT_MARKER: "permanent_marker",
    PT_SANS: "pt_sans",
    PT_SANS_NARROW: "pt_sans_narrow",
    PT_SERIF: "pt_serif",
    RAMMETTO_ONE: "rammetto_one",
    ROBOTO: "roboto",
    ROBOTO_CONDENSED: "roboto_condensed",
    ROBOTO_SLAB: "roboto_slab",
    CAVEAT: "caveat",
    TIMES_NEW_ROMAN: "times_new_roman",
    TITAN_ONE: "titan_one",
    LEMON_TUESDAY: "lemon_tuesday",
    ROBOTO_MONO: "roboto_mono",
    NOTO_SANS: "noto_sans",
    PLEX_SANS: "plex_sans",
    PLEX_SERIF: "plex_serif",
    PLEX_MONO: "plex_mono",
    SPOOF: "spoof",
    TIEMPOS_TEXT: "tiempos_text",
    FORMULAR: "formular",
};

// --------------------
// FrameFormatType
// --------------------
export const FrameFormatType = {
    CUSTOM: "custom",
    DESKTOP: "desktop",
    PHONE: "phone",
    TABLET: "tablet",
    A4: "a4",
    LETTER: "letter",
    RATIO_1X1: "ratio_1x1",
    RATIO_4X3: "ratio_4x3",
    RATIO_16X9: "ratio_16x9",
};

// --------------------
// FrameType
// --------------------
export const FrameType = {
    FREEFORM: "freeform",
    HEAP: "heap",
    GRID: "grid",
    ROWS: "rows",
    UNKNOWN: "unknown",
    COLUMNS: "columns",
};

// --------------------
// IconShapeType
// --------------------
export const IconShapeType = {
    ROUND: "round",
    SQUARE: "square",
};

// --------------------
// RelativeType
// --------------------
export const RelativeType = {
    CANVAS_CENTER: "canvas_center",
    PARENT_TOP_LEFT: "parent_top_left",
};

// --------------------
// ShapeType
// (Для Item, не для коннекторов.)
// --------------------
export const ShapeType = {
    RECTANGLE: "rectangle",
    ROUND_RECTANGLE: "round_rectangle",
    CIRCLE: "circle",
    TRIANGLE: "triangle",
    RHOMBUS: "rhombus",
    PARALLELOGRAM: "parallelogram",
    TRAPEZOID: "trapezoid",
    PENTAGON: "pentagon",
    HEXAGON: "hexagon",
    OCTAGON: "octagon",
    WEDGE_ROUND_RECTANGLE_CALLOUT: "wedge_round_rectangle_callout",
    STAR: "star",
    FLOW_CHART_PREDEFINED_PROCESS: "flow_chart_predefined_process",
    CLOUD: "cloud",
    CROSS: "cross",
    CAN: "can",
    RIGHT_ARROW: "right_arrow",
    LEFT_ARROW: "left_arrow",
    LEFT_RIGHT_ARROW: "left_right_arrow",
    LEFT_BRACE: "left_brace",
    RIGHT_BRACE: "right_brace",
};

// --------------------
// StickyNoteFillColorType
// --------------------
export const StickyNoteFillColorType = {
    GRAY: "gray",
    LIGHT_YELLOW: "light_yellow",
    YELLOW: "yellow",
    ORANGE: "orange",
    LIGHT_GREEN: "light_green",
    GREEN: "green",
    DARK_GREEN: "dark_green",
    CYAN: "cyan",
    LIGHT_PINK: "light_pink",
    PINK: "pink",
    VIOLET: "violet",
    RED: "red",
    LIGHT_BLUE: "light_blue",
    BLUE: "blue",
    DARK_BLUE: "dark_blue",
    BLACK: "black",
};

// --------------------
// StickyNoteShapeType
// --------------------
export const StickyNoteShapeType = {
    RECTANGLE: "rectangle",
    SQUARE: "square",
};

// --------------------
// ConnectorShapeType
// (Сервер: STRAIGHT("straight"), CURVED("curved"), ELBOWED("elbowed "))
// --------------------
export const ConnectorShapeType = {
    STRAIGHT: "straight",
    CURVED: "curved",
    ELBOWED: "elbowed",
};

// --------------------
// StrokeCapType
// --------------------
export const StrokeCapType = {
    NONE: "none",
    STEALTH: "stealth",
    ROUNDED_STEALTH: "rounded_stealth",
    DIAMOND: "diamond",
    FILLED_DIAMOND: "filled_diamond",
    OVAL: "oval",
    FILLED_OVAL: "filled_oval",
    ARROW: "arrow",
    TRIANGLE: "triangle",
    FILLED_TRIANGLE: "filled_triangle",
    ERD_ONE: "erd_one",
    ERD_MANY: "erd_many",
    ERD_ONLY_ONE: "erd_only_one",
    ERD_ZERO_OR_ONE: "erd_zero_or_one",
    ERD_ONE_OR_MANY: "erd_one_or_many",
    ERD_ZERO_OR_MANY: "erd_zero_or_many",
    UNKNOWN: "unknown",
};

// --------------------
// StrokeStyleType
// (Сервер: NORMAL("normal "), DOTTED("dotted "), DASHED("dashed"))
// --------------------
export const StrokeStyleType = {
    NORMAL: "normal",
    DOTTED: "dotted",
    DASHED: "dashed",
};

// --------------------
// TextAlignType
// --------------------
export const TextAlignType = {
    LEFT: "left",
    RIGHT: "right",
    CENTER: "center",
};

// --------------------
// TextAlignVerticalType
// --------------------
export const TextAlignVerticalType = {
    TOP: "top",
    BOTTOM: "bottom",
    MIDDLE: "middle",
};

// --------------------
// TextOrientationType
// --------------------
export const TextOrientationType = {
    HORIZONTAL: "horizontal",
    ALIGNED: "aligned",
};
