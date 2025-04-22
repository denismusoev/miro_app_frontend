// components/BoardFlow.js
import React, {useCallback, useEffect, useRef, useState, useMemo} from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap, useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import FloatingEdge from './FloatingEdge';
import FloatingConnectionLine from './FloatingConnectionLine';
import { customNodeTypes } from './nodes/CustomNodes';
// import { ShapeNode } from './nodes/ShapeNode';
import {useDrag} from "./nodes/DragContext";
import {useParams} from "react-router-dom";
import './BoardFlow.css'

const edgeTypes = {
    floating: FloatingEdge,
};

// Базовый размер квадрата сетки при зуме = 1
const BASE_GRID_GAP = 70;

const AdaptiveBackground = ({ threshold = 0.5, onGapChange }) => {
    const { getZoom } = useReactFlow();
    const [lastAppliedZoom, setLastAppliedZoom] = useState(1);
    const [dynamicGap, setDynamicGap] = useState(BASE_GRID_GAP); // базовый размер сетки

    useEffect(() => {
        const interval = setInterval(() => {
            const currentZoom = getZoom();
            if (Math.abs(currentZoom - lastAppliedZoom) > threshold) {
                const newGap = Math.max(10, BASE_GRID_GAP / currentZoom);
                setDynamicGap(newGap);
                setLastAppliedZoom(currentZoom);
                
                // Сообщаем родительскому компоненту о новом размере сетки
                if (onGapChange) {
                    onGapChange(newGap, currentZoom);
                }
            }
        }, 150); // опрашиваем не слишком часто

        return () => clearInterval(interval);
    }, [getZoom, lastAppliedZoom, threshold, onGapChange]);

    return <Background variant="lines" gap={dynamicGap} size={2} color="#e2e2e2" />;
};

const BoardFlow = ({
                       nodes,
                       edges,
                       onNodesChange,
                       onEdgesChange,
                       onConnect,
                       onEdgeUpdate,
                       onSelectionChange,
                       onNodeDragStop,
                       onNodeDrag,
                       onNodeDragStart,
                       onDropNewNode,// новый пропс
                       onEdgesDelete,
                       onNodesDelete,
                   }) => {

    // Добавляем состояние для отслеживания шага сетки и текущего зума
    // const [gridGap, setGridGap] = useState(BASE_GRID_GAP);
    // const [currentZoom, setCurrentZoom] = useState(1);
    // Вычисляем шаг привязки как 1/10 от размера сетки
    const [snapGrid, setSnapGrid] = useState([BASE_GRID_GAP / 10, BASE_GRID_GAP / 10]);

    // Обработчик изменения размера сетки
    const handleGapChange = useCallback((newGap, newZoom) => {
        // setGridGap(newGap);
        // setCurrentZoom(newZoom);
        // Устанавливаем шаг привязки как 1/10 от размера сетки
        const snapStep = Math.max(1, Math.round(newGap / 10));
        setSnapGrid([snapStep, snapStep]);
    }, []);

    const reactFlowWrapper = useRef(null);
    const [flowInstance, setFlowInstance] = useState(null);
    const { type, setType } = useDrag();

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event) => {
            //console.log("ДРОП");
            event.preventDefault();

            //console.log(type);
            //console.log(flowInstance);

            if (!type || !flowInstance) {
                return;
            }

            // Прямое преобразование координат экрана в координаты потока
            const dropPosition = flowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            // Привязка позиции к сетке
            const snapPosition = {
                x: Math.round(dropPosition.x / snapGrid[0]) * snapGrid[0],
                y: Math.round(dropPosition.y / snapGrid[1]) * snapGrid[1]
            };

            //console.log(onDropNewNode);
            if (onDropNewNode) {
                //console.log("ВЫЗЫВАЕМ ФУНКЦИЮ ДОБАВЛЕНИЯ");
                onDropNewNode(type, snapPosition);
            }
            setType(null);
        },
        [type, flowInstance, onDropNewNode, setType, snapGrid]
    );

    // Оптимизируем создание конфигурации для ReactFlow
    const reactFlowConfig = useMemo(() => ({
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        onEdgeUpdate,
        onSelectionChange,
        onEdgesDelete,
        onNodesDelete,
        onNodeDrag: onNodeDrag,
        onNodeDragStop: onNodeDragStop,
        onNodeDragStart: onNodeDragStart,
        nodeTypes: customNodeTypes,
        edgeTypes,
        connectionLineComponent: FloatingConnectionLine,
        selectNodesOnDrag: true,
        elevateNodesOnSelect: true,
        elevateEdgesOnSelect: true,
        deleteKeyCode: ['Delete', 'Backspace'],
        style: { backgroundColor: '#f2f2f2' },
        fitView: true,
        snapToGrid: false,
        // nodeOrigin: [0,5, 0,5],
        snapGrid,
        minZoom: 0.2,
        maxZoom: 10,
        proOptions: { hideAttribution: true },
        panOnDrag: [2],
        zoomOnDoubleClick: false,
    }), [
        nodes, 
        edges, 
        onNodesChange, 
        onEdgesChange, 
        onConnect, 
        onEdgeUpdate, 
        onSelectionChange, 
        onEdgesDelete, 
        onNodesDelete, 
        onNodeDragStop, 
        snapGrid
    ]);

    return (
        <div
            className="boardflow-wrapper"
            ref={reactFlowWrapper}
            onDragOver={onDragOver}
            onDrop={onDrop}
            style={{ width: '100%', height: '100%' }}
        >
            <ReactFlow
                {...reactFlowConfig}
                onInit={(instance) => {
                    setFlowInstance(instance);
                    window.reactFlowInstance = instance;
                    
                    const initialZoom = instance.getZoom();
                    const initialGap = Math.max(10, BASE_GRID_GAP / initialZoom);
                    const initialSnapStep = Math.max(1, Math.round(initialGap / 10));
                    setSnapGrid([initialSnapStep, initialSnapStep]);
                    // setCurrentZoom(initialZoom);
                    // setGridGap(initialGap);
                }}
            >
                <AdaptiveBackground onGapChange={handleGapChange} />
                <Controls />
                <MiniMap />
            </ReactFlow>
        </div>
    );
};

export default BoardFlow;
