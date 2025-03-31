import { useCallback, useEffect, useState, useRef } from 'react';
import { useNodesState, useEdgesState, addEdge, updateEdge } from 'reactflow';
import { getDefaultItem } from '../utils/boardUtils';
import { itemToNode, nodeToItem } from '../utils/itemMapper';
import { Position, Geometry, ItemRs } from '../model/ItemDto';

/**
 * ---------------------------------------------------------------------------
 *                           Секция работы с сетью
 * ---------------------------------------------------------------------------
 */

/**
 * Безопасная публикация сообщения через WebSocket с обработкой ошибок
 * @param {boolean} isConnected - Флаг подключения WebSocket
 * @param {Function} publishFn  - Функция, которая отправляет сообщение на сервер
 */
function useSafePublish(isConnected, publishFn) {
    return useCallback((destination, body) => {
        if (!isConnected) {
            // Генерируем ошибку или вызываем уведомление
            console.error('[useSafePublish] Соединение не установлено, отправка невозможна.');
            // Можно кинуть ошибку, если нужно:
            // throw new Error('WebSocket is not connected');
            return;
        }
        console.log('[useSafePublish] Отправка на:', destination, 'Тело:', body);
        publishFn(destination, body);
    }, [isConnected, publishFn]);
}

/**
 * ---------------------------------------------------------------------------
 *            Секция вспомогательных функций для локального состояния
 * ---------------------------------------------------------------------------
 */

/**
 * Универсальная функция для добавления общих функций в data.functions узла.
 * Это решает проблему дублирования логики в разных местах кода.
 */
function assignNodeFunctions(
    node,
    { updateNodeLabel, updateNodeOnServer, removeNode, disableDragging, enableDragging }
) {
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
            },
        },
    };
}

/**
 * ---------------------------------------------------------------------------
 *                     Основной хук для работы со состоянием доски
 * ---------------------------------------------------------------------------
 *
 * @param {object} params
 * @param {object} params.stompClient - клиент для отправки сообщений по WS
 * @param {Function} params.publish   - функция публикации с проверкой connected
 * @param {boolean} params.connected  - статус соединения
 */
export const useBoardState = ({ stompClient, publish, connected }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedElements, setSelectedElements] = useState([]);
    const originalNodesRef = useRef({});

    // (5) Используем улучшенную функцию безопасной отправки
    const safePublish = useSafePublish(connected, publish);

    // ----------------------------------------------------------------------------
    //                          Функции для локального состояния
    // ----------------------------------------------------------------------------

    // (2), (4) и (7) Переименовали/отделили, убрали дублирование
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

    // Обновляем label узла
    const updateNodeLabel = useCallback((id, newLabel) => {
        console.log('[useBoardState][updateNodeLabel] Обновление label для узла', id, 'на', newLabel);

        setNodes((prevNodes) =>
            prevNodes.map((node) => {
                if (node.id !== id) return node;
                // Применяем функцию assignNodeFunctions, чтобы не дублировать
                const updatedNode = assignNodeFunctions(
                    {
                        ...node,
                        data: {
                            ...node.data,
                            label: newLabel,
                        },
                    },
                    { updateNodeLabel, updateNodeOnServer, removeNode, disableDragging, enableDragging }
                );
                // Сразу отправляем обновление на сервер
                updateNodeOnServer(updatedNode);
                return updatedNode;
            })
        );
    }, [setNodes, updateNodeOnServer, removeNode]);

    // Отключение/включение перетаскивания
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

    // Создание узла
    const createNewNode = useCallback((boardIdForNode, type) => {
        const position = { x: Math.random() * 400, y: Math.random() * 400 };
        const { data, style, width, height } = getDefaultItem(type);

        const payload = {
            boardId: boardIdForNode,
            type,
            position: new Position(position),
            geometry: new Geometry({ width, height, rotation: 0 }),
            data: { ...data, dataType: type },
            style: { ...style, styleType: type },
        };
        console.log('[useBoardState][createNewNode] Тип:', type, 'Payload:', payload);
        safePublish('/app/items/create', payload);
    }, [safePublish]);

    // Загрузка данных доски
    const loadBoardData = useCallback((targetBoardId) => {
        console.log('[useBoardState][loadBoardData] Загрузка данных, boardId:', targetBoardId);
        safePublish('/app/items/load', targetBoardId);
    }, [safePublish]);

    // Удаляем последний узел
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

    // Обработчики рёбер
    const onConnect = useCallback((params) => {
        console.log('[useBoardState][onConnect] Создание ребра:', params);
        setEdges((prevEdges) => addEdge({ ...params, type: 'floating' }, prevEdges));
    }, [setEdges]);

    const onEdgeUpdate = useCallback((oldEdge, newConnection) => {
        console.log('[useBoardState][onEdgeUpdate] Старое:', oldEdge, 'Новое:', newConnection);
        setEdges((prevEdges) => updateEdge(oldEdge, newConnection, prevEdges));
    }, [setEdges]);

    // Обработка выделенных элементов (nodes/edges)
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

    // Обработка входящих сообщений от сервера
    const updateNodeFromWS = useCallback((item) => {
        console.log('[useBoardState][updateNodeFromWS] Пришёл item:', item);
        const newNode = itemToNode(item);

        setNodes((prevNodes) => {
            const idx = prevNodes.findIndex((n) => n.id === newNode.id);

            // Применяем assignNodeFunctions, чтобы не дублировать
            const nodeWithFunctions = assignNodeFunctions(
                { ...newNode, draggable: true },
                { updateNodeLabel, updateNodeOnServer, removeNode, disableDragging, enableDragging }
            );

            if (idx >= 0) {
                console.log('[useBoardState][updateNodeFromWS] Обновляем существующий узел:', newNode.id);
                const updatedNodes = [...prevNodes];
                updatedNodes[idx] = nodeWithFunctions;
                originalNodesRef.current[newNode.id] = nodeWithFunctions;
                return updatedNodes;
            } else {
                console.log('[useBoardState][updateNodeFromWS] Добавляем новый узел:', newNode.id);
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
        enableDragging
    ]);

    // Установка начального состояния (INITIAL)
    const setBoardData = useCallback((itemsData) => {
        console.log('[useBoardState][setBoardData] Начальные данные:', itemsData);
        const items = itemsData.map((raw) => ItemRs.fromServer(raw));

        const loadedNodes = items.map((item) => {
            const baseNode = itemToNode(item);

            const nodeWithFunctions = assignNodeFunctions(
                { ...baseNode, draggable: true },
                { updateNodeLabel, updateNodeOnServer, removeNode, disableDragging, enableDragging }
            );

            // Сохраняем в ref для дальнейшего сравнения
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

    // При прекращении перетаскивания узла
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

        updateNodeOnServer(draggedNode);
        originalNodesRef.current[draggedNode.id] = { ...draggedNode };

        // Дополнительно снимем выделение с этого узла
        setNodes((prev) =>
            prev.map((n) => (n.id === draggedNode.id ? { ...n, selected: false } : n))
        );
    }, [updateNodeOnServer, setNodes]);

    // Удаление рёбер по клавишам 'Delete'/'Backspace'
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
        // Состояние
        nodes,
        edges,

        // Коллбеки реактивного изменения (React Flow)
        onNodesChange,
        onEdgesChange,

        // Коллбеки для рёбер
        onConnect,
        onEdgeUpdate,

        // Выделенные элементы
        onSelectionChange,

        // CRUD-операции с узлами
        createNewNode,
        removeNode,
        removeLastNode,
        loadBoardData,
        updateNodeFromWS,

        // Инициализация доски и перетаскивание
        setBoardData,
        onNodeDragStop,
    };
};




// // src/hooks/useBoardState.js
// import { useCallback, useEffect, useState, useRef } from 'react';
// import { useNodesState, useEdgesState, addEdge, updateEdge } from 'reactflow';
// import { getDefaultItem } from '../utils/boardUtils';
// import { itemToNode, nodeToItem } from '../utils/itemMapper';
// import { Position, Geometry, ItemRs } from '../model/ItemDto';
//
// /**
//  * Хук для работы со состоянием доски.
//  * Принимает объект:
//  * {
//  *   stompClient,  // клиент для отправки сообщений по WS
//  *   publish,      // функция публикации с проверкой connected
//  *   connected,    // статус соединения
//  * }
//  */
// export const useBoardState = ({ stompClient, publish, connected }) => {
//     const [nodes, setNodes, onNodesChange] = useNodesState([]);
//     const [edges, setEdges, onEdgesChange] = useEdgesState([]);
//     const [selectedElements, setSelectedElements] = useState([]);
//     const originalNodesRef = useRef({});
//
//     // Функция для безопасной публикации сообщений
//     const safePublish = useCallback((destination, body) => {
//         if (!connected) {
//             console.warn('[useBoardState][safePublish] Невозможно publish, соединение не установлено. Destination:', destination, 'Body:', body);
//             return;
//         }
//         console.log('[useBoardState][safePublish] Отправка на', destination, 'с телом:', body);
//         publish(destination, body);
//     }, [connected, publish]);
//
//     // Удаление узла из состояния
//     const removeNode = useCallback((nodeId) => {
//         console.log('[useBoardState][removeNode] Удаление узла с id:', nodeId);
//         setNodes((nds) => nds.filter((node) => node.id !== nodeId));
//         setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
//     }, [setNodes, setEdges]);
//
//     // Отправка обновления узла на сервер
//     const syncNodeToServer = useCallback((node) => {
//         const payload = nodeToItem(node);
//         console.log('[useBoardState][syncNodeToServer] Отправка обновления узла:', payload);
//         safePublish('/app/items/update', payload);
//     }, [safePublish]);
//
//     // Обновление метки узла и отправка обновления на сервер
//     const setNodeLabel = useCallback((id, newLabel) => {
//         console.log('[useBoardState][setNodeLabel] Обновление label для узла', id, 'на', newLabel);
//         setNodes((nds) => {
//             return nds.map((node) => {
//                 if (node.id === id) {
//                     const updatedNode = {
//                         ...node,
//                         data: {
//                             ...node.data,
//                             label: newLabel,
//                             functions: {
//                                 ...(node.data.functions || {}),
//                                 onLabelChange: setNodeLabel,
//                                 updateNode: syncNodeToServer,
//                                 removeNode,
//                             },
//                         },
//                     };
//                     console.log('[useBoardState][setNodeLabel] Новый узел:', updatedNode);
//                     // Отправляем обновление на сервер
//                     syncNodeToServer(updatedNode);
//                     return updatedNode;
//                 }
//                 return node;
//             });
//         });
//     }, [setNodes, syncNodeToServer, removeNode]);
//
//     // Функции для отключения и включения перетаскивания узла
//     const disableNodeDragging = useCallback((nodeId) => {
//         console.log('[useBoardState][disableNodeDragging] Отключение перетаскивания для узла', nodeId);
//         setNodes((nds) =>
//             nds.map((node) =>
//                 node.id === nodeId ? { ...node, draggable: false } : node
//             )
//         );
//     }, [setNodes]);
//
//     const enableNodeDragging = useCallback((nodeId) => {
//         console.log('[useBoardState][enableNodeDragging] Включение перетаскивания для узла', nodeId);
//         setNodes((nds) =>
//             nds.map((node) =>
//                 node.id === nodeId ? { ...node, draggable: true } : node
//             )
//         );
//     }, [setNodes]);
//
//     // Функция добавления нового узла
//     // (boardId = 8 оставлен для теста)
//     const addNode = useCallback((id, type) => {
//         const position = { x: Math.random() * 400, y: Math.random() * 400 };
//         const { data, style, width, height } = getDefaultItem(type);
//
//         const payload = {
//             boardId: id,
//             // parentId: null,
//             type,
//             position: new Position(position),
//             geometry: new Geometry({ width: width, height: height, rotation: 0 }),
//             data: { ...data, dataType: type },
//             style: { ...style, styleType: type },
//         };
//         console.log('[useBoardState][addNode] Добавление узла типа', type, 'с payload:', payload);
//         safePublish('/app/items/create', payload);
//     }, [safePublish]);
//
//     // Функция загрузки данных доски
//     const loadBoardData = useCallback((boardId) => {
//         console.log('[useBoardState][loadBoardData] Загрузка данных для доски с id:', boardId);
//         // Если вы передаёте только число, убедитесь, что сервер ожидает число
//         safePublish('/app/items/load', boardId);
//     }, [safePublish]);
//
//     // Функция удаления последнего узла
//     const removeLastBoardNode = useCallback(() => {
//         setNodes((nds) => {
//             if (nds.length === 0) return nds;
//             const nodeIdToRemove = nds[nds.length - 1].id;
//             console.log('[useBoardState][removeLastBoardNode] Удаляем последний узел с id:', nodeIdToRemove);
//             setEdges((eds) =>
//                 eds.filter((e) => e.source !== nodeIdToRemove && e.target !== nodeIdToRemove)
//             );
//             return nds.slice(0, -1);
//         });
//     }, [setNodes, setEdges]);
//
//     // Обработчик соединения для ребра
//     const handleEdgeConnect = useCallback(
//         (params) => {
//             console.log('[useBoardState][handleEdgeConnect] Создание ребра с параметрами:', params);
//             setEdges((eds) => addEdge({ ...params, type: 'floating' }, eds));
//         },
//         [setEdges]
//     );
//
//     // Обработчик обновления ребра
//     const onEdgeUpdate = useCallback(
//         (oldEdge, newConnection) => {
//             console.log('[useBoardState][onEdgeUpdate] Обновление ребра. Старое:', oldEdge, 'Новое:', newConnection);
//             setEdges((eds) => updateEdge(oldEdge, newConnection, eds));
//         },
//         [setEdges]
//     );
//
//     // Обработка выбора элементов
//     const onSelectionChange = useCallback((elements) => {
//         console.log('[useBoardState][onSelectionChange] Изменение выбора:', elements);
//         if (Array.isArray(elements)) {
//             setSelectedElements(elements);
//         } else if (elements) {
//             const arr = [];
//             if (elements.nodes) arr.push(...elements.nodes);
//             if (elements.edges) arr.push(...elements.edges);
//             setSelectedElements(arr);
//         } else {
//             setSelectedElements([]);
//         }
//     }, []);
//
//     // Обработка входящих сообщений с сервера (CREATE/UPDATE)
//     const updateNodeFromWS = useCallback((item) => {
//         console.log('[useBoardState][updateNodeFromWS] Получено сообщение с сервера:', item);
//         const newNode = itemToNode(item);
//         console.log('[useBoardState][updateNodeFromWS] Дто с сервера после маппинга:', newNode);
//         setNodes((prevNodes) => {
//             const nodeIndex = prevNodes.findIndex((node) => node.id === newNode.id);
//             const baseData = {
//                 ...newNode.data,
//                 functions: {
//                     onLabelChange: setNodeLabel,
//                     updateNode: syncNodeToServer,
//                     removeNode,
//                     disableNodeDragging: () => disableNodeDragging(newNode.id),
//                     enableNodeDragging: () => enableNodeDragging(newNode.id),
//                 },
//             };
//             const updatedNode = { ...newNode, draggable: true, data: baseData };
//
//             if (nodeIndex !== -1) {
//                 console.log('[useBoardState][updateNodeFromWS] Обновляем существующий узел с id:', newNode.id);
//                 const newNodes = [...prevNodes];
//                 newNodes[nodeIndex] = updatedNode;
//                 originalNodesRef.current[newNode.id] = updatedNode;
//                 return newNodes;
//             } else {
//                 console.log('[useBoardState][updateNodeFromWS] Добавляем новый узел с id:', newNode.id);
//                 originalNodesRef.current[newNode.id] = updatedNode;
//                 return [...prevNodes, updatedNode];
//             }
//         });
//     }, [setNodes, setNodeLabel, syncNodeToServer, removeNode, disableNodeDragging, enableNodeDragging]);
//
//     // Установка начального состояния доски (INITIAL)
//     const setBoardData = useCallback((itemsData) => {
//         console.log('[useBoardState][setBoardData] Установка начальных данных:', itemsData);
//         const items = itemsData.map((raw) => ItemRs.fromServer(raw));
//         const loadedNodes = items.map((item) => {
//             const node = itemToNode(item);
//             const newNode = {
//                 ...node,
//                 draggable: true,
//                 data: {
//                     ...node.data,
//                     functions: {
//                         onLabelChange: setNodeLabel,
//                         updateNode: syncNodeToServer,
//                         removeNode,
//                         disableNodeDragging: () => disableNodeDragging(node.id),
//                         enableNodeDragging: () => enableNodeDragging(node.id),
//                     },
//                 },
//             };
//             // Сохраняем начальное состояние для сравнения
//             originalNodesRef.current[newNode.id] = newNode;
//             return newNode;
//         });
//
//         const loadedEdges = items
//             .filter((it) => it.parentId !== null && it.parentId !== undefined)
//             .map((it) => {
//                 return {
//                     id: `${it.parentId}-${it.id}`,
//                     source: it.parentId.toString(),
//                     target: it.id.toString(),
//                     type: 'floating',
//                 };
//             });
//
//         console.log('[useBoardState][setBoardData] Загруженные узлы:', loadedNodes);
//         console.log('[useBoardState][setBoardData] Загруженные рёбра:', loadedEdges);
//         setNodes(loadedNodes);
//         setEdges(loadedEdges);
//
//         originalNodesRef.current = loadedNodes.reduce((acc, n) => {
//             acc[n.id] = n;
//             return acc;
//         }, {});
//     }, [setNodes, setEdges, setNodeLabel, syncNodeToServer, removeNode, disableNodeDragging, enableNodeDragging]);
//
//     // При окончании перетаскивания узла отправляем обновлённую позицию на сервер
//     const onNodeDragStop = useCallback((_, node) => {
//         console.log('[useBoardState][onNodeDragStop] Узел перетащен:', node);
//         // Сравниваем позицию с предыдущей сохранённой
//         const original = originalNodesRef.current[node.id];
//         if (original) {
//             const dx = Math.abs(original.position.x - node.position.x);
//             const dy = Math.abs(original.position.y - node.position.y);
//             // Если позиция не изменилась существенно, не отправляем обновление
//             if (dx < 1 && dy < 1) {
//                 console.log('[useBoardState][onNodeDragStop] Позиция не изменилась, обновление не отправляем.');
//                 return;
//             }
//         }
//         syncNodeToServer(node);
//         // Обновляем сохранённое состояние
//         originalNodesRef.current[node.id] = { ...node };
//         setNodes((nds) => nds.map((n) => (n.id === node.id ? { ...n, selected: false } : n)));
//     }, [syncNodeToServer, setNodes]);
//
//     // Обработка клавиш для удаления выбранных рёбер
//     useEffect(() => {
//         const handleKeyDown = (e) => {
//             if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElements.length > 0) {
//                 console.log('[useBoardState][handleKeyDown] Удаление выбранных элементов. Клавиша:', e.key);
//                 const selectedEdgesIds = selectedElements
//                     .filter((el) => el.source && el.target)
//                     .map((edge) => edge.id);
//                 if (selectedEdgesIds.length > 0) {
//                     console.log('[useBoardState][handleKeyDown] Удаляем рёбра с id:', selectedEdgesIds);
//                     setEdges((eds) => eds.filter((edge) => !selectedEdgesIds.includes(edge.id)));
//                 }
//             }
//         };
//         document.addEventListener('keydown', handleKeyDown);
//         return () => document.removeEventListener('keydown', handleKeyDown);
//     }, [selectedElements, setEdges]);
//
//     return {
//         nodes,
//         edges,
//         onNodesChange,
//         onEdgesChange,
//         handleEdgeConnect,
//         onEdgeUpdate,
//         onSelectionChange,
//         addNode,
//         removeLastBoardNode,
//         loadBoardData,
//         onNodeDragStop,
//         removeNode,
//         updateNodeFromWS,
//         setBoardData,
//     };
// };
