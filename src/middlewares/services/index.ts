import axios from "axios"
import { API_URL } from "../misc/const"
import { error } from "../misc/errors";

export const getUserData: any = async () => {
  const response: any = await axios.get(API_URL + "/auth", { withCredentials: true })
    .then(response => response.data)
  return response;
};

export const updateUserData: any = async (formData: any, id: any) => {
  const response: any = await axios.patch(API_URL + "/account/update/" + id, formData, { withCredentials: true })
    .then(response => response.data)
    .catch(() => { return { error: error.api.loadItemById } });
  return response;
};

export const getUsers: any = async () => {
  const response: any = await axios.get(API_URL + "/admin/users", { withCredentials: true })
    .then(response => response.data)
  return response;
};

export const getAdminCharacters: any = async () => {
  const response: any = await axios.get(API_URL + "/admin/characters", { withCredentials: true })
    .then(response => response.data)
  return response;
};

export const createAdminCharacter: any = async (formData: any) => {
  const response: any = await axios.post(API_URL + "/admin/characters", formData, { withCredentials: true })
    .then(response => response.data)
  return response;
};

export const updateAdminCharacter: any = async (formData: any) => {
  const response: any = await axios.patch(API_URL + "/admin/characters", formData, { withCredentials: true });
  return response.data;
};

export const deleteAdminCharacter: any = async (id: string) => {
  await axios.delete(API_URL + "/admin/characters/" + id, { withCredentials: true });
  return;
};

export const updateUser: any = async (id: string, formData: any) => {
  await axios.patch(API_URL + "/admin/users/" + id, formData, { withCredentials: true });
  return;
};

export const deleteUser: any = async (id: string) => {
  await axios.delete(API_URL + "/admin/users/" + id, { withCredentials: true });
  return;
};

export const getTasks: any = async (date: Date, type: string, character: string | null) => {
  const response: any = await axios.post(API_URL + "/task/", { date, type, character }, { withCredentials: true })
    .then(response => response.data)
  return response;
};

export const createTask: any = async (formData: any) => {
  const response: any = await axios.post(API_URL + "/task/create", formData, { withCredentials: true })
    .then(response => response.data)
  return response;
};

export const updateTask: any = async (id: string, formData: any) => {
  const response: any = await axios.patch(API_URL + "/task/update/" + id, formData, { withCredentials: true })
    .then(response => response.data)
  return response;
};

export const deleteTask: any = async (id: string) => {
  const response: any = await axios.delete(API_URL + "/task/delete/" + id, { withCredentials: true })
  return response;
};

export const createCompletedTask: any = async (id: string, formData: any) => {
  const response: any = await axios.post(API_URL + "/completed-task/create/" + id, formData, { withCredentials: true })
    .then(response => response.data)
  return response;
};

export const deleteCompletedTask: any = async (id: string, formData: any) => {
  const response: any = await axios.patch(API_URL + "/completed-task/delete/" + id, formData, { withCredentials: true })
  return response;
};

export const getAdminNotifications: any = async () => {
  const response: any = await axios.get(API_URL + "/admin/notifications", { withCredentials: true })
    .then(response => response.data);
  return response;
};

export const chatbotQuery: any = async (formData: any) => {
  const response: any = await axios.post(API_URL + "/guide/chatbot", formData, { withCredentials: true })
    .then(response => response.data);
  return response;
};

export const getChatbotModel: any = async () => {
  const response: any = await axios.get(API_URL + "/guide/chatbot-model")
    .then(response => response.data);
  return response;
};

export const getCharacter: any = async () => {
  const response: any = await axios.get(API_URL + "/character", { withCredentials: true })
    .then(response => response.data);
  return response;
};

export const updateCharacter: any = async (id: string, data: { name?: string; currentClass?: string; resonance?: number }) => {
  const response: any = await axios.put(API_URL + "/character/" + id, data, { withCredentials: true })
    .then(r => r.data);
  return response;
};

export const createCharacter: any = async (formData: any) => {
  try {
    const response: any = await axios.post(API_URL + "/character/create", formData, { withCredentials: true })
      .then(response => response.data);
    return response;

  } catch (error: any) {
    if (error.status === 409) {
      return error.response.data;
    }
    return error;
  }
};

export const getWarbands: any = async () => {
  const response: any = await axios.get(API_URL + "/warband/", { withCredentials: true })
    .then(response => response.data);
  return response;
};

export const logout: any = async () => {
  await axios.get(API_URL + "/logout/", { withCredentials: true, maxRedirects: 0 })
    .catch(() => {});
  return;
};

export const getClanRequests: any = async () => {
  const response: any = await axios.get(API_URL + "/clan-request", { withCredentials: true })
    .then(response => response.data);
  return response;
};

export const createClanRequest: any = async (characterId: string, clanId: string) => {
  const response: any = await axios.post(API_URL + "/clan-request", { characterId, clanId }, { withCredentials: true })
    .then(response => response.data);
  return response;
};

export const deleteAccount: any = async () => {
  await axios.delete(API_URL + "/auth/account", { withCredentials: true });
};

export const getClanRequestsManagement: any = async () => {
  const response: any = await axios.get(API_URL + "/clan-request/manage", { withCredentials: true })
    .then(response => response.data);
  return response;
};

export const reviewClanRequest: any = async (id: string, action: 'accept' | 'reject') => {
  const response: any = await axios.patch(API_URL + "/clan-request/" + id, { action }, { withCredentials: true })
    .then(response => response.data);
  return response;
};

export { createShadowWar, getNextShadowWar, getShadowWarById, updateShadowWar, getShadowWars } from './shadowWarService';
export { getClans, createClan, updateClan, deleteClan } from './clanService';

export const createCharacterClaim: any = async (characterId: string) => {
  const response: any = await axios.post(API_URL + '/character-claim', { characterId }, { withCredentials: true })
    .then(response => response.data);
  return response;
};

export const getMyCharacterClaims: any = async () => {
  const response: any = await axios.get(API_URL + '/character-claim', { withCredentials: true })
    .then(response => response.data);
  return response;
};

export const createCharacterCreationRequest: any = async (formData: { name: string; currentClass: string; resonance?: number }) => {
  const response: any = await axios.post(API_URL + '/character-creation-request', formData, { withCredentials: true })
    .then(response => response.data);
  return response;
};

export const getMyCharacterCreationRequests: any = async () => {
  const response: any = await axios.get(API_URL + '/character-creation-request', { withCredentials: true })
    .then(response => response.data);
  return response;
};
export { getCharacterByName } from './characterService';

export const getClanMembers: any = async (clanId: string) => {
  const response: any = await axios.get(API_URL + "/clan-management/clan/" + clanId, { withCredentials: true })
                                   .then(response => response.data);
  return response;
};

export const addClanMember: any = async (clanId: string, characterId: string) => {
  const response: any = await axios.post(API_URL + "/clan-management/clan/" + clanId + "/members", { characterId }, { withCredentials: true })
                                   .then(response => response.data);
  return response;
};

export const removeClanMember: any = async (clanId: string, characterId: string) => {
  const response: any = await axios.delete(API_URL + "/clan-management/clan/" + clanId + "/members/" + characterId, { withCredentials: true })
                                   .then(response => response.data);
  return response;
};

export const createClanCharacter: any = async (clanId: string, formData: { name: string; resonance?: number; currentClass?: string }) => {
  const response: any = await axios.post(API_URL + "/clan-management/clan/" + clanId + "/characters", formData, { withCredentials: true })
                                   .then(response => response.data);
  return response;
};

export const updateClanMember: any = async (clanId: string, characterId: string, data: { currentClass?: string; resonance?: number; memberStatus?: string }) => {
  const response: any = await axios.patch(
    API_URL + "/clan-management/clan/" + clanId + "/members/" + characterId,
    data,
    { withCredentials: true }
  ).then(response => response.data);
  return response;
};

export const updateMemberRole: any = async (clanId: string, characterId: string, role: 'officer' | 'member') => {
  const response: any = await axios.patch(
    API_URL + "/clan-management/clan/" + clanId + "/members/" + characterId + "/role",
    { role },
    { withCredentials: true }
  ).then(response => response.data);
  return response;
};

export const sendClanInvitation: any = async (
  clanId: string,
  data: { characterId: string; role?: 'officer' | 'member'; proposedClass?: string; proposedResonance?: number }
) => {
  const response: any = await axios.post(
    API_URL + "/clan-management/clan/" + clanId + "/invitations",
    data,
    { withCredentials: true }
  ).then(r => r.data);
  return response;
};

export const cancelClanInvitation: any = async (clanId: string, invitationId: string) => {
  await axios.delete(
    API_URL + "/clan-management/clan/" + clanId + "/invitations/" + invitationId,
    { withCredentials: true }
  );
};

export const getClanInvitations: any = async () => {
  const response: any = await axios.get(API_URL + "/clan-invitation", { withCredentials: true })
    .then(r => r.data);
  return response;
};

export const reviewClanInvitation: any = async (id: string, action: 'accept' | 'reject') => {
  const response: any = await axios.patch(
    API_URL + "/clan-invitation/" + id,
    { action },
    { withCredentials: true }
  ).then(r => r.data);
  return response;
};