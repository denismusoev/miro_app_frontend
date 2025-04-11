import React, { useState, useEffect } from 'react';
import { 
    Table, Space, Button, Modal, Form, Select, Input, 
    Typography, Tag, Tooltip, Popconfirm, message, Card,
    Drawer, DatePicker, InputNumber, Divider
} from 'antd';
import { 
    UserOutlined, EditOutlined, DeleteOutlined, 
    PlusOutlined, KeyOutlined, InfoCircleOutlined, 
    LockOutlined, UnlockOutlined, CrownOutlined,
    MenuOutlined, SettingOutlined, SaveOutlined,
    ExportOutlined, DownloadOutlined, ShareAltOutlined,
    LinkOutlined, CopyOutlined, ExclamationCircleFilled
} from '@ant-design/icons';
import { 
    getBoardParticipants, 
    getCurrentUserBoardAccess, 
    addUserToBoard,
    updateUserBoardPermission,
    removeUserFromBoard,
    getInvite,
    createInvite,
    updateInvite,
    deactivateInvite
} from '../utils/api';
import { AccessLevel, BoardPermissionUpdateDto } from '../model/PermissionModels';
import './BoardPermissionsPanel.css'; // Добавим отдельный файл стилей
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ru';
import { toPng } from 'html-to-image';
import { getNodesBounds, getViewportForBounds } from '@xyflow/react';

// Инициализация плагина relativeTime для форматирования дат
dayjs.extend(relativeTime);
dayjs.locale('ru');

const { Title, Text } = Typography;
const { Option } = Select;

// Константы для ролей доступа в приглашениях
const INVITE_ACCESS_LEVELS = {
    READ: { label: 'Чтение', value: 'READ', color: 'blue' },
    WRITE: { label: 'Редактирование', value: 'WRITE', color: 'green' },
    ADMIN: { label: 'Администратор', value: 'ADMIN', color: 'purple' }
};

const BoardPermissions = ({ boardId }) => {
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userAccess, setUserAccess] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentParticipant, setCurrentParticipant] = useState(null);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();

    // Состояния для модального окна создания ссылки-приглашения для доски
    const [shareLinkModalVisible, setShareLinkModalVisible] = useState(false);
    const [inviteForm] = Form.useForm();
    const [generatedLink, setGeneratedLink] = useState('');
    const [generatingLink, setGeneratingLink] = useState(false);
    const [currentInviteToken, setCurrentInviteToken] = useState('');
    const [loadingInvite, setLoadingInvite] = useState(false);
    const [existingLinkData, setExistingLinkData] = useState(null);
    const [selectedRole, setSelectedRole] = useState('READ');

    // Загружаем список участников и права текущего пользователя
    useEffect(() => {
        loadData();
    }, [boardId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [participantsResponse, accessResponse] = await Promise.all([
                getBoardParticipants(boardId),
                getCurrentUserBoardAccess(boardId)
            ]);
            
            setParticipants(participantsResponse.data);
            setUserAccess(accessResponse.data);
        } catch (error) {
            console.error('Error fetching board permissions:', error);
            message.error('Не удалось загрузить информацию о правах доступа');
        } finally {
            setLoading(false);
        }
    };

    // Добавляем пользователя на доску
    const handleAddUser = () => {
        setEditMode(false);
        setCurrentParticipant(null);
        form.resetFields();
        setModalVisible(true);
    };

    // Редактируем права пользователя
    const handleEditUser = (participant) => {
        setEditMode(true);
        setCurrentParticipant(participant);
        form.setFieldsValue({
            email: participant.email || '',
            role: participant.role
        });
        setModalVisible(true);
    };

    // Сохраняем изменения (добавление или обновление)
    const handleSaveUser = async (values) => {
        try {
            if (editMode) {
                // Обновление прав существующего участника
                const updateDto = new BoardPermissionUpdateDto({
                    email: currentParticipant.email,
                    role: values.role
                });
                
                await updateUserBoardPermission(boardId, updateDto);
                message.success('Права пользователя обновлены');
            } else {
                // Добавление нового участника
                const updateDto = new BoardPermissionUpdateDto({
                    email: values.email,
                    role: values.role
                });
                
                await addUserToBoard(boardId, updateDto);
                message.success('Пользователь добавлен на доску');
            }
            
            setModalVisible(false);
            loadData(); // Перезагружаем данные
        } catch (error) {
            console.error('Error saving user permissions:', error);
            message.error('Не удалось сохранить права пользователя');
        }
    };

    // Удаляем пользователя из доски
    const handleRemoveUser = async (email) => {
        try {
            await removeUserFromBoard(boardId, email);
            message.success('Пользователь удален с доски');
            loadData(); // Перезагружаем данные
        } catch (error) {
            console.error('Error removing user:', error);
            message.error('Не удалось удалить пользователя с доски');
        }
    };

    // Функция для получения цвета тега в зависимости от уровня доступа
    const getAccessLevelColor = (accessLevel) => {
        switch(accessLevel) {
            case AccessLevel.OWNER:
                return 'gold';
            case AccessLevel.ADMIN:
                return 'purple';
            case AccessLevel.WRITE:
                return 'green';
            case AccessLevel.READ:
                return 'blue';
            case AccessLevel.DENIED:
                return 'red';
            default:
                return 'default';
        }
    };

    // Функция для получения текста уровня доступа
    const getAccessLevelText = (accessLevel) => {
        switch(accessLevel) {
            case AccessLevel.OWNER:
                return 'Владелец';
            case AccessLevel.ADMIN:
                return 'Администратор';
            case AccessLevel.WRITE:
                return 'Редактирование';
            case AccessLevel.READ:
                return 'Чтение';
            case AccessLevel.DENIED:
                return 'Запрещено';
            default:
                return accessLevel;
        }
    };

    // Колонки таблицы
    const columns = [
        {
            title: 'Пользователь',
            dataIndex: 'login',
            key: 'login',
            render: (text, record) => (
                <Space>
                    <UserOutlined />
                    <span>
                        {record.firstName && record.lastName 
                            ? `${record.firstName} ${record.lastName}` 
                            : ("Неизвестно")}
                    </span>
                    {record.isOwner && (
                        <Tooltip title="Владелец доски">
                            <CrownOutlined style={{ color: 'gold' }} />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Права доступа',
            dataIndex: 'role',
            key: 'role',
            render: (role) => (
                <Tag color={getAccessLevelColor(role)}>
                    {getAccessLevelText(role)}
                </Tag>
            ),
        },
        {
            title: 'Действия',
            key: 'action',
            render: (_, record) => {
                // Показываем действия только если текущий пользователь имеет права на управление правами
                // и не пытается редактировать владельца или самого себя
                const canManage = userAccess?.canManageRights === true && !record.isOwner;
                
                // Не показываем действия для админов, если текущий пользователь админ
                // Также не показываем действия для самого себя (сравнение по email)
                const isCurrentUser = record.email === localStorage.getItem('userEmail');
                const isAdminModifyingAdmin = userAccess?.accessLevel === AccessLevel.ADMIN && record.role === AccessLevel.ADMIN;
                
                return (canManage && !isCurrentUser && !isAdminModifyingAdmin) ? (
                    <Space size="small">
                        <Button 
                            type="text" 
                            icon={<EditOutlined />} 
                            onClick={() => handleEditUser(record)}
                        />
                        <Popconfirm
                            title="Удалить пользователя с доски?"
                            description="Вы уверены, что хотите удалить этого пользователя с доски?"
                            onConfirm={() => handleRemoveUser(record.email)}
                            okText="Да"
                            cancelText="Нет"
                        >
                            <Button 
                                type="text" 
                                danger 
                                icon={<DeleteOutlined />} 
                            />
                        </Popconfirm>
                    </Space>
                ) : null;
            },
        },
    ];

    // Заглушки для функций управления доской
    const handleSaveBoard = () => {
        message.success('Доска сохранена');
    };

    const handleExportBoard = () => {
        // Создаем собственное событие для экспорта доски
        // Это событие будет перехвачено в BoardPageDefault
        const exportEvent = new CustomEvent('exportBoard', {
            detail: {
                format: 'png',
                timestamp: new Date().toISOString()
            }
        });
        
        document.dispatchEvent(exportEvent);
    };
    
    // Функция для скачивания изображения
    const downloadImage = (dataUrl) => {
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.setAttribute('download', `board-export-${timestamp}.png`);
        a.setAttribute('href', dataUrl);
        a.click();
        
        message.success('Доска успешно экспортирована');
    };

    const handleShareBoard = () => {
        setShareLinkModalVisible(true);
        inviteForm.resetFields();
        setGeneratedLink('');
        setCurrentInviteToken('');
        setExistingLinkData(null);
        setSelectedRole('READ'); // Сбрасываем выбранную роль к значению по умолчанию
        fetchExistingInviteLink();
    };

    // Получение существующей ссылки для конкретной роли доски
    const fetchInviteLinkForRole = async (role) => {
        setLoadingInvite(true);
        setSelectedRole(role); // Обновляем выбранную роль при переключении
        try {
            const response = await getInvite({ boardId, role });
            const data = response.data;
            
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
            
            // Проверяем, является ли ошибка 404 (Not Found)
            if (error.response && error.response.status === 404) {
                // Если ссылка не найдена (это нормальное состояние)
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
                // Другие ошибки обрабатываем как ошибки
                message.error(`Ошибка при получении ссылки: ${error.message}`);
            }
        } finally {
            setLoadingInvite(false);
        }
    };

    // Получение существующей ссылки при открытии модального окна
    const fetchExistingInviteLink = async () => {
        setLoadingInvite(true);
        try {
            let foundLink = false;
            
            // Проверяем последовательно наличие ссылок для разных ролей
            for (const role of Object.keys(INVITE_ACCESS_LEVELS)) {
                if (foundLink) break;
                
                try {
                    const response = await getInvite({ boardId, role });
                    const data = response.data;
                    
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
                } catch (error) {
                    // Проверяем, является ли ошибка 404 (Not Found)
                    if (error.response && error.response.status === 404) {
                        // Это нормальная ситуация - для данной роли просто нет ссылки
                        console.log(`Для роли ${role} нет активных ссылок-приглашений`);
                    } else {
                        console.error(`Ошибка при проверке ссылки для роли ${role}:`, error);
                    }
                }
            }
            
            // Если после проверки всех ролей не найдена ни одна ссылка, выводим уведомление
            if (!foundLink) {
                message.info('Не найдено активных ссылок-приглашений для этой доски');
                
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
            
            // Форматируем дату expiration с сохранением выбранного пользователем времени
            let expiresAtFormatted = null;
            if (values.expiresAt) {
                // Используем полный ISO формат, который сохраняет выбранное время
                expiresAtFormatted = values.expiresAt.format('YYYY-MM-DDTHH:mm:ss.SSS');
            }
            
            const payload = {
                boardId: parseInt(boardId),
                role: values.role,
                expiresAt: expiresAtFormatted,
                maxUsages: values.maxUsages || null // Проверяем наличие значения maxUsages
            };
            
            const response = await createInvite(payload);
            const data = response.data;
            
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
            
            const response = await updateInvite(currentInviteToken, payload);
            const data = response.data;
            
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

    // Функция для перехода на главную страницу
    const handleLogoClick = () => {
        navigate('/');
    };

    // Если нет прав на просмотр - показываем сообщение
    if (userAccess && !userAccess.canManageRights && !userAccess.canView) {
        return (
            <div className="board-sidebar">
                <div className="logo-container" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
                    <span className="logo-text">Miro</span>
                </div>
                <div className="sidebar-actions">
                    <Button 
                        icon={<SettingOutlined />} 
                        className="sidebar-button" 
                        disabled 
                        title="У вас нет прав для просмотра участников доски" 
                    />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="board-sidebar">
                <div className="logo-container" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
                    <span className="logo-text">Miro</span>
                </div>
                <div className="sidebar-actions">
                    {/* Кнопка сохранения доски */}
                    <Button
                        color="default"
                        variant="link"
                        icon={<SaveOutlined />} 
                        className="sidebar-button" 
                        onClick={handleSaveBoard}
                        title="Сохранить доску"
                    />
                    
                    {/* Кнопка экспорта доски */}
                    <Button
                        color="default"
                        variant="link"
                        icon={<ExportOutlined />} 
                        className="sidebar-button" 
                        onClick={handleExportBoard}
                        title="Экспортировать доску"
                    />
                    
                    {/* Разделитель */}
                    <div className="sidebar-divider"></div>
                    
                    {/* Кнопка управления доступом */}
                    <Button
                        color="default"
                        variant="link"
                        icon={<MenuOutlined />} 
                        className="sidebar-button" 
                        onClick={() => setDrawerVisible(true)}
                        title="Управление доступом"
                    />
                    
                    {/* Кнопка поделиться */}
                    <Button
                        color="default"
                        variant="link"
                        icon={<ShareAltOutlined />} 
                        className="sidebar-button" 
                        onClick={handleShareBoard}
                        title="Поделиться доской"
                        // style={{ color: '#2F80ED' }}
                    />
                </div>
            </div>

            <Drawer
                title={
                    <Space>
                        <KeyOutlined />
                        <span>Управление доступом к доске</span>
                    </Space>
                }
                placement="right"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                width={600}
                extra={
                    userAccess?.canManageRights ? (
                        <Button 
                            type="primary" 
                            icon={<PlusOutlined />} 
                            onClick={handleAddUser}
                        >
                            Добавить пользователя
                        </Button>
                    ) : null
                }
            >
                <Table
                    dataSource={participants}
                    columns={columns}
                    rowKey="userId"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: 'Нет участников' }}
                />
            </Drawer>

            {/* Модальное окно для добавления/редактирования участников */}
            <Modal
                title={editMode ? "Редактировать права доступа" : "Добавить пользователя на доску"}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSaveUser}
                >
                    {!editMode && (
                        <Form.Item
                            name="email"
                            label="Email пользователя"
                            rules={[{ required: true, message: 'Пожалуйста, введите email пользователя' }]}
                        >
                            <Input placeholder="Введите email пользователя" />
                        </Form.Item>
                    )}

                    <Form.Item
                        name="role"
                        label="Уровень доступа"
                        rules={[{ required: true, message: 'Пожалуйста, выберите уровень доступа' }]}
                        initialValue={AccessLevel.READ}
                    >
                        <Select placeholder="Выберите уровень доступа">
                            <Option value={AccessLevel.ADMIN}>Администратор</Option>
                            <Option value={AccessLevel.WRITE}>Редактирование</Option>
                            <Option value={AccessLevel.READ}>Чтение</Option>
                            <Option value={AccessLevel.DENIED}>Запрещено</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button onClick={() => setModalVisible(false)}>
                                Отмена
                            </Button>
                            <Button type="primary" htmlType="submit">
                                {editMode ? 'Сохранить' : 'Добавить'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Модальное окно для создания ссылки-приглашения */}
            <Modal
                title={<div><LinkOutlined /> {existingLinkData ? "Управление ссылкой-приглашением" : "Создать ссылку-приглашение"}</div>}
                open={shareLinkModalVisible}
                onCancel={() => setShareLinkModalVisible(false)}
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
                                            <Button onClick={() => setShareLinkModalVisible(false)}>
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
        </>
    );
};

export default BoardPermissions; 