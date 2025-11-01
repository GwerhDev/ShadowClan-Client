export interface Character {
  _id: string;
  name?: string;
  clan?: Clan;
  status?: string;
  resonance?: number | undefined | null;
  currentClass?: string;
}

export interface Clan {
  _id: string;
  name?: string;
  status?: string;
  member?: Character[];
  officer?: Character[];
  leader?: Character;
}

export interface Match {
  group1: {
    character: (Character | undefined)[];
  };
  group2: {
    character: (Character | undefined)[];
  };
  result?: string;
}

export interface ShadowWar {
  _id?: string;
  date: Date;
  result: string;
  enemyClan: Clan;
  battle: {
    exalted: Match[];
    eminent: Match[];
    famed: Match[];
    proud: Match[];
  };
  confirmed: Character[];
}