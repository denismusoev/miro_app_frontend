import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useWebSocket from '../hooks/useBoardWebSocket';
import { useBoardState } from '../hooks/useBoardState';
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

    // Обработчик входящих WebSocket сообщений
    const handleMessage = useCallback((message) => {
        console.log("[BoardPageDefault:handleMessage]", message.type, message.data, message.error);
        
        // Извлекаем поля из WebSocketResponse
        const { type, processId, senderLogin, data, error } = message;

        // Проверяем, является ли сообщение ответом на операцию текущего пользователя
        const isConfirmation = type.includes('_CONFIRMED');
        const isFailure = type.includes('_FAILED');
        
        // Если это подтверждение или ошибка операции - используем специальные обработчики
        if (isConfirmation) {
            console.log('[BoardPageDefault:handleMessage]', isConfirmation);
            boardStateRef.current?.handleServerConfirmation(type, processId, data);
        } else if (isFailure) {
            console.log('[BoardPageDefault:handleMessage]', isFailure);
            boardStateRef.current?.handleServerError(type, processId, error);
        } else {
            // Для других типов сообщений используем обычную обработку
            switch (type) {
                // Данные доски
                case 'INITIAL_DATA':
                    boardStateRef.current?.handleBoardDataFromServer(data);
                    break;
                    
                // Элементы доски - создание/обновление/удаление
                case 'CREATE_ITEM':
                case 'UPDATE_ITEM':
                    boardStateRef.current?.handleNodeUpdateFromServer(data, type);
                    break;
                case 'DELETE_ITEM':
                    boardStateRef.current?.handleNodeRemoveFromServer?.(data);
                    break;
                    
                // Соединения - создание/обновление/удаление
                case 'CREATE_CONNECTOR':
                case 'UPDATE_CONNECTOR':
                    boardStateRef.current?.handleConnectionUpdateFromServer(data, type);
                    break;
                case 'DELETE_CONNECTOR':
                    boardStateRef.current?.handleConnectionRemoveFromServer(data);
                    break;
                    
                // Блокировки элементов
                case 'ITEM_LOCKED':
                    console.log('[BoardPageDefault:handleMessage] Устаревшее событие ITEM_LOCKED, рекомендуется использовать LOCK со статусом');
                    boardStateRef.current?.handleNodeLocked({...data, status: 'LOCKED'});
                    break;
                case 'LOCKED_ITEM_UPDATED':
                    boardStateRef.current?.handleLockedNodeUpdate(data);
                    break;
                case 'ITEM_UNLOCKED':
                    console.log('[BoardPageDefault:handleMessage] Устаревшее событие ITEM_UNLOCKED, рекомендуется использовать LOCK со статусом');
                    boardStateRef.current?.handleNodeUnlocked({...data, status: 'UNLOCKED'});
                    break;
                    
                // Ошибки
                case 'SERVER_ERROR':
                case 'VALIDATION_ERROR':
                case 'PERMISSION_ERROR':
                case 'NOT_FOUND_ERROR':
                case 'ERROR':
                    console.error('[BoardPageDefault:handleMessage] Серверная ошибка:', error);
                    message.error(`Ошибка сервера: ${error?.message || 'Неизвестная ошибка'}`, 3);
                    break;
                    
                default:
                    console.warn('[BoardPageDefault:handleMessage] Неизвестный тип сообщения:', type);
                    break;
            }
        }
    }, []);

    // Обработчик ошибок WebSocket
    const handleErrorCallback = useCallback((error) => {
        if (error.isPermissionError) {
            setShowAccessDeniedModal(true);
        }
    }, []);

    // Инициализация WebSocket соединения с использованием нового хука
    const { connected, publish, lastError, reconnect, connectionLost } = useWebSocket(
        id, 
        handleMessage, 
        false, // не показывать автоматические уведомления об ошибках
        handleErrorCallback
    );

    // Получение состояния и методов работы с доской
    const boardState = useBoardState({ publish, connected });
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
        onDelete,

        // Операции с узлами
        createNewNode,
        removeLastNode,

        // Загрузка данных
        loadBoardData,

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
                    // onEdgeUpdate={onEdgeUpdate}
                    onSelectionChange={onSelectionChange}
                    onNodeDragStop={onNodeDragStop}
                    onNodeDragStart={onNodeDragStart}
                    onNodeDrag={onNodeDrag}
                    onDropNewNode={handleDropNewNode}
                    onDelete={onDelete}
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
                        'У вас нет необходимых прав для выполнения этого действия.'
                    </p>
                    <p>
                        Обратитесь к владельцу доски для получения нужных прав доступа.
                    </p>
                </Modal>
            </div>
        </DragProvider>
    );
}

