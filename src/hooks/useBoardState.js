import { useCallback, useEffect, useState, useRef } from 'react';
import { useNodesState, useEdgesState, addEdge, applyEdgeChanges } from '@xyflow/react';
import { getDefaultItem } from '../utils/boardUtils';
import { itemToNode, nodeToItem } from '../utils/itemMapper';
import { Position, Geometry, ItemRs } from '../model/ItemDto';
import { useSafePublish } from './useSafePublish';
import { attachNodeHandlers } from '../utils/nodeHelpers';
import { throttle } from "lodash";
import { useUpdateNodeInternals } from './useUpdateNodeInternals';


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


export const sortNodesWithParentsFirst = (nodes) => {
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
        Object.entries(parentChildMap).forEach(() => {
        });
    } else {
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
    }

    return sorted;
};


const checkNodesOrder = (nodes) => {

    const nodeMap = {};
    nodes.forEach((node, index) => {
        nodeMap[node.id] = { node, index };
    });

    // Проверяем каждый узел с родителем
    const nodesWithParent = nodes.filter(node => node.parentId);

    if (nodesWithParent.length === 0) {
        return;
    }


    let hasErrors = false;

    nodesWithParent.forEach(node => {
        const parentId = node.parentId;
        const parentInfo = nodeMap[parentId];
        const childInfo = nodeMap[node.id];


        if (!parentInfo) {
            console.warn(`⚠️ Предупреждение: Родительский узел ${parentId} для узла ${node.id} не найден в массиве узлов`);
            hasErrors = true;
            return;
        }

        if (parentInfo.index > childInfo.index) {
            hasErrors = true;
        } else {
        }
    });

    if (!hasErrors) {
    }
};


export const useBoardState = ({ publish, connected }) => {
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

    // Обновление статуса соединения
    useEffect(() => {
        connectedRef.current = connected;
    }, [connected]);

    // Безопасная публикация сообщений
    const safePublish = useSafePublish(connectedRef, publish);

    // ------------- Оптимизированные функции обновления -------------


    const createRateLimitedFunction = useCallback((func, delay = 50) => {
        return throttle(func, delay);
    }, []);


    const sendNodeUpdateToServer = useCallback(
        throttle((node) => {
            const payload = nodeToItem(node);
            safePublish('/app/items/update', payload);
        }, 50),
        [safePublish]
    );

    // ------------- Преобразователи данных -------------


    const transformConnectorToEdge = useCallback((connectorRs) => {
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

    const handleNodeLabelChange = useCallback((id, newLabel) => {
        setNodes((prevNodes) =>
            prevNodes.map((node) => {
                if (node.id !== id) return node;

                pendingNodeUpdatesRef.current.add(id);

                const updatedNode = {
                    ...node,
                    data: { ...node.data, label: newLabel }
                };

                const nodeWithHandlers = attachNodeHandlers(updatedNode);
                sendNodeUpdateToServer(nodeWithHandlers);

                return nodeWithHandlers;
            })
        );
    }, [setNodes]);

    const handleNodeDelete = useCallback((nodeId) => {
        setNodes((prevNodes) => prevNodes.filter((node) => node.id !== nodeId));
        setEdges((prevEdges) =>
            prevEdges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
        );
    }, [setNodes, setEdges]);



    // ------------- Управление узлами -------------


    const queueNodeDataUpdate = useCallback((id, newData) => {
        setNodeChanges(prev => ({
            ...prev,
            data: { id, data: newData }
        }));
    }, []);


    const queueNodeStyleUpdate = useCallback((id, newStyle) => {
        setNodeChanges(prev => ({
            ...prev,
            style: { id, style: newStyle }
        }));
    }, []);


    const queueNodeSizeUpdate = useCallback((id, newSize) => {
        setNodeChanges(prev => ({
            ...prev,
            geometry: { id, ...newSize }
        }));
    }, []);





    const handleServerNodeDelete = useCallback((nodeId) => {
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


    const disableNodeDrag = useCallback((nodeId) => {
        setNodes((prevNodes) =>
            prevNodes.map((node) =>
                node.id === nodeId ? { ...node, draggable: false } : node
            )
        );
    }, [setNodes]);


    const enableNodeDrag = useCallback((nodeId) => {
        setNodes((prevNodes) =>
            prevNodes.map((node) =>
                node.id === nodeId ? { ...node, draggable: true } : node
            )
        );
    }, [setNodes]);

    /**
     * Отсоединяет узел от родительского фрейма
     * @param {string} nodeId - ID узла, который нужно открепить
     */
    const detachNodeFromParentFrame = useCallback((nodeId) => {
        setNodes(prev => {
            const node = prev.find(n => n.id === nodeId);
            if (!node || !node.parentId) return prev; // Если узла нет или у него нет родителя, ничего не делаем
            
            // Вычисляем абсолютные координаты узла
            const parentNode = prev.find(n => n.id === node.parentId);
            if (!parentNode) return prev;
            
            // Получаем абсолютную позицию родителя
            const parentPos = calculateNodeAbsolutePosition(parentNode, prev);
            
            // Вычисляем абсолютную позицию узла
            const absolutePosition = {
                x: parentPos.x + node.position.x,
                y: parentPos.y + node.position.y
            };
            
            console.log(`Откреплен узел ${nodeId} от фрейма ${node.parentId}, новая позиция: (${absolutePosition.x}, ${absolutePosition.y})`);
            
            // Создаем обновленный узел
            const updatedNode = {
                ...node,
                parentId: undefined,
                parentNode: undefined,
                extent: undefined,
                position: absolutePosition,
                data: {
                    ...node.data,
                    position: absolutePosition
                }
            };
            
            // Синхронизируем с сервером
            sendNodeUpdateToServer(updatedNode);
            
            // Обновляем состояние
            return sortNodesWithParentsFirst(
                prev.map(n => n.id === nodeId ? updatedNode : n)
            );
        });
    }, [setNodes, sendNodeUpdateToServer]);

    // Создаем throttled-версии функций с более понятными именами
    const updateNodeDataWithRateLimit = useCallback(
        createRateLimitedFunction((id, newData) => queueNodeDataUpdate(id, newData)),
        [queueNodeDataUpdate, createRateLimitedFunction]
    );

    const updateNodeStyleWithRateLimit = useCallback(
        createRateLimitedFunction((id, newStyle) => queueNodeStyleUpdate(id, newStyle)),
        [queueNodeStyleUpdate, createRateLimitedFunction]
    );

    const updateNodeSizeWithRateLimit = useCallback(
        createRateLimitedFunction((id, newSize) => queueNodeSizeUpdate(id, newSize)),
        [queueNodeSizeUpdate, createRateLimitedFunction]
    );

    // ------------- Операции с узлами -------------


    const createNodeOnServer = useCallback((boardIdForNode, type, position) => {
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


    const removeLastAddedNode = useCallback(() => {
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


    const handleNodeDragStart = useCallback((event, node) => {
        setNodes((nds) =>
            nds.map((n) =>
                n.id === node.id ? { ...n, selected: true } : n
            )
        );
    }, [setNodes]);

    /**
     * Проверяет пересечение двух прямоугольников
     * @param {Object} rect1 - Первый прямоугольник {x, y, width, height}
     * @param {Object} rect2 - Второй прямоугольник {x, y, width, height} 
     * @returns {boolean} true, если прямоугольники пересекаются
     */
    const checkRectIntersection = (rect1, rect2) => {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    };

    /**
     * Проверяет полное вхождение первого прямоугольника во второй
     * @param {Object} inner - Внутренний прямоугольник {x, y, width, height}
     * @param {Object} outer - Внешний прямоугольник {x, y, width, height}
     * @returns {boolean} true, если inner полностью находится внутри outer
     */
    const checkRectContainment = (inner, outer) => {
        return (
            inner.x >= outer.x &&
            inner.y >= outer.y &&
            inner.x + inner.width <= outer.x + outer.width &&
            inner.y + inner.height <= outer.y + outer.height
        );
    };

    /**
     * Обрабатывает перемещение узла во время перетаскивания
     * Только обновляет позицию, без прикрепления к фрейму
     */
    const handleNodeDrag = useCallback((event, draggedNode) => {
        // Обновляем position в data для отображения корректных координат
        setNodes(prev =>
            prev.map(n => {
                if (n.id !== draggedNode.id) return n;
                
                return {
                    ...n,
                    data: {
                        ...n.data,
                        position: draggedNode.position
                    }
                };
            })
        );
        console.log("ПЕРЕМЕЩЕНИЕ УЗЛА");
    }, [setNodes]);

    /**
     * Обрабатывает завершение перетаскивания узла
     * Здесь происходит прикрепление к фрейму, если узел находится внутри него
     */
    const handleNodeDragEnd = useCallback((event, draggedNode) => {
        console.log("ЗАВЕРШЕНИЕ ПЕРЕТАСКИВАНИЯ УЗЛА");
        pendingNodeUpdatesRef.current.add(draggedNode.id);
        
        // Получаем размеры и позицию перетаскиваемого узла
        const nodeWidth = draggedNode.width || draggedNode.data?.geometry?.width || 100;
        const nodeHeight = draggedNode.height || draggedNode.data?.geometry?.height || 100;
        const nodePosition = draggedNode.position;
        
        // Обрабатываем только узлы без родителя для проверки пересечения с фреймами
        if (!draggedNode.parentId) {
            // Создаем прямоугольник для узла
            const nodeRect = {
                x: nodePosition.x,
                y: nodePosition.y,
                width: nodeWidth,
                height: nodeHeight
            };
            
            // Получаем все фреймы, кроме текущего узла и его потомков
            const frames = nodes.filter(n => 
                n.type === 'frame' && 
                n.id !== draggedNode.id && 
                !checkIfNodeIsAncestor(draggedNode.id, n.id, nodes)
            );
            
            // Проверяем пересечение с каждым фреймом
            for (const frame of frames) {
                // Получаем размеры фрейма
                const frameWidth = frame.width || frame.data?.geometry?.width || 300;
                const frameHeight = frame.height || frame.data?.geometry?.height || 200;
                
                // Получаем позицию фрейма
                const framePos = { x: frame.position.x, y: frame.position.y };
                
                // Создаем прямоугольник для фрейма
                const frameRect = {
                    x: framePos.x,
                    y: framePos.y,
                    width: frameWidth,
                    height: frameHeight
                };
                
                // Проверяем полное вхождение узла во фрейм
                const isContained = checkRectContainment(nodeRect, frameRect);
                
                if (isContained) {
                    console.log(`Прикрепляем узел ${draggedNode.id} к фрейму ${frame.id}`);
                    
                    // Вычисляем относительную позицию внутри фрейма
                    const relativePosition = {
                        x: nodeRect.x - framePos.x,
                        y: nodeRect.y - framePos.y
                    };
                    
                    // Обновляем узел
                    setNodes(prev =>
                        prev.map(n => {
                            if (n.id !== draggedNode.id) return n;
                            
                            const updated = {
                                ...n,
                                parentId: frame.id,
                                extent: 'parent',
                                position: relativePosition,
                                data: {
                                    ...n.data,
                                    position: relativePosition
                                }
                            };
                            console.log(updated);
                            
                            sendNodeUpdateToServer(updated);
                            return updated;
                        })
                    );
                    
                    // Выходим из цикла после нахождения подходящего фрейма
                    return;
                }
            }
        }
        
        // Базовое обновление: просто синхронизируем новые координаты
        setNodes(prev =>
            prev.map(n => {
                if (n.id !== draggedNode.id) return n;
                
                // Обновляем также data.position
                const updated = {
                    ...n,
                    data: {
                        ...n.data,
                        position: nodePosition
                    }
                };
                
                sendNodeUpdateToServer(updated);
                return updated;
            })
        );
        
        // Сортируем для правильного порядка рендеринга
        setNodes(prev =>
            sortNodesWithParentsFirst(
                prev.map(n =>
                    n.id === draggedNode.id ? { ...n, selected: true } : n
                )
            )
        );
        
        lastDraggedNodeRef.current = draggedNode.id;
    }, [nodes, setNodes, sendNodeUpdateToServer]);

    
    const attachHandlersToNode = useCallback((node) => {
        return attachNodeHandlers(
            node,
            {
                updateNodeLabel: handleNodeLabelChange,
                updateNodeOnServer: sendNodeUpdateToServer,
                removeNode: handleNodeDelete,
                disableDragging: disableNodeDrag,
                enableDragging: enableNodeDrag,
                updateNodeStyle: updateNodeStyleWithRateLimit,
                updateNodeGeometry: updateNodeSizeWithRateLimit,
                updateNodeData: updateNodeDataWithRateLimit,
                detachFromParent: detachNodeFromParentFrame
            }
        );
    }, [
        sendNodeUpdateToServer,
        handleNodeLabelChange,
        handleNodeDelete,
        disableNodeDrag,
        enableNodeDrag,
        updateNodeStyleWithRateLimit,
        updateNodeSizeWithRateLimit,
        updateNodeDataWithRateLimit,
        detachNodeFromParentFrame
    ]);


    /**
     * Возвращает абсолютную позицию узла в координатах канваса,
     * суммируя его позицию и позиции всех родителей.
     *
     * @param {{ id: string, position: { x: number, y: number }, parentNode?: string }} targetNode
     * @param {Array} allNodes — массив всех узлов
     * @returns {{ x: number, y: number }}
     */
    const calculateNodeAbsolutePosition = (targetNode, allNodes) => {
        // 1) Строим карту id → узел
        const nodeMap = new Map(allNodes.map(n => [n.id, n]));

        // 2) Рекурсивная функция подсчёта
        const computePos = (node, visited = new Set()) => {
            // Защита от циклов
            if (visited.has(node.id)) {
                console.warn(`Циклическая ссылка в родителях узла ${node.id}`);
                return { x: 0, y: 0 };
            }
            visited.add(node.id);

            const { x, y } = node.position;

            // Базовый случай — нет родителя
            if (!node.parentNode) {
                return { x, y };
            }

            const parent = nodeMap.get(node.parentNode);
            if (!parent) {
                console.warn(`Родитель ${node.parentNode} для узла ${node.id} не найден`);
                return { x, y };
            }

            const parentPos = computePos(parent, visited);
            return {
                x: parentPos.x + x,
                y: parentPos.y + y
            };
        };

        return computePos(targetNode);
    };


    // Функция для проверки, является ли один узел предком другого
    const checkIfNodeIsAncestor = (potentialAncestorId, nodeId, allNodes) => {
        let currentNode = allNodes.find(n => n.id === nodeId);
        
        while (currentNode && currentNode.parentNode) {
            if (currentNode.parentNode === potentialAncestorId) {
                return true;
            }
            currentNode = allNodes.find(n => n.id === currentNode.parentNode);
        }
        
        return false;
    };

    const handleServerNodeUpdate = useCallback((item) => {
        const newNode = itemToNode(item);
        
        setNodes((prevNodes) => {
            const idx = prevNodes.findIndex((n) => n.id === newNode.id);
            
            // Если узел обновлён локально, игнорируем WS-обновление
            if (idx >= 0 && pendingNodeUpdatesRef.current.has(newNode.id)) {
                pendingNodeUpdatesRef.current.delete(newNode.id);
                return prevNodes;
            }
            
            const nodeWithFunctions = attachHandlersToNode(
                { ...newNode, draggable: true, selected: idx >= 0 ? prevNodes[idx].selected : false }
            );
            if (nodeWithFunctions.parentId) {
                nodeWithFunctions.extent = "parent";
            }
            
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
    }, [setNodes, attachHandlersToNode]);


    const handleMultipleNodesDelete = useCallback((nodesToDelete) => {
        nodesToDelete.forEach((node) => {
            const nodeId = node.id;
            if (nodeId) {
                pendingNodeUpdatesRef.current.add(nodeId);
                safePublish('/app/items/delete', nodeId);
            }
        });
    }, [safePublish]);

    // ------------- Операции с соединениями -------------




    const handleServerConnectionUpdate = useCallback((connectorRs) => {
        const connectorId = parseInt(connectorRs.id, 10);
        
        setEdges((prevEdges) => {
            // Если соединение обновлено локально, игнорируем WS-обновление
            if (pendingConnectorUpdatesRef.current.has(connectorId)) {
                pendingConnectorUpdatesRef.current.delete(connectorId);
                return prevEdges;
            }
            
            const stringId = String(connectorId);
            const existingIndex = prevEdges.findIndex((e) => e.id === stringId);
            const newEdge = transformConnectorToEdge(connectorRs);
            
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
    }, [setEdges, transformConnectorToEdge]);


    const handleServerConnectionDelete = useCallback((connectorId) => {
        // Если соединение удалено локально, игнорируем WS-обновление
        if (pendingConnectorUpdatesRef.current.has(connectorId)) {
            pendingConnectorUpdatesRef.current.delete(connectorId);
            return;
        }
        
        setEdges((prevEdges) => prevEdges.filter((e) => e.id !== connectorId));
    }, [setEdges]);


    const createConnectionOnServer = useCallback((params) => {
        const payload = {
            startItem: params.source,
            endItem: params.target,
            content: '',
        };

        safePublish('/app/connectors/create', payload);
    }, [safePublish]);


    const deleteConnectionOnServer = useCallback((connectorId) => {
        safePublish('/app/connectors/delete', connectorId);
    }, [safePublish]);


    const sendConnectionUpdateToServer = useCallback((connector) => {
        const payload = {
            id: connector.id,
            startItem: connector.source,
            endItem: connector.target,
            content: connector.label || '',
            style: connector.data?.style || {},
        };

        safePublish('/app/connectors/update', payload);
    }, [safePublish]);


    const requestConnectionsFromServer = useCallback((targetBoardId) => {
        safePublish('/app/connectors/load', targetBoardId);
    }, [safePublish]);


    const handleMultipleEdgesDelete = useCallback((edgesToDelete) => {
        edgesToDelete.forEach((edge) => {
            const connectorId = edge.id;
            if (!isNaN(connectorId)) {
                pendingConnectorUpdatesRef.current.add(connectorId);
                safePublish('/app/connectors/delete', connectorId);
            }
        });
    }, [safePublish]);

    // ------------- Загрузка данных -------------


    const requestBoardDataFromServer = useCallback((targetBoardId) => {
        safePublish('/app/board/load', targetBoardId);
    }, [safePublish]);


    const initializeBoardFromServerData = useCallback((fullData) => {
        const { items = [], connectors = [] } = fullData;
        
        // Парсим все элементы
        const parsedItems = items.map((raw) => ItemRs.fromServer(raw));
        
        // Сортируем элементы для правильного порядка отображения
        const sortedItems = sortItemsWithParentsFirst(parsedItems);
        
        // Создаем узлы с обработчиками
        const loadedNodes = sortedItems.map((item) => {
            const baseNode = itemToNode(item);
            if (baseNode.parentId) {
                baseNode.extent = "parent";
            }
            const nodeWithFunctions = attachHandlersToNode({ ...baseNode, draggable: true });
            originalNodesRef.current[nodeWithFunctions.id] = nodeWithFunctions;
            console.log(nodeWithFunctions)
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
    }, [setNodes, setEdges, attachHandlersToNode]);

    // ------------- Обработчики событий React Flow -------------


    const handleConnect = useCallback((params) => {
        createConnectionOnServer(params);
        setEdges((prevEdges) => addEdge({ ...params, type: 'floating' }, prevEdges));
    }, [setEdges, createConnectionOnServer]);


    const handleEdgeUpdate = useCallback((oldEdge, newConnection) => {
        setEdges((prevEdges) => applyEdgeChanges(oldEdge, newConnection, prevEdges));
    }, [setEdges]);


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

                const nodeWithHandlers = attachHandlersToNode(updatedNode);
                sendNodeUpdateToServer(nodeWithHandlers);

                return { ...nodeWithHandlers, selected: node.selected };
            })
        );

        // Сбрасываем изменение после применения
        setNodeChanges(prev => ({ ...prev, style: null }));
    }, [nodeChanges.style, setNodes, sendNodeUpdateToServer, attachHandlersToNode]);


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

                const nodeWithHandlers = attachHandlersToNode(updatedNode);
                sendNodeUpdateToServer(nodeWithHandlers);

                return { ...nodeWithHandlers, selected: node.selected };
            })
        );

        // Сбрасываем изменение после применения
        setNodeChanges(prev => ({ ...prev, data: null }));
    }, [nodeChanges.data, setNodes, sendNodeUpdateToServer, attachHandlersToNode]);


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

                const nodeWithHandlers = attachHandlersToNode(updatedNode);
                sendNodeUpdateToServer(nodeWithHandlers);

                return { ...nodeWithHandlers, selected: node.selected };
            })
        );

        // Сбрасываем изменение после применения
        setNodeChanges(prev => ({ ...prev, geometry: null }));
    }, [nodeChanges.geometry, setNodes, sendNodeUpdateToServer, attachHandlersToNode]);

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
        onNodeDrag: handleNodeDrag,
        onNodeDragStop: handleNodeDragEnd,
        onEdgesDelete: handleMultipleEdgesDelete,
        onNodesDelete: handleMultipleNodesDelete,
        
        // Операции с узлами
        createNewNode: createNodeOnServer,
        removeNode: handleNodeDelete,
        removeLastNode: removeLastAddedNode,
        updateNodeGeometry: queueNodeSizeUpdate,
        
        // Обработчики обновлений с сервера
        handleNodeUpdateFromServer: handleServerNodeUpdate,
        handleNodeRemoveFromServer: handleServerNodeDelete,
        handleConnectionUpdateFromServer: handleServerConnectionUpdate,
        handleConnectionRemoveFromServer: handleServerConnectionDelete,
        handleBoardDataFromServer: initializeBoardFromServerData,
        
        // Операции с соединениями
        createConnector: createConnectionOnServer,
        deleteConnectorOnServer: deleteConnectionOnServer,
        updateConnectorOnServer: sendConnectionUpdateToServer,
        
        // Операции с данными доски
        loadBoardData: requestBoardDataFromServer,
        loadConnectorData: requestConnectionsFromServer
    };
};
