// TextNode.js
import React, { useState } from 'react';
import { Handle } from '@xyflow/react';
import { convertFontName, editingInputStyle } from '../../utils/nodeUtils';

export const TextNode = ({ id, data, selected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(data.label || '');

    const computedWidth = data.geometry?.width || 150;
    const computedHeight = data.geometry?.height || 50;
    const fontFamilyCSS = convertFontName(data.style?.fontFamily);

    const startEditing = () => {
        setIsEditing(true);
        data.functions?.disableDragging && data.functions.disableDragging();
    };

    const finishEditing = () => {
        data.functions?.onLabelChange && data.functions.onLabelChange(id, value);
        setIsEditing(false);
        data.functions?.enableDragging && data.functions.enableDragging();
    };

    const handleDoubleClick = () => startEditing();
    const handleBlur = () => finishEditing();
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') finishEditing();
    };

    const containerStyle = {
        width: `${computedWidth}px`,
        height: `${computedHeight}px`,
        background: 'transparent',
        fontFamily: fontFamilyCSS,
        fontSize: data.style?.fontSize ? `${data.style.fontSize}px` : '18px',
        textAlign: data.style?.textAlign || 'left',
        color: data.style?.color || '#333',
        padding: '8px',
        borderRadius: '12px',
        boxShadow: selected
            ? '0 4px 12px rgba(59,130,246,0.3)'
            : '0 2px 6px rgba(0,0,0,0.1)',
        transition: 'box-shadow 0.2s ease, border 0.2s ease',
        border: selected ? '2px solid #3B82F6' : '2px solid transparent',
    };

    return (
        <div onDoubleClick={handleDoubleClick} style={containerStyle}>
            {isEditing ? (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    style={editingInputStyle}
                />
            ) : (
                <div>{value}</div>
            )}
            <Handle type="target" position="left" style={{ background: '#555', width: 7, height: 7 }} />
            <Handle type="source" position="right" style={{ background: '#555', width: 7, height: 7 }} />
        </div>
    );
};
