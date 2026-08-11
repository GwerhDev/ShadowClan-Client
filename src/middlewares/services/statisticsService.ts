import axios from "axios"
import { API_URL } from "../misc/const"

export const getStatisticsOverview: any = async (range: '30' | '60' | '90' | 'cycle', characterId: string | undefined, type: 'shadow_war' | 'accursed_tower') => {
  const response: any = await axios.get(API_URL + "/clan-management/statistics/overview", { params: { range, characterId, type }, withCredentials: true })
    .then(response => response.data)
  return response;
};
