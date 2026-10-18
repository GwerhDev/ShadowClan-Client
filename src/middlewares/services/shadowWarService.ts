import axios from "axios"
import { API_URL } from "../misc/const"
import type { RespondAction, ShadowWar } from "../../interfaces";

const opts = { withCredentials: true };

/** Agrega `characterId` al cuerpo solo si viene definido. */
const withActor = <T extends object>(body: T, characterId?: string | null) =>
  characterId ? { ...body, characterId } : body;

/** Tipos de instancia con formación de Guerra Sombría. */
export type SWKind = 'shadow_war' | 'vigil_of_blades';

/**
 * Servicio para una instancia con formación de Guerra Sombría. La Guerra Sombría y la
 * Vigilia de Espadas comparten exactamente la misma API; solo cambian las rutas.
 */
export function createSWService(kind: SWKind) {
  const mgmt   = API_URL + (kind === 'shadow_war' ? '/clan-management/shadow-wars' : '/clan-management/vigil-of-blades');
  const pub    = API_URL + (kind === 'shadow_war' ? '/shadow-war' : '/vigil-of-blades');

  return {
    // ── Gestión (líder/oficial) ────────────────────────────────────────────
    list: async (page: number, characterId?: string | null): Promise<ShadowWar[]> =>
      axios.get(mgmt, { params: { page: page || 1, characterId }, ...opts }).then(r => r.data.data),

    getById: async (id: string, characterId?: string | null): Promise<ShadowWar> =>
      axios.get<ShadowWar>(`${mgmt}/${id}`, { params: { characterId }, ...opts }).then(r => r.data),

    /** Actualiza una instancia (fecha, clan enemigo, formación, resultado…). */
    update: async (id: string, formData: Record<string, any>, characterId?: string | null): Promise<ShadowWar> =>
      axios.patch<ShadowWar>(`${mgmt}/${id}`, withActor(formData, characterId), opts).then(r => r.data),

    create: async (date: string, enemyClan?: string | null, characterId?: string | null): Promise<ShadowWar> =>
      axios.post<ShadowWar>(mgmt, { date, enemyClan: enemyClan || null, characterId }, opts).then(r => r.data),

    /** Elimina una instancia. */
    remove: async (id: string, characterId?: string | null): Promise<unknown> =>
      axios.delete(`${mgmt}/${id}`, { params: characterId ? { characterId } : {}, ...opts }).then(r => r.data),

    respond: async (id: string, characterId: string, action: RespondAction = 'confirm'): Promise<unknown> =>
      axios.post(`${mgmt}/${id}/respond`, { characterId, action }, opts).then(r => r.data),

    // ── Público (miembros) ─────────────────────────────────────────────────
    getActive: async (characterId?: string | null): Promise<ShadowWar | null> =>
      axios.get(`${pub}/active`, { params: { characterId }, ...opts }).then(r => r.data),

    respondPublic: async (id: string, characterId: string, action: RespondAction = 'confirm'): Promise<unknown> =>
      axios.post(`${pub}/${id}/respond`, { characterId, action }, opts).then(r => r.data),
  };
}

export type SWService = ReturnType<typeof createSWService>;

export const shadowWarApi = createSWService('shadow_war');
export const vigilApi     = createSWService('vigil_of_blades');

// ── Compatibilidad: nombres existentes (Guerra Sombría) ─────────────────────
export const getShadowWars              = shadowWarApi.list;
export const getShadowWarById           = shadowWarApi.getById;
export const updateShadowWarClan        = shadowWarApi.update;
export const createShadowWarManagement  = shadowWarApi.create;
export const closeShadowWarManagement   = shadowWarApi.remove;
export const respondToShadowWar         = shadowWarApi.respond;
export const getActiveShadowWar         = shadowWarApi.getActive;
export const respondToPublicShadowWar   = shadowWarApi.respondPublic;
