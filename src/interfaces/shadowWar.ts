export interface Member {
  _id: string;
  character: string; // Added character property
  class?: string; // Assuming class is a string
  resonance?: number; // Assuming resonance is a number
  whatsapp?: string; // Assuming whatsapp is a string
}

export interface Clan {
  _id: string;
  name: string;
  status?: 'top' | 'active' | 'ghost'; // Add status
  members?: number; // Add members count
  // Add other clan properties if known
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