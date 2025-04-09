import React, { useState } from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";

const API_URL = "http://localhost:8080/api/auth"; // URL бэкенда

function AuthPage({ onLogin }) {
    const [isRegister, setIsRegister] = useState(false); // Состояние: вход или регистрация
    const [formData, setFormData] = useState({ login: "", email: "", password: "" });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const endpoint = isRegister ? "/register" : "/login";
            const response = await axios.post(`${API_URL}${endpoint}`, formData);
            //console.log(response);

            if (!isRegister) {
                localStorage.setItem("token", response.data.token); // Сохраняем JWT
                onLogin(); // Вызываем callback для обновления состояния аутентификации
                navigate("/");
            } else {
                alert("Регистрация успешна! Теперь войдите.");
                setIsRegister(false);
            }
        } catch (err) {
            console.error("Ошибка:", err);
            console.error("Ответ сервера:", err.response);
            setError(err.response?.data?.message || "Ошибка аутентификации");
        }
    };

    return (
        <div style={styles.container}>
            <h2>{isRegister ? "Регистрация" : "Вход"}</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
                <input
                    type="text"
                    name="login"
                    placeholder="Логин"
                    value={formData.login}
                    onChange={handleChange}
                    required
                />
                {isRegister && (
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                )}
                <input
                    type="password"
                    name="password"
                    placeholder="Пароль"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
                <button type="submit">{isRegister ? "Зарегистрироваться" : "Войти"}</button>
                {error && <p style={styles.error}>{error}</p>}
            </form>
            <p onClick={() => setIsRegister(!isRegister)} style={styles.toggle}>
                {isRegister ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}
            </p>
        </div>
    );
}

const styles = {
    container: { maxWidth: "300px", margin: "50px auto", textAlign: "center" },
    form: { display: "flex", flexDirection: "column", gap: "10px" },
    error: { color: "red", fontSize: "14px" },
    toggle: { color: "blue", cursor: "pointer", marginTop: "10px" }
};

export default AuthPage;
