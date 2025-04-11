// src/hooks/useBoardWebSocket.js
import { useCallback, useState } from 'react';
import useStompWebSocket from './useStompWebSocket';

const WS_ENDPOINT = 'http://localhost:8080/ws';
const TOPIC_ENDPOINT = '/topic/board/';

/**
 * Хук для подключения к WebSocket и подписки на топик доски.
 * @param {string} boardId - идентификатор доски
 * @param {Function} onMessage - функция-обработчик входящих сообщений
 * @param {Function} onError - функция-обработчик ошибок с сервера
 * @returns {object} { stompClient, connected, publish, lastError }
 */
export default function useBoardWebSocket(boardId, onMessage, onError) {
    const [lastWSError, setLastWSError] = useState(null);
    
    const handleStompConnect = useCallback((client) => {
        const topic = TOPIC_ENDPOINT + boardId;
        //console.log(`[useBoardWebSocket] Подписка на топик ${topic}`);
        client.subscribe(topic, (msg) => {
            try {
                const message = JSON.parse(msg.body);
                //console.log('[useBoardWebSocket] Получено сообщение:', message);
                onMessage(message);
            } catch (error) {
                console.error('[useBoardWebSocket] Ошибка парсинга сообщения', error);
            }
        });
    }, [boardId, onMessage]);
    
    // Обработчик ошибок от WebSocket
    const handleError = useCallback((errorData) => {
        setLastWSError(errorData);
        if (onError) {
            onError(errorData);
        }
    }, [onError]);

    const { stompClient, connected, publish, lastError } = useStompWebSocket(
        WS_ENDPOINT, 
        handleStompConnect, 
        {}, 
        handleError
    );
    
    return { 
        stompClient, 
        connected, 
        publish, 
        lastError: lastError || lastWSError 
    };
}
