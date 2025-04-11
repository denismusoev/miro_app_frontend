import React from 'react';
import { useDrag } from './nodes/DragContext';
import { Button, Tooltip } from 'antd';
import "./Toolbar.css"
import {
    FontSizeOutlined,
    BorderOutlined,
    PictureOutlined,
    EditOutlined,
    FileTextOutlined,
    AppstoreOutlined,
    FormOutlined,
    DeleteOutlined
} from '@ant-design/icons';

const Toolbar = ({ boardId, addNode, removeLastNode }) => {
    const { setType } = useDrag();

    const handleDragStart = (event, nodeType) => {
        setType(nodeType);
        event.dataTransfer.setData('application/node-type', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const buttonStyle = {
        width: '48px',
        height: '38px',
        margin: '3px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    const iconStyle = {
        fontSize: '20px'
    };

    const noHighlightStyles = `
        .toolbar-floating .ant-btn:hover,
        .toolbar-floating .ant-btn:focus,
        .toolbar-floating .ant-btn:active {
            background-color: transparent !important;
            color: inherit !important;
            outline: none !important;
            box-shadow: none !important;
        }
        
        .toolbar-floating .ant-btn-text:hover,
        .toolbar-floating .ant-btn-text:focus {
            background-color: transparent !important;
        }
    `;

    return (
        <>
            <style>{noHighlightStyles}</style>
            <div className="toolbar-floating" style={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)', 
                borderRadius: '8px', 
                padding: '6px 0',
                width: '60px'
            }}>
                {/* Текст */}
                <Tooltip title="Текст" placement="right">
                    <Button
                        type="link"
                        color="default"
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'text')}
                        icon={<FontSizeOutlined style={iconStyle} />}
                        style={buttonStyle}
                        className="toolbar-button"
                    />
                </Tooltip>

                {/* Рамка */}
                <Tooltip title="Рамка" placement="right">
                    <Button
                        type="link"
                        color="default"
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'frame')}
                        icon={<BorderOutlined style={iconStyle} />}
                        style={buttonStyle}
                        className="toolbar-button"
                    />
                </Tooltip>

                {/* Изображение */}
                <Tooltip title="Изображение" placement="right">
                    <Button
                        type="link"
                        color="default"
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'image')}
                        icon={<PictureOutlined style={iconStyle} />}
                        style={buttonStyle}
                        className="toolbar-button"
                    />
                </Tooltip>

                {/* Фигура */}
                <Tooltip title="Фигура" placement="right">
                    <Button
                        type="link"
                        color="default"
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'shape')}
                        icon={<EditOutlined style={iconStyle} />}
                        style={buttonStyle}
                        className="toolbar-button"
                    />
                </Tooltip>

                {/* Карточка */}
                <Tooltip title="Карточка" placement="right">
                    <Button
                        type="link"
                        color="default"
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'card')}
                        icon={<FileTextOutlined style={iconStyle} />}
                        style={buttonStyle}
                        className="toolbar-button"
                    />
                </Tooltip>

                {/* Приложение */}
                {/*<Tooltip title="Приложение" placement="right">*/}
                {/*    <Button*/}
                {/*        type="link"*/}
                {/*        color="default"*/}
                {/*        draggable*/}
                {/*        onDragStart={(e) => handleDragStart(e, 'app_card')}*/}
                {/*        icon={<AppstoreOutlined style={iconStyle} />}*/}
                {/*        style={buttonStyle}*/}
                {/*        className="toolbar-button"*/}
                {/*    />*/}
                {/*</Tooltip>*/}

                {/* Стикер */}
                <Tooltip title="Стикер" placement="right">
                    <Button
                        type="link"
                        color="default"
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'sticky_note')}
                        icon={<FormOutlined style={iconStyle} />}
                        style={buttonStyle}
                        className="toolbar-button"
                    />
                </Tooltip>

                {/*/!* Разделитель *!/*/}
                {/*<div className="toolbar-divider" style={{ margin: '6px 0', borderTop: '1px solid #f0f0f0', width: '80%' }}></div>*/}

                {/*/!* Удалить последний узел *!/*/}
                {/*<Tooltip title="Удалить последний" placement="right">*/}
                {/*    <Button*/}
                {/*        type="link"*/}
                {/*        color="default"*/}
                {/*        onClick={removeLastNode}*/}
                {/*        icon={<DeleteOutlined style={iconStyle} />}*/}
                {/*        style={{ ...buttonStyle, color: '#ff4d4f' }}*/}
                {/*        className="toolbar-button"*/}
                {/*    />*/}
                {/*</Tooltip>*/}
            </div>
        </>
    );
};

export default Toolbar;
