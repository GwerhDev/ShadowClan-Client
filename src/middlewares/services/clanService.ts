import axios from "axios"
import { API_URL } from "../misc/const"
import { options } from "../../helpers";

export const getClans: any = async () => {
  const response: any = await axios.get(API_URL + "/admin/clans", options())
                                   .then(response => response.data)
  return response;
};

export const createClan: any = async (formData: any) => {
  const response: any = await axios.post(API_URL + "/admin/clans", formData, options())
                                   .then(response => response.data)
  return response;
};


export const updateClan: any = async (id: any, formData: any) => {
  const response: any = await axios.patch(API_URL + "/admin/clans/" + id, formData, options())
                                   .then(response => response.data)
  return response;
};

export const deleteClan: any = async (id: any) => {
  const response: any = await axios.delete(API_URL + "/admin/clans/" + id, options())
                                   .then(response => response.data)
  return response;
};
