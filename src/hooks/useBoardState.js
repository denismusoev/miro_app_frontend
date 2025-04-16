// src/hooks/useBoardState.js
import { useCallback, useEffect, useState, useRef } from 'react';
import { useNodesState, useEdgesState, addEdge, applyEdgeChanges } from '@xyflow/react';
import { getDefaultItem } from '../utils/boardUtils';
import { itemToNode, nodeToItem } from '../utils/itemMapper';
import { Position, Geometry, ItemRs } from '../model/ItemDto';
import { useSafePublish } from './useSafePublish';
import { attachNodeHandlers } from '../utils/nodeHelpers';
import { debounce, throttle } from "lodash";
import { useUpdateNodeInternals } from './useUpdateNodeInternals';

/**
 * Сортирует элементы ItemRs так, чтобы родительские элементы всегда шли перед дочерними
 * @param {Array} items - массив элементов ItemRs для сортировки
 * @returns {Array} - отсортированный массив элементов
 */
export const sortItemsWithParentsFirst = (items) => {
    return [...items].sort((a, b) => {
        // Если b является родителем a, то b должен идти раньше
        if (a.parentId === b.id) return 1;
        // Если a является родителем b, то a должен идти раньше
        if (b.parentId === a.id) return -1;

        // Все фреймы (потенциальные родители) должны идти в начале массива
        if (a.type === 'frame' && b.type !== 'frame') return -1;
        if (a.type !== 'frame' && b.type === 'frame') return 1;

        // Все элементы без родителей идут перед элементами с родителями
        if (!a.parentId && b.parentId) return -1;
        if (a.parentId && !b.parentId) return 1;

        return 0;
    });
};

/**
 * Сортирует узлы так, чтобы родительские узлы всегда шли перед дочерними
 * @param {Array} nodes - массив узлов для сортировки
 * @returns {Array} - отсортированный массив узлов
 */
export const sortNodesWithParentsFirst = (nodes) => {
    console.log(`📊 Начало сортировки ${nodes.length} узлов...`);

    // Создаем карту родительских отношений для диагностики
    const parentChildMap = {};
    nodes.forEach(node => {
        if (node.parentId) {
            if (!parentChildMap[node.parentId]) {
                parentChildMap[node.parentId] = [];
            }
            parentChildMap[node.parentId].push(node.id);
        }
    });

    // Выводим информацию о родительских отношениях
    if (Object.keys(parentChildMap).length > 0) {
        console.log(`🔍 Обнаружены родительские отношения:`);
        Object.entries(parentChildMap).forEach(([parentId, childIds]) => {
            console.log(`   Родитель ${parentId} содержит дочерние элементы: ${childIds.join(', ')}`);
        });
    } else {
        console.log(`ℹ️ Нет вложенных узлов, сортировка не требуется`);
    }

    // Выполняем сортировку
    const sorted = [...nodes].sort((a, b) => {
        // Если b является родителем a, то b должен идти раньше
        if (a.parentId === b.id) return 1;
        // Если a является родителем b, то a должен идти раньше
        if (b.parentId === a.id) return -1;

        // Все фреймы (потенциальные родители) должны идти в начале массива
        if (a.type === 'frame' && b.type !== 'frame') return -1;
        if (a.type !== 'frame' && b.type === 'frame') return 1;

        // Все элементы без родителей идут перед элементами с родителями
        if (!a.parentId && b.parentId) return -1;
        if (a.parentId && !b.parentId) return 1;

        return 0;
    });

    console.log(`✅ Сортировка узлов завершена`);

    // Проверяем результаты сортировки
    const nodeMap = {};
    sorted.forEach((node, index) => {
        nodeMap[node.id] = index;
    });

    // Проверяем, что все родители идут перед детьми
    const issues = [];
    sorted.forEach((node) => {
        if (node.parentId && nodeMap[node.parentId] > nodeMap[node.id]) {
            issues.push(`❌ Ошибка: узел ${node.id} идет перед своим родителем ${node.parentId}`);
        }
    });

    if (issues.length > 0) {
        console.error(`⚠️ Обнаружены проблемы после сортировки:`);
        issues.forEach(issue => console.error(issue));
    } else {
        console.log(`✅ Порядок узлов корректен после сортировки`);
    }

    return sorted;
};

/**
 * Проверяет порядок узлов и выдает предупреждение, если родительские узлы идут после дочерних
 * @param {Array} nodes - массив узлов для проверки
 */
export const checkNodesOrder = (nodes) => {
    console.log(`🔎 Проверка порядка ${nodes.length} узлов...`);

    const nodeMap = {};
    nodes.forEach((node, index) => {
        nodeMap[node.id] = { node, index };
    });

    // Проверяем каждый узел с родителем
    const nodesWithParent = nodes.filter(node => node.parentId);

    if (nodesWithParent.length === 0) {
        console.log(`ℹ️ Нет вложенных узлов для проверки`);
        return;
    }

    console.log(`🔍 Проверка порядка ${nodesWithParent.length} узлов с родителями:`);

    let hasErrors = false;

    nodesWithParent.forEach(node => {
        const parentId = node.parentId;
        const parentInfo = nodeMap[parentId];
        const childInfo = nodeMap[node.id];

        console.log(`   Проверка узла ${node.id} с родителем ${parentId}:`);

        if (!parentInfo) {
            console.warn(`⚠️ Предупреждение: Родительский узел ${parentId} для узла ${node.id} не найден в массиве узлов`);
            hasErrors = true;
            return;
        }

        if (parentInfo.index > childInfo.index) {
            console.error(`❌ Ошибка порядка узлов: родительский узел ${parentId} (индекс ${parentInfo.index}) идет после дочернего узла ${node.id} (индекс ${childInfo.index})`);
            hasErrors = true;
        } else {
            console.log(`   ✅ Порядок правильный: родитель ${parentId} (индекс ${parentInfo.index}) идет перед дочерним элементом ${node.id} (индекс ${childInfo.index})`);
        }
    });

    if (!hasErrors) {
        console.log(`✅ Все узлы правильно упорядочены`);
    }
};

/**
 * Хук управления состоянием доски с узлами и соединениями.
 *
 * @param {object} params
 * @param {object} params.stompClient - клиент для отправки сообщений по WebSocket
 * @param {Function} params.publish - функция публикации с проверкой соединения
 * @param {boolean} params.connected - статус соединения WebSocket
 */
export const useBoardState = ({ stompClient, publish, connected }) => {
    // ------------- Основные состояния -------------
    const [nodes, setNodes, onNodesChangeInternal] = useNodesState([]);
    const [edges, setEdges, onEdgesChangeInternal] = useEdgesState([]);
    const [selectedElements, setSelectedElements] = useState([]);

    // ------------- Ссылки на данные -------------
    const originalNodesRef = useRef({});
    const pendingNodeUpdatesRef = useRef(new Set());
    const pendingConnectorUpdatesRef = useRef(new Set());
    const connectedRef = useRef(connected);
    // Добавляем ref для отслеживания последнего перемещенного узла для принудительного обновления
    const lastDraggedNodeRef = useRef(null);

    // ------------- Состояние изменений -------------
    // Централизованное управление изменениями в узлах
    const [nodeChanges, setNodeChanges] = useState({});

    // Используем хук для обновления внутренностей узлов
    const requestNodeUpdate = useUpdateNodeInternals();

    // Обновление статуса соединения
    useEffect(() => {
        connectedRef.current = connected;
    }, [connected]);

    // Безопасная публикация сообщений
    const safePublish = useSafePublish(connectedRef, publish);

    // ------------- Оптимизированные функции обновления -------------

    /**
     * Создает throttled-версию функции для ограничения частоты вызовов
     */
    const createThrottledFunction = useCallback((func, delay = 50) => {
        return throttle(func, delay);
    }, []);

    /**
     * Обновление состояния узла на сервере с throttle
     */
    const syncNodeWithServer = useCallback(
        throttle((node) => {
            const payload = nodeToItem(node);
            safePublish('/app/items/update', payload);
        }, 50),
        [safePublish]
    );

    // ------------- Преобразователи данных -------------

    /**
     * Преобразование коннектора в ребро графа
     */
    const convertConnectorToEdge = useCallback((connectorRs) => {
        return {
            id: String(connectorRs.id),
            source: String(connectorRs.startItem),
            target: String(connectorRs.endItem),
            type: 'floating',
            label: connectorRs.content,
            data: {
                style: connectorRs.style || {},
            },
        };
    }, []);

    /**
     * Подключение обработчиков к узлу
     */
    const enrichNodeWithHandlers = useCallback((node) => {
        return attachNodeHandlers(
            node,
            {
                updateNodeLabel: handleNodeLabelUpdate,
                updateNodeOnServer: syncNodeWithServer,
                removeNode: handleNodeRemoval,
                disableDragging: disableNodeDragging,
                enableDragging: enableNodeDragging,
                updateNodeStyle: throttledStyleUpdate,
                updateNodeGeometry: throttledGeometryUpdate,
                updateNodeData: throttledDataUpdate
            }
        );
    }, [
        syncNodeWithServer
        // Другие зависимости будут добавлены ниже после определения функций
    ]);

    // ------------- Управление узлами -------------

    /**
     * Обновление данных узла
     */
    const updateNodeData = useCallback((id, newData) => {
        setNodeChanges(prev => ({
            ...prev,
            data: { id, data: newData }
        }));
    }, []);

    /**
     * Обновление стиля узла
     */
    const updateNodeStyle = useCallback((id, newStyle) => {
        setNodeChanges(prev => ({
            ...prev,
            style: { id, style: newStyle }
        }));
    }, []);

    /**
     * Обновление геометрии узла
     */
    const updateNodeGeometry = useCallback((id, newSize) => {
        setNodeChanges(prev => ({
            ...prev,
            geometry: { id, ...newSize }
        }));
    }, []);

    /**
     * Обновление текстовой метки узла
     */
    const handleNodeLabelUpdate = useCallback((id, newLabel) => {
        setNodes((prevNodes) =>
            prevNodes.map((node) => {
                if (node.id !== id) return node;

                pendingNodeUpdatesRef.current.add(id);

                const updatedNode = {
                    ...node,
                    data: { ...node.data, label: newLabel }
                };

                const nodeWithHandlers = enrichNodeWithHandlers(updatedNode);
                syncNodeWithServer(nodeWithHandlers);

                return nodeWithHandlers;
            })
        );
    }, [setNodes]);

    /**
     * Удаление узла
     */
    const handleNodeRemoval = useCallback((nodeId) => {
        setNodes((prevNodes) => prevNodes.filter((node) => node.id !== nodeId));
        setEdges((prevEdges) =>
            prevEdges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
        );
    }, [setNodes, setEdges]);

    /**
     * Удаление узла из WebSocket-сообщения
     */
    const handleNodeRemoveFromServer = useCallback((nodeId) => {
        // Если узел удален локально, игнорируем WS-обновление
        if (pendingNodeUpdatesRef.current.has(nodeId)) {
            pendingNodeUpdatesRef.current.delete(nodeId);
            return;
        }

        setNodes((prevNodes) => prevNodes.filter((node) => node.id !== nodeId));
        setEdges((prevEdges) =>
            prevEdges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
        );
    }, [setNodes, setEdges]);

    /**
     * Отключение возможности перетаскивания узла
     */
    const disableNodeDragging = useCallback((nodeId) => {
        setNodes((prevNodes) =>
            prevNodes.map((node) =>
                node.id === nodeId ? { ...node, draggable: false } : node
            )
        );
    }, [setNodes]);

    /**
     * Включение возможности перетаскивания узла
     */
    const enableNodeDragging = useCallback((nodeId) => {
        setNodes((prevNodes) =>
            prevNodes.map((node) =>
                node.id === nodeId ? { ...node, draggable: true } : node
            )
        );
    }, [setNodes]);

    // Создаем throttled-версии функций
    const throttledDataUpdate = useCallback(
        createThrottledFunction((id, newData) => updateNodeData(id, newData)),
        [updateNodeData, createThrottledFunction]
    );

    const throttledStyleUpdate = useCallback(
        createThrottledFunction((id, newStyle) => updateNodeStyle(id, newStyle)),
        [updateNodeStyle, createThrottledFunction]
    );

    const throttledGeometryUpdate = useCallback(
        createThrottledFunction((id, newSize) => updateNodeGeometry(id, newSize)),
        [updateNodeGeometry, createThrottledFunction]
    );

    // Обновляем зависимости для enrichNodeWithHandlers после определения всех функций
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const enrichNodeWithHandlersDeps = [
        handleNodeLabelUpdate,
        syncNodeWithServer,
        handleNodeRemoval,
        disableNodeDragging,
        enableNodeDragging,
        throttledStyleUpdate,
        throttledGeometryUpdate,
        throttledDataUpdate
    ];

    // ------------- Операции с узлами -------------

    /**
     * Создание нового узла
     */
    const createNode = useCallback((boardIdForNode, type, position) => {
        const { data, style, width, height } = getDefaultItem(type);
        const payload = {
            boardId: boardIdForNode,
            type,
            position: new Position(position),
            geometry: new Geometry({ width, height, rotation: 0 }),
            data: { ...data, dataType: type, label: data.label || '' },
            style: { ...style, styleType: type },
        };

        safePublish('/app/items/create', payload);
    }, [safePublish]);

    /**
     * Удаление последнего узла
     */
    const removeLastNode = useCallback(() => {
        setNodes((prevNodes) => {
            if (prevNodes.length === 0) return prevNodes;

            const nodeIdToRemove = prevNodes[prevNodes.length - 1].id;

            setEdges((prevEdges) =>
                prevEdges.filter((edge) =>
                    edge.source !== nodeIdToRemove && edge.target !== nodeIdToRemove
                )
            );

            return prevNodes.slice(0, -1);
        });
    }, [setNodes, setEdges]);

    /**
     * Обработка события начала перетаскивания узла
     */
    const handleNodeDragStart = useCallback((event, node) => {
        setNodes((nds) =>
            nds.map((n) =>
                n.id === node.id ? { ...n, selected: true } : n
            )
        );
    }, [setNodes]);

    /**
     * Обработка события окончания перетаскивания узла
     */
    const handleNodeDragEnd = useCallback((_, draggedNode) => {
        pendingNodeUpdatesRef.current.add(draggedNode.id);
        
        // Отправка обновленного узла на сервер
        console.log(`✅ Отправка обновленного узла ${draggedNode.id}`, draggedNode);
        syncNodeWithServer(draggedNode);
        
        // Сортируем узлы для обеспечения правильного порядка родитель-дочерний
        setNodes(prevNodes => {
            // Сохраняем выделение
            const updatedNodes = prevNodes.map((n) => (n.id === draggedNode.id ? { ...n, selected: true } : n));
            const sortedNodes = sortNodesWithParentsFirst(updatedNodes);
            return sortedNodes;
        });
    }, [syncNodeWithServer, setNodes]);

    /**
     * Обновление узла из WebSocket-сообщения
     */
    const handleNodeUpdateFromServer = useCallback((item) => {
        const newNode = itemToNode(item);
        
        setNodes((prevNodes) => {
            const idx = prevNodes.findIndex((n) => n.id === newNode.id);
            
            // Если узел обновлён локально, игнорируем WS-обновление
            if (idx >= 0 && pendingNodeUpdatesRef.current.has(newNode.id)) {
                pendingNodeUpdatesRef.current.delete(newNode.id);
                return prevNodes;
            }
            
            const nodeWithFunctions = enrichNodeWithHandlers(
                { ...newNode, draggable: true, selected: idx >= 0 ? prevNodes[idx].selected : false }
            );
            
            originalNodesRef.current[newNode.id] = nodeWithFunctions;
            
            let updatedNodes;
            if (idx >= 0) {
                // Обновляем существующий узел
                updatedNodes = [...prevNodes];
                updatedNodes[idx] = nodeWithFunctions;
            } else {
                // Добавляем новый узел
                updatedNodes = [...prevNodes, nodeWithFunctions];
            }
            
            // Сортируем узлы для обеспечения правильного порядка
            const sortedNodes = sortNodesWithParentsFirst(updatedNodes);
            return sortedNodes;
        });
    }, [setNodes, enrichNodeWithHandlers]);

    /**
     * Обработчик события удаления узлов в React Flow
     */
    const handleNodesDelete = useCallback((nodesToDelete) => {
        nodesToDelete.forEach((node) => {
            const nodeId = node.id;
            if (nodeId) {
                console.log("ВЫЗЫВАМ УДАЛЕНИЕ NODE")
                pendingNodeUpdatesRef.current.add(nodeId);
                safePublish('/app/items/delete', nodeId);
            }
        });
    }, [safePublish]);

    // ------------- Операции с соединениями -------------

    /**
     * Установка данных соединений
     */
    const setConnections = useCallback((connectors) => {
        const loadedEdges = connectors.map((connector) => convertConnectorToEdge(connector));
        setEdges(loadedEdges);
    }, [setEdges, convertConnectorToEdge]);

    /**
     * Добавление или обновление соединения из WebSocket-сообщения
     */
    const handleConnectionUpdateFromServer = useCallback((connectorRs) => {
        const connectorId = parseInt(connectorRs.id, 10);
        
        setEdges((prevEdges) => {
            // Если соединение обновлено локально, игнорируем WS-обновление
            if (pendingConnectorUpdatesRef.current.has(connectorId)) {
                pendingConnectorUpdatesRef.current.delete(connectorId);
                return prevEdges;
            }
            
            const stringId = String(connectorId);
            const existingIndex = prevEdges.findIndex((e) => e.id === stringId);
            const newEdge = convertConnectorToEdge(connectorRs);
            
            if (existingIndex >= 0) {
                // Обновляем существующее соединение
                const updated = [...prevEdges];
                updated[existingIndex] = newEdge;
                return updated;
            } else {
                // Добавляем новое соединение
                return [...prevEdges, newEdge];
            }
        });
    }, [setEdges, convertConnectorToEdge]);

    /**
     * Удаление соединения из WebSocket-сообщения
     */
    const handleConnectionRemoveFromServer = useCallback((connectorId) => {
        // Если соединение удалено локально, игнорируем WS-обновление
        if (pendingConnectorUpdatesRef.current.has(connectorId)) {
            pendingConnectorUpdatesRef.current.delete(connectorId);
            return;
        }
        
        setEdges((prevEdges) => prevEdges.filter((e) => e.id !== connectorId));
    }, [setEdges]);

    /**
     * Создание нового соединения
     */
    const createConnection = useCallback((params) => {
        const payload = {
            startItem: params.source,
            endItem: params.target,
            content: '',
        };

        safePublish('/app/connectors/create', payload);
    }, [safePublish]);

    /**
     * Удаление соединения на сервере
     */
    const deleteConnectionOnServer = useCallback((connectorId) => {
        safePublish('/app/connectors/delete', connectorId);
    }, [safePublish]);

    /**
     * Обновление соединения на сервере
     */
    const syncConnectionWithServer = useCallback((connector) => {
        const payload = {
            id: connector.id,
            startItem: connector.source,
            endItem: connector.target,
            content: connector.label || '',
            style: connector.data?.style || {},
        };

        safePublish('/app/connectors/update', payload);
    }, [safePublish]);

    /**
     * Загрузка данных соединений с сервера
     */
    const loadConnectionData = useCallback((targetBoardId) => {
        safePublish('/app/connectors/load', targetBoardId);
    }, [safePublish]);

    /**
     * Обработчик события удаления рёбер в React Flow
     */
    const handleEdgesDelete = useCallback((edgesToDelete) => {
        edgesToDelete.forEach((edge) => {
            const connectorId = edge.id;
            if (!isNaN(connectorId)) {
                console.log("ВЫЗЫВАМ УДАЛЕНИЕ EDGE")
                pendingConnectorUpdatesRef.current.add(connectorId);
                safePublish('/app/connectors/delete', connectorId);
                // deleteConnectionOnServer(connectorId);
            }
        });
    }, [safePublish]);

    // ------------- Загрузка данных -------------

    /**
     * Загрузка данных доски с сервера
     */
    const loadBoardData = useCallback((targetBoardId) => {
        safePublish('/app/board/load', targetBoardId);
    }, [safePublish]);

    /**
     * Установка полных данных доски из WebSocket-сообщения
     */
    const handleBoardDataFromServer = useCallback((fullData) => {
        const { items = [], connectors = [] } = fullData;
        
        // Парсим все элементы
        const parsedItems = items.map((raw) => ItemRs.fromServer(raw));
        
        // Сортируем элементы для правильного порядка отображения
        const sortedItems = sortItemsWithParentsFirst(parsedItems);
        
        // Создаем узлы с обработчиками
        const loadedNodes = sortedItems.map((item) => {
            const baseNode = itemToNode(item);
            const nodeWithFunctions = enrichNodeWithHandlers({ ...baseNode, draggable: true });
            originalNodesRef.current[nodeWithFunctions.id] = nodeWithFunctions;
            return nodeWithFunctions;
        });
        
        // Парсим и настраиваем соединения
        const loadedEdges = connectors.map((conn) => ({
            id: String(conn.id),
            source: String(conn.startItem),
            target: String(conn.endItem),
            type: 'floating',
            label: conn.content,
            data: { style: conn.style || {} },
        }));
        
        // Обновляем состояние
        setNodes(loadedNodes);
        setEdges(loadedEdges);
        console.log(loadedNodes);
    }, [setNodes, setEdges, enrichNodeWithHandlers]);

    // ------------- Обработчики событий React Flow -------------

    /**
     * Обработчик события соединения узлов
     */
    const handleConnect = useCallback((params) => {
        createConnection(params);
        setEdges((prevEdges) => addEdge({ ...params, type: 'floating' }, prevEdges));
    }, [setEdges, createConnection]);

    /**
     * Обработчик события обновления ребра
     */
    const handleEdgeUpdate = useCallback((oldEdge, newConnection) => {
        setEdges((prevEdges) => applyEdgeChanges(oldEdge, newConnection, prevEdges));
    }, [setEdges]);

    /**
     * Обработчик изменения выделения
     */
    const handleSelectionChange = useCallback((elements) => {
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

    // ------------- Обработка изменений через useEffect -------------

    /**
     * Обработка изменений стиля узла
     */
    useEffect(() => {
        if (!nodeChanges.style) return;

        const { id, style } = nodeChanges.style;

        setNodes(prevNodes =>
            prevNodes.map(node => {
                if (node.id !== id) return node;

                pendingNodeUpdatesRef.current.add(id);

                const updatedNode = {
                        ...node,
                        data: {
                            ...node.data,
                        style: { ...node.data.style, ...style }
                    }
                };

                const nodeWithHandlers = enrichNodeWithHandlers(updatedNode);
                syncNodeWithServer(nodeWithHandlers);

                return { ...nodeWithHandlers, selected: node.selected };
            })
        );

        // Сбрасываем изменение после применения
        setNodeChanges(prev => ({ ...prev, style: null }));
    }, [nodeChanges.style, setNodes, syncNodeWithServer, enrichNodeWithHandlers]);

    /**
     * Обработка изменений данных узла
     */
    useEffect(() => {
        if (!nodeChanges.data) return;

        const { id, data } = nodeChanges.data;

        setNodes(prevNodes =>
            prevNodes.map(node => {
                if (node.id !== id) return node;

                pendingNodeUpdatesRef.current.add(id);

                const updatedNode = {
                        ...node,
                        data: {
                            ...node.data,
                        ...data
                    }
                };

                const nodeWithHandlers = enrichNodeWithHandlers(updatedNode);
                syncNodeWithServer(nodeWithHandlers);

                return { ...nodeWithHandlers, selected: node.selected };
            })
        );

        // Сбрасываем изменение после применения
        setNodeChanges(prev => ({ ...prev, data: null }));
    }, [nodeChanges.data, setNodes, syncNodeWithServer, enrichNodeWithHandlers]);

    /**
     * Обработка изменений геометрии узла
     */
    useEffect(() => {
        if (!nodeChanges.geometry) return;

        const { id, width, height } = nodeChanges.geometry;

        setNodes(prevNodes =>
            prevNodes.map(node => {
                if (node.id !== id) return node;

                pendingNodeUpdatesRef.current.add(id);

                const updatedNode = {
                        ...node,
                    // Обновляем как data.geometry, так и габариты узла если необходимо
                        data: {
                            ...node.data,
                        geometry: {
                            ...node.data.geometry,
                            width: width || node.data.geometry.width,
                            height: height || node.data.geometry.height
                        }
                    }
                };

                const nodeWithHandlers = enrichNodeWithHandlers(updatedNode);
                syncNodeWithServer(nodeWithHandlers);

                return { ...nodeWithHandlers, selected: node.selected };
            })
        );

        // Сбрасываем изменение после применения
        setNodeChanges(prev => ({ ...prev, geometry: null }));
    }, [nodeChanges.geometry, setNodes, syncNodeWithServer, enrichNodeWithHandlers]);

    // Принудительное обновление узла, если недавно перемещен внутри фрейма
    useEffect(() => {
        const draggedNodeId = lastDraggedNodeRef.current;
        if (draggedNodeId) {
            // Сбрасываем после использования
            lastDraggedNodeRef.current = null;

            // Принудительное обновление узла для правильного отображения
            setTimeout(() => {
                setNodes((prevNodes) => {
                    const nodeToUpdate = prevNodes.find(n => n.id === draggedNodeId);
                    if (nodeToUpdate && nodeToUpdate.parentId) {
                        console.log(`🔄 Принудительное обновление узла ${draggedNodeId} внутри фрейма ${nodeToUpdate.parentId}`);

                        // Запрашиваем обновление внутренностей узла
                        requestNodeUpdate(draggedNodeId);

                        return [...prevNodes]; // Создаем новый массив для триггера обновления React
                    }
                    return prevNodes;
                });
            }, 50); // Небольшая задержка для обновления DOM
        }
    }, [setNodes, requestNodeUpdate]);

    // ------------- Возвращаемые значения и функции -------------
    return {
        // Состояния
        nodes,
        edges,
        
        // Обработчики событий React Flow
        onNodesChange: onNodesChangeInternal,
        onEdgesChange: onEdgesChangeInternal,
        onConnect: handleConnect,
        onEdgeUpdate: handleEdgeUpdate,
        onSelectionChange: handleSelectionChange,
        onNodeDragStart: handleNodeDragStart,
        onNodeDragStop: handleNodeDragEnd,
        onEdgesDelete: handleEdgesDelete,
        onNodesDelete: handleNodesDelete,
        
        // Операции с узлами
        createNewNode: createNode,
        removeNode: handleNodeRemoval,
        removeLastNode,
        updateNodeGeometry,
        
        // Обработчики обновлений с сервера
        handleNodeUpdateFromServer,
        handleNodeRemoveFromServer,
        handleConnectionUpdateFromServer,
        handleConnectionRemoveFromServer,
        handleBoardDataFromServer,
        
        // Операции с соединениями
        createConnector: createConnection,
        deleteConnectorOnServer: deleteConnectionOnServer,
        updateConnectorOnServer: syncConnectionWithServer,
        
        // Операции с данными доски
        loadBoardData,
        loadConnectorData: loadConnectionData
    };
};
