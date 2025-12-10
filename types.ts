export interface PinyinItem {
  id: string;
  text: string;
  isTarget: boolean; // true if it matches the current round's goal (p or q)
  initialLetter: 'p' | 'q';
  colorClass: string;
  sizeClass: string;
  rotation: number;
  isFound: boolean;
}

export interface GameState {
  score: number;
  round: number;
  targetLetter: 'p' | 'q';
  items: PinyinItem[];
  isPlaying: boolean;
  gameStatus: 'intro' | 'playing' | 'round_complete';
}

export type AudioCache = Map<string, AudioBuffer>;