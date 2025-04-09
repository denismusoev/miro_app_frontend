// components/BoardFlow.js
import React, {useCallback, useEffect, useRef, useState} from 'react';
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

const AdaptiveBackground = ({ threshold = 0.5 }) => {
    const { getZoom } = useReactFlow();
    const [lastAppliedZoom, setLastAppliedZoom] = useState(1);
    const [dynamicGap, setDynamicGap] = useState(70); // базовый размер сетки

    useEffect(() => {
        const interval = setInterval(() => {
            const currentZoom = getZoom();
            if (Math.abs(currentZoom - lastAppliedZoom) > threshold) {
                const newGap = Math.max(10, 70 / currentZoom);
                setDynamicGap(newGap);
                setLastAppliedZoom(currentZoom);
            }
        }, 150); // опрашиваем не слишком часто

        return () => clearInterval(interval);
    }, [getZoom, lastAppliedZoom, threshold]);

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
                       onNodeDragStart,
                       onDropNewNode,// новый пропс
                       onEdgesDelete,
                       onNodesDelete,
                   }) => {
    const containerWidth = window.innerWidth / 2;
    const containerHeight = window.innerHeight / 2;

    const { id } = useParams();

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

            //console.log(onDropNewNode);
            if (onDropNewNode) {
                //console.log("ВЫЗЫВАЕМ ФУНКЦИЮ ДОБАВЛЕНИЯ");
                onDropNewNode(type, dropPosition);
            }
            setType(null);
        },
        [type, flowInstance, onDropNewNode, setType]
    );


    return (
        <div
            className="boardflow-wrapper"
            ref={reactFlowWrapper}
            onDragOver={onDragOver}
            onDrop={onDrop}
            style={{ width: '100%', height: '100%' }}
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onEdgeUpdate={onEdgeUpdate}
                onSelectionChange={onSelectionChange}
                onEdgesDelete={onEdgesDelete}
                onNodesDelete={onNodesDelete}
                // onNodeDragStop={onNodeDragStop}  // передаем обработчик в ReactFlow
                onNodeDrag={onNodeDragStop}  // передаем обработчик в ReactFlow
                // onNodeDragStart={onNodeDragStart}
                nodeTypes={customNodeTypes}
                edgeTypes={edgeTypes}
                connectionLineComponent={FloatingConnectionLine}
                selectNodesOnDrag={true}
                elevateNodesOnSelect={true}
                elevateEdgesOnSelect={true}
                deleteKeyCode={['Delete', 'Backspace']}  // Разрешаем удаление по клавишам Delete и Backspace
                style={{ backgroundColor: '#f2f2f2' }}
                fitView
                // defaultViewport={{ x: containerWidth, y: containerHeight, zoom: 1 }}
                snapToGrid={true}
                minZoom={0.2}  // минимальный масштаб
                maxZoom={10}
                proOptions={{ hideAttribution: true }}
                onInit={(instance) => {
                    //console.log("ReactFlow instance loaded:", instance);
                    setFlowInstance(instance);
                    window.reactFlowInstance = instance;
                }}
                panOnDrag={[2]}
                zoomOnDoubleClick={false}
            >

                {/*<DevTools position="bottom-right" />*/}
                <AdaptiveBackground />
                {/*<Background variant="lines" gap={150} />*/}
                <Controls />
                <MiniMap />
            </ReactFlow>
        </div>
    );
};

export default BoardFlow;
