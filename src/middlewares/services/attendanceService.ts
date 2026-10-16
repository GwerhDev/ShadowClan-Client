import axios from "axios"
import { API_URL } from "../misc/const"
import type {
  AttendanceCycle, AttendanceCycleReport, AttendanceRange, AttendanceSummary, AttendanceWeek,
  AttendanceStatusFilter, CycleActivityType, MembersAttendanceSummary, PaginatedResponse, ShadowWarAttendance,
} from "../../interfaces";

const BASE = API_URL + "/clan-management/attendance";
const opts = { withCredentials: true };

export const getAttendanceWeek = async (date: string, characterId?: string, pageOpts?: { page?: number; limit?: number; q?: string }): Promise<AttendanceWeek> =>
  axios.get<AttendanceWeek>(BASE + "/week", { params: { date, characterId, ...pageOpts }, ...opts }).then(r => r.data);

export const getClanMembersAttendanceSummary = async (characterId: string, range: AttendanceRange = '30'): Promise<MembersAttendanceSummary> =>
  axios.get<MembersAttendanceSummary>(BASE + '/members-summary', { params: { characterId, range }, ...opts }).then(r => r.data);

export const getMemberAttendanceSummary = async (characterId: string, targetId: string, range: AttendanceRange = '30'): Promise<AttendanceSummary> =>
  axios.get<AttendanceSummary>(BASE + `/member/${targetId}/summary`, { params: { characterId, range }, ...opts }).then(r => r.data);

/** Asistencia de una Guerra Sombría: plantilla del clan con filtro por nombre y estado (filtrado en el backend). */
export const getShadowWarAttendance = async (
  shadowWarId: string,
  characterId: string | undefined,
  filters: { q?: string; status?: AttendanceStatusFilter } = {},
): Promise<ShadowWarAttendance> =>
  axios.get<ShadowWarAttendance>(BASE + `/shadow-war/${shadowWarId}`, {
    params: { characterId, q: filters.q || undefined, status: filters.status && filters.status !== 'all' ? filters.status : undefined },
    ...opts,
  }).then(r => r.data);

export const setMemberAttendance = async (shadowWarId: string, memberId: string, attended: boolean, characterId?: string): Promise<unknown> =>
  axios.patch(BASE + `/shadow-war/${shadowWarId}/members/${memberId}`, { attended, characterId }, opts).then(r => r.data);

// ── Ciclos ───────────────────────────────────────────────────────────────────

export const getAttendanceCycles = async (page?: number, characterId?: string, activityType?: CycleActivityType): Promise<PaginatedResponse<AttendanceCycle>> =>
  axios.get<PaginatedResponse<AttendanceCycle>>(BASE + "/cycles", { params: { page: page || 1, characterId, activityType }, ...opts }).then(r => r.data);

export const createAttendanceCycle = async (data: { startDate: string; endDate?: string; activityType: CycleActivityType }, characterId?: string): Promise<AttendanceCycle> =>
  axios.post<AttendanceCycle>(BASE + "/cycles", { ...data, characterId }, opts).then(r => r.data);

export const updateAttendanceCycle = async (cycleId: string, data: { startDate?: string; endDate?: string; activityType?: CycleActivityType }, characterId?: string): Promise<AttendanceCycle> =>
  axios.patch<AttendanceCycle>(BASE + `/cycles/${cycleId}`, { ...data, characterId }, opts).then(r => r.data);

export const deleteAttendanceCycle = async (cycleId: string, characterId?: string): Promise<unknown> =>
  axios.delete(BASE + `/cycles/${cycleId}`, { params: { characterId }, ...opts }).then(r => r.data);

export const getAttendanceCycleReport = async (cycleId: string, characterId?: string): Promise<AttendanceCycleReport> =>
  axios.get<AttendanceCycleReport>(BASE + `/cycles/${cycleId}`, { params: { characterId }, ...opts }).then(r => r.data);

// ── Público ──────────────────────────────────────────────────────────────────

export const getMyAttendance = async (characterId: string, range: AttendanceRange = '30'): Promise<AttendanceSummary> =>
  axios.get<AttendanceSummary>(API_URL + `/attendance/character/${characterId}`, { params: { range }, ...opts }).then(r => r.data);
