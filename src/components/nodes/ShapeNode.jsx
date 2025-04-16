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

// Определяем набор возможных фигур для выбора
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

const ROUND_RECTANGLE_RADIUS = 10; // Радиус скругления для round_rectangle

export const ShapeNode = memo((props) => {
    const { id, data, selected, positionAbsoluteX, positionAbsoluteY } = props;
    
    // Используем useRef для хранения ссылок на функции из data
    const functionsRef = useRef(data.functions);
    
    // Обновляем ссылку на функции при изменении data
    useMemo(() => {
        functionsRef.current = data.functions;
    }, [data.functions]);

    // Управление видимостью Popover'ов
    const [shapePickerVisible, setShapePickerVisible] = useState(false);
    const [textColorVisible, setTextColorVisible] = useState(false);
    const [fillSettingsVisible, setFillSettingsVisible] = useState(false);
    const [alignmentVisible, setAlignmentVisible] = useState(false);
    const [borderSettingsVisible, setBorderSettingsVisible] = useState(false);

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
    } = useMemo(() => {
        // Обработка fillOpacity с учетом значения 0
        let fillOpacityValue;
        if (data.style?.fillOpacity === 0 || data.style?.fillOpacity === '0') {
            fillOpacityValue = 0;
        } else {
            fillOpacityValue = data.style?.fillOpacity;
            // Преобразуем в число, если это строка
            if (typeof fillOpacityValue === 'string') {
                fillOpacityValue = parseFloat(fillOpacityValue);
            }
            // Если значение не определено или NaN, используем 1.0 по умолчанию
            if (fillOpacityValue === undefined || fillOpacityValue === null || isNaN(fillOpacityValue)) {
                fillOpacityValue = 1.0;
            }
        }
        
        // Обработка borderOpacity с учетом значения 0
        let borderOpacityValue;
        if (data.style?.borderOpacity === 0 || data.style?.borderOpacity === '0') {
            borderOpacityValue = 0;
        } else {
            borderOpacityValue = data.style?.borderOpacity;
            // Преобразуем в число, если это строка
            if (typeof borderOpacityValue === 'string') {
                borderOpacityValue = parseFloat(borderOpacityValue);
            }
            // Если значение не определено или NaN, используем 1.0 по умолчанию
            if (borderOpacityValue === undefined || borderOpacityValue === null || isNaN(borderOpacityValue)) {
                borderOpacityValue = 1.0;
            }
        }

        return {
            fontFamily: data.style?.fontFamily || FontFamilyType.ARIAL,
            fontSize: data.style?.fontSize || 14,
            color: data.style?.color || '#000000',
            fillColor: data.style?.fillColor || ColorType.WHITE,
            fillOpacity: fillOpacityValue,
            textAlign: data.style?.textAlign || TextAlignType.CENTER,
            textAlignVertical: data.style?.textAlignVertical || TextAlignVerticalType.TOP,
            borderColor: data.style?.borderColor || '#000000',
            borderOpacity: borderOpacityValue,
            borderStyle: data.style?.borderStyle || BorderStyleType.NONE,
            borderWidth: data.style?.borderWidth || 1,
        };
    }, [data.style]);

    // Получаем содержимое узла - текст для отображения
    const nodeContent = useMemo(() => {
        return data.label || '';
    }, [data.label]);

    // Текущий тип фигуры из data, по умолчанию прямоугольник
    const currentShape = useMemo(() => {
        // Учитываем, что для совместимости ShapeType.RECTANGLE можно применять 
        // и к ShapeType.ROUND_RECTANGLE, если явно указан этот тип
        const shape = data.shape || ShapeType.RECTANGLE;
        return shape;
    }, [data.shape]);

    // Функция проверки, является ли фигура прямоугольным типом
    const isRectangularShape = useCallback((shape) => {
        return shape === ShapeType.RECTANGLE || shape === ShapeType.ROUND_RECTANGLE;
    }, []);

    // Расчёт цветов и стилей границы
    const backgroundRgba = useMemo(() => {
        // Обработка fillOpacity
        const opacity = typeof fillOpacity === 'number' ? 
            Math.min(1, Math.max(0, fillOpacity)) : 
            parseFloat(fillOpacity) || 0;
        
        return hexToRgba(fillColor, opacity);
    }, [fillColor, fillOpacity]);
    
    const borderColorRgba = useMemo(() => {
        // Обработка borderOpacity
        const opacity = typeof borderOpacity === 'number' ? 
            Math.min(1, Math.max(0, borderOpacity)) : 
            parseFloat(borderOpacity) || 0;
        
        return hexToRgba(borderColor, opacity);
    }, [borderColor, borderOpacity]);
    
    const effectiveBorderWidth = useMemo(() => 
        borderWidth,
        [borderWidth]
    );
    
    // Вычисляем строковое представление стиля обводки для CSS свойств
    const borderStyleString = useMemo(() => {
        let style = BorderStyleType.SOLID; // по умолчанию solid
        
        if (borderStyle === BorderStyleType.DOTTED) {
            style = BorderStyleType.DOTTED;
        } else if (borderStyle === BorderStyleType.DASHED) {
            style = BorderStyleType.DASHED;
        } else if (borderStyle === BorderStyleType.NORMAL || borderStyle === BorderStyleType.NONE || borderStyle === BorderStyleType.SOLID) {
            style = BorderStyleType.SOLID;
        }
        
        return `${effectiveBorderWidth}px ${style} ${borderColorRgba}`;
    }, [effectiveBorderWidth, borderStyle, borderColorRgba]);
    
    const alignItems = useMemo(() => 
        getFlexAlignByVerticalTextAlign(textAlignVertical),
        [textAlignVertical]
    );

    const innerStyle = useMemo(() => ({
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        fontFamily,
        fontSize: `${fontSize}px`,
        color,
    }), [fontFamily, fontSize, color]);
    
    // Геометрические параметры с мемоизацией
    const { width, height } = useMemo(() => ({
        width: data.geometry?.width || 120,
        height: data.geometry?.height || 80,
    }), [data.geometry]);

    // Мемоизированные вычисления размеров и позиций SVG элементов
    const svgDimensions = useMemo(() => {
        const offset = effectiveBorderWidth / 2;
        return {
            offset,
            vbX: -offset,
            vbY: -offset,
            vbWidth: width + effectiveBorderWidth,
            vbHeight: height + effectiveBorderWidth,
            viewBox: `${-offset} ${-offset} ${width + effectiveBorderWidth} ${height + effectiveBorderWidth}`
        };
    }, [width, height, effectiveBorderWidth]);

    // Функции для вычисления позиций и отрисовки фигуры перенесены сюда
    // Определяем отступ (в пикселях)
    const MARGIN = 40;

    const midpoint = (p1, p2) => ({
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
    });

    // Для эллипса уменьшаем радиусы на MARGIN, чтобы текст не прилегал к краю
    const getEllipseTextPosition = (width, height, alignmentH, alignmentV) => {
        const cx = width / 2;
        const cy = height / 2;
        const rx = width / 2;
        const ry = height / 2;
        const rxEff = Math.max(0, rx - MARGIN);
        const ryEff = Math.max(0, ry - MARGIN);
        if (alignmentH === 'center' && alignmentV === 'middle') {
            return { x: cx, y: cy };
        }
        const combinationKey = `${alignmentH}-${alignmentV}`;
        let angleDeg = 0;
        switch (combinationKey) {
            case 'left-top':
                angleDeg = 135;
                break;
            case 'center-top':
                angleDeg = 90;
                break;
            case 'right-top':
                angleDeg = 45;
                break;
            case 'left-middle':
                angleDeg = 180;
                break;
            case 'right-middle':
                angleDeg = 0;
                break;
            case 'left-bottom':
                angleDeg = 225;
                break;
            case 'center-bottom':
                angleDeg = 270;
                break;
            case 'right-bottom':
                angleDeg = 315;
                break;
            default:
                angleDeg = 0;
                break;
        }
        const angleRad = (Math.PI / 180) * angleDeg;
        const x = cx + rxEff * Math.cos(angleRad);
        const y = cy - ryEff * Math.sin(angleRad);
        return { x, y };
    };

    // Для прямоугольника задаём позицию в зависимости от выравнивания с отступами
    const getRectangleTextPosition = (width, height, alignmentH, alignmentV) => {
        let x, y;
        if (alignmentH === 'left') {
            x = MARGIN;
        } else if (alignmentH === 'right') {
            x = width - MARGIN;
        } else {
            x = width / 2;
        }
        if (alignmentV === 'top') {
            y = MARGIN;
        } else if (alignmentV === 'bottom') {
            y = height - MARGIN;
        } else {
            y = height / 2;
        }
        return { x, y };
    };

    // Для ромба пересмотрен алгоритм
    const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

    const getRhombusTextPosition = (width, height, alignmentH, alignmentV) => {
        // Определяем крайние точки фигуры с учетом отступов
        const top = { x: width / 2, y: MARGIN };
        const right = { x: width - MARGIN, y: height / 2 };
        const bottom = { x: width / 2, y: height - MARGIN };
        const left = { x: MARGIN, y: height / 2 };
        const center = { x: width / 2, y: height / 2 };

        const combinationKey = `${alignmentH}-${alignmentV}`;

        let pos;
        switch (combinationKey) {
            case 'left-top':
                pos = midpoint(top, left);
                break;
            case 'center-top':
                pos = midpoint(top, center);
                break;
            case 'right-top':
                pos = midpoint(top, right);
                break;
            case 'left-middle':
                // Вместо midpoint(left, center) (который дает около 25% от ширины), задаем более сильное смещение
                pos = { x: width * 0.15, y: height / 2 };
                break;
            case 'center-middle':
                pos = center;
                break;
            case 'right-middle':
                // Аналогично, заменяем midpoint(right, center) на позицию около 85% от ширины
                pos = { x: width * 0.85, y: height / 2 };
                break;
            case 'left-bottom':
                pos = midpoint(bottom, left);
                break;
            case 'center-bottom':
                pos = midpoint(bottom, center);
                break;
            case 'right-bottom':
                pos = midpoint(bottom, right);
                break;
            default:
                pos = center;
                break;
        }

        // Клипаем результат, чтобы не выйти за отступы
        return {
            x: clamp(pos.x, MARGIN, width - MARGIN),
            y: clamp(pos.y, MARGIN, height - MARGIN)
        };
    };

    const getTextPositionForShape = (
        shapeType,
        width,
        height,
        textAlign, // 'left' | 'center' | 'right'
        textAlignVertical // 'top' | 'center' | 'bottom'
    ) => {
        switch (shapeType) {
            case ShapeType.RHOMBUS:
                return getRhombusTextPosition(width, height, textAlign, textAlignVertical);
            case ShapeType.CIRCLE:
                return getEllipseTextPosition(width, height, textAlign, textAlignVertical);
            case ShapeType.TRIANGLE:
            case ShapeType.PARALLELOGRAM:
            case ShapeType.TRAPEZOID:
            case ShapeType.PENTAGON:
            case ShapeType.HEXAGON:
            case ShapeType.OCTAGON:
            case ShapeType.STAR:
            case ShapeType.CLOUD:
                // Для сложных фигур используем центрированную позицию с отступами
                return getComplexShapeTextPosition(width, height, textAlign, textAlignVertical);
            case ShapeType.ROUND_RECTANGLE:
            case ShapeType.RECTANGLE:
            default:
                return getRectangleTextPosition(width, height, textAlign, textAlignVertical);
        }
    };

    // Функция для расчета позиции текста для сложных фигур
    const getComplexShapeTextPosition = (width, height, alignmentH, alignmentV) => {
        // Установим меньшие отступы для сложных фигур
        const safeMargin = MARGIN * 0.8;
        
        // Получаем базовое положение для прямоугольника,
        // но с немного большими отступами для избежания пересечений с границами
        let x, y;
        
        if (alignmentH === 'left') {
            x = safeMargin * 1.2;
        } else if (alignmentH === 'right') {
            x = width - safeMargin * 1.2;
        } else {
            x = width / 2;
        }
        
        if (alignmentV === 'top') {
            y = safeMargin * 1.2;
        } else if (alignmentV === 'bottom') {
            y = height - safeMargin * 1.2;
        } else {
            y = height / 2;
        }
        
        return { x, y };
    };

    const getShapeElement = (shapeType, shapeWidth, shapeHeight, props = {}) => {
        switch (shapeType) {
            case ShapeType.CIRCLE:
                return (
                    <ellipse
                        cx={shapeWidth / 2}
                        cy={shapeHeight / 2}
                        rx={shapeWidth / 2}
                        ry={shapeHeight / 2}
                        {...props}
                    />
                );
            case ShapeType.ROUND_RECTANGLE:
                return <rect width={shapeWidth} height={shapeHeight} rx={ROUND_RECTANGLE_RADIUS} ry={ROUND_RECTANGLE_RADIUS} {...props} />;
            case ShapeType.RECTANGLE:
                return <rect width={shapeWidth} height={shapeHeight} {...props} />;
            case ShapeType.RHOMBUS:
                const halfWidth = shapeWidth / 2;
                const halfHeight = shapeHeight / 2;
                const points = `${halfWidth},0 ${shapeWidth},${halfHeight} ${halfWidth},${shapeHeight} 0,${halfHeight}`;
                return <polygon points={points} {...props} />;
            case ShapeType.TRIANGLE:
                return <polygon points={`${shapeWidth/2},0 ${shapeWidth},${shapeHeight} 0,${shapeHeight}`} {...props} />;
            case ShapeType.PARALLELOGRAM:
                const offset = shapeWidth * 0.25;
                return <polygon points={`${offset},0 ${shapeWidth},0 ${shapeWidth-offset},${shapeHeight} 0,${shapeHeight}`} {...props} />;
            case ShapeType.TRAPEZOID:
                const trapOffset = shapeWidth * 0.15;
                return <polygon points={`${trapOffset},0 ${shapeWidth-trapOffset},0 ${shapeWidth},${shapeHeight} 0,${shapeHeight}`} {...props} />;
            case ShapeType.PENTAGON:
                return createRegularPolygon(shapeWidth/2, shapeHeight/2, Math.min(shapeWidth, shapeHeight)/2, 5, props);
            case ShapeType.HEXAGON:
                return createRegularPolygon(shapeWidth/2, shapeHeight/2, Math.min(shapeWidth, shapeHeight)/2, 6, props);
            case ShapeType.OCTAGON:
                return createRegularPolygon(shapeWidth/2, shapeHeight/2, Math.min(shapeWidth, shapeHeight)/2, 8, props);
            case ShapeType.STAR:
                return createStar(shapeWidth/2, shapeHeight/2, Math.min(shapeWidth, shapeHeight)/2, 5, props);
            case ShapeType.CLOUD:
                // Упрощенное представление облака через несколько эллипсов
                return (
                    <path 
                        d={`M${shapeWidth*0.2},${shapeHeight*0.5} 
                           C${shapeWidth*0.1},${shapeHeight*0.3} ${shapeWidth*0.3},${shapeHeight*0.1} ${shapeWidth*0.5},${shapeHeight*0.2}
                           C${shapeWidth*0.6},${shapeHeight*0.05} ${shapeWidth*0.8},${shapeHeight*0.1} ${shapeWidth*0.9},${shapeHeight*0.3}
                           C${shapeWidth*1.05},${shapeHeight*0.4} ${shapeWidth*1.0},${shapeHeight*0.6} ${shapeWidth*0.9},${shapeHeight*0.7}
                           C${shapeWidth*0.9},${shapeHeight*0.8} ${shapeWidth*0.7},${shapeHeight*0.9} ${shapeWidth*0.5},${shapeHeight*0.8}
                           C${shapeWidth*0.3},${shapeHeight*0.9} ${shapeWidth*0.1},${shapeHeight*0.7} ${shapeWidth*0.2},${shapeHeight*0.5}
                           Z`}
                        {...props}
                    />
                );
            default:
                // Если тип не распознан, возвращаем простой прямоугольник
                return <rect width={shapeWidth} height={shapeHeight} {...props} />;
        }
    };

    // Вспомогательная функция для создания многоугольника с заданным числом сторон
    const createRegularPolygon = (cx, cy, r, sides, props = {}) => {
        let points = '';
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI / sides) - Math.PI/2;  // начинаем с верхней точки
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            points += `${x},${y} `;
        }
        return <polygon points={points.trim()} {...props} />;
    };

    // Вспомогательная функция для создания звезды
    const createStar = (cx, cy, r, points = 5, props = {}) => {
        const innerRadius = r * 0.4;
        let pathData = '';
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? r : innerRadius;
            const angle = (i * Math.PI / points) - Math.PI/2;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            if (i === 0) {
                pathData += `M${x},${y} `;
            } else {
                pathData += `L${x},${y} `;
            }
        }
        pathData += 'Z';
        return <path d={pathData} {...props} />;
    };

    // Мемоизированные вычисления позиции текста
    const textPosition = useMemo(() => {
        return getTextPositionForShape(
            currentShape,
            width,
            height,
            textAlign,
            textAlignVertical
        );
    }, [currentShape, width, height, textAlign, textAlignVertical]);

    // Оптимизированное вычисление стилей для SVG элементов
    const shapeStyles = useMemo(() => {
        // Определение паттерна для штриховой линии на основе стиля
        let strokeDasharray;
        if (borderStyle === BorderStyleType.DOTTED) {
            strokeDasharray = '2,6';
        } else if (borderStyle === BorderStyleType.DASHED) {
            strokeDasharray = '10,6';
        }
        
        return {
            fill: backgroundRgba,
            stroke: hexToRgba(borderColor, parseFloat(borderOpacity)),
            strokeWidth: effectiveBorderWidth,
            ...(strokeDasharray && { strokeDasharray }),
        };
    }, [backgroundRgba, borderColor, borderOpacity, effectiveBorderWidth, borderStyle]);

    // Стили текста для отображения в SVG
    const textStyles = useMemo(() => {
        return {
            pointerEvents: 'none',
            fontFamily,
            fontSize: `${fontSize}px`,
            fontWeight: 'normal',
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
        };
    }, [fontFamily, fontSize, textAlign, textAlignVertical]);

    // Мемоизированные обработчики событий
    const handleShapeTypeChange = useCallback((value) => {
        handleDataChange({ shape: value });
        setShapePickerVisible(false);
    }, [handleDataChange]);
    
    const handleFontFamilyChange = useCallback((value) => {
        handleStyleChange({ fontFamily: value });
    }, [handleStyleChange]);
    
    const handleFontSizeChange = useCallback((value) => {
        handleStyleChange({ fontSize: value });
    }, [handleStyleChange]);
    
    const handleTextColorChange = useCallback((color) => {
        handleStyleChange({ color: color.hex });
        setTextColorVisible(false);
    }, [handleStyleChange]);
    
    const handleFillColorChange = useCallback((color) => {
        handleStyleChange({ fillColor: color.hex });
    }, [handleStyleChange]);
    
    const handleFillOpacityChange = useCallback((value) => {
        // Убеждаемся, что передаем значение, которое будет правильно обработано
        // Даже если придет значение 0, мы хотим его сохранить
        handleStyleChange({ fillOpacity: value });
    }, [handleStyleChange]);
    
    const handleTextAlignChange = useCallback((value) => {
        handleStyleChange({ textAlign: value });
        setAlignmentVisible(false);
    }, [handleStyleChange]);
    
    const handleTextAlignVerticalChange = useCallback((value) => {
        handleStyleChange({ textAlignVertical: value });
        setAlignmentVisible(false);
    }, [handleStyleChange]);
    
    const handleBorderColorChange = useCallback((color) => {
        handleStyleChange({ borderColor: color.hex });
    }, [handleStyleChange]);
    
    const handleBorderOpacityChange = useCallback((value) => {
        // Убеждаемся, что передаем значение, которое будет правильно обработано
        // Даже если придет значение 0, мы хотим его сохранить
        handleStyleChange({ borderOpacity: value });
    }, [handleStyleChange]);
    
    const handleBorderStyleChange = useCallback((value) => {
        handleStyleChange({ borderStyle: value });
        setBorderSettingsVisible(false);
    }, [handleStyleChange]);
    
    const handleBorderWidthChange = useCallback((value) => {
        handleStyleChange({ borderWidth: value });
    }, [handleStyleChange]);

    // Эффект для очистки ресурсов при размонтировании компонента
    useEffect(() => {
        let isMounted = true;
        
        return () => {
            isMounted = false;
            // Здесь можно добавить очистку для любых throttled/debounced функций
        };
    }, []);

    return (
        <BaseNode id={id} data={data} selected={selected} positionAbsoluteX={positionAbsoluteX} positionAbsoluteY={positionAbsoluteY}>
            <div style={innerStyle}>
                <svg
                    width={width}
                    height={height}
                    viewBox={svgDimensions.viewBox}
                    preserveAspectRatio="none"
                    style={{ overflow: 'hidden' }}
                >
                    <defs>
                        <clipPath id={`clipShape-${id}`}>
                            {getShapeElement(currentShape, width, height)}
                        </clipPath>
                    </defs>
                    {getShapeElement(currentShape, width, height, shapeStyles)}
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

                <NodeToolbar
                    onDoubleClick={(e) => e.stopPropagation()}
                    isVisible={selected}
                    position="top"
                    className="bg-white rounded shadow-sm"
                    style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', gap: '12px' }}
                >
                    {/* Новый элемент в самом начале для выбора типа фигуры */}
                    <Popover
                        getPopupContainer={(trigger) => trigger.parentElement}
                        content={
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
                                {shapeOptions.map((opt) => (
                                    <Button
                                        key={opt.value}
                                        type={opt.value === currentShape ? 'primary' : 'default'}
                                        onClick={() => {
                                            handleShapeTypeChange(opt.value);
                                        }}
                                    >
                                        {opt.label}
                                    </Button>
                                ))}
                            </div>
                        }
                        title="Выберите фигуру"
                        trigger="click"
                        visible={shapePickerVisible}
                        onVisibleChange={setShapePickerVisible}
                    >
                        <Button onClick={() => setShapePickerVisible(true)}>
                            {shapeOptions.find((s) => s.value === currentShape)?.label || 'Фигура'}
                        </Button>
                    </Popover>

                    {/* Остальные элементы панели инструментов, связанные с настройкой шрифта, цвета, заливки, выравнивания и обводки */}
                    <Select
                        value={fontFamily}
                        onChange={(val) => handleFontFamilyChange(val)}
                        variant={"filled"}
                        style={{ width: 120, minWidth: 80 }}
                        options={Object.values(FontFamilyType).map((font) => ({ value: font, label: font }))}
                    />

                    <InputNumber
                        value={fontSize}
                        onChange={(val) => handleFontSizeChange(val)}
                        min={1}
                        variant={"filled"}
                        style={{ width: 60, textAlign: 'center' }}
                    />

                    <Popover
                        getPopupContainer={(trigger) => trigger.parentElement}
                        content={
                            <CirclePicker
                                color={color}
                                onChangeComplete={(newColor) => {
                                    handleTextColorChange(newColor);
                                }}
                            />
                        }
                        title="Text Color"
                        trigger="click"
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
                            onClick={() => setTextColorVisible(true)}
                        >
                            <FontColorsOutlined style={{ fontSize: '20px' }} />
                        </button>
                    </Popover>

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
                                        onChange={(val) => handleFillOpacityChange(val)}
                                    />
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', marginBottom: '4px' }}>Fill Color</div>
                                    <CirclePicker
                                        color={fillColor}
                                        onChangeComplete={(newColor) => {
                                            handleFillColorChange(newColor);
                                        }}
                                    />
                                </div>
                            </div>
                        }
                        title="Fill Settings"
                        trigger="click"
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

                    <Popover
                        getPopupContainer={(trigger) => trigger.parentElement}
                        content={
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                                    <Button
                                        type="text"
                                        onClick={() => handleTextAlignChange(TextAlignType.LEFT)}
                                    >
                                        <MdFormatAlignLeft size={18} style={{ opacity: textAlign === TextAlignType.LEFT ? 1 : 0.5 }} />
                                    </Button>
                                    <Button
                                        type="text"
                                        onClick={() => handleTextAlignChange(TextAlignType.CENTER)}
                                    >
                                        <MdFormatAlignCenter size={18} style={{ opacity: textAlign === TextAlignType.CENTER ? 1 : 0.5 }} />
                                    </Button>
                                    <Button
                                        type="text"
                                        onClick={() => handleTextAlignChange(TextAlignType.RIGHT)}
                                    >
                                        <MdFormatAlignRight size={18} style={{ opacity: textAlign === TextAlignType.RIGHT ? 1 : 0.5 }} />
                                    </Button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                                    <Button
                                        type="text"
                                        onClick={() => handleTextAlignVerticalChange(TextAlignVerticalType.TOP)}
                                    >
                                        <MdVerticalAlignTop size={18} style={{ opacity: textAlignVertical === TextAlignVerticalType.TOP ? 1 : 0.5 }} />
                                    </Button>
                                    <Button
                                        type="text"
                                        onClick={() => handleTextAlignVerticalChange(TextAlignVerticalType.MIDDLE)}
                                    >
                                        <MdVerticalAlignTop
                                            size={18}
                                            style={{ opacity: textAlignVertical === TextAlignVerticalType.MIDDLE ? 1 : 0.5, transform: 'rotate(90deg)' }}
                                        />
                                    </Button>
                                    <Button
                                        type="text"
                                        onClick={() => handleTextAlignVerticalChange(TextAlignVerticalType.BOTTOM)}
                                    >
                                        <MdVerticalAlignTop
                                            size={18}
                                            style={{ opacity: textAlignVertical === TextAlignVerticalType.BOTTOM ? 1 : 0.5, transform: 'rotate(180deg)' }}
                                        />
                                    </Button>
                                </div>
                            </div>
                        }
                        title="Alignment"
                        trigger="click"
                        placement="bottom"
                    >
                        <button
                            type="text"
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
                                        onChange={(val) => handleBorderOpacityChange(val)}
                                    />
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', marginBottom: '4px' }}>Border Style</div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <Button
                                            type={borderStyle === BorderStyleType.NONE || borderStyle === BorderStyleType.SOLID ? "primary" : "default"}
                                            onClick={() => handleBorderStyleChange(BorderStyleType.SOLID)}
                                        >
                                            <TfiLayoutLineSolid size={30} />
                                        </Button>
                                        <Button
                                            type={borderStyle === BorderStyleType.DOTTED ? "primary" : "default"}
                                            onClick={() => handleBorderStyleChange(BorderStyleType.DOTTED)}
                                        >
                                            <TbLineDotted size={30} />
                                        </Button>
                                        <Button
                                            type={borderStyle === BorderStyleType.DASHED ? "primary" : "default"}
                                            onClick={() => handleBorderStyleChange(BorderStyleType.DASHED)}
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
                                        onChange={(val) => handleBorderWidthChange(val)}
                                    />
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', marginBottom: '4px' }}>Border Color</div>
                                    <CirclePicker
                                        color={borderColor}
                                        onChangeComplete={(newColor) => {
                                            handleBorderColorChange(newColor);
                                            setBorderSettingsVisible(false);
                                        }}
                                    />
                                </div>
                            </div>
                        }
                        title="Border Settings"
                        trigger="click"
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
            </div>
        </BaseNode>
    );
});

