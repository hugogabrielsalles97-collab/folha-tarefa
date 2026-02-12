import { GoogleGenAI, Type } from "@google/genai";
import { Task, Resources } from "../types";

// A chave da API do Gemini é fornecida diretamente para garantir a funcionalidade.
const GEMINI_API_KEY = "AIzaSyA2Z4TEqd5N_zGv-Wh3VNvUmCua9obd82U";

if (!GEMINI_API_KEY) {
  throw new Error("A chave da API do Gemini não foi encontrada. A aplicação não pode funcionar sem ela.");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });


const callGemini = async (prompt: string, modelName: string = 'gemini-3-flash-preview'): Promise<string> => {
     try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
        });
        
        if (!response.text) {
            throw new Error("A IA não retornou uma resposta textual válida.");
        }
        return response.text;

    } catch (error: unknown) {
        console.error("Erro na API Gemini:", error);
        
        let errorMessage = "Ocorreu um erro desconhecido ao contatar a IA.";
        if (error instanceof Error) {
            if (error.message.includes('API key not valid')) {
                errorMessage = "A chave de API configurada é inválida. Por favor, verifique a chave nas suas variáveis de ambiente.";
            } else if (error.message.includes('429')) {
                errorMessage = "Limite de requisições excedido. Tente novamente mais tarde.";
            } else {
                errorMessage = error.message;
            }
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

/**
 * Analisa uma imagem de canteiro de obras em busca de riscos de segurança.
 * @param file O arquivo de imagem a ser analisado.
 * @returns O parecer de segurança da IA.
 */
export async function analyzeImageSafety(file: File): Promise<string> {
    const imagePart = {
        inlineData: {
            mimeType: file.type,
            data: await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(file);
            }),
        },
    };

    const prompt = `
        Você é um inspetor de segurança do trabalho altamente experiente, especializado em canteiros de obras de construção civil pesada. Sua tarefa é analisar a imagem fornecida e identificar potenciais riscos de segurança.

        Analise a imagem focando nos seguintes pontos, mas não se limite a eles:
        - **EPI (Equipamento de Proteção Individual):** Verifique se todos os trabalhadores estão usando capacete, óculos de segurança, luvas, botas e coletes de alta visibilidade, conforme apropriado para a tarefa.
        - **Trabalho em Altura:** Inspecione andaimes, plataformas, escadas e o uso de cintos de segurança e linhas de vida.
        - **Equipamentos e Maquinário:** Verifique a operação segura de máquinas pesadas, isolamento de áreas de risco e condições dos equipamentos.
        - **Escavações:** Observe a estabilidade de taludes e a presença de escoramento.
        - **Organização do Canteiro (Housekeeping):** Procure por materiais desorganizados, obstruções de passagem e riscos de tropeço.

        **Formato da Resposta:**
        - Comece sua resposta com "PARECER DE SEGURANÇA:".
        - Se a imagem aparenta estar segura e em conformidade com as boas práticas, escreva "SEGURO". Em seguida, adicione uma breve justificativa (ex: "Trabalhadores utilizando EPI completo.").
        - Se identificar QUALQUER risco, escreva "INSEGURO". Em seguida, liste os problemas encontrados em formato de tópicos curtos e diretos.

        Seja objetivo e conciso. Sua análise é crucial para a prevenção de acidentes.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [imagePart, { text: prompt }] },
        });
        
        if (!response.text) {
            throw new Error("A IA não retornou uma análise de imagem válida.");
        }
        return response.text;
    } catch (error: unknown) {
        console.error("Erro na análise de imagem com Gemini:", error);
        let errorMessage = "Ocorreu um erro desconhecido ao analisar a imagem.";
        if (error instanceof Error) {
            if (error.message.includes('429')) {
                errorMessage = "Limite de requisições excedido. Tente novamente mais tarde.";
            } else if (error.message) {
                errorMessage = error.message;
            }
        }
        throw new Error(errorMessage);
    }
}


/**
 * Sugere recursos (pessoal e equipamento) para uma tarefa de construção.
 * @param taskName O nome/descrição da tarefa.
 * @returns Um objeto com listas de pessoal e equipamentos sugeridos.
 */
export async function suggestResources(taskName: string): Promise<Resources> {
    const schema = {
        type: Type.OBJECT,
        properties: {
            personnel: {
                type: Type.ARRAY,
                description: "Lista de colaboradores necessários, com função e quantidade.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        role: { type: Type.STRING, description: "A função do colaborador (ex: Carpinteiro, Armador)." },
                        quantity: { type: Type.INTEGER, description: "A quantidade de colaboradores para essa função." }
                    },
                    required: ["role", "quantity"]
                }
            },
            equipment: {
                type: Type.ARRAY,
                description: "Lista de máquinas e equipamentos necessários.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "O nome da máquina/equipamento (ex: Betoneira, Escavadeira)." },
                        quantity: { type: Type.INTEGER, description: "A quantidade de unidades do equipamento." }
                    },
                    required: ["name", "quantity"]
                }
            }
        },
        required: ["personnel", "equipment"]
    };

    const prompt = `
        Você é um planejador de obras sênior. Para a atividade de construção civil "${taskName}", gere uma lista de recursos necessários, incluindo pessoal (por função) e equipamentos. Forneça uma estimativa realista e comum para uma equipe padrão para este tipo de serviço.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });

        if (!response.text) {
            throw new Error("A IA não retornou uma sugestão de recursos válida.");
        }
        
        const jsonResponse = JSON.parse(response.text);

        if (!jsonResponse.personnel || !jsonResponse.equipment) {
            throw new Error("A resposta da IA não contém os campos 'personnel' ou 'equipment'.");
        }
        
        return jsonResponse as Resources;

    } catch (error: unknown) {
        console.error("Erro ao sugerir recursos com Gemini:", error);
        let errorMessage = "Ocorreu um erro desconhecido ao sugerir recursos.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        throw new Error(errorMessage);
    }
}