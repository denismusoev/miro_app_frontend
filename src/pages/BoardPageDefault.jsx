// src/pages/BoardPageDefault.jsx
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
import { Alert, Button, Space, Modal } from 'antd';

export default function BoardPageDefault() {
    const { id } = useParams();
    const navigate = useNavigate();
    const boardStateRef = useRef(null);
    
    // Состояние для модального окна с ошибкой доступа
    const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
    const [accessError, setAccessError] = useState(null);
    
    // Инициализируем хук обработки ошибок WebSocket с дополнительным обработчиком
    const { handleError, errors, isPermissionError } = useWebSocketErrors(false, (error) => {
        // Если ошибка связана с правами доступа, показываем модальное окно
        if (error.isPermissionError) {
            setAccessError(error);
            setShowAccessDeniedModal(true);
        }
    });

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

    // Подключаемся к WebSocket через наш обновленный хук с поддержкой обработки ошибок
    const { stompClient, connected, publish } = useBoardWebSocket(id, handleMessage, handleError);

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
    }, [connected, id, loadBoardData, loadConnectorData]);

    const handleDropNewNode = (nodeType, position) => {
        createNewNode(id, nodeType, position);
    };
    
    // Обработчик возврата к списку досок
    const handleBackToBoards = useCallback(() => {
        navigate('/project');
    }, [navigate]);

    return (
        <DragProvider>
            <div className="board-page-container">
                <BoardPermissions boardId={id} />
                
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
                
                <ExportButton />
                
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

