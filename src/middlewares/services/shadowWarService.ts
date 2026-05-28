import axios from "axios"
import { API_URL } from "../misc/const"

export const createShadowWar: any = async (formData: any) => {
  const response: any = await axios.post(API_URL + "/clan-management/shadow-wars", formData, { withCredentials: true })
    .then(response => response.data)
  return response;
};

export const getShadowWars: any = async (page: number) => {
  const response: any = await axios.get(API_URL + "/clan-management/shadow-wars" + (page ? "?page=" + page : ""), { withCredentials: true })
    .then(response => response.data.data)
  return response;
};

export const getShadowWarById: any = async (id: string) => {
  const response: any = await axios.get(API_URL + `/clan-management/shadow-wars/${id}`, { withCredentials: true })
    .then(response => response.data)
  return response;
};

export const updateShadowWar: any = async (id: string, formData: any) => {
  const response: any = await axios.patch(API_URL + `/clan-management/shadow-wars/${id}`, formData, { withCredentials: true })
    .then(response => response.data)
  return response;
};

// Clan-management-scoped update (leader/officer)
export const updateShadowWarClan: any = async (id: string, formData: any) => {
  const response: any = await axios.patch(API_URL + `/clan-management/shadow-wars/${id}`, formData, { withCredentials: true })
    .then(response => response.data)
  return response;
};

// Create a shadow war instance (leader/officer)
export const createShadowWarManagement: any = async (date: string, enemyClan?: string | null) => {
  const response: any = await axios.post(
    API_URL + '/clan-management/shadow-wars',
    { date, enemyClan: enemyClan || null },
    { withCredentials: true }
  ).then(response => response.data);
  return response;
};

// Close/delete a shadow war instance (leader/officer)
export const closeShadowWarManagement: any = async (id: string) => {
  const response: any = await axios.delete(API_URL + `/clan-management/shadow-wars/${id}`, { withCredentials: true })
    .then(response => response.data)
  return response;
};

// Mark a shadow war instance as completed (leader/officer)
export const completeShadowWarManagement: any = async (id: string) =>
  axios.patch(API_URL + `/clan-management/shadow-wars/${id}`, { completed: true }, { withCredentials: true })
    .then(r => r.data);

export const getNextShadowWar: any = async () => {
  const response: any = await axios.get(API_URL + "/shadow-war/next", { withCredentials: true })
    .then(response => response.data)
  return response;
};

export const confirmShadowWar: any = async (shadowWarId: string) => {
  const response: any = await axios.patch(API_URL + `/shadow-war/${shadowWarId}/confirm`, {}, { withCredentials: true })
    .then(response => response.data)
  return response;
};
