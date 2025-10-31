import axios from "axios"
import { API_URL } from "../misc/const"

export const createShadowWar: any = async (formData: any) => {
  const response: any = await axios.post(API_URL + "/admin/shadow-wars", formData, { withCredentials: true })
    .then(response => response.data)
  return response;
};

export const getShadowWars: any = async (page: number) => {
  const response: any = await axios.get(API_URL + "/admin/shadow-wars" + (page ? "?page=" + page : ""), { withCredentials: true })
    .then(response => response.data.data)
  return response;
};

export const getShadowWarById: any = async (id: string) => {
  const response: any = await axios.get(API_URL + `/admin/shadow-wars/${id}`, { withCredentials: true })
    .then(response => response.data)
  return response;
};

export const updateShadowWar: any = async (id: string, formData: any) => {
  const response: any = await axios.patch(API_URL + `/admin/shadow-wars/${id}`, formData, { withCredentials: true })
    .then(response => response.data)
  return response;
};

export const getNextShadowWar: any = async () => {
  const response: any = await axios.get(API_URL + "/shadow-war/next", { withCredentials: true })
    .then(response => response.data)
  return response;
};
