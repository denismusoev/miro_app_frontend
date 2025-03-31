// components/BoardFlow.js
import React, {useEffect, useState} from 'react';
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
                       onNodeDragStop,  // новый пропс
                   }) => {
    const containerWidth = window.innerWidth / 2;
    const containerHeight = window.innerHeight / 2;
    return (
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
        >
            <AdaptiveBackground />
            {/*<Background variant="lines" gap={150} />*/}
            <Controls />
            <MiniMap />
            <DevTools position="top-left" />
        </ReactFlow>
    );
};

export default BoardFlow;
