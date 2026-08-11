export interface Character {
  _id: string;
  name?: string;
  clan?: Clan;
  status?: string;
  resonance?:        number | undefined | null;
  currentClass?:     string;
  armor?:            number | null;
  armorPenetration?: number | null;
  power?:            number | null;
  resistance?:       number | null;
  score?:            number | null;
  whatsapp?:         string;
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
  declined?: Character[];
  completed?: boolean;
  clan?: string;
}

export interface AttendanceMember {
  _id: string;
  name: string;
  currentClass?: string;
  role: 'leader' | 'officer' | 'member';
  attended: boolean | null;
}

export interface ShadowWarAttendance {
  shadowWar: { _id: string; date: Date; enemyClan?: Clan; result?: string };
  members: AttendanceMember[];
}

export interface AttendanceCycle {
  _id: string;
  clan?: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

export interface AttendanceCycleReportMember {
  _id: string;
  name: string;
  currentClass?: string;
  role: 'leader' | 'officer' | 'member';
  attendedCount: number;
  markedCount: number;
  totalActivities: number;
  percentage: number;
}

export interface AttendanceCycleReport {
  cycle: AttendanceCycle;
  shadowWars: Array<{ _id: string; date: Date; enemyClan?: Clan; result?: string }>;
  members: AttendanceCycleReportMember[];
}