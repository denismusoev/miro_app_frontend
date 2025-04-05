// FloatingEdge.jsx
import {getBezierPath, getSmoothStepPath, getSimpleBezierPath, useStore} from 'reactflow';
import { getEdgeParams } from '../utils/edgeUtils';

function FloatingEdge({ id, source, target, markerEnd, style }) {
    // Достаём полную информацию об узлах через хук useInternalNode
    const nodeInternals = useStore((state) => state.nodeInternals);
    const sourceNode = nodeInternals.get(source);
    const targetNode = nodeInternals.get(target);

    // Если вдруг узел не найден (при ререндере, например), не рисуем ребро
    if (!sourceNode || !targetNode) {
        return null;
    }

    // С помощью getEdgeParams получаем координаты и стороны
    const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode);

    // Формируем путь кривой Безье с помощью встроенной функции getBezierPath
    const [edgePath] = getBezierPath({
        sourceX: sx,
        sourceY: sy,
        sourcePosition: sourcePos,
        targetPosition: targetPos,
        targetX: tx,
        targetY: ty,
    });

    return (
        <path
            id={id}
            className="react-flow__edge-path"
            d={edgePath}
            markerEnd={markerEnd}
            style={style}
        />
    );
}

export default FloatingEdge;
