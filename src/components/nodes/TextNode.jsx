import React from 'react';
import BaseNode from './BaseNode';

export const TextNode = ({ id, data, xPos, yPos, selected }) => {
    // Можно вычислять специфичные стили и размеры для текстового узла
    const computedWidth = data.geometry?.width || 150;
    const computedHeight = data.geometry?.height || 50;

    const containerStyle = {
        background: data.style?.fillColor || 'transparent',
        fontFamily: data.style?.fontFamily || 'Arial, sans-serif',
        fontSize: data.style?.fontSize ? `${data.style.fontSize}px` : '18px',
        textAlign: data.style?.textAlign || 'left',
        color: data.style?.color || '#000',
        padding: '4px',
        border: `2px solid ${selected ? '#6495fb' : 'transparent'}`
    };

    return (
        <BaseNode
            id={id}
            data={data}
            isSelected={selected}
            defaultWidth={computedWidth}
            defaultHeight={computedHeight}
            onLabelChange={data.functions?.onLabelChange}
            onEnableDragging={data.functions?.enableDragging}
            onDisableDragging={data.functions?.disableDragging}
            containerStyle={containerStyle}
        >
            <div>{data.label}</div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                Координаты: x: {xPos?.toFixed(0)}, y: {yPos?.toFixed(0)}
            </div>
        </BaseNode>
    );
};
