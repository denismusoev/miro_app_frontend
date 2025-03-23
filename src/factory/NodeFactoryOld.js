// NodeFactory.js
import { Position, Geometry } from '../model/ItemDto';
import { ItemCreateRq } from '../model/ItemCreateRq';
import { ItemUpdateRq } from '../model/ItemUpdateRq';
import { itemToNode, nodeToItem } from '../utils/itemMapper';
import { getDefaultItem } from '../hooks/useBoardState'; // либо вынести в utils

const API_BASE_URL = 'http://localhost:8080/api/items';

export const NodeFactory = {
    createNode: async (item) => {
        const {type, boardId, parentId, positionOverride, updateHandlers} = item;
        // Получаем дефолтные данные и стили для данного типа
        const { data: defaultData, style: defaultStyle, width: defaultWidth, height: defaultHeight } = getDefaultItem(type);

        // Если позиция не передана, генерируем случайное значение
        const position = positionOverride || {
            x: Math.random() * 400,
            y: Math.random() * 400,
        };

        // Формируем payload для создания узла
        const payload = {
            boardId: boardId,
            parentId: parentId,
            type: type,
            position: new Position({
                x: position.x + defaultWidth / 2,
                y: position.y + defaultHeight / 2,
            }),
            geometry: new Geometry({ width: defaultWidth, height: defaultHeight, rotation: 0 }),
            data: defaultData,
            style: defaultStyle,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                throw new Error('Ошибка при создании элемента на сервере');
            }
            const createdItem = await response.json();
            // Преобразуем ответ сервера в объект узла для React Flow
            const newNode = itemToNode(createdItem);
            // Добавляем обработчики, например, для обновления метки, перетаскивания и удаления
            newNode.data.functions = {
                onLabelChange: updateHandlers.updateLabel,
                updateNode: updateHandlers.updateNode,
                removeNode: updateHandlers.removeNode,
                ...newNode.data.functions,
            };
            return newNode;
        } catch (error) {
            console.error('Ошибка создания элемента', error);
            throw error;
        }
    },
    updateNode: async (node) => {
        // Преобразуем объект узла в формат, пригодный для отправки на сервер
        const payload = nodeToItem(node);
        try {
            const response = await fetch(`${API_BASE_URL}/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                throw new Error('Ошибка обновления узла на сервере');
            }
            const updatedItem = await response.json();
            console.log('Узел обновлен:', updatedItem);
            return updatedItem;
        } catch (error) {
            console.error('Ошибка обновления узла', error);
            throw error;
        }
    },

    deleteNode: async (nodeId) => {
        try {
            // Предполагается, что на сервере реализован DELETE-эндпоинт для удаления элемента
            const response = await fetch(`${API_BASE_URL}/${nodeId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Ошибка удаления узла на сервере');
            }
            console.log('Узел удален:', nodeId);
            return true;
        } catch (error) {
            console.error('Ошибка при удалении узла', error);
            throw error;
        }
    },
};

export default NodeFactory;