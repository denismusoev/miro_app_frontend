import { useCallback, useState } from 'react';
import useStompWebSocket from './useStompWebSocket';

// const WS_ENDPOINT = 'http://localhost:8080/ws';
const WS_ENDPOINT = 'http://192.168.0.131:8080/ws';
const TOPIC_ENDPOINT = '/topic/board/';
const USER_QUEUE_ENDPOINT = '/user/queue/messages';


export default function useBoardWebSocket(boardId, onMessage, onError) {
    const [lastWSError, setLastWSError] = useState(null);
    
    const handleStompConnect = useCallback((client) => {
        // Подписка на общий топик доски
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
        
        // Подписка на персональные сообщения пользователю
        // client.subscribe(USER_QUEUE_ENDPOINT, (msg) => {
        //     try {
        //         const message = JSON.parse(msg.body);
        //         console.log('[useBoardWebSocket] Получено персональное сообщение:', message);
        //         onMessage(message);
        //     } catch (error) {
        //         console.error('[useBoardWebSocket] Ошибка парсинга персонального сообщения', error);
        //     }
        // });
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
