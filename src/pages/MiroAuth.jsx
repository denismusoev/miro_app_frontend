import React, { useEffect, useState } from 'react';

const CLIENT_ID = '3458764618211634466';
const REDIRECT_URI = 'http://localhost:3000/miro_auth'; // тот же, что в серверном коде
// URL нашего бэкенда (замените порт, если нужно)
const BACKEND_URL = 'http://localhost:8080';

const MiroAuth = () => {
    const [boards, setBoards] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedBoards, setSelectedBoards] = useState([]); // Храним ID выбранных досок

    // Функция для получения токена пользователя (от обычной авторизации)
    const getUserToken = () => {
        // Например, токен хранится в localStorage под ключом "authToken"
        return localStorage.getItem('token') || '';
    };

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
            //console.log('Получен code:', code);
            const userToken = getUserToken();
            //console.log("userToken:", userToken);

            // Отправляем код на наш сервер вместе с токеном пользователя
            fetch(`${BACKEND_URL}/miro/exchange-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify({ code })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Ошибка сервера: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    //console.log('Список досок от бэкенда:', data);
                    setBoards(data);
                    // Показываем модальное окно, если есть доски
                    if (data && data.length > 0) {
                        setShowModal(true);
                    }
                })
                .catch(error => {
                    console.error('Ошибка при получении списка досок:', error);
                });
        }
    }, []);

    const handleLogin = () => {
        window.location.href = `https://miro.com/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;
    };

    /**
     * Переключает (добавляет/удаляет) идентификатор доски в массиве selectedBoards
     */
    const toggleBoardSelection = (boardId) => {
        setSelectedBoards(prevSelected => {
            if (prevSelected.includes(boardId)) {
                // Если уже выбран - убираем
                return prevSelected.filter(id => id !== boardId);
            } else {
                // Иначе добавляем
                return [...prevSelected, boardId];
            }
        });
    };

    /**
     * Отправляет выбранные доски на бэкенд для импорта
     */
    const handleImport = () => {
        if (selectedBoards.length === 0) {
            alert('Пожалуйста, выберите хотя бы одну доску для импорта.');
            return;
        }
        const userToken = getUserToken();
        // Пример POST-запроса на эндпоинт, который будет обрабатывать импорт
        fetch(`${BACKEND_URL}/miro/import-boards`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify(
                {
                    ids: selectedBoards,
                    projectId: "ID PROJECT",
                })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Ошибка при импорте: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                //console.log('Результат импорта досок:', data);
                alert('Импорт досок завершён успешно!');
                // Можно закрыть модальное окно, очистить выбор и т.д.
                setShowModal(false);
                setSelectedBoards([]);
            })
            .catch(error => {
                console.error('Ошибка при импорте досок:', error);
                alert('Произошла ошибка при импорте досок. См. консоль.');
            });
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>Авторизация через Miro</h1>
            <button onClick={handleLogin}>
                Войти через Miro
            </button>

            {showModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0, left: 0,
                        width: '100%', height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.5)'
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            background: '#fff',
                            padding: '20px',
                            borderRadius: '8px',
                            width: '400px'
                        }}
                    >
                        <h2>Выберите доски для импорта</h2>
                        {boards.map(board => (
                            <div
                                key={board.id}
                                style={{
                                    border: '1px solid #ccc',
                                    margin: '10px 0',
                                    padding: '10px',
                                    borderRadius: '4px'
                                }}
                            >
                                <label style={{ display: 'flex', alignItems: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedBoards.includes(String(board.id))}
                                        onChange={() => toggleBoardSelection(String(board.id))}
                                        style={{ marginRight: '8px' }}
                                    />
                                    <div>
                                        <h3>{board.name}</h3>
                                        <p><strong>ID доски:</strong> {board.id}</p>
                                        <p><strong>ID проекта:</strong> {board.projectId}</p>
                                    </div>
                                </label>
                            </div>
                        ))}

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                            <button onClick={() => setShowModal(false)}>
                                Закрыть
                            </button>
                            <button onClick={handleImport}>
                                Импортировать выбранные доски
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MiroAuth;
