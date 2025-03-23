// src/pages/BoardPageDefault.jsx
import React, { useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import useStompWebSocket from '../hooks/useWebSocket';
import { useBoardState } from '../hooks/useBoardState';
import Toolbar from '../components/Toolbar';
import BoardFlow from '../components/BoardFlow';

// Опционально: выносим URL SockJS в константу:
const WS_ENDPOINT = 'http://localhost:8080/ws';

export default function BoardPageDefault() {
    const { id } = useParams();
    const boardStateRef = useRef(null);

    // 1. Колбэк, который вызывается, когда STOMP подключился.
    //    Здесь можно подписаться на топик "/topic/boards/{id}"
    //    и при получении сообщений — вызывать setBoardData / updateNodeFromWS.
    const handleStompConnect = useCallback((client) => {
        console.log('[BoardPageDefault] handleStompConnect - подписываемся на топик');
        client.subscribe(`/topic/board/${id}`, (msg) => {
            try {
                const message = JSON.parse(msg.body);
                console.log('[BoardPageDefault] Получили сообщение по /topic/boards:', message);
                // Обрабатываем
                if (message.type === 'INITIAL') {
                    boardStateRef.current?.setBoardData(message.data);
                } else if (message.type === 'CREATE' || message.type === 'UPDATE') {
                    boardStateRef.current?.updateNodeFromWS(message.data);
                } else if (message.type === 'DELETE') {
                    boardStateRef.current?.removeNode?.(message.nodeId);
                }
            } catch (e) {
                console.error('Ошибка парсинга', e);
            }
        });
    }, [id]);

    // 2. Подключаемся к SockJS + STOMP
    const {
        stompClient,
        connected,
        publish,
    } = useStompWebSocket(WS_ENDPOINT, handleStompConnect);

    // 3. Инициируем "логику доски" (reactflow + ws), прокидывая publish и connected
    const boardState = useBoardState({ stompClient, publish, connected });
    boardStateRef.current = boardState; // cохраняем в ref, чтобы вызывать методы в подписке
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        onEdgeUpdate,
        onSelectionChange,
        addNode,
        removeLastNode,
        loadBoardData,
        onNodeDragStop,
    } = boardState;

    // 4. Когда точно connected — вызываем loadBoardData(id)
    //    Сервер пошлёт нам INITIAL (который поймается в client.subscribe).
    useEffect(() => {
        if (connected && id) {
            console.log('[BoardPageDefault] connected -> loadBoardData', id);
            loadBoardData(id);
        }
    }, [connected, id, loadBoardData]);

    return (
        <div style={{ height: '90vh', border: '1px solid #ddd' }}>
            <Toolbar addNode={addNode} removeLastNode={removeLastNode} />
            <BoardFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onEdgeUpdate={onEdgeUpdate}
                onSelectionChange={onSelectionChange}
                onNodeDragStop={onNodeDragStop}
            />
        </div>
    );
}
