import React, {useContext, useEffect, useState} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    fetchBoardByProjectId,
    createBoard,
    updateBoard,
    deleteBoard
} from "../utils/api";

import {
    Button,
    Container,
    Card,
    Row,
    Col,
    Modal,
    Form,
    Toast
} from "react-bootstrap";
import {ProjectContext} from "../components/ProjectProvider";

/**
 * Константы для Miro
 */
const CLIENT_ID = "3458764618211634466";
const REDIRECT_BASE = "http://localhost:3000/project"; // Ваш фронтенд URL
const BACKEND_URL = "http://localhost:8080";   // Ваш бэкенд

function ProjectPage() {
    const { projectId } = useContext(ProjectContext);
    const navigate = useNavigate();

    const [boards, setBoards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Для обычного CRUD по доскам
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentBoard, setCurrentBoard] = useState({
        name: "",
        description: "",
        projectId: projectId,
        isImported: false
    });


    // ---------- Логика для Miro ----------
    const [miroBoards, setMiroBoards] = useState([]);
    const [showMiroModal, setShowMiroModal] = useState(false);
    const [selectedBoards, setSelectedBoards] = useState([]);


    // При первом рендере грузим доски из БД
    useEffect(() => {
        loadBoards();
    }, []);

    // При возвращении с Miro (когда в URL есть ?code=xxx) загружаем доски из Miro
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const codeParam = urlParams.get("code");

        if (codeParam) {
            //console.log("Получен code из Miro:", codeParam);
            handleMiroCallback(codeParam);
            window.history.replaceState(null, "", window.location.pathname);
        }
    }, []);

    // Загрузка досок (локальных, из БД)
    const loadBoards = async () => {
        try {
            const response = await fetchBoardByProjectId(projectId);
            setBoards(response.data);
            setLoading(false);
        } catch (err) {
            setError("Ошибка загрузки данных.");
            setLoading(false);
        }
    };

    // ---------- Методы CRUD для локальных досок ----------
    const handleShowModal = (
        board = { name: "", description: "", projectId: projectId, isImported: false }
    ) => {
        setEditMode(!!board.id);
        setCurrentBoard(board);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentBoard({ name: "", description: "", projectId: projectId, isImported: false });
    };

    const handleSave = async () => {
        try {
            if (editMode) {
                await updateBoard({ id: currentBoard.id, ...currentBoard });
                setToastMessage("Доска успешно обновлена.");
            } else {
                await createBoard(projectId, currentBoard);
                setToastMessage("Доска успешно создана.");
            }
            setShowToast(true);
            handleCloseModal();
            loadBoards();
        } catch (error) {
            setToastMessage("Ошибка при сохранении доски.");
            setShowToast(true);
        }
    };

    const handleDelete = async (boardId) => {
        if (window.confirm("Вы уверены, что хотите удалить эту доску?")) {
            try {
                await deleteBoard(boardId);
                setToastMessage("Доска успешно удалена.");
                setShowToast(true);
                loadBoards();
            } catch (error) {
                setToastMessage("Ошибка при удалении доски.");
                setShowToast(true);
            }
        }
    };

    // ---------- Логика Miro: авторизация и импорт ----------

    // Берём токен юзера (если он хранится в localStorage под ключом "token")
    const getUserToken = () => {
        return localStorage.getItem("token") || "";
    };

    // 1. Нажатие на кнопку "Импорт с Miro" -> редирект на Miro OAuth
    const handleMiroLogin = () => {
        // Укажем, что после авторизации вернёмся на текущую страницу
        localStorage.setItem("currentProjectId", projectId);
        const redirectUri = `${REDIRECT_BASE}`;
        window.location.href = `https://miro.com/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${redirectUri}`;
    };

    // 2. Когда в URL есть code, вызывается этот метод:
    const handleMiroCallback = async (code) => {
        try {
            const userToken = getUserToken();
            const response = await fetch(`${BACKEND_URL}/miro/exchange-code`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${userToken}`
                },
                body: JSON.stringify({ code })
            });
            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }
            const data = await response.json();
            //console.log("Список досок от бэкенда:", data);
            setMiroBoards(data);

            // Показываем модальное окно с Miro-досками
            if (data && data.length > 0) {
                setShowMiroModal(true);
            }
        } catch (error) {
            console.error("Ошибка при получении списка досок Miro:", error);
            setToastMessage("Ошибка при загрузке досок из Miro");
            setShowToast(true);
        }
    };

    // Переключает чекбоксы выбранных досок
    const toggleBoardSelection = (boardId) => {
        setSelectedBoards((prev) => {
            if (prev.includes(boardId)) {
                return prev.filter((id) => id !== boardId);
            } else {
                return [...prev, boardId];
            }
        });
    };

    // 3. Импорт выбранных досок
    const handleImport = async () => {
        if (selectedBoards.length === 0) {
            alert("Пожалуйста, выберите хотя бы одну доску для импорта.");
            return;
        }
        try {
            const userToken = getUserToken();
            const response = await fetch(`${BACKEND_URL}/miro/import-boards`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${userToken}`
                },
                body: JSON.stringify({
                    ids: selectedBoards,
                    projectId: projectId
                })
            });
            if (!response.ok) {
                throw new Error(`Ошибка при импорте: ${response.status}`);
            }
            const data = await response.json();
            //console.log("Результат импорта досок:", data);

            alert("Импорт досок завершён успешно!");
            setShowMiroModal(false);
            setSelectedBoards([]);
            // Перезагрузим список локальных досок, вдруг импорт добавил новые
            loadBoards();
        } catch (error) {
            console.error("Ошибка при импорте досок:", error);
            alert("Произошла ошибка при импорте досок. См. консоль.");
        }
    };

    return (
        <Container className="mt-4">
            <h2 className="mb-3">📌 Список досок</h2>
            <div className="d-flex gap-2 mb-3">
                <Button variant="success" onClick={() => handleShowModal()}>
                    ➕ Создать доску
                </Button>
                <Button variant="info" onClick={handleMiroLogin}>
                    Импорт с Miro
                </Button>
            </div>

            {loading ? (
                <p className="mt-3">⏳ Загрузка...</p>
            ) : error ? (
                <p className="mt-3 text-danger">❌ {error}</p>
            ) : boards.length === 0 ? (
                <p className="mt-3">Нет доступных досок.</p>
            ) : (
                <Row className="mt-3">
                    {boards.map((board) => (
                        <Col key={board.id} md={6} lg={4} className="mb-3">
                            <Card
                                style={{ width: "100%", height: "10rem", cursor: "pointer" }}
                                onClick={() => navigate(`/board/${board.id}`)}
                            >
                                <Card.Body>
                                    <Card.Title>{board.name}</Card.Title>
                                    <Card.Text>{board.description}</Card.Text>
                                    <Button
                                        variant="warning"
                                        size="sm"
                                        className="me-2"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleShowModal(board);
                                        }}
                                    >
                                        ✏️ Редактировать
                                    </Button>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(board.id);
                                        }}
                                    >
                                        🗑 Удалить
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* Модальное окно для создания/редактирования локальной доски */}
            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>{editMode ? "Редактировать доску" : "Создать доску"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Название</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentBoard.name}
                                onChange={(e) => setCurrentBoard({ ...currentBoard, name: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Описание</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={currentBoard.description}
                                onChange={(e) => setCurrentBoard({ ...currentBoard, description: e.target.value })}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Отмена
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                        💾 Сохранить
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Модальное окно для импорта досок из Miro */}
            <Modal show={showMiroModal} onHide={() => setShowMiroModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Импорт досок из Miro</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {miroBoards.length === 0 ? (
                        <p>Нет досок для отображения.</p>
                    ) : (
                        <Row>
                            {miroBoards.map((board) => {
                                const boardIdStr = String(board.id);
                                const isChecked = selectedBoards.includes(boardIdStr);
                                return (
                                    <Col key={board.id} md={6} className="mb-3">
                                        <Card>
                                            <Card.Body>
                                                <Form.Check
                                                    type="checkbox"
                                                    id={`checkbox-${board.id}`}
                                                    label={
                                                        <>
                                                            <strong>{board.name}</strong>
                                                            <br />
                                                            <span style={{ fontSize: "0.85rem" }}>
                                ID доски: {board.id}
                              </span>
                                                        </>
                                                    }
                                                    checked={isChecked}
                                                    onChange={() => toggleBoardSelection(boardIdStr)}
                                                />
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                );
                            })}
                        </Row>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowMiroModal(false)}>
                        Закрыть
                    </Button>
                    <Button variant="primary" onClick={handleImport}>
                        Импортировать выбранные доски
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Toast уведомления */}
            <Toast
                animation
                delay={2000}
                autohide
                show={showToast}
                onClose={() => setShowToast(false)}
                style={{
                    position: "fixed",
                    bottom: 20,
                    right: 20,
                    zIndex: 9999,
                    backgroundColor: "#333",
                    color: "#fff"
                }}
            >
                <Toast.Body>{toastMessage}</Toast.Body>
            </Toast>
        </Container>
    );
}

export default ProjectPage;
