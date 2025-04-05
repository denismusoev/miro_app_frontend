import React, {useState, useEffect, useRef} from 'react';
import { Handle, Position, NodeToolbar } from 'reactflow';
import {
    BorderStyleType,
    FillColorType, FillOpacityType,
    FontFamilyType,
    ShapeType,
    StickyNoteShapeType, TextAlignType,
    TextAlignVerticalType
} from '../model/Enums';
import {ShapeSettingsPanel} from "./StyleSettingsPanel";
import { FaFillDrip, FaBorderStyle, FaFont, FaAlignLeft, FaAlignCenter, FaAlignRight } from "react-icons/fa";

// Общий стиль для редактирования – текст с прозрачным фоном
const editingInputStyle = {
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    width: '100%',
    height: '100%',
    padding: '4px 8px',
    fontSize: 'inherit',
    fontFamily: 'inherit',
    textAlign: 'center',
};

const hexToRgba = (hex, opacity = 1) => {
    const normalizedHex = hex.replace('#', '');
    const bigint = parseInt(normalizedHex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const convertFontName = (fontFamily) => {
    if (!fontFamily) return 'Arial, sans-serif';
    return fontFamily
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

//
// ---------- Узел типа TEXT (тип "text") ----------
// Элегантный узел с прозрачным фоном для редактирования текста
export const TextNode = ({ id, data, xPos, yPos, selected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(data.label || '');

    const computedWidth = data.geometry?.width || 150;
    const computedHeight = data.geometry?.height || 50;
    const fontFamilyCSS = convertFontName(data.style?.fontFamily);

    const startEditing = () => {
        setIsEditing(true);
        data.functions?.disableDragging && data.functions.disableDragging();
    };

    const finishEditing = () => {
        data.functions?.onLabelChange && data.functions.onLabelChange(id, value);
        setIsEditing(false);
        data.functions?.enableDragging && data.functions.enableDragging();
    };

    const handleDoubleClick = () => startEditing();
    const handleBlur = () => finishEditing();
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') finishEditing();
    };

    // Прозрачный фон – текст выглядит будто "приподнятым" над доской
    const containerStyle = {
        width: `${computedWidth}px`,
        height: `${computedHeight}px`,
        background: 'transparent',
        fontFamily: fontFamilyCSS,
        fontSize: data.style?.fontSize ? `${data.style.fontSize}px` : '18px',
        textAlign: data.style?.textAlign || 'left',
        color: data.style?.color || '#333',
        padding: '8px',
        borderRadius: '12px',
        boxShadow: selected
            ? '0 4px 12px rgba(59,130,246,0.3)'
            : '0 2px 6px rgba(0,0,0,0.1)',
        transition: 'box-shadow 0.2s ease, border 0.2s ease',
        border: selected ? '2px solid #3B82F6' : '2px solid transparent',
    };

    return (
        <div onDoubleClick={handleDoubleClick} style={containerStyle}>
            {isEditing ? (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    style={editingInputStyle}
                />
            ) : (
                <div>{value}</div>
            )}
        </div>
    );
};

//
// ---------- Узел типа FRAME (тип "frame") ----------
// Чистый, минималистичный фрейм с лёгким градиентом и округлёнными углами
export const FrameNode = ({ id, data, selected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(data.label || '');

    const computedWidth = data.geometry?.width || 300;
    const computedHeight = data.geometry?.height || 200;

    useEffect(() => {
        if (selected) {
            data.functions?.enableDragging && data.functions.enableDragging();
        } else {
            data.functions?.disableDragging && data.functions.disableDragging();
        }
    }, [selected, data.functions]);

    const startEditing = () => {
        setIsEditing(true);
        data.functions?.disableDragging && data.functions.disableDragging();
    };

    const finishEditing = () => {
        data.functions?.onLabelChange && data.functions.onLabelChange(id, value);
        setIsEditing(false);
        data.functions?.enableDragging && data.functions.enableDragging();
    };

    const handleDoubleClick = () => startEditing();
    const handleBlur = () => finishEditing();
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') finishEditing();
    };

    const containerStyle = {
        width: `${computedWidth}px`,
        height: `${computedHeight}px`,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(245,245,245,0.98))',
        border: selected ? '2px solid #3B82F6' : '2px solid #ddd',
        borderRadius: '16px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        padding: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        transition: 'border 0.2s ease, box-shadow 0.2s ease',
        ...data.style,
    };

    const labelStyle = {
        position: 'absolute',
        top: '8px',
        left: '8px',
        backgroundColor: 'rgba(255,255,255,0.8)',
        padding: '2px 6px',
        fontSize: '10px',
        color: '#555',
        borderRadius: '4px',
    };

    return (
        <div onDoubleClick={handleDoubleClick} style={containerStyle}>
            <div style={labelStyle}>Frame</div>
            {isEditing ? (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    style={editingInputStyle}
                />
            ) : (
                <div>{value}</div>
            )}
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: '#555', width: '7px', height: '7px' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                style={{ background: '#555', width: '7px', height: '7px' }}
            />
        </div>
    );
};

//
// ---------- Узел типа IMAGE (тип "image") ----------
// Изображение с минималистичной рамкой, округлыми углами и элегантной подписью
export const ImageNode = ({ id, data, selected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(data.label || '');

    const computedWidth = data.geometry?.width || 200;
    const computedHeight = data.geometry?.height || 150;

    useEffect(() => {
        if (selected) {
            data.functions?.enableDragging && data.functions.enableDragging();
        } else {
            data.functions?.disableDragging && data.functions.disableDragging();
        }
    }, [selected, data.functions]);

    const startEditing = () => {
        setIsEditing(true);
        data.functions?.disableDragging && data.functions.disableDragging();
    };

    const finishEditing = () => {
        data.functions?.onLabelChange && data.functions.onLabelChange(id, value);
        setIsEditing(false);
        data.functions?.enableDragging && data.functions.enableDragging();
    };

    const handleDoubleClick = () => startEditing();
    const handleBlur = () => finishEditing();
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') finishEditing();
    };

    const containerStyle = {
        width: `${computedWidth}px`,
        height: `${computedHeight}px`,
        background: '#f9f9f9',
        border: selected ? '2px solid #3B82F6' : '2px solid #e0e0e0',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border 0.2s ease, box-shadow 0.2s ease',
        ...data.style,
    };

    const imageStyle = {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    };

    const captionStyle = {
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        color: '#fff',
        fontSize: '12px',
        textAlign: 'center',
        padding: '4px 0',
        position: 'absolute',
        bottom: 0,
    };

    return (
        <div onDoubleClick={handleDoubleClick} style={containerStyle}>
            {data.imageUrl ? (
                <img src={data.imageUrl} alt={data.altText || 'Image'} style={imageStyle} />
            ) : (
                <div>No Image</div>
            )}
            {isEditing ? (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    style={editingInputStyle}
                />
            ) : (
                <div style={captionStyle}>{value}</div>
            )}
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: '#555', width: '7px', height: '7px' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                style={{ background: '#555', width: '7px', height: '7px' }}
            />
        </div>
    );
};

//
// ---------- Узел типа SHAPE (тип "shape") ----------
// Элегантная фигура с современным градиентом и мягкими тенями
// Пример палитры для заливки и границы
const fillColorOptions = [
    FillColorType.WHITE,
    FillColorType.F5F6F8,
    FillColorType.FFF9B1,
    FillColorType.N23BFE7,
    FillColorType.N93D275,
    FillColorType.F16C7F,
    FillColorType.BLACK,
];

// Пример палитры для текста
const textColorOptions = [
    FillColorType.BLACK,
    FillColorType.F5F6F8,
    FillColorType.FFF9B1,
    FillColorType.N23BFE7,
    FillColorType.N93D275,
    FillColorType.F16C7F,
];

// Пример вариантов семейства шрифтов (FontFamilyType)
const fontFamilyOptions = [
    FontFamilyType.ARIAL,
    FontFamilyType.ROBOTO,
    FontFamilyType.OPEN_SANS,
    FontFamilyType.GEORGIA,
];

// Для вертикального выравнивания
const verticalAlignOptions = [
    { label: "Top", value: TextAlignVerticalType.TOP },
    { label: "Middle", value: TextAlignVerticalType.MIDDLE },
    { label: "Bottom", value: TextAlignVerticalType.BOTTOM },
];
export const ShapeNode = ({ id, data, selected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(data.label || "");

    const computedWidth = data.geometry?.width || 120;
    const computedHeight = data.geometry?.height || 80;

    useEffect(() => {
        if (selected) {
            data.functions?.enableDragging && data.functions.enableDragging();
        } else {
            data.functions?.disableDragging && data.functions.disableDragging();
        }
    }, [selected, data.functions]);

    const startEditing = () => {
        setIsEditing(true);
        data.functions?.disableDragging && data.functions.disableDragging();
    };

    const finishEditing = () => {
        data.functions?.onLabelChange && data.functions.onLabelChange(id, value);
        setIsEditing(false);
        data.functions?.enableDragging && data.functions.enableDragging();
    };

    const handleDoubleClick = () => startEditing();
    const handleBlur = () => finishEditing();
    const handleKeyDown = (e) => {
        if (e.key === "Enter") finishEditing();
    };

    // --- Извлекаем все стилевые поля ---
    const {
        borderColor = "#1a1a1a",
        borderOpacity = 1.0,
        borderStyle = BorderStyleType.NORMAL, // normal | dotted | dashed
        borderWidth = 2,
        color = "#1a1a1a", // Цвет текста
        fillColor = FillColorType.WHITE,
        fillOpacity = FillOpacityType.OPAQUE, // '1.0'
        fontSize = 14,
        fontFamily = FontFamilyType.ARIAL,
        textAlign = TextAlignType.CENTER,     // left | center | right
        textAlignVertical = TextAlignVerticalType.TOP, // top | middle | bottom
    } = data.style || {};

    // Фон с учётом прозрачности
    const background = fillColor.startsWith("#")
        ? hexToRgba(fillColor, parseFloat(fillOpacity))
        : fillColor;

    const border = `${borderWidth}px ${borderStyle} ${hexToRgba(borderColor, parseFloat(borderOpacity))}`;

    const borderRadius =
        data.shape === ShapeType.CIRCLE
            ? "50%"
            : data.shape === ShapeType.ROUND_RECTANGLE
                ? "16px"
                : "12px";

    const containerStyle = {
        width: `${computedWidth}px`,
        height: `${computedHeight}px`,
        background,
        color,
        fontSize: `${fontSize}px`,
        fontFamily: convertFontName(fontFamily),
        textAlign,
        lineHeight: "1.2",
        border,
        borderRadius,
        boxShadow: selected
            ? "0 4px 12px rgba(59,130,246,0.3)"
            : "0 2px 6px rgba(0,0,0,0.1)",
        transition: "box-shadow 0.2s ease, border 0.2s ease",
        display: "flex",
        justifyContent:
            textAlign === "left" ? "flex-start" : textAlign === "right" ? "flex-end" : "center",
        alignItems:
            textAlignVertical === "top"
                ? "flex-start"
                : textAlignVertical === "bottom"
                    ? "flex-end"
                    : "center",
        padding: "4px",
        overflow: "hidden",
    };

    // --- Меняем стиль (передаём родителю) ---
    const onChangeStyle = (newStyle) => {
        data.functions?.onStyleChange && data.functions.onStyleChange(id, newStyle);
    };

    // --- Локальное состояние подменю ---
    const [fillMenuOpen, setFillMenuOpen] = useState(false);
    const [borderMenuOpen, setBorderMenuOpen] = useState(false);
    const [textMenuOpen, setTextMenuOpen] = useState(false);

    // Рефы на контейнеры подменю, чтобы не закрывать их при клике внутри
    const fillMenuRef = useRef(null);
    const borderMenuRef = useRef(null);
    const textMenuRef = useRef(null);

    // При клике вне toolbar (onClickOutside) проверяем, не кликнули ли мы в одном из подменю
    const handleClickOutside = (evt) => {
        if (
            fillMenuRef.current?.contains(evt.target) ||
            borderMenuRef.current?.contains(evt.target) ||
            textMenuRef.current?.contains(evt.target)
        ) {
            // клик внутри одного из подменю, не закрываем
            return;
        }
        // иначе закрываем все
        setFillMenuOpen(false);
        setBorderMenuOpen(false);
        setTextMenuOpen(false);
    };

    return (
        <div onDoubleClick={handleDoubleClick} style={containerStyle}>
            {isEditing ? (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    style={editingInputStyle}
                />
            ) : (
                value
            )}

            {/* Показываем Toolbar только если этот узел выбран */}
            {selected && (
                <NodeToolbar
                    isVisible={true}               // панель видна, раз узел выделен
                    onClickOutside={handleClickOutside}
                    position={Position.Top}
                >
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {/* Кнопка «Fill» */}
                        <div style={{ position: "relative" }}>
                            <button
                                onClick={() => {
                                    setFillMenuOpen(!fillMenuOpen);
                                    setBorderMenuOpen(false);
                                    setTextMenuOpen(false);
                                }}
                                style={{ background: "none", border: "none", cursor: "pointer" }}
                                title="Fill settings"
                            >
                                <FaFillDrip size={18} />
                            </button>
                            {fillMenuOpen && (
                                <div
                                    ref={fillMenuRef}
                                    style={{
                                        position: "absolute",
                                        top: "28px",
                                        left: 0,
                                        width: "220px",
                                        background: "#fff",
                                        border: "1px solid #ddd",
                                        borderRadius: "8px",
                                        padding: "8px",
                                        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                                        zIndex: 999,
                                    }}
                                >
                                    <div style={{ marginBottom: "6px", fontWeight: "bold" }}>Fill Color</div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                        {fillColorOptions.map((val) => (
                                            <div
                                                key={val}
                                                onClick={() => onChangeStyle({ fillColor: val })}
                                                style={{
                                                    width: "20px",
                                                    height: "20px",
                                                    borderRadius: "3px",
                                                    background: val,
                                                    border: fillColor === val ? "2px solid #3B82F6" : "1px solid #ccc",
                                                    cursor: "pointer",
                                                }}
                                            />
                                        ))}
                                    </div>

                                    <div style={{ marginTop: "6px" }}>
                                        <div style={{ fontWeight: "bold" }}>Fill Opacity</div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={parseFloat(fillOpacity)}
                                            onChange={(e) => onChangeStyle({ fillOpacity: e.target.value })}
                                        />
                                        <span style={{ marginLeft: "4px" }}>
                      {Math.round(parseFloat(fillOpacity) * 100)}%
                    </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Кнопка «Border» */}
                        <div style={{ position: "relative" }}>
                            <button
                                onClick={() => {
                                    setBorderMenuOpen(!borderMenuOpen);
                                    setFillMenuOpen(false);
                                    setTextMenuOpen(false);
                                }}
                                style={{ background: "none", border: "none", cursor: "pointer" }}
                                title="Border settings"
                            >
                                <FaBorderStyle size={18} />
                            </button>
                            {borderMenuOpen && (
                                <div
                                    ref={borderMenuRef}
                                    style={{
                                        position: "absolute",
                                        top: "28px",
                                        left: 0,
                                        width: "240px",
                                        background: "#fff",
                                        border: "1px solid #ddd",
                                        borderRadius: "8px",
                                        padding: "8px",
                                        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                                        zIndex: 999,
                                    }}
                                >
                                    <div style={{ marginBottom: "6px", fontWeight: "bold" }}>Border Color</div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                        {fillColorOptions.map((val) => (
                                            <div
                                                key={val}
                                                onClick={() => onChangeStyle({ borderColor: val })}
                                                style={{
                                                    width: "20px",
                                                    height: "20px",
                                                    borderRadius: "3px",
                                                    background: val,
                                                    border: borderColor === val ? "2px solid #3B82F6" : "1px solid #ccc",
                                                    cursor: "pointer",
                                                }}
                                            />
                                        ))}
                                    </div>

                                    <div style={{ marginTop: "6px" }}>
                                        <div style={{ fontWeight: "bold" }}>Border Opacity</div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={parseFloat(borderOpacity)}
                                            onChange={(e) => onChangeStyle({ borderOpacity: e.target.value })}
                                        />
                                        <span style={{ marginLeft: "4px" }}>
                      {Math.round(parseFloat(borderOpacity) * 100)}%
                    </span>
                                    </div>

                                    <div style={{ marginTop: "6px" }}>
                                        <div style={{ fontWeight: "bold" }}>Border Width</div>
                                        <input
                                            type="number"
                                            style={{ width: "60px" }}
                                            value={borderWidth}
                                            onChange={(e) => onChangeStyle({ borderWidth: Number(e.target.value) })}
                                        />
                                    </div>

                                    <div style={{ marginTop: "6px" }}>
                                        <div style={{ fontWeight: "bold" }}>Border Style</div>
                                        <select
                                            value={borderStyle}
                                            onChange={(e) => onChangeStyle({ borderStyle: e.target.value })}
                                        >
                                            {Object.values(BorderStyleType).map((val) => (
                                                <option value={val} key={val}>
                                                    {val}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Кнопка «Text» */}
                        <div style={{ position: "relative" }}>
                            <button
                                onClick={() => {
                                    setTextMenuOpen(!textMenuOpen);
                                    setFillMenuOpen(false);
                                    setBorderMenuOpen(false);
                                }}
                                style={{ background: "none", border: "none", cursor: "pointer" }}
                                title="Text settings"
                            >
                                <FaFont size={18} />
                            </button>
                            {textMenuOpen && (
                                <div
                                    ref={textMenuRef}
                                    style={{
                                        position: "absolute",
                                        top: "28px",
                                        left: 0,
                                        width: "220px",
                                        background: "#fff",
                                        border: "1px solid #ddd",
                                        borderRadius: "8px",
                                        padding: "8px",
                                        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                                        zIndex: 999,
                                    }}
                                >
                                    <div style={{ marginBottom: "6px", fontWeight: "bold" }}>Text Color</div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                        {textColorOptions.map((val) => (
                                            <div
                                                key={val}
                                                onClick={() => onChangeStyle({ color: val })}
                                                style={{
                                                    width: "20px",
                                                    height: "20px",
                                                    background: val,
                                                    border: color === val ? "2px solid #3B82F6" : "1px solid #ccc",
                                                    cursor: "pointer",
                                                }}
                                            />
                                        ))}
                                    </div>

                                    <div style={{ marginTop: "6px" }}>
                                        <div style={{ fontWeight: "bold" }}>Font Size</div>
                                        <input
                                            type="number"
                                            style={{ width: "60px" }}
                                            value={fontSize}
                                            onChange={(e) => onChangeStyle({ fontSize: Number(e.target.value) })}
                                        />
                                    </div>

                                    <div style={{ marginTop: "6px" }}>
                                        <div style={{ fontWeight: "bold" }}>Font Family</div>
                                        <select
                                            value={fontFamily}
                                            onChange={(e) => onChangeStyle({ fontFamily: e.target.value })}
                                        >
                                            {fontFamilyOptions.map((fam) => (
                                                <option value={fam} key={fam}>
                                                    {fam}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ marginTop: "6px" }}>
                                        <div style={{ fontWeight: "bold" }}>Text Align (H)</div>
                                        <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                                            <button
                                                style={{
                                                    background: "none",
                                                    border: textAlign === TextAlignType.LEFT ? "2px solid #3B82F6" : "1px solid #ccc",
                                                    cursor: "pointer",
                                                    padding: "4px",
                                                }}
                                                onClick={() => onChangeStyle({ textAlign: TextAlignType.LEFT })}
                                            >
                                                <FaAlignLeft />
                                            </button>
                                            <button
                                                style={{
                                                    background: "none",
                                                    border: textAlign === TextAlignType.CENTER ? "2px solid #3B82F6" : "1px solid #ccc",
                                                    cursor: "pointer",
                                                    padding: "4px",
                                                }}
                                                onClick={() => onChangeStyle({ textAlign: TextAlignType.CENTER })}
                                            >
                                                <FaAlignCenter />
                                            </button>
                                            <button
                                                style={{
                                                    background: "none",
                                                    border: textAlign === TextAlignType.RIGHT ? "2px solid #3B82F6" : "1px solid #ccc",
                                                    cursor: "pointer",
                                                    padding: "4px",
                                                }}
                                                onClick={() => onChangeStyle({ textAlign: TextAlignType.RIGHT })}
                                            >
                                                <FaAlignRight />
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: "6px" }}>
                                        <div style={{ fontWeight: "bold" }}>Text Align (V)</div>
                                        <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                                            {verticalAlignOptions.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    style={{
                                                        background: "none",
                                                        border:
                                                            textAlignVertical === opt.value ? "2px solid #3B82F6" : "1px solid #ccc",
                                                        cursor: "pointer",
                                                        padding: "4px",
                                                    }}
                                                    onClick={() => onChangeStyle({ textAlignVertical: opt.value })}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </NodeToolbar>
            )}

            {/* Хэндлы для React Flow */}
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: "#555", width: "7px", height: "7px" }}
            />
            <Handle
                type="source"
                position={Position.Right}
                style={{ background: "#555", width: "7px", height: "7px" }}
            />
        </div>
    );
};
//
// ---------- Узел типа CARD (тип "card") ----------
// Современный дизайн карточки с мягким градиентом и акцентными элементами
export const CardNode = ({ id, data, selected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(data.label || '');

    const computedWidth = data.geometry?.width || 250;
    const computedHeight = data.geometry?.height || 150;

    useEffect(() => {
        if (selected) {
            data.functions?.enableDragging && data.functions.enableDragging();
        } else {
            data.functions?.disableDragging && data.functions.disableDragging();
        }
    }, [selected, data.functions]);

    const startEditing = () => {
        setIsEditing(true);
        data.functions?.disableDragging && data.functions.disableDragging();
    };

    const finishEditing = () => {
        data.functions?.onLabelChange && data.functions.onLabelChange(id, value);
        setIsEditing(false);
        data.functions?.enableDragging && data.functions.enableDragging();
    };

    const handleDoubleClick = () => startEditing();
    const handleBlur = () => finishEditing();
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') finishEditing();
    };

    const containerStyle = {
        width: `${computedWidth}px`,
        height: `${computedHeight}px`,
        background: 'linear-gradient(180deg, #ffffff, #f8f8f8)',
        border: selected ? '2px solid #3B82F6' : '2px solid #e5e5e5',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        transition: 'border 0.2s ease, box-shadow 0.2s ease',
        fontFamily: data.style?.fontFamily || 'Helvetica, sans-serif',
        fontSize: data.style?.fontSize ? `${data.style.fontSize}px` : '16px',
        color: data.style?.color || '#333',
        ...data.style,
    };

    return (
        <div onDoubleClick={handleDoubleClick} style={containerStyle}>
            {isEditing ? (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    style={editingInputStyle}
                />
            ) : (
                <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{data.label}</div>
                    <div style={{ fontSize: '12px', marginBottom: '4px' }}>{data.description}</div>
                    <div style={{ fontSize: '12px', color: '#555' }}>
                        {data.dueDate ? new Date(data.dueDate).toLocaleDateString() : ''}
                    </div>
                </div>
            )}
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: '#555', width: '7px', height: '7px' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                style={{ background: '#555', width: '7px', height: '7px' }}
            />
            <NodeToolbar>
                <div
                    style={{
                        padding: '4px',
                        background: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                    }}
                >
                    <button onClick={startEditing}>Переименовать</button>
                    <button onClick={() => data.functions.removeNode(id)}>Удалить</button>
                </div>
            </NodeToolbar>
        </div>
    );
};

//
// ---------- Узел типа APP_CARD (тип "app_card") ----------
// Узел с современным разделением на хедер, тело и футер – чистый и аккуратный дизайн
export const AppCardNode = ({ id, data, selected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(data.label || '');

    const computedWidth = data.geometry?.width || 250;
    const computedHeight = data.geometry?.height || 150;

    useEffect(() => {
        if (selected) {
            data.functions?.enableDragging && data.functions.enableDragging();
        } else {
            data.functions?.disableDragging && data.functions.disableDragging();
        }
    }, [selected, data.functions]);

    const startEditing = () => {
        setIsEditing(true);
        data.functions?.disableDragging && data.functions.disableDragging();
    };

    const finishEditing = () => {
        data.functions?.onLabelChange && data.functions.onLabelChange(id, value);
        setIsEditing(false);
        data.functions?.enableDragging && data.functions.enableDragging();
    };

    const handleDoubleClick = () => startEditing();
    const handleBlur = () => finishEditing();
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') finishEditing();
    };

    const containerStyle = {
        width: `${computedWidth}px`,
        height: `${computedHeight}px`,
        background: 'linear-gradient(135deg, #e0f7fa, #b2ebf2)',
        border: selected ? '2px solid #3B82F6' : '2px dashed #007ACC',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        transition: 'border 0.2s ease, box-shadow 0.2s ease',
        fontFamily: data.style?.fontFamily || 'Verdana, sans-serif',
        fontSize: data.style?.fontSize ? `${data.style.fontSize}px` : '14px',
        ...data.style,
    };

    const headerStyle = {
        padding: '8px 16px',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        alignItems: 'center',
        fontWeight: 'bold',
        fontSize: '16px',
        color: '#007ACC',
        borderTopLeftRadius: '16px',
        borderTopRightRadius: '16px',
    };

    const footerStyle = {
        padding: '8px 16px',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderTop: '1px solid #ddd',
        textAlign: 'right',
        borderBottomLeftRadius: '16px',
        borderBottomRightRadius: '16px',
    };

    return (
        <div onDoubleClick={handleDoubleClick} style={containerStyle}>
            <div style={headerStyle}>
                <span style={{ marginRight: '4px' }}>📱</span> Приложение
            </div>
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                {isEditing ? (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        style={editingInputStyle}
                    />
                ) : (
                    data.label
                )}
            </div>
            <div style={footerStyle}>
                <div style={{ fontSize: '12px' }}>{data.description}</div>
                <div style={{ fontSize: '12px', color: '#555' }}>{data.status}</div>
            </div>
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: '#555', width: '7px', height: '7px' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                style={{ background: '#555', width: '7px', height: '7px' }}
            />
        </div>
    );
};

//
// ---------- Узел типа STICKY_NOTE (тип "sticky_note") ----------
// Современный дизайн с ярким, но не кричащим цветом – без наклона, чистый и аккуратный
export const StickyNoteNode = ({ id, data, selected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(data.label || '');

    const computedWidth = data.geometry?.width || 200;
    const computedHeight = data.geometry?.height || 200;

    useEffect(() => {
        if (selected) {
            data.functions?.enableDragging && data.functions.enableDragging();
        } else {
            data.functions?.disableDragging && data.functions.disableDragging();
        }
    }, [selected, data.functions]);

    const startEditing = () => {
        setIsEditing(true);
        data.functions?.disableDragging && data.functions.disableDragging();
    };

    const finishEditing = () => {
        data.functions?.onLabelChange && data.functions.onLabelChange(id, value);
        setIsEditing(false);
        data.functions?.enableDragging && data.functions.enableDragging();
    };

    const handleDoubleClick = () => startEditing();
    const handleBlur = () => finishEditing();
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') finishEditing();
    };

    const containerStyle = {
        width: `${computedWidth}px`,
        height: `${computedHeight}px`,
        backgroundColor: data.style?.fillColor || '#FFEB3B',
        border: selected ? '2px solid #3B82F6' : '2px solid #FFC107',
        // Убрана трансформация поворота – элемент остаётся прямым
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '12px',
        position: 'relative',
        fontFamily:
            data.style?.fontFamily || '"Comic Sans MS", cursive, sans-serif',
        fontSize: data.style?.fontSize ? `${data.style.fontSize}px` : '16px',
        transition: 'box-shadow 0.2s ease, border 0.2s ease',
        ...data.style,
    };

    return (
        <div onDoubleClick={handleDoubleClick} style={containerStyle}>
            {isEditing ? (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    style={editingInputStyle}
                />
            ) : (
                value
            )}
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: '#555', width: '7px', height: '7px' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                style={{ background: '#555', width: '7px', height: '7px' }}
            />
        </div>
    );
};

export const customNodeTypes = {
    text: TextNode,
    frame: FrameNode,
    image: ImageNode,
    shape: ShapeNode,
    card: CardNode,
    app_card: AppCardNode,
    sticky_note: StickyNoteNode,
};
