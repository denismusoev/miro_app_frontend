// src/hooks/useStompWebSocket.js
import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function useStompWebSocket(sockJsUrl, onConnectCallback, options = {}, onErrorCallback) {
    const [connected, setConnected] = useState(false);
    const clientRef = useRef(null);
    const [lastError, setLastError] = useState(null);
    const [reconnectNeeded, setReconnectNeeded] = useState(false);

    // Функция для определения, нужно ли переподключаться с новой сессией
    const handleLazyInitializationError = useCallback((errorMessage) => {
        if (typeof errorMessage !== 'string') return false;
        
        // Проверяем наличие LazyInitializationException или "no Session"
        return errorMessage.includes('LazyInitializationException') || 
              (errorMessage.includes('could not initialize proxy') && errorMessage.includes('no Session'));
    }, []);

    // Функция для принудительного создания нового соединения при ошибке LazyInitializationException
    const createNewConnection = useCallback(() => {
        console.log('[useStompWebSocket] Создание нового соединения после ошибки LazyInitializationException');
        
        // Если есть активное соединение, деактивируем его
        if (clientRef.current) {
            try {
                console.log('[useStompWebSocket] Деактивация текущего соединения');
                clientRef.current.deactivate();
                clientRef.current = null;
            } catch (error) {
                console.error('[useStompWebSocket] Ошибка при деактивации соединения:', error);
            }
        }
        
        // Устанавливаем флаг, что нужно переподключиться
        setReconnectNeeded(true);
    }, []);

    // Создание и инициализация WebSocket-соединения
    useEffect(() => {
        // Если не нужно создавать соединение, выходим
        if (!reconnectNeeded && clientRef.current) return;
        
        console.log('[useStompWebSocket] Инициализация соединения');
        setReconnectNeeded(false);

        const token = localStorage.getItem('token');

        // 1) Создаём SockJS-соединение с дополнительным параметром для создания новой сессии
        const randomParam = `_=${Date.now()}`;
        const socketUrl = sockJsUrl.includes('?') 
            ? `${sockJsUrl}&${randomParam}` 
            : `${sockJsUrl}?${randomParam}`;
        
        const socket = new SockJS(socketUrl);

        // 2) Создаём STOMP-клиент
        const stompClient = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 0, // Отключаем авто-реконнект
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            connectHeaders: {
                Authorization: `Bearer ${token}`,
                'X-Create-New-Session': 'true' // Просим сервер создать новую сессию
            },
            onConnect: (frame) => {
                console.log('[useStompWebSocket] Подключено:', frame);
                setConnected(true);

                // Вызываем пользовательский коллбэк для настройки подписок
                if (onConnectCallback) {
                    onConnectCallback(stompClient);
                }
            },
            onStompError: (frame) => {
                console.error('[useStompWebSocket] Ошибка STOMP:', frame.headers['message']);

                // Обрабатываем ошибку
                const errorData = {
                    type: 'ERROR',
                    data: frame.headers['message'] || 'Ошибка STOMP-соединения'
                };

                // Проверяем, есть ли ошибка LazyInitializationException
                if (handleLazyInitializationError(frame.headers['message'])) {
                    console.log('[useStompWebSocket] Обнаружена ошибка LazyInitializationException, переподключаемся');
                    createNewConnection();
                }

                setLastError(errorData);
                if (onErrorCallback) {
                    onErrorCallback(errorData);
                }
            },
            onDisconnect: () => {
                console.log('[useStompWebSocket] Отключено');
                setConnected(false);
            },
            onWebSocketClose: () => {
                console.log('[useStompWebSocket] WebSocket закрыт');
                setConnected(false);
                
                // Уведомляем о потере соединения
                const errorData = {
                    type: 'CONNECTION_LOST',
                    data: 'Соединение WebSocket закрыто. Требуется перезагрузка страницы.'
                };
                
                setLastError(errorData);
                if (onErrorCallback) {
                    onErrorCallback(errorData);
                }
            },
            debug: (str) => {
                // Проверяем сообщения отладки на наличие LazyInitializationException
                if (handleLazyInitializationError(str)) {
                    console.log('[useStompWebSocket] Обнаружена ошибка LazyInitializationException в отладочном сообщении');
                    createNewConnection();
                }
                
                // Раскомментируйте при необходимости подробной отладки
                // console.log('[STOMP DEBUG]', str);
            },
        });

        clientRef.current = stompClient;
        stompClient.activate();

        // Очистка при размонтировании
        return () => {
            console.log('[useStompWebSocket] Закрытие соединения');
            setConnected(false);
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        };
    }, [sockJsUrl, onConnectCallback, onErrorCallback, reconnectNeeded, handleLazyInitializationError, createNewConnection]);
    
    // Функция для отправки сообщений
    const publish = useCallback((destination, body) => {
        if (!connected || !clientRef.current) {
            console.warn('[useStompWebSocket] Попытка отправки сообщения при отсутствии соединения');
            return false;
        }
        
        try {
        clientRef.current.publish({
            destination,
            body: JSON.stringify(body || {}),
        });
            return true;
        } catch (error) {
            console.error('[useStompWebSocket] Ошибка при отправке сообщения:', error);
            
            // Проверяем, содержит ли ошибка LazyInitializationException
            if (error.message && handleLazyInitializationError(error.message)) {
                console.log('[useStompWebSocket] Обнаружена ошибка LazyInitializationException при отправке, переподключаемся');
                createNewConnection();
            }
            
            return false;
        }
    }, [connected, handleLazyInitializationError, createNewConnection]);
    
    // Функция для ручного переподключения с новой сессией
    const reconnect = useCallback(() => {
        console.log('[useStompWebSocket] Ручное переподключение с новой сессией');
        createNewConnection();
    }, [createNewConnection]);

    return {
        stompClient: clientRef.current,
        connected,
        publish,
        lastError,
        reconnect
    };
}
