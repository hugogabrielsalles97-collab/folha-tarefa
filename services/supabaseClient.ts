
import { createClient } from '@supabase/supabase-js';
import { Discipline, TaskLevel, UnitOfMeasurement } from '../types';

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

const supabaseUrl = 'https://lngeppgwfziulcnaczab.supabase.co';
const supabaseAnonKey = 'sb_publishable_jkz6_kzprh2Z23g-pKBUyg_X4Zmq4pY';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);