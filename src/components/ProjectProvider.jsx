import React, {createContext, useEffect, useState} from "react";

export const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
    const [projectId, setProjectId] = useState(() => {
        // При инициализации читаем из localStorage, если значение есть
        return localStorage.getItem("currentProjectId") || null;
    });

    useEffect(() => {
        if (projectId) {
            localStorage.setItem("currentProjectId", projectId);
        }
    }, [projectId]);

    return (
        <ProjectContext.Provider value={{ projectId, setProjectId }}>
            {children}
        </ProjectContext.Provider>
    );
};
