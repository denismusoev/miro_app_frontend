// src/hooks/useStompWebSocket.js
import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * Хук для подключения к SockJS + STOMP.
 * - Не подписывается «автоматически» на серверные топики,
 *   это даёт больше контроля — вы вызываете subscribe(...) когда нужно.
 * - Предоставляет onConnectCallback, чтобы выполнить логику
 *   после реального установления соединения (например, подписка).
 * - Предоставляет publish() с проверкой connected.
 *
 * @param {string} sockJsUrl - URL SockJS (http://localhost:8080/ws)
 * @param {function} onConnectCallback - вызывается при onConnect (stompClient),
 * @param {object} options - доп. настройки
 * @param {function} onErrorCallback - обработчик ошибок с сервера
 */
export default function useStompWebSocket(sockJsUrl, onConnectCallback, options = {}, onErrorCallback) {
    const [connected, setConnected] = useState(false);
    const clientRef = useRef(null);
    const [lastError, setLastError] = useState(null);

    useEffect(() => {
        //console.log('[useStompWebSocket] MOUNT');

        const token = localStorage.getItem('token');

        // 1) Создаём SockJS-соединение
        const socket = new SockJS(sockJsUrl);

        // 2) Создаём STOMP-клиент
        const stompClient = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: options.reconnectDelay ?? 5000, // авто-реконнект
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            onConnect: (frame) => {
                console.log('[useStompWebSocket] onConnect:', frame);
                setConnected(true);

                // Также подписываемся на общий канал ошибок, если контроллер использует его
                stompClient.subscribe('/user/queue/errors', (errorMsg) => {
                    try {
                        const errorData = JSON.parse(errorMsg.body);
                        console.error('[WebSocket] Получена ошибка из общего канала:', errorData);
                        setLastError(errorData);

                        // Вызов колбэка если он предоставлен
                        if (onErrorCallback) {
                            onErrorCallback(errorData);
                        }
                    } catch (error) {
                        console.error('[WebSocket] Ошибка парсинга сообщения об ошибке:', error);
                    }
                });

                // даём возможность вызвать дополнительную логику, например подписки
                if (onConnectCallback) {
                    onConnectCallback(stompClient);
                }
            },
            onStompError: (frame) => {
                console.error('[useStompWebSocket] STOMP error:', frame.headers['message']);

                // Обрабатываем системные ошибки STOMP как обычные ошибки WebSocket
                const errorData = {
                    type: 'ERROR',
                    data: frame.headers['message'] || 'Ошибка STOMP-соединения'
                };

                setLastError(errorData);
                if (onErrorCallback) {
                    onErrorCallback(errorData);
                }
            },
            onDisconnect: () => {
                //console.log('[useStompWebSocket] STOMP disconnected');
                setConnected(false);
            },
            debug: (str) => {
                // При желании раскомментируйте:
                console.log('[STOMP DEBUG]', str);
            },
        });

        clientRef.current = stompClient;
        stompClient.activate();

        // 3) Очистка при размонтировании
        return () => {
            //console.log('[useStompWebSocket] UNMOUNT → deactivate()');
            setConnected(false);
            stompClient.deactivate();
        };
    }, [sockJsUrl, onConnectCallback, options.reconnectDelay]);

    /**
     * Функция publish с проверкой, что клиент подключён.
     */
    const publish = useCallback((destination, body) => {
        // if (!connected) {
        //     console.warn('[useStompWebSocket] Попытка publish, но нет соединения');
        //     return;
        // }
        clientRef.current.publish({
            destination,
            body: JSON.stringify(body || {}),
        });
    }, [connected]);

    return {
        stompClient: clientRef.current,
        connected,
        publish,
        lastError
    };
}
