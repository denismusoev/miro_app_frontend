import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeToolbar } from 'reactflow';
import { ShapeType, StickyNoteShapeType } from '../model/Enums';

// Общий стиль для инпута редактирования
const editingInputStyle = {
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    width: '100%',
    height: '100%',
    padding: '4px',
    fontSize: 'inherit',
    fontFamily: 'inherit',
    textAlign: 'center',
};

const hexToRgba = (hex, opacity = 1) => {
    const normalizedHex = hex.replace('#', '');
    const bigint = parseInt(normalizedHex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const convertFontName = (fontFamily) => {
    if (!fontFamily) return 'Arial, sans-serif';
    return fontFamily
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};


// ---------- Узел типа TEXT (тип "text") ----------
export const TextNode = ({ id, data, xPos, yPos, selected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(data.label || '');

    const computedWidth = data.geometry?.width || 150;
    const computedHeight = data.geometry?.height || 50;

    // useEffect(() => {
    //     if (typeof selected !== 'undefined') {
    //         if (selected) {
    //             data.functions?.enableDragging && data.functions.enableDragging();
    //         } else {
    //             data.functions?.disableDragging && data.functions.disableDragging();
    //         }
    //     }
    // }, [selected, data.functions]);

    const startEditing = () => {
        setIsEditing(true);
        data.functions?.disableDragging && data.functions.disableDragging();
        console.log("===========================================================================")
    };

    const finishEditing = () => {
        data.functions?.onLabelChange && data.functions.onLabelChange(id, value);
        setIsEditing(false);
        data.functions?.enableDragging && data.functions.enableDragging();
    };

    const handleDoubleClick = () => startEditing();
    const handleBlur = () => finishEditing();
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') finishEditing();
    };

    const fillColor = data.style?.fillColor || 'transparent';
    const fillOpacity = data.style?.fillOpacity ?? 1;

    const backgroundColor = fillColor.startsWith('#')
        ? hexToRgba(fillColor, fillOpacity)
        : fillColor; // на случай, если уже rgba или название цвета

    const fontFamilyFromServer = data.style?.fontFamily; // например, "noto_sans"
    const fontFamilyCSS = convertFontName(fontFamilyFromServer); // "Noto Sans"
    // console.log(`${fontFamilyFromServer}`);
    // console.log(`${fontFamilyCSS}`);

    const containerStyle = {
        width: `${computedWidth}px`,
        height: `${computedHeight}px`,
        background: backgroundColor,
        // fontFamily: data.style?.fontFamily || 'Arial, sans-serif',
        fontFamily: `${fontFamilyCSS}`,
        fontSize: data.style?.fontSize ? `${data.style.fontSize}px` : '18px',
        textAlign: data.style?.textAlign || 'left',
        color: data.style?.color || '#000',
        padding: '4px',
        border: `2px solid ${selected ? '#6495fb' : 'transparent'}`,
    };

    return (
        <div onDoubleClick={handleDoubleClick} style={containerStyle}>
            {isEditing ? (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontFamily: `${fontFamilyCSS}`,
                        fontSize: containerStyle.fontSize,
                        color: containerStyle.color,
                        width: '100%',
                    }}
                />
            ) : (
                <div>{value}</div>
            )}
            <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                Координаты: x: {xPos?.toFixed(0)}, y: {yPos?.toFixed(0)}
            </div>
        </div>
    );
};

// ---------- Узел типа FRAME (тип "frame") ----------
export const FrameNode = ({ id, data, selected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(data.label || '');

    const computedWidth = data.geometry?.width || 300;
    const computedHeight = data.geometry?.height || 200;

    useEffect(() => {
        if (selected) {
            data.functions?.enableDragging && data.functions.enableDragging();
        } else {
            data.functions?.disableDragging && data.functions.disableDragging();
        }
    }, [selected, data.functions]);

    const startEditing = () => {
        setIsEditing(true);
        data.functions?.disableDragging && data.functions.disableDragging();
    };

    const finishEditing = () => {
        data.functions?.onLabelChange && data.functions.onLabelChange(id, value);
        setIsEditing(false);
        data.functions?.enableDragging && data.functions.enableDragging();
    };

    const handleDoubleClick = () => startEditing();
    const handleBlur = () => finishEditing();
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') finishEditing();
    };

    const containerStyle = {
        width: `${computedWidth}px`,
        height: `${computedHeight}px`,
        background: data.style?.fillColor || 'rgba(0, 0, 0, 0.02)',
        border: selected ? '2px solid #000' : '1px dashed #aaa',
        borderRadius: '6px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        ...data.style,
    };

    const labelStyle = {
        position: 'absolute',
        top: '2px',
        left: '2px',
        backgroundColor: '#fff',
        padding: '2px 4px',
        fontSize: '10px',
        color: '#555',
        borderRadius: '3px',
    };

    return (
        <div onDoubleClick={handleDoubleClick} style={containerStyle}>
            <div style={labelStyle}>Frame</div>
            {isEditing ? (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    style={editingInputStyle}
                />
            ) : (
                <>
                    <div>{value}</div>
                    {data.showContent && (
                        <div style={{ fontSize: '12px', color: '#777' }}>Content visible</div>
                    )}
                </>
            )}
            <Handle type="target" position={Position.Left} style={{ background: '#555', width: '7px', height: '7px' }} />
            <Handle type="source" position={Position.Right} style={{ background: '#555', width: '7px', height: '7px' }} />
        </div>
    );
};

// ---------- Узел типа IMAGE (тип "image") ----------
export const ImageNode = ({ id, data, selected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(data.label || '');

    const computedWidth = data.geometry?.width || 200;
    const computedHeight = data.geometry?.height || 150;

    useEffect(() => {
        if (selected) {
            data.functions?.enableDragging && data.functions.enableDragging();
        } else {
            data.functions?.disableDragging && data.functions.disableDragging();
        }
    }, [selected, data.functions]);

    const startEditing = () => {
        setIsEditing(true);
        data.functions?.disableDragging && data.functions.disableDragging();
    };

    const finishEditing = () => {
        data.functions?.onLabelChange && data.functions.onLabelChange(id, value);
        setIsEditing(false);
        data.functions?.enableDragging && data.functions.enableDragging();
    };

    const handleDoubleClick = () => startEditing();
    const handleBlur = () => finishEditing();
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') finishEditing();
    };

    const containerStyle = {
        width: `${computedWidth}px`,
        height: `${computedHeight}px`,
        backgroundColor: '#eee',
        border: selected ? '2px solid #000' : '2px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        ...data.style,
    };

    const imageStyle = {
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'cover',
    };

    const captionStyle = {
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        color: '#fff',
        fontSize: '12px',
        textAlign: 'center',
        padding: '2px 0',
        position: 'absolute',
        bottom: 0,
    };

    return (
        <div onDoubleClick={handleDoubleClick} style={containerStyle}>
            {data.imageUrl ? (
                <img src={data.imageUrl} alt={data.altText || 'Image'} style={imageStyle} />
            ) : (
                <div>No Image</div>
            )}
            {isEditing ? (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    style={editingInputStyle}
                />
            ) : (
                <div style={captionStyle}>{value}</div>
            )}
            <Handle type="target" position={Position.Left} style={{ background: '#555', width: '7px', height: '7px' }} />
            <Handle type="source" position={Position.Right} style={{ background: '#555', width: '7px', height: '7px' }} />
        </div>
    );
};

// ---------- Узел типа SHAPE (тип "shape") ----------
export const ShapeNode = ({ id, data, selected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(data.label || '');

    const computedWidth = data.geometry?.width || 120;
    const computedHeight = data.geometry?.height || 80;

    useEffect(() => {
        if (selected) {
            data.functions?.enableDragging && data.functions.enableDragging();
        } else {
            data.functions?.disableDragging && data.functions.disableDragging();
        }
    }, [selected, data.functions]);

    const startEditing = () => {
        setIsEditing(true);
        data.functions?.disableDragging && data.functions.disableDragging();
    };

    const finishEditing = () => {
        data.functions?.onLabelChange && data.functions.onLabelChange(id, value);
        setIsEditing(false);
        data.functions?.enableDragging && data.functions.enableDragging();
    };

    const handleDoubleClick = () => startEditing();
    const handleBlur = () => finishEditing();
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') finishEditing();
    };

    const baseStyle = {
        width: `${computedWidth}px`,
        height: `${computedHeight}px`,
        background: 'linear-gradient(135deg, #a8e063, #56ab2f)',
        border: '1px solid white',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        fontFamily: data.style?.fontFamily || 'Verdana, sans-serif',
        fontSize: data.style?.fontSize ? `${data.style.fontSize}px` : '13px',
        fontWeight: 'bold',
        ...data.style,
    };

    const shapeStyle =
        data.shape === ShapeType.CIRCLE
            ? { borderRadius: '50%' }
            : data.shape === ShapeType.ROUND_RECTANGLE
                ? { borderRadius: '15px' }
                : {};

    const containerStyle = {
        ...baseStyle,
        ...shapeStyle,
        border: selected ? '2px solid #000' : '2px dashed darkgreen',
    };

    return (
        <div onDoubleClick={handleDoubleClick} style={containerStyle}>
            {isEditing ? (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    style={editingInputStyle}
                />
            ) : (
                value
            )}
            <Handle type="target" position={Position.Left} style={{ background: '#555', width: '7px', height: '7px' }} />
            <Handle type="source" position={Position.Right} style={{ background: '#555', width: '7px', height: '7px' }} />
        </div>
    );
};

// ---------- Узел типа CARD (тип "card") ----------
export const CardNode = ({ id, data, selected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(data.label || '');

    const computedWidth = data.geometry?.width || 250;
    const computedHeight = data.geometry?.height || 150;

    useEffect(() => {
        if (selected) {
            data.functions?.enableDragging && data.functions.enableDragging();
        } else {
            data.functions?.disableDragging && data.functions.disableDragging();
        }
    }, [selected, data.functions]);

    const startEditing = () => {
        setIsEditing(true);
        data.functions?.disableDragging && data.functions.disableDragging();
    };

    const finishEditing = () => {
        data.functions?.onLabelChange && data.functions.onLabelChange(id, value);
        setIsEditing(false);
        data.functions?.enableDragging && data.functions.enableDragging();
    };

    const handleDoubleClick = () => startEditing();
    const handleBlur = () => finishEditing();
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') finishEditing();
    };

    const containerStyle = {
        width: `${computedWidth}px`,
        height: `${computedHeight}px`,
        background: 'linear-gradient(white, #f9f9f9)',
        border: selected ? '2px solid #000' : '2px solid #FFD700',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        fontFamily: data.style?.fontFamily || 'Helvetica, sans-serif',
        fontSize: data.style?.fontSize ? `${data.style.fontSize}px` : '16px',
        color: data.style?.color || '#333',
        ...data.style,
    };

    return (
        <div onDoubleClick={handleDoubleClick} style={containerStyle}>
            {isEditing ? (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    style={editingInputStyle}
                />
            ) : (
                <div>
                    <div style={{ fontWeight: 'bold' }}>{data.label}</div>
                    <div style={{ fontSize: '12px' }}>{data.description}</div>
                    <div style={{ fontSize: '12px', color: '#555' }}>
                        {data.dueDate ? new Date(data.dueDate).toLocaleDateString() : ''}
                    </div>
                </div>
            )}
            <Handle type="target" position={Position.Left} style={{ background: '#555', width: '7px', height: '7px' }} />
            <Handle type="source" position={Position.Right} style={{ background: '#555', width: '7px', height: '7px' }} />
            <NodeToolbar>
                <div style={{ padding: '4px', background: 'white', border: '1px solid #ccc', borderRadius: '4px' }}>
                    <button onClick={startEditing}>Переименовать</button>
                    <button onClick={() => data.functions.removeNode(id)}>Удалить</button>
                </div>
            </NodeToolbar>
        </div>
    );
};

// ---------- Узел типа APP_CARD (тип "app_card") ----------
export const AppCardNode = ({ id, data, selected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(data.label || '');

    const computedWidth = data.geometry?.width || 250;
    const computedHeight = data.geometry?.height || 150;

    useEffect(() => {
        if (selected) {
            data.functions?.enableDragging && data.functions.enableDragging();
        } else {
            data.functions?.disableDragging && data.functions.disableDragging();
        }
    }, [selected, data.functions]);

    const startEditing = () => {
        setIsEditing(true);
        data.functions?.disableDragging && data.functions.disableDragging();
    };

    const finishEditing = () => {
        data.functions?.onLabelChange && data.functions.onLabelChange(id, value);
        setIsEditing(false);
        data.functions?.enableDragging && data.functions.enableDragging();
    };

    const handleDoubleClick = () => startEditing();
    const handleBlur = () => finishEditing();
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') finishEditing();
    };

    const containerStyle = {
        width: `${computedWidth}px`,
        height: `${computedHeight}px`,
        background: 'linear-gradient(135deg, #e0f7fa, #b2ebf2)',
        border: selected ? '2px solid #000' : '2px dashed #007ACC',
        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        fontFamily: data.style?.fontFamily || 'Verdana, sans-serif',
        fontSize: data.style?.fontSize ? `${data.style.fontSize}px` : '14px',
        ...data.style,
    };

    const headerStyle = {
        padding: '4px 8px',
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderBottom: '1px solid #ccc',
        display: 'flex',
        alignItems: 'center',
        fontWeight: 'bold',
        fontSize: '16px',
        color: '#007ACC',
    };

    const footerStyle = {
        padding: '4px 8px',
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderTop: '1px solid #ccc',
        textAlign: 'right',
    };

    return (
        <div onDoubleClick={handleDoubleClick} style={containerStyle}>
            <div style={headerStyle}>
                <span style={{ marginRight: '4px' }}>📱</span> Приложение
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {isEditing ? (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        style={editingInputStyle}
                    />
                ) : (
                    data.label
                )}
            </div>
            <div style={footerStyle}>
                <div style={{ fontSize: '12px' }}>{data.description}</div>
                <div style={{ fontSize: '12px', color: '#555' }}>{data.status}</div>
            </div>
            <Handle type="target" position={Position.Left} style={{ background: '#555', width: '7px', height: '7px' }} />
            <Handle type="source" position={Position.Right} style={{ background: '#555', width: '7px', height: '7px' }} />
        </div>
    );
};

// ---------- Узел типа STICKY_NOTE (тип "sticky_note") ----------
export const StickyNoteNode = ({ id, data, selected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(data.label || '');

    const computedWidth = data.geometry?.width || 200;
    const computedHeight = data.geometry?.height || 200;

    useEffect(() => {
        if (selected) {
            data.functions?.enableDragging && data.functions.enableDragging();
        } else {
            data.functions?.disableDragging && data.functions.disableDragging();
        }
    }, [selected, data.functions]);

    const startEditing = () => {
        setIsEditing(true);
        data.functions?.disableDragging && data.functions.disableDragging();
    };

    const finishEditing = () => {
        data.functions?.onLabelChange && data.functions.onLabelChange(id, value);
        setIsEditing(false);
        data.functions?.enableDragging && data.functions.enableDragging();
    };

    const handleDoubleClick = () => startEditing();
    const handleBlur = () => finishEditing();
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') finishEditing();
    };

    const containerStyle = {
        width: `${computedWidth}px`,
        height: `${computedHeight}px`,
        backgroundColor: data.style?.fillColor || '#FFEB3B',
        border: selected ? '2px solid #000' : '2px dashed #000',
        transform: 'rotate(-3deg)',
        boxShadow: '3px 3px 7px rgba(0,0,0,0.3)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '10px',
        position: 'relative',
        fontFamily: data.style?.fontFamily || '"Comic Sans MS", cursive, sans-serif',
        fontSize: data.style?.fontSize ? `${data.style.fontSize}px` : '16px',
        ...data.style,
    };

    return (
        <div onDoubleClick={handleDoubleClick} style={containerStyle}>
            {isEditing ? (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    style={editingInputStyle}
                />
            ) : (
                value
            )}
            <Handle type="target" position={Position.Left} style={{ background: '#555', width: '7px', height: '7px' }} />
            <Handle type="source" position={Position.Right} style={{ background: '#555', width: '7px', height: '7px' }} />
        </div>
    );
};

export const customNodeTypes = {
    text: TextNode,
    frame: FrameNode,
    image: ImageNode,
    shape: ShapeNode,
    card: CardNode,
    app_card: AppCardNode,
    sticky_note: StickyNoteNode,
};
