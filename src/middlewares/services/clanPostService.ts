import axios from "axios";
import { API_URL } from "../misc/const";
import { actorParams, activeCharacterId } from "./activeCharacter";
import type { ClanPost, ClanPostSource } from "../../interfaces";

/** Feed del clan del personaje indicado (filtrado por el backend). */
export const getClanPosts = async (characterId: string, page = 1): Promise<ClanPost[]> =>
  axios.get<ClanPost[]>(
    API_URL + `/clan-post?characterId=${characterId}&page=${page}`,
    { withCredentials: true }
  ).then(r => r.data);

export const createClanPost = async (
  characterId: string | null,
  content: string,
  source: ClanPostSource = 'general',
  referenceId?: string | null,
): Promise<ClanPost> =>
  axios.post<ClanPost>(
    API_URL + "/clan-post",
    { characterId, content, source, referenceId: referenceId ?? null },
    { withCredentials: true }
  ).then(r => r.data);

export const updateClanPost = async (postId: string, content: string): Promise<ClanPost> =>
  axios.patch<ClanPost>(
    API_URL + `/clan-post/${postId}`,
    { content, characterId: activeCharacterId() },
    { withCredentials: true }
  ).then(r => r.data);

export const deleteClanPost = async (postId: string): Promise<unknown> =>
  axios.delete(
    API_URL + `/clan-post/${postId}`,
    { params: actorParams(), withCredentials: true }
  ).then(r => r.data);
