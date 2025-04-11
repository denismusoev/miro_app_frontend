import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Typography,
    Space,
    Modal,
    Button,
    Form,
    Input,
    Tooltip,
    Popconfirm,
    Select,
    List,
    Avatar,
    Card,
    Tag,
    Tabs,
    DatePicker,
    InputNumber,
    message,
    Divider,
    Row,
    Col
} from "antd";
import {
    StarOutlined,
    MoreOutlined,
    EditOutlined,
    DeleteOutlined,
    LinkOutlined,
    PlusOutlined,
    TeamOutlined,
    ClockCircleOutlined,
    UserOutlined,
    CopyOutlined,
    ExclamationCircleFilled,
    SearchOutlined
} from "@ant-design/icons";
import {
    fetchAccessibleProjects,
    createProject,
    updateProject,
    deleteProject,
    createInvite,
    getInvite,
    updateInvite,
    deactivateInvite,
    searchProjects
} from "../utils/api";
import { ProjectContext } from "../components/ProjectProvider";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ru';

// Инициализация плагина relativeTime для форматирования дат
dayjs.extend(relativeTime);
dayjs.locale('ru');

const { Text, Title } = Typography;
const { TabPane } = Tabs;

// Константы для ролей доступа
const ACCESS_LEVELS = {
    READ: { label: 'Чтение', value: 'READ', color: 'blue' },
    WRITE: { label: 'Редактирование', value: 'WRITE', color: 'green' },
    ADMIN: { label: 'Администратор', value: 'ADMIN', color: 'purple' },
    OWNER: { label: 'Владелец', value: 'OWNER', color: 'gold' }
};

// Константы для ролей доступа в приглашениях (без OWNER)
const INVITE_ACCESS_LEVELS = {
    READ: { label: 'Чтение', value: 'READ', color: 'blue' },
    WRITE: { label: 'Редактирование', value: 'WRITE', color: 'green' },
    ADMIN: { label: 'Администратор', value: 'ADMIN', color: 'purple' }
};

function ProjectsPage() {
    const { setProjectId } = useContext(ProjectContext);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentProject, setCurrentProject] = useState({
        id: null,
        name: "",
        description: ""
    });
    
    // Состояния для работы с приглашениями
    const [inviteLinkModalVisible, setInviteLinkModalVisible] = useState(false);
    const [inviteProject, setInviteProject] = useState(null);
    const [inviteForm] = Form.useForm();
    const [generatedLink, setGeneratedLink] = useState('');
    const [generatingLink, setGeneratingLink] = useState(false);
    const [currentInviteToken, setCurrentInviteToken] = useState('');
    const [loadingInvite, setLoadingInvite] = useState(false);
    const [existingLinkData, setExistingLinkData] = useState(null);
    const [selectedRole, setSelectedRole] = useState('READ');
    
    // Активная вкладка
    const [activeTab, setActiveTab] = useState('projects');

    // Добавляем состояния для формы поиска
    const [searchForm] = Form.useForm();
    const [isSearching, setIsSearching] = useState(false);
    const [searchPerformed, setSearchPerformed] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const response = await fetchAccessibleProjects();
            setProjects(response.data);
            setLoading(false);
            setSearchPerformed(false);
        } catch (err) {
            setError("Ошибка загрузки данных.");
            setLoading(false);
        }
    };

    // Добавляем функцию для поиска проектов
    const handleSearch = async (values) => {
        // Проверяем, что хотя бы одно поле заполнено
        if ((!values.name || values.name.trim() === '') && 
            (!values.ownerName || values.ownerName.trim() === '')) {
            message.warning("Введите название проекта или имя владельца для поиска");
            return;
        }

        try {
            setIsSearching(true);
            const response = await searchProjects({
                name: values.name,
                ownerName: values.ownerName
            });
            setProjects(response.data);
            setSearchPerformed(true);
            
            // Если проектов не найдено, показываем сообщение
            if (response.data.length === 0) {
                message.info("Проекты не найдены");
            } else {
                message.success(`Найдено проектов: ${response.data.length}`);
            }
        } catch (err) {
            console.error("Ошибка при поиске проектов:", err);
            message.error("Ошибка при поиске проектов");
        } finally {
            setIsSearching(false);
        }
    };

    // Функция для сброса поиска и возврата к полному списку проектов
    const resetSearch = () => {
        searchForm.resetFields();
        loadProjects();
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
                await updateProject({
                    id: currentProject.id,
                    name: currentProject.name,
                    description: currentProject.description
                });
                message.success("Проект успешно обновлен");
            } else {
                await createProject({
                    name: currentProject.name,
                    description: currentProject.description
                });
                message.success("Проект успешно создан");
            }
            handleCloseModal();
            loadProjects();
        } catch (error) {
            console.error("Ошибка при сохранении проекта:", error);
            message.error("Ошибка при сохранении проекта");
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteProject(id);
            message.success("Проект успешно удален");
            loadProjects();
        } catch (error) {
            console.error("Ошибка при удалении проекта:", error);
            message.error("Ошибка при удалении проекта");
        }
    };

    // Функция для форматирования даты
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = dayjs(dateString);
        return date.fromNow(); // например, "2 часа назад", "5 дней назад"
    };

    // Функция для получения цвета аватара проекта
    const getColorFromId = (projectId) => {
        const colors = ["#1890ff", "#52c41a", "#faad14", "#f5222d", "#722ed1"];
        return colors[projectId % colors.length];
    };

    // Функция для получения текста уровня доступа
    const getAccessLevelText = (accessLevel) => {
        switch(accessLevel) {
            case "READ":
                return "Чтение";
            case "WRITE":
                return "Редактирование";
            case "ADMIN":
                return "Администратор";
            case "OWNER":
                return "Владелец";
            default:
                return accessLevel;
        }
    };

    // Функция для открытия модального окна создания ссылки
    const showInviteLinkModal = (project) => {
        setInviteProject(project);
        inviteForm.resetFields();
        setGeneratedLink('');
        setCurrentInviteToken('');
        setExistingLinkData(null);
        setSelectedRole('READ'); // Сбрасываем выбранную роль к значению по умолчанию
        setInviteLinkModalVisible(true);
        fetchExistingInviteLink(project.id);
    };

    // Получение существующей ссылки при открытии модального окна
    const fetchExistingInviteLink = async (projectId) => {
        setLoadingInvite(true);
        try {
            const token = localStorage.getItem("token");
            let foundLink = false;
            
            // Проверяем последовательно наличие ссылок для разных ролей
            for (const role of Object.keys(INVITE_ACCESS_LEVELS)) {
                if (foundLink) break;
                
        try {
                    const response = await getInvite({ projectId, role });
                    
            if (response.data) {
                        foundLink = true;
                        setCurrentInviteToken(response.data.token);
                        setExistingLinkData(response.data);
                        
                        // Формируем полную ссылку
                        const inviteUrl = `${window.location.origin}/invite/${response.data.token}`;
                        setGeneratedLink(inviteUrl);
                        
                        // Заполняем форму данными существующей ссылки
                        inviteForm.setFieldsValue({
                            role: response.data.accessLevel,
                            maxUsages: response.data.maxUsages,
                            expiresAt: response.data.expiresAt ? dayjs(response.data.expiresAt) : null
                        });
                        setSelectedRole(response.data.accessLevel); // Обновляем выбранную роль
                        
                        // Выводим уведомление, что найдена существующая ссылка
                        message.info(`Найдена активная ссылка-приглашение с уровнем доступа "${getAccessLevelText(response.data.accessLevel)}"`);
                    }
                } catch (error) {
                    console.error(`Ошибка при проверке ссылки для роли ${role}:`, error);
                    
                    // Обработка специфических ошибок
                    if (error.response) {
                        const status = error.response.status;
                        
                        // Если это не 404 (ссылка не найдена), то это ошибка
                        if (status !== 404) {
                            if (status === 403) {
                                // Доступ запрещен - недостаточно прав
                                console.warn(`Недостаточно прав для проверки ссылки уровня "${getAccessLevelText(role)}"`);
                            } else if (status === 401) {
                                // Неавторизованный доступ
                                console.warn("Требуется авторизация для выполнения этого действия");
            } else {
                                // Другие ошибки
                                const errorMsg = error.response.data?.error || error.message;
                                console.warn(`Ошибка при проверке ссылки: ${errorMsg}`);
                            }
                        }
                        // Для 404 ничего не делаем, это нормальная ситуация - ссылка не найдена
                    }
                }
            }
            
            // Если после проверки всех ролей не найдена ни одна ссылка, выводим уведомление
            if (!foundLink) {
                message.info('Не найдено активных ссылок-приглашений для этого проекта');
                
                // Устанавливаем начальную роль READ в форме
                inviteForm.setFieldsValue({
                    role: 'READ',
                    maxUsages: 1,
                    expiresAt: null
                });
            }
        } catch (error) {
            console.error('Ошибка при получении существующих ссылок-приглашений:', error);
            message.error(`Ошибка при получении ссылок: ${error.message}`);
        } finally {
            setLoadingInvite(false);
        }
    };

    // Получение существующей ссылки для конкретной роли
    const fetchInviteLinkForRole = async (projectId, role) => {
        setLoadingInvite(true);
        setSelectedRole(role); // Обновляем выбранную роль при переключении
        try {
            const response = await getInvite({ projectId, role });
            
            if (response.data) {
                setCurrentInviteToken(response.data.token);
                setExistingLinkData(response.data);
                
                // Формируем полную ссылку
                const inviteUrl = `${window.location.origin}/invite/${response.data.token}`;
                setGeneratedLink(inviteUrl);
                
                // Заполняем форму данными существующей ссылки
                inviteForm.setFieldsValue({
                    role: response.data.accessLevel,
                    maxUsages: response.data.maxUsages,
                    expiresAt: response.data.expiresAt ? dayjs(response.data.expiresAt) : null
                });
                
                message.info(`Загружена ссылка с уровнем доступа "${getAccessLevelText(response.data.accessLevel)}"`);
            } else {
                // Если ссылка не найдена
                setCurrentInviteToken('');
                setExistingLinkData(null);
                setGeneratedLink('');
                
                // Устанавливаем выбранную роль в форме
                inviteForm.setFieldsValue({
                    role: role,
                    maxUsages: 1,
                    expiresAt: null
                });
                
                message.info(`Нет активной ссылки с уровнем доступа "${getAccessLevelText(role)}"`);
            }
        } catch (error) {
            console.error(`Ошибка при получении ссылки для роли ${role}:`, error);
            
            // Сбрасываем форму
            setCurrentInviteToken('');
            setExistingLinkData(null);
            setGeneratedLink('');
            
            // Обработка конкретных ошибок
            if (error.response) {
                const status = error.response.status;
                
                if (status === 404) {
                    message.info(`Нет активной ссылки с уровнем доступа "${getAccessLevelText(role)}"`);
                    // Устанавливаем выбранную роль в форме
                    inviteForm.setFieldsValue({
                        role: role,
                        maxUsages: 1,
                        expiresAt: null
                    });
                } else if (status === 403) {
                    // Доступ запрещен - недостаточно прав
                    message.error(`Недостаточно прав для работы со ссылками уровня "${getAccessLevelText(role)}"`);
                } else if (status === 401) {
                    // Неавторизованный доступ
                    message.error("Требуется авторизация для выполнения этого действия");
                } else {
                    // Другие ошибки
                    const errorMsg = error.response.data?.error || error.message;
                    message.error(`Ошибка при получении ссылки: ${errorMsg}`);
                }
            } else {
                message.error(`Ошибка при получении ссылки: ${error.message}`);
                
                inviteForm.setFieldsValue({
                    role: role,
                    maxUsages: 1,
                    expiresAt: null
                });
            }
        } finally {
            setLoadingInvite(false);
        }
    };

    // Функция для создания ссылки-приглашения
    const handleCreateInviteLink = async (values) => {
        try {
            setGeneratingLink(true);
            
            // Форматируем дату expiration с сохранением выбранного пользователем времени
            let expiresAtFormatted = null;
            if (values.expiresAt) {
                // Используем полный ISO формат, который сохраняет выбранное время
                expiresAtFormatted = values.expiresAt.format('YYYY-MM-DDTHH:mm:ss.SSS');
            }
            
            const payload = {
                projectId: parseInt(inviteProject.id),
                role: values.role,
                expiresAt: expiresAtFormatted,
                maxUsages: values.maxUsages || null
            };
            
            const response = await createInvite(payload);
            
            // Сохраняем токен текущей ссылки
            setCurrentInviteToken(response.data.token);
            setExistingLinkData(response.data);
            setSelectedRole(response.data.accessLevel); // Обновляем выбранную роль
            
            // Создаем полную ссылку для приглашения
            const inviteUrl = `${window.location.origin}/invite/${response.data.token}`;
            setGeneratedLink(inviteUrl);
            
            message.success('Ссылка-приглашение успешно создана');
        } catch (error) {
            console.error('Ошибка при создании ссылки-приглашения:', error);
            message.error('Ошибка при создании ссылки-приглашения');
        } finally {
            setGeneratingLink(false);
        }
    };

    // Функция для обновления существующей ссылки-приглашения
    const handleUpdateInviteLink = async (values) => {
        try {
            setGeneratingLink(true);
            
            // Форматируем дату expiration с сохранением выбранного пользователем времени
            let expiresAtFormatted = null;
            if (values.expiresAt) {
                // Используем полный ISO формат, который сохраняет выбранное время
                expiresAtFormatted = values.expiresAt.format('YYYY-MM-DDTHH:mm:ss.SSS');
            }
            
            const payload = {
                role: values.role,
                expiresAt: expiresAtFormatted,
                maxUsages: values.maxUsages || null
            };
            
            const response = await updateInvite(currentInviteToken, payload);
            
            // Обновляем данные ссылки
            setExistingLinkData(response.data);
            setSelectedRole(response.data.accessLevel); // Обновляем выбранную роль
            
            message.success('Ссылка-приглашение успешно обновлена');
        } catch (error) {
            console.error('Ошибка при обновлении ссылки-приглашения:', error);
            message.error('Ошибка при обновлении ссылки-приглашения');
        } finally {
            setGeneratingLink(false);
        }
    };

    // Функция для деактивации ссылки-приглашения
    const handleDeactivateInviteLink = async () => {
        try {
            setGeneratingLink(true);
            
            await deactivateInvite(currentInviteToken);
            
            // Сбрасываем состояния после деактивации
            setCurrentInviteToken('');
            setGeneratedLink('');
            setExistingLinkData(null);
            inviteForm.resetFields();
            
            message.success('Ссылка-приглашение деактивирована');
        } catch (error) {
            console.error('Ошибка при деактивации ссылки-приглашения:', error);
            message.error('Ошибка при деактивации ссылки-приглашения');
        } finally {
            setGeneratingLink(false);
        }
    };

    // Функция для копирования ссылки в буфер обмена
    const copyLinkToClipboard = () => {
        navigator.clipboard.writeText(generatedLink)
            .then(() => {
                message.success('Ссылка скопирована в буфер обмена');
            })
            .catch(() => {
                message.error('Не удалось скопировать ссылку');
            });
    };

    // Функция для генерации кнопок действий для проекта
    const getProjectActions = (project) => {
        return [
                        <Button
                key="edit" 
                            icon={<EditOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                    handleShowModal(project);
                            }}
            >
                Редактировать
            </Button>,
                        <Button
                key="invite"
                            icon={<LinkOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                    showInviteLinkModal(project);
                            }}
            >
                Пригласить
            </Button>,
            <Popconfirm
                key="delete"
                title="Удалить проект?"
                description="Это действие нельзя отменить."
                onConfirm={(e) => {
                    e.stopPropagation();
                    handleDelete(project.id);
                }}
                okText="Да"
                cancelText="Нет"
                onCancel={(e) => e.stopPropagation()}
            >
                <Button 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={(e) => e.stopPropagation()}
                >
                    Удалить
                </Button>
            </Popconfirm>
        ];
    };

    return (
        <div style={{ background: 'white', padding: '24px' }}>
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <Title level={3} style={{ margin: 0 }}>Мои проекты</Title>
                    <Space>
                        <Button 
                            type="primary" 
                            icon={<PlusOutlined />}
                            onClick={() => handleShowModal()}
                        >
                            Создать проект
                        </Button>
                    </Space>
                </div>

                <Tabs activeKey={activeTab} onChange={setActiveTab}>
                    <TabPane tab="Проекты" key="projects">
                        <Card style={{ marginBottom: 16 }}>
                            <Title level={3}>Мои проекты</Title>
                            
                            {/* Форма поиска проектов */}
                            <Card 
                                title={<Text strong>Поиск проектов</Text>} 
                                bordered={false} 
                                style={{ marginBottom: 16 }}
                                size="small"
                            >
                                <Form
                                    form={searchForm}
                                    layout="vertical"
                                    onFinish={handleSearch}
                                >
                                    <Row gutter={16}>
                                        <Col xs={24} sm={12} md={8} lg={8}>
                                            <Form.Item 
                                                name="name" 
                                                label="Название проекта"
                                            >
                                                <Input placeholder="Введите название проекта" />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} sm={12} md={8} lg={8}>
                                            <Form.Item 
                                                name="ownerName" 
                                                label="Имя владельца"
                                            >
                                                <Input placeholder="Введите имя владельца" />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} sm={24} md={8} lg={8} style={{ display: 'flex', alignItems: 'flex-end' }}>
                                            <Form.Item>
                                                <Space>
                                                    <Button 
                                                        type="primary" 
                                                        htmlType="submit"
                                                        loading={isSearching}
                                                        icon={<SearchOutlined />}
                                                    >
                                                        Найти
                                                    </Button>
                                                    <Button 
                                                        onClick={resetSearch} 
                                                        disabled={!searchPerformed}
                                                    >
                                                        Сбросить
                </Button>
                                                </Space>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Form>
                            </Card>

                            <List
                                loading={loading}
                                itemLayout="horizontal"
                        dataSource={projects}
                                pagination={{
                                    onChange: (page) => {
                                        window.scrollTo(0, 0);
                                    },
                                    pageSize: 5,
                                    position: 'bottom',
                                    align: 'center',
                                    showSizeChanger: true,
                                    pageSizeOptions: ['5', '10', '20'],
                                    showTotal: (total) => `Всего ${total} проектов`
                                }}
                                renderItem={(project) => (
                                    <List.Item 
                                        key={project.id}
                                        actions={getProjectActions(project)}
                                        onClick={() => {
                                            setProjectId(project.id);
                                navigate(`/project`);
                                        }}
                                        style={{ 
                                            cursor: 'pointer',
                                            padding: '16px',
                                            background: 'white',
                                            marginBottom: '8px',
                                            borderRadius: '8px',
                                            border: '1px solid #f0f0f0',
                                            transition: 'all 0.3s'
                                        }}
                                        className="project-list-item"
                                    >
                                        <List.Item.Meta
                                            avatar={
                                                <Avatar 
                                                    style={{ 
                                                        backgroundColor: getColorFromId(project.id),
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    {project.name.charAt(0).toUpperCase()}
                                                </Avatar>
                                            }
                                            title={
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span>{project.name}</span>
                                                    <Tag color={ACCESS_LEVELS[project.accessLevel]?.color || 'default'}>
                                                        {ACCESS_LEVELS[project.accessLevel]?.label || project.accessLevel}
                                                    </Tag>
                                                </div>
                                            }
                                            description={
                                                <Space direction="vertical" size={0}>
                                                    <Text type="secondary">
                                                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                                                        Изменено: {formatDate(project.modifiedAt)} 
                                                        {project.modifiedBy ? ` пользователем ${project.modifiedBy.fullName}` : ''}
                                                    </Text>
                                                    <Text type="secondary">
                                                        <UserOutlined style={{ marginRight: 4 }} />
                                                        Владелец: {project.owner?.fullName || 'Неизвестно'}
                                                    </Text>
                                                    {project.description && (
                                                        <Text type="secondary" style={{ marginTop: 8 }}>
                                                            {project.description.length > 100 
                                                                ? `${project.description.substring(0, 100)}...` 
                                                                : project.description}
                                                        </Text>
                                                    )}
                                                </Space>
                                            }
                    />
                                    </List.Item>
                                )}
                                locale={{ 
                                    emptyText: error ? 
                                        <Text type="danger">{error}</Text> : 
                                        'Нет доступных проектов. Создайте новый проект.'
                                }}
                            />
                        </Card>
                    </TabPane>
                    <TabPane tab="Избранное" key="favorites">
                        <div style={{ textAlign: 'center', padding: '50px 0' }}>
                            <Text type="secondary">Функция избранных проектов пока не доступна</Text>
                        </div>
                    </TabPane>
                </Tabs>

                {/* Модальное окно для создания/редактирования проекта */}
                <Modal
                    title={editMode ? "Редактировать проект" : "Создать проект"}
                    open={showModal}
                    onCancel={handleCloseModal}
                    footer={[
                        <Button key="cancel" onClick={handleCloseModal}>
                            Отмена
                        </Button>,
                        <Button key="save" type="primary" onClick={handleSave}>
                            Сохранить
                        </Button>
                    ]}
                >
                    <Form layout="vertical">
                        <Form.Item 
                            label="Название" 
                            required
                            rules={[{ required: true, message: 'Пожалуйста, введите название проекта' }]}
                        >
                            <Input
                                value={currentProject.name}
                                onChange={(e) => setCurrentProject({ ...currentProject, name: e.target.value })}
                                placeholder="Введите название проекта"
                            />
                        </Form.Item>
                        <Form.Item label="Описание">
                            <Input.TextArea
                                rows={4} 
                                value={currentProject.description}
                                onChange={(e) => setCurrentProject({ ...currentProject, description: e.target.value })}
                                placeholder="Введите описание проекта (необязательно)"
                            />
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Модальное окно для создания ссылки-приглашения */}
                <Modal
                    title={<div><LinkOutlined /> {existingLinkData ? "Управление ссылкой-приглашением" : "Создать ссылку-приглашение"}</div>}
                    open={inviteLinkModalVisible}
                    onCancel={() => setInviteLinkModalVisible(false)}
                    footer={null}
                    destroyOnClose
                >
                    {loadingInvite ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Загрузка...</span>
                            </div>
                            <p style={{ marginTop: '10px' }}>Проверяем наличие активных ссылок...</p>
                        </div>
                    ) : (
                        <Form
                            form={inviteForm}
                            layout="vertical"
                            onFinish={currentInviteToken ? handleUpdateInviteLink : handleCreateInviteLink}
                            initialValues={{
                                role: 'READ',
                                maxUsages: 1
                            }}
                        >
                            {/* Секция для быстрого переключения между ролями */}
                            <div style={{ marginBottom: 16 }}>
                                <Text style={{ display: 'block', marginBottom: 8 }}>Проверить наличие ссылок с другими правами:</Text>
                                <Space>
                                    {Object.values(INVITE_ACCESS_LEVELS).map(level => (
                                        <Button 
                                            key={level.value}
                                            type={selectedRole === level.value ? "primary" : "default"}
                                            size="small"
                                            onClick={() => fetchInviteLinkForRole(inviteProject.id, level.value)}
                                        >
                                            {level.label}
                                    </Button>
                                    ))}
                                </Space>
                            </div>
                            
                            <Form.Item
                                name="role"
                                label="Уровень доступа"
                                rules={[{ required: true, message: 'Пожалуйста, выберите уровень доступа' }]}
                            >
                                <Select
                                    placeholder="Выберите уровень доступа"
                                    onChange={(value) => setSelectedRole(value)}
                                >
                                    {Object.values(INVITE_ACCESS_LEVELS).map(level => (
                                        <Select.Option key={level.value} value={level.value}>
                                            {level.label}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            
                            <Form.Item
                                name="expiresAt"
                                label="Срок действия"
                                tooltip="Оставьте пустым для бессрочной ссылки"
                            >
                                <DatePicker 
                                    showTime 
                                    format="YYYY-MM-DD HH:mm:ss"
                                    placeholder="Выберите дату и время истечения" 
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                            
                            <Form.Item
                                name="maxUsages"
                                label="Максимальное количество использований"
                                tooltip="Оставьте пустым для неограниченного количества использований"
                            >
                                <InputNumber min={1} max={100} style={{ width: '100%' }} />
                            </Form.Item>
                            
                            {existingLinkData && (
                                <div style={{ marginBottom: 16 }}>
                                    <Text type="secondary">Статистика ссылки:</Text>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                                        <div>
                                            <Text>Использований: </Text>
                                            <Text strong>
                                                {existingLinkData.usageCount}
                                                {existingLinkData.maxUsages ? `/${existingLinkData.maxUsages}` : ' (без ограничений)'}
                                            </Text>
                                        </div>
                                        {existingLinkData.expiresAt && (
                                            <div>
                                                <Text>Истекает: </Text>
                                                <Text strong>{dayjs(existingLinkData.expiresAt).format('DD.MM.YYYY HH:mm')}</Text>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Предупреждения о состоянии ссылки */}
                                    {existingLinkData.expiresAt && new Date(existingLinkData.expiresAt) < new Date() && (
                                        <div style={{ 
                                            marginTop: 8, 
                                            padding: '8px 12px', 
                                            backgroundColor: '#fff2f0', 
                                            border: '1px solid #ffccc7',
                                            borderRadius: 4
                                        }}>
                                            <Text type="danger">
                                                <ExclamationCircleFilled style={{ marginRight: 8 }} />
                                                Срок действия ссылки истёк {dayjs(existingLinkData.expiresAt).format('DD.MM.YYYY')}
                                            </Text>
                                        </div>
                                    )}
                                    
                                    {existingLinkData.maxUsages && existingLinkData.usageCount >= existingLinkData.maxUsages && (
                                        <div style={{ 
                                            marginTop: 8, 
                                            padding: '8px 12px', 
                                            backgroundColor: '#fff2f0', 
                                            border: '1px solid #ffccc7',
                                            borderRadius: 4
                                        }}>
                                            <Text type="danger">
                                                <ExclamationCircleFilled style={{ marginRight: 8 }} />
                                                Достигнуто максимальное количество использований ({existingLinkData.maxUsages})
                                            </Text>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {generatedLink ? (
                                <div style={{ marginTop: 16 }}>
                                    <Text strong>Ссылка для приглашения:</Text>
                                    <div 
                                        style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            marginTop: 8, 
                                            padding: '8px 12px',
                                            background: '#f5f5f5',
                                            borderRadius: 4,
                                            wordBreak: 'break-all'
                                        }}
                                    >
                                        <Text style={{ flex: 1 }} ellipsis={{ tooltip: generatedLink }}>
                                            {generatedLink}
                                        </Text>
                                        <Tooltip title="Копировать ссылку">
                                            <Button 
                                                type="text" 
                                                icon={<CopyOutlined />} 
                                                onClick={copyLinkToClipboard} 
                                            />
                                        </Tooltip>
                                    </div>
                                    
                                    <div style={{ marginTop: 24 }}>
                                        {existingLinkData ? (
                                            <>
                                                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                                    <Popconfirm
                                                        title="Деактивировать ссылку-приглашение"
                                                        description="Эта ссылка станет недействительной и не сможет быть использована. Вы уверены?"
                                                        onConfirm={handleDeactivateInviteLink}
                                                        okText="Да, деактивировать"
                                                        cancelText="Отмена"
                                                    >
                                                        <Button 
                                                            danger
                                                            loading={generatingLink}
                                                        >
                                                            Деактивировать ссылку
                                                        </Button>
                                                    </Popconfirm>
                                                    
                                                    <Button 
                                                        type="primary" 
                                                        htmlType="submit" 
                                                        loading={generatingLink}
                                                    >
                                                        Обновить ссылку
                                                    </Button>
                                                </Space>
                                            </>
                                        ) : (
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Button onClick={() => setInviteLinkModalVisible(false)}>
                                                    Закрыть
                                                </Button>
                                                <Button type="primary" onClick={() => {
                                                    setGeneratedLink('');
                                                    inviteForm.resetFields();
                                                }}>
                                                    Создать ещё
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <Form.Item>
                                    <Button 
                                        type="primary" 
                                        htmlType="submit" 
                                        loading={generatingLink}
                                        block
                                    >
                                        {existingLinkData ? "Обновить ссылку" : "Создать ссылку"}
                            </Button>
                                </Form.Item>
                            )}
                        </Form>
                    )}
                </Modal>

                {/* Стили для элементов списка */}
                <style jsx>{`
                    .project-list-item:hover {
                        background-color: #f8f8f8;
                    }
                `}</style>
            </div>
        </div>
    );
}

export default ProjectsPage;
