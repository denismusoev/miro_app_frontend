// StickyNoteNode.js
import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { editingInputStyle } from '../../utils/nodeUtils';

export const StickyNoteNode = ({ id, data, selected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(data.label || '');

    const computedWidth = data.geometry?.width || 200;
    const computedHeight = data.geometry?.height || 200;

    useEffect(() => {
        if (selected) {
            data.functions?.enableDragging && data.functions.enableDragging();
        } else {
            data.functions?.disableDragging && data.functions.disableDragging();
        }
    }, [selected, data.functions]);

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
        backgroundColor: data.style?.fillColor || '#FFEB3B',
        border: selected ? '2px solid #3B82F6' : '2px solid #FFC107',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '12px',
        position: 'relative',
        fontFamily: data.style?.fontFamily || '"Comic Sans MS", cursive, sans-serif',
        fontSize: data.style?.fontSize ? `${data.style.fontSize}px` : '16px',
        transition: 'box-shadow 0.2s ease, border 0.2s ease',
        ...data.style,
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
                value
            )}
            <Handle type="target" position={Position.Left} style={{ background: '#555', width: '7px', height: '7px' }} />
            <Handle type="source" position={Position.Right} style={{ background: '#555', width: '7px', height: '7px' }} />
        </div>
    );
};
