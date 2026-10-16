// Punto de entrada de los servicios: re-exporta cada dominio para mantener
// los imports existentes (`from '.../middlewares/services'`).

export * from './userService';
export * from './taskService';
export * from './requestService';
export * from './clanManagementService';

export { getActiveShadowWar, getShadowWarById, updateShadowWarClan, getShadowWars, createShadowWarManagement, closeShadowWarManagement, completeShadowWarManagement, respondToShadowWar, respondToPublicShadowWar } from './shadowWarService';
export { getClanPosts, createClanPost, updateClanPost, deleteClanPost } from './clanPostService';
export { searchClans } from './clanService';
export { getAccursedTowers, getAccursedTowerManagement, getActiveAccursedTower, createAccursedTower, updateAccursedTower, deactivateAccursedTower, completeAccursedTower, searchEnemyClans, createEnemyClan, respondToTowerWar, respondToPublicTowerWar } from './towerWarService';
export { getHistory, getAccursedTowerById } from './historyService';
export { getCharacterByName } from './characterService';
export {
  getAttendanceWeek,
  setMemberAttendance,
  getShadowWarAttendance,
  getAttendanceCycles,
  createAttendanceCycle,
  updateAttendanceCycle,
  deleteAttendanceCycle,
  getAttendanceCycleReport,
  getMyAttendance,
  getClanMembersAttendanceSummary,
  getMemberAttendanceSummary,
} from './attendanceService';
export { getStatisticsOverview, getOverviewSummary } from './statisticsService';
