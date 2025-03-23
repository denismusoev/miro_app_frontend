// src/hooks/useBoardState.js
import { useCallback, useEffect, useState, useRef } from 'react';
import { useNodesState, useEdgesState, addEdge, updateEdge } from 'reactflow';
import { getDefaultLabel } from '../utils/boardUtils';
import { ItemRs } from '../model/ItemDto';
import { itemToNode, nodeToItem } from '../utils/itemMapper';
import {
    TextData, TextStyle, FrameData, FrameStyle, ImageData, ImageStyle,
    ShapeData, ShapeStyle, CardData, CardStyle, AppCardData, AppCardStyle,
    StickyNoteData, StickyNoteStyle, Geometry, Position
} from '../model/ItemDto';

const getDefaultItem = (type) => {
    switch (type) {
        case 'text':
            return { data: new TextData(), style: new TextStyle(), width: 100, height: 100 };
        case 'frame':
            return { data: new FrameData(), style: new FrameStyle(), width: 300, height: 300 };
        case 'image':
            return { data: new ImageData(), style: new ImageStyle(), width: 300, height: 300 };
        case 'shape':
            return { data: new ShapeData(), style: new ShapeStyle(), width: 300, height: 300 };
        case 'card':
            return { data: new CardData(), style: new CardStyle(), width: 300, height: 300 };
        case 'app_card':
            return { data: new AppCardData(), style: new AppCardStyle(), width: 300, height: 300 };
        case 'sticky_note':
            return { data: new StickyNoteData(), style: new StickyNoteStyle(), width: 300, height: 300 };
        default:
            return { data: {}, style: {} };
    }
};

const initialNodes = [];
const initialEdges = [];

export const useBoardState = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedElements, setSelectedElements] = useState([]);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const originalNodesRef = useRef({});

    const removeNode = useCallback((nodeId) => {
        setNodes((nds) => nds.filter((node) => node.id !== nodeId));
        setEdges((eds) =>
            eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
        );
    }, [setNodes, setEdges]);

    const updateNodeOnServer = useCallback(async (node) => {
        const original = originalNodesRef.current[node.id];
        if (original) {
            const originalData = JSON.stringify(nodeToItem(original).data);
            const newData = JSON.stringify(nodeToItem(node).data);
            const styleUnchanged =
                JSON.stringify(node.style) === JSON.stringify(original.style);
            const geometryUnchanged =
                JSON.stringify(node.geometry) === JSON.stringify(original.geometry);
            const positionUnchanged =
                JSON.stringify(node.position) === JSON.stringify(original.position);
            const parentUnchanged = node.parentId === original.parentId;

            if (
                originalData === newData &&
                styleUnchanged &&
                geometryUnchanged &&
                positionUnchanged &&
                parentUnchanged
            ) {
                console.log('Нет изменений, обновление не требуется');
                return;
            }
        }

        // Используем маппинг для формирования payload
        const payload = nodeToItem(node);

        try {
            const response = await fetch('http://localhost:8080/api/items/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                throw new Error('Ошибка обновления узла на сервере');
            }
            const updatedItem = await response.json();
            console.log('Узел обновлен:', updatedItem);
            originalNodesRef.current[node.id] = node;
        } catch (error) {
            console.error('Ошибка при обновлении узла', error);
        }
    }, []);

    // Функция обновления метки узла: обновляем label в node.data и помещаем функции в node.data.functions
    const updateNodeLabel = useCallback(
        (id, newLabel) => {
            setNodes((nds) => {
                const updatedNodes = nds.map((node) => {
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
                        // Обновляем узел на сервере сразу после изменения label
                        updateNodeOnServer(updatedNode);
                        return updatedNode;
                    }
                    return node;
                });
                return updatedNodes;
            });
        },
        [setNodes, updateNodeOnServer, removeNode]
    );

    // Функция для добавления обработчиков перетаскивания; функции помещаются в объект functions внутри data
// Вынесенные функции управления перетаскиванием:
    const disableDragging = (setNodes, id) => {
        setNodes((nodes) =>
            nodes.map((node) =>
                node.id === id ? { ...node, draggable: false } : node
            )
        );
    };

    const enableDragging = (setNodes, id) => {
        setNodes((nodes) =>
            nodes.map((node) =>
                node.id === id ? { ...node, draggable: true } : node
            )
        );
    };

    // При создании нового узла формируем data с label и функциями внутри functions
    const addNode = async (type) => {
        const position = {
            x: Math.random() * 400,
            y: Math.random() * 400,
        };

        const { data, style } = getDefaultItem(type);

        const payload = {
            boardId: 8,  // либо передавай текущий boardId динамически
            parentId: null,
            type,
            position: new Position(position),
            geometry: new Geometry({ width: 100, height: 100, rotation: 0 }),
            data: {
                ...data,
                dataType: type
            },
            style: {
                ...style,
                styleType: type
            }
        };

        try {
            const response = await fetch('http://localhost:8080/api/items/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Ошибка при создании элемента на сервере');
            }

            const createdItem = await response.json();
            const newNode = itemToNode(ItemRs.fromServer(createdItem));

            setNodes((prev) =>
                prev.concat({
                    ...newNode,
                    draggable: true,
                    data: {
                        ...newNode.data,
                        functions: {
                            onLabelChange: updateNodeLabel,
                            updateNode: updateNodeOnServer,
                            removeNode,
                            disableDragging: () => disableDragging(setNodes, newNode.id),
                            enableDragging: () => enableDragging(setNodes, newNode.id),
                        },
                    },
                })
            );
        } catch (error) {
            console.error('Ошибка создания элемента', error);
        }
    };


    const removeLastNode = () => {
        if (nodes.length === 0) return;
        const nodeIdToRemove = nodes[nodes.length - 1].id;
        setEdges((eds) =>
            eds.filter((e) => e.source !== nodeIdToRemove && e.target !== nodeIdToRemove)
        );
        setNodes((nds) => nds.slice(0, -1));
    };

    const onConnect = useCallback(
        (params) =>
            setEdges((eds) =>
                addEdge(
                    {
                        ...params,
                        type: 'floating',
                    },
                    eds
                )
            ),
        [setEdges]
    );

    const onEdgeUpdate = useCallback(
        (oldEdge, newConnection) =>
            setEdges((eds) => updateEdge(oldEdge, newConnection, eds)),
        [setEdges]
    );

    const onSelectionChange = useCallback((elements) => {
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

    const loadBoardData = useCallback(async (boardId) => {
        try {
            const response = await fetch(`http://localhost:8080/api/items/board/${boardId}`);
            if (!response.ok) {
                throw new Error('Ошибка при загрузке данных');
            }
            const itemsData = await response.json();
            console.log("До преобразования");
            console.table(itemsData);
            const items = itemsData.map(ItemRs.fromServer);

            const loadedNodes = items.map((item) => {
                const node = itemToNode(item);
                return {
                    ...node,
                    draggable: true, // по умолчанию узел перетаскиваемый
                    data: {
                        ...node.data,
                        functions: {
                            onLabelChange: updateNodeLabel,
                            updateNode: updateNodeOnServer,
                            removeNode,
                            disableDragging: () => disableDragging(setNodes, node.id),
                            enableDragging: () => enableDragging(setNodes, node.id),
                        },
                    },
                };
            });

            console.log("После преобразования");
            console.table(loadedNodes);

            const loadedEdges = items
                .filter((item) => item.parentId !== null && item.parentId !== undefined)
                .map((item) => ({
                    id: `${item.parentId}-${item.id}`,
                    source: item.parentId.toString(),
                    target: item.id.toString(),
                    type: 'floating',
                }));

            setNodes(loadedNodes);
            setEdges(loadedEdges);
            originalNodesRef.current = loadedNodes.reduce((acc, node) => {
                acc[node.id] = node;
                return acc;
            }, {});
            setIsInitialLoad(false);
        } catch (error) {
            console.error('Ошибка загрузки данных доски:', error);
        }
    }, [setNodes, setEdges, updateNodeLabel, updateNodeOnServer, removeNode]);

    const onNodeDragStop = useCallback((event, node) => {
        updateNodeOnServer(node);

        setNodes((nds) =>
            nds.map((n) =>
                n.id === node.id
                    ? { ...n, selected: false }
                    : n
            )
        );
    }, [updateNodeOnServer]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElements.length > 0) {
                const selectedEdgesIds = selectedElements
                    .filter((el) => el.source && el.target)
                    .map((edge) => edge.id);
                if (selectedEdgesIds.length > 0) {
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
    };
};