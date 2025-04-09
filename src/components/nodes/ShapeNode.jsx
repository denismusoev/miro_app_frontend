import React, { useState } from 'react';
import { NodeToolbar } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { Select, InputNumber, Popover, Button, Slider } from 'antd';
import { CirclePicker } from 'react-color';
import { FontColorsOutlined, BgColorsOutlined } from '@ant-design/icons';
import { hexToRgba } from '../../utils/nodeUtils';
import {
    ColorType,
    FontFamilyType,
    TextAlignType,
    TextAlignVerticalType,
    BorderStyleType,
    ShapeType,
} from '../../model/Enums';

// Определяем набор возможных фигур: Круг, Квадрат, Прямоугольник и Ромб
const shapeOptions = [
    { value: ShapeType.CIRCLE, label: 'Круг' },
    { value: ShapeType.RECTANGLE, label: 'Прямоугольник' },
    { value: ShapeType.RHOMBUS, label: 'Ромб' },
];

export const ShapeNode = (props) => {
    const { id, data, selected } = props;

    // Управление видимостью настроек
    const [shapePickerVisible, setShapePickerVisible] = useState(false);
    const [textColorVisible, setTextColorVisible] = useState(false);
    const [fillSettingsVisible, setFillSettingsVisible] = useState(false);
    const [borderSettingsVisible, setBorderSettingsVisible] = useState(false);

    // Извлекаем стили из data.style
    const {
        fontFamily = FontFamilyType.ARIAL,
        fontSize = 14,
        color = '#000000',
        fillColor = ColorType.WHITE,
        fillOpacity = '1',
        textAlign = TextAlignType.CENTER,
        textAlignVertical = TextAlignVerticalType.TOP,
        borderColor = '#000000',
        borderOpacity = '1',
        borderStyle = BorderStyleType.NONE,
        borderWidth = 1,
    } = data.style || {};

    // Из data.data извлекаем тип фигуры
    const currentShape = data.shape || ShapeType.RECTANGLE;
    //console.log('currentShape', data.shape);

    // Функции для обновления стилей и данных узла
    const handleStyleChange = (stylePart) => {
        //console.log('handleStyleChange', stylePart);
        if (data.functions?.onStyleChange) {
            const updatedStyle = { ...data.style, ...stylePart };
            data.functions.onStyleChange(id, updatedStyle);
        }
    };

    const handleDataChange = (dataPart) => {
        //console.log(data);
        //console.log(data.functions?.onDataChange);
        if (data.functions?.onDataChange) {
            const updatedData = { ...data, ...dataPart };
            //console.log(updatedData);
            //console.log(data);
            data.functions.onDataChange(id, updatedData);
        }
    };

    // Конвертируем цвета в формат RGBA
    const backgroundRgba = hexToRgba(fillColor, parseFloat(fillOpacity));
    const strokeRgba = hexToRgba(borderColor, parseFloat(borderOpacity));

    // Если borderStyle равен NONE, то ширина обводки равна 0
    const effectiveStrokeWidth = borderStyle === BorderStyleType.NONE ? 0 : borderWidth;

    // Настроим штриховку для пунктирных/штриховых линий
    let dashConfig = '';
    if (borderStyle === BorderStyleType.DOTTED) {
        dashConfig = '2,6';
    } else if (borderStyle === BorderStyleType.DASHED) {
        dashConfig = '10,6';
    }

    // Определяем размеры фигуры
    const width = data.geometry?.width || 100;
    const height = data.geometry?.height || 80;

    const renderSvgShape = () => {
        // Общие параметры для всех фигур
        const commonProps = {
            fill: backgroundRgba,
            stroke: strokeRgba,
            strokeWidth: effectiveStrokeWidth,
            ...(dashConfig && { strokeDasharray: dashConfig }),
        };

        switch (currentShape) {
            case ShapeType.CIRCLE:
                // Используем эллипс, чтобы фигура заполняла весь прямоугольник.
                // При неравных width/height получится растянутый овал.
                return (
                    <ellipse
                        cx={width / 2}
                        cy={height / 2}
                        rx={width / 2}
                        ry={height / 2}
                        {...commonProps}
                    />
                );

            case ShapeType.SQUARE:
                // "Квадрат" тоже растягиваем на весь контейнер,
                // фактически получая прямоугольник, если width != height.
                return (
                    <rect
                        x={0}
                        y={0}
                        width={width}
                        height={height}
                        {...commonProps}
                    />
                );

            case ShapeType.RHOMBUS:
                // Ромб — углы идут в середины сторон контейнера.
                // (width/2,0), (width,height/2), (width/2,height), (0,height/2)
                const points = `${width / 2},0 ${width},${height / 2} ${width / 2},${height} 0,${height / 2}`;
                return (
                    <polygon points={points} {...commonProps} />
                );

            case ShapeType.RECTANGLE:
            default:
                // Прямоугольник тоже на весь контейнер.
                return (
                    <rect
                        x={0}
                        y={0}
                        width={width}
                        height={height}
                        {...commonProps}
                    />
                );
        }
    };

    // Стили для контейнера узла
    const containerStyle = {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        fontFamily,
        fontSize: `${fontSize}px`,
        color,
    };

    const offset = effectiveStrokeWidth / 2;
    const vbX = -offset;
    const vbY = -offset;
    const vbWidth = width + effectiveStrokeWidth;
    const vbHeight = height + effectiveStrokeWidth;

    function getEllipseTextPosition(width, height, alignmentH, alignmentV) {
        const cx = width / 2;
        const cy = height / 2;
        const rx = width / 2;
        const ry = height / 2;

        // Если выбрано "center-middle" (горизонтальное = center, вертикальное = middle),
        // то просто возвращаем центр эллипса.
        if (alignmentH === 'center' && alignmentV === 'middle') {
            return { x: cx, y: cy };
        }

        // Формируем ключ, например "left-top", "right-bottom" и т.д.
        const combinationKey = `${alignmentH}-${alignmentV}`;
        let angleDeg = 0;

        switch (combinationKey) {
            case 'left-top':
                // Левая-верхняя точка: угол ~135°
                angleDeg = 135;
                break;

            case 'center-top':
                // Середина сверху: угол ~90°
                angleDeg = 90;
                break;

            case 'right-top':
                // Правая-верхняя точка: угол ~45°
                angleDeg = 45;
                break;

            case 'left-middle':
                // Левая-центральная точка: угол ~180°
                angleDeg = 180;
                break;

            // «center-middle» мы уже обработали условием выше

            case 'right-middle':
                // Правая-центральная точка: угол ~0°
                angleDeg = 0;
                break;

            case 'left-bottom':
                // Левая-нижняя точка: угол ~225°
                angleDeg = 225;
                break;

            case 'center-bottom':
                // Середина снизу: угол ~270°
                angleDeg = 270;
                break;

            case 'right-bottom':
                // Правая-нижняя точка: угол ~315°
                angleDeg = 315;
                break;

            default:
                // fallback — пусть будет 0° (справа)
                angleDeg = 0;
                break;
        }

        // Переводим градусы в радианы
        const angleRad = (Math.PI / 180) * angleDeg;

        // Для SVG с вертикальной осью вниз используем y = cy - ry * sin(...).
        // 0° => (cx + rx, cy).
        const x = cx + rx * Math.cos(angleRad);
        const y = cy - ry * Math.sin(angleRad);

        return { x, y };
    }
    function getRectangleTextPosition(width, height, alignmentH, alignmentV) {
        // Здесь всё просто:
        // left-top -> (0, 0), center-center -> (width/2, height/2), right-bottom -> (width, height)
        let x, y;

        switch (alignmentH) {
            case 'left':
                x = 0;
                break;
            case 'right':
                x = width;
                break;
            default:
                // center
                x = width / 2;
        }

        switch (alignmentV) {
            case 'top':
                y = 0;
                break;
            case 'bottom':
                y = height;
                break;
            default:
                // center
                y = height / 2;
        }

        return { x, y };
    }
    function getTextPositionForShape(
        shapeType,
        width,
        height,
        textAlign,        // 'left' | 'center' | 'right'
        textAlignVertical // 'top' | 'center' | 'bottom'
    ) {
        switch (shapeType) {
            case ShapeType.RHOMBUS:
                return getRhombusTextPosition(width, height, textAlign, textAlignVertical);
            case ShapeType.CIRCLE:
                return getEllipseTextPosition(width, height, textAlign, textAlignVertical);
            // и т.д. для остальных типов...
            default:
                return getRectangleTextPosition(width, height, textAlign, textAlignVertical);
        }
    }

// Пример для ромба (9 вариантов – left-top, center-top, right-top и т.д.),
// где вы сами решаете, какие именно точки взять за "top-left" и т.п.
    function getRhombusTextPosition(width, height, alignmentH, alignmentV) {
        const top    = { x: width / 2, y: 0 };
        const right  = { x: width,     y: height / 2 };
        const bottom = { x: width / 2, y: height };
        const left   = { x: 0,         y: height / 2 };
        const center = { x: width / 2, y: height / 2 };

        const combinationKey = `${alignmentH}-${alignmentV}`;

        //console.log(combinationKey)

        switch (combinationKey) {
            //
            // ВЕРХ
            //
            case 'left-top':
                // midpoint между верхней и левой вершинами
                return midpoint(top, left);
            case 'center-top':
                // midpoint между верхней вершиной и центром
                return midpoint(top, center);
            case 'right-top':
                // midpoint между верхней и правой вершинами
                return midpoint(top, right);

            //
            // СЕРЕДИНА (vertical = middle)
            //
            case 'left-middle':
                // midpoint между левой вершиной и центром
                return midpoint(left, center);
            case 'center-middle':
                // сам центр
                return center;
            case 'right-middle':
                // midpoint между правой вершиной и центром
                return midpoint(right, center);

            //
            // НИЗ
            //
            case 'left-bottom':
                // midpoint между нижней и левой вершинами
                return midpoint(bottom, left);
            case 'center-bottom':
                // midpoint между нижней вершиной и центром
                return midpoint(bottom, center);
            case 'right-bottom':
                // midpoint между нижней и правой вершинами
                return midpoint(bottom, right);

            default:
                // fallback — центр
                return center;
        }
    }
    const { x: textX, y: textY } = getTextPositionForShape(
        currentShape,
        width,
        height,
        textAlign,        // 'left' | 'center' | 'right'
        textAlignVertical // 'top'  | 'center' | 'bottom'
    );

    function midpoint(p1, p2) {
        return {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2,
        };
    }

    function getShapeElement(shapeType, width, height, props = {}) {
        // props = {...} любые атрибуты вроде fill, stroke...
        switch (shapeType) {
            case ShapeType.CIRCLE:
                return (
                    <ellipse
                        cx={width / 2}
                        cy={height / 2}
                        rx={width / 2}
                        ry={height / 2}
                        {...props}
                    />
                );

            case ShapeType.RHOMBUS: {
                const points = `${width / 2},0 ${width},${height / 2} ${width / 2},${height} 0,${height / 2}`;
                return <polygon points={points} {...props} />;
            }

            // Можно добавить ShapeType.SQUARE, если у вас есть отдельный вариант
            // Но ниже в switch (ShapeType.RECTANGLE) можно тоже рисовать <rect>.
            case ShapeType.RECTANGLE:
            default:
                return (
                    <rect
                        x={0}
                        y={0}
                        width={width}
                        height={height}
                        {...props}
                    />
                );
        }
    }



    return (
        <BaseNode id={id} data={data} selected={selected}>
            <div style={containerStyle}>
                {/* Отрисовка фигуры с помощью SVG */}
                <svg
                    width={width}
                    height={height}
                    viewBox={`${vbX} ${vbY} ${vbWidth} ${vbHeight}`}
                    style={{ overflow: 'hidden' }}
                >
                    {/* Объявляем clipPath в <defs> */}
                    <defs>
                        <clipPath id={`clipShape-${id}`}>
                            {
                                // Тот же самый shape, но можно не указывать fill / stroke,
                                // clipPath читает только геометрию
                                getShapeElement(currentShape, width, height)
                            }
                        </clipPath>
                    </defs>

                    {/* Сама фигура (с заливкой, обводкой и т.д.) */}
                    {
                        getShapeElement(currentShape, width, height, {
                            fill: backgroundRgba,
                            stroke: strokeRgba,
                            strokeWidth: effectiveStrokeWidth,
                            ...(dashConfig && { strokeDasharray: dashConfig }),
                        })
                    }

                    {/* Группа с текстом, к которой применяется clip-path */}
                    <g clipPath={`url(#clipShape-${id})`}>
                        <text
                            x={textX}
                            y={textY}
                            textAnchor={
                                textAlign === TextAlignType.LEFT
                                    ? 'start'
                                    : textAlign === TextAlignType.RIGHT
                                        ? 'end'
                                        : 'middle'
                            }
                            dominantBaseline={
                                textAlignVertical === TextAlignVerticalType.TOP
                                    ? 'hanging'
                                    : textAlignVertical === TextAlignVerticalType.BOTTOM
                                        ? 'baseline'
                                        : 'middle'
                            }
                            fill={color}
                            style={{ pointerEvents: 'none' }}
                        >
                            {data.label}
                        </text>
                    </g>
                </svg>

                {/* Панель инструментов узла */}
                <NodeToolbar
                    onDoubleClick={(e) => e.stopPropagation()}
                    isVisible={selected}
                    position="top"
                    className="bg-white rounded shadow-sm"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 12px',
                        gap: '12px',
                    }}
                >
                    {/* Кнопка выбора типа фигуры */}
                    <Popover
                        getPopupContainer={(trigger) => trigger.parentElement}
                        content={
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {shapeOptions.map((opt) => (
                                    <Button
                                        key={opt.value}
                                        type={opt.value === currentShape ? 'primary' : 'default'}
                                        onClick={() => {
                                            handleDataChange({ shape: opt.value });
                                            setShapePickerVisible(false);
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

                    {/* Элементы панели инструментов для настройки текста */}
                    {/*<Select*/}
                    {/*    value={fontFamily}*/}
                    {/*    onChange={(val) => handleStyleChange({ fontFamily: val })}*/}
                    {/*    style={{ width: 120, minWidth: 80 }}*/}
                    {/*    options={Object.values(FontFamilyType).map((f) => ({ value: f, label: f }))}*/}
                    {/*/>*/}
                    {/*<InputNumber*/}
                    {/*    value={fontSize}*/}
                    {/*    onChange={(val) => handleStyleChange({ fontSize: val })}*/}
                    {/*    min={1}*/}
                    {/*    style={{ width: 60, textAlign: 'center' }}*/}
                    {/*/>*/}
                    {/*/!* Выбор горизонтального выравнивания *!/*/}
                    {/*<Select*/}
                    {/*    value={textAlign}*/}
                    {/*    onChange={(val) => handleStyleChange({ textAlign: val })}*/}
                    {/*    style={{ width: 120, minWidth: 80 }}*/}
                    {/*    options={[*/}
                    {/*        { value: TextAlignType.LEFT, label: 'Влево' },*/}
                    {/*        { value: TextAlignType.CENTER, label: 'По центру' },*/}
                    {/*        { value: TextAlignType.RIGHT, label: 'Вправо' },*/}
                    {/*    ]}*/}
                    {/*/>*/}

                    {/* Выбор вертикального выравнивания */}
                    <Select
                        value={textAlignVertical}
                        onChange={(val) => handleStyleChange({ textAlignVertical: val })}
                        style={{ width: 120, minWidth: 80 }}
                        options={[
                            { value: TextAlignVerticalType.TOP, label: 'Верх' },
                            { value: TextAlignVerticalType.MIDDLE, label: 'По центру' },
                            { value: TextAlignVerticalType.BOTTOM, label: 'Низ' },
                        ]}
                    />
                    <Popover
                        getPopupContainer={(trigger) => trigger.parentElement}
                        content={
                            <CirclePicker
                                color={color}
                                onChangeComplete={(newColor) => {
                                    handleStyleChange({ color: newColor.hex });
                                    setTextColorVisible(false);
                                }}
                            />
                        }
                        title="Цвет текста"
                        trigger="click"
                        visible={textColorVisible}
                        onVisibleChange={setTextColorVisible}
                    >
                        <Button onClick={() => setTextColorVisible(true)}>
                            <FontColorsOutlined />
                        </Button>
                    </Popover>

                    {/* Настройки заливки */}
                    <Popover
                        getPopupContainer={(trigger) => trigger.parentElement}
                        content={
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                                        Прозрачность заливки
                                    </div>
                                    <Slider
                                        min={0}
                                        max={1}
                                        step={0.05}
                                        value={parseFloat(fillOpacity)}
                                        onChange={(val) =>
                                            handleStyleChange({ fillOpacity: val.toString() })
                                        }
                                    />
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                                        Цвет заливки
                                    </div>
                                    <CirclePicker
                                        color={fillColor}
                                        onChangeComplete={(newColor) => {
                                            handleStyleChange({ fillColor: newColor.hex });
                                        }}
                                    />
                                </div>
                            </div>
                        }
                        title="Настройки заливки"
                        trigger="click"
                        visible={fillSettingsVisible}
                        onVisibleChange={setFillSettingsVisible}
                    >
                        <Button>
                            <BgColorsOutlined />
                        </Button>
                    </Popover>

                    {/* Настройки обводки */}
                    <Popover
                        getPopupContainer={(trigger) => trigger.parentElement}
                        content={
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div>
                                    <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                                        Прозрачность обводки
                                    </div>
                                    <Slider
                                        min={0}
                                        max={1}
                                        step={0.05}
                                        value={parseFloat(borderOpacity)}
                                        onChange={(val) =>
                                            handleStyleChange({ borderOpacity: val.toString() })
                                        }
                                    />
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                                        Стиль обводки
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <Button
                                            type={borderStyle === BorderStyleType.NONE ? 'primary' : 'default'}
                                            onClick={() =>
                                                handleStyleChange({ borderStyle: BorderStyleType.NONE, borderWidth: 0 })
                                            }
                                        >
                                            Нет
                                        </Button>
                                        <Button
                                            type={
                                                borderStyle === BorderStyleType.DOTTED ? 'primary' : 'default'
                                            }
                                            onClick={() => handleStyleChange({ borderStyle: BorderStyleType.DOTTED })}
                                        >
                                            Пунктир
                                        </Button>
                                        <Button
                                            type={
                                                borderStyle === BorderStyleType.DASHED ? 'primary' : 'default'
                                            }
                                            onClick={() => handleStyleChange({ borderStyle: BorderStyleType.DASHED })}
                                        >
                                            Штрих
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                                        Толщина обводки
                                    </div>
                                    <Slider
                                        min={0}
                                        max={10}
                                        step={0.5}
                                        value={parseFloat(borderWidth)}
                                        onChange={(val) => handleStyleChange({ borderWidth: val })}
                                        disabled={borderStyle === BorderStyleType.NONE}
                                    />
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                                        Цвет обводки
                                    </div>
                                    <CirclePicker
                                        color={borderColor}
                                        onChangeComplete={(newColor) => {
                                            handleStyleChange({ borderColor: newColor.hex });
                                            setBorderSettingsVisible(false);
                                        }}
                                    />
                                </div>
                            </div>
                        }
                        title="Настройки обводки"
                        trigger="click"
                        visible={borderSettingsVisible}
                        onVisibleChange={setBorderSettingsVisible}
                    >
                        <Button>Обводка</Button>
                    </Popover>
                </NodeToolbar>
            </div>
        </BaseNode>
    );
};

export default ShapeNode;
