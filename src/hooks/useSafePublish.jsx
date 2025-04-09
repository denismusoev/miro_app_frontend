// src/hooks/useSafePublish.js
import { useCallback } from 'react';

/**
 * Хук для безопасной публикации сообщения через WebSocket.
 * Если соединение не установлено, логирует ошибку.
 *
 * @param {boolean} connectedRef - Флаг подключения
 * @param {Function} publishFn - Функция для отправки сообщения на сервер
 */
    export function useSafePublish(connectedRef, publishFn) {
    return useCallback((destination, body) => {
        if (!connectedRef.current) {
            console.error('[useSafePublish] Соединение не установлено, отправка невозможна.');
            return;
        }
        //console.log('[useSafePublish] Отправка на:', destination, 'Тело:', body);
        publishFn(destination, body);
    }, [connectedRef, publishFn]);
}
