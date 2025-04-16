import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { BaseNode } from './BaseNode';
import { NodeToolbar } from '@xyflow/react';
import { Select, InputNumber, Popover, Button, Slider } from 'antd';
import { CirclePicker } from 'react-color';
import { FontColorsOutlined, BgColorsOutlined } from '@ant-design/icons';
import { hexToRgba, getFlexAlignByVerticalTextAlign } from '../../utils/nodeUtils';
import { throttle } from 'lodash';
import {
  ColorType,
  FontFamilyType,
  TextAlignType,
  TextAlignVerticalType,
} from '../../model/Enums';

// Обычные константы вместо useMemo на верхнем уровне
const fontOptions = Object.values(FontFamilyType).map((font) => ({
  value: font,
  label: font,
}));

// Обычные константы вместо useMemo на верхнем уровне
const alignOptions = [
  { value: TextAlignType.LEFT, label: 'Left' },
  { value: TextAlignType.CENTER, label: 'Center' },
  { value: TextAlignType.RIGHT, label: 'Right' },
];

// Мэппинг для горизонтального выравнивания (textAlign → textAnchor)
const textAnchorMapping = {
  left: 'start',
  center: 'middle',
  right: 'end',
};

export const TextNode = memo(({ id, data, selected, positionAbsoluteX, positionAbsoluteY }) => {
  // Используем useRef для хранения ссылок на функции из data
  const functionsRef = useRef(data.functions);
  
  // Обновляем ссылку на функции при изменении data
  useMemo(() => {
    functionsRef.current = data.functions;
  }, [data.functions]);

  // Мемоизируем извлечение параметров стилей
  const {
    fontFamily,
    fontSize,
    color,
    fillColor,
    fillOpacity,
    textAlign
  } = useMemo(() => {
    // Отладочный вывод
    console.log('data.style?.fillOpacity (raw):', data.style?.fillOpacity);
    console.log('typeof data.style?.fillOpacity:', typeof data.style?.fillOpacity);
    
    // Явно проверяем и преобразуем значение fillOpacity
    let opacity;
    
    // Специальная проверка для значения 0 - оно должно сохраняться как 0
    if (data.style?.fillOpacity === 0 || data.style?.fillOpacity === '0') {
      opacity = 0;
    } else {
      // Для других значений
      opacity = data.style?.fillOpacity;
      
      // Преобразуем в число, если это строка
      if (typeof opacity === 'string') {
        opacity = parseFloat(opacity);
      }
      
      // Если значение не определено или NaN, используем 1.0 по умолчанию
      if (opacity === undefined || opacity === null || isNaN(opacity)) {
        opacity = 1.0;
      }
    }
    
    // Отладочный вывод после обработки
    console.log('processed opacity:', opacity);
    
    return {
      fontFamily: data.style?.fontFamily || FontFamilyType.ARIAL,
      fontSize: data.style?.fontSize || 14,
      color: data.style?.color || '#000000',
      fillColor: data.style?.fillColor || ColorType.WHITE,
      fillOpacity: opacity, // используем обработанное значение
      textAlign: data.style?.textAlign || TextAlignType.CENTER,
    };
  }, [data.style]);

  // Мемоизируем получение размеров узла
  const { width, height } = useMemo(() => ({
    width: data.geometry?.width || 120,
    height: data.geometry?.height || 80,
  }), [data.geometry]);

  // Мемоизируем вычисление RGBA для фона
  const backgroundRgba = useMemo(() => {
    // Гарантируем, что fillOpacity - число и находится в диапазоне [0, 1]
    const opacity = typeof fillOpacity === 'number' ? 
      Math.min(1, Math.max(0, fillOpacity)) : 
      parseFloat(fillOpacity) || 0;
    
    return hexToRgba(fillColor, opacity);
  }, [fillColor, fillOpacity]);

  // Мемоизируем формирование стиля текста
  const textStyle = useMemo(() => ({
    fontFamily,
    fontSize: `${fontSize}px`,
    fill: color,
    background: 'transparent',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textRendering: 'optimizeLegibility',
    userSelect: 'none',
    pointerEvents: 'none'
  }), [fontFamily, fontSize, color]);

  // Добавляем новые оптимизации
  // Мемоизированное вычисление SVG стилей и размеров
  const svgAttributes = useMemo(() => ({
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    preserveAspectRatio: "none",
    style: { overflow: 'hidden' }
  }), [width, height]);

  // Мемоизированный стиль для rect (прямоугольника фона)
  const rectAttributes = useMemo(() => ({
    x: 0,
    y: 0,
    width,
    height,
    fill: backgroundRgba
  }), [width, height, backgroundRgba]);

  // Мемоизируем вычисление textAnchor и позиции текста на основе textAlign
  const { textAnchor, textX, textY } = useMemo(() => {
    const currentTextAlign = textAlign || TextAlignType.CENTER;
    
    let anchor = 'middle';
    if (currentTextAlign === TextAlignType.LEFT) anchor = 'start';
    else if (currentTextAlign === TextAlignType.RIGHT) anchor = 'end';
    
    let x = width / 2;
    if (currentTextAlign === TextAlignType.LEFT) x = 10;
    else if (currentTextAlign === TextAlignType.RIGHT) x = width - 10;
    
    return {
      textAnchor: anchor,
      textX: x,
      textY: height / 2
    };
  }, [textAlign, width, height]);

  // Колбэки для обновления стилей
  const handleFontSizeChange = useCallback((val) => {
    if (functionsRef.current?.onStyleChange) {
      functionsRef.current.onStyleChange(id, { fontSize: val });
    }
  }, [id]);

  const handleFontFamilyChange = useCallback((val) => {
    if (functionsRef.current?.onStyleChange) {
      functionsRef.current.onStyleChange(id, { fontFamily: val });
    }
  }, [id]);

  const handleTextColorChange = useCallback((newColor) => {
    if (functionsRef.current?.onStyleChange) {
      functionsRef.current.onStyleChange(id, { color: newColor.hex });
    }
  }, [id]);

  const handleFillOpacityChange = useCallback((val) => {
    if (functionsRef.current?.onStyleChange) {
      // Преобразуем значение в строку, так как с сервера может приходить строка
      functionsRef.current.onStyleChange(id, { fillOpacity: val });
    }
  }, [id]);

  const handleFillColorChange = useCallback((newColor) => {
    if (functionsRef.current?.onStyleChange) {
      functionsRef.current.onStyleChange(id, { fillColor: newColor.hex });
    }
  }, [id]);

  const handleTextAlignChange = useCallback((val) => {
    if (functionsRef.current?.onStyleChange) {
      functionsRef.current.onStyleChange(id, { textAlign: val });
    }
  }, [id]);

  // Мемоизированный контент для Popover цвета текста
  const textColorPopoverContent = useMemo(() => (
    <CirclePicker
      color={color}
      onChangeComplete={handleTextColorChange}
    />
  ), [color, handleTextColorChange]);

  // Мемоизированный контент для Popover настроек заливки
  const fillSettingsPopoverContent = useMemo(() => {
    // Убедимся, что значение прозрачности - число в диапазоне [0, 1]
    const opacityValue = typeof fillOpacity === 'number' ? 
      fillOpacity : 
      parseFloat(fillOpacity) || 0;
    
    return (
      <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '12px', marginBottom: '4px' }}>
            Прозрачность заливки: {Math.round(opacityValue * 100)}%
          </div>
          <Slider
            min={0}
            max={1}
            step={0.05}
            value={opacityValue}
            onChange={handleFillOpacityChange}
          />
        </div>
        <div>
          <div style={{ fontSize: '12px', marginBottom: '4px' }}>Цвет заливки</div>
          <CirclePicker
            color={fillColor}
            onChangeComplete={handleFillColorChange}
          />
        </div>
      </div>
    );
  }, [fillOpacity, fillColor, handleFillOpacityChange, handleFillColorChange]);

  // Опции для выравнивания текста с русскими названиями
  const alignOptionsLocalized = useMemo(() => [
    { value: TextAlignType.LEFT, label: 'По левому краю' },
    { value: TextAlignType.CENTER, label: 'По центру' },
    { value: TextAlignType.RIGHT, label: 'По правому краю' },
  ], []);

  // Эффект для очистки ресурсов при размонтировании компонента
  useEffect(() => {
    let isMounted = true;
    
    return () => {
      isMounted = false;
      // Здесь можно добавить очистку для throttled/debounced функций
    };
  }, []);

  return (
    <BaseNode id={id} data={data} selected={selected} positionAbsoluteX={positionAbsoluteX} positionAbsoluteY={positionAbsoluteY}>
      <div style={{ width: '100%', height: '100%' }}>
        <svg {...svgAttributes}>
          {/* Фон узла – просто прямоугольник с заливкой */}
          <rect {...rectAttributes} />
          {/* Текст, отрисовываемый с учетом всех стилей */}
          <text
            x={textX}
            y={textY}
            textAnchor={textAnchor}
            dominantBaseline="middle"
            style={textStyle}
          >
            {data.label || ''}
          </text>
        </svg>

        <NodeToolbar
          onDoubleClick={(e) => e.stopPropagation()}
          isVisible={selected}
          position="top"
          className="bg-white rounded shadow-sm"
          style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', gap: '12px' }}
        >
          {/* Элемент для настройки размера шрифта */}
          <InputNumber
            value={fontSize}
            onChange={handleFontSizeChange}
            min={1}
            variant={"filled"}
            style={{ width: 60, textAlign: 'center' }}
          />

          {/* Выбор шрифта */}
          <Select
            value={fontFamily}
            onChange={handleFontFamilyChange}
            variant={"filled"}
            style={{ width: 120, minWidth: 80 }}
            options={fontOptions}
          />

          {/* Цвет текста */}
          <Popover
            getPopupContainer={(trigger) => trigger.parentElement}
            content={textColorPopoverContent}
            title="Цвет текста"
            trigger="click"
          >
            <Button 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              icon={<FontColorsOutlined style={{ fontSize: '20px' }} />} 
            />
          </Popover>

          {/* Настройки заливки */}
          <Popover
            getPopupContainer={(trigger) => trigger.parentElement}
            content={fillSettingsPopoverContent}
            title="Настройки заливки"
            trigger="click"
          >
            <Button 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              icon={<BgColorsOutlined style={{ fontSize: '20px' }} />} 
            />
          </Popover>

          {/* Выравнивание текста по горизонтали */}
          <Select
            value={textAlign}
            onChange={handleTextAlignChange}
            style={{ width: 120 }}
            variant={"filled"}
            options={alignOptionsLocalized}
          />
        </NodeToolbar>
      </div>
    </BaseNode>
  );
});

export default TextNode;
