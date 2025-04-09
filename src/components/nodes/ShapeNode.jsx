import React, { useState } from 'react';
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

// Определяем набор возможных фигур для выбора
const shapeOptions = [
    { value: ShapeType.CIRCLE, label: 'Круг' },
    { value: ShapeType.RECTANGLE, label: 'Прямоугольник' },
    { value: ShapeType.RHOMBUS, label: 'Ромб' },
];

export const ShapeNode = (props) => {
    const { id, data, selected } = props;

    // Управление видимостью Popover'ов
    const [shapePickerVisible, setShapePickerVisible] = useState(false);
    const [textColorVisible, setTextColorVisible] = useState(false);
    const [fillSettingsVisible, setFillSettingsVisible] = useState(false);
    const [alignmentVisible, setAlignmentVisible] = useState(false);
    const [borderSettingsVisible, setBorderSettingsVisible] = useState(false);

    // Обработчики обновления данных и стилей узла
    const handleStyleChange = (stylePart) => {
        if (data.functions?.onStyleChange) {
            const updatedStyle = { ...data.style, ...stylePart };
            data.functions.onStyleChange(id, updatedStyle);
        }
    };

    const handleDataChange = (dataPart) => {
        if (data.functions?.onDataChange) {
            const updatedData = { ...data, ...dataPart };
            data.functions.onDataChange(id, updatedData);
        }
    };

    // Извлекаем стили с дефолтными значениями
    const {
        fontFamily = FontFamilyType.ARIAL,
        fontSize = 14,
        color = "#000000", // текст
        fillColor = ColorType.WHITE,
        fillOpacity = 1.0, // например, 1.0 или 0.5
        textAlign = TextAlignType.CENTER,
        textAlignVertical = TextAlignVerticalType.TOP,
        borderColor = "#000000",
        borderOpacity = 1.0,
        borderStyle = BorderStyleType.NONE,
        borderWidth = 1,
    } = data.style || {};

    // Текущий тип фигуры из data, по умолчанию прямоугольник
    const currentShape = data.shape || ShapeType.RECTANGLE;

    // Расчёт цветов
    const backgroundRgba = hexToRgba(fillColor, parseFloat(fillOpacity));
    const borderColorRgba = hexToRgba(borderColor, parseFloat(borderOpacity));
    const effectiveBorderWidth = borderStyle === BorderStyleType.NONE ? 0 : borderWidth;
    const borderStyleString = `${effectiveBorderWidth}px ${borderStyle} ${borderColorRgba}`;
    const alignItems = getFlexAlignByVerticalTextAlign(textAlignVertical);

    const innerStyle = {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        fontFamily,
        fontSize: `${fontSize}px`,
        color,
    };

    // Функции для вычисления позиций и отрисовки фигуры (оставляем без изменений)
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

// Для ромба пересмотрен алгоритм: вместо простого midpoint задаём позицию как фиксированные доли ширины/высоты,
// чтобы для left-middle и right-middle смещение было заметнее
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
            default:
                return getRectangleTextPosition(width, height, textAlign, textAlignVertical);
        }
    };

    const getShapeElement = (shapeType, width, height, props = {}) => {
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
    };

    // Размеры фигуры
    const width = data.geometry?.width || 100;
    const height = data.geometry?.height || 80;
    const offset = effectiveBorderWidth / 2;
    const vbX = -offset;
    const vbY = -offset;
    const vbWidth = width + effectiveBorderWidth;
    const vbHeight = height + effectiveBorderWidth;
    const { x: textX, y: textY } = getTextPositionForShape(
        currentShape,
        width,
        height,
        textAlign,
        textAlignVertical
    );

    return (
        <BaseNode id={id} data={data} selected={selected}>
            <div style={innerStyle}>
                <svg
                    width={width}
                    height={height}
                    viewBox={`${vbX} ${vbY} ${vbWidth} ${vbHeight}`}
                    // viewBox="0 0 width height"
                    preserveAspectRatio="none"
                    style={{ overflow: 'hidden' }}
                >
                    <defs>
                        <clipPath id={`clipShape-${id}`}>
                            {getShapeElement(currentShape, width, height)}
                        </clipPath>
                    </defs>
                    {getShapeElement(currentShape, width, height, {
                        fill: backgroundRgba,
                        stroke: hexToRgba(borderColor, parseFloat(borderOpacity)),
                        strokeWidth: effectiveBorderWidth,
                        ...(borderStyle !== BorderStyleType.NONE && {
                            strokeDasharray:
                                borderStyle === BorderStyleType.DOTTED
                                    ? '2,6'
                                    : borderStyle === BorderStyleType.DASHED
                                        ? '10,6'
                                        : undefined,
                        }),
                    })}
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
                            {data.label || ''}
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

                    {/* Остальные элементы панели инструментов, связанные с настройкой шрифта, цвета, заливки, выравнивания и обводки */}
                    <Select
                        value={fontFamily}
                        onChange={(val) => handleStyleChange({ fontFamily: val })}
                        variant={"filled"}
                        style={{ width: 120, minWidth: 80 }}
                        options={Object.values(FontFamilyType).map((font) => ({ value: font, label: font }))}
                    />

                    <InputNumber
                        value={fontSize}
                        onChange={(val) => handleStyleChange({ fontSize: val })}
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
                                    handleStyleChange({ color: newColor.hex });
                                    setTextColorVisible(false);
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
                                        value={parseFloat(fillOpacity)}
                                        onChange={(val) => handleStyleChange({ fillOpacity: val.toString() })}
                                    />
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', marginBottom: '4px' }}>Fill Color</div>
                                    <CirclePicker
                                        color={fillColor}
                                        onChangeComplete={(newColor) => {
                                            handleStyleChange({ fillColor: newColor.hex });
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
                                        onClick={() => handleStyleChange({ textAlign: TextAlignType.LEFT })}
                                    >
                                        <MdFormatAlignLeft size={18} style={{ opacity: textAlign === TextAlignType.LEFT ? 1 : 0.5 }} />
                                    </Button>
                                    <Button
                                        type="text"
                                        onClick={() => handleStyleChange({ textAlign: TextAlignType.CENTER })}
                                    >
                                        <MdFormatAlignCenter size={18} style={{ opacity: textAlign === TextAlignType.CENTER ? 1 : 0.5 }} />
                                    </Button>
                                    <Button
                                        type="text"
                                        onClick={() => handleStyleChange({ textAlign: TextAlignType.RIGHT })}
                                    >
                                        <MdFormatAlignRight size={18} style={{ opacity: textAlign === TextAlignType.RIGHT ? 1 : 0.5 }} />
                                    </Button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                                    <Button
                                        type="text"
                                        onClick={() => handleStyleChange({ textAlignVertical: TextAlignVerticalType.TOP })}
                                    >
                                        <MdVerticalAlignTop size={18} style={{ opacity: textAlignVertical === TextAlignVerticalType.TOP ? 1 : 0.5 }} />
                                    </Button>
                                    <Button
                                        type="text"
                                        onClick={() => handleStyleChange({ textAlignVertical: TextAlignVerticalType.MIDDLE })}
                                    >
                                        <MdVerticalAlignTop
                                            size={18}
                                            style={{ opacity: textAlignVertical === TextAlignVerticalType.MIDDLE ? 1 : 0.5, transform: 'rotate(90deg)' }}
                                        />
                                    </Button>
                                    <Button
                                        type="text"
                                        onClick={() => handleStyleChange({ textAlignVertical: TextAlignVerticalType.BOTTOM })}
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
                                        value={parseFloat(borderOpacity)}
                                        onChange={(val) => handleStyleChange({ borderOpacity: val.toString() })}
                                    />
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', marginBottom: '4px' }}>Border Style</div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <Button
                                            type={borderStyle === BorderStyleType.NONE ? "primary" : "default"}
                                            onClick={() => handleStyleChange({ borderStyle: BorderStyleType.NONE })}
                                        >
                                            <TfiLayoutLineSolid size={30} />
                                        </Button>
                                        <Button
                                            type={borderStyle === BorderStyleType.DOTTED ? "primary" : "default"}
                                            onClick={() => handleStyleChange({ borderStyle: BorderStyleType.DOTTED })}
                                        >
                                            <TbLineDotted size={30} />
                                        </Button>
                                        <Button
                                            type={borderStyle === BorderStyleType.DASHED ? "primary" : "default"}
                                            onClick={() => handleStyleChange({ borderStyle: BorderStyleType.DASHED })}
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
                                        onChange={(val) => handleStyleChange({ borderWidth: val })}
                                        disabled={borderStyle === BorderStyleType.NONE}
                                    />
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', marginBottom: '4px' }}>Border Color</div>
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
};

