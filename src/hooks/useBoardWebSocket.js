import { useCallback, useContext, useState, useEffect, useRef } from 'react';
import useStompWebSocket from './useStompWebSocket';
import { ProjectContext } from "../components/ProjectProvider";
import { message } from 'antd';

const WS_ENDPOINT = 'http://localhost:8080/ws';
// const WS_ENDPOINT = 'http://192.168.0.131:8080/ws';
const TOPIC_ENDPOINT = '/topic/board/';
const USER_QUEUE_ENDPOINT = '/user/queue/messages';
const ERROR_QUEUE_ENDPOINT = '/user/queue/errors';

export default function useBoardWebSocket(boardId, onMessage, showNotifications = true, onError) {
    const [lastWSError, setLastWSError] = useState(null);
    const { userLogin } = useContext(ProjectContext);
    const [subscriptions, setSubscriptions] = useState([]);
    const [connectionLost, setConnectionLost] = useState(false);
    const [needsReload, setNeedsReload] = useState(false);
    
    // Используем refs для хранения ссылок на stompClient и reconnect
    const stompClientRef = useRef(null);
    const reconnectRef = useRef(null);

    // Функция для обнаружения ошибки LazyInitializationException
    const isLazyInitializationError = useCallback((errorData) => {
        if (!errorData) return false;
        
        // Проверяем данные ошибки в разных форматах
        const errorMessage = typeof errorData === 'string' 
            ? errorData 
            : (errorData.data || errorData.message || '');

            
        return typeof errorMessage === 'string' && (
            errorMessage.includes('LazyInitializationException') || 
            (errorMessage.includes('could not initialize proxy') && errorMessage.includes('no Session'))
        );
    }, []);

    // Обработчик ошибок от WebSocket
    const handleError = useCallback((errorData) => {
        console.error('[useBoardWebSocket] Ошибка WebSocket:', errorData);
        setLastWSError(errorData);
        
        // Проверяем на ошибку LazyInitializationException
        if (isLazyInitializationError(errorData)) {
            console.log('[useBoardWebSocket] Обнаружена ошибка LazyInitializationException, требуется переподключение');
            
            // Показываем специальное уведомление при LazyInitializationException
            if (showNotifications) {
                message.error({
                    content: 'Ошибка сессии на сервере. Выполняется переподключение...',
                    duration: 3,
                    key: 'lazy-init-error'
                });
            }
            
            // Устанавливаем флаг необходимости перезагрузки
            setNeedsReload(true);
            
            // Вызываем переподключение с созданием новой сессии
            if (reconnectRef.current) {
                reconnectRef.current();
            }
            
            setConnectionLost(true);
            return;
        }
        
        // Показываем уведомление о потере соединения для других ошибок
        if (showNotifications) {
            message.error({
                content: 'Соединение с сервером потеряно. Пожалуйста, перезагрузите страницу.',
                duration: 0,
                key: 'connection-lost'
            });
        }
        console.log("sd")
        
        setConnectionLost(true);
        
        if (onError) {
            onError(errorData);
        }
    }, [onError, showNotifications, isLazyInitializationError]);
    
    // Функция подписки на каналы при подключении
    const handleStompConnect = useCallback((client) => {
        console.log(`[useBoardWebSocket] Подключено, выполняем подписку на каналы для доски ${boardId}`);
        
        const newSubscriptions = [];
        
        // Подписка на общий топик доски
        const topic = TOPIC_ENDPOINT + boardId;
        const boardSubscription = client.subscribe(topic, (msg) => {
            try {
                const message = JSON.parse(msg.body);
                console.log('[useBoardWebSocket] Получено общее сообщение');
                if (message.senderLogin === userLogin) {
                    console.log('[useBoardWebSocket] Получено сообщение о локальном изменении, игнорируем');
                    return;
                }
                
                // Проверяем сообщение на содержание ошибки LazyInitializationException
                if (message.type === 'ERROR' && isLazyInitializationError(message.data || message.error)) {
                    console.log('[useBoardWebSocket] Получена ошибка LazyInitializationException');
                    // Установим флаг необходимости перезагрузки данных доски
                    setNeedsReload(true);
                    return;
                }
                
                onMessage(message);
            } catch (error) {
                console.error('[useBoardWebSocket] Ошибка парсинга сообщения', error);
            }
        });
        newSubscriptions.push(boardSubscription);
        
        // Подписка на персональные сообщения пользователю
        const personalSubscription = client.subscribe(USER_QUEUE_ENDPOINT, (msg) => {
            try {
                const message = JSON.parse(msg.body);
                console.log('[useBoardWebSocket] Получено персональное сообщение');
                
                // Проверяем сообщение на содержание ошибки LazyInitializationException
                if (message.type === 'ERROR' && isLazyInitializationError(message.data || message.error)) {
                    console.log('[useBoardWebSocket] Получена персональная ошибка LazyInitializationException');
                    // Установим флаг необходимости перезагрузки данных доски
                    setNeedsReload(true);
                    return;
                }
                
                onMessage(message);
            } catch (error) {
                console.error('[useBoardWebSocket] Ошибка парсинга персонального сообщения', error);
            }
        });
        newSubscriptions.push(personalSubscription);
        
        // Подписка на очередь ошибок
        const errorSubscription = client.subscribe(ERROR_QUEUE_ENDPOINT, (msg) => {
            try {
                const message = JSON.parse(msg.body);
                console.log('[useBoardWebSocket] Получено сообщение об ошибке');
                
                // Проверяем сообщение на содержание ошибки LazyInitializationException
                if (isLazyInitializationError(message.data || message.error)) {
                    console.log('[useBoardWebSocket] Получена ошибка LazyInitializationException из очереди ошибок');
                    // Установим флаг необходимости переподключения
                    setNeedsReload(true);
                    return;
                }
                
                onMessage(message);
            } catch (error) {
                console.error('[useBoardWebSocket] Ошибка парсинга сообщения об ошибке', error);
            }
        });
        newSubscriptions.push(errorSubscription);
        
        // Сохраняем подписки для возможности отписаться при необходимости
        setSubscriptions(newSubscriptions);
        
        // Сбрасываем флаг потери соединения
        setConnectionLost(false);
        
        // Перезагружаем данные доски, если это необходимо
        if (needsReload) {
            console.log('[useBoardWebSocket] Перезагружаем данные доски после переподключения');
            // Запрашиваем загрузку данных доски
            if (boardId && client) {
                setTimeout(() => {
                    client.publish({
                        destination: '/app/board/load',
                        body: JSON.stringify(boardId)
                    });
                    setNeedsReload(false);
                }, 500);
            }
        }
    }, [boardId, onMessage, userLogin, needsReload, isLazyInitializationError]);

    const { stompClient, connected, publish, lastError, reconnect } = useStompWebSocket(
        WS_ENDPOINT, 
        handleStompConnect,
        { 
            reconnectDelay: 0 // Отключаем автоматическое переподключение
        }, 
        handleError
    );
    
    // Обновляем refs после получения stompClient и reconnect
    useEffect(() => {
        stompClientRef.current = stompClient;
        reconnectRef.current = reconnect;
    }, [stompClient, reconnect]);
    
    // Отписка при смене boardId или размонтировании
    useEffect(() => {
        // Функция отписки от всех каналов
        const unsubscribeAll = () => {
            if (subscriptions.length > 0) {
                console.log(`[useBoardWebSocket] Отписываемся от каналов предыдущей доски`);
                subscriptions.forEach(subscription => {
                    try {
                        subscription.unsubscribe();
                    } catch (e) {
                        console.error('[useBoardWebSocket] Ошибка при отписке', e);
                    }
                });
                setSubscriptions([]);
            }
        };
        
        // Отписываемся при размонтировании компонента
        return () => {
            unsubscribeAll();
        };
    }, [subscriptions, boardId]);
    
    // Перезагрузка данных доски при необходимости
    useEffect(() => {
        if (needsReload && connected && boardId) {
            console.log('[useBoardWebSocket] Выполняем отложенную перезагрузку данных доски');
            publish('/app/board/load', boardId);
            setNeedsReload(false);
        }
    }, [needsReload, connected, boardId, publish]);
    
    // Функция для ручного переподключения
    const manualReconnect = useCallback(() => {
        if (connected) {
            message.info('Переподключение и перезагрузка данных...');
            setNeedsReload(true);
            if (reconnect) {
                reconnect();
            }
        } else {
            message.info('Для восстановления соединения необходимо перезагрузить страницу');
        }
    }, [connected, reconnect]);
    
    return { 
        stompClient, 
        connected, 
        publish,
        lastError: lastError || lastWSError,
        reconnect: manualReconnect,
        connectionLost
    };
}
