// components/Toolbar.jsx
import React from 'react';

const Toolbar = ({ addNode, removeLastNode }) => {
    return (
        <div style={{ padding: 10, background: '#f7f7f7' }}>
            <button onClick={() => addNode('text')}>Добавить текст</button>
            <button onClick={() => addNode('frame')}>Добавить рамку</button>
            <button onClick={() => addNode('image')}>Добавить изображение</button>
            <button onClick={() => addNode('shape')}>Добавить фигуру</button>
            <button onClick={() => addNode('card')}>Добавить карточку</button>
            <button onClick={() => addNode('app_card')}>Добавить приложение</button>
            <button onClick={() => addNode('sticky_note')}>Добавить стикер</button>
            <button onClick={removeLastNode}>Удалить последний узел</button>
        </div>
    );
};

export default Toolbar;
