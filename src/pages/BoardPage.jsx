import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import { useBoardItems } from "./hooks/useBoardItems";
import { ItemRenderer } from "./ItemTypes/ItemRenderer"; // пример общего рендера
import { useThrottle } from "./hooks/useThrottle";
import Draggable from "react-draggable";

// Параметры масштабирования
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5.0;
const SCALE_SENSITIVITY = 0.0002;

// "Бесконечная" виртуальная доска
const BOARD_WIDTH = 100000;
const BOARD_HEIGHT = 100000;

function BoardPage() {
    const { id: boardId } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    // Подключаем наш кастомный хук
    const { items, createItem, updateItem } = useBoardItems(boardId, token);

    // Локальное состояние для ID элемента, который сейчас «редактируется»
    const [editingId, setEditingId] = useState(null);

    // При перетаскивании мы можем хранить промежуточные позиции, если нужно
    const [localPositions, setLocalPositions] = useState({});

    // Состояния для зума и панорамирования
    const [zoom, setZoom] = useState(1.0);
    const [translate, setTranslate] = useState({ x: 0, y: 0 });

    // refs для pan
    const isPanningRef = useRef(false);
    const lastPanPointRef = useRef({ x: 0, y: 0 });

    // ref контейнера доски
    const boardContainerRef = useRef(null);
    // ref для canvas сетки
    const gridCanvasRef = useRef(null);

    // Храним размер контейнера, чтобы рисовать сетку
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    useEffect(() => {
        const updateSize = () => {
            if (boardContainerRef.current) {
                setContainerSize({
                    width: boardContainerRef.current.clientWidth,
                    height: boardContainerRef.current.clientHeight,
                });
            }
        };
        updateSize();
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
    }, []);

    // Рисуем сетку на canvas в зависимости от zoom, translate
    useEffect(() => {
        const canvas = gridCanvasRef.current;
        if (!canvas) return;
        canvas.width = containerSize.width;
        canvas.height = containerSize.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const getGridSize = (z) => {
            if (z <= 0.5) return 200;
            if (z >= 2.5) return 20;
            return 50;
        };
        const cellSize = getGridSize(zoom);
        const x0 = -translate.x / zoom;
        const y0 = -translate.y / zoom;
        const x1 = (canvas.width - translate.x) / zoom;
        const y1 = (canvas.height - translate.y) / zoom;

        ctx.beginPath();
        ctx.strokeStyle = "#ccc";
        ctx.lineWidth = 1;

        const startX = Math.floor(x0 / cellSize) * cellSize;
        for (let x = startX; x <= x1; x += cellSize) {
            const screenX = x * zoom + translate.x;
            ctx.moveTo(screenX, 0);
            ctx.lineTo(screenX, canvas.height);
        }
        const startY = Math.floor(y0 / cellSize) * cellSize;
        for (let y = startY; y <= y1; y += cellSize) {
            const screenY = y * zoom + translate.y;
            ctx.moveTo(0, screenY);
            ctx.lineTo(canvas.width, screenY);
        }
        ctx.stroke();
    }, [translate, zoom, containerSize]);

    // Чтобы реже отправлять обновления на сервер при перетаскивании
    const THROTTLE_DELAY = 10;
    const throttledSendPosition = useThrottle((itemId, x, y) => {
        // Находим элемент и отправляем обновление
        const item = items.find((i) => i.id === itemId);
        if (item) {
            const updatedItem = {
                ...item,
                position: { ...item.position, x, y },
            };
            updateItem(updatedItem);
        }
    }, THROTTLE_DELAY);

    // Методы драг-н-дропа
    const handleDragStart = useCallback((itemId, data) => {
        setLocalPositions((prev) => {
            if (prev[itemId]) return prev;
            return { ...prev, [itemId]: { x: data.x, y: data.y } };
        });
    }, []);

    const handleDrag = useCallback(
        (itemId, data) => {
            setLocalPositions((prev) => ({
                ...prev,
                [itemId]: { x: data.x, y: data.y },
            }));
            throttledSendPosition(itemId, data.x, data.y);
        },
        [throttledSendPosition]
    );

    const handleDragStop = useCallback(
        (itemId, data) => {
            const item = items.find((i) => i.id === itemId);
            if (item) {
                const updatedItem = {
                    ...item,
                    position: { ...item.position, x: data.x, y: data.y },
                };
                updateItem(updatedItem);
            }
            setLocalPositions((prev) => {
                const newObj = { ...prev };
                delete newObj[itemId];
                return newObj;
            });
        },
        [updateItem, items]
    );

    // Редактирование текста (content) у элемента
    const handleDoubleClick = useCallback((id) => {
        setEditingId((prev) => (prev === id ? null : id));
    }, []);

    const handleChangeText = useCallback(
        (itemId, text) => {
            const item = items.find((i) => i.id === itemId);
            if (item) {
                const updatedItem = {
                    ...item,
                    data: { ...item.data, content: text },
                };
                updateItem(updatedItem);
            }
        },
        [items, updateItem]
    );

    // Панорамирование (нажатие правой кнопкой мыши)
    const handlePointerDown = useCallback((e) => {
        if (e.button === 2) {
            isPanningRef.current = true;
            lastPanPointRef.current = { x: e.clientX, y: e.clientY };
            e.preventDefault();
        }
    }, []);

    const handlePointerMove = useCallback((e) => {
        if (!isPanningRef.current) return;
        e.preventDefault();
        const dx = e.clientX - lastPanPointRef.current.x;
        const dy = e.clientY - lastPanPointRef.current.y;
        lastPanPointRef.current = { x: e.clientX, y: e.clientY };
        setTranslate((prev) => ({
            x: prev.x + dx,
            y: prev.y + dy,
        }));
    }, []);

    const handlePointerUp = useCallback((e) => {
        if (e.button === 2 && isPanningRef.current) {
            isPanningRef.current = false;
            e.preventDefault();
        }
    }, []);

    // Масштабирование колёсиком
    const handleWheel = useCallback(
        (e) => {
            e.preventDefault();
            let newZoom = zoom - e.deltaY * SCALE_SENSITIVITY;
            if (newZoom < MIN_ZOOM) newZoom = MIN_ZOOM;
            if (newZoom > MAX_ZOOM) newZoom = MAX_ZOOM;
            setZoom(newZoom);
        },
        [zoom]
    );

    // Стили
    const boardContainerStyle = useMemo(
        () => ({
            width: "100%",
            height: "calc(100vh - 150px)",
            overflow: "hidden",
            position: "relative",
            border: "1px dashed #ddd",
            backgroundColor: "#f9f9f9",
        }),
        []
    );

    const boardStyle = useMemo(
        () => ({
            width: BOARD_WIDTH * 10000,
            height: BOARD_HEIGHT * 10000,
            position: "absolute",
            top: 0,
            left: 0,
            transformOrigin: "top left",
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${zoom})`,
        }),
        [translate, zoom]
    );

    return (
        <div onContextMenu={(e) => e.preventDefault()}>
            <div style={{ height: "120px" }}>
                <h2 className="my-4 text-center">Доска #{boardId}</h2>
                <div className="d-flex gap-3 mb-3">
                    <Button variant="primary" onClick={() => createItem("circle")}>
                        Добавить круг
                    </Button>
                    <Button variant="secondary" onClick={() => createItem("sticky_note")}>
                        Добавить стикер
                    </Button>
                    <div style={{ fontSize: "1.2rem" }}>
                        Текущий масштаб: {zoom.toFixed(2)}
                    </div>
                </div>
            </div>

            <div
                ref={boardContainerRef}
                style={boardContainerStyle}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onWheel={handleWheel}
            >
                <canvas
                    ref={gridCanvasRef}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        pointerEvents: "none",
                        zIndex: 0,
                    }}
                />
                <div style={{ ...boardStyle, zIndex: 1 }}>
                    {items.map((item) => (
                        <ItemRenderer
                            key={item.id}
                            item={item}
                            isEditing={editingId === item.id}
                            onDoubleClick={handleDoubleClick}
                            onChangeText={handleChangeText}
                            onDragStart={handleDragStart}
                            onDrag={handleDrag}
                            onDragStop={handleDragStop}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default BoardPage;
