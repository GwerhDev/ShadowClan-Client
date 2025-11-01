import axios from "axios"
import { API_URL } from "../misc/const"

export const getClans: any = async () => {
  const response: any = await axios.get(API_URL + "/admin/clans", { withCredentials: true })
                                   .then(response => response.data)
  return response;
};

export const createClan: any = async (formData: any) => {
  const response: any = await axios.post(API_URL + "/admin/clans", formData, { withCredentials: true })
                                   .then(response => response.data)
  return response;
};

export const updateClan: any = async (formData: any) => {
  const response: any = await axios.patch(API_URL + "/admin/clans", formData, { withCredentials: true })
                                   .then(response => response.data)
  return response;
};

export const deleteClan: any = async (id: any) => {
  const response: any = await axios.delete(API_URL + "/admin/clans/" + id, { withCredentials: true })
                                   .then(response => response.data)
  return response;
};
