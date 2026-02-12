
import { GoogleGenAI } from "@google/genai";

// AVISO: Incorporar chaves de API diretamente no código do lado do cliente não é seguro para produção.
// O ideal é usar variáveis de ambiente e um backend para fazer as chamadas.
// Para este projeto, usaremos a chave diretamente, conforme solicitado.
const API_KEY = 'AIzaSyDkNBvZZletB2BXK3jWAhV21sr2D2tqlYw';

if (!API_KEY) {
    throw new Error("API Key do Gemini não encontrada.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Analisa as observações de uma tarefa usando o Gemini.
 * @param text O texto das observações a ser analisado.
 * @returns A análise textual da IA.
 */
export async function analyzeObservations(text: string): Promise<string> {
    const model = 'gemini-flash-latest';
    
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

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        
        if (!response.text) {
            throw new Error("A IA não retornou uma resposta válida.");
        }
        return response.text;

    } catch (error: any) {
        console.error("Erro na API Gemini:", error);
        
        let errorMessage = "Ocorreu um erro desconhecido ao contatar a IA.";
        if (error.message.includes('API key not valid')) {
            errorMessage = "A chave de API configurada é inválida. Por favor, verifique a chave.";
        } else if (error.message.includes('429')) {
             errorMessage = "Limite de requisições excedido. Tente novamente mais tarde.";
        }
        
        throw new Error(errorMessage);
    }
}
