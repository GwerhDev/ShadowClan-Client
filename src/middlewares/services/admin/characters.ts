import axios from "axios"
import { API_URL } from "../../misc/const"

export const claimCharacterAsAdmin: any = async (formData: any) => {
  const response: any = await axios.patch(API_URL + "/admin/characters/claim", formData, { withCredentials: true })
    .then(response => response.data)
  return response;
};

export const unclaimCharacterAsAdmin: any = async (formData: any) => {
  const response: any = await axios.patch(API_URL + "/admin/characters/unclaim", formData, { withCredentials: true })
    .then(response => response.data)
  return response;
};