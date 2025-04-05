import React from 'react';
import { useDrag } from './nodes/DragContext';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import "./Toolbar.css"
import {
    FiType,
    FiSquare,
    FiImage,
    FiPenTool,
    FiFileText,
    FiGrid,
    FiClipboard,
    FiTrash2,
} from 'react-icons/fi';

const Toolbar = ({ boardId, addNode, removeLastNode }) => {
    const { setType } = useDrag();

    const handleDragStart = (event, nodeType) => {
        setType(nodeType);
        event.dataTransfer.setData('application/node-type', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const renderTooltip = (props, text) => (
        <Tooltip id="toolbar-tooltip" {...props}>
            {text}
        </Tooltip>
    );

    return (
        <div className="toolbar-floating">
            {/* Текст */}
            <OverlayTrigger placement="bottom" overlay={(props) => renderTooltip(props, 'Text')}>
                <Button
                    variant="light"
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'text')}
                    style={{ border: 'none', background: 'transparent' }}
                >
                    <FiType size={24} />
                </Button>
            </OverlayTrigger>

            {/* Рамка */}
            <OverlayTrigger placement="bottom" overlay={(props) => renderTooltip(props, 'Frame')}>
                <Button
                    variant="light"
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'frame')}
                    style={{ border: 'none', background: 'transparent' }}
                >
                    <FiSquare size={24} />
                </Button>
            </OverlayTrigger>

            {/* Изображение */}
            <OverlayTrigger placement="bottom" overlay={(props) => renderTooltip(props, 'Image')}>
                <Button
                    variant="light"
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'image')}
                    style={{ border: 'none', background: 'transparent' }}
                >
                    <FiImage size={24} />
                </Button>
            </OverlayTrigger>

            {/* Фигура */}
            <OverlayTrigger placement="bottom" overlay={(props) => renderTooltip(props, 'Shape')}>
                <Button
                    variant="light"
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'shape')}
                    style={{ border: 'none', background: 'transparent' }}
                >
                    <FiPenTool size={24} />
                </Button>
            </OverlayTrigger>

            {/* Карточка */}
            <OverlayTrigger placement="bottom" overlay={(props) => renderTooltip(props, 'Card')}>
                <Button
                    variant="light"
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'card')}
                    style={{ border: 'none', background: 'transparent' }}
                >
                    <FiFileText size={24} />
                </Button>
            </OverlayTrigger>

            {/* Приложение */}
            <OverlayTrigger placement="bottom" overlay={(props) => renderTooltip(props, 'App')}>
                <Button
                    variant="light"
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'app_card')}
                    style={{ border: 'none', background: 'transparent' }}
                >
                    <FiGrid size={24} />
                </Button>
            </OverlayTrigger>

            {/* Стикер */}
            <OverlayTrigger placement="bottom" overlay={(props) => renderTooltip(props, 'Sticky Note')}>
                <Button
                    variant="light"
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'sticky_note')}
                    style={{ border: 'none', background: 'transparent' }}
                >
                    <FiClipboard size={24} />
                </Button>
            </OverlayTrigger>

            {/* Удалить последний узел */}
            <OverlayTrigger placement="bottom" overlay={(props) => renderTooltip(props, 'Delete Last')}>
                <Button
                    variant="light"
                    onClick={removeLastNode}
                    style={{ border: 'none', background: 'transparent' }}
                >
                    <FiTrash2 size={24} color="red" />
                </Button>
            </OverlayTrigger>
        </div>
    );
};

export default Toolbar;
