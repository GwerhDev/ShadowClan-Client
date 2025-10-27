import axios from "axios"
import { API_URL } from "../misc/const"
import { error } from "../misc/errors";
import { options } from "../../helpers";

export const signupGoogle: any = async (formData: any) => {
  const response: any = await axios.post(API_URL + "/signup-google", formData)
                                   .then(response => response.data.token)
                                   .catch(() => { return { error: error.api.loadAllItems } });
  return response;
};

export const loginGoogle: any = async (formData: any) => {
  const response: any = await axios.post(API_URL + "/login-google", formData)
                                   .then(response => response.data.token)
                                   .catch(() => { return { error: error.api.loadAllItems } });
  return response;
};

export const signupInner: any = async (formData: any) => {
  const response: any = await axios.post(API_URL + "/signup-inner", formData)
                                   .then(response => response.data.token)
                                   .catch(() => { return { error: error.api.loadItemById } });
  return response;
};

export const loginInner: any = async (formData: any) => {
  const response: any = await axios.post(API_URL + "/login-inner", formData)
                                   .then(response => response.data.token)
                                   .catch(() => { return { error: error.api.loadItemById } });
  return response;
};

export const getUserData: any = async (token: any) => {
  const response: any = await axios.get(API_URL + "/auth", { headers: { Authorization: token }})
                                   .then(response => response.data)
  return response;
};

export const updateUserData: any = async (formData: any, id: any, token: any) => {
  const response: any = await axios.patch(API_URL + "/account/update/" + id, formData, { headers: { Authorization: token }})
                                   .then(response => response.data)
                                   .catch(() => { return { error: error.api.loadItemById } });
  return response;
};

export const getUsers: any = async () => {
  const response: any = await axios.get(API_URL + "/admin/users", options())
                                   .then(response => response.data)
  return response;
};

export const getMembers: any = async () => {
  const response: any = await axios.get(API_URL + "/admin/members", options())
                                   .then(response => response.data)
  return response;
};

export const createMember: any = async (formData: any) => {
  const response: any = await axios.post(API_URL + "/admin/members", formData, options())
                                   .then(response => response.data)
  return response;
};

export const updateMember: any = async (id: string, formData: any) => {
  await axios.patch(API_URL + "/admin/members/" + id, formData, options());
  return;
};

export const deleteMember: any = async (id: string) => {
  await axios.delete(API_URL + "/admin/members/" + id, options());
  return;
};

export const updateUser: any = async (id: string, formData: any) => {
  await axios.patch(API_URL + "/admin/users/" + id, formData, options());
  return;
};

export const deleteUser: any = async (id: string) => {
  await axios.delete(API_URL + "/admin/users/" + id, options());
  return;
};

export const getTasks: any = async (date: Date, type: string, character: string | null) => {
  const response: any = await axios.post(API_URL + "/task/", { date, type, character }, options())
                                   .then(response => response.data)
  return response;
};

export const createTask: any = async (formData: any) => {
  const response: any = await axios.post(API_URL + "/task/create", formData, options())
                                   .then(response => response.data)
  return response;
};

export const updateTask: any = async (id: string, formData: any) => {
  const response: any = await axios.patch(API_URL + "/task/update/" + id, formData, options())
                                   .then(response => response.data)
  return response;
};

export const deleteTask: any = async (id: string) => {
  const response: any = await axios.delete(API_URL + "/task/delete/" + id, options())
  return response;
};

export const createCompletedTask: any = async (id: string, formData: any) => {
  const response: any = await axios.post(API_URL + "/completed-task/create/" + id, formData, options())
                                   .then(response => response.data)
  return response;
};

export const deleteCompletedTask: any = async (id: string, formData: any) => {
  const response: any = await axios.patch(API_URL + "/completed-task/delete/" + id, formData, options())
  return response;
};

export const getAdminNotifications: any = async () => {
  const response: any = await axios.get(API_URL + "/admin/notifications", options())
                                   .then(response => response.data);
  return response;
};

export const chatbotQuery: any = async (formData: any) => {
  const response: any = await axios.post(API_URL + "/guide/chatbot", formData, options())
                                   .then(response => response.data);
  return response;
};

export const getChatbotModel: any = async () => {
  const response: any = await axios.get(API_URL + "/guide/chatbot-model")
                                   .then(response => response.data);
  return response;
};

export const getCharacter: any = async () => {
  const response: any = await axios.get(API_URL + "/character/", options())
                                   .then(response => response.data);
  return response;
};

export const createCharacter: any = async (formData: any) => {
  const response: any = await axios.post(API_URL + "/character/create", formData, options())
                                   .then(response => response.data);
  return response;
};

export const getWarbands: any = async () => {
  const response: any = await axios.get(API_URL + "/warband/", options())
                                   .then(response => response.data);
  return response;
};

export { createShadowWar, getNextShadowWar, getShadowWarById, updateShadowWar, getShadowWars } from './shadowWarService';
export { getClans, createClan, updateClan, deleteClan } from './clanService';