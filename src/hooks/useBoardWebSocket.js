
import { useCallback, useState } from 'react';
import useStompWebSocket from './useStompWebSocket';

const WS_ENDPOINT = 'http://localhost:8080/ws';
const TOPIC_ENDPOINT = '/topic/board/';


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
