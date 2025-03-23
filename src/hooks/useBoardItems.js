import { useEffect, useState, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

// Адрес WebSocket-сервера
const SOCKET_URL = "http://localhost:8080/ws";

export function useBoardItems(boardId, token) {
    const [items, setItems] = useState([]);
    const clientRef = useRef(null);

    // Получение всех элементов доски
    const fetchBoardItems = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/items/board/${boardId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            const data = await response.json();
            setItems(data);
        } catch (error) {
            console.error("Ошибка загрузки элементов доски:", error);
        }
    }, [boardId, token]);

    // Добавление/обновление элемента в списке
    const handleItemUpdate = useCallback(
        (updatedItem) => {
            setItems((prevItems) => {
                const index = prevItems.findIndex((i) => i.id === updatedItem.id);
                if (index !== -1) {
                    // Обновляем существующий
                    return prevItems.map((item) =>
                        item.id === updatedItem.id ? updatedItem : item
                    );
                } else {
                    // Добавляем новый
                    return [...prevItems, updatedItem];
                }
            });
        },
        []
    );

    useEffect(() => {
        if (!token) {
            console.error("Нет токена, не можем подключиться к WebSocket");
            return;
        }

        const stompClient = new Client({
            webSocketFactory: () => new SockJS(SOCKET_URL),
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            onConnect: () => {
                console.log("Успешно подключились к WebSocket");
                // Подписываемся на топик
                stompClient.subscribe(`/topic/board/${boardId}`, (message) => {
                    const updatedItem = JSON.parse(message.body);
                    handleItemUpdate(updatedItem);
                });
                // После подключения сразу грузим текущие элементы
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

    // Создание элемента на доске
    const createItem = useCallback(
        (type) => {
            if (!clientRef.current) return;
            // Формируем объект, соответствующий структуре ItemRs.
            // На сервере вы можете проставлять нужные поля по умолчанию, но здесь – пример.
            const newItem = {
                id: null, // сгенерируется на бэке
                boardId: Number(boardId),
                type,
                position: { x: 50, y: 50 },
                geometry: { width: 80, height: 80, rotation: 0 },
                data: {
                    content: "Новый элемент",
                },
                style: {
                    // Примерно как ShapeStyle или StickyNoteStyle
                    color: "#ffffff",
                    fillColor: "#1a1a1a",
                },
                parentId: null,
            };

            clientRef.current.publish({
                destination: "/app/items/create",
                body: JSON.stringify(newItem),
            });
        },
        [boardId]
    );

    // Обновление элемента
    const updateItem = useCallback((item) => {
        if (!clientRef.current) return;
        clientRef.current.publish({
            destination: "/app/items/update",
            body: JSON.stringify(item),
        });
    }, []);

    return {
        items,
        setItems,
        createItem,
        updateItem,
    };
}
