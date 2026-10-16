import axios from "axios"
import { API_URL } from "../misc/const"
import type { AttendanceRange, StatisticsType } from "../../interfaces";

const BASE = API_URL + "/clan-management/statistics";

/** Estadísticas agregadas del clan (estructura definida por el backend). */
export type StatisticsPayload = Record<string, any>;

export const getStatisticsOverview = async (range: AttendanceRange, characterId: string | undefined, type: StatisticsType, includeMatches = false): Promise<StatisticsPayload> =>
  axios.get<StatisticsPayload>(BASE + "/overview", { params: { range, characterId, type, includeMatches: includeMatches || undefined }, withCredentials: true })
    .then(r => r.data);

export const getOverviewSummary = async (characterId?: string): Promise<StatisticsPayload> =>
  axios.get<StatisticsPayload>(BASE + "/summary", { params: { characterId }, withCredentials: true })
    .then(r => r.data);
