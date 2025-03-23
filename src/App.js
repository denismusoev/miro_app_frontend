import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectPage from "./pages/ProjectPage";
import BoardPage from "./pages/BoardPageDefault";
import InvitePage from "./pages/InvitePage";
import {ReactFlowProvider} from "@xyflow/react";
import MiroAuth from "./pages/MiroAuth";
import {ProjectProvider} from "./components/ProjectProvider";

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) setIsAuthenticated(true);
    }, []);

    return (
        <Router>
            <ProjectProvider>
                <Routes>
                    <Route
                        path="/"
                        element={<Navigate to="/projects" />}
                    />
                    <Route
                        path="/login"
                        element={<AuthPage onLogin={() => setIsAuthenticated(true)}/>}
                    />
                    <Route
                        path="/projects"
                        element={<ProjectsPage />}
                    />
                    <Route
                        path="/project"
                        element={<ProjectPage />}
                    />
                    <Route
                        path="/board/:id"
                        element={
                            <ReactFlowProvider>
                                <BoardPage />
                            </ReactFlowProvider>}
                    />
                    <Route
                        path="/invite/:token"
                        element={<InvitePage />}
                    />
                    <Route
                        path="/miro_auth"
                        element={<MiroAuth />}
                    />
                </Routes>
            </ProjectProvider>
            {/*<Routes>*/}
            {/*    <Route*/}
            {/*        path="/"*/}
            {/*        element={isAuthenticated ? <Navigate to="/projects" /> : <AuthPage onLogin={() => setIsAuthenticated(true)} />}*/}
            {/*    />*/}
            {/*    <Route*/}
            {/*        path="/projects"*/}
            {/*        element={isAuthenticated ? <ProjectsPage /> : <Navigate to="/" />}*/}
            {/*    />*/}
            {/*    <Route*/}
            {/*        path="/project/:id"*/}
            {/*        element={isAuthenticated ? <ProjectPage /> : <Navigate to="/" />}*/}
            {/*    />*/}
            {/*    <Route*/}
            {/*        path="/board/:id"*/}
            {/*        element={isAuthenticated ?*/}
            {/*            <ReactFlowProvider>*/}
            {/*                <BoardPage />*/}
            {/*            </ReactFlowProvider> :*/}
            {/*            <Navigate to="/" />}*/}
            {/*    />*/}
            {/*    <Route*/}
            {/*        path="/invite/:token"*/}
            {/*        element={<InvitePage />}*/}
            {/*    />*/}
            {/*</Routes>*/}
        </Router>
    );
}

export default App;
