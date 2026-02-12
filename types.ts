
export enum Discipline {
  OAE = 'Obras de Arte Especiais',
  TERRAPLANAGEM = 'Terraplanagem',
  CONTENCOES = 'Contenções',
  PAVIMENTACAO = 'Pavimentação',
}

export enum OAELevel {
  FUNDACOES = 'Fundações',
  MESOESTRUTURA = 'Mesoestrutura',
  SUPERESTRUTURA = 'Superestrutura',
}

export enum TerraplanagemLevel {
  CORTE_1_2 = 'Corte de 1° e 2° categoria',
  CORTE_3 = 'Corte de 3° categoria',
  ATERRO = 'Aterro',
}

export enum ContencoesLevel {
  SOLO_GRAMPEADO = 'Solo grampeado',
  CORTINA_ATIRANTADA = 'Cortina atirantada',
  CONCRETO_PROJETADO = 'Concreto projetado',
}

export enum PavimentacaoLevel {
  PAVIMENTACAO = 'Pavimentação',
}

export type TaskLevel = OAELevel | TerraplanagemLevel | ContencoesLevel | PavimentacaoLevel | '';

export type UnitOfMeasurement = 'un' | 'm' | 'm²' | 'm³' | 'kg' | 't';

export interface Task {
  id: string;
  created_at?: string;
  name: string;
  discipline: Discipline;
  level: TaskLevel;
  
  frente?: string;
  corte?: string;
  obraDeArte?: string;
  apoio?: string;
  vao?: string;

  plannedStartDate: string; // YYYY-MM-DD
  plannedEndDate: string; // YYYY-MM-DD
  actualStartDate?: string; // YYYY-MM-DD
  actualEndDate?: string; // YYYY-MM-DD

  plannedWeather?: string;
  actualWeather?: string;

  plannedQuantity?: number;
  actualQuantity?: number;
  quantityUnit?: UnitOfMeasurement;
  
  progress: number; // 0-100
  observations?: string;
  photo_urls?: string[];
}

export interface ChatMessage {
  sender: 'user' | 'ai' | 'error';
  text: string;
}

export interface ImageSafetyAnalysis {
  status: 'analyzing' | 'safe' | 'unsafe' | 'error';
  analysis?: string;
}
