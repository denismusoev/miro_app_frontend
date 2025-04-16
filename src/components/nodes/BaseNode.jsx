import React, { useState, useCallback, useRef, useMemo, memo, useEffect } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { throttle } from 'lodash';

// Оптимизированный с помощью memo компонент BaseNode
export const BaseNode = memo(({ id, data, selected, children, positionAbsoluteX, positionAbsoluteY }) => {
  // Локальное состояние для редактирования текстового содержания
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(data.label || '');
  
  // Используем useRef для хранения ссылок на функции из data
  const functionsRef = useRef(data.functions);
  
  // Обновляем ссылку на функции при изменении data
  useMemo(() => {
    functionsRef.current = data.functions;
  }, [data.functions]);

  // Начинаем редактирование – отключаем перетаскивание
  const startEditing = useCallback(() => {
    setIsEditing(true);
    functionsRef.current?.disableDragging?.();
  }, []);

  // Завершаем редактирование – вызываем обновление и включаем перетаскивание
  const finishEditing = useCallback(() => {
    functionsRef.current?.onLabelChange?.(id, value);
    setIsEditing(false);
    functionsRef.current?.enableDragging?.();
  }, [id, value]);

  const handleDoubleClick = useCallback(() => startEditing(), [startEditing]);
  
  const handleBlur = useCallback(() => finishEditing(), [finishEditing]);
  
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      finishEditing();
    }
  }, [finishEditing]);
  
  const handleChange = useCallback((e) => setValue(e.target.value), []);

  // Обработчик изменения размеров узла с расширенным подходом для предотвращения ResizeObserver loop
  const handleRawResize = useCallback((e, newSize) => {
    // Используем requestAnimationFrame для более плавного и контролируемого обновления
    // Это помогает избежать слишком быстрых обновлений DOM, которые могут вызвать цикл ResizeObserver
    requestAnimationFrame(() => {
      functionsRef.current?.onGeometryChange?.(id, {
        width: newSize.width,
        height: newSize.height,
      });
    });
  }, [id]);

  // Создаем throttled-версию обработчика с более высокой задержкой для надежного предотвращения циклов
  const onResize = useMemo(() => 
    throttle(handleRawResize, 25),  // 25ms throttle - лучший баланс для предотвращения ResizeObserver loop
    [handleRawResize]
  );

  // Очистка throttled функции при размонтировании компонента
  useEffect(() => {
    return () => {
      // Отменяем все ожидающие вызовы при размонтировании
      onResize.cancel && onResize.cancel();
    };
  }, [onResize]);

  // Мемоизированные стили
  const containerStyle = useMemo(() => ({
    width: data.geometry?.width || 120,
    height: data.geometry?.height || 80,
    position: 'relative', // необходимо для абсолютного позиционирования input
  }), [data.geometry?.width, data.geometry?.height]);

  // Мемоизированные стили для поля ввода
  const inputStyle = useMemo(() => ({
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
  }), [data.style?.fontFamily, data.style?.fontSize, data.style?.color]);

  // Мемоизированные стили для обёртки ресайзера
  const resizerWrapperStyle = useMemo(() => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }), []);

  // Мемоизированные стили для хендлов
  const handleStyle = useMemo(() => ({
    background: selected ? '#3b82f6' : 'transparent',
    width: selected ? 10 : 7,
    height: selected ? 10 : 7,
    border: selected ? '2px solid #fff' : 'none',
    boxShadow: selected ? '0 2px 4px rgba(0, 0, 0, 0.15)' : 'none',
    opacity: selected ? 1 : 0,
    pointerEvents: selected ? 'auto' : 'none',
  }), [selected]);

  // Мемоизированный стиль для отображения координат
  const coordsStyle = useMemo(() => ({
    position: 'absolute',
    bottom: -20,
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: '#fff',
    padding: '1px 4px',
    borderRadius: '2px',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    opacity: selected ? 1 : 0,
    transition: 'opacity 0.2s',
  }), [selected]);

  // Форматированные координаты
  const formattedCoords = useMemo(() => {
    if (positionAbsoluteX !== undefined && positionAbsoluteY !== undefined) {
      return `X: ${Math.round(positionAbsoluteX)}, Y: ${Math.round(positionAbsoluteY)}`;
    }
    return '';
  }, [positionAbsoluteX, positionAbsoluteY]);

  return (
    <div style={containerStyle} onDoubleClick={handleDoubleClick} className={isEditing ? 'editing' : ''}>
      {/* Блок-обёртка для ресайзера (занимает всю область узла) */}
      <div style={resizerWrapperStyle}>
        <NodeResizer
          minHeight={40}
          minWidth={40}
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
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={inputStyle}
        />
      )}

      {/* Отображение координат */}
      {formattedCoords && (
        <div style={coordsStyle}>
          {formattedCoords}
        </div>
      )}

      {/* Хендлы для соединения узлов */}
      <Handle
        type="target"
        position={Position.Left}
        style={handleStyle}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={handleStyle}
      />
    </div>
  );
});

export default BaseNode;
