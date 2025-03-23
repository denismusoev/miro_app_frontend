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

export const updateProject = async (id, project) => {
    return axios.put(`${API_BASE_URL}/projects/${id}`, project, getAuthHeaders());
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
    return axios.get(`${API_BASE_URL}/boards/project/${id}`, getAuthHeaders());
};

export const createBoard = async (board) => {
    return axios.post(`${API_BASE_URL}/boards`, board, getAuthHeaders());
};

export const updateBoard = async (id, board) => {
    return axios.put(`${API_BASE_URL}/boards/${id}`, board, getAuthHeaders());
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
