import React, {useContext, useEffect, useState} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    fetchBoardByProjectId,
    createBoard,
    updateBoard,
    deleteBoard,
    searchBoards,
    fetchProjectById
} from "../utils/api";

import {
    Button as BsButton,
    Container,
    Card as BsCard,
    Modal as BsModal,
    Form as BsForm,
    Toast,
    Tabs as BsTabs,
    Tab as BsTab
} from "react-bootstrap";
import { 
    Button, 
    Modal, 
    Form, 
    Input, 
    Select, 
    DatePicker, 
    InputNumber, 
    Space, 
    message, 
    Typography, 
    Tooltip, 
    Popconfirm, 
    List, 
    Avatar, 
    Card, 
    Tag, 
    Dropdown, 
    Tabs,
    Layout,
    Menu,
    Divider,
    Checkbox,
    Row,
    Col
} from 'antd';
import { 
    StarOutlined, 
    MoreOutlined, 
    ExclamationCircleFilled, 
    LinkOutlined, 
    CopyOutlined,
    EditOutlined,
    DeleteOutlined,
    UserOutlined,
    ClockCircleOutlined,
    TeamOutlined,
    SettingOutlined,
    PlusOutlined,
    ImportOutlined,
    EllipsisOutlined,
    SearchOutlined
} from '@ant-design/icons';
import {ProjectContext} from "../components/ProjectProvider";
import ProjectPermissions from "../components/ProjectPermissions";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ru'; // Импортируем русскую локализацию

// Инициализация плагина relativeTime для форматирования дат
dayjs.extend(relativeTime);
dayjs.locale('ru'); // Устанавливаем русскую локализацию

/**
 * Константы для Miro
 */
const CLIENT_ID = "3458764618211634466";
const REDIRECT_BASE = "http://localhost:3000/project"; // Ваш фронтенд URL
const BACKEND_URL = "http://localhost:8080";   // Ваш бэкенд

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

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Content } = Layout;

function ProjectPage() {
    const { projectId } = useContext(ProjectContext);
    const navigate = useNavigate();
    const { Option } = Select;

    const [boards, setBoards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [projectInfo, setProjectInfo] = useState(null);
    const [descriptionVisible, setDescriptionVisible] = useState(false);

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

    // Состояние для управления отображением раздела настроек
    const [activeTab, setActiveTab] = useState('boards');

    // ---------- Логика для Miro ----------
    const [miroBoards, setMiroBoards] = useState([]);
    const [showMiroModal, setShowMiroModal] = useState(false);
    const [selectedBoards, setSelectedBoards] = useState([]);

    // Состояния для модального окна создания ссылки-приглашения
    const [inviteLinkModalVisible, setInviteLinkModalVisible] = useState(false);
    const [inviteForm] = Form.useForm();
    const [generatedLink, setGeneratedLink] = useState('');
    const [generatingLink, setGeneratingLink] = useState(false);
    const [currentInviteToken, setCurrentInviteToken] = useState('');
    const [loadingInvite, setLoadingInvite] = useState(false);
    const [existingLinkData, setExistingLinkData] = useState(null);
    const [selectedRole, setSelectedRole] = useState('READ');
    
    // Состояния для модального окна создания ссылки-приглашения для доски
    const [boardInviteLinkModalVisible, setBoardInviteLinkModalVisible] = useState(false);
    const [boardInviteForm] = Form.useForm();
    const [boardGeneratedLink, setBoardGeneratedLink] = useState('');
    const [boardGeneratingLink, setBoardGeneratingLink] = useState(false);
    const [currentBoardInviteToken, setCurrentBoardInviteToken] = useState('');
    const [loadingBoardInvite, setLoadingBoardInvite] = useState(false);
    const [existingBoardLinkData, setExistingBoardLinkData] = useState(null);
    const [selectedBoardRole, setSelectedBoardRole] = useState('READ');
    const [currentBoardId, setCurrentBoardId] = useState(null);

    // Состояния для поиска досок
    const [searchForm] = Form.useForm();
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchPerformed, setSearchPerformed] = useState(false);

    // При первом рендере грузим доски из БД и информацию о проекте
    useEffect(() => {
        loadBoards();
        loadProjectInfo();
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
            setLoading(true);
            const response = await fetchBoardByProjectId(projectId);
            setBoards(response.data);
            setLoading(false);
            // Сбрасываем флаг поиска при загрузке всех досок
            setSearchPerformed(false);
        } catch (err) {
            setError("Ошибка загрузки данных.");
            setLoading(false);
        }
    };

    // Загрузка информации о проекте
    const loadProjectInfo = async () => {
        try {
            const response = await fetchProjectById(projectId);
            setProjectInfo(response.data);
        } catch (err) {
            console.error("Ошибка загрузки данных о проекте:", err);
            message.error("Не удалось загрузить информацию о проекте");
        }
    };

    // Добавляем функцию для поиска досок
    const handleSearchBoards = async (values) => {
        // Проверяем, что хотя бы одно поле заполнено
        if ((!values.name || values.name.trim() === '') && 
            (!values.ownerName || values.ownerName.trim() === '')) {
            message.warning("Введите название доски или имя владельца для поиска");
            return;
        }

        try {
            setSearchLoading(true);
            const response = await searchBoards({
                name: values.name,
                ownerName: values.ownerName
            });
            
            // Фильтруем доски только для текущего проекта
            const filteredBoards = response.data.filter(board => board.projectId === parseInt(projectId));
            setBoards(filteredBoards);
            setSearchPerformed(true);
            
            // Если досок не найдено, показываем сообщение
            if (filteredBoards.length === 0) {
                message.info("Доски не найдены");
            } else {
                message.success(`Найдено досок: ${filteredBoards.length}`);
            }
        } catch (err) {
            console.error("Ошибка при поиске досок:", err);
            message.error("Ошибка при поиске досок");
        } finally {
            setSearchLoading(false);
        }
    };

    // Функция для сброса поиска и возврата к полному списку досок
    const resetBoardSearch = () => {
        searchForm.resetFields();
        loadBoards();
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
                message.success("Доска успешно обновлена");
            } else {
                await createBoard(projectId, currentBoard);
                message.success("Доска успешно создана");
            }
            handleCloseModal();
            loadBoards();
        } catch (error) {
            message.error("Ошибка при сохранении доски");
        }
    };

    const handleDelete = async (boardId) => {
            try {
                await deleteBoard(boardId);
            message.success("Доска успешно удалена");
                loadBoards();
            } catch (error) {
            message.error("Ошибка при удалении доски");
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
            message.error("Ошибка при загрузке досок из Miro");
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
            await loadBoards();
        } catch (error) {
            console.error("Ошибка при импорте досок:", error);
            alert("Произошла ошибка при импорте досок. См. консоль.");
        }
    };

    // Функция для форматирования даты
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = dayjs(dateString);
        return date.fromNow(); // например, "2 часа назад", "5 дней назад"
    };

    // Функция для получения цвета аватара доски
    const getColorFromId = (boardId) => {
        const colors = ["#1890ff", "#52c41a", "#faad14", "#f5222d", "#722ed1"];
        return colors[boardId % colors.length];
    };

    // Новая функция для отображения действий с доской
    const getDirectBoardActions = (board) => {
        return [
            <Button 
                key="edit" 
                icon={<EditOutlined />}
                onClick={(e) => {
                    e.stopPropagation();
                    handleShowModal(board);
                }}
            >
                Редактировать
            </Button>,
            <Button
                key="invite"
                icon={<LinkOutlined />}
                onClick={(e) => {
                    e.stopPropagation();
                    showBoardInviteLinkModal(board.id);
                }}
            >
                Пригласить
            </Button>,
            <Popconfirm
                key="delete"
                title="Удалить доску?"
                description="Это действие нельзя отменить."
                onConfirm={(e) => {
                    e.stopPropagation();
                    handleDelete(board.id);
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
    const showInviteLinkModal = () => {
        inviteForm.resetFields();
        setGeneratedLink('');
        setCurrentInviteToken('');
        setExistingLinkData(null);
        setSelectedRole('READ'); // Сбрасываем выбранную роль к значению по умолчанию
        setInviteLinkModalVisible(true);
        fetchExistingInviteLink();
    };

    // Получение существующей ссылки для конкретной роли
    const fetchInviteLinkForRole = async (role) => {
        setLoadingInvite(true);
        setSelectedRole(role); // Обновляем выбранную роль при переключении
        try {
            const userToken = getUserToken();
            
            const response = await fetch(`${BACKEND_URL}/api/invites?projectId=${projectId}&role=${role}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                // Если ссылка найдена
                if (data && data.token) {
                    setCurrentInviteToken(data.token);
                    setExistingLinkData(data);
                    
                    // Формируем полную ссылку
                    const inviteUrl = `${window.location.origin}/invite/${data.token}`;
                    setGeneratedLink(inviteUrl);
                    
                    // Заполняем форму данными существующей ссылки
                    inviteForm.setFieldsValue({
                        role: data.accessLevel,
                        maxUsages: data.maxUsages,
                        expiresAt: data.expiresAt ? dayjs(data.expiresAt) : null
                    });
                    setSelectedRole(data.accessLevel); // Обновляем выбранную роль
                    
                    // Проверяем, истекла ли ссылка
                    checkLinkExpiration(data);
                    
                    message.info(`Загружена ссылка с уровнем доступа "${getAccessLevelText(data.accessLevel)}"`);
                }
            } else if (response.status === 404) {
                // Если ссылка не найдена (сервер вернул 404)
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
                            } else {
                // Обрабатываем другие ошибки
                const errorData = await response.json();
                message.error(errorData.error || `Ошибка при получении ссылки: ${response.status}`);
            }
        } catch (error) {
            console.error(`Ошибка при получении ссылки для роли ${role}:`, error);
            message.error(`Ошибка при получении ссылки: ${error.message}`);
        } finally {
            setLoadingInvite(false);
        }
    };

    // Получение существующей ссылки при открытии модального окна
    const fetchExistingInviteLink = async () => {
        setLoadingInvite(true);
        try {
            const userToken = getUserToken();
            let foundLink = false;
            
            // Проверяем последовательно наличие ссылок для разных ролей
            for (const role of Object.keys(INVITE_ACCESS_LEVELS)) {
                if (foundLink) break;
                
                try {
                    const response = await fetch(`${BACKEND_URL}/api/invites?projectId=${projectId}&role=${role}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${userToken}`
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        // Если ссылка найдена
                        if (data && data.token) {
                            foundLink = true;
                            setCurrentInviteToken(data.token);
                            setExistingLinkData(data);
                            
                            // Формируем полную ссылку
                            const inviteUrl = `${window.location.origin}/invite/${data.token}`;
                            setGeneratedLink(inviteUrl);
                            
                            // Заполняем форму данными существующей ссылки
                            inviteForm.setFieldsValue({
                                role: data.accessLevel,
                                maxUsages: data.maxUsages,
                                expiresAt: data.expiresAt ? dayjs(data.expiresAt) : null
                            });
                            setSelectedRole(data.accessLevel); // Обновляем выбранную роль
                            
                            // Проверяем, истекла ли ссылка
                            checkLinkExpiration(data);
                            
                            // Выводим уведомление, что найдена существующая ссылка
                            message.info(`Найдена активная ссылка-приглашение с уровнем доступа "${getAccessLevelText(data.accessLevel)}"`);
                        }
                    } else if (response.status !== 404) {
                        // Обрабатываем ошибки, кроме 404 (нет ссылки)
                        const errorData = await response.json();
                        console.error(`Ошибка при проверке ссылки для роли ${role}:`, errorData.error);
                    }
                } catch (error) {
                    console.error(`Ошибка при проверке ссылки для роли ${role}:`, error);
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

    // Функция для проверки, истекла ли ссылка
    const checkLinkExpiration = (linkData) => {
        if (!linkData) return;
        
        const now = new Date();
        
        // Проверка на истечение срока действия
        if (linkData.expiresAt && new Date(linkData.expiresAt) < now) {
            message.warning('Внимание! Срок действия этой ссылки уже истек.');
        }
        
        // Проверка на исчерпание количества использований
        if (linkData.maxUsages && linkData.usageCount >= linkData.maxUsages) {
            message.warning('Внимание! Эта ссылка достигла максимального количества использований.');
        }
    };

    // Функция для создания ссылки-приглашения
    const handleCreateInviteLink = async (values) => {
        try {
            setGeneratingLink(true);
            const userToken = getUserToken();
            
            // Форматируем дату expiration с сохранением выбранного пользователем времени
            let expiresAtFormatted = null;
            if (values.expiresAt) {
                // Используем полный ISO формат, который сохраняет выбранное время
                expiresAtFormatted = values.expiresAt.format('YYYY-MM-DDTHH:mm:ss.SSS');
            }
            
            const payload = {
                projectId: parseInt(projectId),
                role: values.role,
                expiresAt: expiresAtFormatted,
                maxUsages: values.maxUsages || null // Проверяем наличие значения maxUsages
            };
            
            const response = await fetch(`${BACKEND_URL}/api/invites`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Сохраняем токен текущей ссылки
            setCurrentInviteToken(data.token);
            setExistingLinkData(data);
            setSelectedRole(data.accessLevel); // Обновляем выбранную роль
            
            // Создаем полную ссылку для приглашения
            const inviteUrl = `${window.location.origin}/invite/${data.token}`;
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
            const userToken = getUserToken();
            
            // Форматируем дату expiration с сохранением выбранного пользователем времени
            let expiresAtFormatted = null;
            if (values.expiresAt) {
                // Используем полный ISO формат, который сохраняет выбранное время
                expiresAtFormatted = values.expiresAt.format('YYYY-MM-DDTHH:mm:ss.SSS');
            }
            
            const payload = {
                role: values.role,
                expiresAt: expiresAtFormatted,
                maxUsages: values.maxUsages || null // Проверяем наличие значения maxUsages
            };
            
            const response = await fetch(`${BACKEND_URL}/api/invites/${currentInviteToken}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Обновляем данные ссылки
            setExistingLinkData(data);
            setSelectedRole(data.accessLevel); // Обновляем выбранную роль
            
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
            const userToken = getUserToken();
            
            const response = await fetch(`${BACKEND_URL}/api/invites/${currentInviteToken}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }
            
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

    // Функция для открытия модального окна создания ссылки для доски
    const showBoardInviteLinkModal = (boardId) => {
        boardInviteForm.resetFields();
        setBoardGeneratedLink('');
        setCurrentBoardInviteToken('');
        setExistingBoardLinkData(null);
        setSelectedBoardRole('READ'); // Сбрасываем выбранную роль к значению по умолчанию
        setCurrentBoardId(boardId);
        setBoardInviteLinkModalVisible(true);
        fetchExistingBoardInviteLink(boardId);
    };

    // Получение существующей ссылки для конкретной роли доски
    const fetchBoardInviteLinkForRole = async (boardId, role) => {
        setLoadingBoardInvite(true);
        setSelectedBoardRole(role); // Обновляем выбранную роль при переключении
        try {
            const userToken = getUserToken();
            
            const response = await fetch(`${BACKEND_URL}/api/invites?boardId=${boardId}&role=${role}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                // Если ссылка найдена
                if (data && data.token) {
                    setCurrentBoardInviteToken(data.token);
                    setExistingBoardLinkData(data);
                    
                    // Формируем полную ссылку
                    const inviteUrl = `${window.location.origin}/invite/${data.token}`;
                    setBoardGeneratedLink(inviteUrl);
                    
                    // Заполняем форму данными существующей ссылки
                    boardInviteForm.setFieldsValue({
                        role: data.accessLevel,
                        maxUsages: data.maxUsages,
                        expiresAt: data.expiresAt ? dayjs(data.expiresAt) : null
                    });
                    setSelectedBoardRole(data.accessLevel); // Обновляем выбранную роль
                    
                    // Проверяем, истекла ли ссылка
                    checkBoardLinkExpiration(data);
                    
                    message.info(`Загружена ссылка с уровнем доступа "${getAccessLevelText(data.accessLevel)}"`);
                }
            } else if (response.status === 404) {
                // Если ссылка не найдена (сервер вернул 404)
                setCurrentBoardInviteToken('');
                setExistingBoardLinkData(null);
                setBoardGeneratedLink('');
                
                // Устанавливаем выбранную роль в форме
                boardInviteForm.setFieldsValue({
                    role: role,
                    maxUsages: 1,
                    expiresAt: null
                });
                
                message.info(`Нет активной ссылки с уровнем доступа "${getAccessLevelText(role)}"`);
            } else {
                // Обрабатываем другие ошибки
                const errorData = await response.json();
                message.error(errorData.error || `Ошибка при получении ссылки: ${response.status}`);
            }
        } catch (error) {
            console.error(`Ошибка при получении ссылки для роли ${role}:`, error);
            message.error(`Ошибка при получении ссылки: ${error.message}`);
        } finally {
            setLoadingBoardInvite(false);
        }
    };

    // Получение существующей ссылки для доски при открытии модального окна
    const fetchExistingBoardInviteLink = async (boardId) => {
        setLoadingBoardInvite(true);
        try {
            const userToken = getUserToken();
            let foundLink = false;
            
            // Проверяем последовательно наличие ссылок для разных ролей
            for (const role of Object.keys(INVITE_ACCESS_LEVELS)) {
                if (foundLink) break;
                
                try {
                    const response = await fetch(`${BACKEND_URL}/api/invites?boardId=${boardId}&role=${role}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${userToken}`
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        // Если ссылка найдена
                        if (data && data.token) {
                            foundLink = true;
                            setCurrentBoardInviteToken(data.token);
                            setExistingBoardLinkData(data);
                            
                            // Формируем полную ссылку
                            const inviteUrl = `${window.location.origin}/invite/${data.token}`;
                            setBoardGeneratedLink(inviteUrl);
                            
                            // Заполняем форму данными существующей ссылки
                            boardInviteForm.setFieldsValue({
                                role: data.accessLevel,
                                maxUsages: data.maxUsages,
                                expiresAt: data.expiresAt ? dayjs(data.expiresAt) : null
                            });
                            setSelectedBoardRole(data.accessLevel); // Обновляем выбранную роль
                            
                            // Проверяем, истекла ли ссылка
                            checkBoardLinkExpiration(data);
                            
                            // Выводим уведомление, что найдена существующая ссылка
                            message.info(`Найдена активная ссылка-приглашение с уровнем доступа "${getAccessLevelText(data.accessLevel)}"`);
                        }
                    } else if (response.status !== 404) {
                        // Обрабатываем ошибки, кроме 404 (нет ссылки)
                        const errorData = await response.json();
                        console.error(`Ошибка при проверке ссылки для роли ${role}:`, errorData.error);
                    }
                } catch (error) {
                    console.error(`Ошибка при проверке ссылки для роли ${role}:`, error);
                }
            }
            
            // Если после проверки всех ролей не найдена ни одна ссылка, выводим уведомление
            if (!foundLink) {
                message.info('Не найдено активных ссылок-приглашений для этой доски');
                
                // Устанавливаем начальную роль READ в форме
                boardInviteForm.setFieldsValue({
                    role: 'READ',
                    maxUsages: 1,
                    expiresAt: null
                });
            }
        } catch (error) {
            console.error('Ошибка при получении существующих ссылок-приглашений:', error);
            message.error(`Ошибка при получении ссылок: ${error.message}`);
        } finally {
            setLoadingBoardInvite(false);
        }
    };

    // Функция для проверки, истекла ли ссылка доски
    const checkBoardLinkExpiration = (linkData) => {
        if (!linkData) return;
        
        const now = new Date();
        
        // Проверка на истечение срока действия
        if (linkData.expiresAt && new Date(linkData.expiresAt) < now) {
            message.warning('Внимание! Срок действия этой ссылки уже истек.');
        }
        
        // Проверка на исчерпание количества использований
        if (linkData.maxUsages && linkData.usageCount >= linkData.maxUsages) {
            message.warning('Внимание! Эта ссылка достигла максимального количества использований.');
        }
    };

    // Функция для создания ссылки-приглашения для доски
    const handleCreateBoardInviteLink = async (values) => {
        try {
            setBoardGeneratingLink(true);
            const userToken = getUserToken();
            
            // Форматируем дату expiration с сохранением выбранного пользователем времени
            let expiresAtFormatted = null;
            if (values.expiresAt) {
                // Используем полный ISO формат, который сохраняет выбранное время
                expiresAtFormatted = values.expiresAt.format('YYYY-MM-DDTHH:mm:ss.SSS');
            }
            
            const payload = {
                boardId: parseInt(currentBoardId),
                role: values.role,
                expiresAt: expiresAtFormatted,
                maxUsages: values.maxUsages || null // Проверяем наличие значения maxUsages
            };
            
            const response = await fetch(`${BACKEND_URL}/api/invites`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Сохраняем токен текущей ссылки
            setCurrentBoardInviteToken(data.token);
            setExistingBoardLinkData(data);
            setSelectedBoardRole(data.accessLevel); // Обновляем выбранную роль
            
            // Создаем полную ссылку для приглашения
            const inviteUrl = `${window.location.origin}/invite/${data.token}`;
            setBoardGeneratedLink(inviteUrl);
            
            message.success('Ссылка-приглашение успешно создана');
        } catch (error) {
            console.error('Ошибка при создании ссылки-приглашения:', error);
            message.error('Ошибка при создании ссылки-приглашения');
        } finally {
            setBoardGeneratingLink(false);
        }
    };

    // Функция для обновления существующей ссылки-приглашения для доски
    const handleUpdateBoardInviteLink = async (values) => {
        try {
            setBoardGeneratingLink(true);
            const userToken = getUserToken();
            
            // Форматируем дату expiration с сохранением выбранного пользователем времени
            let expiresAtFormatted = null;
            if (values.expiresAt) {
                // Используем полный ISO формат, который сохраняет выбранное время
                expiresAtFormatted = values.expiresAt.format('YYYY-MM-DDTHH:mm:ss.SSS');
            }
            
            const payload = {
                role: values.role,
                expiresAt: expiresAtFormatted,
                maxUsages: values.maxUsages || null // Проверяем наличие значения maxUsages
            };
            
            const response = await fetch(`${BACKEND_URL}/api/invites/${currentBoardInviteToken}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Обновляем данные ссылки
            setExistingBoardLinkData(data);
            setSelectedBoardRole(data.accessLevel); // Обновляем выбранную роль
            
            message.success('Ссылка-приглашение успешно обновлена');
        } catch (error) {
            console.error('Ошибка при обновлении ссылки-приглашения:', error);
            message.error('Ошибка при обновлении ссылки-приглашения');
        } finally {
            setBoardGeneratingLink(false);
        }
    };

    // Функция для деактивации ссылки-приглашения для доски
    const handleDeactivateBoardInviteLink = async () => {
        try {
            setBoardGeneratingLink(true);
            const userToken = getUserToken();
            
            const response = await fetch(`${BACKEND_URL}/api/invites/${currentBoardInviteToken}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }
            
            // Сбрасываем состояния после деактивации
            setCurrentBoardInviteToken('');
            setBoardGeneratedLink('');
            setExistingBoardLinkData(null);
            boardInviteForm.resetFields();
            
            message.success('Ссылка-приглашение деактивирована');
        } catch (error) {
            console.error('Ошибка при деактивации ссылки-приглашения:', error);
            message.error('Ошибка при деактивации ссылки-приглашения');
        } finally {
            setBoardGeneratingLink(false);
        }
    };

    // Функция для копирования ссылки доски в буфер обмена
    const copyBoardLinkToClipboard = () => {
        navigator.clipboard.writeText(boardGeneratedLink)
            .then(() => {
                message.success('Ссылка скопирована в буфер обмена');
            })
            .catch(() => {
                message.error('Не удалось скопировать ссылку');
            });
    };
                            
                            return (
        <div style={{ background: 'white', padding: '24px' }}>
            <div>
                {/* Информация о проекте */}
                {projectInfo && (
                    <div style={{ marginBottom: 24 }}>
                        <Row align="middle" gutter={16}>
                            <Col>
                                <Avatar 
                                    size={64} 
                                    style={{ 
                                        backgroundColor: getColorFromId(projectInfo.id),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '24px'
                                    }}
                                >
                                    {projectInfo.name ? projectInfo.name.charAt(0).toUpperCase() : 'P'}
                                </Avatar>
                            </Col>
                            <Col flex="1">
                                <Title level={3} style={{ margin: 0 }}>{projectInfo.name}</Title>
                                {projectInfo.description && (
                                    <div>
                                        {descriptionVisible ? (
                                            <div>
                                                <Text style={{ whiteSpace: 'pre-wrap' }}>{projectInfo.description}</Text>
                                                <Button 
                                                    type="link" 
                                                    onClick={() => setDescriptionVisible(false)}
                                                    style={{ paddingLeft: 0 }}
                                                >
                                                    Скрыть описание
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button 
                                                type="link" 
                                                onClick={() => setDescriptionVisible(true)}
                                                style={{ paddingLeft: 0 }}
                                            >
                                                Показать описание
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </Col>
                            <Col>
                                <Space>
                                    <Button 
                                        icon={<SettingOutlined />} 
                                        onClick={() => setActiveTab('permissions')}
                                    >
                                        Управление доступом
                                    </Button>
                                    <Button 
                                        type="primary" 
                                        icon={<LinkOutlined />}
                                        onClick={showInviteLinkModal}
                                    >
                                        Создать ссылку-приглашение
                                    </Button>
                                </Space>
                            </Col>
                        </Row>
                        <Divider style={{ margin: '16px 0' }} />
                    </div>
                )}

                <Tabs activeKey={activeTab} onChange={setActiveTab}>
                    <TabPane tab="Доски" key="boards">
                        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                            <Button 
                                type="primary" 
                                icon={<PlusOutlined />} 
                                onClick={() => handleShowModal()}
                            >
                                Создать доску
                            </Button>
                            <Button 
                                icon={<ImportOutlined />} 
                                onClick={handleMiroLogin}
                            >
                                Импорт с Miro
                            </Button>
                        </div>

                        {/* Форма поиска досок */}
                        <Card 
                            title={<Text strong>Поиск досок</Text>} 
                            bordered={false} 
                            style={{ marginBottom: 16 }}
                            size="small"
                        >
                            <Form
                                form={searchForm}
                                layout="vertical"
                                onFinish={handleSearchBoards}
                            >
                                <Row gutter={16}>
                                    <Col xs={24} sm={12} md={8} lg={8}>
                                        <Form.Item 
                                            name="name" 
                                            label="Название доски"
                                        >
                                            <Input placeholder="Введите название доски" />
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
                                                    loading={searchLoading}
                                                    icon={<SearchOutlined />}
                                                >
                                                    Найти
                                                </Button>
                                                <Button 
                                                    onClick={resetBoardSearch} 
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
                            dataSource={boards}
                            pagination={{
                                onChange: (page) => {
                                    window.scrollTo(0, 0);
                                },
                                pageSize: 5,
                                position: 'bottom',
                                align: 'center',
                                showSizeChanger: true,
                                pageSizeOptions: ['5', '10', '20'],
                                showTotal: (total) => `Всего ${total} досок`
                            }}
                            renderItem={(board) => (
                                <List.Item 
                                    key={board.id}
                                    actions={getDirectBoardActions(board)}
                                    onClick={() => navigate(`/board/${board.id}`)}
                                    style={{ 
                                        cursor: 'pointer',
                                        padding: '16px',
                                        background: 'white',
                                        marginBottom: '8px',
                                        borderRadius: '8px',
                                        border: '1px solid #f0f0f0',
                                        transition: 'all 0.3s'
                                    }}
                                    className="board-list-item"
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <Avatar 
                                                style={{ 
                                                    backgroundColor: getColorFromId(board.id),
                                                display: 'flex',
                                                alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                {board.name.charAt(0).toUpperCase()}
                                            </Avatar>
                                        }
                                        title={
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span>{board.name}</span>
                                                <Tag color={ACCESS_LEVELS[board.accessLevel]?.color || 'default'}>
                                                    {ACCESS_LEVELS[board.accessLevel]?.label || board.accessLevel}
                                                </Tag>
                                            </div>
                                        }
                                        description={
                                            <Space direction="vertical" size={0}>
                                                <Text type="secondary">
                                                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                                                    Изменено: {formatDate(board.modifiedAt)} 
                                                    {board.modifiedBy ? ` пользователем ${board.modifiedBy.fullName}` : ''}
                                                </Text>
                                                <Text type="secondary">
                                                    <UserOutlined style={{ marginRight: 4 }} />
                                                    Владелец: {board.owner?.fullName || 'Неизвестно'}
                                                </Text>
                                            </Space>
                                        }
                                    />
                                </List.Item>
                            )}
                            locale={{ 
                                emptyText: error ? 
                                    <Text type="danger">{error}</Text> : 
                                    'Нет доступных досок. Создайте новую доску или импортируйте из Miro.'
                            }}
                        />
                    </TabPane>
                    <TabPane tab="Управление доступом" key="permissions">
                        <ProjectPermissions projectId={projectId} />
                    </TabPane>
                </Tabs>

            {/* Модальное окно для создания/редактирования локальной доски */}
                <Modal
                    title={editMode ? "Редактировать доску" : "Создать доску"}
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
                            rules={[{ required: true, message: 'Пожалуйста, введите название доски' }]}
                        >
                            <Input 
                                value={currentBoard.name}
                                onChange={(e) => setCurrentBoard({ ...currentBoard, name: e.target.value })}
                                placeholder="Введите название доски"
                            />
                        </Form.Item>
                        <Form.Item label="Описание">
                            <Input.TextArea 
                                rows={4} 
                                value={currentBoard.description}
                                onChange={(e) => setCurrentBoard({ ...currentBoard, description: e.target.value })}
                                placeholder="Введите описание доски (необязательно)"
                            />
                        </Form.Item>
                    </Form>
            </Modal>

            {/* Модальное окно для импорта досок из Miro */}
                <Modal
                    title="Импорт досок из Miro"
                    open={showMiroModal}
                    onCancel={() => setShowMiroModal(false)}
                    width={800}
                    footer={[
                        <Button key="cancel" onClick={() => setShowMiroModal(false)}>
                            Закрыть
                        </Button>,
                        <Button 
                            key="import" 
                            type="primary" 
                            onClick={handleImport}
                            disabled={selectedBoards.length === 0}
                        >
                            Импортировать выбранные доски ({selectedBoards.length})
                        </Button>
                    ]}
                >
                    {miroBoards.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px 0' }}>
                            <Text type="secondary">Нет досок для отображения</Text>
                        </div>
                    ) : (
                        <List
                            grid={{ gutter: 16, column: 2 }}
                            dataSource={miroBoards}
                            renderItem={(board) => {
                                const boardIdStr = String(board.id);
                                const isChecked = selectedBoards.includes(boardIdStr);
                                
                                return (
                                    <List.Item>
                                        <Card
                                            hoverable
                                            className={isChecked ? 'selected-card' : ''}
                                            style={{ 
                                                borderColor: isChecked ? '#1890ff' : '#f0f0f0',
                                                background: isChecked ? '#e6f7ff' : 'white' 
                                            }}
                                            onClick={() => toggleBoardSelection(boardIdStr)}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                                <Checkbox 
                                                    checked={isChecked}
                                                    onChange={() => toggleBoardSelection(boardIdStr)}
                                                    style={{ marginRight: 12 }}
                                                />
                                                <div>
                                                    <Text strong>{board.name}</Text>
                                                    <div>
                                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                                            ID доски: {board.id}
                                                        </Text>
                                                    </div>
                                                    {board.alreadyImported && (
                                                        <div style={{ color: 'red', marginTop: 8, fontSize: 12 }}>
                                                            <ExclamationCircleFilled style={{ marginRight: 5 }} />
                                                            Внимание! Доска будет перезаписана
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    </List.Item>
                                );
                            }}
                        />
                    )}
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
                                            onClick={() => fetchInviteLinkForRole(level.value)}
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
                                        <Option key={level.value} value={level.value}>
                                            {level.label}
                                        </Option>
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

                {/* Модальное окно для создания ссылки-приглашения для доски */}
                <Modal
                    title={<div><LinkOutlined /> {existingBoardLinkData ? "Управление ссылкой-приглашением" : "Создать ссылку-приглашение"}</div>}
                    open={boardInviteLinkModalVisible}
                    onCancel={() => setBoardInviteLinkModalVisible(false)}
                    footer={null}
                    destroyOnClose
                >
                    {loadingBoardInvite ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Загрузка...</span>
                            </div>
                            <p style={{ marginTop: '10px' }}>Проверяем наличие активных ссылок...</p>
                        </div>
                    ) : (
                        <Form
                            form={boardInviteForm}
                            layout="vertical"
                            onFinish={currentBoardInviteToken ? handleUpdateBoardInviteLink : handleCreateBoardInviteLink}
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
                                            type={selectedBoardRole === level.value ? "primary" : "default"}
                                            size="small"
                                            onClick={() => fetchBoardInviteLinkForRole(currentBoardId, level.value)}
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
                                    onChange={(value) => setSelectedBoardRole(value)}
                                >
                                    {Object.values(INVITE_ACCESS_LEVELS).map(level => (
                                        <Option key={level.value} value={level.value}>
                                            {level.label}
                                        </Option>
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
                            
                            {existingBoardLinkData && (
                                <div style={{ marginBottom: 16 }}>
                                    <Text type="secondary">Статистика ссылки:</Text>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                                        <div>
                                            <Text>Использований: </Text>
                                            <Text strong>
                                                {existingBoardLinkData.usageCount}
                                                {existingBoardLinkData.maxUsages ? `/${existingBoardLinkData.maxUsages}` : ' (без ограничений)'}
                                            </Text>
                                        </div>
                                        {existingBoardLinkData.expiresAt && (
                                            <div>
                                                <Text>Истекает: </Text>
                                                <Text strong>{dayjs(existingBoardLinkData.expiresAt).format('DD.MM.YYYY HH:mm')}</Text>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Предупреждения о состоянии ссылки */}
                                    {existingBoardLinkData.expiresAt && new Date(existingBoardLinkData.expiresAt) < new Date() && (
                                        <div style={{ 
                                            marginTop: 8, 
                                            padding: '8px 12px', 
                                            backgroundColor: '#fff2f0', 
                                            border: '1px solid #ffccc7',
                                            borderRadius: 4
                                        }}>
                                            <Text type="danger">
                                                <ExclamationCircleFilled style={{ marginRight: 8 }} />
                                                Срок действия ссылки истёк {dayjs(existingBoardLinkData.expiresAt).format('DD.MM.YYYY')}
                                            </Text>
                                        </div>
                                    )}
                                    
                                    {existingBoardLinkData.maxUsages && existingBoardLinkData.usageCount >= existingBoardLinkData.maxUsages && (
                                        <div style={{ 
                                            marginTop: 8, 
                                            padding: '8px 12px', 
                                            backgroundColor: '#fff2f0', 
                                            border: '1px solid #ffccc7',
                                            borderRadius: 4
                                        }}>
                                            <Text type="danger">
                                                <ExclamationCircleFilled style={{ marginRight: 8 }} />
                                                Достигнуто максимальное количество использований ({existingBoardLinkData.maxUsages})
                                            </Text>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {boardGeneratedLink ? (
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
                                        <Text style={{ flex: 1 }} ellipsis={{ tooltip: boardGeneratedLink }}>
                                            {boardGeneratedLink}
                                        </Text>
                                        <Tooltip title="Копировать ссылку">
                                            <Button 
                                                type="text" 
                                                icon={<CopyOutlined />} 
                                                onClick={copyBoardLinkToClipboard} 
                                            />
                                        </Tooltip>
                                    </div>
                                    
                                    <div style={{ marginTop: 24 }}>
                                        {existingBoardLinkData ? (
                                            <>
                                                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                                    <Popconfirm
                                                        title="Деактивировать ссылку-приглашение"
                                                        description="Эта ссылка станет недействительной и не сможет быть использована. Вы уверены?"
                                                        onConfirm={handleDeactivateBoardInviteLink}
                                                        okText="Да, деактивировать"
                                                        cancelText="Отмена"
                                                    >
                                                        <Button 
                                                            danger
                                                            loading={boardGeneratingLink}
                                                        >
                                                            Деактивировать ссылку
                                                        </Button>
                                                    </Popconfirm>
                                                    
                                                    <Button 
                                                        type="primary" 
                                                        htmlType="submit" 
                                                        loading={boardGeneratingLink}
                                                    >
                                                        Обновить ссылку
                                                    </Button>
                                                </Space>
                                            </>
                                        ) : (
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Button onClick={() => setBoardInviteLinkModalVisible(false)}>
                                                    Закрыть
                                                </Button>
                                                <Button type="primary" onClick={() => {
                                                    setBoardGeneratedLink('');
                                                    boardInviteForm.resetFields();
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
                                        loading={boardGeneratingLink}
                                        block
                                    >
                                        {existingBoardLinkData ? "Обновить ссылку" : "Создать ссылку"}
                                    </Button>
                                </Form.Item>
                            )}
                        </Form>
                    )}
                </Modal>

                {/* Добавляем стили для выбранных карточек в модальном окне импорта */}
                <style jsx>{`
                    .selected-card {
                        box-shadow: 0 0 0 2px #1890ff;
                    }
                    .board-list-item:hover {
                        background-color: #f8f8f8;
                    }
                `}</style>

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
            </div>
        </div>
    );
}

export default ProjectPage;
