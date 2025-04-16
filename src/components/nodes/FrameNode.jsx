// FrameNode.js
import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { NodeToolbar } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { Select, InputNumber, Popover, Button, Slider } from 'antd';
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

export const FrameNode = memo(({ id, data, selected, positionAbsoluteX, positionAbsoluteY }) => {
    // Используем useRef для хранения ссылок на функции из data
    const functionsRef = useRef(data.functions);
    
    // Обновляем ссылку на функции при изменении data
    useMemo(() => {
        functionsRef.current = data.functions;
    }, [data.functions]);

    // Управление видимостью Popover'ов
    const [colorPickerVisible, setColorPickerVisible] = useState(false);
    const [formatPickerVisible, setFormatPickerVisible] = useState(false);

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

    // Геометрические параметры с мемоизацией
    const { width, height } = useMemo(() => ({
        width: data.geometry?.width || 300,
        height: data.geometry?.height || 200,
    }), [data.geometry]);

    // Мемоизированные стили для контейнера
    const containerStyle = useMemo(() => ({
        width: '100%',
        height: '100%',
        backgroundColor: backgroundRgba,
        border: selected ? '2px solid #3B82F6' : '2px solid rgba(0,0,0,0.2)',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '20px',
        overflow: 'visible', // Меняем на visible для отображения дочерних элементов
        position: 'relative',
        // Добавляем Z-индекс, чтобы убедиться, что фрейм находится ниже содержимого
        zIndex: 0
    }), [backgroundRgba, selected]);

    // Мемоизированные стили для заголовка
    const titleStyle = useMemo(() => ({
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
        zIndex: 1 // Обеспечиваем, чтобы заголовок был поверх фона
    }), []);

    // Мемоизированные стили для индикатора контента
    const contentIndicatorStyle = useMemo(() => ({
        position: 'absolute',
        top: '4px',
        right: '12px',
        fontSize: '12px',
        color: showContent ? 'rgba(0,150,0,0.7)' : 'rgba(150,0,0,0.7)',
        background: 'rgba(255,255,255,0.7)',
        padding: '2px 6px',
        borderRadius: '4px',
        userSelect: 'none',
        zIndex: 1 // Обеспечиваем, чтобы индикатор был поверх фона
    }), [showContent]);

    // Мемоизированные стили для метки формата
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
        zIndex: 1 // Обеспечиваем, чтобы метка формата была поверх фона
    }), []);

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

    // Эффект для очистки ресурсов при размонтировании компонента
    useEffect(() => {
        let isMounted = true;
        
        return () => {
            isMounted = false;
            // Здесь можно добавить очистку для любых throttled/debounced функций
        };
    }, []);

    // Обработчик для консольного логирования вложенных элементов
    useEffect(() => {
        // console.log(`Фрейм ${id} отрендерен, может содержать вложенные узлы`);
    }, [id]);

    return (
        <BaseNode id={id} data={{...data, type: 'group'}} selected={selected} positionAbsoluteX={positionAbsoluteX} positionAbsoluteY={positionAbsoluteY}>
            <div 
                style={containerStyle}
                className="frame-node-container"
                data-node-type="frame"
                data-frame-id={id}
            >
                <div style={titleStyle}>{data.label || 'Фрейм'}</div>
                <div style={contentIndicatorStyle}>
                    {showContent ? 'Видим' : 'Скрыт'}
                </div>
                <div style={formatIndicatorStyle}>
                    {formatOptions.find(f => f.value === format)?.label || 'Произвольный'}
                </div>
            </div>

            <NodeToolbar
                onDoubleClick={(e) => e.stopPropagation()}
                isVisible={selected}
                position="top"
                className="bg-white rounded shadow-sm"
                style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', gap: '12px' }}
            >
                {/* Кнопка переключения видимости контента */}
                <Button 
                    type={showContent ? "primary" : "default"}
                    onClick={toggleShowContent}
                >
                    {showContent ? 'Скрыть контент' : 'Показать контент'}
                </Button>

                {/* Кнопка выбора формата */}
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

                {/* Выбор цвета заливки */}
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
            </NodeToolbar>
        </BaseNode>
    );
});

export default FrameNode;
