import React, { useState, useEffect } from 'react';
import { 
    Card, 
    Form, 
    Input, 
    Button, 
    Typography, 
    Row, 
    Col, 
    Divider, 
    message, 
    Avatar,
    Space 
} from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SaveOutlined } from '@ant-design/icons';
import { getCurrentUser, updateUserProfile } from '../utils/api';

const { Title, Text } = Typography;

const ProfilePage = () => {
    const [form] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [activeTabKey, setActiveTabKey] = useState('profile');

    // Обработчик изменения активного таба
    const onTabChange = (key) => {
        setActiveTabKey(key);
    };

    // Загрузка данных пользователя
    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            try {
                const response = await getCurrentUser();
                const userData = response.data;
                setUser(userData);
                
                // Заполняем форму данными пользователя
                form.setFieldsValue({
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    middleName: userData.middleName || '',
                    email: userData.email || '',
                });
            } catch (error) {
                console.error('Ошибка при загрузке данных пользователя:', error);
                message.error('Не удалось загрузить данные профиля');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [form]);

    // Обработчик отправки формы обновления профиля
    const handleSubmit = async (values) => {
        setUpdating(true);
        try {
            await updateUserProfile(values);
            message.success('Профиль успешно обновлен');
            
            // Обновляем информацию о пользователе в localStorage
            const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
            const updatedUserInfo = {
                ...userInfo,
                firstName: values.firstName,
                lastName: values.lastName,
                middleName: values.middleName,
                email: values.email
            };
            localStorage.setItem('user', JSON.stringify(updatedUserInfo));
            
            // Обновляем состояние пользователя
            setUser({
                ...user,
                ...values
            });
        } catch (error) {
            console.error('Ошибка при обновлении профиля:', error);
            
            if (error.response && error.response.data && error.response.data.error) {
                message.error(error.response.data.error);
            } else {
                message.error('Не удалось обновить профиль');
            }
        } finally {
            setUpdating(false);
        }
    };

    // Обработчик отправки формы смены пароля
    const handlePasswordChange = async (values) => {
        setUpdating(true);
        try {
            await updateUserProfile({
                currentPassword: values.currentPassword,
                newPassword: values.newPassword
            });
            message.success('Пароль успешно изменен');
            passwordForm.resetFields(['currentPassword', 'newPassword', 'confirmPassword']);
        } catch (error) {
            console.error('Ошибка при смене пароля:', error);
            
            if (error.response && error.response.data && error.response.data.error) {
                message.error(error.response.data.error);
            } else {
                message.error('Не удалось изменить пароль');
            }
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '50px' }}>Загрузка...</div>;
    }

    return (
        <div style={{ padding: '24px' }}>
            <Row gutter={[24, 24]}>
                <Col xs={24} md={8}>
                    <Card bordered={false}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Avatar 
                                size={100} 
                                icon={<UserOutlined />} 
                                style={{ backgroundColor: '#1890ff', marginBottom: '16px' }} 
                            />
                            <Title level={3}>{user?.login || 'Пользователь'}</Title>
                            <Space direction="vertical" align="center">
                                <Text>{user?.firstName} {user?.middleName} {user?.lastName}</Text>
                                <Text type="secondary">{user?.email}</Text>
                            </Space>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} md={16}>
                    <Card 
                        bordered={false} 
                        activeTabKey={activeTabKey}
                        onTabChange={onTabChange}
                        tabList={[
                            {
                                key: 'profile',
                                tab: 'Основная информация',
                            },
                            {
                                key: 'password',
                                tab: 'Сменить пароль',
                            }
                        ]}
                    >
                        {activeTabKey === 'profile' && (
                            <div>
                                <Title level={4}>Редактирование профиля</Title>
                                <Divider />
                                <Form
                                    form={form}
                                    layout="vertical"
                                    onFinish={handleSubmit}
                                >
                                    <Row gutter={16}>
                                        <Col span={8}>
                                            <Form.Item
                                                name="lastName"
                                                label="Фамилия"
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: 'Пожалуйста, введите фамилию!',
                                                    },
                                                ]}
                                            >
                                                <Input prefix={<UserOutlined />} placeholder="Введите фамилию" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item
                                                name="firstName"
                                                label="Имя"
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: 'Пожалуйста, введите имя!',
                                                    },
                                                ]}
                                            >
                                                <Input prefix={<UserOutlined />} placeholder="Введите имя" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item
                                                name="middleName"
                                                label="Отчество"
                                            >
                                                <Input prefix={<UserOutlined />} placeholder="Введите отчество" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Form.Item
                                        name="email"
                                        label="Email"
                                        rules={[
                                            {
                                                type: 'email',
                                                message: 'Введите корректный email!',
                                            }
                                        ]}
                                    >
                                        <Input prefix={<MailOutlined />} placeholder="Введите email" />
                                    </Form.Item>
                                    <Form.Item>
                                        <Button 
                                            type="primary" 
                                            htmlType="submit" 
                                            loading={updating}
                                            icon={<SaveOutlined />}
                                        >
                                            Сохранить изменения
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </div>
                        )}

                        {activeTabKey === 'password' && (
                            <div>
                                <Title level={4}>Смена пароля</Title>
                                <Divider />
                                <Form
                                    form={passwordForm}
                                    layout="vertical"
                                    onFinish={handlePasswordChange}
                                >
                                    <Form.Item
                                        name="currentPassword"
                                        label="Текущий пароль"
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Введите текущий пароль!',
                                            },
                                        ]}
                                    >
                                        <Input.Password prefix={<LockOutlined />} placeholder="Введите текущий пароль" />
                                    </Form.Item>
                                    <Form.Item
                                        name="newPassword"
                                        label="Новый пароль"
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Введите новый пароль!',
                                            },
                                            {
                                                min: 6,
                                                message: 'Пароль должен содержать минимум 6 символов',
                                            },
                                        ]}
                                    >
                                        <Input.Password prefix={<LockOutlined />} placeholder="Введите новый пароль" />
                                    </Form.Item>
                                    <Form.Item
                                        name="confirmPassword"
                                        label="Подтверждение пароля"
                                        dependencies={['newPassword']}
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Подтвердите новый пароль!',
                                            },
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    if (!value || getFieldValue('newPassword') === value) {
                                                        return Promise.resolve();
                                                    }
                                                    return Promise.reject(new Error('Пароли не совпадают!'));
                                                },
                                            }),
                                        ]}
                                    >
                                        <Input.Password prefix={<LockOutlined />} placeholder="Подтвердите новый пароль" />
                                    </Form.Item>
                                    <Form.Item>
                                        <Button 
                                            type="primary" 
                                            htmlType="submit" 
                                            loading={updating}
                                            icon={<LockOutlined />}
                                        >
                                            Сменить пароль
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default ProfilePage; 