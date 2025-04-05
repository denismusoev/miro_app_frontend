// src/utils/nodeHelpers.js

/**
 * Функция для прикрепления обработчиков к узлу.
 * Добавляет в node.data.functions набор функций, которые используются для обновления,
 * удаления и управления состоянием узла.
 *
 * @param {object} node - исходный узел
 * @param {object} handlers - объект с обработчиками: { updateNodeLabel, updateNodeOnServer, removeNode, disableDragging, enableDragging }
 * @returns {object} новый узел с прикреплёнными функциями
 */
export function attachNodeHandlers(node, { updateNodeLabel, updateNodeOnServer, removeNode, disableDragging, enableDragging, updateNodeStyle }) {
    return {
        ...node,
        data: {
            ...node.data,
            functions: {
                ...(node.data.functions || {}),
                onLabelChange: updateNodeLabel,
                updateNode: updateNodeOnServer,
                removeNode,
                disableDragging: () => disableDragging(node.id),
                enableDragging: () => enableDragging(node.id),
                onStyleChange: updateNodeStyle
            },
        },
    };
}
