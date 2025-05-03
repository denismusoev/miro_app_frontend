import {useCallback, useContext, useEffect, useRef} from 'react';
import {addEdge, applyEdgeChanges, useEdgesState, useNodesState} from '@xyflow/react';
import {getDefaultItem} from '../utils/boardUtils';
import {itemToNode, nodeToItem} from '../utils/itemMapper';
import {Geometry, ItemRs, Position} from '../model/ItemDto';
import {useSafePublish} from './useSafePublish';
import {ProjectContext} from '../components/ProjectProvider';
import {throttle} from "lodash";
import { v4 as uuidv4 } from 'uuid';
import { message } from 'antd';

// Устанавливаем максимальное количество уведомлений на экране
message.config({
    maxCount: 3, // максимум 3 уведомления одновременно
    duration: 3   // время отображения (в секундах)
});

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


export const useBoardState = ({ publish, connected }) => {
    const { userLogin } = useContext(ProjectContext);

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const originalNodesRef = useRef({});
    const pendingNodeUpdatesRef = useRef(new Set());
    const pendingConnectorUpdatesRef = useRef(new Set());
    const connectedRef = useRef(connected);
    const lastDraggedNodeRef = useRef(null);
    const processIdMapRef = useRef(new Map()); // Хранилище для связи processId и nodeId
    const tempItemsMapRef = useRef(new Map()); // Хранилище для временных элементов до подтверждения
    const prevStatesMapRef = useRef(new Map()); // Хранилище предыдущих состояний элементов
    const deletedItemsMapRef = useRef(new Map()); // Хранилище удаленных элементов
    const tempIdToRealIdMapRef = useRef(new Map()); // Связь временных и реальных ID
    const operationsAuditRef = useRef(new Map()); // Аудит операций для отслеживания и отката
    const lastErrorsRef = useRef({}); // Хранилище для времени последних ошибок каждого типа

    const safePublish = useSafePublish(connectedRef, publish);

    // Функция для записи в аудит операций
    const addToAudit = useCallback((processId, operation) => {
        if (!processId) return;
        
        console.log(`[useBoardState:addToAudit] Добавление в аудит: ${processId}`, operation);
        operationsAuditRef.current.set(processId, operation);
    }, []);

    // Функция для удаления из аудита при подтверждении операции
    const removeFromAudit = useCallback((processId) => {
        if (!processId) return;
        
        console.log(`[useBoardState:removeFromAudit] Удаление из аудита: ${processId}`);
        operationsAuditRef.current.delete(processId);
    }, []);

    // Функция для создания запроса в формате WebSocketRequest
    const createWebSocketRequest = useCallback((data) => {
        const processId = uuidv4(); // Генерируем уникальный processId
        
        // Если данные содержат id, связываем processId с ним
        if (data.id) {
            processIdMapRef.current.set(String(data.id), processId);
        } else if (typeof data === 'string' || typeof data === 'number') {
            // Если данные - это просто id (например, при удалении)
            processIdMapRef.current.set(String(data), processId);
        }
        
        return {
            processId,
            data
        };
    }, []);

    // Обертка над safePublish для отправки запросов в новом формате
    const publishWithProcessId = useCallback((destination, data) => {
        const request = createWebSocketRequest(data);
        safePublish(destination, request);
        return request.processId;
    }, [safePublish, createWebSocketRequest]);

    // Функция для получения ID элемента по processId
    const getNodeIdByProcessId = useCallback((processId) => {
        // Ищем ID в карте processId -> nodeId
        for (const [nodeId, pid] of processIdMapRef.current.entries()) {
            if (pid === processId) {
                return nodeId;
            }
        }
        return null;
    }, []);

    // Функция для получения временного ID элемента, который соответствует реальному ID
    const getTempIdByRealId = useCallback((realId) => {
        for (const [tempId, realIdVal] of tempIdToRealIdMapRef.current.entries()) {
            if (String(realIdVal) === String(realId)) {
                return tempId;
            }
        }
        return null;
    }, []);

    useEffect(() => {
        connectedRef.current = connected;
    }, [connected]);

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

    const sendServerLockNode = useCallback((nodeId) => {
        console.log("[useBoardState:lockNode] Запрос на блокировку узла:", nodeId);
        const data = {
            nodeId: parseInt(nodeId, 10)
        };
        
        // Генерируем и сохраняем processId для операции блокировки
        const processId = publishWithProcessId('/app/items/lock', data);
        
        // Явно связываем processId с nodeId для операции блокировки
        processIdMapRef.current.set(String(nodeId), processId);
        
        // Добавляем в аудит операцию блокировки
        addToAudit(processId, {
            type: 'LOCK_NODE',
            nodeId: String(nodeId)
        });
        
        console.log(`[useBoardState:lockNode] Связали nodeId ${nodeId} с processId ${processId} для операции блокировки`);
        
        return processId;
    }, [publishWithProcessId, addToAudit]);

    const sendServerUpdateLockedNode = useCallback(
        throttle((node, type) => {
            setNodes(prevNodes => {
                const existingNode = prevNodes.find(n => n.id === node.id);
                const nodeId = String(node.id);

                const isLockedByMe = existingNode?.data?.isLocked && existingNode?.data?.lockedBy === "me";

                if (!isLockedByMe) {
                    console.log("[useBoardState:updateLockedNode] Обновление отклонено: узел не заблокирован текущим пользователем");
                    return prevNodes; // Нельзя обновлять узел, который не заблокирован текущим пользователем
                }
                
                console.log("[useBoardState:updateLockedNode] ОБНОВЛЕНИЕ ГЕОМЕТРИИ", node);
                
                // Подготавливаем данные для отправки
                let updateData;
                if (type === "geometry") {
                    updateData = {
                        id: nodeId,
                        type: node.type,
                        geometry: {
                            width: node.geometry.width,
                            height: node.geometry.height,
                        }
                    };
                }
                else if (type === "position") {
                    updateData = {
                        id: nodeId,
                        type: node.type,
                        position: node.position
                    };
                }
                
                // Сохраняем предыдущее состояние перед отправкой обновления
                const currentNode = prevNodes.find(n => String(n.id) === nodeId);
                if (currentNode) {
                    prevStatesMapRef.current.set(nodeId, currentNode);
                    console.log("[useBoardState:updateLockedNode] Сохранили предыдущее состояние узла:", currentNode, nodeId);
                    console.log("[useBoardState:updateLockedNode] prevStatesMapRef", prevStatesMapRef.current);
                }
                
                // Генерируем и сохраняем processId для операции обновления заблокированного узла
                const processId = publishWithProcessId('/app/items/lock/update', updateData);
                
                // Явно связываем processId с nodeId для операции обновления заблокированного узла
                processIdMapRef.current.set(String(nodeId), processId);
                
                // Добавляем в аудит операцию обновления заблокированного узла
                addToAudit(processId, {
                    type: 'UPDATE_LOCKED_NODE',
                    nodeId: nodeId,
                    updateType: type,
                    previousState: currentNode,
                    updateData: updateData
                });
                
                console.log(`[useBoardState:updateLockedNode] Связали nodeId ${nodeId} с processId ${processId} для операции обновления заблокированного узла`);
                
                return prevNodes;
            });
        }, 500),
        [publishWithProcessId, addToAudit]
    );

    const sendServerUnlockNode = useCallback((nodeId) => {
        console.log("[useBoardState:unlockNode] Разблокировка узла:", nodeId);
        const data = {
            nodeId: parseInt(nodeId, 10)
        };
        
        // Сохраняем текущее состояние узла перед разблокировкой
        setNodes(prevNodes => {
            const currentNode = prevNodes.find(n => String(n.id) === String(nodeId));
            if (currentNode) {
                prevStatesMapRef.current.set(String(nodeId), currentNode);
            }
            return prevNodes;
        });
        
        // Генерируем и сохраняем processId для операции разблокировки
        const processId = publishWithProcessId('/app/items/unlock', data);
        
        // Явно связываем processId с nodeId для операции разблокировки
        processIdMapRef.current.set(String(nodeId), processId);
        
        // Добавляем в аудит операцию разблокировки
        addToAudit(processId, {
            type: 'UNLOCK_NODE',
            nodeId: String(nodeId)
        });
        
        console.log(`[useBoardState:unlockNode] Связали nodeId ${nodeId} с processId ${processId} для операции разблокировки`);
        
        pendingNodeUpdatesRef.current.delete(nodeId);
        
        return processId;
    }, [publishWithProcessId, addToAudit, setNodes]);

    const handleNodeResizeStart = useCallback((nodeId) => {
        console.log("НАЧАЛО ИЗМЕНЕНИЯ РАЗМЕРА УЗЛА", nodeId);
        
        // Запрашиваем блокировку узла перед началом изменения размера
        sendServerLockNode(nodeId);
        
        // Отмечаем узел как ожидающий блокировки
        setNodes(prevNodes =>
            prevNodes.map(n => {
                if (String(n.id) !== String(nodeId)) return n;
                
                return {
                    ...n,
                    selected: true,
                    data: {
                        ...n.data,
                        waitingForLock: true
                    }
                };
            })
        );
    }, [setNodes, sendServerLockNode]);
    
    const handleNodeResize = useCallback((nodeId, newSize) => {
        console.log("ИЗМЕНЕНИЕ РАЗМЕРА УЗЛА", nodeId, newSize);
        
        setNodes(prevNodes => {
            const node = prevNodes.find(n => String(n.id) === String(nodeId));
            if (!node) {
                console.log("return")
                return prevNodes;
            }
            
            // Проверяем, что блокировка подтверждена сервером
            if (!node.data?.lockConfirmed) {
                console.log("Изменение размера отклонено: ждем подтверждения блокировки");
                return prevNodes;
            }
            
            // Проверяем, что узел все еще заблокирован нами
            const isLockedByMe = node.data?.isLocked && node.data?.lockedBy === "me";
            if (!isLockedByMe) {
                console.log("Изменение размера отклонено: узел не заблокирован текущим пользователем");
                return prevNodes;
            }
            console.log(node)
            
            // Обновляем размеры узла
            const updatedNode = {
                ...node,
                data: {
                    ...node.data,
                    geometry: {
                        ...node.data.geometry,
                        width: newSize.width || node.measured.width,
                        height: newSize.height || node.measured.height
                    }
                }
            };
            
            // Отправляем обновления размеров заблокированного узла
            const item = nodeToItem(updatedNode);
            console.log("Обновленный элемент", item);
            sendServerUpdateLockedNode(item, "geometry");
            
            return prevNodes.map(n => String(n.id) === String(nodeId) ? updatedNode : n);
        });
    }, [setNodes, sendServerUpdateLockedNode]);
    
    const handleNodeResizeEnd = useCallback((nodeId) => {
        console.log("ЗАВЕРШЕНИЕ ИЗМЕНЕНИЯ РАЗМЕРА УЗЛА", nodeId);
        
        setNodes(prevNodes => {
            const node = prevNodes.find(n => String(n.id) === String(nodeId));
            if (!node) return prevNodes;
            
            // Если блокировка не была подтверждена, пропускаем операции с узлом
            if (!node.data?.lockConfirmed) {
                return prevNodes.map(n => {
                    if (String(n.id) !== String(nodeId)) return n;
                    
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            waitingForLock: false
                        }
                    };
                });
            }
            
            // Обновляем размеры узла
            const updatedNode = {
                ...node,
                data: {
                    ...node.data,
                    waitingForLock: false,
                    lockConfirmed: false
                }
            };

            sendServerUpdateLockedNode.flush();
            
            setTimeout(() => {
                console.log("Отправили финальную разблокировку после изменения размера");
                sendServerUnlockNode(nodeId);
            }, 10);
            
            return prevNodes.map(n => String(n.id) === String(nodeId) ? updatedNode : n);
        });
    }, [setNodes, publishWithProcessId, sendServerUnlockNode, sendServerUpdateLockedNode]);

    const attachNodeHandlers = useCallback((node, handlers = {}) => {
        const isLockedByOther = node.data?.isLocked && node.data?.lockedBy !== "me";

        const nodeWithBlockFlags = isLockedByOther ? {
            ...node,
            draggable: false,
            selectable: false,
            connectable: false,
            deletable: false,
            focusable: false
        } : node;

        return {
            ...nodeWithBlockFlags,
            data: {
                ...node.data,
                functions: {
                    ...(node.data.functions || {}),
                    ...handlers
                },
            },
        };
    }, []);

    // Объявляем пустую функцию getNodeHandlers, которую переопределим позже
    let getNodeHandlers = () => ({});

    const handleNodeLabelChange = useCallback((id, newLabel) => {
        console.log(`[useBoardState:handleNodeLabelChange] Изменение метки узла: ${id} -> ${newLabel}`);
        
        setNodes((prevNodes) => {
            const nodeIndex = prevNodes.findIndex(n => String(n.id) === String(id));
            if (nodeIndex === -1) return prevNodes;
            
            const currentNode = prevNodes[nodeIndex];
            
            // Сохраняем предыдущее состояние
            prevStatesMapRef.current.set(String(id), currentNode);
            
            // Обновляем узел
            const updatedNode = {
                ...currentNode,
                data: { ...currentNode.data, label: newLabel }
            };
            
            const nodeWithHandlers = attachNodeHandlers(updatedNode, getNodeHandlers());
            
            // Подготавливаем данные для отправки
            const payload = nodeToItem(updatedNode);
            
            // Отправляем данные на сервер
            const processId = publishWithProcessId('/app/items/update', payload);
            
            // Связываем processId с элементом
            processIdMapRef.current.set(String(id), processId);
            
            // Добавляем в аудит операцию изменения метки
            addToAudit(processId, {
                type: 'UPDATE_NODE_LABEL',
                nodeId: String(id),
                previousState: currentNode,
                newLabel: newLabel,
                updatedNode: updatedNode
            });
            
            console.log(`[useBoardState:handleNodeLabelChange] Связали nodeId ${id} с processId ${processId} для операции изменения метки`);
            
            // Обновляем локально
            const updatedNodes = [...prevNodes];
            updatedNodes[nodeIndex] = nodeWithHandlers;
            return updatedNodes;
        });
    }, [setNodes, publishWithProcessId, attachNodeHandlers, getNodeHandlers, addToAudit]);

    const handleNodeStyleChange = useCallback((id, newStyle) => {
        setNodes((prevNodes) => {
            const nodeIndex = prevNodes.findIndex(n => String(n.id) === String(id));
            if (nodeIndex === -1) return prevNodes;
            
            const currentNode = prevNodes[nodeIndex];
            
            // Сохраняем предыдущее состояние
            prevStatesMapRef.current.set(String(id), currentNode);
            
            // Обновляем узел
            const updatedNode = {
                ...currentNode,
                data: {
                    ...currentNode.data,
                    style: {
                        ...(currentNode.data.style || {}),
                        ...newStyle
                    }
                }
            };
            
            const nodeWithHandlers = attachNodeHandlers(updatedNode, getNodeHandlers());
            
            // Подготавливаем данные для отправки
            const payload = nodeToItem(updatedNode);
            
            // Отправляем данные на сервер
            const processId = publishWithProcessId('/app/items/update', payload);
            
            // Связываем processId с элементом
            processIdMapRef.current.set(String(id), processId);
            
            // Добавляем в аудит операцию изменения стиля
            addToAudit(processId, {
                type: 'UPDATE_NODE_STYLE',
                nodeId: String(id),
                previousState: currentNode,
                newStyle: newStyle,
                updatedNode: updatedNode
            });
            
            console.log(`[useBoardState:handleNodeStyleChange] Связали nodeId ${id} с processId ${processId} для операции изменения стиля`);
            
            // Обновляем локально
            const updatedNodes = [...prevNodes];
            updatedNodes[nodeIndex] = nodeWithHandlers;
            return updatedNodes;
        });
    }, [setNodes, publishWithProcessId, attachNodeHandlers, getNodeHandlers, addToAudit]);

    // Функция для обновления свойств data узла (например, тип фигуры)
    const handleNodeDataChange = useCallback((id, dataChanges) => {
        setNodes((prevNodes) => {
            const nodeIndex = prevNodes.findIndex(n => String(n.id) === String(id));
            if (nodeIndex === -1) return prevNodes;
            
            const currentNode = prevNodes[nodeIndex];
            
            // Сохраняем предыдущее состояние
            prevStatesMapRef.current.set(String(id), currentNode);
            
            // Обновляем узел
            const updatedNode = {
                ...currentNode,
                shape: dataChanges.shape || currentNode.shape, // Обновляем shape на уровне узла
                data: {
                    ...currentNode.data,
                    ...dataChanges, // Добавляем все изменения data
                }
            };
            
            const nodeWithHandlers = attachNodeHandlers(updatedNode, getNodeHandlers());
            
            // Подготавливаем данные для отправки
            const payload = nodeToItem(updatedNode);
            
            // Отправляем данные на сервер
            const processId = publishWithProcessId('/app/items/update', payload);
            
            // Связываем processId с элементом
            processIdMapRef.current.set(String(id), processId);
            
            // Добавляем в аудит операцию изменения данных
            addToAudit(processId, {
                type: 'UPDATE_NODE_DATA',
                nodeId: String(id),
                previousState: currentNode,
                newData: dataChanges,
                updatedNode: updatedNode
            });
            
            console.log(`[useBoardState:handleNodeDataChange] Связали nodeId ${id} с processId ${processId} для операции изменения данных`);
            
            // Обновляем локально
            const updatedNodes = [...prevNodes];
            updatedNodes[nodeIndex] = nodeWithHandlers;
            return updatedNodes;
        });
    }, [setNodes, publishWithProcessId, attachNodeHandlers, getNodeHandlers, addToAudit]);

    const processServerNodeUpdate = useCallback((item, type) => {
        const newNode = itemToNode(item, userLogin);
        console.log(newNode.position);
        const nodeId = newNode.id;
        console.log("[useBoardState:handleServerNodeUpdate] Получено обновление с сервера для узла:", nodeId);

        if (item.updatedByLogin === userLogin) {
            console.log("[useBoardState:handleServerNodeUpdate] Игнорируем локальное обновление для узла:", nodeId);
            return;
        }

        setNodes((prevNodes) => {
            const idx = prevNodes.findIndex((n) => String(n.id) === String(nodeId));

            if (idx < 0) {
                console.log(idx)
                const nodeWithFunctions = attachNodeHandlers(newNode, getNodeHandlers());

                if (nodeWithFunctions.parentId) {
                    nodeWithFunctions.extent = "parent";
                }

                const updatedNodes = [...prevNodes, nodeWithFunctions];
                return sortNodesWithParentsFirst(updatedNodes);
            }

            const existingNode = prevNodes[idx];

            const updatedNode = {
                ...existingNode,
                position: newNode.position,
                data: {
                    ...existingNode.data,
                    position: newNode.position,
                    label: newNode.data.label,
                    style: {
                        ...(existingNode.data.style || {}),
                        ...(newNode.data.style || {})
                    }
                }
            };

            console.log('[useBoardState:handleServerNodeUpdate] updatedNode', updatedNode);

            if (newNode.parentId === undefined) {
                updatedNode.parentId = undefined;
                updatedNode.extent = undefined;
            } else
            if (String(newNode.parentId) !== String(existingNode.parentId)) {
                updatedNode.parentId = String(newNode.parentId);
                updatedNode.extent = "parent";
                if (newNode.position) {
                    updatedNode.position = newNode.position;
                }
            }

            const nodeWithFunctions = attachNodeHandlers(updatedNode, getNodeHandlers());

            const updatedNodes = [...prevNodes];
            updatedNodes[idx] = nodeWithFunctions;

            return sortNodesWithParentsFirst(updatedNodes);
        });
    }, [setNodes, attachNodeHandlers, getNodeHandlers]);

    const detachNodeFromParentFrame = useCallback((nodeId) => {
        setNodes(prev => {
            const node = prev.find(n => String(n.id) === String(nodeId));
            if (!node || !node.parentId) return prev;

            const parentNode = prev.find(n => String(n.id) === String(node.parentId));
            if (!parentNode) return prev;

            const parentPos = parentNode.position;

            const absolutePosition = {
                x: parentPos.x + node.position.x,
                y: parentPos.y + node.position.y
            };
            console.log("parentPos", parentPos);
            console.log("nodeLocalPos", node.position);
            console.log("nodePos", absolutePosition);

            // Сохраняем предыдущее состояние узла перед отсоединением
            prevStatesMapRef.current.set(String(nodeId), node);

            const updatedNode = {
                ...node,
                parentId: undefined,
                extent: undefined,
                position: absolutePosition,
                data: {
                    ...node.data,
                    parentId: undefined,
                    position: absolutePosition
                }
            };

            const payload = nodeToItem({
                ...updatedNode,
                parentId: -1
            });
            console.log('payload immediate', payload);
            
            // Отправляем запрос на сервер и получаем processId
            const processId = publishWithProcessId('/app/items/update', payload);
            
            // Связываем processId с элементом
            processIdMapRef.current.set(String(nodeId), processId);
            
            // Добавляем в аудит операцию отсоединения
            addToAudit(processId, {
                type: 'DETACH_NODE',
                nodeId: String(nodeId),
                previousState: node,
                currentState: updatedNode
            });
            
            console.log(`[useBoardState:detachNodeFromParentFrame] Связали nodeId ${nodeId} с processId ${processId} для операции отсоединения от родителя`);

            return sortNodesWithParentsFirst(
                prev.map(n => String(n.id) === String(nodeId) ? updatedNode : n)
            );
        });
    }, [setNodes, publishWithProcessId, addToAudit]);

    const processServerNodeLocked = useCallback((lockData) => {
        console.log("[useBoardState:handleNodeLocked] Получено событие блокировки узла:", lockData);
        
        // Проверяем статус блокировки
        if (lockData.status === 'LOCKED') {
            console.log("[useBoardState:handleNodeLocked] STATUS=", lockData.status);
            // Успешная блокировка
            setNodes(prevNodes => {
                // Проверим, не заблокировал ли уже текущий пользователь этот узел
                const existingNode = prevNodes.find(node => String(node.id) === String(lockData.nodeId));
                const alreadyLockedByMe = existingNode?.data?.lockConfirmed === true;
                
                // Если узел уже заблокирован текущим пользователем, и это общее сообщение,
                // то не меняем флаг локальной блокировки
                if (alreadyLockedByMe && lockData.lockedByLogin !== userLogin) {
                    console.log("[useBoardState:handleNodeLocked] Игнорируем общее сообщение блокировки для уже заблокированного нами узла");
                    return prevNodes;
                }
                
                return prevNodes.map(node => {
                    if (String(node.id) === String(lockData.nodeId)) {
                        // проверяем, заблокирован ли узел текущим пользователем
                        // по полю displayLockedBy, если оно равно "me", то это текущий пользователь
                        const isLockedByMe = lockData.lockedByLogin === userLogin;
                        const displayName = lockData.lockedByLogin !== userLogin ? lockData.displayLockedBy : "me";
                        console.log(lockData.lockedByLogin);
                        console.log(userLogin);
                        console.log(displayName);
                        console.log(isLockedByMe);

                        return {
                            ...node,
                            draggable: isLockedByMe, // Блокируем перетаскивание если не мы заблокировали
                            selectable: isLockedByMe, // Запрещаем выделение
                            connectable: isLockedByMe, // Запрещаем подключения
                            deletable: isLockedByMe, // Запрещаем удаление
                            focusable: isLockedByMe, // Запрещаем фокусировку
                            data: {
                                ...node.data,
                                isLocked: true,
                                lockedBy: displayName, // используем displayLockedBy для отображения
                                lockedByLogin: lockData.lockedByLogin, // сохраняем логин для сравнения
                                lockConfirmed: isLockedByMe, // подтверждена ли блокировка
                                waitingForLock: false // сбрасываем флаг ожидания
                            }
                        };
                    }
                    console.log(node);
                    return node;
                });
            });
        } else if (lockData.status === 'LOCK_DENIED') {
            // Блокировка отклонена
            console.log("[useBoardState:handleNodeLocked] Блокировка отклонена:", lockData);
            
            // Сбрасываем флаг ожидания блокировки для узла
            setNodes(prevNodes =>
                prevNodes.map(node => {
                    if (node.id === lockData.nodeId) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                waitingForLock: false
                            }
                        };
                    }
                    return node;
                })
            );
        }
    }, [setNodes]);

    const processServerNodeUnlocked = useCallback((unlockData) => {
        console.log("[useBoardState:handleNodeUnlocked] Узел разблокирован:", unlockData);
        
        setNodes(prevNodes =>
            prevNodes.map(node => {
                if (String(node.id) === String(unlockData.nodeId)) {
                    return {
                        ...node,
                        draggable: true, // Разблокируем перетаскивание
                        selectable: true, // Разрешаем выделение
                        connectable: true, // Разрешаем подключения
                        deletable: true, // Разрешаем удаление
                        focusable: true, // Разрешаем фокусировку
                        data: {
                            ...node.data,
                            isLocked: false,
                            lockedBy: undefined,
                            lockedByLogin: undefined,
                            lockConfirmed: false,
                            waitingForLock: false
                        }
                    };
                }
                return node;
            })
        );
    }, [setNodes]);

    const processServerLockedNodeUpdate = useCallback((updateData) => {
        const { id, position, measured } = itemToNode(updateData);
        console.log("[useBoardState:handleLockedNodeUpdate]", updateData);
        // console.log("[useBoardState:handleLockedNodeUpdate] id", id);
        // console.log("[useBoardState:handleLockedNodeUpdate] position", position);
        // console.log("[useBoardState:handleLockedNodeUpdate] geometry", geometry);
        console.log("[useBoardState:handleLockedNodeUpdate] Обновление заблокированного узла получено:", id);
        
        setNodes(prevNodes => {
            // Проверяем, заблокирован ли данный узел текущим пользователем
            const existingNode = prevNodes.find(node => String(node.id) === String(id));
            const isLockedByMe = existingNode?.data?.lockConfirmed === true && updateData?.updatedByLogin === userLogin;
            console.log("[useBoardState:handleLockedNodeUpdate]", existingNode?.data?.lockConfirmed);
            console.log("[useBoardState:handleLockedNodeUpdate]", updateData?.updatedByLogin === userLogin);
            console.log("[useBoardState:handleLockedNodeUpdate]", updateData?.updatedByLogin);
            console.log("[useBoardState:handleLockedNodeUpdate]", userLogin);

            // Если узел заблокирован текущим пользователем, игнорируем обновление с сервера
            // так как пользователь сам выполнил это обновление и уже применил его локально
            if (isLockedByMe) {
                console.log("[useBoardState:handleLockedNodeUpdate] Игнорируем обновление заблокированного узла, так как он заблокирован текущим пользователем");
                return prevNodes;
            }
            
            // В противном случае применяем обновление
            return prevNodes.map(node => {
                console.log("[useBoardState:handleLockedNodeUpdate] Применяем")
                if (String(node.id) === String(id)) {
                    // Обновляем позицию и размеры, если они доступны
                    let updatedNode = { ...node };
                    
                    if (position) {
                        updatedNode.position = { 
                            x: position.x, 
                            y: position.y 
                        };
                    }
                    console.log("[useBoardState:handleLockedNodeUpdate] ДО", updatedNode.measured);
                    console.log("[useBoardState:handleLockedNodeUpdate]", updatedNode);
                    console.log("[useBoardState:handleLockedNodeUpdate]", measured);

                    if (measured) {
                        updatedNode = {
                            ...updatedNode,
                            measured: {
                                width: measured.width,
                                height: measured.height
                            },
                            data: {
                                ...updatedNode.data,
                                geometry: {
                                    ...updatedNode.data.geometry,
                                    width: measured.width,
                                    height: measured.height
                                }
                            }
                        }
                    }

                    console.log("[useBoardState:handleLockedNodeUpdate] ПОСЛЕ", updatedNode.measured);
                    
                    return updatedNode;
                }
                return node;
            });
        });
    }, [setNodes]);

    const processServerNodeDelete = useCallback((nodeId) => {
        // Если узел удален локально, игнорируем WS-обновление
        if (pendingNodeUpdatesRef.current.has(nodeId)) {
            pendingNodeUpdatesRef.current.delete(nodeId);
            return;
        }

        setNodes((prevNodes) => prevNodes.filter((node) => String(node.id) !== String(nodeId)));
        setEdges((prevEdges) =>
            prevEdges.filter((edge) => String(edge.source) !== String(nodeId) && String(edge.target) !== String(nodeId))
        );
    }, [setNodes, setEdges]);

    const disableNodeDrag = useCallback((nodeId) => {
        setNodes((prevNodes) =>
            prevNodes.map((node) =>
                String(node.id) === String(nodeId) ? { ...node, draggable: false } : node
            )
        );
    }, [setNodes]);

    const enableNodeDrag = useCallback((nodeId) => {
        setNodes((prevNodes) =>
            prevNodes.map((node) =>
                String(node.id) === String(nodeId) ? { ...node, draggable: true } : node
            )
        );
    }, [setNodes]);

    const sendServerCreateNode = useCallback((boardIdForNode, type, position) => {
        const { data, style, width, height } = getDefaultItem(type);
        
        // Генерируем временный ID
        const tempId = `temp-${uuidv4()}`;
        
        // Создаем новый элемент с временным ID
        const newNode = {
            id: tempId,
            type,
            position,
            data: {
                ...data,
                dataType: type,
                label: data.label || '',
                geometry: {
                    width,
                    height,
                    rotation: 0
                }
            },
            style: { ...style, styleType: type },
            draggable: true,
            selectable: true,
            measured: {
                width,
                height
            }
        };
        
        // Добавляем элемент в локальное состояние
        setNodes(prevNodes => {
            const nodeWithHandlers = attachNodeHandlers(newNode, getNodeHandlers());
            return [...prevNodes, nodeWithHandlers];
        });
        
        // Сохраняем элемент во временном хранилище
        tempItemsMapRef.current.set(tempId, newNode);
        
        // Готовим объект для отправки на сервер
        const payload = {
            boardId: boardIdForNode,
            type,
            position: new Position(position),
            geometry: new Geometry({ width, height, rotation: 0 }),
            tempId: tempId
        };
        
        // Отправляем запрос на сервер
        const processId = publishWithProcessId('/app/items/create', payload);
        
        // Связываем processId с элементом
        processIdMapRef.current.set(tempId, processId);
        
        // Добавляем в аудит операцию создания узла
        addToAudit(processId, {
            type: 'CREATE_NODE',
            tempId: tempId,
            nodeData: newNode,
            payload: payload
        });
        
        console.log(`[useBoardState:createNodeOnServer] Связали tempId ${tempId} с processId ${processId} для операции создания узла`);
        
        return tempId;
    }, [publishWithProcessId, attachNodeHandlers, getNodeHandlers, setNodes, addToAudit]);

    const handleNodeDragStart = useCallback((event, node) => {
        console.log("[useBoardState:handleNodeDragStart] НАЧАЛО ПЕРЕТАСКИВАНИЯ УЗЛА", node.id);
        
        // Запрашиваем блокировку узла перед началом перетаскивания
        sendServerLockNode(node.id);
        
        // Отмечаем узел как ожидающий блокировки
        setNodes(prevNodes =>
            prevNodes.map(n => {
                if (String(n.id) === String(node.id)) {
                    return {
                        ...n,
                        selected: true,
                        data: {
                            ...n.data,
                            waitingForLock: true
                        }
                    };
                }
                return n;
            })
        );
    }, [setNodes, sendServerLockNode]);

    const checkRectIntersection = (rect1, rect2) => {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    };

    const handleNodeDrag = useCallback((event, draggedNode) => {
        console.log("[useBoardState:handleNodeDrag] ПЕРЕМЕЩЕНИЕ УЗЛА", draggedNode.id);
        
        if (draggedNode.data.lockPending) {
            console.log("[useBoardState:handleNodeDrag] Перемещение отклонено: ждем подтверждения блокировки", draggedNode, userLogin);
            console.log("[useBoardState:handleNodeDrag]", userLogin === draggedNode.data.lockedByLogin);
            return;
        }
        
        if (!draggedNode.data.isLocked || draggedNode.data.lockedBy !== "me") {
            console.log("[useBoardState:handleNodeDrag] Перемещение отклонено: узел не заблокирован текущим пользователем", draggedNode);
            console.log("[useBoardState:handleNodeDrag]", userLogin === draggedNode.data.lockedByLogin);
            return;
        }
        
        const item = nodeToItem({
            ...draggedNode,
            data: {
                ...draggedNode.data,
                position: {
                    x: draggedNode.position.x,
                    y: draggedNode.position.y
                }
            }
        });
        console.log("[useBoardState:handleNodeDrag]", draggedNode.position);

        sendServerUpdateLockedNode(item, "position");
    }, [setNodes, sendServerUpdateLockedNode]);

    const handleNodeDragEnd = useCallback((event, draggedNode) => {
        const nodeId = draggedNode.id;
        console.log("[useBoardState:handleNodeDragEnd] ЗАВЕРШЕНИЕ ПЕРЕТАСКИВАНИЯ УЗЛА:", nodeId);
        
        pendingNodeUpdatesRef.current.add(nodeId);
        console.log("[useBoardState:handleNodeDragEnd] Добавлен в список ожидающих обновлений:", nodeId);
        
        if (draggedNode.data.lockPending) {
            console.log("[useBoardState:handleNodeDragEnd] Блокировка не подтверждена для узла:", nodeId);
            console.log("[useBoardState:handleNodeDragEnd] Состояние блокировки:", {
                isLocked: draggedNode.data.isLocked,
                lockedBy: draggedNode.data.lockedBy,
                lockedByLogin: draggedNode.data.lockedByLogin,
                lockPending: draggedNode.data.lockPending,
                lockConfirmed: draggedNode.data.lockConfirmed
            });
            
            setNodes(prev =>
                prev.map(n => {
                    if (String(n.id) !== String(nodeId)) return n;
                    
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            waitingForLock: false
                        }
                    };
                })
            );
            
            console.log("[useBoardState:handleNodeDragEnd] Сброшен флаг ожидания блокировки и прерываем обработку");
            return;
        }
        
        const nodeWidth = draggedNode.measured.width || draggedNode.data?.geometry?.width || 100;
        const nodeHeight = draggedNode.measured.height || draggedNode.data?.geometry?.height || 100;
        const nodePosition = draggedNode.position;
        
        console.log("[useBoardState:handleNodeDragEnd] Параметры узла:", {
            id: nodeId,
            width: nodeWidth,
            height: nodeHeight,
            position: nodePosition
        });
        
        const currentNode = nodes.find(n => String(n.id) === String(nodeId));
        
        if (currentNode) {
            console.log("[useBoardState:handleNodeDragEnd] Найден текущий узел в списке узлов");
            
            // Проверяем, есть ли у узла родитель
            const hasParent = !!currentNode.parentId;
            console.log("[useBoardState:handleNodeDragEnd] Узел имеет родителя:", hasParent, "parentId:", currentNode.parentId);
            
            let updatedNode;
            
            if (hasParent) {
                // Если у узла есть родитель, просто обновляем его позицию без проверки пересечений
                updatedNode = {
                    ...currentNode,
                    position: nodePosition, // Обновляем позицию внутри родителя
                    data: {
                        ...currentNode.data,
                        position: nodePosition,
                        waitingForLock: false,
                        lockConfirmed: false
                    }
                };
                
                console.log("[useBoardState:handleNodeDragEnd] Узел имеет родителя, обновлена только позиция внутри родителя:", nodePosition);
                
                // const payload = nodeToItem(updatedNode);
                // console.log('[useBoardState:handleNodeDragEnd] Отправляем запрос на обновление позиции на сервер:', payload);
                // publishWithProcessId('/app/items/lock/update', payload);
            } else {
                // Если у узла нет родителя, выполняем проверку пересечений с фреймами
                updatedNode = {
                    ...currentNode,
                    data: {
                        ...currentNode.data,
                        position: nodePosition,
                        waitingForLock: false,
                        lockConfirmed: false
                    },
                    parentId: undefined,
                    extent: undefined
                };
                
                console.log("[useBoardState:handleNodeDragEnd] Создан обновленный узел с новыми параметрами");
                
                const frames = nodes.filter(node => node.type === 'frame' && String(node.id) !== String(nodeId));
                console.log("[useBoardState:handleNodeDragEnd] Найдено фреймов для проверки пересечения:", frames.length);
                
                const draggedRect = {
                    x: nodePosition.x,
                    y: nodePosition.y,
                    width: nodeWidth,
                    height: nodeHeight
                };
                
                const intersectingFrames = frames.filter(frame => {
                    const frameRect = {
                        x: frame.position.x,
                        y: frame.position.y,
                        width: frame.data?.geometry?.width || 200,
                        height: frame.data?.geometry?.height || 200
                    };
                    
                    const intersects = checkRectIntersection(draggedRect, frameRect);
                    if (intersects) {
                        console.log(`[useBoardState:handleNodeDragEnd] Обнаружено пересечение с фреймом ${frame.id}`, frameRect);
                    }
                    return intersects;
                });
                
                console.log("[useBoardState:handleNodeDragEnd] Количество пересекающихся фреймов:", intersectingFrames.length);
                
                if (intersectingFrames.length > 0) {
                    const targetFrame = intersectingFrames[intersectingFrames.length - 1];
                    console.log(`[useBoardState:handleNodeDragEnd] Присоединяем узел ${nodeId} к фрейму ${targetFrame.id}`);
                    
                    const relativePosition = {
                        x: nodePosition.x - targetFrame.position.x,
                        y: nodePosition.y - targetFrame.position.y
                    };
                    
                    console.log("[useBoardState:handleNodeDragEnd] Рассчитана относительная позиция:", relativePosition);
                    
                    updatedNode = {
                        ...updatedNode,
                        parentId: String(targetFrame.id),
                        extent: "parent",
                        position: relativePosition,
                        data: {
                            ...updatedNode.data,
                            position: relativePosition,
                            parentId: targetFrame.id,
                        }
                    };
                    
                    console.log("[useBoardState:handleNodeDragEnd] Узел обновлен с привязкой к родителю:", {
                        id: nodeId,
                        position: updatedNode.position,
                        parentId: updatedNode.parentId
                    });

                    const payload = nodeToItem(updatedNode);
                    console.log('[useBoardState:handleNodeDragEnd] Отправляем запрос на обновление на сервер:', payload);
                    
                    // Сохраняем предыдущее состояние узла перед обновлением
                    const draggedNode = nodes.find(n => String(n.id) === String(nodeId));
                    if (draggedNode) {
                        prevStatesMapRef.current.set(String(nodeId), draggedNode);
                    }
                    
                    // Отправляем запрос на сервер
                    const processId = publishWithProcessId('/app/items/update', payload);
                    
                    // Связываем processId с элементом
                    processIdMapRef.current.set(String(nodeId), processId);
                    
                    // Добавляем в аудит операцию обновления позиции и родителя
                    addToAudit(processId, {
                        type: 'UPDATE_NODE_PARENT',
                        nodeId: String(nodeId),
                        previousState: draggedNode,
                        updatedNode: updatedNode,
                        newParentId: String(targetFrame.id)
                    });
                    
                    console.log(`[useBoardState:handleNodeDragEnd] Связали nodeId ${nodeId} с processId ${processId} для операции обновления позиции и родителя`);
                }
            }

            console.log("[useBoardState:handleNodeDragEnd] Обновляем состояние узлов в React");
            setNodes(prev =>
                sortNodesWithParentsFirst(
                    prev.map(n => String(n.id) === String(nodeId) ? updatedNode : n)
                )
            );

            setTimeout(() => {
                console.log("[useBoardState:handleNodeDragEnd] Отправляем команду разблокировки узла:", nodeId);
                sendServerUnlockNode(nodeId);
            }, 100);
        } else {
            console.log("[useBoardState:handleNodeDragEnd] Узел не найден в текущем состоянии, разблокируем:", nodeId);
            sendServerUnlockNode(nodeId);
        }
        
        lastDraggedNodeRef.current = nodeId;
        console.log("[useBoardState:handleNodeDragEnd] Сохранен последний перетаскиваемый узел:", nodeId);
    }, [nodes, setNodes, sendServerUnlockNode, publishWithProcessId, addToAudit]);

    const calculateNodeAbsolutePosition = (targetNode, allNodes) => {
        const nodeMap = new Map(allNodes.map(n => [n.id, n]));

        const computePos = (node, visited = new Set()) => {
            if (visited.has(node.id)) {
                console.warn(`Циклическая ссылка в родителях узла ${node.id}`);
                return { x: 0, y: 0 };
            }
            visited.add(node.id);

            const { x, y } = node.position;

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

    const sendServerDelete = useCallback((itemsToDelete) => {
        const nodesToDelete = itemsToDelete.nodes || [];
        const edgesToDelete = itemsToDelete.edges || [];
        console.log("[useBoardState:handleDeleteItems] Удаление элементов:", { nodes: nodesToDelete, edges: edgesToDelete });
        console.log(JSON.stringify(nodesToDelete));
        console.log(JSON.stringify(edgesToDelete));
        console.log(edgesToDelete.length > 0);
        if (edgesToDelete && edgesToDelete.length > 0) {
            console.log("ПРОВЕРКА")
            edgesToDelete.forEach(edge => {
                const connectorId = String(edge.id);
                if (connectorId) {
                    // Сохраняем удаляемое соединение
                    deletedItemsMapRef.current.set(connectorId, edge);
                    
                    // Отправляем запрос на сервер
                    const processId = publishWithProcessId('/app/connectors/delete', connectorId);
                    
                    // Связываем processId с соединением
                    processIdMapRef.current.set(connectorId, processId);
                    
                    // Добавляем в аудит операцию удаления соединения
                    addToAudit(processId, {
                        type: 'DELETE_CONNECTOR',
                        connectorId: connectorId,
                        connectionData: edge
                    });
                    
                    console.log(`[useBoardState:handleDelete] Связали connectorId ${connectorId} с processId ${processId} для операции удаления соединения`);
                }
            });

            // Удаляем из локального состояния
            setEdges(prevEdges =>
                prevEdges.filter(edge => !edgesToDelete.some(e => String(e.id) === String(edge.id)))
            );
        }
        
        if (nodesToDelete && nodesToDelete.length > 0) {
            nodesToDelete.forEach(node => {
                const nodeId = String(node.id);
                if (nodeId) {
                    // Сохраняем удаляемый элемент
                    deletedItemsMapRef.current.set(nodeId, node);
                    
                    // Сохраняем связанные соединения
                    const relatedEdges = edges.filter(edge => 
                        String(edge.source) === nodeId || String(edge.target) === nodeId
                    );
                    if (relatedEdges.length > 0) {
                        const nodeWithConnections = {
                            ...node,
                            connections: relatedEdges
                        };
                        deletedItemsMapRef.current.set(nodeId, nodeWithConnections);
                    }
                    
                    // Отправляем запрос на сервер
                    const processId = publishWithProcessId('/app/items/delete', nodeId);
                    
                    // Связываем processId с элементом
                    processIdMapRef.current.set(nodeId, processId);
                    
                    // Добавляем в аудит операцию удаления узла
                    addToAudit(processId, {
                        type: 'DELETE_NODE',
                        nodeId: nodeId,
                        nodeData: node,
                        connections: relatedEdges.length > 0 ? relatedEdges : undefined
                    });
                    
                    console.log(`[useBoardState:handleDelete] Связали nodeId ${nodeId} с processId ${processId} для операции удаления узла`);
                }
            });
            
            // Удаляем из локального состояния
            setNodes(prevNodes =>
                prevNodes.filter(node => !nodesToDelete.some(n => String(n.id) === String(node.id)))
            );
            
            const deletedNodeIds = nodesToDelete.map(node => String(node.id));
            setEdges(prevEdges => 
                prevEdges.filter(edge => 
                    !deletedNodeIds.includes(edge.source) && 
                    !deletedNodeIds.includes(edge.target)
                )
            );
        }
        
        return { nodes, edges };
    }, [publishWithProcessId, setNodes, setEdges, edges, addToAudit]);

    const processServerConnectionUpdate = useCallback((connectorRs, type) => {
        const connectorId = parseInt(connectorRs.id, 10);
        
        setEdges((prevEdges) => {
            if (pendingConnectorUpdatesRef.current.has(connectorId) && type === "UPDATE_CONNECTOR") {
                pendingConnectorUpdatesRef.current.delete(connectorId);
                return prevEdges;
            }
            
            const stringId = String(connectorId);
            const existingIndex = prevEdges.findIndex((e) => String(e.id) === stringId);
            const newEdge = transformConnectorToEdge(connectorRs);
            
            if (existingIndex >= 0) {
                const updated = [...prevEdges];
                updated[existingIndex] = newEdge;
                return updated;
            } else {
                return [...prevEdges, newEdge];
            }
        });
    }, [setEdges, transformConnectorToEdge]);

    const processServerConnectionDelete = useCallback((connectorId) => {
        if (pendingConnectorUpdatesRef.current.has(connectorId)) {
            pendingConnectorUpdatesRef.current.delete(connectorId);
            return;
        }
        
        setEdges((prevEdges) => prevEdges.filter((e) => String(e.id) !== String(connectorId)));
    }, [setEdges]);

    const sendServerCreateConnection = useCallback((params) => {
        // Генерируем временный ID
        const tempId = `temp-conn-${uuidv4()}`;
        
        // Создаем новое соединение с временным ID
        const newEdge = { 
            ...params, 
            id: tempId, 
            type: 'floating',
            label: '',
            data: { style: {} }
        };
        
        // Добавляем соединение в локальное состояние
        setEdges(prevEdges => [...prevEdges, newEdge]);
        
        // Сохраняем соединение во временном хранилище
        tempItemsMapRef.current.set(tempId, newEdge);
        
        // Подготавливаем данные для отправки
        const payload = {
            startItem: params.source,
            endItem: params.target,
            content: '',
            tempId: tempId
        };
        
        // Отправляем запрос на сервер
        const processId = publishWithProcessId('/app/connectors/create', payload);
        
        // Связываем processId с соединением
        processIdMapRef.current.set(tempId, processId);
        
        // Добавляем в аудит операцию создания соединения
        addToAudit(processId, {
            type: 'CREATE_CONNECTOR',
            tempId: tempId,
            connectionData: newEdge,
            payload: payload
        });
        
        console.log(`[useBoardState:createConnectionOnServer] Связали tempId ${tempId} с processId ${processId} для операции создания соединения`);
        
        return tempId;
    }, [publishWithProcessId, setEdges, addToAudit]);

    const sendServerRequestBoardData = useCallback((targetBoardId) => {
        const processId = publishWithProcessId('/app/board/load', targetBoardId);
        
        // Добавляем в аудит операцию загрузки доски
        addToAudit(processId, {
            type: 'LOAD_BOARD',
            boardId: targetBoardId
        });
        
        console.log(`[useBoardState:requestBoardDataFromServer] Связали boardId ${targetBoardId} с processId ${processId} для операции загрузки доски`);
        
        return processId;
    }, [publishWithProcessId, addToAudit]);

    const processServerBoardData = useCallback((fullData) => {
        const { items = [], connectors = [] } = fullData;
        
        const parsedItems = items.map((raw) => ItemRs.fromServer(raw));
        
        const sortedItems = sortItemsWithParentsFirst(parsedItems);
        console.log("[useBoardState:handleBoardDataFromServer]", sortedItems);
        
        const loadedNodes = sortedItems.map((item) => {
            const baseNode = itemToNode(item, userLogin);
            if (baseNode.parentId) {
                baseNode.extent = "parent";
            }
            // originalNodesRef.current[nodeWithFunctions.id] = nodeWithFunctions;
            return attachNodeHandlers(baseNode, getNodeHandlers());
        });
        
        const loadedEdges = connectors.map((conn) => ({
            id: String(conn.id),
            source: String(conn.startItem),
            target: String(conn.endItem),
            type: 'floating',
            label: conn.content,
            data: { style: conn.style || {} },
        }));
        
        setNodes(loadedNodes);
        setEdges(loadedEdges);
    }, [setNodes, setEdges, attachNodeHandlers, getNodeHandlers]);

    const handleConnect = useCallback((params) => {
        sendServerCreateConnection(params);
        setEdges((prevEdges) => addEdge({ ...params, type: 'floating' }, prevEdges));
    }, [setEdges, sendServerCreateConnection]);

    const handleEdgeUpdate = useCallback((oldEdge, newConnection) => {
        setEdges((prevEdges) => applyEdgeChanges(oldEdge, newConnection, prevEdges));
    }, [setEdges]);

    // В самом конце hook, переопределяем getNodeHandlers
    // Этот код должен быть размещен после всех зависимых функций
    // Переопределяем getNodeHandlers, чтобы она использовала мемоизированную реализацию
    getNodeHandlers = useCallback(() => {
        return {
            onLabelChange: handleNodeLabelChange,
            onStyleChange: handleNodeStyleChange,
            onDataChange: handleNodeDataChange,
            detachFromParent: detachNodeFromParentFrame,
            onResizeStart: handleNodeResizeStart,
            onResize: handleNodeResize,
            onResizeEnd: handleNodeResizeEnd
        };
    }, [
        handleNodeLabelChange,
        handleNodeStyleChange,
        handleNodeDataChange,
        detachNodeFromParentFrame,
        handleNodeResizeStart,
        handleNodeResize,
        handleNodeResizeEnd
    ]);

    const formatLockedByField = useCallback((node) => {
        // Проверяем, заблокирован ли узел текущим пользователем
        return node.lockedByLogin === userLogin ? "me" : node.lockedBy;
    }, [userLogin]);

    // Обработчик подтверждения создания элемента
    const handleItemCreationConfirmed = useCallback((processId, newItem) => {
        console.log(`[useBoardState:handleItemCreationConfirmation] Подтверждено создание элемента: ${processId}`, newItem);
        
        // Находим ID элемента по processId
        const tempNodeId = getNodeIdByProcessId(processId);
        if (!tempNodeId) {
            console.warn(`Не найден временный элемент для processId: ${processId}`);
            return;
        }
        
        // Удаляем запись из аудита при успешном подтверждении
        removeFromAudit(processId);
        
        // Сохраняем связь временного ID с реальным ID
        tempIdToRealIdMapRef.current.set(tempNodeId, newItem.id);
        
        // Преобразуем полученные данные в формат узла React Flow
        const serverNode = itemToNode(newItem, userLogin);
        
        // Обновляем ID элемента и другие поля
        setNodes(prevNodes => {
            return prevNodes.map(node => {
                if (String(node.id) === String(tempNodeId)) {
                    // Создаем обновленный узел с реальным ID и данными от сервера
                    const updatedNode = {
                        ...node,
                        id: String(newItem.id),
                        data: {
                            ...serverNode.data,
                            functions: node.data.functions // Сохраняем функции
                        },
                        style: serverNode.style || node.style,
                        measured: serverNode.measured || node.measured
                    };
                    
                    // Удаляем временный элемент из хранилища
                    tempItemsMapRef.current.delete(tempNodeId);
                    
                    return updatedNode;
                }
                return node;
            });
        });
        
        // Обновляем соединения, если есть
        setEdges(prevEdges => {
            return prevEdges.map(edge => {
                const updatedEdge = { ...edge };
                if (edge.source === tempNodeId) {
                    updatedEdge.source = String(newItem.id);
                }
                if (edge.target === tempNodeId) {
                    updatedEdge.target = String(newItem.id);
                }
                return updatedEdge;
            });
        });
        
        // Очищаем запись в картах
        processIdMapRef.current.delete(tempNodeId);
        processIdMapRef.current.set(String(newItem.id), processId);
    }, [getNodeIdByProcessId, setNodes, setEdges, userLogin]);

    // Обработчик отказа в создании элемента
    const handleItemCreationFailed = useCallback((processId, error) => {
        console.error(`Ошибка создания элемента: ${processId}`, error);
        
        // Находим ID элемента по processId
        const tempNodeId = getNodeIdByProcessId(processId);
        if (!tempNodeId) {
            console.warn(`Не найден временный элемент для processId: ${processId}`);
            return;
        }
        
        // Удаляем элемент из состояния
        setNodes(prevNodes => prevNodes.filter(node => String(node.id) !== String(tempNodeId)));
        
        // Удаляем соединения, связанные с этим элементом
        setEdges(prevEdges => 
            prevEdges.filter(edge => 
                edge.source !== tempNodeId && edge.target !== tempNodeId
            )
        );
        
        // Очищаем записи в картах
        tempItemsMapRef.current.delete(tempNodeId);
        processIdMapRef.current.delete(tempNodeId);
    }, [getNodeIdByProcessId, setNodes, setEdges]);

    // Обработчик подтверждения обновления элемента
    const handleItemUpdateConfirmed = useCallback((processId, updatedItem) => {
        console.log(`[useBoardState:handleItemUpdateConfirmation] Подтверждено обновление элемента: ${processId}`, updatedItem);
        
        // Находим ID элемента по processId
        const nodeId = getNodeIdByProcessId(processId);
        if (!nodeId) {
            console.warn(`Не найден элемент для обновления по processId: ${processId}`);
            return;
        }
        
        // Удаляем запись из аудита при успешном подтверждении
        removeFromAudit(processId);
        
        // Удаляем предыдущее состояние
        prevStatesMapRef.current.delete(nodeId);
        
        // Применяем актуальные данные с сервера, если есть расхождения
        setNodes(prevNodes => {
            const existingNode = prevNodes.find(n => String(n.id) === String(nodeId));
            if (!existingNode) return prevNodes;
            
            // Создаем обновленный узел с данными с сервера
            const serverNode = itemToNode(updatedItem, userLogin);
            
            // Если есть значительные расхождения, применяем данные с сервера
            if (serverNode.position.x !== existingNode.position.x ||
                serverNode.position.y !== existingNode.position.y ||
                serverNode.data.label !== existingNode.data.label) {
                
                return prevNodes.map(node => {
                    if (String(node.id) === String(nodeId)) {
                        return attachNodeHandlers({
                            ...node,
                            position: serverNode.position,
                            data: {
                                ...node.data,
                                label: serverNode.data.label,
                                style: serverNode.data.style
                            }
                        }, getNodeHandlers());
                    }
                    return node;
                });
            }
            
            return prevNodes;
        });
    }, [getNodeIdByProcessId, attachNodeHandlers, getNodeHandlers, setNodes]);

    // Обработчик отказа в обновлении элемента
    const handleItemUpdateFailed = useCallback((processId, error) => {
        console.error(`Ошибка обновления элемента: ${processId}`, error);
        
        // Находим ID элемента по processId
        const nodeId = getNodeIdByProcessId(processId);
        if (!nodeId) {
            console.warn(`Не найден элемент для отката обновления по processId: ${processId}`);
            return;
        }
        
        // Получаем предыдущее состояние элемента
        const prevState = prevStatesMapRef.current.get(nodeId);
        if (!prevState) {
            console.warn(`Не найдено предыдущее состояние для элемента: ${nodeId}`);
            return;
        }
        
        // Откатываем изменения
        setNodes(prevNodes => {
            return prevNodes.map(node => {
                if (String(node.id) === String(nodeId)) {
                    return attachNodeHandlers(prevState, getNodeHandlers());
                }
                return node;
            });
        });
        
        // Удаляем предыдущее состояние
        prevStatesMapRef.current.delete(nodeId);
    }, [getNodeIdByProcessId, attachNodeHandlers, getNodeHandlers, setNodes]);

    // Обработчик подтверждения удаления элемента
    const handleItemDeleteConfirmed = useCallback((processId) => {
        console.log(`[useBoardState:handleItemDeleteConfirmation] Подтверждено удаление элемента: ${processId}`);
        
        // Удаляем запись из аудита при успешном подтверждении
        removeFromAudit(processId);
        
        // Очищаем запись об удаленном элементе
        const nodeId = getNodeIdByProcessId(processId);
        if (nodeId) {
            deletedItemsMapRef.current.delete(nodeId);
            processIdMapRef.current.delete(nodeId);
        }
    }, [getNodeIdByProcessId, removeFromAudit]);

    // Обработчик отказа в удалении элемента
    const handleItemDeleteFailed = useCallback((processId, error) => {
        console.error(`Ошибка удаления элемента: ${processId}`, error);
        
        // Находим ID элемента по processId
        const nodeId = getNodeIdByProcessId(processId);
        if (!nodeId) {
            console.warn(`Не найден элемент для восстановления по processId: ${processId}`);
            return;
        }
        
        // Получаем сохраненное состояние элемента
        const deletedItem = deletedItemsMapRef.current.get(nodeId);
        if (!deletedItem) {
            console.warn(`Не найдено состояние удаленного элемента: ${nodeId}`);
            return;
        }
        
        // Восстанавливаем элемент
        setNodes(prevNodes => {
            // Проверяем, действительно ли элемент отсутствует
            const exists = prevNodes.some(node => String(node.id) === String(nodeId));
            if (exists) return prevNodes;
            
            // Восстанавливаем элемент
            return [...prevNodes, attachNodeHandlers(deletedItem, getNodeHandlers())];
        });
        
        // Восстанавливаем соединения, если они были
        if (deletedItem.connections) {
            setEdges(prevEdges => {
                return [...prevEdges, ...deletedItem.connections];
            });
        }
        
        // Очищаем запись
        deletedItemsMapRef.current.delete(nodeId);
    }, [getNodeIdByProcessId, setNodes, attachNodeHandlers, getNodeHandlers, setEdges]);

    // Обработчики для соединений - по аналогии с элементами
    const handleConnectorCreationConfirmed = useCallback((processId, newConnector) => {
        console.log(`[useBoardState:handleConnectorCreationConfirmation] Подтверждено создание соединения: ${processId}`, newConnector);
        
        const tempConnectorId = getNodeIdByProcessId(processId);
        if (!tempConnectorId) return;
        
        // Удаляем запись из аудита при успешном подтверждении
        removeFromAudit(processId);
        
        setEdges(prevEdges => {
            return prevEdges.map(edge => {
                if (String(edge.id) === String(tempConnectorId)) {
                    return {
                        ...edge,
                        id: String(newConnector.id),
                        data: {
                            ...edge.data,
                            id: newConnector.id
                        }
                    };
                }
                return edge;
            });
        });
        
        tempItemsMapRef.current.delete(tempConnectorId);
        processIdMapRef.current.delete(tempConnectorId);
        processIdMapRef.current.set(String(newConnector.id), processId);
    }, [getNodeIdByProcessId, setEdges]);

    const handleConnectorCreationFailed = useCallback((processId, error) => {
        console.error(`Ошибка создания соединения: ${processId}`, error);
        
        const tempConnectorId = getNodeIdByProcessId(processId);
        if (!tempConnectorId) return;
        
        setEdges(prevEdges => 
            prevEdges.filter(edge => String(edge.id) !== String(tempConnectorId))
        );
        
        tempItemsMapRef.current.delete(tempConnectorId);
        processIdMapRef.current.delete(tempConnectorId);
    }, [getNodeIdByProcessId, setEdges]);

    // Обработчик подтверждения блокировки элемента
    const handleItemLockConfirmed = useCallback((processId, lockData) => {
        console.log(`[useBoardState:handleLockConfirmation] Подтверждена блокировка элемента: ${processId}`, lockData);
        
        // Находим ID элемента по processId
        const nodeId = getNodeIdByProcessId(processId);
        if (!nodeId) {
            console.warn(`Не найден элемент для блокировки по processId: ${processId}`);
            return;
        }
        
        // Удаляем запись из аудита при успешном подтверждении
        removeFromAudit(processId);

        // Отмечаем, что блокировка подтверждена
        setNodes(prevNodes => {
            return prevNodes.map(node => {
                if (String(node.id) === String(nodeId)) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            isLocked: true,
                            lockedBy: "me", // так как это ответ на наш запрос блокировки
                            lockedByLogin: userLogin,
                            lockConfirmed: true, // подтверждаем блокировку
                            waitingForLock: false // сбрасываем флаг ожидания
                        }
                    };
                }
                return node;
            });
        });
    }, [getNodeIdByProcessId, setNodes, userLogin]);

    // Обработчик подтверждения обновления заблокированного элемента
    const handleLockedItemUpdateConfirmed = useCallback((processId, updatedData) => {
        console.log(`[useBoardState:handleLockedNodeUpdatedConfirmation] Подтверждено обновление заблокированного элемента: ${processId}`, updatedData);
        
        // Удаляем запись из аудита при успешном подтверждении
        removeFromAudit(processId);
        
        // Находим ID элемента по processId
        const nodeId = getNodeIdByProcessId(processId);
        if (nodeId) {
            // Удаляем предыдущее состояние
            prevStatesMapRef.current.delete(nodeId);
        }
        
        // Здесь можно реализовать дополнительную логику, если нужно
        // Обычно специальной обработки не требуется, так как изменения
        // уже применены оптимистично
    }, [removeFromAudit, getNodeIdByProcessId]);

    // Обработчик подтверждения разблокировки элемента
    const handleItemUnlockConfirmed = useCallback((processId, unlockData) => {
        console.log(`[useBoardState:handleUnlockConfirmation] Подтверждена разблокировка элемента: ${processId}`, unlockData);
        
        // Находим ID элемента по processId
        const nodeId = getNodeIdByProcessId(processId);
        if (!nodeId) {
            console.warn(`Не найден элемент для разблокировки по processId: ${processId}`);
            return;
        }
        
        // Удаляем запись из аудита при успешном подтверждении
        removeFromAudit(processId);

        // Отмечаем, что элемент разблокирован
        setNodes(prevNodes => {
            return prevNodes.map(node => {
                if (String(node.id) === String(nodeId)) {
                    return {
                        ...node,
                        draggable: true, // Разблокируем перетаскивание
                        selectable: true, // Разрешаем выделение
                        connectable: true, // Разрешаем подключения
                        deletable: true, // Разрешаем удаление
                        focusable: true, // Разрешаем фокусировку
                        data: {
                            ...node.data,
                            isLocked: false,
                            lockedBy: undefined,
                            lockedByLogin: undefined,
                            lockConfirmed: false,
                            waitingForLock: false
                        }
                    };
                }
                return node;
            });
        });
    }, [getNodeIdByProcessId, setNodes]);

    // Обработчик ошибки блокировки элемента
    const handleItemLockFailed = useCallback((processId, error) => {
        console.error(`Ошибка блокировки элемента: ${processId}`, error);
        
        // Находим ID элемента по processId
        const nodeId = getNodeIdByProcessId(processId);
        if (!nodeId) {
            console.warn(`Не найден элемент для отмены блокировки по processId: ${processId}`);
            return;
        }

        // Сбрасываем флаг ожидания блокировки
        setNodes(prevNodes => {
            return prevNodes.map(node => {
                if (String(node.id) === String(nodeId)) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            waitingForLock: false
                        }
                    };
                }
                return node;
            });
        });
    }, [getNodeIdByProcessId, setNodes]);

    // Обработчик ошибки разблокировки элемента
    const handleItemUnlockFailed = useCallback((processId, error) => {
        console.error(`[useBoardState:handleUnlockFailed] Ошибка разблокировки элемента: ${processId}`, error);
        
        // Находим ID элемента по processId
        const nodeId = getNodeIdByProcessId(processId);
        if (!nodeId) {
            console.warn(`[useBoardState:handleUnlockFailed] Не найден элемент для восстановления блокировки: ${processId}`);
            return;
        }
        
        // Показываем уведомление пользователю
        message.warning(`Не удалось разблокировать элемент. Элемент останется заблокированным.`);
        
        // Восстанавливаем состояние элемента как заблокированного
        setNodes(prevNodes => {
            return prevNodes.map(node => {
                if (String(node.id) === String(nodeId)) {
                    // Сохраняем состояние элемента как заблокированного текущим пользователем
                    return {
                        ...node,
                        draggable: false, // Запрещаем перетаскивание
                        data: {
                            ...node.data,
                            isLocked: true,
                            lockedBy: "me", // Элемент по-прежнему заблокирован текущим пользователем
                            lockedByLogin: userLogin,
                            lockConfirmed: true, // Блокировка подтверждена
                            waitingForLock: false
                        }
                    };
                }
                return node;
            });
        });
    }, [getNodeIdByProcessId, setNodes, userLogin]);

    // Обработчик ошибки обновления заблокированного элемента
    const handleLockedItemUpdateFailed = useCallback((processId, error) => {
        console.error(`[useBoardState:handleLockedUpdateFailed] Ошибка обновления заблокированного элемента: ${processId}`, error);
        
        // Находим ID элемента по processId
        const nodeId = getNodeIdByProcessId(processId);
        if (!nodeId) {
            console.warn(`[useBoardState:handleLockedUpdateFailed] Не найден элемент для восстановления состояния: ${processId}`);
            return;
        }
        
        // Проверяем, есть ли сохраненное предыдущее состояние
        const previousState = prevStatesMapRef.current.get(String(nodeId));
        if (!previousState) {
            console.warn(`[useBoardState:handleLockedUpdateFailed] Не найдено предыдущее состояние для элемента: ${nodeId}`);
            console.log("[useBoardState:handleLockedUpdateFailed] prevStatesMapRef", prevStatesMapRef.current);
            return;
        }
        
        // Показываем уведомление пользователю
        message.warning(`Не удалось обновить заблокированный элемент. Восстановлено предыдущее состояние.`);
        
        // Восстанавливаем предыдущее состояние элемента
        setNodes(prevNodes => {
            return prevNodes.map(node => {
                if (String(node.id) === String(nodeId)) {
                    // Применяем предыдущее состояние с сохранением блокировки
                    return {
                        ...previousState,
                        data: {
                            ...previousState.data,
                            isLocked: true,
                            lockedBy: "me",
                            lockedByLogin: userLogin,
                            lockConfirmed: true,
                            waitingForLock: false
                        }
                    };
                }
                return node;
            });
        });
        
        // Очищаем предыдущее состояние из хранилища
        prevStatesMapRef.current.delete(String(nodeId));
    }, [getNodeIdByProcessId, setNodes, userLogin]);

    // Обработчик подтверждения от сервера
    const processServerConfirmation = useCallback((type, processId, data) => {
        switch (type) {
            case 'CREATE_ITEM_CONFIRMED':
                handleItemCreationConfirmed(processId, data);
                break;
            case 'UPDATE_ITEM_CONFIRMED':
                handleItemUpdateConfirmed(processId, data);
                break;
            case 'DELETE_ITEM_CONFIRMED':
                handleItemDeleteConfirmed(processId);
                break;
            case 'CREATE_CONNECTOR_CONFIRMED':
                handleConnectorCreationConfirmed(processId, data);
                break;
            case 'UPDATE_CONNECTOR_CONFIRMED':
                // Аналогично handleItemUpdateConfirmed
                break;
            case 'DELETE_CONNECTOR_CONFIRMED':
                // Аналогично handleItemDeleteConfirmed
                break;
            case 'ITEM_LOCK_CONFIRMED':
                handleItemLockConfirmed(processId, data);
                break;
            case 'ITEM_UNLOCK_CONFIRMED':
                handleItemUnlockConfirmed(processId, data);
                break;
            case 'LOCKED_ITEM_UPDATE_CONFIRMED':
                handleLockedItemUpdateConfirmed(processId, data);
                break;
            default:
                console.warn(`Неизвестный тип подтверждения: ${type}`);
        }
    }, [
        handleItemCreationConfirmed,
        handleItemUpdateConfirmed,
        handleItemDeleteConfirmed,
        handleConnectorCreationConfirmed,
        handleItemLockConfirmed,
        handleItemUnlockConfirmed,
        handleLockedItemUpdateConfirmed,
        removeFromAudit
    ]);

    // Функция для выполнения точечного отката изменений в зависимости от типа операции
    const rollbackOperation = useCallback((processId) => {
        // Получаем информацию об операции из аудита
        const auditRecord = operationsAuditRef.current.get(processId);
        if (!auditRecord) {
            console.warn(`[useBoardState:rollbackOperation] Не найдена запись в аудите для processId: ${processId}`);
            return false;
        }

        console.log(`[useBoardState:rollbackOperation] Выполняем откат операции: ${processId}`, auditRecord);

        const { type, nodeId, previousState } = auditRecord;

        switch (type) {
            case 'UPDATE_NODE_LABEL':
                // Откат только изменения метки
                setNodes(prevNodes =>
                    prevNodes.map(node => {
                        if (String(node.id) === String(nodeId)) {
                            return {
                                ...node,
                                data: {
                                    ...node.data,
                                    label: previousState.data.label
                                }
                            };
                        }
                        return node;
                    })
                );
                break;

            case 'UPDATE_NODE_STYLE':
                // Откат только изменений стиля
                setNodes(prevNodes =>
                    prevNodes.map(node => {
                        if (String(node.id) === String(nodeId)) {
                            return {
                                ...node,
                                data: {
                                    ...node.data,
                                    style: previousState.data.style || {}
                                }
                            };
                        }
                        return node;
                    })
                );
                break;

            case 'UPDATE_NODE_PARENT':
                // Откат изменения родителя и позиции
                setNodes(prevNodes =>
                    prevNodes.map(node => {
                        if (String(node.id) === String(nodeId)) {
                            return {
                                ...node,
                                parentId: previousState.parentId,
                                extent: previousState.extent,
                                position: previousState.position,
                                data: {
                                    ...node.data,
                                    parentId: previousState.data.parentId,
                                    position: previousState.position
                                }
                            };
                        }
                        return node;
                    })
                );
                break;

            case 'UPDATE_LOCKED_NODE':
                // Откат изменения заблокированного узла в зависимости от типа обновления
                console.log("ПРОВЕРКА")
                if (auditRecord.updateType === "geometry") {
                    console.log("ОТКАТ")
                    setNodes(prevNodes =>
                        prevNodes.map(node => {
                            if (String(node.id) === String(nodeId)) {
                                return {
                                    ...node,
                                    measured: previousState.measured,
                                    width: previousState.width,
                                    height: previousState.height,
                                    data: {
                                        ...node.data,
                                        geometry: previousState.data.geometry
                                    }
                                };
                            }
                            return node;
                        })
                    );
                } else if (auditRecord.updateType === "position") {
                    // Откат только позиции
                    setNodes(prevNodes =>
                        prevNodes.map(node => {
                            if (String(node.id) === String(nodeId)) {
                                return {
                                    ...node,
                                    position: previousState.position,
                                    data: {
                                        ...node.data,
                                        position: previousState.position
                                    }
                                };
                            }
                            return node;
                        })
                    );
                }
                break;

            case 'DETACH_NODE':
                // Восстановление связи с родителем
                setNodes(prevNodes =>
                    prevNodes.map(node => {
                        if (String(node.id) === String(nodeId)) {
                            return {
                                ...node,
                                parentId: previousState.parentId,
                                extent: previousState.extent,
                                position: previousState.position,
                                data: {
                                    ...node.data,
                                    parentId: previousState.data.parentId,
                                    position: previousState.position
                                }
                            };
                        }
                        return node;
                    })
                );
                break;

            case 'CREATE_NODE':
                // Удаление созданного узла
                console.log('CREATE_NODE');
                setNodes(prevNodes =>
                    prevNodes.filter(node => String(node.id) !== String(auditRecord.tempId))
                );
                break;

            case 'CREATE_CONNECTOR':
                // Удаление созданного соединения
                setEdges(prevEdges =>
                    prevEdges.filter(edge => String(edge.id) !== String(auditRecord.tempId))
                );
                break;

            case 'DELETE_NODE':
                // Восстановление удаленного узла
                if (previousState) {
                    setNodes(prevNodes => {
                        const nodeExists = prevNodes.some(n => String(n.id) === String(nodeId));
                        if (nodeExists) return prevNodes;
                        return [...prevNodes, attachNodeHandlers(previousState, getNodeHandlers())];
                    });

                    // Восстановление связанных соединений
                    if (auditRecord.connections) {
                        setEdges(prevEdges => [...prevEdges, ...auditRecord.connections]);
                    }
                }
                break;

            case 'DELETE_CONNECTOR':
                // Восстановление удаленного соединения
                if (auditRecord.connectionData) {
                    setEdges(prevEdges => {
                        const edgeExists = prevEdges.some(e => String(e.id) === String(auditRecord.connectorId));
                        if (edgeExists) return prevEdges;
                        return [...prevEdges, auditRecord.connectionData];
                    });
                }
                break;

            case 'UPDATE_NODE_DATA':
                // Откат изменений data (включая тип фигуры)
                setNodes(prevNodes =>
                    prevNodes.map(node => {
                        if (String(node.id) === String(nodeId)) {
                            return {
                                ...node,
                                shape: previousState.shape,
                                data: {
                                    ...node.data,
                                    ...previousState.data,
                                    functions: node.data.functions // Сохраняем функции
                                }
                            };
                        }
                        return node;
                    })
                );
                break;

            default:
                console.warn(`[useBoardState:rollbackOperation] Неизвестный тип операции: ${type}`);
                return false;
        }

        // Удаляем запись из аудита после отката
        removeFromAudit(processId);
        return true;
    }, [setNodes, setEdges, attachNodeHandlers, getNodeHandlers, removeFromAudit]);

    // Обработчик ошибок от сервера
    const processServerError = useCallback((type, processId, error) => {
        console.error(`[useBoardState:processServerError] Получена ошибка от сервера: ${type}, processId: ${processId}`, error);
        
        // Для контроля частоты уведомлений используем глобальный ref
        const currentTime = Date.now();
        
        // Функция для проверки, следует ли показывать уведомление
        const shouldShowNotification = (errorType) => {
            // Если такой ошибки не было или прошло достаточно времени, показываем уведомление
            if (!lastErrorsRef.current[errorType] || (currentTime - lastErrorsRef.current[errorType]) > 2000) {
                lastErrorsRef.current[errorType] = currentTime;
                return true;
            }
            return false;
        };
        
        // Проверяем, есть ли информация об операции в аудите
        const auditRecord = operationsAuditRef.current.get(processId);

        // Используем rollbackOperation для отката изменений
        const rollbackSuccess = rollbackOperation(processId);
        
        // Показываем сообщение пользователю в зависимости от типа ошибки
        if (rollbackSuccess) {
            // Группируем ошибки по типам для предотвращения спама уведомлений
            switch (type) {
                case 'CREATE_ITEM_FAILED':
                    if (shouldShowNotification('create_item')) {
                        message.error('Не удалось создать элемент. Операция отменена.');
                    }
                    break;
                case 'UPDATE_ITEM_FAILED':
                    if (shouldShowNotification('update_item')) {
                        message.error('Не удалось обновить элемент. Изменения отменены.');
                    }
                    break;
                case 'DELETE_ITEM_FAILED':
                    if (shouldShowNotification('delete_item')) {
                        message.error('Не удалось удалить элемент. Операция отменена.');
                    }
                    break;
                case 'CREATE_CONNECTOR_FAILED':
                    if (shouldShowNotification('create_connector')) {
                        message.error('Не удалось создать соединение. Операция отменена.');
                    }
                    break;
                case 'ITEM_LOCK_FAILED':
                    if (shouldShowNotification('lock_item')) {
                        message.error('Не удалось заблокировать элемент. Возможно, он уже заблокирован другим пользователем.');
                    }
                    break;
                case 'ITEM_UNLOCK_FAILED':
                    if (shouldShowNotification('unlock_item')) {
                        message.error('Не удалось разблокировать элемент. Элемент останется заблокированным.');
                    }
                    break;
                case 'LOCKED_ITEM_UPDATE_FAILED':
                    if (shouldShowNotification('update_locked_item')) {
                        message.error('Не удалось обновить заблокированный элемент. Изменения отменены.');
                    }
                    break;
                default:
                    if (shouldShowNotification('unknown')) {
                        message.error(`Произошла ошибка: ${error?.message || 'Неизвестная ошибка'}`);
                    }
            }
        } else {
            // Если откат не удался, показываем общее сообщение об ошибке
            if (shouldShowNotification('rollback_failed')) {
                message.error('Произошла ошибка, не удалось отменить изменения.');
                console.error('[useBoardState:processServerError] Не удалось выполнить откат операции:', auditRecord);
            }
        }
    }, [
        getNodeIdByProcessId, 
        setNodes, 
        setEdges, 
        rollbackOperation
    ]);

    // В экспорте оставляем только используемые функции
    return {
        nodes,
        edges,
        
        onNodesChange: onNodesChange,
        onEdgesChange: onEdgesChange,
        onConnect: handleConnect,
        onEdgeUpdate: handleEdgeUpdate,
        onNodeDragStart: handleNodeDragStart,
        onNodeDrag: handleNodeDrag,
        onNodeDragStop: handleNodeDragEnd,
        onDelete: sendServerDelete,
        createNewNode: sendServerCreateNode,
        handleNodeUpdateFromServer: processServerNodeUpdate,
        handleNodeRemoveFromServer: processServerNodeDelete,
        handleConnectionUpdateFromServer: processServerConnectionUpdate,
        handleConnectionRemoveFromServer: processServerConnectionDelete,
        handleBoardDataFromServer: processServerBoardData,
        loadBoardData: sendServerRequestBoardData,
        handleNodeLocked: processServerNodeLocked,
        handleNodeUnlocked: processServerNodeUnlocked,
        handleLockedNodeUpdate: processServerLockedNodeUpdate,
        formatLockedByField,
        getProcessIdForNode: (nodeId) => processIdMapRef.current.get(String(nodeId)),
        handleServerConfirmation: processServerConfirmation,
        handleServerError: processServerError,
        getTempIdByRealId,
        rollbackOperation
    };
};
