
import { GoogleGenAI } from "@google/genai";
import { Task } from "../types";

// AVISO: Incorporar chaves de API diretamente no código do lado do cliente não é seguro para produção.
// O ideal é usar variáveis de ambiente e um backend para fazer as chamadas.
// Para este projeto, usaremos a chave diretamente, conforme solicitado.
const API_KEY = 'AIzaSyDkNBvZZletB2BXK3jWAhV21sr2D2tqlYw';

if (!API_KEY) {
    throw new Error("API Key do Gemini não encontrada.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const callGemini = async (prompt: string, modelName: string = 'gemini-flash-latest'): Promise<string> => {
     try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
        });
        
        if (!response.text) {
            throw new Error("A IA não retornou uma resposta textual válida.");
        }
        return response.text;

    } catch (error: any) {
        console.error("Erro na API Gemini:", error);
        
        let errorMessage = "Ocorreu um erro desconhecido ao contatar a IA.";
        if (error.message.includes('API key not valid')) {
            errorMessage = "A chave de API configurada é inválida. Por favor, verifique a chave.";
        } else if (error.message.includes('429')) {
             errorMessage = "Limite de requisições excedido. Tente novamente mais tarde.";
        } else {
            errorMessage = error.message;
        }
        
        throw new Error(errorMessage);
    }
}

/**
 * Analisa as observações de uma tarefa usando o Gemini.
 * @param text O texto das observações a ser analisado.
 * @returns A análise textual da IA.
 */
export async function analyzeObservations(text: string): Promise<string> {
    const prompt = `
        Você é um engenheiro de obras sênior, especialista em análise de riscos e planejamento. 
        Sua tarefa é analisar a seguinte anotação de diário de obra (RDO) e fornecer um resumo objetivo e acionável.

        Texto da Anotação: "${text}"

        Sua análise deve:
        1.  **Resumir os Pontos-Chave:** Identifique as informações mais importantes da anotação.
        2.  **Identificar Riscos e Problemas:** Destaque quaisquer riscos, atrasos potenciais, problemas de segurança, ou non-conformidades mencionadas.
        3.  **Sugerir Próximos Passos (se aplicável):** Se um problema for identificado, sugira brevemente uma ação ou quem deve ser notificado.

        Formate sua resposta de forma clara e concisa em português do Brasil, usando markdown simples (negrito para títulos e listas).
        Se nenhum risco for aparente, afirme isso claramente.
    `;
    return callGemini(prompt);
}

/**
 * Gera um rascunho de Relatório Diário de Obra (RDO) com base nas atividades do dia.
 * @param activities Um resumo textual das atividades do dia.
 * @param date A data do relatório no formato YYYY-MM-DD.
 * @returns O rascunho do RDO gerado pela IA.
 */
export async function generateRDODraft(activities: string, date: string): Promise<string> {
    const prompt = `
        Você é um engenheiro de obras sênior responsável pela elaboração do Relatório Diário de Obra (RDO).
        Sua tarefa é redigir um RDO formal e bem estruturado em português do Brasil para a data de ${new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {timeZone: 'UTC'})}.

        Use as seguintes informações, que são um compilado bruto das atividades do dia, para criar o relatório:
        --- INÍCIO DAS ATIVIDADES ---
        ${activities}
        --- FIM DAS ATIVIDADES ---

        Estruture o RDO da seguinte forma:
        1.  **Resumo Geral do Dia:** Uma breve visão geral do andamento dos trabalhos.
        2.  **Atividades Concluídas:** Liste as tarefas que foram finalizadas hoje.
        3.  **Atividades em Andamento:** Liste as tarefas que progrediram hoje, mas não foram concluídas.
        4.  **Ocorrências e Observações Relevantes:** Consolide e resuma as observações mais importantes (segurança, qualidade, atrasos, problemas com equipamentos, etc.). Se não houver, indique "Nenhuma ocorrência relevante registrada.".
        5.  **Condições Climáticas:** Mencione brevemente as condições do tempo, se houver informação sobre isso nas observações.

        Seja objetivo, técnico e use uma linguagem profissional. Formate a resposta usando markdown para clareza (títulos em negrito, listas com marcadores).
    `;
    return callGemini(prompt);
}


/**
 * Responde a uma pergunta sobre os dados do projeto usando a IA.
 * @param tasks A lista de todas as tarefas do projeto.
 * @param question A pergunta do usuário.
 * @returns A resposta da IA.
 */
export async function queryProjectData(tasks: Task[], question: string): Promise<string> {
    const getStatus = (task: Task) => {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const plannedEndDate = new Date(task.plannedEndDate + 'T00:00:00');
        if (task.progress === 100) return "Concluído";
        if (today > plannedEndDate) return "Atrasado";
        if (!task.actualStartDate) return "Não Iniciada";
        return "Em Andamento";
    };

    const tasksData = tasks.map(t => {
        const location = [t.obraDeArte, t.frente, t.apoio, t.vao, t.corte].filter(Boolean).join(' / ');
        return `
- Tarefa: ${t.name}
  - ID: ${t.id}
  - Disciplina: ${t.discipline} / ${t.level}
  - Local: ${location || 'N/A'}
  - Datas (Previsto): ${t.plannedStartDate} a ${t.plannedEndDate}
  - Datas (Real): ${t.actualStartDate || 'N/A'} a ${t.actualEndDate || 'N/A'}
  - Progresso: ${t.progress}%
  - Status: ${getStatus(t)}
  - Quantidade Prevista: ${t.plannedQuantity || 'N/A'} ${t.quantityUnit || ''}
  - Quantidade Realizada: ${t.actualQuantity || 'N/A'} ${t.quantityUnit || ''}
  - Observações: ${t.observations || 'Nenhuma'}
        `.trim();
    }).join('\n---\n');

    const prompt = `
        Você é um assistente de IA especialista em análise de dados de projetos de construção civil. Sua única fonte de informação são os dados brutos do projeto fornecidos abaixo. Responda à pergunta do usuário baseando-se EXCLUSIVAMENTE nestes dados. Não invente informações. Se a resposta não estiver nos dados, diga "Não encontrei essa informação nos dados do projeto." Formate suas respostas usando markdown para melhor legibilidade (listas, negrito, etc.).

        A data de hoje é ${new Date().toLocaleDateString('pt-BR')}.

        --- DADOS DO PROJETO ---
        ${tasksData}
        --- FIM DOS DADOS ---

        PERGUNTA DO USUÁRIO: "${question}"

        Sua Resposta:
    `;
    return callGemini(prompt);
}
