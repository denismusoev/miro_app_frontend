import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';

const BaseNode = ({
                      id,
                      data,
                      isSelected,
                      defaultWidth = 150,
                      defaultHeight = 50,
                      children,
                      onLabelChange,
                      onEnableDragging,
                      onDisableDragging,
                      containerStyle = {}
                  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(data.label || '');

    const startEditing = () => {
        setIsEditing(true);
        onDisableDragging && onDisableDragging();
    };

    const finishEditing = () => {
        onLabelChange && onLabelChange(id, value);
        setIsEditing(false);
        onEnableDragging && onEnableDragging();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') finishEditing();
    };

    return (
        <div
            onDoubleClick={startEditing}
            style={{
                width: defaultWidth,
                height: defaultHeight,
                border: isSelected ? '2px solid blue' : 'none',
                ...containerStyle
            }}
        >
            {isEditing ? (
                <input
                    autoFocus
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={finishEditing}
                    onKeyDown={handleKeyDown}
                    style={{
                        width: '100%',
                        border: 'none',
                        backgroundColor: 'transparent',
                        outline: 'none'
                    }}
                />
            ) : (
                // Если не задан custom content через children, выводим значение по умолчанию
                children || <div>{value}</div>
            )}
            {/* Рендерим базовые точки для соединения */}
            <Handle type="target" position={Position.Left} style={{ background: '#555', width: 7, height: 7 }} />
            <Handle type="source" position={Position.Right} style={{ background: '#555', width: 7, height: 7 }} />
        </div>
    );
};

export default BaseNode;
