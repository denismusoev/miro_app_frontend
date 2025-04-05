// components/DraggableItem.jsx
import React from 'react';
import { useDrag } from 'react-dnd';

const DraggableItem = ({ type, label }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'ELEMENT',
        item: { type },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    const style = {
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        padding: '5px 10px',
        margin: '5px',
        background: '#e0e0e0',
        borderRadius: 4,
    };

    return (
        <div ref={drag} style={style}>
            {label}
        </div>
    );
};

export default DraggableItem;
