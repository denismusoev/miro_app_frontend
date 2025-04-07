// src/hooks/useBoardState.js
import { useCallback, useEffect, useState, useRef } from 'react';
import { useNodesState, useEdgesState, addEdge, applyEdgeChanges } from '@xyflow/react';
import { getDefaultItem } from '../utils/boardUtils';
import { itemToNode, nodeToItem } from '../utils/itemMapper';
import { Position, Geometry, ItemRs } from '../model/ItemDto';
import { useSafePublish } from './useSafePublish';
import { attachNodeHandlers } from '../utils/nodeHelpers';

/**
 * Основной хук для работы со состоянием доски.
 *
 * @param {object} params
 * @param {object} params.stompClient - клиент для отправки сообщений по WS
 * @param {Function} params.publish - функция публикации с проверкой connected
 * @param {boolean} params.connected - статус соединения
 */
export const useBoardState = ({ stompClient, publish, connected }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedElements, setSelectedElements] = useState([]);
    const originalNodesRef = useRef({});
    const pendingUpdatesRef = useRef(new Set());


    // Используем отдельный хук для безопасной публикации
    const safePublish = useSafePublish(connected, publish);

    // ----------------------------------------------------------------------------
    //                          Функции для локального состояния
    // ----------------------------------------------------------------------------

    const removeNode = useCallback((nodeId) => {
        console.log('[useBoardState][removeNode] Удаление узла с id:', nodeId);
        setNodes((prevNodes) => prevNodes.filter((node) => node.id !== nodeId));
        setEdges((prevEdges) =>
            prevEdges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
        );
    }, [setNodes, setEdges]);

    const updateNodeOnServer = useCallback((node) => {
        const payload = nodeToItem(node);
        console.log('[useBoardState][updateNodeOnServer] Отправка обновления узла:', payload);
        safePublish('/app/items/update', payload);
    }, [safePublish]);

    const disableDragging = useCallback((nodeId) => {
        console.log('[useBoardState][disableDragging]', nodeId);
        setNodes((prevNodes) =>
            prevNodes.map((node) =>
                node.id === nodeId ? { ...node, draggable: false } : node
            )
        );
    }, [setNodes]);

    const enableDragging = useCallback((nodeId) => {
        console.log('[useBoardState][enableDragging]', nodeId);
        setNodes((prevNodes) =>
            prevNodes.map((node) =>
                node.id === nodeId ? { ...node, draggable: true } : node
            )
        );
    }, [setNodes]);

    const createNewNode = useCallback((boardIdForNode, type, position) => {
        const { data, style, width, height } = getDefaultItem(type);
        const payload = {
            boardId: boardIdForNode,
            type,
            position: new Position(position),
            geometry: new Geometry({ width, height, rotation: 0 }),
            data: { ...data, dataType: type, label: data.label || '' },
            style: { ...style, styleType: type },
        };
        console.log('[useBoardState][createNewNode] Тип:', type, 'Payload:', payload);
        // Здесь, если вы генерируете новый узел локально (например, с временным id),
        // можете добавить его в локальное состояние и отметить pendingUpdatesRef.
        safePublish('/app/items/create', payload);
    }, [safePublish]);

    const loadBoardData = useCallback((targetBoardId) => {
        console.log('[useBoardState][loadBoardData] Загрузка данных, boardId:', targetBoardId);
        safePublish('/app/items/load', targetBoardId);
    }, [safePublish]);

    const removeLastNode = useCallback(() => {
        setNodes((prevNodes) => {
            if (prevNodes.length === 0) return prevNodes;
            const nodeIdToRemove = prevNodes[prevNodes.length - 1].id;
            console.log('[useBoardState][removeLastNode] Удаляем id:', nodeIdToRemove);
            setEdges((prevEdges) =>
                prevEdges.filter((edge) => edge.source !== nodeIdToRemove && edge.target !== nodeIdToRemove)
            );
            return prevNodes.slice(0, -1);
        });
    }, [setNodes, setEdges]);

    const onConnect = useCallback((params) => {
        console.log('[useBoardState][onConnect] Создание ребра:', params);
        setEdges((prevEdges) => addEdge({ ...params, type: 'floating' }, prevEdges));
    }, [setEdges]);

    const onEdgeUpdate = useCallback((oldEdge, newConnection) => {
        console.log('[useBoardState][onEdgeUpdate] Старое:', oldEdge, 'Новое:', newConnection);
        setEdges((prevEdges) => applyEdgeChanges(oldEdge, newConnection, prevEdges));
    }, [setEdges]);

    const onSelectionChange = useCallback((elements) => {
        console.log('[useBoardState][onSelectionChange] Элементы:', elements);
        if (Array.isArray(elements)) {
            setSelectedElements(elements);
        } else if (elements) {
            const combined = [
                ...(elements.nodes || []),
                ...(elements.edges || []),
            ];
            setSelectedElements(combined);
        } else {
            setSelectedElements([]);
        }
    }, []);

    const updateNodeLabel = useCallback((id, newLabel) => {
        console.log('[useBoardState][updateNodeLabel] Обновление label для узла', id, 'на', newLabel);
        setNodes((prevNodes) =>
            prevNodes.map((node) => {
                if (node.id !== id) return node;
                // Отмечаем, что узел обновлён локально
                pendingUpdatesRef.current.add(id);
                const updatedNode = attachNodeHandlers(
                    {
                        ...node,
                        data: { ...node.data, label: newLabel },
                    },
                    {
                        updateNodeLabel,
                        updateNodeOnServer,
                        removeNode,
                        disableDragging,
                        enableDragging,
                        updateNodeStyle,
                        updateNodeGeometry
                    }
                );
                updateNodeOnServer(updatedNode);
                return updatedNode;
            })
        );
    }, [setNodes, updateNodeOnServer, removeNode, disableDragging, enableDragging]);

    const updateNodeGeometry = useCallback((id, newSize) => {
        console.log('[useBoardState][updateNodeLabel] Обновление size для узла', id, 'на', newSize);
        setNodes((prevNodes) =>
            prevNodes.map((node) => {
                if (node.id !== id) return node;
                // Отмечаем, что узел обновлён локально
                pendingUpdatesRef.current.add(id);
                const updatedNode = attachNodeHandlers(
                    {
                        ...node,
                        width: newSize.width,
                        height: newSize.height,
                        data: {
                            ...node.data,
                            geometry:
                            {
                                width: newSize.width,
                                height: newSize.height
                            }
                        },
                    },
                    {
                        updateNodeLabel,
                        updateNodeOnServer,
                        removeNode,
                        disableDragging,
                        enableDragging,
                        updateNodeStyle,
                        updateNodeGeometry
                    }
                );
                updateNodeOnServer(updatedNode);
                return updatedNode;
            })
        );
    }, [setNodes, updateNodeOnServer, removeNode, disableDragging, enableDragging]);


    const updateNodeStyle = useCallback((id, newStyle) => {
        console.log('[useBoardState][updateNodeStyle] Обновляем стиль для узла', id, newStyle);
        setNodes((prevNodes) =>
            prevNodes.map((node) => {
                if (node.id !== id) return node;
                pendingUpdatesRef.current.add(id);
                const updatedNode = attachNodeHandlers(
                    {
                        ...node,
                        data: {
                            ...node.data,
                            style: { ...node.data.style, ...newStyle },
                        },
                    },
                    {
                        updateNodeLabel,
                        updateNodeOnServer,
                        removeNode,
                        disableDragging,
                        enableDragging,
                        updateNodeStyle,
                        updateNodeGeometry
                    }
                );
                updateNodeOnServer(updatedNode);
                return { ...updatedNode, selected: node.selected };
            })
        );
    }, [setNodes, updateNodeOnServer, removeNode, disableDragging, enableDragging]);


    const updateNodeFromWS = useCallback((item) => {
        console.log('[useBoardState][updateNodeFromWS] Пришёл item:', item);
        const newNode = itemToNode(item);
        setNodes((prevNodes) => {
            const idx = prevNodes.findIndex((n) => n.id === newNode.id);
            if (idx >= 0) {
                // Если узел обновлён локально, игнорируем WS‑обновление
                if (pendingUpdatesRef.current.has(newNode.id)) {
                    console.log('[useBoardState][updateNodeFromWS] Обнаружен локальный узел, скипаем:', newNode.id);
                    pendingUpdatesRef.current.delete(newNode.id);
                    return prevNodes;
                }
                console.log('[useBoardState][updateNodeFromWS] Обновляем существующий узел:', newNode.id);
                const nodeWithFunctions = attachNodeHandlers(
                    { ...newNode, draggable: true, selected: prevNodes[idx].selected },
                    { updateNodeLabel, updateNodeOnServer, removeNode, disableDragging, enableDragging, updateNodeStyle }
                );
                const updatedNodes = [...prevNodes];
                updatedNodes[idx] = nodeWithFunctions;
                originalNodesRef.current[newNode.id] = nodeWithFunctions;
                return updatedNodes;
            } else {
                console.log('[useBoardState][updateNodeFromWS] Добавляем новый узел:', newNode.id);
                const nodeWithFunctions = attachNodeHandlers(
                    { ...newNode, draggable: true, selected: false },
                    { updateNodeLabel, updateNodeOnServer, removeNode, disableDragging, enableDragging, updateNodeStyle }
                );
                originalNodesRef.current[newNode.id] = nodeWithFunctions;
                return [...prevNodes, nodeWithFunctions];
            }
        });
    }, [
        setNodes,
        updateNodeLabel,
        updateNodeOnServer,
        removeNode,
        disableDragging,
        enableDragging,
        updateNodeStyle,
    ]);



    const setBoardData = useCallback((itemsData) => {
        console.log('[useBoardState][setBoardData] Начальные данные:', itemsData);
        const items = itemsData.map((raw) => ItemRs.fromServer(raw));
        const loadedNodes = items.map((item) => {
            const baseNode = itemToNode(item);
            const nodeWithFunctions = attachNodeHandlers(
                { ...baseNode, draggable: true },
                {
                    updateNodeLabel,
                    updateNodeOnServer,
                    removeNode,
                    disableDragging,
                    enableDragging,
                    updateNodeStyle,
                    updateNodeGeometry
                }
            );
            originalNodesRef.current[nodeWithFunctions.id] = nodeWithFunctions;
            return nodeWithFunctions;
        });
        const loadedEdges = items
            .filter((it) => it.parentId !== null && it.parentId !== undefined)
            .map((it) => ({
                id: `${it.parentId}-${it.id}`,
                source: it.parentId.toString(),
                target: it.id.toString(),
                type: 'floating',
            }));
        console.log('[useBoardState][setBoardData] Узлы:', loadedNodes);
        console.log('[useBoardState][setBoardData] Рёбра:', loadedEdges);
        setNodes(loadedNodes);
        setEdges(loadedEdges);
    }, [
        setNodes,
        setEdges,
        updateNodeLabel,
        updateNodeOnServer,
        removeNode,
        disableDragging,
        enableDragging
    ]);

    const onNodeDragStop = useCallback((_, draggedNode) => {
        console.log('[useBoardState][onNodeDragStop] Узел перетащен:', draggedNode);
        const original = originalNodesRef.current[draggedNode.id];
        if (original) {
            const dx = Math.abs(original.position.x - draggedNode.position.x);
            const dy = Math.abs(original.position.y - draggedNode.position.y);
            if (dx < 1 && dy < 1) {
                console.log('[useBoardState][onNodeDragStop] Позиция не изменилась, обновление не отправляем.');
                return;
            }
        }
        pendingUpdatesRef.current.add(draggedNode.id);
        updateNodeOnServer(draggedNode);
        originalNodesRef.current[draggedNode.id] = { ...draggedNode };
        setNodes((prev) =>
            prev.map((n) => (n.id === draggedNode.id ? { ...n, selected: true } : n))
        );
    }, [updateNodeOnServer, setNodes]);

    const onNodeDragStart = useCallback((event, node) => {
        setNodes((nds) =>
            nds.map((n) =>
                n.id === node.id ? { ...n, selected: true } : n
            )
        );
    }, [setNodes]);


    useEffect(() => {
        function handleDeleteKey(e) {
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElements.length > 0) {
                console.log('[useBoardState][handleDeleteKey] Удаление элементов:', selectedElements);
                const selectedEdgesIds = selectedElements
                    .filter((el) => el.source && el.target)
                    .map((edge) => edge.id);
                if (selectedEdgesIds.length > 0) {
                    console.log('[useBoardState][handleDeleteKey] Удаляем рёбра:', selectedEdgesIds);
                    setEdges((prevEdges) =>
                        prevEdges.filter((edge) => !selectedEdgesIds.includes(edge.id))
                    );
                }
            }
        }
        document.addEventListener('keydown', handleDeleteKey);
        return () => document.removeEventListener('keydown', handleDeleteKey);
    }, [selectedElements, setEdges]);

    return {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        onEdgeUpdate,
        onSelectionChange,
        createNewNode,
        removeNode,
        removeLastNode,
        loadBoardData,
        updateNodeFromWS,
        setBoardData,
        onNodeDragStop,
        onNodeDragStart,
        updateNodeGeometry
    };
};
