import axios from "axios"
import { API_URL } from "../misc/const"
import { actorParams } from "./activeCharacter";
import type {
  ClanDetail, ClanInvitation, ClanInvitationInput, ClanMemberUpdate, ClanMembersPage,
  ClanMembersPageParams, FileImportResult, RosterType, SaveRosterPayload,
} from "../../interfaces";

// Gestión del clan (/clan-management/clan/:clanId/*) para líderes y oficiales.
// Las rutas verifican permisos sobre el personaje activo (actorParams).

const clanUrl = (clanId: string) => `${API_URL}/clan-management/clan/${clanId}`;

/** Opciones con el personaje activo como "actor". */
const actorOpts = () => ({ params: actorParams(), withCredentials: true });

export const getClanMembersPage = async (clanId: string, params: ClanMembersPageParams): Promise<ClanMembersPage> =>
  axios.get<ClanMembersPage>(`${clanUrl(clanId)}/members`, {
    params: { ...params, ...actorParams() },
    withCredentials: true,
  }).then(r => r.data);

export const getClanMembers = async (clanId: string): Promise<ClanDetail> =>
  axios.get<ClanDetail>(clanUrl(clanId), actorOpts()).then(r => r.data);

export const addClanMember = async (clanId: string, characterId: string): Promise<ClanDetail> =>
  axios.post<ClanDetail>(`${clanUrl(clanId)}/members`, { characterId }, actorOpts()).then(r => r.data);

/** El propio personaje abandona el clan (no usa el actor: el personaje va en el cuerpo). */
export const leaveClan = async (clanId: string, characterId: string): Promise<unknown> =>
  axios.post(`${clanUrl(clanId)}/leave`, { characterId }, { withCredentials: true }).then(r => r.data);

export const removeClanMember = async (clanId: string, characterId: string, reason?: string): Promise<unknown> =>
  axios.delete(`${clanUrl(clanId)}/members/${characterId}`, {
    data: { reason },
    params: actorParams(),
    withCredentials: true,
  }).then(r => r.data);

export const createClanCharacter = async (clanId: string, formData: { name: string; resonance?: number; currentClass?: string }): Promise<ClanDetail> =>
  axios.post<ClanDetail>(`${clanUrl(clanId)}/characters`, formData, actorOpts()).then(r => r.data);

export const updateClanMember = async (clanId: string, characterId: string, data: ClanMemberUpdate): Promise<unknown> =>
  axios.patch(`${clanUrl(clanId)}/members/${characterId}`, data, actorOpts()).then(r => r.data);

export const updateMemberRole = async (clanId: string, characterId: string, role: 'officer' | 'member'): Promise<unknown> =>
  axios.patch(`${clanUrl(clanId)}/members/${characterId}/role`, { role }, actorOpts()).then(r => r.data);

export const sendClanInvitation = async (clanId: string, data: ClanInvitationInput): Promise<ClanInvitation> =>
  axios.post<ClanInvitation>(`${clanUrl(clanId)}/invitations`, data, actorOpts()).then(r => r.data);

export const cancelClanInvitation = async (clanId: string, invitationId: string): Promise<void> => {
  await axios.delete(`${clanUrl(clanId)}/invitations/${invitationId}`, actorOpts());
};

/** Reemplaza los miembros del clan con los del archivo (.csv / .xlsx). */
export const syncClanMembers = async (clanId: string, file: File): Promise<FileImportResult> => {
  const formData = new FormData();
  formData.append('file', file);
  return axios.post<FileImportResult>(
    `${clanUrl(clanId)}/sync`,
    formData,
    { params: actorParams(), withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }
  ).then(r => r.data);
};

export const saveClanRoster = async (clanId: string, payload: SaveRosterPayload): Promise<void> => {
  await axios.patch(`${clanUrl(clanId)}/saved-roster`, payload, actorOpts());
};

export const autoAssignRoster = async (clanId: string, type: RosterType, currentFormation?: any): Promise<any> =>
  axios.post(`${clanUrl(clanId)}/auto-assign`, { type, formation: currentFormation }, actorOpts()).then(r => r.data);

/** Importa miembros desde archivo sin quitar a los existentes. */
export const bulkImportMembers = async (clanId: string, file: File): Promise<FileImportResult> => {
  const formData = new FormData();
  formData.append('file', file);
  return axios.post<FileImportResult>(
    `${clanUrl(clanId)}/bulk-import`,
    formData,
    { params: actorParams(), withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }
  ).then(r => r.data);
};
