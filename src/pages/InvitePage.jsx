import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { processInvite } from "../utils/api";
import { Container, Alert, Spinner } from "react-bootstrap";

function InvitePage() {

    const { token } = useParams();


    const [status, setStatus] = useState("loading");

    const [message, setMessage] = useState("");

    useEffect(() => {
        async function handleProcessInvite() {
            try {
                const response = await processInvite(token);

                if (response.data && typeof response.data.error === "boolean") {
                    setMessage(response.data.message);

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
