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
 */
export default function useStompWebSocket(sockJsUrl, onConnectCallback, options = {}) {
    const [connected, setConnected] = useState(false);
    const clientRef = useRef(null);

    useEffect(() => {
        //console.log('[useStompWebSocket] MOUNT');

        const token = localStorage.getItem('token');

        // 1) Создаём SockJS-соединение
        const socket = new SockJS(sockJsUrl);

        // 2) Создаём STOMP-клиент
        const stompClient = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: options.reconnectDelay ?? 5000, // авто-реконнект
            // connectHeaders: {
            //     Authorization: `Bearer ${token}`,
            // },
            onConnect: (frame) => {
                //console.log('[useStompWebSocket] onConnect:', frame);
                setConnected(true);
                // даём возможность вызвать дополнительную логику, например подписки
                if (onConnectCallback) {
                    onConnectCallback(stompClient);
                }
            },
            onStompError: (frame) => {
                console.error('[useStompWebSocket] STOMP error:', frame.headers['message']);
            },
            onDisconnect: () => {
                //console.log('[useStompWebSocket] STOMP disconnected');
                setConnected(false);
            },
            debug: (str) => {
                // При желании раскомментируйте:
                // console.log('[STOMP DEBUG]', str);
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
    };
}
