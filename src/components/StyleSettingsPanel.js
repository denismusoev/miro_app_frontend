import React, { useState, useRef } from 'react';
import { NodeToolbar, Position } from '@xyflow/react';
// если у вас reactflow, то { NodeToolbar, Position } из 'reactflow'
import { FaFillDrip, FaBorderStyle, FaFont, FaAlignLeft, FaAlignCenter, FaAlignRight } from 'react-icons/fa';

import {
    BorderStyleType,
    FillColorType,
    FillOpacityType,
    FontFamilyType,
    TextAlignType,
    TextAlignVerticalType,
} from '../model/Enums';

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
    { label: 'Top', value: TextAlignVerticalType.TOP },
    { label: 'Middle', value: TextAlignVerticalType.MIDDLE },
    { label: 'Bottom', value: TextAlignVerticalType.BOTTOM },
];

/**
 * NodeWithShapePanel – пример узла, где при выборе (или при forceToolbarVisible)
 * отображается панель (NodeToolbar), в которой расположены кнопки и мини-меню
 * для настройки ShapeStyle (fill, border, text).
 * Аналогично примеру с сайта (NodeWithToolbar),
 * здесь можно управлять isVisible и position из data.
 */
function NodeWithShapePanel({ data }) {
    // Допустим, стили элемента у нас тоже приходят из data.style
    // (либо храните их в локальном стейте, если нужно).
    const nodeStyle = data?.style || {};

    // Состояние открытия/закрытия «подпанелей»
    const [fillMenuOpen, setFillMenuOpen] = useState(false);
    const [borderMenuOpen, setBorderMenuOpen] = useState(false);
    const [textMenuOpen, setTextMenuOpen] = useState(false);

    // Рефы для проверки кликов внутри мини-панелей
    const fillMenuRef = useRef(null);
    const borderMenuRef = useRef(null);
    const textMenuRef = useRef(null);

    // Деструктурируем поля стиля
    const {
        borderColor = '#1a1a1a',
        borderOpacity = 1.0,
        borderStyle = BorderStyleType.NORMAL,
        borderWidth = 2,
        color = '#1a1a1a',
        fillColor = FillColorType.WHITE,
        fillOpacity = FillOpacityType.OPAQUE,
        fontSize = 14,
        fontFamily = FontFamilyType.ARIAL,
        textAlign = TextAlignType.CENTER,
        textAlignVertical = TextAlignVerticalType.TOP,
    } = nodeStyle;

    // Функция изменения стилей
    const onChangeStyle = (newProps) => {
        if (data?.onChangeStyle) {
            data.onChangeStyle(newProps);
        }
    };

    // Определяем, показывать ли toolbar
    // В официальном примере используется data.forceToolbarVisible и data.toolbarPosition.
    // Вы можете хранить видимость и позицию в data или в своем стейте.
    const isVisible = data.forceToolbarVisible ?? false;
    const toolbarPosition = data.toolbarPosition || Position.Top;

    // Обработчик клика вне Toolbar – можно перехватить и проверить, кликнули ли мы внутри одного из подменю
    const handleClickOutside = (evt) => {
        if (
            fillMenuRef.current?.contains(evt.target) ||
            borderMenuRef.current?.contains(evt.target) ||
            textMenuRef.current?.contains(evt.target)
        ) {
            // клик внутри «подпанели», не закрываем
            return;
        }
        // иначе скрываем панель (или просто закрываем подменю)
        setFillMenuOpen(false);
        setBorderMenuOpen(false);
        setTextMenuOpen(false);
        // Если нужно полностью скрыть toolbar, то нужно связать isVisible со стейтом
        // и здесь менять setToolbarVisible(false) и т. д.
    };

    return (
        <>
            {/* NodeToolbar по аналогии с демо */}
            <NodeToolbar
                isVisible={isVisible}
                position={toolbarPosition}
                onClickOutside={handleClickOutside}
            >
                {/* Основная панель – три иконки (Fill, Border, Text) */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* Кнопка «Fill» */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => {
                                setFillMenuOpen(!fillMenuOpen);
                                setBorderMenuOpen(false);
                                setTextMenuOpen(false);
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            title="Fill settings"
                        >
                            <FaFillDrip size={18} />
                        </button>
                        {fillMenuOpen && (
                            <div
                                ref={fillMenuRef}
                                style={{
                                    position: 'absolute',
                                    top: '28px',
                                    left: 0,
                                    width: '220px',
                                    background: '#fff',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    padding: '8px',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                    zIndex: 999,
                                }}
                            >
                                <div style={{ marginBottom: '6px', fontWeight: 'bold' }}>Fill Color</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {fillColorOptions.map((val) => (
                                        <div
                                            key={val}
                                            onClick={() => onChangeStyle({ fillColor: val })}
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '3px',
                                                background: val,
                                                border: fillColor === val ? '2px solid #3B82F6' : '1px solid #ccc',
                                                cursor: 'pointer',
                                            }}
                                        />
                                    ))}
                                </div>

                                <div style={{ marginTop: '6px' }}>
                                    <div style={{ fontWeight: 'bold' }}>Fill Opacity</div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={parseFloat(fillOpacity)}
                                        onChange={(e) => onChangeStyle({ fillOpacity: e.target.value })}
                                    />
                                    <span style={{ marginLeft: '4px' }}>
                    {Math.round(parseFloat(fillOpacity) * 100)}%
                  </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Кнопка «Border» */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => {
                                setBorderMenuOpen(!borderMenuOpen);
                                setFillMenuOpen(false);
                                setTextMenuOpen(false);
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            title="Border settings"
                        >
                            <FaBorderStyle size={18} />
                        </button>
                        {borderMenuOpen && (
                            <div
                                ref={borderMenuRef}
                                style={{
                                    position: 'absolute',
                                    top: '28px',
                                    left: 0,
                                    width: '240px',
                                    background: '#fff',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    padding: '8px',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                    zIndex: 999,
                                }}
                            >
                                <div style={{ marginBottom: '6px', fontWeight: 'bold' }}>Border Color</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {fillColorOptions.map((val) => (
                                        <div
                                            key={val}
                                            onClick={() => onChangeStyle({ borderColor: val })}
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '3px',
                                                background: val,
                                                border: borderColor === val ? '2px solid #3B82F6' : '1px solid #ccc',
                                                cursor: 'pointer',
                                            }}
                                        />
                                    ))}
                                </div>

                                <div style={{ marginTop: '6px' }}>
                                    <div style={{ fontWeight: 'bold' }}>Border Opacity</div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={parseFloat(borderOpacity)}
                                        onChange={(e) => onChangeStyle({ borderOpacity: e.target.value })}
                                    />
                                    <span style={{ marginLeft: '4px' }}>
                    {Math.round(parseFloat(borderOpacity) * 100)}%
                  </span>
                                </div>

                                <div style={{ marginTop: '6px' }}>
                                    <div style={{ fontWeight: 'bold' }}>Border Width</div>
                                    <input
                                        type="number"
                                        style={{ width: '60px' }}
                                        value={borderWidth}
                                        onChange={(e) => onChangeStyle({ borderWidth: Number(e.target.value) })}
                                    />
                                </div>

                                <div style={{ marginTop: '6px' }}>
                                    <div style={{ fontWeight: 'bold' }}>Border Style</div>
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
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => {
                                setTextMenuOpen(!textMenuOpen);
                                setFillMenuOpen(false);
                                setBorderMenuOpen(false);
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            title="Text settings"
                        >
                            <FaFont size={18} />
                        </button>
                        {textMenuOpen && (
                            <div
                                ref={textMenuRef}
                                style={{
                                    position: 'absolute',
                                    top: '28px',
                                    left: 0,
                                    width: '220px',
                                    background: '#fff',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    padding: '8px',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                    zIndex: 999,
                                }}
                            >
                                <div style={{ marginBottom: '6px', fontWeight: 'bold' }}>Text Color</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {textColorOptions.map((val) => (
                                        <div
                                            key={val}
                                            onClick={() => onChangeStyle({ color: val })}
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                background: val,
                                                border: color === val ? '2px solid #3B82F6' : '1px solid #ccc',
                                                cursor: 'pointer',
                                            }}
                                        />
                                    ))}
                                </div>

                                <div style={{ marginTop: '6px' }}>
                                    <div style={{ fontWeight: 'bold' }}>Font Size</div>
                                    <input
                                        type="number"
                                        style={{ width: '60px' }}
                                        value={fontSize}
                                        onChange={(e) => onChangeStyle({ fontSize: Number(e.target.value) })}
                                    />
                                </div>

                                <div style={{ marginTop: '6px' }}>
                                    <div style={{ fontWeight: 'bold' }}>Font Family</div>
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

                                <div style={{ marginTop: '6px' }}>
                                    <div style={{ fontWeight: 'bold' }}>Text Align (H)</div>
                                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                        <button
                                            style={{
                                                background: 'none',
                                                border: textAlign === TextAlignType.LEFT ? '2px solid #3B82F6' : '1px solid #ccc',
                                                cursor: 'pointer',
                                                padding: '4px',
                                            }}
                                            onClick={() => onChangeStyle({ textAlign: TextAlignType.LEFT })}
                                        >
                                            <FaAlignLeft />
                                        </button>
                                        <button
                                            style={{
                                                background: 'none',
                                                border: textAlign === TextAlignType.CENTER ? '2px solid #3B82F6' : '1px solid #ccc',
                                                cursor: 'pointer',
                                                padding: '4px',
                                            }}
                                            onClick={() => onChangeStyle({ textAlign: TextAlignType.CENTER })}
                                        >
                                            <FaAlignCenter />
                                        </button>
                                        <button
                                            style={{
                                                background: 'none',
                                                border: textAlign === TextAlignType.RIGHT ? '2px solid #3B82F6' : '1px solid #ccc',
                                                cursor: 'pointer',
                                                padding: '4px',
                                            }}
                                            onClick={() => onChangeStyle({ textAlign: TextAlignType.RIGHT })}
                                        >
                                            <FaAlignRight />
                                        </button>
                                    </div>
                                </div>

                                <div style={{ marginTop: '6px' }}>
                                    <div style={{ fontWeight: 'bold' }}>Text Align (V)</div>
                                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                        {verticalAlignOptions.map((opt) => (
                                            <button
                                                key={opt.value}
                                                style={{
                                                    background: 'none',
                                                    border: textAlignVertical === opt.value ? '2px solid #3B82F6' : '1px solid #ccc',
                                                    cursor: 'pointer',
                                                    padding: '4px',
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

            {/* Сам контент узла. Например, текстовый лейбл */}
            <div style={{ padding: '6px' }}>{data?.label || 'Node With Shape Panel'}</div>
        </>
    );
}

export default NodeWithShapePanel;
