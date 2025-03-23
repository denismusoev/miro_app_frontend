// BoardPageDefault.jsx
import React, { useEffect } from 'react';
import { useBoardState } from '../hooks/useBoardState';
import Toolbar from '../components/Toolbar';
import BoardFlow from '../components/BoardFlow';
import { useParams } from 'react-router-dom';

const BoardPageDefault = () => {
    const { id } = useParams();
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
        onNodeDragStop, // получаем обработчик перетаскивания
    } = useBoardState();

    useEffect(() => {
        if (id) {
            loadBoardData(id);
        }
    }, [id, loadBoardData]);

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
                onNodeDragStop={onNodeDragStop}  // передаем сюда обработчик
            />
        </div>
    );
};

export default BoardPageDefault;