// StickyNoteNode.js
import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { Handle, Position, NodeToolbar } from '@xyflow/react';
import { editingInputStyle } from '../../utils/nodeUtils';
import { BaseNode } from './BaseNode';
import { Select, InputNumber, Popover, Button, Slider } from 'antd';
import { CirclePicker } from 'react-color';
import { BgColorsOutlined, FontColorsOutlined } from '@ant-design/icons';
import { hexToRgba, getFlexAlignByVerticalTextAlign } from '../../utils/nodeUtils';
import { throttle } from 'lodash';
import {
  ColorType,
  FontFamilyType,
  TextAlignType,
  TextAlignVerticalType,
  StickyNoteShapeType
} from '../../model/Enums';

// Обычные константы для опций
const fontOptions = Object.values(FontFamilyType).map((font) => ({
  value: font,
  label: font,
}));

// Опции для выравнивания
const alignOptions = [
  { value: TextAlignType.LEFT, label: 'Left' },
  { value: TextAlignType.CENTER, label: 'Center' },
  { value: TextAlignType.RIGHT, label: 'Right' },
];

// Опции для вертикального выравнивания
const verticalAlignOptions = [
  { value: TextAlignVerticalType.TOP, label: 'Top' },
  { value: TextAlignVerticalType.MIDDLE, label: 'Middle' },
  { value: TextAlignVerticalType.BOTTOM, label: 'Bottom' },
];

// Опции для формы стикера
const shapeOptions = [
  { value: StickyNoteShapeType.SQUARE, label: 'Square' },
  { value: StickyNoteShapeType.RECTANGLE, label: 'Rectangle' },
];

// Создаем компонент с тенью для SVG
const StickyNoteShadowFilter = () => (
  <defs>
    <filter id="stickyNoteShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="1" dy="3" stdDeviation="3" floodOpacity="0.16" />
    </filter>
  </defs>
);

export const StickyNoteNode = memo(({ id, data, selected, positionAbsoluteX, positionAbsoluteY }) => {
  // Используем useRef для хранения ссылок на функции из data
  const functionsRef = useRef(data.functions);
  
  // Обновляем ссылку на функции при изменении data
  useMemo(() => {
    functionsRef.current = data.functions;
  }, [data.functions]);

  // Состояние для управления видимостью Popover
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [alignmentVisible, setAlignmentVisible] = useState(false);

  // Мемоизируем извлечение параметров стилей
  const {
    fillColor,
    fontSize,
    fontFamily,
    textAlign,
    textAlignVertical,
  } = useMemo(() => ({
    fillColor: data.style?.fillColor || ColorType.FFF9B1, // светло-желтый по умолчанию
    fontSize: data.style?.fontSize || 14,
    fontFamily: data.style?.fontFamily || FontFamilyType.ARIAL,
    textAlign: data.style?.textAlign || TextAlignType.CENTER,
    textAlignVertical: data.style?.textAlignVertical || TextAlignVerticalType.TOP,
  }), [data.style]);

  // Мемоизируем получение размеров узла
  const { width, height } = useMemo(() => ({
    width: data.geometry?.width || 200,
    height: data.geometry?.height || 200,
  }), [data.geometry]);

  // Вычисляем положение текста на основе выравнивания
  const textPosition = useMemo(() => {
    const padding = 16; // отступ от краев
    
    // Горизонтальное положение
    let x;
    if (textAlign === TextAlignType.LEFT) {
      x = padding;
    } else if (textAlign === TextAlignType.RIGHT) {
      x = width - padding;
    } else { // CENTER
      x = width / 2;
    }
    
    // Вертикальное положение
    let y;
    if (textAlignVertical === TextAlignVerticalType.TOP) {
      y = padding + fontSize; // добавляем fontSize чтобы текст был виден
    } else if (textAlignVertical === TextAlignVerticalType.BOTTOM) {
      y = height - padding;
    } else { // MIDDLE
      y = height / 2;
    }
    
    return { x, y };
  }, [width, height, textAlign, textAlignVertical, fontSize]);

  // Определяем атрибуты для текста на основе выравнивания
  const textAttrs = useMemo(() => {
    const attrs = {
      x: textPosition.x,
      y: textPosition.y,
      fontFamily,
      fontSize: `${fontSize}px`,
      fill: '#000000',
      style: { wordBreak: 'break-word', whiteSpace: 'pre-wrap' }
    };
    
    // Добавляем атрибуты для горизонтального выравнивания
    if (textAlign === TextAlignType.LEFT) {
      attrs.textAnchor = 'start';
    } else if (textAlign === TextAlignType.RIGHT) {
      attrs.textAnchor = 'end';
    } else { // CENTER
      attrs.textAnchor = 'middle';
    }
    
    // Добавляем атрибуты для вертикального выравнивания
    if (textAlignVertical === TextAlignVerticalType.TOP) {
      attrs.dominantBaseline = 'text-before-edge';
    } else if (textAlignVertical === TextAlignVerticalType.BOTTOM) {
      attrs.dominantBaseline = 'text-after-edge';
    } else { // MIDDLE
      attrs.dominantBaseline = 'middle';
    }
    
    return attrs;
  }, [textPosition, fontFamily, fontSize, textAlign, textAlignVertical]);

  // Обработчики обновления стилей
  const handleStyleChange = useCallback((stylePart) => {
    if (functionsRef.current?.onStyleChange) {
      const updatedStyle = { ...data.style, ...stylePart };
      functionsRef.current.onStyleChange(id, updatedStyle);
    }
  }, [id, data.style]);

  // Колбэки для обновления стилей
  const handleFontSizeChange = useCallback((val) => {
    handleStyleChange({ fontSize: val });
  }, [handleStyleChange]);

  const handleFontFamilyChange = useCallback((val) => {
    handleStyleChange({ fontFamily: val });
  }, [handleStyleChange]);

  const handleFillColorChange = useCallback((color) => {
    handleStyleChange({ fillColor: color.hex });
    setColorPickerVisible(false);
  }, [handleStyleChange]);

  const handleTextAlignChange = useCallback((value) => {
    handleStyleChange({ textAlign: value });
  }, [handleStyleChange]);

  const handleTextAlignVerticalChange = useCallback((value) => {
    handleStyleChange({ textAlignVertical: value });
    setAlignmentVisible(false);
  }, [handleStyleChange]);

  // Функция для разбиения текста на строки
  const getTextLines = useCallback((text, maxWidth) => {
    if (!text) return ['Sticky Note'];
    
    // Упрощенная реализация - просто разбиваем по переносам строк
    return text.split('\n');
  }, []);

  // Контент для поповеров
  const alignmentPopoverContent = useMemo(() => (
    <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div>
        <div style={{ fontSize: '12px', marginBottom: '4px' }}>Horizontal Align</div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {alignOptions.map(option => (
            <Button
              key={option.value}
              type={textAlign === option.value ? "primary" : "default"}
              onClick={() => handleTextAlignChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: '12px', marginBottom: '4px' }}>Vertical Align</div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {verticalAlignOptions.map(option => (
            <Button
              key={option.value}
              type={textAlignVertical === option.value ? "primary" : "default"}
              onClick={() => handleTextAlignVerticalChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  ), [textAlign, textAlignVertical, handleTextAlignChange, handleTextAlignVerticalChange]);

  // Получаем строки текста
  const textLines = useMemo(() => 
    getTextLines(data.label, width - 32), // 32 = padding * 2
  [data.label, width, getTextLines]);

  // Создаем мемоизированный тулбар
  const stickyNoteToolbar = useMemo(() => (
    <NodeToolbar
      onDoubleClick={(e) => e.stopPropagation()}
      isVisible={selected}
      position="top"
      className="bg-white rounded shadow-sm"
      style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', gap: '12px' }}
    >
      {/* Размер шрифта */}
      <InputNumber
        value={fontSize}
        onChange={handleFontSizeChange}
        min={1}
        max={64}
        style={{ width: 60, textAlign: 'center' }}
      />

      {/* Выбор шрифта */}
      <Select
        value={fontFamily}
        onChange={handleFontFamilyChange}
        style={{ width: 120 }}
        options={fontOptions}
      />

      {/* Цвет заливки */}
      <Popover
        getPopupContainer={(trigger) => trigger.parentElement}
        content={
          <CirclePicker
            color={fillColor}
            onChangeComplete={handleFillColorChange}
            colors={[
              "#FFF9B1", "#F5D128", "#FF9D48", 
              "#F16C7F", "#EA94BB", "#A6CCF5", 
              "#7B92FF", "#67C6C0", "#93D275", 
              "#D0E17A", "#D5F692"
            ]}
          />
        }
        title="Fill Color"
        trigger="click"
        open={colorPickerVisible}
        onOpenChange={setColorPickerVisible}
      >
        <Button icon={<BgColorsOutlined />} />
      </Popover>

      {/* Выравнивание */}
      <Popover
        getPopupContainer={(trigger) => trigger.parentElement}
        content={alignmentPopoverContent}
        title="Alignment"
        trigger="click"
        open={alignmentVisible}
        onOpenChange={setAlignmentVisible}
      >
        <Button>Alignment</Button>
      </Popover>
    </NodeToolbar>
  ), [
    selected, fontSize, fontFamily, fillColor, colorPickerVisible, alignmentVisible,
    handleFontSizeChange, handleFontFamilyChange, handleFillColorChange,
    alignmentPopoverContent, setColorPickerVisible, setAlignmentVisible
  ]);

  // Создаем только содержимое тулбара
  const stickyNoteToolbarContent = useMemo(() => (
    <>
      {/* Размер шрифта */}
      <InputNumber
        value={fontSize}
        onChange={handleFontSizeChange}
        min={1}
        max={64}
        style={{ width: 60, textAlign: 'center' }}
      />

      {/* Выбор шрифта */}
      <Select
        value={fontFamily}
        onChange={handleFontFamilyChange}
        style={{ width: 120 }}
        options={fontOptions}
      />

      {/* Цвет заливки */}
      <Popover
        getPopupContainer={(trigger) => trigger.parentElement}
        content={
          <CirclePicker
            color={fillColor}
            onChangeComplete={handleFillColorChange}
            colors={[
              "#FFF9B1", "#F5D128", "#FF9D48", 
              "#F16C7F", "#EA94BB", "#A6CCF5", 
              "#7B92FF", "#67C6C0", "#93D275", 
              "#D0E17A", "#D5F692"
            ]}
          />
        }
        title="Fill Color"
        trigger="click"
        open={colorPickerVisible}
        onOpenChange={setColorPickerVisible}
      >
        <Button icon={<BgColorsOutlined />} />
      </Popover>

      {/* Выравнивание */}
      <Popover
        getPopupContainer={(trigger) => trigger.parentElement}
        content={alignmentPopoverContent}
        title="Alignment"
        trigger="click"
        open={alignmentVisible}
        onOpenChange={setAlignmentVisible}
      >
        <Button>Alignment</Button>
      </Popover>
    </>
  ), [
    fontSize, fontFamily, fillColor, colorPickerVisible, alignmentVisible,
    handleFontSizeChange, handleFontFamilyChange, handleFillColorChange,
    alignmentPopoverContent, setColorPickerVisible, setAlignmentVisible
  ]);

  return (
    <BaseNode 
      id={id} 
      data={data} 
      selected={selected} 
      positionAbsoluteX={positionAbsoluteX} 
      positionAbsoluteY={positionAbsoluteY}
      toolbarContent={stickyNoteToolbarContent}
    >
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <StickyNoteShadowFilter />
        
        {/* Фон стикера */}
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill={fillColor}
          rx="2"
          ry="2"
          filter="url(#stickyNoteShadow)"
        />
        
        {/* Текст */}
        <text {...textAttrs}>
          {textLines.map((line, index) => (
            <tspan 
              key={index} 
              x={textAttrs.x} 
              dy={index === 0 ? 0 : fontSize * 1.2}
            >
              {line || 'Sticky Note'}
            </tspan>
          ))}
        </text>
      </svg>
    </BaseNode>
  );
});