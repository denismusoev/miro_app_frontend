import React, { useState, useRef, useCallback } from 'react';
import { Handle, Position, NodeToolbar, NodeResizer } from '@xyflow/react';
import {
    ColorType,
    FontFamilyType,
    TextAlignType,
} from '../../model/Enums'; // ← тут используем ваши перечисления
import { Popover, hexToRgba } from '../../utils/nodeUtils'; // предположим, что у вас есть эти утилиты
// import { CustomFontSelect } from '../CustomFontSelect';      // компонент-выбор шрифта (как в ShapeNode)
import { FaFillDrip } from 'react-icons/fa';
import { MdFormatAlignLeft, MdFormatAlignCenter, MdFormatAlignRight, MdFormatColorText } from 'react-icons/md';
import { MdOpacity } from 'react-icons/md';

/**
 * Пример TextNode, повторяющий логику ShapeNode, но адаптированный под текст:
 * - Параметры: color, fillColor, fillOpacity, fontSize, fontFamily, textAlign
 * - Тот же принцип работы с редактированием, popover'ами, NodeResizer и т.д.
 * - Минимально необходимая стилизация для «чистого» текстового узла.
 */
export const TextNode = ({ id, data, selected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(data.label || '');

    // --- Состояния для popover-окон ---
    const [colorOpen, setColorOpen] = useState(false);
    const [fillOpen, setFillOpen] = useState(false);
    const [opacityOpen, setOpacityOpen] = useState(false);
    const [fontSizeOpen, setFontSizeOpen] = useState(false);
    const [fontFamilyOpen, setFontFamilyOpen] = useState(false);
    const [textAlignOpen, setTextAlignOpen] = useState(false);

    // --- Рефы для якорей popover-окон ---
    const colorRef = useRef(null);
    const fillRef = useRef(null);
    const opacityRef = useRef(null);
    const fontSizeRef = useRef(null);
    const fontFamilyRef = useRef(null);
    const textAlignRef = useRef(null);

    // --- Извлечение стилей из data.style ---
    const {
        color = ColorType.BLACK,            // цвет текста
        fillColor = ColorType.WHITE,        // цвет фона
        fillOpacity = 1.0,   // прозрачность фона
        fontSize = 14,
        fontFamily = FontFamilyType.ARIAL,
        textAlign = TextAlignType.LEFT,
    } = data.style || {};

    // --- Логика редактирования текста ---
    const startEditing = () => {
        setIsEditing(true);
        data.functions?.disableDragging?.();
    };
    const finishEditing = () => {
        data.functions?.onLabelChange?.(id, value);
        setIsEditing(false);
        data.functions?.enableDragging?.();
    };
    const handleDoubleClick = () => startEditing();
    const handleBlur = () => finishEditing();
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') finishEditing();
    };

    // --- Функция обновления стиля ---
    const handleStyleChange = useCallback(
        (newStyle) => {
            if (data.functions?.onStyleChange) {
                const updatedStyle = { ...data.style, ...newStyle };
                data.functions.onStyleChange(id, updatedStyle);
            }
        },
        [data.style, data.functions, id]
    );

    // --- Сборки массивов для выбора ---
    const colorOptions = Object.values(ColorType);        // для текста
    const fillColorOptions = Object.values(ColorType);    // для фона
    const fontFamilies = Object.values(FontFamilyType);

    // --- Тогглы открытия/закрытия popover'ов ---
    const toggleColor = () => {
        setColorOpen((prev) => !prev);
        setFillOpen(false);
        setOpacityOpen(false);
        setFontSizeOpen(false);
        setFontFamilyOpen(false);
        setTextAlignOpen(false);
    };
    const toggleFill = () => {
        setFillOpen((prev) => !prev);
        setColorOpen(false);
        setOpacityOpen(false);
        setFontSizeOpen(false);
        setFontFamilyOpen(false);
        setTextAlignOpen(false);
    };
    const toggleOpacity = () => {
        setOpacityOpen((prev) => !prev);
        setColorOpen(false);
        setFillOpen(false);
        setFontSizeOpen(false);
        setFontFamilyOpen(false);
        setTextAlignOpen(false);
    };
    const toggleFontSize = () => {
        setFontSizeOpen((prev) => !prev);
        setColorOpen(false);
        setFillOpen(false);
        setOpacityOpen(false);
        setFontFamilyOpen(false);
        setTextAlignOpen(false);
    };
    const toggleFontFamily = () => {
        setFontFamilyOpen((prev) => !prev);
        setColorOpen(false);
        setFillOpen(false);
        setOpacityOpen(false);
        setFontSizeOpen(false);
        setTextAlignOpen(false);
    };
    const toggleTextAlign = () => {
        setTextAlignOpen((prev) => !prev);
        setColorOpen(false);
        setFillOpen(false);
        setOpacityOpen(false);
        setFontSizeOpen(false);
        setFontFamilyOpen(false);
    };

    // --- Расчёт итоговой заливки фона с учётом непрозрачности ---
    // Если fillOpacity === DEFAULT, можно трактовать её как 1.0 (или по-своему).
    // const opacityValue = fillOpacity === FillOpacityType.DEFAULT ? '1.0' : fillOpacity;
    const backgroundRgba = hexToRgba(fillColor, parseFloat(1.0));

    // --- Стили для внешнего контейнера (с резайзером) ---
    const outerStyle = {
        // position: 'relative',
        // width: `${data.geometry?.width || 120}px`,
        // height: `${data.geometry?.height || 60}px`,
    };

    // --- Стили для внутреннего контейнера (фон, текст) ---
    const innerStyle = {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        justifyContent: textAlign,
        alignItems: 'center',
        fontFamily,
        fontSize: `${fontSize}px`,
        color,
        backgroundColor: backgroundRgba,
        boxSizing: 'border-box',
        padding: '4px',
        overflow: 'hidden',
    };

    return (
        <div onDoubleClick={handleDoubleClick} style={outerStyle}>
            <div
                style={{
                    position: 'absolute',
                    top: -2,
                    left: -2,
                    right: -2,
                    bottom: -2,
                }}
            >

                {/* Resizer */}
                <NodeResizer
                    color="rgba(59, 130, 246)"
                    isVisible={selected}
                    onResizeEnd={(e, newSize) => {
                        data.functions?.onGeometryChange?.(id, {
                            width: newSize.width,
                            height: newSize.height,
                        });
                    }}
                />
            </div>

            <div style={innerStyle}>
                <NodeToolbar
                    isVisible={selected}
                    position={Position.Top}
                    className="bg-white rounded shadow-sm"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 12px',
                        gap: '12px',
                        minWidth: 'auto',
                    }}
                >
                    {/* 1. Выбор шрифта */}
                    {/* <CustomFontSelect
                        fontFamilies={fontFamilies}
                        value={fontFamily}
                        onChange={(newFont) => handleStyleChange({ fontFamily: newFont })}
                    /> */}

                    {/* Разделитель */}
                    <div
                        style={{
                            width: '1px',
                            height: '24px',
                            backgroundColor: '#787878',
                            opacity: 0.3,
                        }}
                    />

                    {/* 2. Поле ввода размера шрифта */}
                    <input
                        type="number"
                        className="form-control form-control-sm"
                        ref={fontSizeRef}
                        value={fontSize}
                        onChange={(e) =>
                            handleStyleChange({ fontSize: parseInt(e.target.value, 10) || 1 })
                        }
                        style={{
                            width: '60px',
                            border: 'none',
                            background: 'transparent',
                            outline: 'none',
                            textAlign: 'center',
                            fontSize: 'inherit',
                            cursor: 'pointer',
                        }}
                    />

                    {/* Разделитель */}
                    <div
                        style={{
                            width: '1px',
                            height: '24px',
                            backgroundColor: '#787878',
                            opacity: 0.3,
                        }}
                    />

                    {/* 3. Текст: color (иконка + popover) */}
                    <div className="position-relative">
                        <button
                            className="btn btn-link p-0 text-muted"
                            onClick={toggleColor}
                            ref={colorRef}
                            title="Text Color"
                            style={{ cursor: 'pointer' }}
                        >
                            <MdFormatColorText size={16} />
                        </button>
                        <Popover
                            isOpen={colorOpen}
                            anchorRef={colorRef}
                            onClose={() => setColorOpen(false)}
                        >
                            <div
                                className="d-flex flex-wrap gap-2 p-2"
                                style={{ maxWidth: '250px' }}
                            >
                                {colorOptions.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => {
                                            handleStyleChange({ color: c });
                                            setColorOpen(false);
                                        }}
                                        style={{
                                            width: '24px',
                                            height: '24px',
                                            backgroundColor: c,
                                            border: 'none',
                                            cursor: 'pointer',
                                        }}
                                    />
                                ))}
                            </div>
                        </Popover>
                    </div>

                    {/* Разделитель */}
                    <div
                        style={{
                            width: '1px',
                            height: '24px',
                            backgroundColor: '#787878',
                            opacity: 0.3,
                        }}
                    />

                    {/* 4. Заливка: fillColor (иконка + popover) */}
                    <div className="position-relative">
                        <button
                            className="btn btn-link p-0 text-muted"
                            onClick={toggleFill}
                            ref={fillRef}
                            title="Fill Color"
                            style={{ cursor: 'pointer' }}
                        >
                            <FaFillDrip size={16} />
                        </button>
                        <Popover
                            isOpen={fillOpen}
                            anchorRef={fillRef}
                            onClose={() => setFillOpen(false)}
                        >
                            <div
                                className="d-flex flex-wrap gap-2 p-2"
                                style={{ maxWidth: '250px' }}
                            >
                                {fillColorOptions.map((fc) => (
                                    <button
                                        key={fc}
                                        onClick={() => {
                                            handleStyleChange({ fillColor: fc });
                                            setFillOpen(false);
                                        }}
                                        style={{
                                            width: '24px',
                                            height: '24px',
                                            backgroundColor: fc,
                                            border: 'none',
                                            cursor: 'pointer',
                                        }}
                                    />
                                ))}
                            </div>
                        </Popover>
                    </div>

                    {/* Разделитель */}
                    <div
                        style={{
                            width: '1px',
                            height: '24px',
                            backgroundColor: '#787878',
                            opacity: 0.3,
                        }}
                    />

                    {/* 5. Прозрачность: fillOpacity (иконка + popover) */}
                    {/*<div className="position-relative">*/}
                    {/*    <button*/}
                    {/*        className="btn btn-link p-0 text-muted"*/}
                    {/*        onClick={toggleOpacity}*/}
                    {/*        ref={opacityRef}*/}
                    {/*        title="Fill Opacity"*/}
                    {/*        style={{ cursor: 'pointer' }}*/}
                    {/*    >*/}
                    {/*        <MdOpacity size={16} />*/}
                    {/*    </button>*/}
                    {/*    <Popover*/}
                    {/*        isOpen={opacityOpen}*/}
                    {/*        anchorRef={opacityRef}*/}
                    {/*        onClose={() => setOpacityOpen(false)}*/}
                    {/*    >*/}
                    {/*        <div className="d-flex flex-column gap-1 p-2">*/}
                    {/*            {opacityOptions.map((op) => (*/}
                    {/*                <button*/}
                    {/*                    key={op}*/}
                    {/*                    className="btn btn-sm"*/}
                    {/*                    onClick={() => {*/}
                    {/*                        handleStyleChange({ fillOpacity: op });*/}
                    {/*                        setOpacityOpen(false);*/}
                    {/*                    }}*/}
                    {/*                >*/}
                    {/*                    {op}*/}
                    {/*                </button>*/}
                    {/*            ))}*/}
                    {/*        </div>*/}
                    {/*    </Popover>*/}
                    {/*</div>*/}

                    {/* Разделитель */}
                    <div
                        style={{
                            width: '1px',
                            height: '24px',
                            backgroundColor: '#787878',
                            opacity: 0.3,
                        }}
                    />

                    {/* 6. Горизонтальное выравнивание (textAlign) */}
                    <div className="position-relative">
                        <button
                            className="btn btn-link p-0 text-muted"
                            onClick={toggleTextAlign}
                            ref={textAlignRef}
                            title="Text Align"
                            style={{ cursor: 'pointer' }}
                        >
                            {textAlign === TextAlignType.LEFT && <MdFormatAlignLeft size={16} />}
                            {textAlign === TextAlignType.CENTER && <MdFormatAlignCenter size={16} />}
                            {textAlign === TextAlignType.RIGHT && <MdFormatAlignRight size={16} />}
                        </button>
                        <Popover
                            isOpen={textAlignOpen}
                            anchorRef={textAlignRef}
                            onClose={() => setTextAlignOpen(false)}
                        >
                            <div
                                className="d-flex justify-content-around align-items-center px-2 py-1"
                                style={{ minWidth: '120px' }}
                            >
                                <button
                                    className="btn btn-link p-0 text-muted"
                                    onClick={() => handleStyleChange({ textAlign: TextAlignType.LEFT })}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <MdFormatAlignLeft size={18} />
                                </button>
                                <button
                                    className="btn btn-link p-0 text-muted"
                                    onClick={() => handleStyleChange({ textAlign: TextAlignType.CENTER })}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <MdFormatAlignCenter size={18} />
                                </button>
                                <button
                                    className="btn btn-link p-0 text-muted"
                                    onClick={() => handleStyleChange({ textAlign: TextAlignType.RIGHT })}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <MdFormatAlignRight size={18} />
                                </button>
                            </div>
                        </Popover>
                    </div>
                </NodeToolbar>
                {isEditing ? (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        style={{
                            width: '100%',
                            height: '100%',
                            outline: 'none',
                            border: 'none',
                            background: 'transparent',
                            fontFamily,
                            fontSize: `${fontSize}px`,
                            textAlign,
                            color,
                        }}
                    />
                ) : (
                    <span style={{ width: '100%', textAlign }}>{value}</span>
                )}
            </div>

            {/* Handle'ы */}
            <Handle
                type="target"
                position={Position.Left}
                style={{
                    background: selected ? '#3b82f6' : 'transparent',
                    width: selected ? 10 : 7,
                    height: selected ? 10 : 7,
                    border: selected ? '2px solid #fff' : 'none',
                    boxShadow: selected ? '0 2px 4px rgba(0, 0, 0, 0.15)' : 'none',
                    opacity: selected ? 1 : 0,
                    pointerEvents: selected ? 'auto' : 'none',
                }}
            />
            <Handle
                type="source"
                position={Position.Right}
                style={{
                    background: selected ? '#3b82f6' : 'transparent',
                    width: selected ? 10 : 7,
                    height: selected ? 10 : 7,
                    border: selected ? '2px solid #fff' : 'none',
                    boxShadow: selected ? '0 2px 4px rgba(0, 0, 0, 0.15)' : 'none',
                    opacity: selected ? 1 : 0,
                    pointerEvents: selected ? 'auto' : 'none',
                }}
            />
        </div>
    );
};
