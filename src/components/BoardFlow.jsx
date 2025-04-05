// components/BoardFlow.js
import React, {useCallback, useEffect, useRef, useState} from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap, useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import FloatingEdge from './FloatingEdge';
import FloatingConnectionLine from './FloatingConnectionLine';
import DevTools from "../utils/DevTools";
import { customNodeTypes } from './CustomNodes';
import {useDrag} from "./nodes/DragContext";
import {useParams} from "react-router-dom";

const edgeTypes = {
    floating: FloatingEdge,
};

const AdaptiveBackground = ({ threshold = 0.5 }) => {
    const { getZoom } = useReactFlow();
    const [lastAppliedZoom, setLastAppliedZoom] = useState(1);
    const [dynamicGap, setDynamicGap] = useState(100); // базовый размер сетки

    useEffect(() => {
        const interval = setInterval(() => {
            const currentZoom = getZoom();
            if (Math.abs(currentZoom - lastAppliedZoom) > threshold) {
                const newGap = Math.max(20, 100 / currentZoom);
                setDynamicGap(newGap);
                setLastAppliedZoom(currentZoom);
            }
        }, 150); // опрашиваем не слишком часто

        return () => clearInterval(interval);
    }, [getZoom, lastAppliedZoom, threshold]);

    return <Background variant="lines" gap={dynamicGap} size={1} />;
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
                       onDropNewNode,// новый пропс
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
            console.log("ДРОП");
            event.preventDefault();

            console.log(type);
            console.log(flowInstance);

            if (!type || !flowInstance) {
                return;
            }

            // Прямое преобразование координат экрана в координаты потока
            const dropPosition = flowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            console.log(onDropNewNode);
            if (onDropNewNode) {
                console.log("ВЫЗЫВАЕМ ФУНКЦИЮ ДОБАВЛЕНИЯ");
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
                onNodeDragStop={onNodeDragStop}  // передаем обработчик в ReactFlow
                nodeTypes={customNodeTypes}
                edgeTypes={edgeTypes}
                connectionLineComponent={FloatingConnectionLine}
                // fitView
                // defaultViewport={{ x: -containerWidth / 2, y: -containerHeight / 2, zoom: 1 }}
                defaultViewport={{ x: containerWidth, y: containerHeight, zoom: 1 }}
                snapToGrid={false}
                minZoom={0.2}  // минимальный масштаб
                maxZoom={10}
                proOptions={{ hideAttribution: true }}
                onInit={(instance) => {
                    console.log("ReactFlow instance loaded:", instance);
                    setFlowInstance(instance);
                    window.reactFlowInstance = instance;
                }}
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
