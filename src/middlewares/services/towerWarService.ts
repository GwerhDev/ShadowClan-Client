import axios from 'axios';
import { API_URL } from '../misc/const';

const BASE = API_URL + '/clan-management/accursed-tower';

export const getAccursedTowers = async () =>
  axios.get(BASE, { withCredentials: true }).then(r => r.data);

export const getActiveAccursedTower = async () =>
  axios.get(BASE + '/active', { withCredentials: true }).then(r => r.data);

export const createAccursedTower = async (towerNumber: number, date: string, enemyClan?: string | null) =>
  axios.post(BASE, { towerNumber, date, enemyClan: enemyClan || null }, { withCredentials: true }).then(r => r.data);

export const updateAccursedTower = async (id: string, data: { towerNumber?: number; date?: string; roster?: any; enemyClan?: string | null }) =>
  axios.patch(BASE + '/' + id, data, { withCredentials: true }).then(r => r.data);

export const deactivateAccursedTower = async (id: string) =>
  axios.delete(BASE + '/' + id, { withCredentials: true }).then(r => r.data);

export const completeAccursedTower = async (id: string) =>
  axios.patch(BASE + '/' + id, { completed: true }, { withCredentials: true }).then(r => r.data);
