import React, { useState, useRef, useMemo, useCallback, memo, useEffect } from 'react';
import { NodeToolbar } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { Select, InputNumber, Popover, Button, Slider } from 'antd';
import { AiOutlineBorder } from 'react-icons/ai';
import { MdOutlineFormatColorText, MdFormatColorFill, MdOutlineFormatAlignCenter, MdFormatAlignLeft, MdFormatAlignCenter, MdFormatAlignRight, MdVerticalAlignTop } from 'react-icons/md';
import { CirclePicker } from 'react-color';
import { hexToRgba, getFlexAlignByVerticalTextAlign } from '../../utils/nodeUtils';
import {
    ColorType,
    FontFamilyType,
    TextAlignType,
    TextAlignVerticalType,
    BorderStyleType,
    ShapeType,
} from '../../model/Enums';
import { AlignCenterOutlined, BgColorsOutlined, FontColorsOutlined } from "@ant-design/icons";
import { TfiLayoutLineSolid } from "react-icons/tfi";
import { TbLineDashed, TbLineDotted } from "react-icons/tb";
import { FaRegCircle } from "react-icons/fa";
import { throttle } from 'lodash';

// Массив доступных фигур
const shapeOptions = [
    { value: ShapeType.CIRCLE, label: 'Круг' },
    { value: ShapeType.RECTANGLE, label: 'Прямоугольник' },
    { value: ShapeType.ROUND_RECTANGLE, label: 'Закругленный прямоугольник' },
    { value: ShapeType.RHOMBUS, label: 'Ромб' },
    { value: ShapeType.TRIANGLE, label: 'Треугольник' },
    { value: ShapeType.PARALLELOGRAM, label: 'Параллелограмм' },
    { value: ShapeType.TRAPEZOID, label: 'Трапеция' },
    { value: ShapeType.PENTAGON, label: 'Пятиугольник' },
    { value: ShapeType.HEXAGON, label: 'Шестиугольник' },
    { value: ShapeType.OCTAGON, label: 'Восьмиугольник' },
    { value: ShapeType.STAR, label: 'Звезда' },
    { value: ShapeType.CLOUD, label: 'Облако' },
];

// Типы (приведены для наглядности; подключите свои enum'ы)
// const TextAlignType          = { LEFT: 'left', CENTER: 'center', RIGHT: 'right' };
// const TextAlignVerticalType  = { TOP: 'top', MIDDLE: 'middle', BOTTOM: 'bottom' };
// const ShapeType = {
//     CIRCLE: 'circle',
//     ROUND_RECTANGLE: 'roundRect',
//     RECTANGLE: 'rect',
//     RHOMBUS: 'rhombus',
//     TRIANGLE: 'triangle',
//     PARALLELOGRAM: 'parallelogram',
//     TRAPEZOID: 'trapezoid',
//     PENTAGON: 'pentagon',
//     HEXAGON: 'hexagon',
//     OCTAGON: 'octagon',
//     STAR: 'star',
//     CLOUD: 'cloud',
// };

// Константы
const ROUND_RECTANGLE_RADIUS = 10;
const TEXT_MARGIN = 30;

const PADDING = 5;                // поставьте 0, если отступы не нужны

const getBorderStyleExtra = (borderStyle, strokeW) => {
    switch (borderStyle) {
        case BorderStyleType.DASHED:
            return {
                strokeDasharray: `${4 * strokeW} ${2 * strokeW}`,
                strokeLinecap: "butt",
            };
        case BorderStyleType.DOTTED:
            return {
                strokeDasharray: `${strokeW} ${1.5 * strokeW}`,
                strokeLinecap: "round",
            };
        default:
            return { strokeDasharray: "none", strokeLinecap: "butt" };
    }
};

const ShapeRenderer = memo(
    ({
         shapeType,
         width,
         height,
         shapeStyles,
         textPosition,
         textStyles,
         nodeContent,
         color,
         id,
     }) => {
        

        // Правильный n‑угольник
        const createRegularPolygon = (
            cx,
            cy,
            r,
            sides,
            fullW,
            fullH,
            props = {}
        ) => {
            const scaleX = fullW / Math.min(fullW, fullH);
            const scaleY = fullH / Math.min(fullW, fullH);
            const points = Array.from({ length: sides }, (_, i) => {
            const a = (i * 2 * Math.PI) / sides - Math.PI / 2;
                return [
                    cx + r * Math.cos(a) * scaleX,
                    cy + r * Math.sin(a) * scaleY,
                ].join(',');
            }).join(' ');
            return <polygon points={points} {...props} />;
        };

        // Звезда
        const createStar = (
            cx,
            cy,
            r,
            points = 5,
            fullW,
            fullH,
            props = {}
        ) => {
            const innerR = r * 0.4;
            const scaleX = fullW / Math.min(fullW, fullH);
            const scaleY = fullH / Math.min(fullW, fullH);
            let d = '';
            for (let i = 0; i < points * 2; i++) {
                const rr = i % 2 === 0 ? r : innerR;
                const a = (i * Math.PI) / points - Math.PI / 2;
                const x = cx + rr * Math.cos(a) * scaleX;
                const y = cy + rr * Math.sin(a) * scaleY;
                d += i === 0 ? `M${x},${y}` : `L${x},${y}`;
            }
            d += 'Z';
            return <path d={d} {...props} />;
        };

        

        const getShapeElement = (type, w, h, props = {}) => {
            const strokeW =
                props?.strokeWidth ?? shapeStyles?.strokeWidth ?? 0; // px
            const offset = strokeW / 2 + PADDING;
            const iw = w - offset * 2; // inner width
            const ih = h - offset * 2; // inner height

            const dashOffsetFix =
                type === ShapeType.TRIANGLE || type === ShapeType.RHOMBUS
                    ? strokeW / 2
                    : 0;

            const common = {
                vectorEffect: "non-scaling-stroke",
                strokeLinejoin: "round",
                strokeLinecap: "round",
                paintOrder: "stroke", // обводка под заливкой
                strokeDashoffset: dashOffsetFix,
                ...props,
            };

            switch (type) {
                case ShapeType.CIRCLE:
                    return (
                        <ellipse
                            cx={offset + iw / 2}
                            cy={offset + ih / 2}
                            rx={iw / 2}
                            ry={ih / 2}
                            {...common}
                        />
                    );

                case ShapeType.ROUND_RECTANGLE:
                    return (
                        <rect
                            x={offset}
                            y={offset}
                            width={iw}
                            height={ih}
                            rx={ROUND_RECTANGLE_RADIUS}
                            ry={ROUND_RECTANGLE_RADIUS}
                            {...common}
                        />
                    );

                case ShapeType.RECTANGLE:
                    return (
                        <rect
                            x={offset}
                            y={offset}
                            width={iw}
                            height={ih}
                            {...common}
                        />
                    );

                case ShapeType.RHOMBUS:
                    return (
                        <polygon
                            points={`
                ${offset + iw / 2},${offset}
                ${offset + iw},${offset + ih / 2}
                ${offset + iw / 2},${offset + ih}
                ${offset},${offset + ih / 2}
              `}
                            {...common}
                        />
                    );

                case ShapeType.TRIANGLE:
                    return (
                        <polygon
                            points={`
                ${offset + iw / 2},${offset}
                ${offset + iw},${offset + ih}
                ${offset},${offset + ih}
              `}
                            {...common}
                        />
                    );

                case ShapeType.PARALLELOGRAM: {
                    const dx = iw * 0.25;
                    return (
                        <polygon
                            points={`
                ${offset + dx},${offset}
                ${offset + iw},${offset}
                ${offset + iw - dx},${offset + ih}
                ${offset},${offset + ih}
              `}
                            {...common}
                        />
                    );
                }

                case ShapeType.TRAPEZOID: {
                    const dx = iw * 0.15;
                    return (
                        <polygon
                            points={`
                ${offset + dx},${offset}
                ${offset + iw - dx},${offset}
                ${offset + iw},${offset + ih}
                ${offset},${offset + ih}
              `}
                            {...common}
                        />
                    );
                }

                case ShapeType.PENTAGON:
                    return createRegularPolygon(
                        offset + iw / 2,
                        offset + ih / 2,
                        Math.min(iw, ih) / 2,
                        5,
                        iw,
                        ih,
                        common
                    );

                case ShapeType.HEXAGON:
                    return createRegularPolygon(
                        offset + iw / 2,
                        offset + ih / 2,
                        Math.min(iw, ih) / 2,
                        6,
                        iw,
                        ih,
                        common
                    );

                case ShapeType.OCTAGON:
                    return createRegularPolygon(
                        offset + iw / 2,
                        offset + ih / 2,
                        Math.min(iw, ih) / 2,
                        8,
                        iw,
                        ih,
                        common
                    );

                case ShapeType.STAR:
                    return createStar(
                        offset + iw / 2,
                        offset + ih / 2,
                        Math.min(iw, ih) / 2,
                        5,
                        iw,
                        ih,
                        common
                    );

                case ShapeType.CLOUD:
                    return (
                        <path
                            d={`
                M${offset + iw * 0.2},${offset + ih * 0.5}
                C${offset + iw * 0.1},${offset + ih * 0.3}
                 ${offset + iw * 0.3},${offset + ih * 0.1}
                 ${offset + iw * 0.5},${offset + ih * 0.2}
                C${offset + iw * 0.6},${offset + ih * 0.05}
                 ${offset + iw * 0.8},${offset + ih * 0.1}
                 ${offset + iw * 0.9},${offset + ih * 0.3}
                C${offset + iw * 1.05},${offset + ih * 0.4}
                 ${offset + iw * 1.0},${offset + ih * 0.6}
                 ${offset + iw * 0.9},${offset + ih * 0.7}
                C${offset + iw * 0.9},${offset + ih * 0.8}
                 ${offset + iw * 0.7},${offset + ih * 0.9}
                 ${offset + iw * 0.5},${offset + ih * 0.8}
                C${offset + iw * 0.3},${offset + ih * 0.9}
                 ${offset + iw * 0.1},${offset + ih * 0.7}
                 ${offset + iw * 0.2},${offset + ih * 0.5}
                Z
              `}
                            {...common}
                        />
                    );

                default:
                    return (
                        <rect
                            x={offset}
                            y={offset}
                            width={iw}
                            height={ih}
                            {...common}
                        />
                    );
            }
        };

        

        const strokeW = shapeStyles?.strokeWidth ?? 0;
        const pad = strokeW / 2 + PADDING;

        return (
            <svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
                style={{ overflow: 'hidden' }}
            >
                <defs>
                    <clipPath id={`clipShape-${id}`}>
                        {getShapeElement(shapeType, width, height)}
                    </clipPath>
                </defs>

                {}
                {getShapeElement(shapeType, width, height, shapeStyles)}

                {}
                <g clipPath={`url(#clipShape-${id})`}>
                    <text
                        x={textPosition.x}
                        y={textPosition.y}
                        fill={color}
                        style={textStyles}
                    >
                        {nodeContent}
                    </text>
                </g>
            </svg>
        );
    }
);

// Компонент панели инструментов
const ShapeToolbar = memo(({
    selected,
    currentShape,
    fontFamily,
    fontSize,
    color,
    fillColor,
    fillOpacity,
    textAlign,
    textAlignVertical,
    borderColor,
    borderOpacity,
    borderStyle,
    borderWidth,
    onShapeTypeChange,
    onFontFamilyChange,
    onFontSizeChange,
    onTextColorChange,
    onFillColorChange,
    onFillOpacityChange,
    onTextAlignChange,
    onTextAlignVerticalChange,
    onBorderColorChange,
    onBorderOpacityChange,
    onBorderStyleChange,
    onBorderWidthChange
}) => {
    // Состояния для контроля отображения popover
    const [shapePickerVisible, setShapePickerVisible] = useState(false);
    const [textColorVisible, setTextColorVisible] = useState(false);
    const [fillSettingsVisible, setFillSettingsVisible] = useState(false);
    const [alignmentVisible, setAlignmentVisible] = useState(false);
    const [borderSettingsVisible, setBorderSettingsVisible] = useState(false);

    // Обработчик выбора типа фигуры
    const handleShapeChange = useCallback((shapeType) => {
        onShapeTypeChange(shapeType);
        setShapePickerVisible(false);
    }, [onShapeTypeChange]);

    return (
        <NodeToolbar
            onDoubleClick={(e) => e.stopPropagation()}
            isVisible={selected}
            position="top"
            className="bg-white rounded shadow-sm"
            style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', gap: '12px' }}
        >
            {}
            <Popover
                getPopupContainer={(trigger) => trigger.parentElement}
                content={
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
                        {shapeOptions.map((opt) => (
                            <Button
                                key={opt.value}
                                type={opt.value === currentShape ? 'primary' : 'default'}
                                onClick={() => handleShapeChange(opt.value)}
                            >
                                {opt.label}
                            </Button>
                        ))}
                    </div>
                }
                title="Выберите фигуру"
                trigger="click"
                open={shapePickerVisible}
                onOpenChange={setShapePickerVisible}
            >
                <Button onClick={() => setShapePickerVisible(true)}>
                    {shapeOptions.find((s) => s.value === currentShape)?.label || 'Фигура'}
                </Button>
            </Popover>

            {}
            <Select
                value={fontFamily}
                onChange={onFontFamilyChange}
                variant={"filled"}
                style={{ width: 120, minWidth: 80 }}
                options={Object.values(FontFamilyType).map((font) => ({ value: font, label: font }))}
            />

            {}
            <InputNumber
                value={fontSize}
                onChange={onFontSizeChange}
                min={1}
                variant={"filled"}
                style={{ width: 60, textAlign: 'center' }}
            />

            {}
            <Popover
                getPopupContainer={(trigger) => trigger.parentElement}
                content={
                    <CirclePicker
                        color={color}
                        onChangeComplete={(newColor) => {
                            onTextColorChange(newColor);
                            setTextColorVisible(false);
                        }}
                    />
                }
                title="Text Color"
                trigger="click"
                open={textColorVisible}
                onOpenChange={setTextColorVisible}
            >
                <button
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                    title="Text Color"
                >
                    <FontColorsOutlined style={{ fontSize: '20px' }} />
                </button>
            </Popover>

            {}
            <Popover
                getPopupContainer={(trigger) => trigger.parentElement}
                content={
                    <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <div style={{ fontSize: '12px', marginBottom: '4px' }}>Fill Opacity</div>
                            <Slider
                                min={0}
                                max={1}
                                step={0.05}
                                value={typeof fillOpacity === 'number' ? fillOpacity : parseFloat(fillOpacity) || 0}
                                onChange={onFillOpacityChange}
                            />
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', marginBottom: '4px' }}>Fill Color</div>
                            <CirclePicker
                                color={fillColor}
                                onChangeComplete={(newColor) => onFillColorChange(newColor)}
                            />
                        </div>
                    </div>
                }
                title="Fill Settings"
                trigger="click"
                open={fillSettingsVisible}
                onOpenChange={setFillSettingsVisible}
            >
                <button
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                    title="Fill Settings"
                >
                    <BgColorsOutlined style={{ fontSize: '20px' }} />
                </button>
            </Popover>

            {}
            <Popover
                getPopupContainer={(trigger) => trigger.parentElement}
                content={
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                            <Button
                                type="text"
                                onClick={() => onTextAlignChange(TextAlignType.LEFT)}
                                style={{ opacity: textAlign === TextAlignType.LEFT ? 1 : 0.5 }}
                            >
                                <span style={{ fontSize: '18px' }}>←</span>
                            </Button>
                            <Button
                                type="text"
                                onClick={() => onTextAlignChange(TextAlignType.CENTER)}
                                style={{ opacity: textAlign === TextAlignType.CENTER ? 1 : 0.5 }}
                            >
                                <span style={{ fontSize: '18px' }}>↔</span>
                            </Button>
                            <Button
                                type="text"
                                onClick={() => onTextAlignChange(TextAlignType.RIGHT)}
                                style={{ opacity: textAlign === TextAlignType.RIGHT ? 1 : 0.5 }}
                            >
                                <span style={{ fontSize: '18px' }}>→</span>
                            </Button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                            <Button
                                type="text"
                                onClick={() => onTextAlignVerticalChange(TextAlignVerticalType.TOP)}
                                style={{ opacity: textAlignVertical === TextAlignVerticalType.TOP ? 1 : 0.5 }}
                            >
                                <span style={{ fontSize: '18px' }}>↑</span>
                            </Button>
                            <Button
                                type="text"
                                onClick={() => onTextAlignVerticalChange(TextAlignVerticalType.MIDDLE)}
                                style={{ opacity: textAlignVertical === TextAlignVerticalType.MIDDLE ? 1 : 0.5 }}
                            >
                                <span style={{ fontSize: '18px' }}>↕</span>
                            </Button>
                            <Button
                                type="text"
                                onClick={() => onTextAlignVerticalChange(TextAlignVerticalType.BOTTOM)}
                                style={{ opacity: textAlignVertical === TextAlignVerticalType.BOTTOM ? 1 : 0.5 }}
                            >
                                <span style={{ fontSize: '18px' }}>↓</span>
                            </Button>
                        </div>
                    </div>
                }
                title="Alignment"
                trigger="click"
                placement="bottom"
                open={alignmentVisible}
                onOpenChange={setAlignmentVisible}
            >
                <button
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                    title="Alignment"
                >
                    <AlignCenterOutlined style={{ fontSize: '20px' }} />
                </button>
            </Popover>

             {}
            <Popover
                getPopupContainer={(trigger) => trigger.parentElement}
                content={
                    <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <div style={{ fontSize: '12px', marginBottom: '4px' }}>Border Opacity</div>
                            <Slider
                                min={0}
                                max={1}
                                step={0.05}
                                value={typeof borderOpacity === 'number' ? borderOpacity : parseFloat(borderOpacity) || 0}
                                onChange={onBorderOpacityChange}
                            />
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', marginBottom: '4px' }}>Border Style</div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Button
                                    type={borderStyle === BorderStyleType.NONE || borderStyle === BorderStyleType.SOLID ? "primary" : "default"}
                                    onClick={() => onBorderStyleChange(BorderStyleType.SOLID)}
                                >
                                    <TfiLayoutLineSolid size={30} />
                                </Button>
                                <Button
                                    type={borderStyle === BorderStyleType.DOTTED ? "primary" : "default"}
                                    onClick={() => onBorderStyleChange(BorderStyleType.DOTTED)}
                                >
                                    <TbLineDotted size={30} />
                                </Button>
                                <Button
                                    type={borderStyle === BorderStyleType.DASHED ? "primary" : "default"}
                                    onClick={() => onBorderStyleChange(BorderStyleType.DASHED)}
                                >
                                    <TbLineDashed size={30} />
                                </Button>
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', marginBottom: '4px' }}>Border Width</div>
                            <Slider
                                min={0}
                                max={10}
                                step={0.5}
                                value={parseFloat(borderWidth)}
                                onChange={onBorderWidthChange}
                            />
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', marginBottom: '4px' }}>Border Color</div>
                            <CirclePicker
                                color={borderColor}
                                onChangeComplete={(newColor) => {
                                    onBorderColorChange(newColor);
                                    setBorderSettingsVisible(false);
                                }}
                            />
                        </div>
                    </div>
                }
                title="Border Settings"
                trigger="click"
                open={borderSettingsVisible}
                onOpenChange={setBorderSettingsVisible}
            >
                <button
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                    title="Border Settings"
                >
                    <FaRegCircle style={{ fontSize: '20px' }} />
                </button>
            </Popover>
        </NodeToolbar>
    );
});

// одинаковая формула отступа, что и в ShapeRenderer
const calcOffset = (strokeW, padConst) =>
    strokeW / 2 + Math.max(padConst, 0.25 * strokeW);

export const getTextPosition = (
    shapeType,
    width,
    height,
    textAlign         = TextAlignType.CENTER,
    textAlignVertical = TextAlignVerticalType.MIDDLE,
    strokeWidth       = 0,
    padConst          = PADDING           // тот же, что в ShapeRenderer
) => {
    const offset = calcOffset(strokeWidth, padConst);   // ← исправлено

    
    if (
        shapeType === ShapeType.RECTANGLE ||
        shapeType === ShapeType.ROUND_RECTANGLE
    ) {
        // горизонталь
        let x;
        switch (textAlign) {
            case TextAlignType.LEFT:
                x = offset + TEXT_MARGIN;
                break;
            case TextAlignType.RIGHT:
                x = width - offset - TEXT_MARGIN;
                break;
            default: // CENTER
                x = offset + (width - 2 * offset) / 2;
        }

        // вертикаль
        let y;
        switch (textAlignVertical) {
            case TextAlignVerticalType.TOP:
                y = offset + TEXT_MARGIN;
                break;
            case TextAlignVerticalType.BOTTOM:
                y = height - offset - TEXT_MARGIN;
                break;
            default: // MIDDLE
                y = offset + (height - 2 * offset) / 2;
        }

        return { x, y };
    }

    
    return {
        x: offset + (width  - 2 * offset) / 2,
        y: offset + (height - 2 * offset) / 2,
    };
};

// Основной компонент ShapeNode
export const ShapeNode = memo((props) => {
    const { id, data, selected, positionAbsoluteX, positionAbsoluteY } = props;
    
    // Используем useRef для хранения ссылок на функции из data
    const functionsRef = useRef(data.functions);
    
    // Обновляем ссылку на функции при изменении data
    useEffect(() => {
        functionsRef.current = data.functions;
    }, [data.functions]);
    
    // Обработчики обновления данных и стилей узла
    const handleStyleChange = useCallback((stylePart) => {
        if (functionsRef.current?.onStyleChange) {
            const updatedStyle = { ...data.style, ...stylePart };
            functionsRef.current.onStyleChange(id, updatedStyle);
        }
    }, [id, data.style]);

    const handleDataChange = useCallback((dataPart) => {
        if (functionsRef.current?.onDataChange) {
            const updatedData = { ...data, ...dataPart };
            functionsRef.current.onDataChange(id, updatedData);
        }
    }, [id, data]);

    // Извлекаем стили с дефолтными значениями
    const {
        fontFamily = FontFamilyType.ARIAL,
        fontSize = 14,
        color = '#000000',
        fillColor = ColorType.WHITE,
        fillOpacity = 1.0,
        textAlign = TextAlignType.CENTER,
        textAlignVertical = TextAlignVerticalType.TOP,
        borderColor = '#000000',
        borderOpacity = 1.0,
        borderStyle = BorderStyleType.NONE,
        borderWidth = 1
    } = useMemo(() => {
        // Нормализация числовых значений
        const normalizeSafe = (value, defaultValue = 1.0) => {
            if (value === 0 || value === '0') return 0;
            if (typeof value === 'string') value = parseFloat(value);
            return isNaN(value) || value === undefined || value === null ? defaultValue : value;
        };
        
        return {
            fontFamily: data.style?.fontFamily,
            fontSize: data.style?.fontSize,
            color: data.style?.color,
            fillColor: data.style?.fillColor,
            fillOpacity: normalizeSafe(data.style?.fillOpacity),
            textAlign: data.style?.textAlign,
            textAlignVertical: data.style?.textAlignVertical,
            borderColor: data.style?.borderColor,
            borderOpacity: normalizeSafe(data.style?.borderOpacity),
            borderStyle: data.style?.borderStyle,
            borderWidth: normalizeSafe(data.style?.borderWidth, 1)
        };
    }, [data.style]);

    // Получаем содержимое узла - текст для отображения
    const nodeContent = useMemo(() => data.label || '', [data.label]);

    // Текущий тип фигуры из data, по умолчанию прямоугольник
    const currentShape = useMemo(() => data.shape || ShapeType.RECTANGLE, [data.shape]);

    // Расчёт цветов с учетом прозрачности
    const backgroundRgba = useMemo(() => 
        hexToRgba(fillColor, typeof fillOpacity === 'number' ? 
            Math.min(1, Math.max(0, fillOpacity)) : 
            parseFloat(fillOpacity) || 0),
        [fillColor, fillOpacity]
    );
    
    const borderColorRgba = useMemo(() => 
        hexToRgba(borderColor, typeof borderOpacity === 'number' ? 
            Math.min(1, Math.max(0, borderOpacity)) : 
            parseFloat(borderOpacity) || 0),
        [borderColor, borderOpacity]
    );
    
    // Определение стиля границы
    const borderStyleString = useMemo(() => {
        const style = borderStyle === BorderStyleType.DOTTED 
            ? BorderStyleType.DOTTED 
            : borderStyle === BorderStyleType.DASHED 
                ? BorderStyleType.DASHED 
                : BorderStyleType.SOLID;
        
        return `${borderWidth}px ${style} ${borderColorRgba}`;
    }, [borderWidth, borderStyle, borderColorRgba]);
    
    // Получаем выравнивание для flex контейнера
    const alignItems = useMemo(() => 
        getFlexAlignByVerticalTextAlign(textAlignVertical),
        [textAlignVertical]
    );

    // Стиль внутреннего контейнера
    const innerStyle = useMemo(() => ({
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        fontFamily,
        fontSize: `${fontSize}px`,
        color,
        // boxSizing: 'border-box'
    }), [fontFamily, fontSize, color]);
    
    // Геометрические параметры узла
    const { width, height } = useMemo(() => ({
        width: data.geometry?.width || 120,
        height: data.geometry?.height || 80,
    }), [data.geometry]);

    // Стили для фигуры
    const borderExtra = useMemo(
        () => getBorderStyleExtra(borderStyle, borderWidth),
        [borderStyle, borderWidth]
    );

    
    const shapeStyles = useMemo(
        () => ({
            fill: backgroundRgba,
            stroke: borderColorRgba,
            strokeWidth: borderWidth,
            ...borderExtra,
        }),
        [backgroundRgba, borderColorRgba, borderWidth, borderExtra]
    );

    // Стили для текста
    const textStyles = useMemo(() => ({
        pointerEvents: 'none',
        fontFamily,
        fontSize: `${fontSize}px`,
        fontWeight: 'normal',
        // textAnchor: "middle",
        // dominantBaseline: "middle"
        textAnchor: textAlign === TextAlignType.LEFT
            ? 'start'
                : textAlign === TextAlignType.RIGHT
                ? 'end'
                : 'middle',
        dominantBaseline: textAlignVertical === TextAlignVerticalType.TOP
                ? 'hanging'
                : textAlignVertical === TextAlignVerticalType.BOTTOM
                    ? 'baseline'
                : 'middle',
    }), [fontFamily, fontSize, textAlign, textAlignVertical]);

    const textPosition = getTextPosition(
        currentShape,                  // ← новый аргумент
        width,
        height,
        textAlign,
        textAlignVertical,
        borderWidth,                   // strokeWidth
        PADDING
    );


    // Обработчики для изменений
    const handleShapeTypeChange = useCallback((value) => {
        handleDataChange({ shape: value });
    }, [handleDataChange]);
    
    const handleFontFamilyChange = useCallback((value) => {
        handleStyleChange({ fontFamily: value });
    }, [handleStyleChange]);
    
    const handleFontSizeChange = useCallback((value) => {
        handleStyleChange({ fontSize: value });
    }, [handleStyleChange]);
    
    const handleTextColorChange = useCallback((color) => {
        handleStyleChange({ color: color.hex });
    }, [handleStyleChange]);
    
    const handleFillColorChange = useCallback((color) => {
        handleStyleChange({ fillColor: color.hex });
    }, [handleStyleChange]);
    
    const handleFillOpacityChange = useCallback((value) => {
        handleStyleChange({ fillOpacity: value });
    }, [handleStyleChange]);
    
    const handleTextAlignChange = useCallback((value) => {
        handleStyleChange({ textAlign: value });
    }, [handleStyleChange]);
    
    const handleTextAlignVerticalChange = useCallback((value) => {
        handleStyleChange({ textAlignVertical: value });
    }, [handleStyleChange]);

    const handleBorderColorChange = useCallback((color) => {
        handleStyleChange({ borderColor: color.hex });
    }, [handleStyleChange]);
    
    const handleBorderOpacityChange = useCallback((value) => {
        handleStyleChange({ borderOpacity: value });
    }, [handleStyleChange]);
    
    const handleBorderStyleChange = useCallback((value) => {
        handleStyleChange({ borderStyle: value });
    }, [handleStyleChange]);
    
    const handleBorderWidthChange = useCallback((value) => {
        handleStyleChange({ borderWidth: value });
    }, [handleStyleChange]);

    // Используем ShapeToolbar вместо создания отдельного shapeToolbarContent
    return (
        <BaseNode 
            id={id} 
            data={data} 
            selected={selected} 
            positionAbsoluteX={positionAbsoluteX} 
            positionAbsoluteY={positionAbsoluteY}
            toolbarContent={
                <ShapeToolbar
                    selected={selected}
                    currentShape={currentShape}
                    fontFamily={fontFamily}
                    fontSize={fontSize}
                    color={color}
                    fillColor={fillColor}
                    fillOpacity={fillOpacity}
                    textAlign={textAlign}
                    textAlignVertical={textAlignVertical}
                    borderColor={borderColor}
                    borderOpacity={borderOpacity}
                    borderStyle={borderStyle}
                    borderWidth={borderWidth}
                    onShapeTypeChange={handleShapeTypeChange}
                    onFontFamilyChange={handleFontFamilyChange}
                    onFontSizeChange={handleFontSizeChange}
                    onTextColorChange={handleTextColorChange}
                    onFillColorChange={handleFillColorChange}
                    onFillOpacityChange={handleFillOpacityChange}
                    onTextAlignChange={handleTextAlignChange}
                    onTextAlignVerticalChange={handleTextAlignVerticalChange}
                    onBorderColorChange={handleBorderColorChange}
                    onBorderOpacityChange={handleBorderOpacityChange}
                    onBorderStyleChange={handleBorderStyleChange}
                    onBorderWidthChange={handleBorderWidthChange}
                />
            }
        >
            <div style={innerStyle}>
                <ShapeRenderer
                    shapeType={currentShape}
                    width={width}
                    height={height}
                    shapeStyles={shapeStyles}
                    textPosition={textPosition}
                    textStyles={textStyles}
                    nodeContent={nodeContent}
                    color={color}
                    id={id}
                />
            </div>
        </BaseNode>
    );
});
