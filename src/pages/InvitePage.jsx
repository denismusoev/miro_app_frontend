import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { processInvite } from "../utils/api";
import { Container, Alert, Spinner } from "react-bootstrap";

function InvitePage() {
    // Извлекаем токен из параметров маршрута
    const { token } = useParams();

    // Статус обработки: "loading", "success" или "error"
    const [status, setStatus] = useState("loading");
    // Сообщение, полученное из DTO
    const [message, setMessage] = useState("");

    useEffect(() => {
        async function handleProcessInvite() {
            try {
                const response = await processInvite(token);
                // Проверяем, что в ответе присутствует нужная структура DTO
                if (response.data && typeof response.data.error === "boolean") {
                    setMessage(response.data.message);
                    // Если error === false, значит доступ предоставлен успешно
                    if (!response.data.error) {
                        setStatus("success");
                    } else {
                        setStatus("error");
                    }
                } else {
                    setStatus("error");
                    setMessage("Некорректный ответ от сервера");
                }
            } catch (error) {
                setStatus("error");
                setMessage("Ошибка при обработке приглашения");
            }
        }
        handleProcessInvite();
    }, [token]);

    return (
        <Container
            className="d-flex justify-content-center align-items-center"
            style={{ height: "100vh" }}
        >
            {status === "loading" && <Spinner animation="border" />}
            {status === "success" && (
                <Alert variant="success">
                    {message || "Приглашение успешно обработано!"}
                </Alert>
            )}
            {status === "error" && (
                <Alert variant="danger">
                    {message || "Упс, произошла ошибка при обработке приглашения."}
                </Alert>
            )}
        </Container>
    );
}

export default InvitePage;
