// FloatingConnectionLine.jsx
import React from 'react';
import {getBezierPath, getSmoothStepPath} from '@xyflow/react';
import { getEdgeParams } from '../utils/edgeUtils';

function FloatingConnectionLine({
                                    toX,
                                    toY,
                                    fromPosition,
                                    toPosition,
                                    fromNode,
                                }) {
    if (!fromNode) {
        return null;
    }

    // Создаём "фейковый" целевой узел, который будет находиться под курсором
    const targetNode = {
        id: 'connection-target',
        measured: {
            width: 2,
            height: 2,
        },
        internals: {
            positionAbsolute: { x: toX, y: toY },
        },
    };

    // Берём координаты и позиции
    const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(fromNode, targetNode);

    // Строим путь кривой Безье
    const [edgePath] = getBezierPath({
        sourceX: sx,
        sourceY: sy,
        sourcePosition: sourcePos || fromPosition,
        targetPosition: targetPos || toPosition,
        targetX: tx || toX,
        targetY: ty || toY,
    });

    return (
        <g>
            <path
                fill="none"
                stroke="#222"
                strokeWidth={1.5}
                className="animated"
                d={edgePath}
            />
            <circle
                cx={tx || toX}
                cy={ty || toY}
                fill="#fff"
                r={3}
                stroke="#222"
                strokeWidth={1.5}
            />
        </g>
    );
}

export default FloatingConnectionLine;
