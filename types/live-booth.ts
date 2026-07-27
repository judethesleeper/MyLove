export type LiveRole = "host" | "guest";
export type LivePhase = "waiting" | "countdown" | "complete";

export interface LiveParticipant {
  joined: boolean;
  ready: boolean;
  name: string;
}

export interface LiveRoundData {
  round: number;
  hostImage: string | null;
  guestImage: string | null;
}

export interface LiveRoom {
  roomId: string;
  phase: LivePhase;
  currentRound: number;
  countdownStartsAt: number | null;
  participants: {
    host: LiveParticipant;
    guest: LiveParticipant;
  };
}
