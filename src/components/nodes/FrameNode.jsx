// FrameNode.js
import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { editingInputStyle } from '../../utils/nodeUtils';

export const FrameNode = ({ id, data, selected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(data.label || '');

    const computedWidth = data.geometry?.width || 300;
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
        background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(245,245,245,0.98))',
        border: selected ? '2px solid #3B82F6' : '2px solid #ddd',
        borderRadius: '16px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        padding: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        transition: 'border 0.2s ease, box-shadow 0.2s ease',
        ...data.style,
    };

    const labelStyle = {
        position: 'absolute',
        top: '8px',
        left: '8px',
        backgroundColor: 'rgba(255,255,255,0.8)',
        padding: '2px 6px',
        fontSize: '10px',
        color: '#555',
        borderRadius: '4px',
    };

    return (
        <div onDoubleClick={handleDoubleClick} style={containerStyle}>
            <div style={labelStyle}>Frame</div>
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
            <Handle type="target" position={Position.Left} style={{ background: '#555', width: 7, height: 7 }} />
            <Handle type="source" position={Position.Right} style={{ background: '#555', width: 7, height: 7 }} />
        </div>
    );
};
