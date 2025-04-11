import React, { useState, useEffect } from 'react';
import { 
    Table, Space, Button, Modal, Form, Select, Input, 
    Typography, Tag, Tooltip, Popconfirm, message, Card
} from 'antd';
import { 
    UserOutlined, EditOutlined, DeleteOutlined, 
    PlusOutlined, KeyOutlined, InfoCircleOutlined, 
    LockOutlined, UnlockOutlined, CrownOutlined 
} from '@ant-design/icons';
import { 
    getProjectParticipants, 
    getCurrentUserProjectAccess, 
    addUserToProject,
    updateUserProjectPermission,
    removeUserFromProject
} from '../utils/api';
import { AccessLevel, ProjectPermissionUpdateDto } from '../model/PermissionModels';

const { Title, Text } = Typography;
const { Option } = Select;

const ProjectPermissions = ({ projectId }) => {
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userAccess, setUserAccess] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentParticipant, setCurrentParticipant] = useState(null);
    const [form] = Form.useForm();

    // Загружаем список участников и права текущего пользователя
    useEffect(() => {
        loadData();
    }, [projectId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [participantsResponse, accessResponse] = await Promise.all([
                getProjectParticipants(projectId),
                getCurrentUserProjectAccess(projectId)
            ]);
            
            setParticipants(participantsResponse.data);
            setUserAccess(accessResponse.data);
        } catch (error) {
            console.error('Error fetching project permissions:', error);
            message.error('Не удалось загрузить информацию о правах доступа');
        } finally {
            setLoading(false);
        }
    };

    // Добавляем пользователя в проект
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
                const updateDto = new ProjectPermissionUpdateDto({
                    email: currentParticipant.email,
                    role: values.role
                });
                
                await updateUserProjectPermission(projectId, updateDto);
                message.success('Права пользователя обновлены');
            } else {
                // Добавление нового участника
                const updateDto = new ProjectPermissionUpdateDto({
                    email: values.email,
                    role: values.role
                });
                
                await addUserToProject(projectId, updateDto);
                message.success('Пользователь добавлен в проект');
            }
            
            setModalVisible(false);
            loadData(); // Перезагружаем данные
        } catch (error) {
            console.error('Error saving user permissions:', error);
            message.error('Не удалось сохранить права пользователя');
        }
    };

    // Удаляем пользователя из проекта
    const handleRemoveUser = async (email) => {
        try {
            await removeUserFromProject(projectId, email);
            message.success('Пользователь удален из проекта');
            loadData(); // Перезагружаем данные
        } catch (error) {
            console.error('Error removing user:', error);
            message.error('Не удалось удалить пользователя из проекта');
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
                            : (record.firstName || record.lastName || record.login || record.email)}
                    </span>
                    {record.isOwner && (
                        <Tooltip title="Владелец проекта">
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
                const isAdminModifyingAdmin = userAccess?.accessLevel === AccessLevel.ADMIN && record.role === AccessLevel.ADMIN;
                
                return (canManage && !isAdminModifyingAdmin) ? (
                    <Space size="small">
                        <Button 
                            type="text" 
                            icon={<EditOutlined />} 
                            onClick={() => handleEditUser(record)}
                        />
                        <Popconfirm
                            title="Удалить пользователя из проекта?"
                            description="Вы уверены, что хотите удалить этого пользователя из проекта?"
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

    // Если нет прав на просмотр - показываем сообщение
    if (userAccess && !userAccess.canManageRights && !userAccess.canView) {
        return (
            <Card>
                <Text type="danger">
                    <LockOutlined /> У вас нет прав для просмотра участников проекта
                </Text>
            </Card>
        );
    }

    return (
        <div className="project-permissions">
            <Card
                title={
                    <Space>
                        <KeyOutlined />
                        <span>Управление доступом</span>
                    </Space>
                }
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
            </Card>

            <Modal
                title={editMode ? "Редактировать права доступа" : "Добавить пользователя в проект"}
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
        </div>
    );
};

export default ProjectPermissions; 