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
} from '../../model/Enums';
import {AlignCenterOutlined, BgColorsOutlined, FontColorsOutlined} from "@ant-design/icons";
import {TfiLayoutLineSolid, TfiLineDashed, TfiLineDotted} from "react-icons/tfi";
import {TbLineDashed, TbLineDotted} from "react-icons/tb";
import {FaRegCircle} from "react-icons/fa";

export const ShapeNode = (props) => {
    const { id, data, selected } = props;

    // Управление видимостью Popover'ов
    const [textColorVisible, setTextColorVisible] = useState(false);
    const [fillSettingsVisible, setFillSettingsVisible] = useState(false);
    const [alignmentVisible, setAlignmentVisible] = useState(false);
    const [borderSettingsVisible, setBorderSettingsVisible] = useState(false);

    // Извлекаем стили с дефолтными значениями
    const {
        fontFamily = FontFamilyType.ARIAL,
        fontSize = 14,
        color = "#000000", // текст
        fillColor = ColorType.WHITE,
        fillOpacity = 1.0, // например, "1" или "0.5"
        textAlign = TextAlignType.CENTER,
        textAlignVertical = TextAlignVerticalType.TOP,
        borderColor = "#000000",
        borderOpacity = 1.0,
        borderStyle = BorderStyleType.NONE,
        borderWidth = 1,
    } = data.style || {};

    // Функция обновления стилей
    const handleStyleChange = (stylePart) => {
        //console.log("[handleStyleChange] stylePart:", stylePart);
        if (data.functions?.onStyleChange) {
            const updatedStyle = { ...data.style, ...stylePart };
            //console.log("[handleStyleChange] updatedStyle:", updatedStyle);
            data.functions.onStyleChange(id, updatedStyle);
        }
    };

    // Опции для селекта шрифтов
    const fontOptions = Object.values(FontFamilyType).map((font) => ({ value: font, label: font }));

    // Опции для слайдеров (значения opacity можно задать от 0 до 1)
    // Можно задать шаг, например 0.05.
    // Для sldier обёртка Ant Design ожидает числовое значение.

    // Расчёт стилей ноды
    const backgroundRgba = hexToRgba(fillColor, parseFloat(fillOpacity));
    const borderColorRgba = hexToRgba(borderColor, parseFloat(borderOpacity));
    // Если выбран normal, предполагаем, что граница отсутствует (width = 0)
    const effectiveBorderWidth = borderStyle === BorderStyleType.NONE ? 0 : borderWidth;
    const borderStyleString = `${effectiveBorderWidth}px ${borderStyle} ${borderColorRgba}`;
    const alignItems = getFlexAlignByVerticalTextAlign(textAlignVertical);

    const innerStyle = {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        justifyContent: textAlign,
        alignItems,
        fontFamily,
        fontSize: `${fontSize}px`,
        color,
        backgroundColor: backgroundRgba,
        // border: borderStyleString,
        outline: borderStyleString, // например, "2px dotted #000000"
        outlineOffset: '0px',
        borderRadius: '8px',
        padding: '4px',
        // boxSizing: 'border-box',
        overflow: 'hidden',
    };

    return (
        <BaseNode id={id} data={data} selected={selected}>
            <div style={innerStyle}>
                <NodeToolbar
                    onDoubleClick={(e) => e.stopPropagation()}
                    isVisible={selected}
                    position="top"
                    className="bg-white rounded shadow-sm"
                    style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', gap: '12px' }}
                >
                    {/* 1. Выбор шрифта */}
                    <Select
                        value={fontFamily}
                        onChange={(val) => handleStyleChange({ fontFamily: val })}
                        variant={"filled"}
                        style={{ width: 120, minWidth: 80 }}
                        options={fontOptions}
                    />

                    {/* 2. Выбор размера шрифта */}
                    <InputNumber
                        value={fontSize}
                        onChange={(val) => handleStyleChange({ fontSize: val })}
                        min={1}
                        variant={"filled"}
                        style={{ width: 60, textAlign: 'center' }}
                    />

                    {/* 3. Popover для цвета текста */}
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

                    {/* 4. Popover для заливки: выбор fillOpacity и fillColor */}
                    <Popover
                        getPopupContainer={(trigger) => trigger.parentElement}
                        content={
                            <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {/* Fill Opacity через Slider */}
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
                                {/* Fill Color через CirclePicker */}
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

                    {/* 5. Popover для выравнивания */}
                    <Popover
                        getPopupContainer={(trigger) => trigger.parentElement}
                        content={
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {/* Горизонтальное выравнивание */}
                                <div style={{ display: 'flex', justifyContent: 'space-around'}}>
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
                                {/* Вертикальное выравнивание */}
                                <div style={{ display: 'flex', justifyContent: 'space-around'}}>
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
                        <button type="text"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                                title="Alignment">
                            <AlignCenterOutlined style={{ fontSize: '20px' }} />
                        </button>
                    </Popover>

                    {/* 6. Popover для настроек обводки */}
                    <Popover
                        getPopupContainer={(trigger) => trigger.parentElement}
                        content={
                            <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {/* Border Opacity через Slider */}
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
                                {/* Border Style через кнопки */}
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
                                {/* Border Width через Slider */}
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
                                {/* Border Color через CirclePicker */}
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

                <span style={{ width: '100%', textAlign }}>{data.label || ''}</span>
            </div>
        </BaseNode>
    );
};
