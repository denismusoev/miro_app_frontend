// FrameNode.js
import React, { useState, useRef, useCallback, useMemo, memo } from 'react';
import { NodeToolbar, useReactFlow } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { Popover, Button } from 'antd';
import { CirclePicker } from 'react-color';
import { BgColorsOutlined, FormOutlined } from '@ant-design/icons';
import { hexToRgba } from '../../utils/nodeUtils';
import { FrameFormatType } from '../../model/Enums';

// Определяем опции формата фрейма
const formatOptions = [
    { value: FrameFormatType.CUSTOM, label: 'Произвольный' },
    { value: FrameFormatType.DESKTOP, label: 'Десктоп' },
    { value: FrameFormatType.PHONE, label: 'Телефон' },
    { value: FrameFormatType.TABLET, label: 'Планшет' },
    { value: FrameFormatType.A4, label: 'A4' },
    { value: FrameFormatType.LETTER, label: 'Письмо' },
    { value: FrameFormatType.RATIO_1X1, label: '1:1' },
    { value: FrameFormatType.RATIO_4X3, label: '4:3' },
    { value: FrameFormatType.RATIO_16X9, label: '16:9' },
];

// Компонент GroupNode для отображения рамки с дочерними узлами
const GroupNode = memo(({ selected, label, style, format, childNodesCount, toolbarContent }) => {
    // Мемоизированные стили для группового узла
    const groupStyle = useMemo(() => ({
        backgroundColor: style.backgroundColor,
        border: selected ? '2px solid #3B82F6' : '2px solid rgba(0,0,0,0.2)',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        width: '100%',
        height: '100%',
        padding: '20px',
        position: 'relative',
    }), [selected, style.backgroundColor]);

    // Мемоизированные стили для заголовка
    const labelStyle = useMemo(() => ({
        position: 'absolute',
        top: '4px',
        left: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        color: 'rgba(0,0,0,0.7)',
        background: 'rgba(255,255,255,0.7)',
        padding: '2px 6px',
        borderRadius: '4px',
        userSelect: 'none',
        zIndex: 1
    }), []);

    // Стили для бейджа с количеством дочерних узлов
    const childCountBadgeStyle = useMemo(() => ({
        position: 'absolute',
        bottom: '4px',
        left: '12px',
        fontSize: '10px',
        color: 'rgba(0,0,0,0.5)',
        background: 'rgba(255,255,255,0.5)',
        padding: '2px 4px',
        borderRadius: '3px',
        userSelect: 'none',
        zIndex: 1
    }), []);

    // Мемоизированные стили для индикатора типа фрейма
    const formatIndicatorStyle = useMemo(() => ({
        position: 'absolute',
        bottom: '4px',
        right: '12px',
        fontSize: '10px',
        color: 'rgba(0,0,0,0.5)',
        background: 'rgba(255,255,255,0.5)',
        padding: '2px 4px',
        borderRadius: '3px',
        userSelect: 'none',
        zIndex: 1
    }), []);

    return (
        <>
            {selected && (
                <NodeToolbar
                    position="top"
                    className="bg-white rounded shadow-sm"
                    style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', gap: '12px' }}
                >
                    {toolbarContent}
                </NodeToolbar>
            )}
            <div 
                style={groupStyle}
                className="frame-node-container"
                data-node-type="frame"
            >
                {/* Метка фрейма */}
                <div style={labelStyle}>{label + "AHTWV" || 'Фрейм'}</div>
                
                {/* Индикатор формата */}
                <div style={formatIndicatorStyle}>
                    {formatOptions.find(f => f.value === format)?.label || 'Произвольный'}
                </div>
                
                {/* Бейдж с количеством дочерних узлов */}
                {childNodesCount > 0 && (
                    <div style={childCountBadgeStyle}>
                        {`Узлов: ${childNodesCount}`}
                    </div>
                )}
            </div>
        </>
    );
});

export const FrameNode = memo(({ id, data, selected, positionAbsoluteX, positionAbsoluteY }) => {
    // Используем useRef для хранения ссылок на функции из data
    const functionsRef = useRef(data.functions);
    
    // Управление видимостью Popover'ов
    const [colorPickerVisible, setColorPickerVisible] = useState(false);
    const [formatPickerVisible, setFormatPickerVisible] = useState(false);

    // Хук для доступа к глобальному инстансу ReactFlow
    const { getNodes } = useReactFlow();
    
    // Получаем количество дочерних узлов для данного фрейма
    const childNodesCount = useMemo(() => {
        return getNodes().filter(node => node.parentId === id).length;
    }, [getNodes, id]);

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
        fillColor,
        showContent,
        format
    } = useMemo(() => ({
        fillColor: data.style?.fillColor || '#ffffff',
        showContent: data.showContent !== undefined ? data.showContent : true,
        format: data.format || FrameFormatType.CUSTOM,
    }), [data.style, data.showContent, data.format]);

    // Расчёт цветов
    const backgroundRgba = useMemo(() => 
        hexToRgba(fillColor, 0.4), // Делаем фрейм полупрозрачным
        [fillColor]
    );

    // Обработчики событий
    const handleFillColorChange = useCallback((color) => {
        handleStyleChange({ fillColor: color.hex });
        setColorPickerVisible(false);
    }, [handleStyleChange]);

    const handleFormatChange = useCallback((value) => {
        handleDataChange({ format: value });
        setFormatPickerVisible(false);
    }, [handleDataChange]);

    const toggleShowContent = useCallback(() => {
        handleDataChange({ showContent: !showContent });
    }, [handleDataChange, showContent]);

    // Создаем мемоизированное содержимое тулбара
    const frameToolbarContent = useMemo(() => (
        <>
            <Button 
                type={showContent ? "primary" : "default"}
                onClick={toggleShowContent}
            >
                {showContent ? 'Скрыть контент' : 'Показать контент'}
            </Button>

            <Popover
                getPopupContainer={(trigger) => trigger.parentElement}
                content={
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                        {formatOptions.map((opt) => (
                            <Button
                                key={opt.value}
                                type={opt.value === format ? 'primary' : 'default'}
                                onClick={() => handleFormatChange(opt.value)}
                            >
                                {opt.label}
                            </Button>
                        ))}
                    </div>
                }
                title="Выберите формат"
                trigger="click"
                open={formatPickerVisible}
                onOpenChange={setFormatPickerVisible}
            >
                <Button icon={<FormOutlined />}>
                    Формат
                </Button>
            </Popover>

            <Popover
                getPopupContainer={(trigger) => trigger.parentElement}
                content={
                    <CirclePicker
                        color={fillColor}
                        onChangeComplete={handleFillColorChange}
                    />
                }
                title="Цвет фона"
                trigger="click"
                open={colorPickerVisible}
                onOpenChange={setColorPickerVisible}
            >
                <Button icon={<BgColorsOutlined />} />
            </Popover>
        </>
    ), [
        showContent, toggleShowContent, 
        formatOptions, format, handleFormatChange, formatPickerVisible, setFormatPickerVisible,
        fillColor, handleFillColorChange, colorPickerVisible, setColorPickerVisible
    ]);

    return (
        <BaseNode 
            id={id} 
            data={{...data, type: 'group'}} 
            selected={selected} 
            positionAbsoluteX={positionAbsoluteX} 
            positionAbsoluteY={positionAbsoluteY}
        >
            <GroupNode 
                selected={selected} 
                label={data.label} 
                style={{ backgroundColor: backgroundRgba }}
                format={format}
                childNodesCount={childNodesCount}
                toolbarContent={frameToolbarContent}
            />
        </BaseNode>
    );
});
