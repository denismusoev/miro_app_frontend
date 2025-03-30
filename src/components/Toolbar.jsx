// components/Toolbar.jsx
import React from 'react';

const Toolbar = ({ boardId, addNode, removeLastNode }) => {
    return (
        <div style={{ padding: 10, background: '#f7f7f7' }}>
            <button onClick={() => addNode(boardId, 'text')}>Добавить текст</button>
            <button onClick={() => addNode(boardId, 'frame')}>Добавить рамку</button>
            <button onClick={() => addNode(boardId, 'image')}>Добавить изображение</button>
            <button onClick={() => addNode(boardId, 'shape')}>Добавить фигуру</button>
            <button onClick={() => addNode(boardId, 'card')}>Добавить карточку</button>
            <button onClick={() => addNode(boardId, 'app_card')}>Добавить приложение</button>
            <button onClick={() => addNode(boardId, 'sticky_note')}>Добавить стикер</button>
            <button onClick={removeLastNode}>Удалить последний узел</button>
        </div>
    );
};

export default Toolbar;
