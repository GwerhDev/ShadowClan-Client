import axios, { AxiosError } from "axios"
import { API_URL } from "../misc/const"

export const getCharacterByName: any = async (name: string) => {
  try {
    const response: any = await axios.get(API_URL + "/character/" + name, { withCredentials: true })
                                     .then(response => response.data)
    return response;
  } catch (error) {
    const err = error as AxiosError;
    if (err.response?.status === 404) {
      return { found: false };
    }
    // You might want to handle other errors differently
    throw error;
  }
};
