import axios from "axios"
import { API_URL } from "../misc/const"
import type { AuthResponse, Character, CharacterUpdate, UserCharacter } from "../../interfaces";

// Usuario autenticado: sesión, cuenta y personajes propios.

export const getUserData = async (): Promise<AuthResponse> =>
  axios.get<AuthResponse>(API_URL + "/auth", { withCredentials: true }).then(r => r.data);

export const getCharacter = async (): Promise<UserCharacter[]> =>
  axios.get<UserCharacter[]>(API_URL + "/character", { withCredentials: true }).then(r => r.data);

export const updateCharacter = async (id: string, data: CharacterUpdate): Promise<Character> =>
  axios.put<Character>(API_URL + "/character/" + id, data, { withCredentials: true }).then(r => r.data);

export const logout = async (): Promise<void> => {
  await axios.get(API_URL + "/auth/logout", { withCredentials: true, maxRedirects: 0 })
    .catch(() => {});
};

export const deleteAccount = async (): Promise<void> => {
  await axios.delete(API_URL + "/auth/account", { withCredentials: true });
};
