// CardNode.js
import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeToolbar } from 'reactflow';
import { editingInputStyle } from '../../utils/nodeUtils';

export const CardNode = ({ id, data, selected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(data.label || '');

    const computedWidth = data.geometry?.width || 250;
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
        background: 'linear-gradient(180deg, #ffffff, #f8f8f8)',
        border: selected ? '1px solid #3B82F6' : '2px solid #e5e5e5',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        transition: 'border 0.2s ease, box-shadow 0.2s ease',
        fontFamily: data.style?.fontFamily || 'Helvetica, sans-serif',
        fontSize: data.style?.fontSize ? `${data.style.fontSize}px` : '16px',
        color: data.style?.color || '#333',
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
                <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{data.label}</div>
                    <div style={{ fontSize: '12px', marginBottom: '4px' }}>{data.description}</div>
                    <div style={{ fontSize: '12px', color: '#555' }}>
                        {data.dueDate ? new Date(data.dueDate).toLocaleDateString() : ''}
                    </div>
                </div>
            )}
            <Handle type="target" position={Position.Left} style={{ background: '#555', width: '7px', height: '7px' }} />
            <Handle type="source" position={Position.Right} style={{ background: '#555', width: '7px', height: '7px' }} />
            <NodeToolbar>
                <div
                    style={{
                        padding: '4px',
                        background: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                    }}
                >
                    <button onClick={startEditing}>Переименовать</button>
                    <button onClick={() => data.functions.removeNode(id)}>Удалить</button>
                </div>
            </NodeToolbar>
        </div>
    );
};
