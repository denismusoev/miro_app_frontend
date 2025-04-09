import React, { useState } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';

export const BaseNode = ({ id, data, selected, children }) => {
    // Редактирование лейбла (общая логика для всех)
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(data.label || '');

    // Начать/завершить редактирование
    const startEditing = () => {
        setIsEditing(true);
        data.functions?.disableDragging?.();
    };
    const finishEditing = () => {
        data.functions?.onLabelChange?.(id, value);
        setIsEditing(false);
        data.functions?.enableDragging?.();
    };

    const handleDoubleClick = () => startEditing();
    const handleBlur = () => finishEditing();
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            finishEditing();
        }
    };

    // Обработчик изменения размеров
    const onResize = (e, newSize) => {
        // console.log("ОБРАБОТЧИК ИЗМЕНЕНИЯ РАЗМЕРА")
        // console.log("НОВЫЙ РАЗМЕР", newSize.width, newSize.height);
        // console.log("СПИСОК ФУНКЦИЙ",  data.functions);
        // console.log("ФУНКЦИЯ onGeometryChange", data.functions?.onGeometryChange);
        data.functions?.onGeometryChange?.(id, {
            width: newSize.width,
            height: newSize.height,
        });
    };

    // Прописываем стили, общие для всех нод (при желании можно варьировать)
    const containerStyle = {
        width: data.geometry?.width || 120,
        height: data.geometry?.height || 80,
    };

    return (
        <div style={containerStyle} onDoubleClick={handleDoubleClick}>
            {/* Блок, отвечающий за возможность ресайза (общий для любых нод) */}
            <div
                style={{
                    position: 'absolute',
                    top: -5,
                    left: -5,
                    right: -5,
                    bottom: -5,
                }}
            >
                <NodeResizer
                    lineStyle={{ borderWidth: '1px' }}
                    color="rgba(59,130,246)"
                    isVisible={selected}
                    onResize={onResize}
                />
            </div>

            {/* Если не редактируем, то отрисовываем children,
          иначе – поле ввода */}
            {isEditing ? (
                <input
                    type="text"
                    value={value}
                    autoFocus
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    style={{
                        width: '100%',
                        height: '100%',
                        outline: 'none',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'text',
                    }}
                />
            ) : (
                children
            )}

            {/* Хендлы (общие, если у всех нод одинаковые входы-выходы) */}
            <Handle
                type="target"
                position={Position.Left}
                style={{
                    background: selected ? '#3b82f6' : 'transparent',
                    width: selected ? 10 : 7,
                    height: selected ? 10 : 7,
                    border: selected ? '2px solid #fff' : 'none',
                    boxShadow: selected ? '0 2px 4px rgba(0, 0, 0, 0.15)' : 'none',
                    opacity: selected ? 1 : 0,
                    pointerEvents: selected ? 'auto' : 'none',
                }}
            />
            <Handle
                type="source"
                position={Position.Right}
                style={{
                    background: selected ? '#3b82f6' : 'transparent',
                    width: selected ? 10 : 7,
                    height: selected ? 10 : 7,
                    border: selected ? '2px solid #fff' : 'none',
                    boxShadow: selected ? '0 2px 4px rgba(0, 0, 0, 0.15)' : 'none',
                    opacity: selected ? 1 : 0,
                    pointerEvents: selected ? 'auto' : 'none',
                }}
            />
        </div>
    );
};
