
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Discipline, TaskLevel, UnitOfMeasurement, Resources } from '../types';

export interface DBTask {
  id: string;
  created_at?: string;
  name: string;
  discipline: Discipline;
  level: TaskLevel;
  obraDeArte?: string;
  apoio?: string;
  vao?: string;
  frente?: string;
  corte?: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  plannedQuantity?: number;
  actualQuantity?: number;
  quantityUnit?: UnitOfMeasurement;
  progress: number;
  photo_urls?: string[];
  plannedWeather?: string;
  actualWeather?: string;
  observations?: string;
  planned_resources?: Resources;
  actualResources?: Resources;
}

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: DBTask;
        Insert: Omit<DBTask, 'id' | 'created_at'>;
        Update: Partial<DBTask>;
      }
    }
  }
}

const initializeSupabase = (): SupabaseClient<Database> | null => {
  // FIX: Hardcoded credentials to fix execution environment issue.
  const supabaseUrl = "https://lngeppgwfziulcnaczab.supabase.co";
  const supabaseAnonKey = "sb_publishable_jkz6_kzprh2Z23g-pKBUyg_X4Zmq4pY";

  if (supabaseUrl && supabaseAnonKey) {
    try {
      return createClient<Database>(supabaseUrl, supabaseAnonKey);
    } catch (error) {
      console.error("Erro ao inicializar o cliente Supabase:", error);
      return null;
    }
  }
  
  console.error("As credenciais do Supabase (URL e Chave) não foram encontradas ou são inválidas.");
  return null;
};

export const supabase = initializeSupabase();