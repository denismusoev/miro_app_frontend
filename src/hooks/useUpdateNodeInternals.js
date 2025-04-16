import { useCallback, useEffect, useRef } from 'react';
import { useUpdateNodeInternals as useReactFlowUpdateNodeInternals } from '@xyflow/react';

/**
 * Хук для принудительного обновления внутренних элементов узла после перемещения
 * Особенно полезен для правильного отображения узлов внутри фреймов
 * @returns {Function} - функция для запроса обновления узла по ID
 */
export const useUpdateNodeInternals = () => {
    const updateNodeInternals = useReactFlowUpdateNodeInternals();
    const pendingUpdatesRef = useRef(new Set());
    const timeoutRef = useRef(null);
    
    // Функция для добавления узла в очередь на обновление
    const requestNodeUpdate = useCallback((nodeId) => {
        if (!nodeId) return;
        pendingUpdatesRef.current.add(nodeId);
        
        // Очищаем предыдущий таймаут, если он был
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        // Устанавливаем таймаут для обновления узлов
        timeoutRef.current = setTimeout(() => {
            const nodeIds = Array.from(pendingUpdatesRef.current);
            nodeIds.forEach(id => {
                console.log(`🔄 Принудительное обновление внутренностей узла: ${id}`);
                updateNodeInternals(id);
            });
            pendingUpdatesRef.current.clear();
            timeoutRef.current = null;
        }, 50);
    }, [updateNodeInternals]);
    
    // Очистка при размонтировании
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);
    
    return requestNodeUpdate;
}; 