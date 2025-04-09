// src/pages/BoardPageDefault.jsx
import React, { useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import useBoardWebSocket from '../hooks/useBoardWebSocket';
import { useBoardState } from '../hooks/useBoardState';
import Toolbar from '../components/Toolbar';
import BoardFlow from '../components/BoardFlow';
import './BoardPageDefault.css';
import {DragProvider} from "../components/nodes/DragContext";

export default function BoardPageDefault() {
    const { id } = useParams();
    const boardStateRef = useRef(null);

    // Обработчик входящих сообщений
    const handleMessage = useCallback((message) => {
        //console.log('[BoardPageDefault] handleMessage:', message);

        switch (message.type) {
            case 'INITIAL_DATA':
                boardStateRef.current?.setBoardData(message.data);
                break;
            case 'CREATE_ITEM':
            case 'UPDATE_ITEM':
                boardStateRef.current?.updateNodeFromWS(message.data);
                break;
            case 'DELETE_ITEM':
                boardStateRef.current?.removeNode?.(message.itemId);
                break;
            case 'CREATE_CONNECTOR':
            case 'UPDATE_CONNECTOR':
                boardStateRef.current?.addOrUpdateConnector(message.data);
                break;
            case 'DELETE_CONNECTOR':
                boardStateRef.current?.removeConnector(message.connectorId);
                break;
            default:
                console.warn('Неизвестный тип сообщения:', message.type);
                break;
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
        loadConnectorData,
        onNodeDragStop,
        onEdgesDelete,
        onNodesDelete,
    } = boardState;

    // Загружаем данные доски после установки соединения
    useEffect(() => {
        if (connected && id) {
            //console.log('[BoardPageDefault] connected -> loadBoardData', id);
            loadBoardData(id);
            loadConnectorData(id);
        }
    }, [connected, id, loadBoardData]);

    const handleDropNewNode = (nodeType, position) => {
        createNewNode(id, nodeType, position);
    };

    return (
        <DragProvider>
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
                    onDropNewNode={handleDropNewNode}
                    onEdgesDelete={onEdgesDelete}
                    onNodesDelete={onNodesDelete}
                />
            </div>
        </DragProvider>
    );
}
