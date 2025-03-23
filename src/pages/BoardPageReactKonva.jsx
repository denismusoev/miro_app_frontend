// BoardPage.js
import React, { useRef, useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom"; // Если нужно
import { Stage, Layer, Rect, Circle, Text } from "react-konva";
import { Button } from "react-bootstrap";
import { useBoardWebSocket } from "../hooks/useBoardWebSocket";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5.0;
const SCALE_SENSITIVITY = 0.001;

// Компонент для отрисовки сетки на Layer
function Grid({ stageWidth, stageHeight, scale, offsetX, offsetY }) {
    const gridSize = 50; // Базовый шаг сетки – при scale=1
    const lines = [];

    // Вычислим размер шага относительно текущего зума
    const actualGridSize = gridSize * scale;

    // Количество вертикальных линий
    const verticalLinesCount = Math.ceil(stageWidth / actualGridSize) + 1;
    // Количество горизонтальных линий
    const horizontalLinesCount = Math.ceil(stageHeight / actualGridSize) + 1;

    // Чтобы сетка была "бесконечной", смещаем относительно offset
    // В реальных проектах можно усложнять логику, чтобы сетка центрировалась и т.п.
    for (let i = 0; i < verticalLinesCount; i++) {
        const x = Math.round(i * actualGridSize - (offsetX % actualGridSize));
        lines.push(
            <Rect
                key={`v-${i}`}
                x={x}
                y={0}
                width={1}
                height={stageHeight}
                fill="#cccccc"
                listening={false}
            />
        );
    }

    for (let j = 0; j < horizontalLinesCount; j++) {
        const y = Math.round(j * actualGridSize - (offsetY % actualGridSize));
        lines.push(
            <Rect
                key={`h-${j}`}
                x={0}
                y={y}
                width={stageWidth}
                height={1}
                fill="#cccccc"
                listening={false}
            />
        );
    }

    return <>{lines}</>;
}

export default function BoardPageReactKonva() {
    const { id } = useParams(); // при необходимости
    const token = localStorage.getItem("token");
    const { shapes, createShape, updateShape } = useBoardWebSocket(id, token);

    const stageRef = useRef(null);

    // Состояния позиции камеры (x, y) и масштаба
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [stageScale, setStageScale] = useState(1);

    // Для редактирования текста
    const [editingId, setEditingId] = useState(null);
    const [tempText, setTempText] = useState("");

    // При двойном клике начинаем редактировать
    const handleDblClick = (shape) => {
        setEditingId(shape.id);
        setTempText(shape.data?.content || "");
    };

    // Когда пользователь заканчивает редактировать текст
    const handleTextConfirm = useCallback(() => {
        if (!editingId) return;
        const shapeToUpdate = shapes.find((s) => s.id === editingId);
        if (shapeToUpdate) {
            shapeToUpdate.data.content = tempText;
            updateShape(shapeToUpdate);
        }
        setEditingId(null);
    }, [editingId, shapes, tempText, updateShape]);

    // Обработчик drag & drop фигуры
    const handleDragMove = (e, shape) => {
        const node = e.target;
        const { x, y } = node.position();

        const updated = { ...shape, position: { x, y } };
        // Сразу отправим в WebSocket (можно задать throttle)
        updateShape(updated);
    };

    // Зум колёсиком
    const handleWheel = (e) => {
        e.evt.preventDefault();
        const stage = stageRef.current;
        if (!stage) return;

        const oldScale = stageScale;
        const pointer = stage.getPointerPosition();
        // Определяем, в какую сторону крутим
        const scaleBy = 1.02;
        let newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

        if (newScale < MIN_ZOOM) newScale = MIN_ZOOM;
        if (newScale > MAX_ZOOM) newScale = MAX_ZOOM;

        // Чтобы точка под указателем "оставалась на месте" при зуме:
        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        };

        setStageScale(newScale);
        setStagePos(newPos);
    };

    // Панорамирование (зажатие правой кнопки или Shift + ЛКМ и т.п.)
    // Можно упростить и использовать встроенные Konva Draggable на Stage, но тогда аккуратнее с Drag для фигур
    // Ниже – пример, когда Stage не draggable, а мы вручную обрабатываем события
    const isPanning = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e) => {
        // Например, по правой кнопке мыши
        if (e.evt.button === 2) {
            isPanning.current = true;
            lastPos.current = { x: e.evt.clientX, y: e.evt.clientY };
        }
    };
    const handleMouseMove = (e) => {
        if (!isPanning.current) return;
        const dx = e.evt.clientX - lastPos.current.x;
        const dy = e.evt.clientY - lastPos.current.y;
        lastPos.current = { x: e.evt.clientX, y: e.evt.clientY };
        setStagePos((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    };
    const handleMouseUp = (e) => {
        if (e.evt.button === 2) {
            isPanning.current = false;
        }
    };

    // Отключим контекстное меню
    const handleContextMenu = (e) => {
        e.evt.preventDefault();
    };

    return (
        <div style={{ width: "100%", height: "100vh" }} onContextMenu={(e) => e.preventDefault()}>
            <div style={{ padding: "10px" }}>
                <h2>Доска #{id}</h2>
                <Button variant="primary" onClick={() => createShape("circle")}>Добавить круг</Button>{" "}
                <Button variant="secondary" onClick={() => createShape("square")}>Добавить квадрат</Button>{" "}
                <span>Масштаб: {stageScale.toFixed(2)}</span>
                {editingId && (
                    <div style={{ marginTop: 10 }}>
                        <input
                            value={tempText}
                            onChange={(e) => setTempText(e.target.value)}
                            onBlur={handleTextConfirm}
                            autoFocus
                        />
                    </div>
                )}
            </div>

            <Stage
                ref={stageRef}
                width={window.innerWidth}
                height={window.innerHeight - 120}
                x={stagePos.x}
                y={stagePos.y}
                scaleX={stageScale}
                scaleY={stageScale}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onContextMenu={handleContextMenu}
            >
                {/* Слой для сетки */}
                <Layer listening={false}>
                    <Grid
                        stageWidth={window.innerWidth}
                        stageHeight={window.innerHeight - 120}
                        scale={stageScale}
                        offsetX={stagePos.x}
                        offsetY={stagePos.y}
                    />
                </Layer>

                {/* Слой для фигур */}
                <Layer>
                    {shapes.map((shape) => {
                        const { id, type, position, geometry, data } = shape;
                        const { x, y } = position || { x: 0, y: 0 };
                        const { width, height, rotation = 0 } = geometry || {};

                        // Можно рисовать круг или квадрат в зависимости от type
                        if (type === "circle") {
                            return (
                                <Circle
                                    key={id}
                                    x={x}
                                    y={y}
                                    radius={width / 2} // Пусть ширина = диаметр
                                    fill="blue"
                                    rotation={rotation}
                                    draggable
                                    onDragMove={(e) => handleDragMove(e, shape)}
                                    onDblClick={() => handleDblClick(shape)}
                                    onTap={() => handleDblClick(shape)} // для мобильных
                                />
                            );
                        } else {
                            // "square" или любой другой
                            return (
                                <Rect
                                    key={id}
                                    x={x}
                                    y={y}
                                    width={width}
                                    height={height}
                                    fill="green"
                                    rotation={rotation}
                                    cornerRadius={5}
                                    draggable
                                    onDragMove={(e) => handleDragMove(e, shape)}
                                    onDblClick={() => handleDblClick(shape)}
                                    onTap={() => handleDblClick(shape)} // для мобильных
                                />
                            );
                        }
                    })}

                    {/* Дополнительно можно поверх каждой фигуры отрисовать текст */}
                    {shapes.map((shape) => {
                        const { id, type, position, geometry, data } = shape;
                        const { x, y } = position || {};
                        // Пускай текст лежит в shape.data.content
                        return (
                            <Text
                                key={`${id}-text`}
                                x={x}
                                y={y}
                                text={data?.content || ""}
                                fontSize={16}
                                fill="white"
                                offsetX={type === "circle" ? geometry.width / 2 : 0}
                                // offsetY можно настроить, чтобы текст был в центре
                                onDblClick={() => handleDblClick(shape)}
                                onTap={() => handleDblClick(shape)}
                                // Можно сделать draggable Text отдельно, если нужно
                            />
                        );
                    })}
                </Layer>
            </Stage>
        </div>
    );
}
