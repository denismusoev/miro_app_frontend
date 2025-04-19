import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';


export function useWebSocketErrors(showNotifications = false, onErrorCallback) {
    const [errors, setErrors] = useState([]);

    
    const handleError = useCallback((errorData) => {
        if (!errorData) return;
        
        console.error('WebSocket ошибка:', errorData);
        
        // Форматирование сообщения об ошибке
        const errorMessage = formatErrorMessage(errorData);
        
        // Добавляем ошибку в состояние
        const error = { 
            timestamp: new Date(), 
            error: errorData,
            message: errorMessage,
            isPermissionError: isPermissionError(errorMessage),
            id: Math.random().toString(36).substr(2, 9)
        };
        
        setErrors(prev => [...prev, error]);
        
        // Показываем уведомление пользователю если включено
        if (showNotifications && errorData.type === 'ERROR') {
            message.error(errorMessage);
        }
        
        // Вызываем дополнительный колбэк если предоставлен
        if (onErrorCallback) {
            onErrorCallback(error);
        }
    }, [showNotifications, onErrorCallback]);
    
    
    const formatErrorMessage = (errorData) => {
        // Если сервер отправил строку в data, используем её
        if (errorData.data && typeof errorData.data === 'string') {
            return errorData.data;
        }
        
        // Если сервер отправил сообщение в message, используем его
        if (errorData.message && typeof errorData.message === 'string') {
            return errorData.message;
        }
        
        // Если в объекте ошибки есть поле data.message, используем его
        if (errorData.data && errorData.data.message) {
            return errorData.data.message;
        }
        
        // Иначе возвращаем общее сообщение
        return 'Произошла ошибка при выполнении операции';
    };
    
    
    const isPermissionError = (errorMessage) => {
        if (!errorMessage) return false;
        
        // Проверяем наиболее распространенные сообщения об ошибках доступа
        const accessPatterns = [
            'нет прав',
            'не имеет доступа',
            'доступ запрещен',
            'access denied',
            'permission denied',
            'unauthorized'
        ];
        
        return accessPatterns.some(pattern => 
            errorMessage.toLowerCase().includes(pattern.toLowerCase())
        );
    };
    
    
    const isLastErrorPermissionError = useCallback(() => {
        if (errors.length === 0) return false;
        const lastError = errors[errors.length - 1];
        return lastError.isPermissionError;
    }, [errors]);
    
    
    const clearErrors = useCallback(() => {
        setErrors([]);
    }, []);
    
    // Возвращаем обработчик ошибок и список ошибок
    return {
        handleError,
        errors,
        clearErrors,
        isPermissionError: isLastErrorPermissionError
    };
} 