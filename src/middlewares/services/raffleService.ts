import axios from "axios"
import { API_URL } from "../misc/const"
import { actorParams, activeCharacterId } from "./activeCharacter";
import type {
  PaginatedResponse, RaffleCriteria, RaffleDrawResult, RaffleEligibility, RaffleHistoryItem, RafflePrize, RaffleWin,
} from "../../interfaces";

// Sorteos del clan (líderes/oficiales del personaje activo) y avisos al ganador.

const BASE = API_URL + "/clan-management/raffles";
const opts = { withCredentials: true };

export const getRafflePrizes = async (): Promise<RafflePrize[]> =>
  axios.get<RafflePrize[]>(BASE + "/prizes", { params: actorParams(), ...opts }).then(r => r.data);

export const getRaffleEligibility = async (criteria: RaffleCriteria): Promise<RaffleEligibility> =>
  axios.post<RaffleEligibility>(BASE + "/eligible", { characterId: activeCharacterId(), criteria }, opts).then(r => r.data);

/** Sortea los premios en orden (quien gana sale del bombo para los siguientes). */
export const drawRaffle = async (prizeIds: string[], participantIds: string[], criteria: RaffleCriteria): Promise<RaffleDrawResult> =>
  axios.post<RaffleDrawResult>(BASE + "/draw", { characterId: activeCharacterId(), prizeIds, participantIds, criteria }, opts).then(r => r.data);

export const getRaffles = async (page = 1): Promise<PaginatedResponse<RaffleHistoryItem>> =>
  axios.get<PaginatedResponse<RaffleHistoryItem>>(BASE, { params: { ...actorParams(), page, limit: 10 }, ...opts }).then(r => r.data);

export const deleteRaffle = async (raffleId: string): Promise<void> => {
  await axios.delete(`${BASE}/${raffleId}`, { params: actorParams(), ...opts });
};

/** Premios ganados por mis personajes que aún no vi (avisos perdidos estando desconectado). */
export const getMyRaffleWins = async (): Promise<RaffleWin[]> =>
  axios.get<RaffleWin[]>(API_URL + "/raffle/my-wins", opts).then(r => r.data);

export const ackRaffleWin = async (raffleId: string, drawIndex: number): Promise<void> => {
  await axios.post(API_URL + `/raffle/${raffleId}/ack`, { drawIndex }, opts);
};
