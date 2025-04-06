// ImageNode.js
import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { editingInputStyle, hexToRgba } from '../../utils/nodeUtils';

export const ImageNode = ({ id, data, selected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(data.label || '');

    const computedWidth = data.geometry?.width || 200;
    const computedHeight = data.geometry?.height || 150;

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
        background: '#f9f9f9',
        border: selected ? '2px solid #3B82F6' : '2px solid #e0e0e0',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border 0.2s ease, box-shadow 0.2s ease',
        ...data.style,
    };

    const imageStyle = {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    };

    const captionStyle = {
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        color: '#fff',
        fontSize: '12px',
        textAlign: 'center',
        padding: '4px 0',
        position: 'absolute',
        bottom: 0,
    };

    return (
        <div onDoubleClick={handleDoubleClick} style={containerStyle}>
            {data.imageUrl ? (
                <img src={data.imageUrl} alt={data.altText || 'Image'} style={imageStyle} />
            ) : (
                <div>No Image</div>
            )}
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
                <div style={captionStyle}>{value}</div>
            )}
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: '#555', width: '7px', height: '7px' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                style={{ background: '#555', width: '7px', height: '7px' }}
            />
        </div>
    );
};
