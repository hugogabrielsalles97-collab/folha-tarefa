import { Task } from '../types';

// IMPORTANTE: Este é um endpoint de demonstração.
// Para usar a aplicação, crie seu próprio "bin" no https://www.npoint.io/
// e substitua a URL abaixo pela sua.
// O conteúdo inicial pode ser um array vazio: []
const NPOINT_BIN_URL = 'https://api.npoint.io/c8f2c50e74e6a0e6e7b5';

/**
 * Busca a lista de tarefas do serviço de backend.
 * @returns Uma promessa que resolve para um array de tarefas.
 */
export async function getTasks(): Promise<Task[]> {
  try {
    const response = await fetch(NPOINT_BIN_URL);
    if (!response.ok) {
      if (response.status === 404) {
        // Se o bin não for encontrado ou estiver vazio, retorna um array vazio.
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