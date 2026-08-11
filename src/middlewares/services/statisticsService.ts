import axios from "axios"
import { API_URL } from "../misc/const"

export const getStatisticsOverview: any = async (range: '30' | '60' | '90' | 'cycle', characterId: string | undefined, type: 'shadow_war' | 'accursed_tower', includeMatches = false) => {
  const response: any = await axios.get(API_URL + "/clan-management/statistics/overview", { params: { range, characterId, type, includeMatches: includeMatches || undefined }, withCredentials: true })
    .then(response => response.data)
  return response;
};

export const getOverviewSummary: any = async (characterId?: string) => {
  const response: any = await axios.get(API_URL + "/clan-management/statistics/summary", { params: { characterId }, withCredentials: true })
    .then(response => response.data)
  return response;
};
