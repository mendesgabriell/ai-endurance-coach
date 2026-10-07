/** Tipos do modelo do ciclo. O modelo é template; plan.ts expande em datas. */

export interface Bloco {
  /** "Bloco 0" */ n: string;
  /** nome curto: "Retomada" */ nm: string;
  /** janela: "29/09 – 18/10" */ dt: string;
  /** o que o bloco tem que entregar */ q: string;
}

export interface DiaModelo {
  /** dia da semana: seg..dom */ d: string;
  /** terreno: rua · esteira · trilha · leve */ t: string;
  km: number;
  /** troca o template de corrida do dia — ex.: "teste" */ s?: string;
  /** registro de execução (força feita), não prescrição */ g?: string;
  /** registro de execução: 1 = furou */ f?: number;
}

export interface SemanaModelo {
  /** "Sem 1" */ n: string;
  /** "28/09 – 04/10" */ dt: string;
  /** a qual bloco pertence: "Bloco 0" */ b: string;
  /** volume alvo da semana, em km */ km: number;
  /** marcador: realizada · teste · WTR · desc · BAU · "" */ tag: string;
  dias: DiaModelo[];
}

export interface Exercicio {
  n: string;
  /** séries e repetições */ s: string;
  /** músculos */ a: string;
  /** nota de execução */ nt?: string;
  /** 1 = máquina articulada */ maq?: number;
}

export interface SessaoForca {
  nome: string;
  sub: string;
  /** a lógica da sessão */ tip: string;
  ex: Exercicio[];
}

export interface SessaoCorrida {
  dia: string;
  n: string;
  t: string;
  loc: string;
  /** o objetivo da sessão */ obj: string;
  passos: string[];
  /** o que muda por bloco */ presc: Record<string, string>;
  /** a regra que manda nela */ reg: string;
}
