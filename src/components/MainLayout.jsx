import React, { useState, useEffect } from 'react';
import { 
  DashboardOutlined,
  ProjectOutlined,
  TeamOutlined,
  UserOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { Layout, Menu, theme, Avatar, Divider, Typography, Button, Space, Tooltip, Breadcrumb } from 'antd';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const { Header, Content, Sider } = Layout;
const { Text, Title } = Typography;

// Функция для создания элементов меню
function getItem(label, key, icon, children, type) {
  return {
    key,
    icon,
    children,
    label,
    type,
  };
}

// Функция для получения пути в формате breadcrumb на основе текущего URL
const getBreadcrumbItems = (pathname) => {
    const paths = pathname.split('/').filter(path => path);
    
    // Если находимся на главной странице
    if (paths.length === 0) {
        return [{ title: 'Главная', path: '/' }];
    }
    
    const breadcrumbItems = [{ title: 'Главная', path: '/' }];
    
    let currentPath = '';
    
    paths.forEach((path, index) => {
        currentPath += `/${path}`;
        
        let title = path.charAt(0).toUpperCase() + path.slice(1);
        
        // Специальные правила для отображения названий
        switch (path) {
            case 'projects':
                title = 'Проекты';
                break;
            case 'project':
                title = 'Проект';
                break;
            case 'board':
                if (paths[index + 1]) {
                    title = 'Доска';
                }
                break;
            default:
                break;
        }
        
        breadcrumbItems.push({
            title,
            path: currentPath
        });
    });
    
    return breadcrumbItems;
};

const MainLayout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    const breadcrumbItems = getBreadcrumbItems(location.pathname);
    
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    // Получаем информацию о пользователе из localStorage
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserInfo(user);
    }, []);

    // Обработчик выхода
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Определяем активный ключ для меню на основе текущего пути
    const getSelectedKey = () => {
        const path = location.pathname;
        if (path === '/' || path === '/projects') return 'projects';
        if (path.includes('/project')) return 'project';
        if (path.includes('/board')) return 'board';
        if (path.includes('/settings')) return 'settings';
        if (path.includes('/profile')) return 'profile';
        return '';
    };

    // Элементы меню
    const menuItems = [
        getItem('Проекты', 'projects', <DashboardOutlined />),
        getItem('Текущий проект', 'project', <ProjectOutlined />),
        getItem('Профиль', 'profile', <UserOutlined />),
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider 
                collapsible 
                collapsed={collapsed} 
                onCollapse={setCollapsed}
                style={{
                    overflow: 'auto',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    zIndex: 1000,
                    background: '#ffffff'
                }}
                theme="light"
            >
                {/* Логотип */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? '16px 0' : '16px 24px',
                    cursor: 'pointer',
                    background: '#ffffff'
                }} onClick={() => navigate('/')}>
                    <BulbOutlined style={{ color: 'black', fontSize: '20px' }} />
                    {!collapsed && (
                        <Title level={4} style={{ 
                            margin: '0 0 0 12px', 
                            color: 'black'
                        }}>
                            Miro
                        </Title>
                    )}
                </div>
                
                {/* <Divider style={{ margin: '0 0 8px 0', borderColor: 'rgba(99, 99, 99, 0.3)' }} /> */}
                
                {/* Меню навигации */}
                <Menu 
                    theme="light" 
                    mode="inline" 
                    selectedKeys={[getSelectedKey()]}
                    items={menuItems}
                    style={{ background: 'transparent' }}
                    onClick={({ key }) => {
                        if (key === 'projects') navigate('/projects');
                        if (key === 'project') navigate('/project');
                        if (key === 'settings') navigate('/settings');
                        if (key === 'profile') navigate('/profile');
                        if (key === 'users') navigate('/users');
                    }}
                />
                
                {/* Кнопка выхода внизу */}
                <div style={{ 
                    position: 'absolute', 
                    bottom: collapsed ? 68 : 48, 
                    width: '100%',
                    padding: '0 16px'
                }}>
                    <Divider style={{ margin: '8px 0', borderColor: 'rgba(0, 0, 0, 0.3)' }} />
                    
                    {/* Информация о пользователе */}
                    {!collapsed && userInfo && (userInfo.firstName || userInfo.lastName) && (
                        <>
                            <div style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                padding: '8px 8px',
                                justifyContent: 'center',
                            }}>
                                <Text style={{ 
                                    color: 'black', 
                                    fontSize: '13px', 
                                    textAlign: 'center'
                                }}>
                                    {`${userInfo.firstName || ''} ${userInfo.lastName || ''}`}
                                </Text>
                            </div>
                            <Divider style={{ margin: '8px 0', borderColor: 'rgba(0, 0, 0, 0.3)' }} />
                        </>
                    )}
                    
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
                        {collapsed ? (
                            <Tooltip title="Выход" placement="right">
                                <div
                                    onClick={handleLogout}
                                    style={{ 
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        color: 'black'
                                    }}
                                >
                                    <LogoutOutlined style={{ fontSize: '18px' }} />
                                </div>
                            </Tooltip>
                        ) : (
                            <div
                                onClick={handleLogout}
                                style={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '6px 16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    color: 'black',
                                    transition: 'none',
                                    width: '100%',
                                    justifyContent: 'center'
                                }}
                            >
                                <LogoutOutlined style={{ fontSize: '16px', marginRight: '8px' }} />
                                <span>Выход</span>
                            </div>
                        )}
                    </div>
                </div>
            </Sider>
            
            <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
                <Header style={{ 
                    padding: '0 16px', 
                    background: colorBgContainer,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
                    height: '60px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 999,
                    width: '100%'
                }}>
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                    />
                    
                    <Breadcrumb 
                        style={{ 
                            margin: '8px 0 8px 16px',
                            fontSize: '14px'
                        }}
                        items={breadcrumbItems.map((item, index) => ({
                            title: index === breadcrumbItems.length - 1 ? (
                                <span>{item.title}</span>
                            ) : (
                                <Link to={item.path}>{item.title}</Link>
                            )
                        }))}
                    />
                    
                    <Space>
                        {/* Здесь можно добавить дополнительные элементы управления страницей */}
                    </Space>
                </Header>
                
                <Content style={{ margin: '16px', overflow: 'initial' }}>
                    <div
                        style={{
                            padding: 24,
                            background: colorBgContainer,
                            borderRadius: borderRadiusLG,
                            minHeight: 'calc(100vh - 130px)'
                        }}
                    >
                        {children}
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout; 