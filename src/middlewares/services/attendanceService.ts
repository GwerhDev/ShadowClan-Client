import axios from "axios"
import { API_URL } from "../misc/const"

export const getShadowWarByDate: any = async (date: string, characterId?: string) => {
  const response: any = await axios.get(API_URL + "/clan-management/shadow-wars/by-date", { params: { date, characterId }, withCredentials: true })
    .then(response => response.data)
  return response;
};

export const getAttendanceWeek: any = async (date: string, characterId?: string) => {
  const response: any = await axios.get(API_URL + "/clan-management/attendance/week", { params: { date, characterId }, withCredentials: true })
    .then(response => response.data)
  return response;
};

export const getShadowWarAttendance: any = async (shadowWarId: string, characterId?: string) => {
  const response: any = await axios.get(API_URL + `/clan-management/attendance/shadow-war/${shadowWarId}`, { params: { characterId }, withCredentials: true })
    .then(response => response.data)
  return response;
};

export const setMemberAttendance: any = async (shadowWarId: string, memberId: string, attended: boolean, characterId?: string) => {
  const response: any = await axios.patch(
    API_URL + `/clan-management/attendance/shadow-war/${shadowWarId}/members/${memberId}`,
    { attended, characterId },
    { withCredentials: true }
  ).then(response => response.data)
  return response;
};

export const getAttendanceCycles: any = async (page?: number, characterId?: string, activityType?: 'shadow_war' | 'accursed_tower') => {
  const response: any = await axios.get(API_URL + "/clan-management/attendance/cycles", { params: { page: page || 1, characterId, activityType }, withCredentials: true })
    .then(response => response.data)
  return response;
};

export const createAttendanceCycle: any = async (data: { name: string; startDate: string; endDate: string; activityType: 'shadow_war' | 'accursed_tower' }, characterId?: string) => {
  const response: any = await axios.post(
    API_URL + "/clan-management/attendance/cycles",
    { ...data, characterId },
    { withCredentials: true }
  ).then(response => response.data)
  return response;
};

export const updateAttendanceCycle: any = async (cycleId: string, data: { name?: string; startDate?: string; endDate?: string; activityType?: 'shadow_war' | 'accursed_tower' }, characterId?: string) => {
  const response: any = await axios.patch(
    API_URL + `/clan-management/attendance/cycles/${cycleId}`,
    { ...data, characterId },
    { withCredentials: true }
  ).then(response => response.data)
  return response;
};

export const deleteAttendanceCycle: any = async (cycleId: string, characterId?: string) => {
  const response: any = await axios.delete(API_URL + `/clan-management/attendance/cycles/${cycleId}`, { params: { characterId }, withCredentials: true })
    .then(response => response.data)
  return response;
};

export const getAttendanceCycleReport: any = async (cycleId: string, characterId?: string) => {
  const response: any = await axios.get(API_URL + `/clan-management/attendance/cycles/${cycleId}`, { params: { characterId }, withCredentials: true })
    .then(response => response.data)
  return response;
};

export const getMyAttendance: any = async (characterId: string, range: '30' | '60' | '90' | 'cycle' = '30') => {
  const response: any = await axios.get(API_URL + `/attendance/character/${characterId}`, { params: { range }, withCredentials: true })
    .then(response => response.data)
  return response;
};
