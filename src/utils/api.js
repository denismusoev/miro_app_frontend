import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api";

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    };
};

// Функции для проектов
export const fetchProjects = async () => {
    return axios.get(`${API_BASE_URL}/projects/my`, getAuthHeaders());
};

export const fetchAccessibleProjects = async () => {
    return axios.get(`${API_BASE_URL}/projects/accessible`, getAuthHeaders());
};

export const fetchAllProjects = async () => {
    return axios.get(`${API_BASE_URL}/projects`, getAuthHeaders());
};

export const fetchProjectById = async (id) => {
    return axios.get(`${API_BASE_URL}/projects/${id}`, getAuthHeaders());
};

export const createProject = async (project) => {
    return axios.post(`${API_BASE_URL}/projects`, project, getAuthHeaders());
};

export const updateProject = async (project) => {
    return axios.put(`${API_BASE_URL}/projects`, project, getAuthHeaders());
};

export const deleteProject = async (id) => {
    return axios.delete(`${API_BASE_URL}/projects/${id}`, getAuthHeaders());
};

// Функции для досок
export const fetchBoards = async (id) => {
    return axios.get(`${API_BASE_URL}/boards/my`, getAuthHeaders());
};

export const fetchBoardById = async (id) => {
    return axios.get(`${API_BASE_URL}/boards/${id}`, getAuthHeaders());
};

export const fetchBoardByProjectId = async (id) => {
    return axios.get(`${API_BASE_URL}/boards/project/${id}/accessible`, getAuthHeaders());
};

export const createBoard = async (projectId, board) => {
    return axios.post(`${API_BASE_URL}/boards/${projectId}`, board, getAuthHeaders());
};

export const updateBoard = async (board) => {
    return axios.put(`${API_BASE_URL}/boards`, board, getAuthHeaders());
};

export const deleteBoard = async (id) => {
    return axios.delete(`${API_BASE_URL}/boards/${id}`, getAuthHeaders());
};

// Функции для invite-ссылок
export const createInvite = async (inviteData) => {
    return axios.post(`${API_BASE_URL}/invites`, inviteData, getAuthHeaders());
};

export const getInvite = async (params) => {
    // params: { projectId, boardId, role }
    return axios.get(`${API_BASE_URL}/invites`, { params, ...getAuthHeaders() });
};

export const processInvite = async (token) => {
    return axios.post(`${API_BASE_URL}/invites/process?token=${token}`, null, getAuthHeaders());
};

export const updateInvite = async (token, updateData) => {
    return axios.put(`${API_BASE_URL}/invites/${token}`, updateData, getAuthHeaders());
};

export const deactivateInvite = async (token) => {
    return axios.delete(`${API_BASE_URL}/invites/${token}`, getAuthHeaders());
};

// Функции для управления правами пользователей на проекте
export const getProjectParticipants = async (projectId) => {
    return axios.get(`${API_BASE_URL}/permissions/project/${projectId}/participants`, getAuthHeaders());
};

export const getCurrentUserProjectAccess = async (projectId) => {
    return axios.get(`${API_BASE_URL}/permissions/project/${projectId}/current-user-access`, getAuthHeaders());
};

export const addUserToProject = async (projectId, userData) => {
    return axios.post(`${API_BASE_URL}/permissions/project/${projectId}/users`, userData, getAuthHeaders());
};

export const updateUserProjectPermission = async (projectId, userData) => {
    return axios.put(`${API_BASE_URL}/permissions/project/${projectId}/users`, userData, getAuthHeaders());
};

export const removeUserFromProject = async (projectId, email) => {
    return axios.delete(`${API_BASE_URL}/permissions/project/${projectId}/users?email=${email}`, getAuthHeaders());
};

// Функции для управления правами пользователей на доске
export const getBoardParticipants = async (boardId) => {
    return axios.get(`${API_BASE_URL}/permissions/board/${boardId}/participants`, getAuthHeaders());
};

export const getCurrentUserBoardAccess = async (boardId) => {
    return axios.get(`${API_BASE_URL}/permissions/board/${boardId}/current-user-access`, getAuthHeaders());
};

export const addUserToBoard = async (boardId, userData) => {
    return axios.post(`${API_BASE_URL}/permissions/board/${boardId}/users`, userData, getAuthHeaders());
};

export const updateUserBoardPermission = async (boardId, userData) => {
    return axios.put(`${API_BASE_URL}/permissions/board/${boardId}/users`, userData, getAuthHeaders());
};

export const removeUserFromBoard = async (boardId, email) => {
    return axios.delete(`${API_BASE_URL}/permissions/board/${boardId}/users?email=${email}`, getAuthHeaders());
};

// Добавляем функцию для поиска проектов
export const searchProjects = async (params) => {
    return axios.get(`${API_BASE_URL}/projects/search`, { 
        params,
        ...getAuthHeaders() 
    });
};

// Добавляем функцию для поиска досок
export const searchBoards = async (params) => {
    return axios.get(`${API_BASE_URL}/boards/search`, { 
        params,
        ...getAuthHeaders() 
    });
};

// Функции для работы с профилем пользователя
export const getCurrentUser = async () => {
    return axios.get(`${API_BASE_URL}/auth/me`, getAuthHeaders());
};

export const updateUserProfile = async (profileData) => {
    return axios.put(`${API_BASE_URL}/users/profile`, profileData, getAuthHeaders());
};
