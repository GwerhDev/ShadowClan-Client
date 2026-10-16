import axios from "axios"
import { API_URL } from "../misc/const"

// Búsqueda pública de clanes. El Client nunca debe llamar a /admin/* (exclusivo del Dashboard).
export const searchClans = async (q: string): Promise<{ _id: string; name: string }[]> =>
  axios.get(API_URL + '/clan', { params: { name: q }, withCredentials: true }).then(r => r.data);
