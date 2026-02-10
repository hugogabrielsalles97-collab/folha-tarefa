import { Task } from '../types';

// Endpoint de armazenamento centralizado.
// A URL foi configurada para um novo "bin" no npoint.io para permitir a colaboração em tempo real.
const NPOINT_BIN_URL = 'https://api.npoint.io/d9f8c7b6a5e4d3c2b1a0';

/**
 * Busca a lista de tarefas do serviço de backend.
 * @returns Uma promessa que resolve para um array de tarefas.
 */
export async function getTasks(): Promise<Task[]> {
  try {
    // Adicionado um parâmetro para evitar cache e garantir dados atualizados.
    const response = await fetch(`${NPOINT_BIN_URL}?_=${new Date().getTime()}`);
    if (!response.ok) {
      if (response.status === 404) {
        // Se o "bin" não for encontrado, ele é criado com uma lista vazia.
        await saveTasks([]);
        return [];
      }
      throw new Error(`Erro na rede: ${response.statusText}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Falha ao buscar tarefas:", error);
    throw error;
  }
}

/**
 * Salva a lista completa de tarefas no serviço de backend.
 * @param tasks O array completo de tarefas a ser salvo.
 */
export async function saveTasks(tasks: Task[]): Promise<void> {
  try {
    const response = await fetch(NPOINT_BIN_URL, {
      method: 'POST', // O método POST no npoint.io atualiza o conteúdo do bin.
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tasks),
    });

    if (!response.ok) {
      throw new Error(`Erro na rede: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Falha ao salvar tarefas:", error);
    throw error;
  }
}