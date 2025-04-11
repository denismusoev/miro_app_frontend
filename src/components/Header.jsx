import React from 'react';
import { Layout, Menu, Button, Avatar, Space, Typography, Dropdown } from 'antd';
import { 
    UserOutlined, 
    LogoutOutlined, 
    LoginOutlined, 
    ProjectOutlined, 
    HomeOutlined,
    SettingOutlined
} from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const { Header } = Layout;
const { Title, Text } = Typography;

const AppHeader = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Получаем информацию об авторизованном пользователе
    const isAuthenticated = localStorage.getItem('token') !== null;
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Обработчик выхода
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };
    
    // Определяем активный элемент меню на основе текущего пути
    const getSelectedKey = () => {
        const path = location.pathname;
        if (path === '/') return 'home';
        if (path.includes('/project')) return 'projects';
        if (path.includes('/board')) return 'projects';
        return '';
    };
    
    // Выпадающее меню для профиля
    const profileMenu = {
        items: [
            {
                key: 'profile',
                icon: <UserOutlined />,
                label: 'Мой профиль',
                onClick: () => navigate('/profile')
            },
            {
                key: 'settings',
                icon: <SettingOutlined />,
                label: 'Настройки',
                onClick: () => navigate('/settings')
            },
            {
                type: 'divider'
            },
            {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: 'Выйти',
                danger: true,
                onClick: handleLogout
            }
        ]
    };

    return (
        <Header style={{ 
            background: '#ffffff', 
            padding: '0 24px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            height: '60px',
            borderBottom: '1px solid #f0f0f0'
        }}>
            {/* Логотип */}
            <Link 
                to="/"
                style={{ 
                    display: 'flex', 
                    alignItems: 'center'
                }}
            >
                <Title level={4} style={{ 
                    margin: 0, 
                    fontWeight: '600',
                    color: '#333',
                    letterSpacing: '-0.5px'
                }}>
                    Miro
                </Title>
            </Link>
            
            {/* Навигация */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <Menu 
                    mode="horizontal" 
                    selectedKeys={[getSelectedKey()]}
                    style={{ 
                        border: 'none', 
                        minWidth: 300,
                        background: 'transparent',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}
                    items={[
                        {
                            key: 'home',
                            icon: <HomeOutlined />,
                            label: <Link to="/">Главная</Link>
                        },
                        {
                            key: 'projects',
                            icon: <ProjectOutlined />,
                            label: <Link to="/projects">Проекты</Link>
                        }
                    ]}
                />
            </div>
            
            {/* Профиль и авторизация */}
            <Space size="large">
                {isAuthenticated ? (
                    <Dropdown menu={profileMenu} placement="bottomRight" trigger={['click']}>
                        <Button 
                            type="text" 
                            icon={<UserOutlined style={{ fontSize: '18px' }}/>}
                            style={{ 
                                padding: '8px',
                                height: 'auto'
                            }}
                        />
                    </Dropdown>
                ) : (
                    <Space>
                        <Button 
                            type="primary" 
                            onClick={() => navigate('/login')}
                            style={{
                                borderRadius: '4px',
                                height: '32px'
                            }}
                        >
                            Войти
                        </Button>
                        <Button 
                            onClick={() => navigate('/register')}
                            style={{
                                borderRadius: '4px',
                                height: '32px'
                            }}
                        >
                            Регистрация
                        </Button>
                    </Space>
                )}
            </Space>
        </Header>
    );
};

export default AppHeader; 