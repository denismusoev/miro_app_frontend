import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
    addEdge,
    updateEdge,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Импортируем кастомные компоненты для плавающих краёв
import FloatingEdge from '../components/FloatingEdge';
import FloatingConnectionLine from '../components/FloatingConnectionLine';
import { customNodeTypes } from '../components/CustomNodes';
import AdjustableEdge from "../components/AdjustableEdge";

const edgeTypes = {
    floating: FloatingEdge,
};

const initialNodes = [];
const initialEdges = [];

// Функция для формирования умолчательного заголовка узла в зависимости от типа
const getDefaultLabel = (type, id) => {
    switch (type) {
        case 'text':
            return `Текст ${id}`;
        case 'frame':
            return `Рамка ${id}`;
        case 'image':
            return `Изображение ${id}`;
        case 'shape':
            return `Фигура ${id}`;
        case 'card':
            return `Карточка ${id}`;
        case 'app_card':
            return `Приложение ${id}`;
        case 'sticky_note':
            return `Стикер ${id}`;
        default:
            return `Элемент ${id}`;
    }
};

function BoardPageReactFlowLocal() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedElements, setSelectedElements] = useState([]);

    const updateNodeLabel = useCallback(
        (id, newLabel) => {
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === id) {
                        return {
                            ...node,
                            data: { ...node.data, label: newLabel, onLabelChange: updateNodeLabel },
                        };
                    }
                    return node;
                })
            );
        },
        [setNodes]
    );

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
        (oldEdge, newConnection) => setEdges((eds) => updateEdge(oldEdge, newConnection, eds)),
        [setEdges]
    );

    const addNode = (type) => {
        const id = (nodes.length + 1).toString();
        const newNode = {
            id,
            type,
            data: {
                label: getDefaultLabel(type, id),
                onLabelChange: updateNodeLabel,
            },
            position: {
                x: Math.random() * 400,
                y: Math.random() * 400,
            },
        };
        setNodes((nds) => nds.concat(newNode));
    };

    const removeLastNode = () => {
        if (nodes.length === 0) return;
        const nodeIdToRemove = nodes[nodes.length - 1].id;
        setEdges((eds) => eds.filter((e) => e.source !== nodeIdToRemove && e.target !== nodeIdToRemove));
        setNodes((nds) => nds.slice(0, -1));
    };

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

    return (
        <div style={{ height: '90vh', border: '1px solid #ddd' }}>
            <div style={{ padding: 10, background: '#f7f7f7' }}>
                <button onClick={() => addNode('text')}>Добавить текст</button>
                <button onClick={() => addNode('frame')}>Добавить рамку</button>
                <button onClick={() => addNode('image')}>Добавить изображение</button>
                <button onClick={() => addNode('shape')}>Добавить фигуру</button>
                <button onClick={() => addNode('card')}>Добавить карточку</button>
                <button onClick={() => addNode('app_card')}>Добавить приложение</button>
                <button onClick={() => addNode('sticky_note')}>Добавить стикер</button>
                <button onClick={removeLastNode}>Удалить последний узел</button>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onEdgeUpdate={onEdgeUpdate}
                onSelectionChange={onSelectionChange}
                nodeTypes={customNodeTypes}
                edgeTypes={edgeTypes}
                connectionLineComponent={FloatingConnectionLine}
                fitView
                snapToGrid={false}
            >
                <Background variant="lines" gap={20} size={1} />
                <Controls />
                <MiniMap />
            </ReactFlow>
        </div>
    );
}

export default BoardPageReactFlowLocal;
