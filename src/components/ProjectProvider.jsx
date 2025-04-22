import React, {createContext, useEffect, useState} from "react";
import {jwtDecode} from "jwt-decode";

export const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
    const [projectId, setProjectId] = useState(() => {
        // При инициализации читаем из localStorage, если значение есть
        return localStorage.getItem("currentProjectId") || null;
    });
    
    const [userData, setUserData] = useState(() => {
        const storedUser = localStorage.getItem("user");
        return storedUser ? JSON.parse(storedUser) : null;
    });
    
    // Инициализируем userLogin сразу из токена при загрузке страницы
    const [userLogin, setUserLogin] = useState(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const { sub } = jwtDecode(token);
                return sub;
            } catch (error) {
                console.error("Ошибка при декодировании токена:", error);
            }
        }
        return null;
    });
    
    // Обновляем projectId в localStorage при изменении
    useEffect(() => {
        if (projectId) {
            localStorage.setItem("currentProjectId", projectId);
        }
    }, [projectId]);
    
    // // Добавляем слушатель события storage для обновления userLogin при изменении токена
    // useEffect(() => {
    //     const handleStorageChange = (e) => {
    //         if (e.key === "token") {
    //             if (e.newValue) {
    //                 try {
    //                     const { sub } = jwtDecode(e.newValue);
    //                     setUserLogin(sub);
    //                 } catch (error) {
    //                     console.error("Ошибка при декодировании токена:", error);
    //                     setUserLogin(null);
    //                 }
    //             } else {
    //                 setUserLogin(null);
    //             }
    //         }
    //     };
    //
    //     window.addEventListener("storage", handleStorageChange);
    //     return () => window.removeEventListener("storage", handleStorageChange);
    // }, []);
    
    // Обновляем пользовательские данные в контексте
    const updateUserData = (newUserData) => {
        setUserData(newUserData);
        localStorage.setItem("user", JSON.stringify(newUserData));
    };

    return (
        <ProjectContext.Provider value={{ 
            projectId, 
            setProjectId, 
            userData, 
            userLogin,
            updateUserData,
            setUserLogin
        }}>
            {children}
        </ProjectContext.Provider>
    );
};
