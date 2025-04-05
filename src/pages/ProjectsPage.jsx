import React, { useContext, useEffect, useState } from "react";
import {
    fetchAccessibleProjects,
    createProject,
    updateProject,
    deleteProject,
    createInvite,
    getInvite,
    updateInvite,
    deactivateInvite
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
import { useNavigate } from "react-router-dom";
import { ProjectContext } from "../components/ProjectProvider";

function ProjectsPage() {
    const { setProjectId } = useContext(ProjectContext);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    // Используем только поля, необходимые для DTO (name и description, id для обновления)
    const [currentProject, setCurrentProject] = useState({ id: null, name: "", description: "" });

    // Состояния для модального окна приглашения
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteProject, setInviteProject] = useState(null);
    const [inviteForm, setInviteForm] = useState({
        role: "WRITE", // по умолчанию
        expiresAt: "",
        maxUsages: ""
    });
    const [activeInvite, setActiveInvite] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const response = await fetchAccessibleProjects();
            // Предполагается, что бек возвращает массив DTO ProjectRs с нужными полями
            setProjects(response.data);
            setLoading(false);
        } catch (err) {
            setError("Ошибка загрузки данных.");
            setLoading(false);
        }
    };

    const handleShowModal = (project = { id: null, name: "", description: "" }) => {
        setEditMode(!!project.id);
        setCurrentProject(project);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentProject({ id: null, name: "", description: "" });
    };

    const handleSave = async () => {
        try {
            if (editMode) {
                // Отправляем только id, name и description для обновления
                await updateProject({
                    id: currentProject.id,
                    name: currentProject.name,
                    description: currentProject.description
                });
                setToastMessage("Проект успешно обновлён.");
            } else {
                // Для создания отправляем только name и description
                await createProject({
                    name: currentProject.name,
                    description: currentProject.description
                });
                setToastMessage("Проект успешно создан.");
            }
            setShowToast(true);
            handleCloseModal();
            loadProjects();
        } catch (error) {
            setToastMessage("Ошибка при сохранении проекта.");
            setShowToast(true);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Вы уверены, что хотите удалить этот проект?")) {
            try {
                await deleteProject(id);
                setToastMessage("Проект успешно удалён.");
                setShowToast(true);
                loadProjects();
            } catch (error) {
                setToastMessage("Ошибка при удалении проекта.");
                setShowToast(true);
            }
        }
    };

    // Модальное окно приглашения (логика без изменений)
    const handleShowInviteModal = async (project) => {
        setInviteProject(project);
        setInviteForm({
            role: "WRITE",
            expiresAt: "",
            maxUsages: ""
        });
        try {
            const response = await getInvite({ projectId: project.id, role: "WRITE" });
            if (response.data) {
                setActiveInvite(response.data);
                setInviteForm({
                    role: response.data.role,
                    expiresAt: response.data.expiresAt ? response.data.expiresAt.substring(0, 16) : "",
                    maxUsages: response.data.maxUsages || ""
                });
            } else {
                setActiveInvite(null);
            }
        } catch (error) {
            setActiveInvite(null);
        }
        setShowInviteModal(true);
    };

    const handleCloseInviteModal = () => {
        setShowInviteModal(false);
        setInviteProject(null);
        setActiveInvite(null);
    };

    const handleInviteSave = async () => {
        try {
            const inviteData = {
                projectId: inviteProject.id,
                boardId: null, // для проекта; можно расширить для доски
                role: inviteForm.role,
                expiresAt: inviteForm.expiresAt || null,
                maxUsages: inviteForm.maxUsages ? parseInt(inviteForm.maxUsages) : null
            };
            const response = await createInvite(inviteData);
            setActiveInvite(response.data);
            setToastMessage(`Приглашение создано! Ссылка: ${response.data.token} скопирована в буфер.`);
            navigator.clipboard.writeText(response.data.token);
            setShowToast(true);
        } catch (error) {
            setToastMessage("Ошибка при создании приглашения.");
            setShowToast(true);
        }
    };

    const handleInviteUpdate = async () => {
        try {
            const updateData = {
                role: inviteForm.role,
                expiresAt: inviteForm.expiresAt || null,
                maxUsages: inviteForm.maxUsages ? parseInt(inviteForm.maxUsages) : null
            };
            const response = await updateInvite(activeInvite.token, updateData);
            setActiveInvite(response.data);
            setToastMessage("Приглашение успешно обновлено и скопировано в буфер.");
            navigator.clipboard.writeText(response.data.token);
            setShowToast(true);
        } catch (error) {
            setToastMessage("Ошибка при обновлении приглашения.");
            setShowToast(true);
        }
    };

    const handleInviteDeactivate = async () => {
        try {
            const response = await deactivateInvite(activeInvite.token);
            if (response.status === 204) {
                setToastMessage("Приглашение деактивировано.");
                setActiveInvite(null);
                setShowToast(true);
            }
        } catch (error) {
            setToastMessage("Ошибка при деактивации приглашения.");
            setShowToast(true);
        }
    };

    return (
        <Container className="mt-4">
            <h2 className="mb-3">📌 Список проектов</h2>
            <Button variant="success" onClick={() => handleShowModal()}>➕ Создать проект</Button>

            {loading ? (
                <p className="mt-3">⏳ Загрузка...</p>
            ) : error ? (
                <p className="mt-3 text-danger">❌ {error}</p>
            ) : projects.length === 0 ? (
                <p className="mt-3">Нет доступных проектов.</p>
            ) : (
                <Row className="mt-3">
                    {projects.map((project) => (
                        <Col key={project.id} xs={12} sm={6} md={4} lg={3} className="mb-4">
                            <Card className="shadow-sm h-100">
                                <Card.Body>
                                    <Card.Title
                                        className="text-primary"
                                        style={{ cursor: "pointer" }}
                                        onClick={() => {
                                            setProjectId(project.id);
                                            navigate(`/project`);
                                        }}
                                    >
                                        {project.name}
                                    </Card.Title>
                                    <Card.Text className="text-muted">
                                        {project.description && project.description.length > 60
                                            ? project.description.substring(0, 60) + "..."
                                            : project.description}
                                    </Card.Text>
                                    {(project.accessLevel === "ADMIN" || project.accessLevel === "OWNER") && (
                                        <div className="d-flex justify-content-between">
                                            <Button variant="warning" size="sm" onClick={() => handleShowModal(project)}>✏️</Button>
                                            <Button variant="info" size="sm" onClick={() => handleShowInviteModal(project)}>🔗</Button>
                                            <Button variant="danger" size="sm" onClick={() => handleDelete(project.id)}>🗑</Button>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* Модальное окно для создания/редактирования проекта */}
            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>{editMode ? "Редактировать проект" : "Создать проект"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Название</Form.Label>
                            <Form.Control
                                type="text"
                                value={currentProject.name}
                                onChange={(e) => setCurrentProject({ ...currentProject, name: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Описание</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={currentProject.description}
                                onChange={(e) => setCurrentProject({ ...currentProject, description: e.target.value })}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>Отмена</Button>
                    <Button variant="primary" onClick={handleSave}>💾 Сохранить</Button>
                </Modal.Footer>
            </Modal>

            {/* Модальное окно для генерации/редактирования приглашения */}
            <Modal show={showInviteModal} onHide={handleCloseInviteModal}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        Приглашение для проекта {inviteProject?.name}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {activeInvite ? (
                        <div>
                            <p>Активная ссылка уже существует:</p>
                            <Form.Group className="mb-3">
                                <Form.Control
                                    type="text"
                                    readOnly
                                    value={`${window.location.origin}/invite/${activeInvite.token}`}
                                    onClick={(e) => {
                                        e.target.select();
                                        navigator.clipboard.writeText(`${window.location.origin}/invite/${activeInvite.token}`);
                                        setToastMessage("Ссылка скопирована в буфер.");
                                        setShowToast(true);
                                    }}
                                />
                            </Form.Group>
                            <hr />
                            <p>Изменить параметры ссылки:</p>
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Label>Уровень доступа</Form.Label>
                                    <Form.Control
                                        as="select"
                                        value={inviteForm.role}
                                        onChange={(e) =>
                                            setInviteForm({ ...inviteForm, role: e.target.value })
                                        }
                                    >
                                        <option value="READ">Read</option>
                                        <option value="WRITE">Write</option>
                                        <option value="ADMIN">Admin</option>
                                        <option value="OWNER">Owner</option>
                                    </Form.Control>
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Дата и время окончания</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        value={inviteForm.expiresAt}
                                        onChange={(e) =>
                                            setInviteForm({ ...inviteForm, expiresAt: e.target.value })
                                        }
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Максимальное количество использований</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={inviteForm.maxUsages}
                                        onChange={(e) =>
                                            setInviteForm({ ...inviteForm, maxUsages: e.target.value })
                                        }
                                    />
                                </Form.Group>
                            </Form>
                            <div className="d-flex justify-content-between">
                                <Button variant="primary" onClick={handleInviteUpdate}>
                                    Обновить
                                </Button>
                                <Button variant="danger" onClick={handleInviteDeactivate}>
                                    Деактивировать
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Уровень доступа</Form.Label>
                                <Form.Control
                                    as="select"
                                    value={inviteForm.role}
                                    onChange={(e) =>
                                        setInviteForm({ ...inviteForm, role: e.target.value })
                                    }
                                >
                                    <option value="READ">Read</option>
                                    <option value="WRITE">Write</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="OWNER">Owner</option>
                                </Form.Control>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Дата и время окончания</Form.Label>
                                <Form.Control
                                    type="datetime-local"
                                    value={inviteForm.expiresAt}
                                    onChange={(e) =>
                                        setInviteForm({ ...inviteForm, expiresAt: e.target.value })
                                    }
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Максимальное количество использований</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={inviteForm.maxUsages}
                                    onChange={(e) =>
                                        setInviteForm({ ...inviteForm, maxUsages: e.target.value })
                                    }
                                />
                            </Form.Group>
                        </Form>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseInviteModal}>
                        Отмена
                    </Button>
                    {!activeInvite && (
                        <Button variant="primary" onClick={handleInviteSave}>
                            Генерировать
                        </Button>
                    )}
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
                    color: "#fff",
                }}
            >
                <Toast.Body>{toastMessage}</Toast.Body>
            </Toast>
        </Container>
    );
}

export default ProjectsPage;
