import axios from "axios"
import { API_URL } from "../misc/const"
import { activeCharacterId } from "./activeCharacter";
import type {
  CharacterClaim, CharacterCreationInput, CharacterCreationRequest, ClanClaimRequest,
  ClanCreationRequest, ClanInvitation, ClanRequest, ReviewAction,
} from "../../interfaces";

// Solicitudes iniciadas por el usuario (ingreso a clan, reclamos, creación) e invitaciones recibidas.

const opts = { withCredentials: true };

// ── Solicitudes de ingreso a clan ────────────────────────────────────────────

export const getClanRequests = async (): Promise<ClanRequest[]> =>
  axios.get<ClanRequest[]>(API_URL + "/clan-request", opts).then(r => r.data);

export const createClanRequest = async (characterId: string, clanId: string): Promise<ClanRequest> =>
  axios.post<ClanRequest>(API_URL + "/clan-request", { characterId, clanId }, opts).then(r => r.data);

/** Solicitudes pendientes del clan del personaje indicado (líder/oficial). */
export const getClanRequestsManagement = async (characterId?: string): Promise<ClanRequest[]> =>
  axios.get<ClanRequest[]>(API_URL + "/clan-request/manage", { params: { characterId }, ...opts }).then(r => r.data);

export const cancelClanRequest = async (id: string): Promise<unknown> =>
  axios.delete(API_URL + '/clan-request/' + id, opts).then(r => r.data);

export const reviewClanRequest = async (id: string, action: ReviewAction): Promise<ClanRequest> =>
  axios.patch<ClanRequest>(API_URL + "/clan-request/" + id, { action, characterId: activeCharacterId() }, opts).then(r => r.data);

// ── Reclamos y creación de personajes ────────────────────────────────────────

export const createCharacterClaim = async (characterId: string): Promise<CharacterClaim> =>
  axios.post<CharacterClaim>(API_URL + '/character-claim', { characterId }, opts).then(r => r.data);

export const getMyCharacterClaims = async (): Promise<CharacterClaim[]> =>
  axios.get<CharacterClaim[]>(API_URL + '/character-claim', opts).then(r => r.data);

export const createCharacterCreationRequest = async (formData: CharacterCreationInput): Promise<CharacterCreationRequest> =>
  axios.post<CharacterCreationRequest>(API_URL + '/character-creation-request', formData, opts).then(r => r.data);

export const getMyCharacterCreationRequests = async (): Promise<CharacterCreationRequest[]> =>
  axios.get<CharacterCreationRequest[]>(API_URL + '/character-creation-request', opts).then(r => r.data);

// ── Reclamo y creación de clanes ─────────────────────────────────────────────

export const createClanClaimRequest = async (data: { characterId: string; clanId: string; requestedRole: 'leader' | 'officer' }): Promise<ClanClaimRequest> =>
  axios.post<ClanClaimRequest>(API_URL + '/clan-claim-request', data, opts).then(r => r.data);

export const getMyClanClaimRequests = async (): Promise<ClanClaimRequest[]> =>
  axios.get<ClanClaimRequest[]>(API_URL + '/clan-claim-request', opts).then(r => r.data);

export const createClanCreationRequest = async (clanName: string, characterId: string): Promise<ClanCreationRequest> =>
  axios.post<ClanCreationRequest>(API_URL + '/clan-creation-request', { clanName, characterId }, opts).then(r => r.data);

export const getMyClanCreationRequests = async (): Promise<ClanCreationRequest[]> =>
  axios.get<ClanCreationRequest[]>(API_URL + '/clan-creation-request', opts).then(r => r.data);

// ── Invitaciones recibidas ───────────────────────────────────────────────────

export const getClanInvitations = async (characterId: string): Promise<ClanInvitation[]> =>
  axios.get<ClanInvitation[]>(API_URL + "/clan-invitation/character/" + characterId, opts).then(r => r.data);

export const reviewClanInvitation = async (id: string, action: ReviewAction): Promise<ClanInvitation> =>
  axios.patch<ClanInvitation>(API_URL + "/clan-invitation/" + id, { action }, opts).then(r => r.data);
