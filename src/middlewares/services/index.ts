import axios from "axios"
import { API_URL } from "../misc/const"
import { error } from "../misc/errors";

export const getUserData: any = async () => {
  const response: any = await axios.get(API_URL + "/auth", { withCredentials: true })
    .then(response => response.data)
  return response;
};

export const updateUserData: any = async (formData: any, id: any) => {
  const response: any = await axios.patch(API_URL + "/account/update/" + id, formData, { withCredentials: true })
    .then(response => response.data)
    .catch(() => { return { error: error.api.loadItemById } });
  return response;
};

export const getUsers: any = async () => {
  const response: any = await axios.get(API_URL + "/admin/users", { withCredentials: true })
    .then(response => response.data)
  return response;
};

export const getAdminCharacters: any = async () => {
  const response: any = await axios.get(API_URL + "/admin/characters", { withCredentials: true })
    .then(response => response.data)
  return response;
};

export const createAdminCharacter: any = async (formData: any) => {
  const response: any = await axios.post(API_URL + "/admin/characters", formData, { withCredentials: true })
    .then(response => response.data)
  return response;
};

export const updateAdminCharacter: any = async (id: string, formData: any) => {
  await axios.patch(API_URL + "/admin/characters/" + id, formData, { withCredentials: true });
  return;
};

export const deleteAdminCharacter: any = async (id: string) => {
  await axios.delete(API_URL + "/admin/characters/" + id, { withCredentials: true });
  return;
};

export const updateUser: any = async (id: string, formData: any) => {
  await axios.patch(API_URL + "/admin/users/" + id, formData, { withCredentials: true });
  return;
};

export const deleteUser: any = async (id: string) => {
  await axios.delete(API_URL + "/admin/users/" + id, { withCredentials: true });
  return;
};

export const getTasks: any = async (date: Date, type: string, character: string | null) => {
  const response: any = await axios.post(API_URL + "/task/", { date, type, character }, { withCredentials: true })
    .then(response => response.data)
  return response;
};

export const createTask: any = async (formData: any) => {
  const response: any = await axios.post(API_URL + "/task/create", formData, { withCredentials: true })
    .then(response => response.data)
  return response;
};

export const updateTask: any = async (id: string, formData: any) => {
  const response: any = await axios.patch(API_URL + "/task/update/" + id, formData, { withCredentials: true })
    .then(response => response.data)
  return response;
};

export const deleteTask: any = async (id: string) => {
  const response: any = await axios.delete(API_URL + "/task/delete/" + id, { withCredentials: true })
  return response;
};

export const createCompletedTask: any = async (id: string, formData: any) => {
  const response: any = await axios.post(API_URL + "/completed-task/create/" + id, formData, { withCredentials: true })
    .then(response => response.data)
  return response;
};

export const deleteCompletedTask: any = async (id: string, formData: any) => {
  const response: any = await axios.patch(API_URL + "/completed-task/delete/" + id, formData, { withCredentials: true })
  return response;
};

export const getAdminNotifications: any = async () => {
  const response: any = await axios.get(API_URL + "/admin/notifications", { withCredentials: true })
    .then(response => response.data);
  return response;
};

export const chatbotQuery: any = async (formData: any) => {
  const response: any = await axios.post(API_URL + "/guide/chatbot", formData, { withCredentials: true })
    .then(response => response.data);
  return response;
};

export const getChatbotModel: any = async () => {
  const response: any = await axios.get(API_URL + "/guide/chatbot-model")
    .then(response => response.data);
  return response;
};

export const getCharacter: any = async () => {
  const response: any = await axios.get(API_URL + "/character/", { withCredentials: true })
    .then(response => response.data);
  return response;
};

export const createCharacter: any = async (formData: any) => {
  const response: any = await axios.post(API_URL + "/character/create", formData, { withCredentials: true })
    .then(response => response.data);
  return response;
};

export const getWarbands: any = async () => {
  const response: any = await axios.get(API_URL + "/warband/", { withCredentials: true })
    .then(response => response.data);
  return response;
};

export const logout: any = async () => {
  const response: any = await axios.get(API_URL + "/logout/", { withCredentials: true })
    .then(response => response.data);
  return response;
};

export { createShadowWar, getNextShadowWar, getShadowWarById, updateShadowWar, getShadowWars } from './shadowWarService';
export { getClans, createClan, updateClan, deleteClan } from './clanService';