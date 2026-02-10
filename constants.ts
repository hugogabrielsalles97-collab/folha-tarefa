import { Discipline, OAELevel, TerraplanagemLevel, ContencoesLevel } from './types';

export const DISCIPLINE_LEVELS: Record<Discipline, string[]> = {
  [Discipline.OAE]: Object.values(OAELevel),
  [Discipline.TERRAPLANAGEM]: Object.values(TerraplanagemLevel),
  [Discipline.CONTENCOES]: Object.values(ContencoesLevel),
};

export const OBRAS_DE_ARTE_OPTIONS = [
  'S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08', 'S09', 'S10',
  'S11', 'S12', 'S13', 'S14', 'S25', 'D15', 'D16', 'D17', 'D18', 'D19',
  'D20', 'D21', 'D22', 'D23', 'D24'
];

export const APOIOS_OPTIONS = [
  'E1', 'P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'E2'
];

export const VAOS_OPTIONS = [
  'E1-E2', 'E1-P0', 'E1-P1', 'P0-P1', 'P1-P2', 'P2-P3', 'P3-P4', 'P4-P5',
  'P5-P6', 'P6-P7', 'P7-P8', 'P8-P9', 'P9-P10', 'P10-E2', 'P1-E2', 'P2-E2',
  'P3-E2', 'P4-E2', 'P5-E2', 'P6-E2', 'P7-E2', 'P8-E2'
];

export const FUNDACOES_TASK_NAMES = [
  'Estaca Raiz',
  'Escavação do bloco',
  'Arrasamento das estacas',
  'Concreto magro',
  'Armação do bloco',
  'Forma do bloco',
  'Concreto do bloco',
  'Desforma do bloco',
  'Reaterro do bloco',
  'Apicoamento do bloco',
  'Armação da cortina',
  'Forma da cortina',
  'Concreto da cortina',
];

export const MESOESTRUTURA_TASK_NAMES = [
  'Andaime pilar 1° etapa', 'Andaime pilar 2° etapa', 'Andaime pilar 3° etapa', 'Andaime pilar 4° etapa', 'Andaime pilar 5° etapa', 'Andaime pilar 6° etapa', 'Andaime pilar 7° etapa', 'Andaime pilar 8° etapa', 'Andaime pilar 9° etapa', 'Andaime pilar 10° etapa',
  'Armação pilar 1° etapa', 'Armação pilar 2° etapa', 'Armação pilar 3° etapa', 'Armação pilar 4° etapa', 'Armação pilar 5° etapa', 'Armação pilar 6° etapa', 'Armação pilar 7° etapa', 'Armação pilar 8° etapa', 'Armação pilar 9° etapa', 'Armação pilar 10° etapa',
  'Forma pilar 1° etapa', 'Forma pilar 2° etapa', 'Forma pilar 3° etapa', 'Forma pilar 4° etapa', 'Forma pilar 5° etapa', 'Forma pilar 6° etapa', 'Forma pilar 7° etapa', 'Forma pilar 8° etapa', 'Forma pilar 9° etapa', 'Forma pilar 10° etapa',
  'Concreto pilar 1° etapa', 'Concreto pilar 2° etapa', 'Concreto pilar 3° etapa', 'Concreto pilar 4° etapa', 'Concreto pilar 5° etapa', 'Concreto pilar 6° etapa', 'Concreto pilar 7° etapa', 'Concreto pilar 8° etapa', 'Concreto pilar 9° etapa', 'Concreto pilar 10° etapa',
  'Desforma pilar',
  'Retirada do andaime pilar',
  'Cimbramento da travessa',
  'Forma de fundo da travessa',
  'Pré armação da travessa',
  'Armação travessa 1° etapa',
  'Armação travessa 2° etapa',
  'Forma lateral travessa 1° etapa',
  'Forma lateral travessa 2° etapa',
  'Concreto travessa 1°etapa',
  'Concreto travessa 2°etapa',
  'Desforma da travessa',
  'Retirada do cimbramento da travessa',
];

export const SUPERESTRUTURA_TASK_NAMES = [
  'Lançamento de vigas',
  'Armação do pilarete',
  'Forma do pilarete',
  'Concreto do pilarete',
  'Armação transversina',
  'Forma transversina',
  'Concreto transversina',
  'Montagem prélaje',
  'Cimbramento laje',
  'Armação laje',
  'Forma Laje',
  'Concreto laje',
  'Cimbramento laje elástica',
  'Armação laje elástica',
  'Forma laje elástica',
  'Concreto laje elástica',
  'Armação laje de transição',
  'Forma laje de transição',
  'Concreto Laje de transição',
  'Armação new jersey',
  'Concreto New Jersey',
  'Fabricação de Viga',
  'Fabricação de prélaje',
];

export const OAE_TASK_NAMES_BY_LEVEL: Record<string, string[]> = {
    [OAELevel.FUNDACOES]: FUNDACOES_TASK_NAMES,
    [OAELevel.MESOESTRUTURA]: MESOESTRUTURA_TASK_NAMES,
    [OAELevel.SUPERESTRUTURA]: SUPERESTRUTURA_TASK_NAMES,
};
