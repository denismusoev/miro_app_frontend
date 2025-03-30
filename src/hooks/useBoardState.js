// src/hooks/useBoardState.js
import { useCallback, useEffect, useState, useRef } from 'react';
import { useNodesState, useEdgesState, addEdge, updateEdge } from 'reactflow';
import { getDefaultItem } from '../utils/boardUtils';
import { itemToNode, nodeToItem } from '../utils/itemMapper';
import { Position, Geometry, ItemRs } from '../model/ItemDto';

/**
 * Хук для работы со состоянием доски.
 * Принимает объект:
 * {
 *   stompClient,  // клиент для отправки сообщений по WS
 *   publish,      // функция публикации с проверкой connected
 *   connected,    // статус соединения
 * }
 */
export const useBoardState = ({ stompClient, publish, connected }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedElements, setSelectedElements] = useState([]);
    const originalNodesRef = useRef({});

    // Функция для безопасной публикации сообщений
    const safePublish = useCallback((destination, body) => {
        if (!connected) {
            console.warn('[useBoardState][safePublish] Невозможно publish, соединение не установлено. Destination:', destination, 'Body:', body);
            return;
        }
        console.log('[useBoardState][safePublish] Отправка на', destination, 'с телом:', body);
        publish(destination, body);
    }, [connected, publish]);

    // Удаление узла из состояния
    const removeNode = useCallback((nodeId) => {
        console.log('[useBoardState][removeNode] Удаление узла с id:', nodeId);
        setNodes((nds) => nds.filter((node) => node.id !== nodeId));
        setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    }, [setNodes, setEdges]);

    // Отправка обновления узла на сервер
    const updateNodeOnServer = useCallback((node) => {
        const payload = nodeToItem(node);
        console.log('[useBoardState][updateNodeOnServer] Отправка обновления узла:', payload);
        safePublish('/app/items/update', payload);
    }, [safePublish]);

    // Обновление метки узла и отправка обновления на сервер
    const updateNodeLabel = useCallback((id, newLabel) => {
        console.log('[useBoardState][updateNodeLabel] Обновление label для узла', id, 'на', newLabel);
        setNodes((nds) => {
            return nds.map((node) => {
                if (node.id === id) {
                    const updatedNode = {
                        ...node,
                        data: {
                            ...node.data,
                            label: newLabel,
                            functions: {
                                ...(node.data.functions || {}),
                                onLabelChange: updateNodeLabel,
                                updateNode: updateNodeOnServer,
                                removeNode,
                            },
                        },
                    };
                    console.log('[useBoardState][updateNodeLabel] Новый узел:', updatedNode);
                    // Отправляем обновление на сервер
                    updateNodeOnServer(updatedNode);
                    return updatedNode;
                }
                return node;
            });
        });
    }, [setNodes, updateNodeOnServer, removeNode]);

    // Функции для отключения и включения перетаскивания узла
    const disableDragging = useCallback((nodeId) => {
        console.log('[useBoardState][disableDragging] Отключение перетаскивания для узла', nodeId);
        setNodes((nds) =>
            nds.map((node) =>
                node.id === nodeId ? { ...node, draggable: false } : node
            )
        );
    }, [setNodes]);

    const enableDragging = useCallback((nodeId) => {
        console.log('[useBoardState][enableDragging] Включение перетаскивания для узла', nodeId);
        setNodes((nds) =>
            nds.map((node) =>
                node.id === nodeId ? { ...node, draggable: true } : node
            )
        );
    }, [setNodes]);

    // Функция добавления нового узла
    // (boardId = 8 оставлен для теста)
    const addNode = useCallback((id, type) => {
        const position = { x: Math.random() * 400, y: Math.random() * 400 };
        const { data, style, width, height } = getDefaultItem(type);

        const payload = {
            boardId: id,
            // parentId: null,
            type,
            position: new Position(position),
            geometry: new Geometry({ width: width, height: height, rotation: 0 }),
            data: { ...data, dataType: type },
            style: { ...style, styleType: type },
        };
        console.log('[useBoardState][addNode] Добавление узла типа', type, 'с payload:', payload);
        safePublish('/app/items/create', payload);
    }, [safePublish]);

    // Функция загрузки данных доски
    const loadBoardData = useCallback((boardId) => {
        console.log('[useBoardState][loadBoardData] Загрузка данных для доски с id:', boardId);
        // Если вы передаёте только число, убедитесь, что сервер ожидает число
        safePublish('/app/items/load', boardId);
    }, [safePublish]);

    // Функция удаления последнего узла
    const removeLastNode = useCallback(() => {
        setNodes((nds) => {
            if (nds.length === 0) return nds;
            const nodeIdToRemove = nds[nds.length - 1].id;
            console.log('[useBoardState][removeLastNode] Удаляем последний узел с id:', nodeIdToRemove);
            setEdges((eds) =>
                eds.filter((e) => e.source !== nodeIdToRemove && e.target !== nodeIdToRemove)
            );
            return nds.slice(0, -1);
        });
    }, [setNodes, setEdges]);

    // Обработчик соединения для ребра
    const onConnect = useCallback(
        (params) => {
            console.log('[useBoardState][onConnect] Создание ребра с параметрами:', params);
            setEdges((eds) => addEdge({ ...params, type: 'floating' }, eds));
        },
        [setEdges]
    );

    // Обработчик обновления ребра
    const onEdgeUpdate = useCallback(
        (oldEdge, newConnection) => {
            console.log('[useBoardState][onEdgeUpdate] Обновление ребра. Старое:', oldEdge, 'Новое:', newConnection);
            setEdges((eds) => updateEdge(oldEdge, newConnection, eds));
        },
        [setEdges]
    );

    // Обработка выбора элементов
    const onSelectionChange = useCallback((elements) => {
        console.log('[useBoardState][onSelectionChange] Изменение выбора:', elements);
        if (Array.isArray(elements)) {
            setSelectedElements(elements);
        } else if (elements) {
            const arr = [];
            if (elements.nodes) arr.push(...elements.nodes);
            if (elements.edges) arr.push(...elements.edges);
            setSelectedElements(arr);
        } else {
            setSelectedElements([]);
        }
    }, []);

    // Обработка входящих сообщений с сервера (CREATE/UPDATE)
    const updateNodeFromWS = useCallback((item) => {
        console.log('[useBoardState][updateNodeFromWS] Получено сообщение с сервера:', item);
        const newNode = itemToNode(item);
        console.log('[useBoardState][updateNodeFromWS] Дто с сервера после маппинга:', newNode);
        setNodes((prevNodes) => {
            const nodeIndex = prevNodes.findIndex((node) => node.id === newNode.id);
            const baseData = {
                ...newNode.data,
                functions: {
                    onLabelChange: updateNodeLabel,
                    updateNode: updateNodeOnServer,
                    removeNode,
                    disableDragging: () => disableDragging(newNode.id),
                    enableDragging: () => enableDragging(newNode.id),
                },
            };
            const updatedNode = { ...newNode, draggable: true, data: baseData };

            if (nodeIndex !== -1) {
                console.log('[useBoardState][updateNodeFromWS] Обновляем существующий узел с id:', newNode.id);
                const newNodes = [...prevNodes];
                newNodes[nodeIndex] = updatedNode;
                originalNodesRef.current[newNode.id] = updatedNode;
                return newNodes;
            } else {
                console.log('[useBoardState][updateNodeFromWS] Добавляем новый узел с id:', newNode.id);
                originalNodesRef.current[newNode.id] = updatedNode;
                return [...prevNodes, updatedNode];
            }
        });
    }, [setNodes, updateNodeLabel, updateNodeOnServer, removeNode, disableDragging, enableDragging]);

    // Установка начального состояния доски (INITIAL)
    const setBoardData = useCallback((itemsData) => {
        console.log('[useBoardState][setBoardData] Установка начальных данных:', itemsData);
        const items = itemsData.map((raw) => ItemRs.fromServer(raw));
        const loadedNodes = items.map((item) => {
            const node = itemToNode(item);
            const newNode = {
                ...node,
                draggable: true,
                data: {
                    ...node.data,
                    functions: {
                        onLabelChange: updateNodeLabel,
                        updateNode: updateNodeOnServer,
                        removeNode,
                        disableDragging: () => disableDragging(node.id),
                        enableDragging: () => enableDragging(node.id),
                    },
                },
            };
            // Сохраняем начальное состояние для сравнения
            originalNodesRef.current[newNode.id] = newNode;
            return newNode;
        });

        const loadedEdges = items
            .filter((it) => it.parentId !== null && it.parentId !== undefined)
            .map((it) => {
                return {
                    id: `${it.parentId}-${it.id}`,
                    source: it.parentId.toString(),
                    target: it.id.toString(),
                    type: 'floating',
                };
            });

        console.log('[useBoardState][setBoardData] Загруженные узлы:', loadedNodes);
        console.log('[useBoardState][setBoardData] Загруженные рёбра:', loadedEdges);
        setNodes(loadedNodes);
        setEdges(loadedEdges);

        originalNodesRef.current = loadedNodes.reduce((acc, n) => {
            acc[n.id] = n;
            return acc;
        }, {});
    }, [setNodes, setEdges, updateNodeLabel, updateNodeOnServer, removeNode, disableDragging, enableDragging]);

    // При окончании перетаскивания узла отправляем обновлённую позицию на сервер
    const onNodeDragStop = useCallback((_, node) => {
        console.log('[useBoardState][onNodeDragStop] Узел перетащен:', node);
        // Сравниваем позицию с предыдущей сохранённой
        const original = originalNodesRef.current[node.id];
        if (original) {
            const dx = Math.abs(original.position.x - node.position.x);
            const dy = Math.abs(original.position.y - node.position.y);
            // Если позиция не изменилась существенно, не отправляем обновление
            if (dx < 1 && dy < 1) {
                console.log('[useBoardState][onNodeDragStop] Позиция не изменилась, обновление не отправляем.');
                return;
            }
        }
        updateNodeOnServer(node);
        // Обновляем сохранённое состояние
        originalNodesRef.current[node.id] = { ...node };
        setNodes((nds) => nds.map((n) => (n.id === node.id ? { ...n, selected: false } : n)));
    }, [updateNodeOnServer, setNodes]);

    // Обработка клавиш для удаления выбранных рёбер
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElements.length > 0) {
                console.log('[useBoardState][handleKeyDown] Удаление выбранных элементов. Клавиша:', e.key);
                const selectedEdgesIds = selectedElements
                    .filter((el) => el.source && el.target)
                    .map((edge) => edge.id);
                if (selectedEdgesIds.length > 0) {
                    console.log('[useBoardState][handleKeyDown] Удаляем рёбра с id:', selectedEdgesIds);
                    setEdges((eds) => eds.filter((edge) => !selectedEdgesIds.includes(edge.id)));
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedElements, setEdges]);

    return {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        onEdgeUpdate,
        onSelectionChange,
        addNode,
        removeLastNode,
        loadBoardData,
        onNodeDragStop,
        removeNode,
        updateNodeFromWS,
        setBoardData,
    };
};
