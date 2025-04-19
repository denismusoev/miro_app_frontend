


export function attachNodeHandlers(node, { updateNodeLabel, updateNodeOnServer, removeNode, disableDragging, enableDragging, updateNodeStyle, updateNodeGeometry, updateNodeData, detachNodeFromParent }) {
    return {
        ...node,
        data: {
            ...node.data,
            functions: {
                ...(node.data.functions || {}),
                onLabelChange: updateNodeLabel,
                updateNode: updateNodeOnServer,
                removeNode,
                disableDragging: () => disableDragging(node.id),
                enableDragging: () => enableDragging(node.id),
                onStyleChange: updateNodeStyle,
                onGeometryChange: updateNodeGeometry,
                onDataChange: updateNodeData,
                detachFromParent: detachNodeFromParent
            },
        },
    };
}
