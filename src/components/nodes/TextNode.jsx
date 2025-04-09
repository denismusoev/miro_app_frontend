import React, { useState, useEffect } from 'react';
import { BaseNode } from './BaseNode';
import { NodeToolbar } from '@xyflow/react';
import { Select, InputNumber, Popover, Button, Slider } from 'antd';
import { CirclePicker } from 'react-color';
import { FontColorsOutlined, BgColorsOutlined } from '@ant-design/icons';
import { hexToRgba, getFlexAlignByVerticalTextAlign } from '../../utils/nodeUtils';
import {
  ColorType,
  FontFamilyType,
  TextAlignType,
  TextAlignVerticalType,
} from '../../model/Enums';

// Опции для выбора шрифта
const fontOptions = Object.values(FontFamilyType).map((font) => ({
  value: font,
  label: font,
}));

export const TextNode = ({ id, data, selected }) => {
  // Извлекаем параметры стилей с дефолтными значениями из data.style
  const {
    fontFamily = FontFamilyType.ARIAL,
    fontSize = 14, // базовый размер шрифта
    color = '#000000',
    fillColor = ColorType.WHITE,
    fillOpacity = 1.0,
    textAlign = TextAlignType.CENTER,
  } = data.style || {};

  // Получаем размеры узла из data.geometry
  const width = data.geometry?.width || 120;
  const height = data.geometry?.height || 80;

  // Вычисляем RGBA для фона
  const backgroundRgba = hexToRgba(fillColor, parseFloat(fillOpacity));

  // Мэппинг для горизонтального выравнивания (textAlign → textAnchor)
  const textAnchorMapping = {
    left: 'start',
    center: 'middle',
    right: 'end',
  };
  const textAnchor = textAnchorMapping[textAlign] || 'middle';

  // Центр узла для отрисовки текста
  const textX = textAlign === TextAlignType.LEFT ? 10 : 
                textAlign === TextAlignType.RIGHT ? width - 10 : 
                width / 2;
  const textY = height / 2;

  // Формируем стиль текста, используя динамический размер шрифта
  const textStyle = {
    fontFamily,
    fontSize: `${fontSize}px`,
    fill: color
  };

  return (
    <BaseNode id={id} data={data} selected={selected}>
      <div style={{ width: '100%', height: '100%' }}>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          style={{ overflow: 'hidden' }}
        >
          {/* Фон узла – просто прямоугольник с заливкой */}
          <rect x="0" y="0" width={width} height={height} fill={backgroundRgba} />
          {/* Текст, отрисовываемый в центре */}
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
            onChange={(val) => {
              data.functions?.onStyleChange?.(id, { fontSize: val });
            }}
            min={1}
            style={{ width: 60, textAlign: 'center' }}
          />

          {/* Выбор шрифта */}
          <Select
            value={fontFamily}
            onChange={(val) => data.functions?.onStyleChange?.(id, { fontFamily: val })}
            style={{ width: 120 }}
            options={fontOptions}
          />

          {/* Цвет текста */}
          <Popover
            getPopupContainer={(trigger) => trigger.parentElement}
            content={
              <CirclePicker
                color={color}
                onChangeComplete={(newColor) => {
                  data.functions?.onStyleChange?.(id, { color: newColor.hex });
                }}
              />
            }
            title="Text Color"
            trigger="click"
          >
            <Button icon={<FontColorsOutlined />} />
          </Popover>

          {/* Настройки заливки */}
          <Popover
            getPopupContainer={(trigger) => trigger.parentElement}
            content={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '12px', marginBottom: '4px' }}>Fill Opacity</div>
                <Slider
                  min={0}
                  max={1}
                  step={0.05}
                  value={parseFloat(fillOpacity)}
                  onChange={(val) =>
                    data.functions?.onStyleChange?.(id, { fillOpacity: val.toString() })
                  }
                />
                <div style={{ fontSize: '12px', marginBottom: '4px' }}>Fill Color</div>
                <CirclePicker
                  color={fillColor}
                  onChangeComplete={(newColor) =>
                    data.functions?.onStyleChange?.(id, { fillColor: newColor.hex })
                  }
                />
              </div>
            }
            title="Fill Settings"
            trigger="click"
          >
            <Button icon={<BgColorsOutlined />} />
          </Popover>

          {/* Выравнивание текста по горизонтали */}
          <Select
            value={textAlign}
            onChange={(val) => data.functions?.onStyleChange?.(id, { textAlign: val })}
            style={{ width: 120 }}
            options={[
              { value: TextAlignType.LEFT, label: 'Left' },
              { value: TextAlignType.CENTER, label: 'Center' },
              { value: TextAlignType.RIGHT, label: 'Right' },
            ]}
          />
        </NodeToolbar>
      </div>
    </BaseNode>
  );
};

export default TextNode;
