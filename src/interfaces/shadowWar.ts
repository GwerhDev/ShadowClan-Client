export interface Member {
  _id: string;
  character: string;
  class?: string;
  whatsapp?: string;
  resonance?: number;
}

export interface Character {
  _id: string;
  name: string;
  clan?: string;
  resonance?: number | undefined | null;
  currentClass?: string;
}

export interface Clan {
  _id: string;
  name: string;
  status?: 'top' | 'active' | 'ghost';
  members?: number;
}

export interface Match {
  group1: {
    member: (Member | undefined)[];
  };
  group2: {
    member: (Member | undefined)[];
  };
  result?: string; // Optional, as it's 'pending' initially
}

export interface ShadowWar {
  _id?: string; // Optional, as it might not exist for new wars
  date: Date;
  result: string;
  enemyClan: Clan;
  battle: {
    exalted: Match[];
    eminent: Match[];
    famed: Match[];
    proud: Match[];
  };
  confirmed: Member[];
}