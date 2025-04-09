import React, { useEffect, useCallback, useRef, useState } from "react";
import ReactFlow, {
    addEdge,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useParams } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

// Адрес WebSocket-сервера
const SOCKET_URL = "http://localhost:8080/ws";

// ─────────────────────────────────────────────
// Кастомные компоненты для нод
// ─────────────────────────────────────────────

// Круг
function CircleNode({ data, selected }) {
    return (
        <div
            style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                backgroundColor: "#3498db",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                border: selected ? "2px solid #000" : "none",
            }}
        >
            {data.label}
        </div>
    );
}

// Квадрат
function SquareNode({ data, selected }) {
    return (
        <div
            style={{
                width: 80,
                height: 80,
                backgroundColor: "#2ecc71",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                border: selected ? "2px solid #000" : "none",
            }}
        >
            {data.label}
        </div>
    );
}

// Стикер
function StickerNode({ data, selected }) {
    return (
        <div
            style={{
                width: 120,
                height: 100,
                backgroundColor: "#f1c40f",
                border: "1px dashed #333",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#000",
                fontWeight: "bold",
                borderWidth: selected ? "2px" : "1px",
            }}
        >
            {data.label}
        </div>
    );
}

// Собираем кастомные типы нод в один объект
const nodeTypes = {
    circle: CircleNode,
    square: SquareNode,
    sticker: StickerNode,
};

function BoardPageReactFlow() {
    // Получаем id доски из URL и токен из localStorage
    const { id: boardId } = useParams();
    const token = localStorage.getItem("token");

    // Состояния для нод и ребер, а также для выбранных элементов
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedElements, setSelectedElements] = useState([]);

    // Рефы для WebSocket-клиента и статуса подключения
    const clientRef = useRef(null);
    const connectedRef = useRef(false);

    // Загрузка исходных данных с сервера (только ноды)
    useEffect(() => {
        const fetchBoardItems = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/items/board/${boardId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await response.json();

                // Преобразуем данные в формат React Flow.
                // type указывает на circle, square или sticker, что соответствует нашим кастомным нодам.
                const initialNodes = data.map((item) => ({
                    id: String(item.id),
                    type: item.type, // "circle" | "square" | "sticker" или любой другой тип
                    data: { label: item.data.content },
                    position: item.position,
                }));
                setNodes(initialNodes);
            } catch (error) {
                console.error("Ошибка загрузки доски:", error);
            }
        };
        fetchBoardItems();
    }, [boardId, token, setNodes]);

    // Функции для обработки обновлений, приходящих через WebSocket

    // Обновление ноды
    const handleNodeUpdate = useCallback(
        (updatedNode) => {
            const { id, operation } = updatedNode;
            if (operation === "create") {
                setNodes((nds) => [
                    ...nds,
                    {
                        id: String(id),
                        type: updatedNode.type,
                        data: { label: updatedNode.data.content },
                        position: updatedNode.position,
                    },
                ]);
            } else if (operation === "update") {
                setNodes((nds) =>
                    nds.map((node) =>
                        node.id === String(id)
                            ? {
                                ...node,
                                data: { label: updatedNode.data.content },
                                position: updatedNode.position,
                                type: updatedNode.type,
                            }
                            : node
                    )
                );
            } else if (operation === "delete") {
                setNodes((nds) => nds.filter((node) => node.id !== String(id)));
                // Удаляем также все ребра, связанные с этой нодой
                setEdges((eds) =>
                    eds.filter((edge) => edge.source !== String(id) && edge.target !== String(id))
                );
            }
        },
        [setNodes, setEdges]
    );

    // Обновление ребра
    const handleEdgeUpdate = useCallback(
        (updatedEdge) => {
            const { id, operation } = updatedEdge;
            if (operation === "create") {
                setEdges((eds) => [
                    ...eds,
                    {
                        id: String(id),
                        source: String(updatedEdge.source),
                        target: String(updatedEdge.target),
                        label: updatedEdge.data?.label || "",
                    },
                ]);
            } else if (operation === "update") {
                setEdges((eds) =>
                    eds.map((edge) =>
                        edge.id === String(id)
                            ? {
                                ...edge,
                                source: String(updatedEdge.source),
                                target: String(updatedEdge.target),
                                label: updatedEdge.data?.label || "",
                            }
                            : edge
                    )
                );
            } else if (operation === "delete") {
                setEdges((eds) => eds.filter((edge) => edge.id !== String(id)));
            }
        },
        [setEdges]
    );

    // Инициализация WebSocket-подключения
    useEffect(() => {
        if (!token) {
            console.error("❌ Токен отсутствует, подключение невозможно");
            return;
        }

        const stompClient = new Client({
            webSocketFactory: () => new SockJS(SOCKET_URL),
            connectHeaders: { Authorization: `Bearer ${token}` },
            onConnect: () => {
                connectedRef.current = true;
                //console.log("🔗 Подключено к WebSocket");
                // Подписываемся на топик доски и обрабатываем сообщения
                stompClient.subscribe(`/topic/board/${boardId}`, (message) => {
                    const updatedItem = JSON.parse(message.body);
                    if (updatedItem.elementType === "node") {
                        handleNodeUpdate(updatedItem);
                    } else if (updatedItem.elementType === "edge") {
                        handleEdgeUpdate(updatedItem);
                    }
                });
            },
            onStompError: (frame) => {
                console.error("❌ Ошибка STOMP:", frame);
            },
            onWebSocketError: (error) => {
                console.error("❌ Ошибка WebSocket:", error);
            },
        });
        stompClient.activate();
        clientRef.current = stompClient;

        return () => {
            stompClient.deactivate();
        };
    }, [boardId, token, handleNodeUpdate, handleEdgeUpdate]);

    // Функция для отправки сообщений на сервер по WebSocket
    const sendMessage = useCallback((destination, messageObj) => {
        if (clientRef.current && connectedRef.current) {
            clientRef.current.publish({
                destination,
                body: JSON.stringify(messageObj),
            });
        }
    }, []);

    // Функция для создания новой ноды (круг, квадрат, стикер)
    const onAddNode = useCallback(
        (nodeType) => {
            const newNode = {
                id: String(Date.now()),
                type: nodeType, // "circle" | "square" | "sticker"
                data: { label: nodeType === "sticker" ? "Новый стикер" : "Новая фигура" },
                position: { x: 250, y: 250 },
            };
            setNodes((nds) => nds.concat(newNode));
            sendMessage("/app/items/create", {
                ...newNode,
                elementType: "node",
                operation: "create",
                // geometry при необходимости можно передавать, если вы используете на бэкенде
                geometry: { width: 80, height: 80, rotation: 0 },
            });
        },
        [setNodes, sendMessage]
    );

    // Функция для удаления ноды
    const onDeleteNode = useCallback(
        (nodeId) => {
            setNodes((nds) => nds.filter((node) => node.id !== nodeId));
            setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
            sendMessage("/app/items/delete", { id: nodeId, elementType: "node", operation: "delete" });
        },
        [setNodes, setEdges, sendMessage]
    );

    // Удаление выделенных элементов (нод и ребер)
    const onDeleteSelected = useCallback(() => {
        if (selectedElements.length > 0) {
            selectedElements.forEach((el) => {
                if (el.source && el.target) {
                    // Это ребро
                    setEdges((eds) => eds.filter((edge) => edge.id !== el.id));
                    sendMessage("/app/items/delete", {
                        id: el.id,
                        elementType: "edge",
                        operation: "delete",
                    });
                } else {
                    // Это нода
                    onDeleteNode(el.id);
                }
            });
            setSelectedElements([]);
        }
    }, [selectedElements, onDeleteNode, sendMessage]);

    // Изменение текста ноды (например, по двойному клику)
    const onNodeDoubleClick = useCallback(
        (event, node) => {
            const newLabel = prompt("Введите новый текст для ноды:", node.data.label);
            if (newLabel !== null) {
                const updatedNode = { ...node, data: { label: newLabel } };
                setNodes((nds) => nds.map((n) => (n.id === node.id ? updatedNode : n)));
                sendMessage("/app/items/update", {
                    id: node.id,
                    type: node.type,
                    data: { content: newLabel },
                    position: node.position,
                    elementType: "node",
                    operation: "update",
                });
            }
        },
        [setNodes, sendMessage]
    );

    // Обработка перемещения ноды (по окончании drag)
    const onNodeDragStop = useCallback(
        (event, node) => {
            sendMessage("/app/items/update", {
                id: node.id,
                type: node.type,
                data: { content: node.data.label },
                position: node.position,
                elementType: "node",
                operation: "update",
            });
        },
        [sendMessage]
    );

    // Создание ребра при соединении нод
    const onConnect = useCallback(
        (params) => {
            setEdges((eds) => addEdge(params, eds));
            sendMessage("/app/items/create", {
                id: String(Date.now()),
                source: params.source,
                target: params.target,
                elementType: "edge",
                operation: "create",
                data: { label: "" },
            });
        },
        [setEdges, sendMessage]
    );

    // Обработка выбора элементов (нод и ребер)
    const onSelectionChange = useCallback((elements) => {
        setSelectedElements(elements || []);
    }, []);

    const [variant, setVariant] = useState('dots');

    return (
        <div style={{ width: "100%", height: "90vh" }}>
            <div style={{ margin: "10px" }}>
                <button onClick={() => onAddNode("circle")} style={{ marginRight: "5px" }}>
                    Добавить круг
                </button>
                <button onClick={() => onAddNode("square")} style={{ marginRight: "5px" }}>
                    Добавить квадрат
                </button>
                <button onClick={() => onAddNode("sticker")} style={{ marginRight: "5px" }}>
                    Добавить стикер
                </button>
                <button onClick={onDeleteSelected} style={{ marginRight: "5px" }}>
                    Удалить выбранное
                </button>
            </div>
            <ReactFlow
                // Регистрируем наши кастомные типы нод
                nodeTypes={nodeTypes}
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeDoubleClick={onNodeDoubleClick}
                onNodeDragStop={onNodeDragStop}
                onConnect={onConnect}
                onSelectionChange={onSelectionChange}
                fitView
                snapToGrid={true}
                snapGrid={[15, 15]}
            >
                {/* Отображаем сетку, контролы и мини-карту */}
                <Background color="#aaa" gap={20} variant={variant} />
                <Controls />
                <MiniMap />
            </ReactFlow>
        </div>
    );
}

export default BoardPageReactFlow;
