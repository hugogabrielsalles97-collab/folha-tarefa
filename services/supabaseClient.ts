import { createClient } from '@supabase/supabase-js';
import { Task } from '../types';

// Define a estrutura do banco de dados para o cliente Supabase com tipos.
export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: Task;
        // O tipo para inserir novas tarefas, omitindo campos gerados pelo DB.
        Insert: Omit<Task, 'id' | 'created_at'>;
        Update: Partial<Task>;
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
  }
}

const supabaseUrl = 'https://lngeppgwfziulcnaczab.supabase.co';
// Esta é uma chave anônima pública e é seguro expô-la em uma aplicação do lado do cliente.
const supabaseAnonKey = 'sb_publishable_jkz6_kzprh2Z23g-pKBUyg_X4Zmq4pY';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
