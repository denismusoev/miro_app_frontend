// src/hooks/useBoardWebSocket.js
import { useCallback } from 'react';
import useStompWebSocket from './useWebSocket';

const WS_ENDPOINT = 'http://localhost:8080/ws';

/**
 * Хук для подключения к WebSocket и подписки на топик доски.
 * @param {string} boardId - идентификатор доски
 * @param {Function} onMessage - функция-обработчик входящих сообщений
 * @returns {object} { stompClient, connected, publish }
 */
export default function useBoardWebSocket(boardId, onMessage) {
    const handleStompConnect = useCallback((client) => {
        const topic = `/topic/board/${boardId}`;
        console.log(`[useBoardWebSocket] Подписка на топик ${topic}`);
        client.subscribe(topic, (msg) => {
            try {
                const message = JSON.parse(msg.body);
                console.log('[useBoardWebSocket] Получено сообщение:', message);
                onMessage(message);
            } catch (error) {
                console.error('[useBoardWebSocket] Ошибка парсинга сообщения', error);
            }
        });
    }, [boardId, onMessage]);

    const { stompClient, connected, publish } = useStompWebSocket(WS_ENDPOINT, handleStompConnect);
    return { stompClient, connected, publish };
}
