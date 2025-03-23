import React, { useRef } from "react";
import Draggable from "react-draggable";

export const CircleItem = React.memo(function CircleItem({
                                                             item,
                                                             onDragStart,
                                                             onDrag,
                                                             onDragStop,
                                                             isEditing,
                                                             onDoubleClick,
                                                             onChangeText,
                                                         }) {
    const nodeRef = useRef(null);
    const xPos = item.position.x;
    const yPos = item.position.y;

    return (
        <Draggable
            nodeRef={nodeRef}
            position={{ x: xPos, y: yPos }}
            onStart={(e, data) => onDragStart(item.id, data)}
            onDrag={(e, data) => onDrag(item.id, data)}
            onStop={(e, data) => onDragStop(item.id, data)}
        >
            <div
                ref={nodeRef}
                onDoubleClick={() => onDoubleClick(item.id)}
                style={{
                    width: item.geometry.width,
                    height: item.geometry.height,
                    borderRadius: "50%",
                    position: "absolute",
                    // Дополнительно используем style.color, style.fillColor и т.п.:
                    backgroundColor: item.style?.fillColor || "blue",
                    color: item.style?.color || "white",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "grab",
                    transform: `rotate(${item.geometry.rotation || 0}deg)`,
                }}
            >
                {isEditing ? (
                    <input
                        type="text"
                        value={item.data?.content || ""}
                        onChange={(e) => onChangeText(item.id, e.target.value)}
                        onBlur={() => onDoubleClick(null)}
                        autoFocus
                        style={{
                            width: "80%",
                            height: "20px",
                            border: "none",
                            outline: "none",
                            textAlign: "center",
                            borderRadius: "5px",
                        }}
                    />
                ) : (
                    item.data?.content || "Circle"
                )}
            </div>
        </Draggable>
    );
});

// Аналогичный подход для других типов
export const StickyNoteItem = React.memo(function StickyNoteItem({
                                                                     item,
                                                                     onDragStart,
                                                                     onDrag,
                                                                     onDragStop,
                                                                     isEditing,
                                                                     onDoubleClick,
                                                                     onChangeText,
                                                                 }) {
    const nodeRef = useRef(null);
    const xPos = item.position.x;
    const yPos = item.position.y;

    return (
        <Draggable
            nodeRef={nodeRef}
            position={{ x: xPos, y: yPos }}
            onStart={(e, data) => onDragStart(item.id, data)}
            onDrag={(e, data) => onDrag(item.id, data)}
            onStop={(e, data) => onDragStop(item.id, data)}
        >
            <div
                ref={nodeRef}
                style={{
                    width: item.geometry.width,
                    height: item.geometry.height,
                    position: "absolute",
                    backgroundColor: item.style?.fillColor || "yellow",
                    color: item.style?.color || "black",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "grab",
                    transform: `rotate(${item.geometry.rotation || 0}deg)`,
                    borderRadius: "5px",
                    padding: "5px",
                }}
                onDoubleClick={() => onDoubleClick(item.id)}
            >
                {isEditing ? (
                    <textarea
                        value={item.data?.content || ""}
                        onChange={(e) => onChangeText(item.id, e.target.value)}
                        onBlur={() => onDoubleClick(null)}
                        autoFocus
                        style={{
                            width: "90%",
                            height: "60%",
                            border: "none",
                            outline: "none",
                            resize: "none",
                            background: "rgba(255, 255, 255, 0.8)",
                        }}
                    />
                ) : (
                    item.data?.content || "Sticky Note"
                )}
            </div>
        </Draggable>
    );
});