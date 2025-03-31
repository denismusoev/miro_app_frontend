// src/pages/BoardPageDefault.jsx
import React, { useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import useBoardWebSocket from '../hooks/useBoardWebSocket';
import { useBoardState } from '../hooks/useBoardState';
import Toolbar from '../components/Toolbar';
import BoardFlow from '../components/BoardFlow';
import './BoardPageDefault.css';

export default function BoardPageDefault() {
    const { id } = useParams();
    const boardStateRef = useRef(null);

    // Обработчик входящих сообщений
    const handleMessage = useCallback((message) => {
        console.log('[BoardPageDefault] Обработка сообщения:', message);
        if (message.type === 'INITIAL') {
            boardStateRef.current?.setBoardData(message.data);
        } else if (message.type === 'CREATE' || message.type === 'UPDATE') {
            boardStateRef.current?.updateNodeFromWS(message.data);
        } else if (message.type === 'DELETE') {
            boardStateRef.current?.removeNode?.(message.nodeId);
        }
    }, []);

    // Подключаемся к WebSocket через наш новый хук
    const { stompClient, connected, publish } = useBoardWebSocket(id, handleMessage);

    // Инициализируем логику доски
    const boardState = useBoardState({ stompClient, publish, connected });
    useEffect(() => {
        boardStateRef.current = boardState;
    }, [boardState]);

    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        onEdgeUpdate,
        onSelectionChange,
        createNewNode,
        removeLastNode,
        loadBoardData,
        onNodeDragStop,
    } = boardState;

    // Загружаем данные доски после установки соединения
    useEffect(() => {
        if (connected && id) {
            console.log('[BoardPageDefault] connected -> loadBoardData', id);
            loadBoardData(id);
        }
    }, [connected, id, loadBoardData]);

    return (
        <div className="board-page-container">
            <Toolbar boardId={id} addNode={createNewNode} removeLastNode={removeLastNode} />
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
