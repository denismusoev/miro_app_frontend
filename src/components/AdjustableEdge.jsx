// AdjustableEdge.jsx
import React, { useState } from 'react';

const AdjustableEdge = ({
                            id,
                            sourceX,
                            sourceY,
                            targetX,
                            targetY,
                            markerEnd,
                            style,
                        }) => {
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;

    // Изначально управляющая точка немного смещена от центра ребра
    const [controlPoint, setControlPoint] = useState({
        x: midX,
        y: midY - 50,
    });

    // Формируем путь кривой Безье с одинаковыми управляющими точками
    const path = `M ${sourceX},${sourceY} C ${controlPoint.x},${controlPoint.y} ${controlPoint.x},${controlPoint.y} ${targetX},${targetY}`;

    const onPointerDown = (event) => {
        // Предотвращаем всплытие и захватываем pointer-события
        event.preventDefault();
        event.stopPropagation();
        event.target.setPointerCapture(event.pointerId);

        const startX = event.clientX;
        const startY = event.clientY;
        const initialCP = { ...controlPoint };

        const onPointerMove = (e) => {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            setControlPoint({
                x: initialCP.x + dx,
                y: initialCP.y + dy,
            });
        };

        const onPointerUp = (e) => {
            e.target.releasePointerCapture(event.pointerId);
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);
        };

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
    };

    return (
        <>
            <path
                id={id}
                style={style}
                className="react-flow__edge-path"
                d={path}
                markerEnd={markerEnd}
            />
            <circle
                cx={controlPoint.x}
                cy={controlPoint.y}
                r={8}
                fill="red"
                stroke="black"
                strokeWidth={1.5}
                onPointerDown={onPointerDown}
                style={{ cursor: 'pointer', pointerEvents: 'all', zIndex: 1000 }}
            />
        </>
    );
};

export default AdjustableEdge;
