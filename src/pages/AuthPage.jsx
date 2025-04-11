import React, { useState } from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import { Form, Input, Button, Tabs, Card, Typography, message, Layout, Row, Col } from "antd";
import { UserOutlined, LockOutlined, MailOutlined, LoginOutlined, UserAddOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const { Content } = Layout;
const { TabPane } = Tabs;

const API_URL = "http://localhost:8080/api/auth"; // URL бэкенда

function AuthPage({ onLogin }) {
    const [loginForm] = Form.useForm();
    const [registerForm] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Обработчик входа
    const handleLogin = async (values) => {
        setLoading(true);
        try {
            // Выполняем запрос на вход
            const response = await axios.post(`${API_URL}/login`, values);
            
            // Сохраняем токен
            localStorage.setItem("token", response.data.token);
            
            // Сохраняем базовую информацию из ответа на запрос логина
            let userData = {
                firstName: response.data.firstName || "",
                lastName: response.data.lastName || "",
                ...(response.data.user || {})
            };
            
            // Получаем полную информацию о пользователе
            try {
                const userResponse = await axios.get(`${API_URL}/me`, {
                    headers: {
                        Authorization: `Bearer ${response.data.token}`
                    }
                });
                
                // Дополняем данными из профиля
                userData = {
                    ...userData,
                    ...userResponse.data
                };
            } catch (profileError) {
                console.warn("Не удалось получить полный профиль пользователя:", profileError);
            }
            
            // Сохраняем данные пользователя
            localStorage.setItem("user", JSON.stringify(userData));
            
            message.success("Вход выполнен успешно!");
            onLogin && onLogin();
            navigate("/");
        } catch (err) {
            console.error("Ошибка входа:", err);
            const errorMsg = err.response?.data?.message || "Неверный логин или пароль";
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Обработчик регистрации
    const handleRegister = async (values) => {
        setLoading(true);
        try {
            await axios.post(`${API_URL}/register`, values);
            message.success("Регистрация прошла успешно! Теперь вы можете войти в систему.");
            registerForm.resetFields();
            // Переключаемся на вкладку входа
            document.getElementById("auth-tabs")?.setAttribute("activeKey", "login");
        } catch (err) {
            console.error("Ошибка регистрации:", err);
            const errorMsg = err.response?.data?.message || "Ошибка при регистрации. Пожалуйста, попробуйте снова.";
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Content>
                <Row justify="center" align="middle" style={{ minHeight: "100vh" }}>
                    <Col xs={22} sm={20} md={16} lg={10} xl={8}>
                        <Card 
                            bordered={false} 
                            style={{ 
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)", 
                                borderRadius: "12px" 
                            }}
                        >
                            <div style={{ textAlign: "center", marginBottom: 24 }}>
                                <Title level={2} style={{ fontWeight: 600, color: "#1890ff" }}>
                                    Miro
                                </Title>
                                <Text type="secondary">
                                    Войдите или зарегистрируйтесь для доступа к системе
                                </Text>
                            </div>
                            
                            <Tabs defaultActiveKey="login" centered id="auth-tabs">
                                <TabPane 
                                    tab={
                                        <span>
                                            Вход
                                        </span>
                                    } 
                                    key="login"
                                >
                                    <Form
                                        form={loginForm}
                                        name="login"
                                        layout="vertical"
                                        onFinish={handleLogin}
                                        size="large"
                                        requiredMark={false}
                                    >
                                        <Form.Item
                                            name="login"
                                            rules={[
                                                { 
                                                    required: true, 
                                                    message: "Пожалуйста, введите логин!" 
                                                }
                                            ]}
                                        >
                                            <Input 
                                                placeholder="Логин"
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            name="password"
                                            rules={[
                                                { 
                                                    required: true, 
                                                    message: "Пожалуйста, введите пароль!" 
                                                }
                                            ]}
                                        >
                                            <Input.Password 
                                                placeholder="Пароль"
                                            />
                                        </Form.Item>

                                        <Form.Item>
                                            <Button 
                                                type="primary" 
                                                htmlType="submit" 
                                                block 
                                                loading={loading}
                                            >
                                                Войти
                                            </Button>
                                        </Form.Item>
                                    </Form>
                                </TabPane>
                                
                                <TabPane 
                                    tab={
                                        <span>
                                            Регистрация
                                        </span>
                                    } 
                                    key="register"
                                >
                                    <Form
                                        form={registerForm}
                                        name="register"
                                        layout="vertical"
                                        onFinish={handleRegister}
                                        size="large"
                                        requiredMark={false}
                                    >
                                        <Form.Item
                                            name="login"
                                            rules={[
                                                { 
                                                    required: true, 
                                                    message: "Пожалуйста, введите логин!" 
                                                },
                                                {
                                                    pattern: /^[a-zA-Z0-9_]+$/,
                                                    message: "Логин может содержать только латинские буквы, цифры и знак подчеркивания"
                                                },
                                                {
                                                    min: 3,
                                                    max: 20,
                                                    message: "Логин должен содержать от 3 до 20 символов"
                                                }
                                            ]}
                                        >
                                            <Input 
                                                placeholder="Логин"
                                            />
                                        </Form.Item>

                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item
                                                    name="lastName"
                                                    rules={[
                                                        { 
                                                            required: true, 
                                                            message: "Пожалуйста, введите фамилию!" 
                                                        }
                                                    ]}
                                                >
                                                    <Input 
                                                        placeholder="Фамилия"
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item
                                                    name="firstName"
                                                    rules={[
                                                        { 
                                                            required: true, 
                                                            message: "Пожалуйста, введите имя!" 
                                                        }
                                                    ]}
                                                >
                                                    <Input 
                                                        placeholder="Имя"
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        
                                        <Form.Item
                                            name="middleName"
                                        >
                                            <Input 
                                                placeholder="Отчество (необязательно)"
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            name="email"
                                            rules={[
                                                { 
                                                    required: true, 
                                                    message: "Пожалуйста, введите email!" 
                                                },
                                                {
                                                    type: "email",
                                                    message: "Пожалуйста, введите корректный email!"
                                                }
                                            ]}
                                        >
                                            <Input 
                                                placeholder="Email"
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            name="password"
                                            rules={[
                                                { 
                                                    required: true, 
                                                    message: "Пожалуйста, введите пароль!" 
                                                },
                                                {
                                                    min: 8,
                                                    message: "Пароль должен содержать не менее 8 символов"
                                                }
                                            ]}
                                        >
                                            <Input.Password 
                                                placeholder="Пароль"
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            name="confirmPassword"
                                            dependencies={['password']}
                                            rules={[
                                                { 
                                                    required: true, 
                                                    message: "Пожалуйста, подтвердите пароль!" 
                                                },
                                                ({ getFieldValue }) => ({
                                                    validator(_, value) {
                                                        if (!value || getFieldValue('password') === value) {
                                                            return Promise.resolve();
                                                        }
                                                        return Promise.reject(new Error('Пароли не совпадают!'));
                                                    },
                                                })
                                            ]}
                                        >
                                            <Input.Password 
                                                placeholder="Подтвердите пароль"
                                            />
                                        </Form.Item>

                                        <Form.Item>
                                            <Button 
                                                type="primary" 
                                                htmlType="submit" 
                                                block 
                                                loading={loading}
                                            >
                                                Зарегистрироваться
                                            </Button>
                                        </Form.Item>
                                    </Form>
                                </TabPane>
                            </Tabs>
                        </Card>
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
}

export default AuthPage;
