// Tipos de las respuestas y cuerpos de la API usados por los servicios.
// Las referencias pobladas por el backend se tipan como el documento poblado.

import type { Character, Clan } from './index';

// ── Usuario ──────────────────────────────────────────────────────────────────

export type UserRole = 'walker' | 'user' | 'leader' | 'officer' | 'admin' | 'super_admin';

/** Clan tal como viene poblado dentro de los personajes del usuario (/auth). */
export interface UserCharacterClan {
  _id: string;
  name?: string;
  status?: string;
  /** IDs (sin poblar). */
  leader?: string | null;
  officer?: string[];
  member?: string[];
}

/** Personaje del usuario autenticado (con el clan poblado sin sus miembros). */
export interface UserCharacter extends Omit<Character, 'clan'> {
  clan?: UserCharacterClan | null;
}

export interface UserData {
  id: string;
  battletag: string;
  username?: string;
  discriminator?: string;
  role: UserRole;
  phone?: string;
  status?: string;
  character: UserCharacter[];
}

export interface AuthResponse {
  logged: boolean;
  userData: UserData;
}

export interface CharacterUpdate {
  name?: string;
  currentClass?: string;
  resonance?: number;
  armor?: number;
  armorPenetration?: number;
  power?: number;
  resistance?: number;
}

// ── Tareas ───────────────────────────────────────────────────────────────────

export interface Task {
  _id: string;
  title: string;
  type: string;
  fixed: boolean;
  date?: string;
  completed?: boolean;
  user?: string;
  character?: string;
}

export interface TaskInput {
  title?: string;
  type?: string;
  date?: Date | string | null;
  character?: string | null;
  [key: string]: unknown;
}

// ── Solicitudes / invitaciones ───────────────────────────────────────────────

export type RequestStatus = 'pending' | 'accepted' | 'rejected';
export type ReviewAction = 'accept' | 'reject';

interface BaseRequest {
  _id: string;
  status: RequestStatus | string;
  createdAt?: string;
}

export interface ClanRequest extends BaseRequest {
  user?: { _id: string; battletag?: string };
  character?: Character;
  clan?: Clan;
}

export interface CharacterClaim extends BaseRequest {
  character?: Character;
}

export interface CharacterCreationRequest extends BaseRequest {
  name: string;
  currentClass: string;
  resonance?: number;
}

export interface CharacterCreationInput {
  name: string;
  currentClass: string;
  resonance?: number;
}

export interface ClanClaimRequest extends BaseRequest {
  character?: Character;
  clan?: Clan;
  requestedRole: 'leader' | 'officer';
}

export interface ClanCreationRequest extends BaseRequest {
  character?: Character;
  clanName: string;
}

export interface ClanInvitation extends BaseRequest {
  clan?: Clan;
  character?: Character;
  role: 'officer' | 'member';
  proposedClass?: string | null;
  proposedResonance?: number | null;
}

// ── Gestión de clan ──────────────────────────────────────────────────────────

export type ClanMemberRole = 'leader' | 'officer' | 'member';
export type RosterType = 'accursed-tower' | 'shadow-war';

/** Detalle del clan devuelto por GET /clan-management/clan/:clanId. */
export interface ClanDetail extends Clan {
  pendingInvitations?: ClanInvitation[];
  savedShadowWarAlignments?: { last?: any; custom?: { name: string; data: any }[] };
  savedAccursedTowerAlignments?: { last?: any; custom?: { name: string; data: any }[] };
}

export interface ClanMemberRow extends Character {
  role?: ClanMemberRole;
  isExMember?: boolean;
  memberStatus?: string;
}

export interface ClanMembersPage {
  members: ClanMemberRow[];
  total: number;
  hasMore: boolean;
}

export interface ClanMembersPageParams {
  page: number;
  limit: number;
  q?: string;
  status?: 'all' | 'active' | 'ex';
}

export interface ClanMemberUpdate extends CharacterUpdate {
  memberStatus?: string;
}

export interface ClanInvitationInput {
  characterId: string;
  role?: 'officer' | 'member';
  proposedClass?: string;
  proposedResonance?: number;
}

/** Avisos de lectura de la planilla de plantilla. */
export interface RosterImportWarnings {
  unreadableDateColumns: string[];
  invalidNames: { row: number; value: string; reason: string }[];
  duplicateNames: string[];
  /** Columnas de fecha sin Guerra Sombría registrada (su asistencia no se puede cargar). */
  datesWithoutWar: string[];
}

export interface FileImportResult {
  results: { name: string; status: string; reason?: string; previousName?: string }[];
  removed?: number;
  warnings?: RosterImportWarnings;
}

export interface SyncCandidate { _id: string; name: string; currentClass: string | null; role: 'leader' | 'officer' | 'member' }

/** Vista previa de la sincronización de plantilla (no escribe nada). */
export interface ClanSyncPreview {
  summary: { rows: number; updated: number; rejoin: number; transfer: number; new: number; leaving: number };
  newCharacters: { name: string; row: number; data: Record<string, unknown> }[];
  transfers: { name: string; fromClan: string; blocked: boolean }[];
  /** Personajes de la plantilla actual que no figuran en la planilla (candidatos a reemplazar). */
  candidates: SyncCandidate[];
  warnings: RosterImportWarnings;
}

/** Decisión para un personaje nuevo: crearlo o reemplazar a uno existente. */
export type ClanSyncResolution = { action: 'create' } | { action: 'replace'; characterId: string };

export interface SaveRosterPayload {
  type: RosterType;
  slot: 'last' | 'custom';
  data?: any;
  name?: string;
  customIndex?: number | null;
  action?: 'delete';
}

// ── Publicaciones del clan ───────────────────────────────────────────────────

export type ClanPostSource = 'general' | 'shadow_war' | 'accursed_tower' | 'vigil_of_blades';

export interface ClanPost {
  _id: string;
  clan?: string;
  author?: Character;
  authorRole?: ClanMemberRole;
  content: string;
  source: ClanPostSource;
  referenceId?: string | null;
  auto?: boolean;
  createdAt: string;
  instanceDate?: string;
  instanceEnemyClan?: string;
  instanceConfirmed?: string[];
}

// ── Torre Maldita ────────────────────────────────────────────────────────────

export interface AccursedTowerRoster {
  group1: any[];
  group2: any[];
  group3: any[];
}

export interface AccursedTower {
  _id: string;
  clan?: string | null;
  towerNumber: number;
  date: string;
  enemyClan?: Clan | null;
  roster?: AccursedTowerRoster;
  finalRoster?: AccursedTowerRoster;
  confirmed?: (Character | string)[];
  declined?: (Character | string)[];
  result?: string;
  active?: boolean;
  completed?: boolean;
}

export interface AccursedTowerUpdate {
  towerNumber?: number;
  date?: string;
  roster?: any;
  finalRoster?: any;
  enemyClan?: string | null;
  result?: string;
  completed?: boolean;
}

export type RespondAction = 'confirm' | 'pending' | 'decline';

// ── Historial ────────────────────────────────────────────────────────────────

export type HistoryType = 'all' | 'shadow_war' | 'accursed_tower' | 'vigil_of_blades';

export interface HistoryPage<T = any> {
  data: T[];
  page?: number;
  pages?: number;
  total?: number;
}

export interface HistoryEntryInput {
  characterId: string;
  type: 'shadow_war' | 'accursed_tower';
  date: string;
  enemyClanName?: string;
  result: string;
  towerNumber?: number;
}

// ── Asistencia / estadísticas ────────────────────────────────────────────────

export type AttendanceRange = '30' | '60' | '90' | 'cycle';
export type CycleActivityType = 'shadow' | 'immortal';

export interface MembersAttendanceSummary {
  hasCycle: boolean;
  cycleIsOpen: boolean;
  clanPercentage: number;
  data: Record<string, { percentage: number; attended: number; totalActivities: number }>;
}

/** Resumen de asistencia de un personaje en un rango. */
export interface AttendanceSummary {
  hasCycle?: boolean;
  cycleIsOpen?: boolean;
  percentage: number;
  attended: number;
  totalActivities: number;
}

/** Semana de asistencia (página de miembros + días con Guerra Sombría). */
export interface AttendanceWeek {
  weekStart: string;
  days: any[];
  members: any[];
  total: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  [key: string]: unknown;
}

/** Respuesta de búsqueda de personajes por nombre (404 → { found: false }). */
export type CharacterSearchResult =
  | { found: true; characters: Character[] }
  | { found: false };

export type StatisticsType = 'shadow_war' | 'accursed_tower';
