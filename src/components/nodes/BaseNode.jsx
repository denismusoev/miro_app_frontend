import React, { useState } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';

export const BaseNode = ({ id, data, selected, children }) => {
  // Локальное состояние для редактирования текстового содержания
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(data.label || '');

  // Начинаем редактирование – отключаем перетаскивание
  const startEditing = () => {
    setIsEditing(true);
    data.functions?.disableDragging?.();
  };

  // Завершаем редактирование – вызываем обновление и включаем перетаскивание
  const finishEditing = () => {
    data.functions?.onLabelChange?.(id, value);
    setIsEditing(false);
    data.functions?.enableDragging?.();
  };

  const handleDoubleClick = () => startEditing();
  const handleBlur = () => finishEditing();
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      finishEditing();
    }
  };

  // Обработчик изменения размеров узла
  const onResize = (e, newSize) => {
    data.functions?.onGeometryChange?.(id, {
      width: newSize.width,
      height: newSize.height,
    });
  };

  // Контейнер узла – задаём размеры из geometry (либо значения по умолчанию)
  const containerStyle = {
    width: data.geometry?.width || 120,
    height: data.geometry?.height || 80,
    position: 'relative', // необходимо для абсолютного позиционирования input
  };

  // Стили для поля ввода, которые позволяют разместить его по центру контейнера,
  // сделать фон прозрачным и убрать рамки.
  const inputStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80%',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    textAlign: 'center',
    padding: 0,
    margin: 0,
    fontFamily: data.style?.fontFamily || 'inherit',
    fontSize: data.style?.fontSize ? `${data.style.fontSize}px` : 'inherit',
    color: data.style?.color || 'inherit',
  };

  return (
    <div style={containerStyle} onDoubleClick={handleDoubleClick} className={isEditing ? 'editing' : ''}>
      {/* Блок-обёртка для ресайзера (занимает всю область узла) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <NodeResizer
          lineStyle={{ borderWidth: '1px' }}
          color="rgba(59,130,246)"
          isVisible={selected}
          onResize={onResize}
          keepAspectRatio={false}
        />
      </div>

      {/* Основное содержимое узла (например, отрисовка фигуры, текст и т.п.) */}
      {children}

      {/* Если редактирование включено, отображаем поле ввода поверх содержимого */}
      {isEditing && (
        <input
          type="text"
          value={value}
          autoFocus
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={inputStyle}
        />
      )}

      {/* Хендлы для соединения узлов */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: selected ? '#3b82f6' : 'transparent',
          width: selected ? 10 : 7,
          height: selected ? 10 : 7,
          border: selected ? '2px solid #fff' : 'none',
          boxShadow: selected ? '0 2px 4px rgba(0, 0, 0, 0.15)' : 'none',
          opacity: selected ? 1 : 0,
          pointerEvents: selected ? 'auto' : 'none',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: selected ? '#3b82f6' : 'transparent',
          width: selected ? 10 : 7,
          height: selected ? 10 : 7,
          border: selected ? '2px solid #fff' : 'none',
          boxShadow: selected ? '0 2px 4px rgba(0, 0, 0, 0.15)' : 'none',
          opacity: selected ? 1 : 0,
          pointerEvents: selected ? 'auto' : 'none',
        }}
      />
    </div>
  );
};

export default BaseNode;
