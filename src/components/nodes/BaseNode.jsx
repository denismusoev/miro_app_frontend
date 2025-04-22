import React, { useState, useCallback, useRef, useMemo, memo, useEffect } from 'react';
import {Handle, Position, NodeResizer, NodeToolbar} from '@xyflow/react';
import { throttle } from 'lodash';

// Оптимизированный с помощью memo компонент BaseNode
export const BaseNode = memo(({ id, data, selected, children, positionAbsoluteX, positionAbsoluteY, toolbarContent }) => {
  // Локальное состояние для редактирования текстового содержания
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(data.label || '');
  
  // Используем useRef для хранения ссылок на функции из data
  const functionsRef = useRef(data.functions);
  
  // Обновляем ссылку на функции при изменении data
  useMemo(() => {
    functionsRef.current = data.functions;
  }, [data.functions]);

  // Проверяем, заблокирован ли узел
  const isLocked = data.isLocked;
  const lockedBy = data.lockedBy;
  
  // Проверка, заблокирован ли узел текущим пользователем
  const isLockedByMe = isLocked && lockedBy === "me";
  // Проверка, заблокирован ли узел другим пользователем
  const isLockedByOther = isLocked && lockedBy !== "me";

  // Стили для различных состояний узла
  const lockedStyle = useMemo(() => {
    if (!isLocked) return {};
    
    // Базовые стили для заблокированного состояния
    const baseLockedStyle = {
      pointerEvents: 'none',
      opacity: 0.6,
    };
    
    // Если заблокирован другим пользователем - добавляем красную рамку
    if (isLockedByOther) {
      return {
        ...baseLockedStyle,
        border: '2px dashed #ff6b6b'
      };
    }
    
    // Если заблокирован текущим пользователем - просто базовые стили
    return baseLockedStyle;
  }, [isLocked, isLockedByMe, isLockedByOther]);

  // Стиль для выделенного узла, заблокированного другим пользователем
  const selectedLockedStyle = useMemo(() => {
    if (selected && isLockedByOther) {
      return {
        boxShadow: '0 0 0 2px #ff69b4', // Розовая рамка для выделенного заблокированного узла
        border: '2px solid #ff69b4'
      };
    }
    return {};
  }, [selected, isLockedByOther]);

  // Мемоизированный стиль для индикатора блокировки
  const lockIndicatorStyle = useMemo(() => ({
    position: 'absolute',
    top: -25,
    right: 0,
    fontSize: '10px',
    backgroundColor: isLockedByMe ? '#4caf50' : '#ff6b6b', // Зеленый для моей блокировки, красный для чужой
    color: '#fff',
    padding: '2px 6px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    display: isLocked ? 'block' : 'none',
    zIndex: 1000
  }), [isLocked, isLockedByMe]);

  // Начинаем редактирование – отключаем перетаскивание
  const startEditing = useCallback(() => {
    setIsEditing(true);
    functionsRef.current?.disableDragging?.();
  }, []);

  // Завершаем редактирование – вызываем обновление и включаем перетаскивание
  const finishEditing = useCallback(() => {
    console.log(functionsRef.current.onLabelChange);
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

  // Обработчик для открепления узла от фрейма
  const handleDetachFromParent = useCallback(() => {
    // console.log(data.functions);
    if (functionsRef.current?.detachFromParent) {
      // console.log("dsfsdf")
      functionsRef.current.detachFromParent(id);
    }
  }, [id]);

  // Обработчик изменения размеров узла с расширенным подходом для предотвращения ResizeObserver loop
  const onResize = useCallback((e, newSize) => {
    // Проверяем, подтверждена ли блокировка сервером
    if (!data.lockConfirmed) {
      console.log("Изменение размера отклонено: ждем подтверждения блокировки");
      return;
    }
    
    // Используем requestAnimationFrame для более плавного и контролируемого обновления
    // Это помогает избежать слишком быстрых обновлений DOM, которые могут вызвать цикл ResizeObserver
    requestAnimationFrame(() => {
      functionsRef.current?.onGeometryChange?.(id, {
        width: newSize.width,
        height: newSize.height,
      });
    });
  }, [id, data.lockConfirmed]);

  // Обработчики для начала и завершения изменения размера с использованием блокировок
  const handleResizeStart = useCallback(() => {
    console.log("Начало изменения размера узла", id);
    // Блокируем узел перед началом изменения размера
    functionsRef.current?.lockNode?.(id);
    
    // Отмечаем, что узел ожидает блокировки
    if (functionsRef.current?.updateNodeData) {
      functionsRef.current.updateNodeData(id, {
        waitingForLock: true
      });
    }
  }, [id]);

  const handleResizeEnd = useCallback(() => {
    console.log("Завершение изменения размера узла", id);
    
    // Проверяем, была ли подтверждена блокировка
    if (!data.lockConfirmed) {
      console.log("Завершение изменения размера отменено: не была получена блокировка");
      
      // Сбрасываем флаг ожидания блокировки
      if (functionsRef.current?.updateNodeData) {
        functionsRef.current.updateNodeData(id, {
          waitingForLock: false
        });
      }
      
      return;
    }
    
    // Сбрасываем флаги блокировки
    if (functionsRef.current?.updateNodeData) {
      functionsRef.current.updateNodeData(id, {
        waitingForLock: false,
        lockConfirmed: false
      });
    }
    
    // Разблокируем узел после изменения размера
    functionsRef.current?.unlockNode?.(id);
  }, [id, data.lockConfirmed]);

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
    opacity: 1,
    transition: 'opacity 0.2s',
  }), [selected]);

  // Форматированные координаты
  const formattedCoords = useMemo(() => {
    // Используем непосредственно данные из data.position
    if (data.position) {
      return `X: ${Math.round(positionAbsoluteX)}, Y: ${Math.round(positionAbsoluteY)}`;
    }
    return '';
  }, [data.position?.x, data.position?.y]); // Зависимость от реальных координат

  // Стандартная кнопка открепления от фрейма
  const detachButton = useMemo(() => 
    data.parentId && data.type !== 'frame' && data.type !== 'group' && (
      <button 
        onClick={handleDetachFromParent}
        className="detach-button"
        style={{
          backgroundColor: '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '4px 8px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 'bold'
        }}
      >
        Открепить от фрейма
      </button>
    ), [data.parentId, data.type, handleDetachFromParent]);


  return (
    <div 
      style={{...containerStyle, ...lockedStyle, ...selectedLockedStyle}} 
      onDoubleClick={handleDoubleClick} 
      className={`${isEditing ? 'editing' : ''} ${isLocked ? 'node--locked' : ''} ${isLockedByMe ? 'node--locked-by-me' : ''} ${isLockedByOther ? 'node--locked-by-other' : ''}`}
    >
      {/* Индикатор блокировки */}
      {isLocked && (
        <div style={lockIndicatorStyle}>
          {isLockedByOther && `Занято: ${lockedBy || 'другим пользователем'}`}
        </div>
      )}

      {/* Тулбар с заданным содержимым или стандартными кнопками */}
      <NodeToolbar
        onDoubleClick={(e) => e.stopPropagation()}
        isVisible={selected && (!isLocked || isLockedByMe)}
        position="top"
        className="bg-white rounded shadow-sm"
        style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', gap: '12px' }}
      >
        {toolbarContent}
        {data.parentId && data.type !== 'frame' && data.type !== 'group' && (
          <button 
            onClick={handleDetachFromParent}
            className="detach-button"
            style={{
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            Открепить от фрейма
          </button>
        )}
      </NodeToolbar>

      {/* Ресайзер для изменения размеров */}
      <NodeResizer
        handleStyle={{
          width: '10px',  // больше стандартного размера
          height: '10px', // больше стандартного размера
          minWidth: '10px',
          minHeight: '10px',
          // borderRadius: '50%',
          border: '2px solid #fff',
          zIndex: 10
        }}
        minHeight={40}
        minWidth={40}
        isVisible={selected && (!isLocked || isLockedByMe)}
        onResize={onResize}
        onResizeStart={handleResizeStart}
        onResizeEnd={handleResizeEnd}
        keepAspectRatio={false}
      />

      {/* Основное содержимое узла */}
      {children}

      {/* Поле для редактирования текста при двойном клике */}
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

      {/* Отображение текущих координат */}
      {formattedCoords && (
        <div style={coordsStyle}>
          {formattedCoords}
        </div>
      )}

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

function ResizeIcon() {
  return (
      <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="#ff0071"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ position: 'absolute', right: 5, bottom: 5 }}
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <polyline points="16 20 20 20 20 16" />
        <line x1="14" y1="14" x2="20" y2="20" />
        <polyline points="8 4 4 4 4 8" />
        <line x1="4" y1="4" x2="10" y2="10" />
      </svg>
  );
}

