import axios from "axios";
import { API_URL } from "../misc/const";

export const getClanPosts: any = async (characterId: string, page = 1) => {
  const response: any = await axios.get(
    API_URL + `/clan-post?characterId=${characterId}&page=${page}`,
    { withCredentials: true }
  ).then(r => r.data);
  return response;
};

export const createClanPost: any = async (
  characterId: string,
  content: string,
  source: 'general' | 'shadow_war' | 'accursed_tower' = 'general',
  referenceId?: string | null,
) => {
  const response: any = await axios.post(
    API_URL + "/clan-post",
    { characterId, content, source, referenceId: referenceId ?? null },
    { withCredentials: true }
  ).then(r => r.data);
  return response;
};

export const updateClanPost: any = async (postId: string, content: string) => {
  const response: any = await axios.patch(
    API_URL + `/clan-post/${postId}`,
    { content },
    { withCredentials: true }
  ).then(r => r.data);
  return response;
};

export const deleteClanPost: any = async (postId: string) => {
  const response: any = await axios.delete(
    API_URL + `/clan-post/${postId}`,
    { withCredentials: true }
  ).then(r => r.data);
  return response;
};
