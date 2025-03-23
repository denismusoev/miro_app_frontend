// Новый файл: src/api/items.js

export const createItem = async (itemCreateRq) => {
    const response = await fetch('http://localhost:8080/api/items/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemCreateRq)
    });
    if (!response.ok) {
        throw new Error('Ошибка при создании элемента');
    }
    return await response.json();
};

export const updateItem = async (itemUpdateRq) => {
    const response = await fetch('http://localhost:8080/api/items/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemUpdateRq)
    });
    if (!response.ok) {
        throw new Error('Ошибка при обновлении элемента');
    }
    return await response.json();
};

export const loadBoardItems = async (boardId) => {
    const response = await fetch(`http://localhost:8080/api/items/board/${boardId}`);
    if (!response.ok) {
        throw new Error('Ошибка загрузки данных доски');
    }
    return await response.json();
};
