import axios, { AxiosResponse } from "axios"
import { API_URL } from "../misc/const"
import type { Task, TaskInput } from "../../interfaces";

// Tareas (diarias, de clan) y su registro de completado.

export const getTasks = async (date: Date | string | null, type: string, character: string | null): Promise<Task[]> =>
  axios.post<Task[]>(API_URL + "/task/", { date, type, character }, { withCredentials: true }).then(r => r.data);

export const createTask = async (formData: TaskInput): Promise<Task> =>
  axios.post<Task>(API_URL + "/task/create", formData, { withCredentials: true }).then(r => r.data);

export const updateTask = async (id: string, formData: TaskInput): Promise<Task> =>
  axios.patch<Task>(API_URL + "/task/update/" + id, formData, { withCredentials: true }).then(r => r.data);

/** Devuelve la respuesta completa de axios (no solo `data`). */
export const deleteTask = async (id: string): Promise<AxiosResponse> =>
  axios.delete(API_URL + "/task/delete/" + id, { withCredentials: true });

export const createCompletedTask = async (id: string, formData: TaskInput): Promise<unknown> =>
  axios.post(API_URL + "/completed-task/create/" + id, formData, { withCredentials: true }).then(r => r.data);

/** Devuelve la respuesta completa de axios (no solo `data`). */
export const deleteCompletedTask = async (id: string, formData: TaskInput): Promise<AxiosResponse> =>
  axios.patch(API_URL + "/completed-task/delete/" + id, formData, { withCredentials: true });
