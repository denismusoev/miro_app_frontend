// edgeUtils.js
import { Position } from 'reactflow';

// Функция для получения значений по умолчанию, если измеренные размеры отсутствуют
// function getDefaultMeasured(node) {
//     switch (node.type) {
//         case 'text':
//             return { width: 150, height: 80 };
//         case 'frame':
//             return { width: 300, height: 200 };
//         case 'image':
//             return { width: 200, height: 150 };
//         case 'shape':
//             return { width: 120, height: 80 };
//         case 'card':
//             return { width: 250, height: 150 };
//         case 'app_card':
//             return { width: 250, height: 150 };
//         case 'sticky_note':
//             return { width: 200, height: 200 };
//         default:
//             // На случай неизвестного типа
//             return { width: 100, height: 100 };
//     }
// }

function getDefaultMeasured(node) {
    return { width: node.width, height: node.height };
}

// Эта функция возвращает точку пересечения линии между центром intersectionNode и targetNode
export function getNodeIntersection(intersectionNode, targetNode) {
    const measured = intersectionNode.measured || getDefaultMeasured(intersectionNode);
    const { width: intersectionNodeWidth, height: intersectionNodeHeight } = measured;

    // Если internals отсутствует, используем node.position
    const intersectionNodePosition = intersectionNode.internals?.positionAbsolute || intersectionNode.position;
    const targetPosition = targetNode.internals?.positionAbsolute || targetNode.position;

    const w = intersectionNodeWidth / 2;
    const h = intersectionNodeHeight / 2;

    const x2 = intersectionNodePosition.x + w;
    const y2 = intersectionNodePosition.y + h;

    const targetMeasured = targetNode.measured || getDefaultMeasured(targetNode);
    const x1 = targetPosition.x + targetMeasured.width / 2;
    const y1 = targetPosition.y + targetMeasured.height / 2;

    const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
    const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
    const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
    const xx3 = a * xx1;
    const yy3 = a * yy1;
    const x = w * (xx3 + yy3) + x2;
    const y = h * (-xx3 + yy3) + y2;

    return { x, y };
}

// Функция возвращает позицию (Top, Right, Bottom, Left) для заданного узла относительно точки пересечения
export function getEdgePosition(node, intersectionPoint) {
    const position = node.internals?.positionAbsolute || node.position;
    const measured = node.measured || getDefaultMeasured(node);
    const nx = Math.round(position.x);
    const ny = Math.round(position.y);
    const px = Math.round(intersectionPoint.x);
    const py = Math.round(intersectionPoint.y);

    if (px <= nx + 1) {
        return Position.Left;
    }
    if (px >= nx + measured.width - 1) {
        return Position.Right;
    }
    if (py <= ny + 1) {
        return Position.Top;
    }
    if (py >= ny + measured.height - 1) {
        return Position.Bottom;
    }

    return Position.Top;
}

// Функция возвращает параметры (sx, sy, tx, ty, sourcePos, targetPos) для создания ребра
export function getEdgeParams(source, target) {
    const sourceIntersectionPoint = getNodeIntersection(source, target);
    const targetIntersectionPoint = getNodeIntersection(target, source);

    const sourcePos = getEdgePosition(source, sourceIntersectionPoint);
    const targetPos = getEdgePosition(target, targetIntersectionPoint);

    return {
        sx: sourceIntersectionPoint.x,
        sy: sourceIntersectionPoint.y,
        tx: targetIntersectionPoint.x,
        ty: targetIntersectionPoint.y,
        sourcePos,
        targetPos,
    };
}
