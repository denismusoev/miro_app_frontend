// src/hooks/useBoardState.js
import { useCallback, useEffect, useState, useRef } from 'react';
import { useNodesState, useEdgesState, addEdge, applyEdgeChanges } from '@xyflow/react';
import { getDefaultItem } from '../utils/boardUtils';
import { itemToNode, nodeToItem } from '../utils/itemMapper';
import { Position, Geometry, ItemRs } from '../model/ItemDto';
import { useSafePublish } from './useSafePublish';
import { attachNodeHandlers } from '../utils/nodeHelpers';
import {debounce, throttle} from "lodash";

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
    const pendingUpdatesConnectorsRef = useRef(new Set());
    const connectedRef = useRef(connected);

    useEffect(() => {
        connectedRef.current = connected;
    }, [connected]);

    const safePublish = useSafePublish(connectedRef, publish);

    /**
     * Пример: загрузили "начальные" коннекторы по boardId (type = INITIAL_CONNECTORS).
     * Приходит массив ConnectorRs, нужно сделать edges и установить в setEdges().
     */
    const setConnectorData = useCallback((connectors) => {
        //console.log('[useBoardState][setConnectorData] Загрузка коннекторов:', connectors);

        // Превращаем массив ConnectorRs в Edge[]
        const loadedEdges = connectors.map((connector) => connectorToEdge(connector));
        setEdges(loadedEdges);
    }, [setEdges]);

    /**
     * Пример: добавляем или обновляем один коннектор, пришедший из WS
     */
    const addOrUpdateConnector = useCallback((connectorRs) => {
        //console.log('[useBoardState][addOrUpdateConnector] Пришёл коннектор:', connectorRs);
        setEdges((prevEdges) => {
            // Пробуем найти, есть ли уже edge с таким id
            const existingIndex = prevEdges.findIndex((e) => e.id === String(connectorRs.id));

            const newEdge = connectorToEdge(connectorRs);

            if (existingIndex >= 0) {
                // обновляем
                const updated = [...prevEdges];
                updated[existingIndex] = newEdge;
                return updated;
            } else {
                // добавляем
                return [...prevEdges, newEdge];
            }
        });
    }, [setEdges]);

    /**
     * Удаление коннектора
     */
    const removeConnector = useCallback((connectorId) => {
        //console.log('[useBoardState][removeConnector] Удаляем коннектор:', connectorId);
        setEdges((prevEdges) => prevEdges.filter((e) => e.id !== String(connectorId)));
    }, [setEdges]);

    /**
     * Пример клиентского метода "createConnector"
     * (вызывается при drag'n'drop или на кнопке "соединить узлы"?)
     * Здесь вы решаете, как определить startItem, endItem, content и т.д.
     */
    const createConnector = useCallback((params) => {
        //console.log(params);
        const payload = {
            startItem: params.source,
            endItem: params.target,
            content: '',
            // style: {...} при необходимости
        };
        // Отправляем по WS на /app/connectors/create (см. контроллер)
        //console.log('[createConnector]', connectedRef.current);
        safePublish('/app/connectors/create', payload);
        // createNewNode(1, "text", { x: 100, y: 100 });
    }, [connectedRef, safePublish]);

    /**
     * Пример удаления коннектора по клику
     */
    const deleteConnectorOnServer = useCallback((connectorId) => {
        safePublish('/app/connectors/delete', connectorId);
    }, [safePublish]);

    /**
     * Пример обновления коннектора
     */
    const updateConnectorOnServer = useCallback((connector) => {
        const payload = {
            id: connector.id,
            startItem: connector.source,  // зависит, как у вас хранится
            endItem: connector.target,
            content: connector.label || '',
            style: {}, // какие-то поля стиля
        };
        safePublish('/app/connectors/update', payload);
    }, [safePublish]);

    const connectorToEdge = (connectorRs) => {
        return {
            id: String(connectorRs.id),
            source: String(connectorRs.startItem),
            target: String(connectorRs.endItem),
            type: 'floating',         // или любой ваш type
            label: connectorRs.content,
            data: {
                style: connectorRs.style || {}, // если нужно
            },
        };
    };

    const loadConnectorData = useCallback((targetBoardId) => {
        //console.log('[useBoardState][loadConnectorData] Загрузка коннекторов, boardId:', targetBoardId);
        safePublish('/app/connectors/load', targetBoardId);
    }, [connected, safePublish]);

    const removeNode = useCallback((nodeId) => {
        //console.log('[useBoardState][removeNode] Удаление узла с id:', nodeId);
        setNodes((prevNodes) => prevNodes.filter((node) => node.id !== nodeId));
        setEdges((prevEdges) =>
            prevEdges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
        );
    }, [setNodes, setEdges]);

    const updateNodeOnServer = useCallback((node) => {
        const payload = nodeToItem(node);
        //console.log('[useBoardState][updateNodeOnServer] Отправка обновления узла:', payload);
        safePublish('/app/items/update', payload);
    }, [safePublish]);

    const disableDragging = useCallback((nodeId) => {
        //console.log('[useBoardState][disableDragging]', nodeId);
        setNodes((prevNodes) =>
            prevNodes.map((node) =>
                node.id === nodeId ? { ...node, draggable: false } : node
            )
        );
    }, [setNodes]);

    const enableDragging = useCallback((nodeId) => {
        //console.log('[useBoardState][enableDragging]', nodeId);
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
        //console.log('[useBoardState][createNewNode] Тип:', type, 'Payload:', payload);
        // Здесь, если вы генерируете новый узел локально (например, с временным id),
        // можете добавить его в локальное состояние и отметить pendingUpdatesRef.
        //console.log('[createNewNode]', connectedRef.current);
        safePublish('/app/items/create', payload);
    }, [connectedRef, safePublish]);

    const loadBoardData = useCallback((targetBoardId) => {
        //console.log('[useBoardState][loadBoardData] Загрузка данных, boardId:', targetBoardId);
        safePublish('/app/board/load', targetBoardId);
    }, [connected, safePublish]);

    const removeLastNode = useCallback(() => {
        setNodes((prevNodes) => {
            if (prevNodes.length === 0) return prevNodes;
            const nodeIdToRemove = prevNodes[prevNodes.length - 1].id;
            //console.log('[useBoardState][removeLastNode] Удаляем id:', nodeIdToRemove);
            setEdges((prevEdges) =>
                prevEdges.filter((edge) => edge.source !== nodeIdToRemove && edge.target !== nodeIdToRemove)
            );
            return prevNodes.slice(0, -1);
        });
    }, [setNodes, setEdges]);

    const onConnect = useCallback((params) => {
        //console.log('[useBoardState][onConnect] Создание ребра:', params);
        createConnector(params);
        setEdges((prevEdges) => addEdge({ ...params, type: 'floating' }, prevEdges));
    }, [setEdges]);

    const onEdgeUpdate = useCallback((oldEdge, newConnection) => {
        //console.log('[useBoardState][onEdgeUpdate] Старое:', oldEdge, 'Новое:', newConnection);
        setEdges((prevEdges) => applyEdgeChanges(oldEdge, newConnection, prevEdges));
    }, [setEdges]);

    const onSelectionChange = useCallback((elements) => {
        //console.log('[useBoardState][onSelectionChange] Элементы:', elements);
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
        //console.log('[useBoardState][updateNodeLabel] Обновление label для узла', id, 'на', newLabel);
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
                        updateNodeGeometry,
                        updateNodeData
                    }
                );
                updateNodeOnServer(updatedNode);
                return updatedNode;
            })
        );
    }, [setNodes, updateNodeOnServer, removeNode, disableDragging, enableDragging]);

    const updateNodeGeometry = useCallback((id, newSize) => {
        //console.log('[useBoardState][updateNodeLabel] Обновление size для узла', id, 'на', newSize);
        setNodes((prevNodes) =>
            prevNodes.map((node) => {
                if (node.id !== id) return node;
                // Отмечаем, что узел обновлён локально
                // pendingUpdatesRef.current.add(id);
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
                        updateNodeGeometry,
                        updateNodeData
                    }
                );

                // debouncedUpdateNodeOnServer(updatedNode);
                updateNodeOnServer(updatedNode);
                return updatedNode;
            })
        );
    }, [setNodes, updateNodeOnServer, removeNode, disableDragging, enableDragging]);

    const updateNodeStyle = useCallback((id, newStyle) => {
        //console.log('[useBoardState][updateNodeStyle] Обновляем стиль для узла', id, newStyle);
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
                        updateNodeGeometry,
                        updateNodeData
                    }
                );
                debouncedUpdateNodeOnServer(updatedNode);
                return { ...updatedNode, selected: node.selected };
            })
        );
    }, [setNodes, updateNodeOnServer, removeNode, disableDragging, enableDragging]);

    const updateNodeData = useCallback((id, newData) => {
        //console.log('[useBoardState][updateNodeData] Обновляем данные для узла', id, newData);
        setNodes((prevNodes) =>
            prevNodes.map((node) => {
                if (node.id !== id) return node;
                pendingUpdatesRef.current.add(id);
                const updatedNode = attachNodeHandlers(
                    {
                        ...node,
                        data: {
                            ...node.data,
                            ...newData,
                        },
                    },
                    {
                        updateNodeLabel,
                        updateNodeOnServer,
                        removeNode,
                        disableDragging,
                        enableDragging,
                        updateNodeStyle,
                        updateNodeGeometry,
                        updateNodeData
                    }
                );
                //console.log("ДАННЫЕ ПОСЛЕ СМЕНЫ ТИП ФИГУРЫ");
                //console.log(updatedNode);
                debouncedUpdateNodeOnServer(updatedNode);
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
                    { updateNodeLabel, updateNodeOnServer, removeNode, disableDragging, enableDragging, updateNodeStyle, updateNodeData, updateNodeGeometry }
                );
                const updatedNodes = [...prevNodes];
                updatedNodes[idx] = nodeWithFunctions;
                originalNodesRef.current[newNode.id] = nodeWithFunctions;
                return updatedNodes;
            } else {
                console.log('[useBoardState][updateNodeFromWS] Добавляем новый узел:', newNode.id);
                const nodeWithFunctions = attachNodeHandlers(
                    { ...newNode, draggable: true, selected: false },
                    { updateNodeLabel, updateNodeOnServer, removeNode, disableDragging, enableDragging, updateNodeStyle, updateNodeData }
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


    const setBoardData = useCallback((fullData) => {
        // Предположим, fullData = { items: [...], connectors: [...] }
        const { items = [], connectors = [] } = fullData;

        // 1) Парсим items и создаём узлы
        const parsedItems = items.map((raw) => ItemRs.fromServer(raw));
        const loadedNodes = parsedItems.map((item) => {
            const baseNode = itemToNode(item);

            // Подключаем хендлеры для узлов (updateNodeLabel и т.д.)
            const nodeWithFunctions = attachNodeHandlers(
                { ...baseNode, draggable: true },
                {
                    updateNodeLabel,
                    updateNodeOnServer,
                    removeNode,
                    disableDragging,
                    enableDragging,
                    updateNodeStyle,
                    updateNodeGeometry,
                    updateNodeData
                }
            );
            originalNodesRef.current[nodeWithFunctions.id] = nodeWithFunctions;
            return nodeWithFunctions;
        });

        // 2) Парсим connectors и создаём рёбра
        // Если у вас есть функция вроде connectorToEdge(connectorRs), можно использовать её
        const loadedEdges = connectors.map((conn) => ({
            id: String(conn.id),
            source: String(conn.startItem),
            target: String(conn.endItem),
            type: 'floating',
            label: conn.content,
            data: { style: conn.style || {} },
        }));

        // 3) Сохраняем в стейт
        //console.log('[useBoardState][setBoardFullData] Узлы:', loadedNodes);
        //console.log('[useBoardState][setBoardFullData] Рёбра:', loadedEdges);
        setNodes(loadedNodes);
        setEdges(loadedEdges);
    }, [
        setNodes,
        setEdges,
        updateNodeLabel,
        updateNodeOnServer,
        removeNode,
        disableDragging,
        enableDragging,
        updateNodeStyle,
        updateNodeGeometry
    ]);


    const debouncedUpdateNodeOnServer = useCallback(
        throttle((node) => {
            updateNodeOnServer(node);
        }, 20),
        [updateNodeOnServer]
    );


    const onNodeDragStop = useCallback((_, draggedNode) => {
        //console.log('[useBoardState][onNodeDragStop] Узел перетащен:', draggedNode);
        // const original = originalNodesRef.current[draggedNode.id];
        // if (original) {
        //     const dx = Math.abs(original.position.x - draggedNode.position.x);
        //     const dy = Math.abs(original.position.y - draggedNode.position.y);
        //     if (dx < 1 && dy < 1) {
        //         console.log('[useBoardState][onNodeDragStop] Позиция не изменилась, обновление не отправляем.');
        //         return;
        //     }
        // }
        pendingUpdatesRef.current.add(draggedNode.id);
        debouncedUpdateNodeOnServer(draggedNode);
        // originalNodesRef.current[draggedNode.id] = { ...draggedNode };
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
                //console.log('[useBoardState][handleDeleteKey] Удаление элементов:', selectedElements);
                const selectedEdgesIds = selectedElements
                    .filter((el) => el.source && el.target)
                    .map((edge) => edge.id);
                if (selectedEdgesIds.length > 0) {
                    //console.log('[useBoardState][handleDeleteKey] Удаляем рёбра:', selectedEdgesIds);
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
        updateNodeGeometry,
        setConnectorData,
        addOrUpdateConnector,
        removeConnector,
        createConnector,
        deleteConnectorOnServer,
        updateConnectorOnServer,
        loadConnectorData
    };
};
