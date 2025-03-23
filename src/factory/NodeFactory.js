// src/utils/NodeFactory.js
import { Position, Geometry } from '../model/ItemDto';
import { itemToNode, nodeToItem } from '../utils/itemMapper';
import { getDefaultItem } from '../hooks/useBoardState'; // или вынести в utils

const API_ENDPOINTS = {
    create: "/app/items/create",
    update: "/app/items/update",
    delete: "/app/items/delete",
};

export const NodeFactory = {
    createNode: (stompClient, item) => {
        const { type, boardId, parentId, positionOverride, updateHandlers } = item;
        const { data: defaultData, style: defaultStyle, width: defaultWidth, height: defaultHeight } = getDefaultItem(type);
        const position = positionOverride || {
            x: Math.random() * 400,
            y: Math.random() * 400,
        };

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

        if (stompClient) {
            stompClient.send(API_ENDPOINTS.create, {}, JSON.stringify(payload));
        } else {
            console.error("stompClient не доступен");
        }
    },
    updateNode: (stompClient, node) => {
        const payload = nodeToItem(node);
        if (stompClient) {
            stompClient.send(API_ENDPOINTS.update, {}, JSON.stringify(payload));
        } else {
            console.error("stompClient не доступен");
        }
    },
    deleteNode: (stompClient, nodeId) => {
        if (stompClient) {
            stompClient.send(API_ENDPOINTS.delete, {}, JSON.stringify({ nodeId }));
        } else {
            console.error("stompClient не доступен");
        }
    },
};

export default NodeFactory;



