import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useBoardWebSocket from '../hooks/useBoardWebSocket';
import { useBoardState } from '../hooks/useBoardState';
import { useWebSocketErrors } from '../hooks/useWebSocketErrors';
import Toolbar from '../components/Toolbar';
import BoardFlow from '../components/BoardFlow';
import BoardPermissions from '../components/BoardPermissions';
import ExportButton from '../components/ExportButton';
import './BoardPageDefault.css';
import { DragProvider } from "../components/nodes/DragContext";
import { Alert, Button, Space, Modal, message } from 'antd';

export default function BoardPageDefault() {
    // Параметры и навигация
    const { id } = useParams();
    const navigate = useNavigate();
    const boardStateRef = useRef(null);
    
    // Состояния для управления ошибками
    const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
    const [accessError, setAccessError] = useState(null);
    
    // Обработка WebSocket ошибок
    const { handleError, errors, isPermissionError } = useWebSocketErrors(false, (error) => {
        if (error.isPermissionError) {
            setAccessError(error);
            setShowAccessDeniedModal(true);
        }
    });

    // Обработчик входящих WebSocket сообщений
    const handleMessage = useCallback((message) => {
        console.log(message.type, message.data);
        switch (message.type) {
            // Данные доски
            case 'INITIAL_DATA':
                boardStateRef.current?.handleBoardDataFromServer(message.data);
                break;
                
            // Элементы доски
            case 'CREATE_ITEM':
            case 'UPDATE_ITEM':
                boardStateRef.current?.handleNodeUpdateFromServer(message.data);
                break;
            case 'DELETE_ITEM':
                boardStateRef.current?.handleNodeRemoveFromServer?.(message.itemId);
                break;
                
            // Соединения
            case 'CREATE_CONNECTOR':
            case 'UPDATE_CONNECTOR':
                boardStateRef.current?.handleConnectionUpdateFromServer(message.data);
                break;
            case 'DELETE_CONNECTOR':
                boardStateRef.current?.handleConnectionRemoveFromServer(message.connectorId);
                break;
                
            // Блокировки элементов - обрабатываем в зависимости от статуса
            // case 'LOCK':
            //     // Обрабатываем все события блокировки через один обработчик
            //     if (message.data && (message.data.status === 'LOCKED' || message.data.status === 'UNLOCKED' || message.data.status === 'LOCK_DENIED')) {
            //         boardStateRef.current?.handleNodeLocked(message.data);
            //
            //         // Показываем уведомление при отказе в блокировке
            //         if (message.data.status === 'LOCK_DENIED') {
            //             message.error(`Узел занят пользователем: ${message.data.displayLockedBy || message.data.lockedByLogin || 'другой пользователь'}`, 3);
            //         }
            //     }
            //     break;
            //
            // Эти события оставляем для совместимости, но в новой версии их заменяет LOCK с разными статусами
            case 'ITEM_LOCKED':
                console.log('Устаревшее событие ITEM_LOCKED, рекомендуется использовать LOCK со статусом');
                boardStateRef.current?.handleNodeLocked({...message.data, status: 'LOCKED'});
                break;
            case 'ITEM_LOCK_DENIED':
                console.log('Устаревшее событие ITEM_LOCK_DENIED, рекомендуется использовать LOCK со статусом');
                boardStateRef.current?.handleNodeLocked({...message.data, status: 'LOCK_DENIED'});
                message.error(`Узел занят пользователем: ${message.data.displayLockedBy || message.data.lockedByLogin || 'другой пользователь'}`, 3);
                break;
            case 'ITEM_UNLOCKED':
                console.log('Устаревшее событие ITEM_UNLOCKED, рекомендуется использовать LOCK со статусом');
                boardStateRef.current?.handleNodeUnlocked({...message.data, status: 'UNLOCKED'});
                break;
                
            case 'LOCKED_ITEM_UPDATED':
                boardStateRef.current?.handleLockedNodeUpdate(message.data);
                break;
                
            default:
                console.warn('Неизвестный тип сообщения:', message.type);
                break;
        }
    }, []);

    // Инициализация WebSocket соединения
    const { stompClient, connected, publish } = useBoardWebSocket(id, handleMessage, handleError);

    // Получение состояния и методов работы с доской
    const boardState = useBoardState({ stompClient, publish, connected });
    useEffect(() => {
        boardStateRef.current = boardState;
    }, [boardState]);

    // Деструктурируем методы из состояния доски
    const {
        // Состояния элементов
        nodes,
        edges,
        
        // Обработчики изменений
        onNodesChange,
        onEdgesChange,
        onConnect,
        onEdgeUpdate,
        onSelectionChange,
        onNodeDragStop,
        onNodeDrag,
        onNodeDragStart,
        onEdgesDelete,
        onNodesDelete,
        
        // Операции с узлами
        createNewNode,
        removeLastNode,
        
        // Загрузка данных
        loadBoardData,
        // loadConnectorData,
        
        // Обработчики серверных обновлений
        handleNodeUpdateFromServer,
        handleNodeRemoveFromServer,
        handleConnectionUpdateFromServer,
        handleConnectionRemoveFromServer,
        handleBoardDataFromServer,
        
        // Методы блокировки узлов
        lockNode,
        updateLockedNode,
        unlockNode,
        handleNodeLocked,
        handleNodeUnlocked,
        handleLockedNodeUpdate
    } = boardState;

    // Загрузка данных при подключении
    useEffect(() => {
        if (connected && id) {
            loadBoardData(id);
            // loadConnectorData(id);
        }
    }, [connected, id, loadBoardData]);

    // Обработчики событий UI
    const handleDropNewNode = (nodeType, position) => {
        createNewNode(id, nodeType, position);
    };
    
    const handleBackToBoards = useCallback(() => {
        navigate('/project');
    }, [navigate]);

    return (
        <DragProvider>
            <div className="board-page-container">
                {/* Компонент прав доступа */}
                <BoardPermissions boardId={id} />
                
                {/* Панель инструментов */}
                <Toolbar 
                    boardId={id} 
                    addNode={createNewNode} 
                    removeLastNode={removeLastNode} 
                />
                
                {/* Основной компонент доски */}
                <BoardFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onEdgeUpdate={onEdgeUpdate}
                    onSelectionChange={onSelectionChange}
                    onNodeDragStop={onNodeDragStop}
                    onNodeDragStart={onNodeDragStart}
                    onNodeDrag={onNodeDrag}
                    onDropNewNode={handleDropNewNode}
                    onEdgesDelete={onEdgesDelete}
                    onNodesDelete={onNodesDelete}
                />
                
                {/* Кнопка экспорта */}
                <ExportButton />
                
                {/* Модальное окно ошибки доступа */}
                <Modal
                    title="Нет доступа"
                    open={showAccessDeniedModal}
                    onCancel={() => setShowAccessDeniedModal(false)}
                    footer={[
                        <Button key="back" onClick={handleBackToBoards}>
                            Вернуться к списку досок
                        </Button>,
                        <Button key="close" type="primary" onClick={() => setShowAccessDeniedModal(false)}>
                            Закрыть
                        </Button>
                    ]}
                >
                    <p>
                        {accessError?.message || 'У вас нет необходимых прав для выполнения этого действия.'}
                    </p>
                    <p>
                        Обратитесь к владельцу доски для получения нужных прав доступа.
                    </p>
                </Modal>
            </div>
        </DragProvider>
    );
}

