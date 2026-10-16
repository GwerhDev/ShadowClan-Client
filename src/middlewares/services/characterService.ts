import axios, { AxiosError } from "axios"
import { API_URL } from "../misc/const"
import type { CharacterSearchResult } from "../../interfaces";

/** Busca personajes por nombre. Un 404 se traduce a `{ found: false }`. */
export const getCharacterByName = async (name: string): Promise<CharacterSearchResult> => {
  try {
    return await axios.get<CharacterSearchResult>(API_URL + "/character/" + name, { withCredentials: true })
      .then(response => response.data);
  } catch (error) {
    const err = error as AxiosError;
    if (err.response?.status === 404) {
      return { found: false };
    }
    throw error;
  }
};
