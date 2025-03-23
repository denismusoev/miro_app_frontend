// useBoardWebSocket.js
import { useState, useRef, useEffect, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const SOCKET_URL = "http://localhost:8080/ws";

class Shape {
    constructor(type, boardId, x = 50, y = 50, width = 80, height = 80, rotation = 0, content = "Текст") {
        this.id = Date.now();
        this.boardId = boardId;
        this.type = type;
        this.position = { x, y };
        this.geometry = { width, height, rotation };
        this.data = { content };
    }
}

export function useBoardWebSocket(boardId, token) {
    const [shapes, setShapes] = useState([]);
    const clientRef = useRef(null);

    // Загрузка из REST при инициализации
    const fetchBoardItems = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/items/board/${boardId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            setShapes(data);
        } catch (error) {
            console.error("Ошибка загрузки доски:", error);
        }
    }, [boardId, token]);

    // Обработчик обновлений от WebSocket
    const handleItemUpdate = useCallback((updatedItem) => {
        setShapes((prevShapes) => {
            const index = prevShapes.findIndex((s) => s.id === updatedItem.id);
            if (index !== -1) {
                return prevShapes.map((shape) => (shape.id === updatedItem.id ? updatedItem : shape));
            } else {
                return [...prevShapes, updatedItem];
            }
        });
    }, []);

    // Подключение к STOMP/WebSocket
    useEffect(() => {
        if (!token) {
            console.error("Нет токена – соединение невозможно");
            return;
        }
        const stompClient = new Client({
            webSocketFactory: () => new SockJS(SOCKET_URL),
            connectHeaders: { Authorization: `Bearer ${token}` },
            onConnect: () => {
                console.log("Подключено к WebSocket");
                stompClient.subscribe(`/topic/board/${boardId}`, (message) => {
                    const updatedItem = JSON.parse(message.body);
                    handleItemUpdate(updatedItem);
                });
                fetchBoardItems();
            },
            onStompError: (frame) => {
                console.error("STOMP ошибка:", frame);
            },
            onWebSocketError: (error) => {
                console.error("WebSocket ошибка:", error);
            },
        });

        stompClient.activate();
        clientRef.current = stompClient;
        return () => {
            stompClient.deactivate();
        };
    }, [boardId, token, fetchBoardItems, handleItemUpdate]);

    // Создать новую фигуру
    const createShape = useCallback(
        (type) => {
            if (clientRef.current) {
                const newShape = new Shape(type, boardId);
                clientRef.current.publish({
                    destination: "/app/items/create",
                    body: JSON.stringify(newShape),
                });
            }
        },
        [boardId]
    );

    // Обновить существующую фигуру
    const updateShape = useCallback((updatedShape) => {
        if (clientRef.current) {
            clientRef.current.publish({
                destination: "/app/items/update",
                body: JSON.stringify(updatedShape),
            });
        }
    }, []);

    return { shapes, setShapes, createShape, updateShape };
}
