import React, { useState, useRef, useCallback } from 'react';
import { Handle, Position, NodeToolbar } from 'reactflow';
import {
    FillColorType,
    FontFamilyType,
    TextAlignType,
    TextAlignVerticalType,
} from '../../model/Enums';
import { FaFillDrip } from 'react-icons/fa';
import {
    MdFormatAlignLeft,
    MdFormatAlignCenter,
    MdFormatAlignRight,
    MdVerticalAlignTop,
} from 'react-icons/md';
import { Popover, hexToRgba, getFlexAlignByVerticalTextAlign } from '../../utils/nodeUtils';
import {CustomFontSelect} from "../CustomFontSelect";

export const ShapeNode = ({ id, data, selected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(data.label || '');

    // Состояния popover-окон
    const [fillOpen, setFillOpen] = useState(false);
    const [fontSizeOpen, setFontSizeOpen] = useState(false);
    const [fontFamilyOpen, setFontFamilyOpen] = useState(false);
    const [textAlignOpen, setTextAlignOpen] = useState(false);
    const [verticalAlignOpen, setVerticalAlignOpen] = useState(false);

    // Рефы для popover-окон
    const fillRef = useRef(null);
    const fontSizeRef = useRef(null);
    const fontFamilyRef = useRef(null);
    const textAlignRef = useRef(null);
    const verticalAlignRef = useRef(null);

    // Извлечение стилей из data.style
    const {
        fillColor = FillColorType.WHITE,
        textAlign = TextAlignType.CENTER,
        fontSize = 14,
        fontFamily = FontFamilyType.ARIAL,
        textAlignVertical = TextAlignVerticalType.TOP,
    } = data.style || {};

    // Функции редактирования текста
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

    // Функция обновления стилей
    const handleStyleChange = useCallback(
        (newStylePart) => {
            if (data.functions?.onStyleChange) {
                const updatedStyle = { ...data.style, ...newStylePart };
                data.functions.onStyleChange(id, updatedStyle);
            }
        },
        [data.style, data.functions, id]
    );

    // Тогглы открытия popover
    const toggleFill = () => {
        setFillOpen((prev) => !prev);
        setFontSizeOpen(false);
        setFontFamilyOpen(false);
        setTextAlignOpen(false);
        setVerticalAlignOpen(false);
    };
    const toggleFontSize = () => {
        setFontSizeOpen((prev) => !prev);
        setFillOpen(false);
        setFontFamilyOpen(false);
        setTextAlignOpen(false);
        setVerticalAlignOpen(false);
    };
    const toggleFontFamily = () => {
        setFontFamilyOpen((prev) => !prev);
        setFillOpen(false);
        setFontSizeOpen(false);
        setTextAlignOpen(false);
        setVerticalAlignOpen(false);
    };
    const toggleTextAlign = () => {
        setTextAlignOpen((prev) => !prev);
        setFillOpen(false);
        setFontSizeOpen(false);
        setFontFamilyOpen(false);
        setVerticalAlignOpen(false);
    };
    const toggleVerticalAlign = () => {
        setVerticalAlignOpen((prev) => !prev);
        setFillOpen(false);
        setFontSizeOpen(false);
        setFontFamilyOpen(false);
        setTextAlignOpen(false);
    };

    // Опции для выбора цвета (набор цветных квадратиков)
    const fillColorOptions = Object.values(FillColorType);
    const fontFamilies = Object.values(FontFamilyType);

    // Вычисление alignItems по вертикальному выравниванию
    const alignItems = getFlexAlignByVerticalTextAlign(textAlignVertical);

    // Преобразуем fillColor в rgba
    const backgroundRgba = hexToRgba(fillColor, 1);

    // Стили для внешнего контейнера узла с выделением поверх
    const outerStyle = {
        position: 'relative',
        width: `${data.geometry?.width || 120}px`,
        height: `${data.geometry?.height || 80}px`,
    };

    // Слой выделения, отображающийся поверх заливки
    const highlightStyle = {
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        borderRadius: '8px',
        boxShadow: selected
            ? '8px 8px 18px rgba(59,130,246,0.3)'
            : '2px 2px 6px rgba(0,0,0,0.1)',
        transition: 'box-shadow 0.2s ease',
    };

    // Стиль внутреннего контейнера узла
    const innerStyle = {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        justifyContent: textAlign,
        alignItems,
        fontFamily,
        fontSize: `${fontSize}px`,
        color: '#000',
        overflow: 'hidden',
        backgroundColor: backgroundRgba,
        borderRadius: '8px',
        padding: '4px',
        boxSizing: 'border-box',
    };

    // Стили для панели (toolbar)
    const toolbarStyle = {
        minWidth: 'auto',
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'row',
        gap: '12px',
        fontSize: '14px',
    };

    return (
        <div style={outerStyle} onDoubleClick={handleDoubleClick}>
            <div style={highlightStyle} />
            <div style={innerStyle}>
                {selected && (
                    <NodeToolbar
                        isVisible
                        position={Position.Top}
                        className="bg-white rounded shadow-sm"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px 12px',
                            gap: '12px',
                            // Ширина определяется содержимым
                            minWidth: 'auto',
                        }}
                    >
                        {/* Блок выбора шрифта (CustomFontSelect) */}
                        <CustomFontSelect
                            fontFamilies={fontFamilies}
                            value={fontFamily}
                            onChange={(newFont) => handleStyleChange({ fontFamily: newFont })}
                        />
                        <div style={{ width: '1px', height: '24px', backgroundColor: '#787878', opacity: 0.3 }} />

                        {/* Поле для ввода размера шрифта */}
                        <input
                            type="number"
                            className="form-control form-control-sm"
                            value={fontSize}
                            onChange={(e) => handleStyleChange({ fontSize: parseInt(e.target.value) })}
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
                        <div style={{ width: '1px', height: '24px', backgroundColor: '#787878', opacity: 0.3 }} />

                        {/* Выбор цвета через иконку */}
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
                            <Popover customWidth={'235px'} isOpen={fillOpen} anchorRef={fillRef} onClose={() => setFillOpen(false)}>
                                <div className="d-flex flex-wrap gap-2">
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
                        <div style={{ width: '1px', height: '24px', backgroundColor: '#787878', opacity: 0.3 }} />

                        {/* Блок настройки горизонтального выравнивания */}
                        <div className="position-relative">
                            <button
                                className="btn btn-link p-0 text-muted"
                                onClick={toggleTextAlign}
                                ref={textAlignRef}
                                title="Horizontal Align"
                                style={{ cursor: 'pointer' }}
                            >
                                {textAlign === 'left' && <MdFormatAlignLeft size={16} />}
                                {textAlign === 'center' && <MdFormatAlignCenter size={16} />}
                                {textAlign === 'right' && <MdFormatAlignRight size={16} />}
                            </button>
                            <Popover isOpen={textAlignOpen} anchorRef={textAlignRef} onClose={() => setTextAlignOpen(false)}>
                                <div
                                    className="d-flex justify-content-around align-items-center px-2 py-1"
                                    style={{ minWidth: '120px' }}
                                >
                                    <button
                                        className="btn btn-link p-0 text-muted"
                                        onClick={() => handleStyleChange({ textAlign: 'left' })}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <MdFormatAlignLeft size={18} />
                                    </button>
                                    <button
                                        className="btn btn-link p-0 text-muted"
                                        onClick={() => handleStyleChange({ textAlign: 'center' })}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <MdFormatAlignCenter size={18} />
                                    </button>
                                    <button
                                        className="btn btn-link p-0 text-muted"
                                        onClick={() => handleStyleChange({ textAlign: 'right' })}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <MdFormatAlignRight size={18} />
                                    </button>
                                </div>
                            </Popover>
                        </div>
                        <div style={{ width: '1px', height: '24px', backgroundColor: '#787878', opacity: 0.3 }} />

                        {/* Блок настройки вертикального выравнивания */}
                        <div className="position-relative">
                            <button
                                className="btn btn-link p-0 text-muted"
                                onClick={toggleVerticalAlign}
                                ref={verticalAlignRef}
                                title="Vertical Align"
                                style={{cursor: 'pointer'}}
                            >
                                <MdVerticalAlignTop size={16}/>
                            </button>
                            <Popover
                                isOpen={verticalAlignOpen}
                                anchorRef={verticalAlignRef}
                                onClose={() => setVerticalAlignOpen(false)}
                            >
                                <div
                                    style={{
                                        display: 'inline-flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px',
                                        width: 'auto',
                                        minWidth: 'auto',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    <button
                                        className="btn btn-link p-0 text-muted"
                                        onClick={() => handleStyleChange({ textAlignVertical: 'top' })}
                                    >
                                        <MdVerticalAlignTop size={18} />
                                    </button>
                                    <button
                                        className="btn btn-link p-0 text-muted"
                                        onClick={() => handleStyleChange({ textAlignVertical: 'middle' })}
                                        style={{ transform: 'rotate(90deg)' }}
                                    >
                                        <MdVerticalAlignTop size={18} />
                                    </button>
                                    <button
                                        className="btn btn-link p-0 text-muted"
                                        onClick={() => handleStyleChange({ textAlignVertical: 'bottom' })}
                                        style={{ transform: 'rotate(180deg)' }}
                                    >
                                        <MdVerticalAlignTop size={18} />
                                    </button>
                                </div>
                            </Popover>

                        </div>

                    </NodeToolbar>

                )}

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
                        }}
                    />
                ) : (
                    <span
                        style={{
                            width: '100%',
                            textAlign,
                        }}
                    >
            {value}
          </span>
                )}
            </div>
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
