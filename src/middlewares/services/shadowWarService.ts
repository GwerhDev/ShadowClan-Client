import axios from "axios"
import { API_URL } from "../misc/const"
import type { RespondAction, ShadowWar } from "../../interfaces";

const BASE = API_URL + "/clan-management/shadow-wars";
const opts = { withCredentials: true };

/** Agrega `characterId` al cuerpo solo si viene definido. */
const withActor = <T extends object>(body: T, characterId?: string | null) =>
  characterId ? { ...body, characterId } : body;

// ── Gestión (líder/oficial) ──────────────────────────────────────────────────

export const getShadowWars = async (page: number, characterId?: string | null): Promise<ShadowWar[]> =>
  axios.get(BASE, { params: { page: page || 1, characterId }, ...opts }).then(r => r.data.data);

export const getShadowWarById = async (id: string, characterId?: string | null): Promise<ShadowWar> =>
  axios.get<ShadowWar>(`${BASE}/${id}`, { params: { characterId }, ...opts }).then(r => r.data);

/** Actualiza una instancia (fecha, clan enemigo, formación, resultado…). */
export const updateShadowWarClan = async (id: string, formData: Record<string, any>, characterId?: string | null): Promise<ShadowWar> =>
  axios.patch<ShadowWar>(`${BASE}/${id}`, withActor(formData, characterId), opts).then(r => r.data);

export const createShadowWarManagement = async (date: string, enemyClan?: string | null, characterId?: string | null): Promise<ShadowWar> =>
  axios.post<ShadowWar>(BASE, { date, enemyClan: enemyClan || null, characterId }, opts).then(r => r.data);

/** Elimina una instancia. */
export const closeShadowWarManagement = async (id: string, characterId?: string | null): Promise<unknown> =>
  axios.delete(`${BASE}/${id}`, { params: characterId ? { characterId } : {}, ...opts }).then(r => r.data);

export const respondToShadowWar = async (shadowWarId: string, characterId: string, action: RespondAction = 'confirm'): Promise<unknown> =>
  axios.post(`${BASE}/${shadowWarId}/respond`, { characterId, action }, opts).then(r => r.data);

// ── Público (miembros) ───────────────────────────────────────────────────────

export const getActiveShadowWar = async (characterId?: string | null): Promise<ShadowWar | null> =>
  axios.get(API_URL + "/shadow-war/active", { params: { characterId }, ...opts }).then(r => r.data);

export const respondToPublicShadowWar = async (shadowWarId: string, characterId: string, action: RespondAction = 'confirm'): Promise<unknown> =>
  axios.post(API_URL + `/shadow-war/${shadowWarId}/respond`, { characterId, action }, opts).then(r => r.data);
