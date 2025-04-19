
import { useCallback } from 'react';


    export function useSafePublish(connectedRef, publishFn) {
    return useCallback((destination, body) => {
        if (!connectedRef.current) {
            console.error('[useSafePublish] Соединение не установлено, отправка невозможна.');
            return;
        }

        publishFn(destination, body);
    }, [connectedRef, publishFn]);
}
