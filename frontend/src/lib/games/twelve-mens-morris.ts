export type MorrisPlayer = 1 | 2;
export type MorrisMode = "2player" | "ai";
export type MorrisPhase = "placement" | "movement";

export type MorrisState = {
  board: number[];
  currentPlayer: MorrisPlayer;
  phase: MorrisPhase;
  unplacedPieces: [number, number];
  boardPieces: [number, number];
  selectedPoint: number | null;
  removingPiece: boolean;
  winner: MorrisPlayer | null;
  gameOver: boolean;
  lastAction: string;
};

export type MorrisActionResult = {
  nextState: MorrisState;
  changed: boolean;
};

export type MorrisAIMove =
  | { type: "place"; to: number }
  | { type: "move"; from: number; to: number }
  | { type: "remove"; at: number };

export const BOARD_POINTS = [
  { x: 10, y: 10 },
  { x: 50, y: 10 },
  { x: 90, y: 10 },
  { x: 90, y: 50 },
  { x: 90, y: 90 },
  { x: 50, y: 90 },
  { x: 10, y: 90 },
  { x: 10, y: 50 },
  { x: 20, y: 20 },
  { x: 50, y: 20 },
  { x: 80, y: 20 },
  { x: 80, y: 50 },
  { x: 80, y: 80 },
  { x: 50, y: 80 },
  { x: 20, y: 80 },
  { x: 20, y: 50 },
  { x: 30, y: 30 },
  { x: 50, y: 30 },
  { x: 70, y: 30 },
  { x: 70, y: 50 },
  { x: 70, y: 70 },
  { x: 50, y: 70 },
  { x: 30, y: 70 },
  { x: 30, y: 50 },
] as const;

export const CONNECTIONS: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0],
  [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 8],
  [16, 17], [17, 18], [18, 19], [19, 20], [20, 21], [21, 22], [22, 23], [23, 16],
  [1, 9], [9, 17], [3, 11], [11, 19], [5, 13], [13, 21], [7, 15], [15, 23],
  [0, 8], [8, 16], [2, 10], [10, 18], [4, 12], [12, 20], [6, 14], [14, 22],
];

export const MILLS: Array<[number, number, number]> = [
  [0, 1, 2], [2, 3, 4], [4, 5, 6], [6, 7, 0],
  [8, 9, 10], [10, 11, 12], [12, 13, 14], [14, 15, 8],
  [16, 17, 18], [18, 19, 20], [20, 21, 22], [22, 23, 16],
  [1, 9, 17], [3, 11, 19], [5, 13, 21], [7, 15, 23],
  [0, 8, 16], [2, 10, 18], [4, 12, 20], [6, 14, 22],
];

export function createInitialState(): MorrisState {
  return {
    board: new Array(24).fill(0),
    currentPlayer: 1,
    phase: "placement",
    unplacedPieces: [12, 12],
    boardPieces: [0, 0],
    selectedPoint: null,
    removingPiece: false,
    winner: null,
    gameOver: false,
    lastAction: "Choose an empty point to place your first piece.",
  };
}

function cloneState(state: MorrisState): MorrisState {
  return {
    ...state,
    board: [...state.board],
    unplacedPieces: [...state.unplacedPieces] as [number, number],
    boardPieces: [...state.boardPieces] as [number, number],
  };
}

function switchPlayer(player: MorrisPlayer): MorrisPlayer {
  return player === 1 ? 2 : 1;
}

function getPlayerIndex(player: MorrisPlayer): 0 | 1 {
  return player === 1 ? 0 : 1;
}

export function isMill(board: number[], point: number, player: number) {
  return MILLS.some(
    (mill) => mill.includes(point) && mill.every((index) => board[index] === player),
  );
}

function isPartOfAnyMill(board: number[], point: number) {
  const player = board[point];
  if (!player) {
    return false;
  }
  return MILLS.some(
    (mill) => mill.includes(point) && mill.every((index) => board[index] === player),
  );
}

function hasNonMillPieces(board: number[], player: MorrisPlayer) {
  return board.some((piece, index) => piece === player && !isPartOfAnyMill(board, index));
}

export function getRemovablePoints(board: number[], playerToRemove: MorrisPlayer) {
  return board
    .map((piece, index) => ({ piece, index }))
    .filter(({ piece, index }) => {
      if (piece !== playerToRemove) {
        return false;
      }
      return !isPartOfAnyMill(board, index) || !hasNonMillPieces(board, playerToRemove);
    })
    .map(({ index }) => index);
}

function areAdjacent(from: number, to: number) {
  return CONNECTIONS.some(([a, b]) => (a === from && b === to) || (a === to && b === from));
}

export function getLegalMoves(state: MorrisState, from: number) {
  const currentPlayerIndex = getPlayerIndex(state.currentPlayer);
  const canJump = state.boardPieces[currentPlayerIndex] === 3;

  return state.board
    .map((piece, index) => ({ piece, index }))
    .filter(({ piece, index }) => piece === 0 && (canJump || areAdjacent(from, index)))
    .map(({ index }) => index);
}

function playerHasAnyMoves(state: MorrisState, player: MorrisPlayer) {
  const playerIndex = getPlayerIndex(player);
  if (state.phase === "placement") {
    return true;
  }
  if (state.boardPieces[playerIndex] === 3) {
    return state.board.some((piece) => piece === 0);
  }
  return state.board.some((piece, index) => piece === player && getLegalMoves({ ...state, currentPlayer: player }, index).length > 0);
}

function finalizeTurn(state: MorrisState, formedMill: boolean, actionLabel: string) {
  if (formedMill) {
    state.removingPiece = true;
    state.selectedPoint = null;
    state.lastAction = `${actionLabel} Mill formed. Remove one opponent piece.`;
    return state;
  }

  state.removingPiece = false;
  state.selectedPoint = null;

  if (state.unplacedPieces[0] === 0 && state.unplacedPieces[1] === 0) {
    state.phase = "movement";
  }

  const nextPlayer = switchPlayer(state.currentPlayer);
  state.currentPlayer = nextPlayer;

  const nextPlayerIndex = getPlayerIndex(nextPlayer);
  if (
    state.phase === "movement" &&
    state.unplacedPieces[nextPlayerIndex] === 0 &&
    state.boardPieces[nextPlayerIndex] < 3
  ) {
    state.gameOver = true;
    state.winner = switchPlayer(nextPlayer);
    state.lastAction = `Player ${state.winner} wins.`;
    return state;
  }

  if (state.phase === "movement" && !playerHasAnyMoves(state, nextPlayer)) {
    state.gameOver = true;
    state.winner = switchPlayer(nextPlayer);
    state.lastAction = `Player ${state.winner} wins by blocking all moves.`;
    return state;
  }

  state.lastAction =
    state.phase === "placement"
      ? `Player ${nextPlayer}, place a piece on an empty point.`
      : `Player ${nextPlayer}, select a piece to move.`;
  return state;
}

export function applyHumanAction(state: MorrisState, point: number): MorrisActionResult {
  if (state.gameOver) {
    return { nextState: state, changed: false };
  }

  const next = cloneState(state);
  const current = next.currentPlayer;
  const currentIndex = getPlayerIndex(current);
  const opponent = switchPlayer(current);
  const opponentIndex = getPlayerIndex(opponent);

  if (next.removingPiece) {
    if (!getRemovablePoints(next.board, opponent).includes(point)) {
      return { nextState: state, changed: false };
    }
    next.board[point] = 0;
    next.boardPieces[opponentIndex] -= 1;
    return {
      nextState: finalizeTurn(next, false, `Player ${current} removed a piece.`),
      changed: true,
    };
  }

  if (next.phase === "placement") {
    if (next.board[point] !== 0) {
      return { nextState: state, changed: false };
    }
    next.board[point] = current;
    next.unplacedPieces[currentIndex] -= 1;
    next.boardPieces[currentIndex] += 1;
    return {
      nextState: finalizeTurn(next, isMill(next.board, point, current), `Player ${current} placed a piece.`),
      changed: true,
    };
  }

  if (next.selectedPoint === null) {
    if (next.board[point] !== current) {
      return { nextState: state, changed: false };
    }
    next.selectedPoint = point;
    next.lastAction = `Player ${current}, choose where to move this piece.`;
    return { nextState: next, changed: true };
  }

  if (point === next.selectedPoint) {
    next.selectedPoint = null;
    next.lastAction = `Player ${current}, select a piece to move.`;
    return { nextState: next, changed: true };
  }

  if (next.board[point] !== 0 || !getLegalMoves(next, next.selectedPoint).includes(point)) {
    return { nextState: state, changed: false };
  }

  next.board[point] = current;
  next.board[next.selectedPoint] = 0;
  next.selectedPoint = null;

  return {
    nextState: finalizeTurn(next, isMill(next.board, point, current), `Player ${current} moved a piece.`),
    changed: true,
  };
}

type CandidateScore = {
  move: MorrisAIMove;
  score: number;
};

function scorePlacement(board: number[], player: MorrisPlayer, position: number) {
  const temp = [...board];
  temp[position] = player;
  let score = 1;
  if (isMill(temp, position, player)) {
    score += 100;
  }
  const opponent = switchPlayer(player);
  const blockBoard = [...board];
  blockBoard[position] = opponent;
  if (isMill(blockBoard, position, opponent)) {
    score += 60;
  }
  if ([9, 11, 13, 15, 8, 10, 12, 14].includes(position)) {
    score += 8;
  }
  return score;
}

function scoreMove(state: MorrisState, from: number, to: number) {
  const board = [...state.board];
  board[from] = 0;
  board[to] = state.currentPlayer;
  let score = 1;
  if (isMill(board, to, state.currentPlayer)) {
    score += 100;
  }
  if ([9, 11, 13, 15, 8, 10, 12, 14].includes(to)) {
    score += 8;
  }
  return score;
}

function pickBest(items: CandidateScore[]) {
  const maxScore = Math.max(...items.map((item) => item.score));
  const best = items.filter((item) => item.score === maxScore);
  return best[Math.floor(Math.random() * best.length)];
}

export function getAIMove(state: MorrisState): MorrisAIMove | null {
  if (state.gameOver || state.currentPlayer !== 2) {
    return null;
  }

  if (state.removingPiece) {
    const removable = getRemovablePoints(state.board, 1);
    if (removable.length === 0) {
      return null;
    }
    const at = removable[Math.floor(Math.random() * removable.length)];
    return { type: "remove", at };
  }

  if (state.phase === "placement") {
    const candidates = state.board
      .map((piece, index) => ({ piece, index }))
      .filter(({ piece }) => piece === 0)
      .map(({ index }) => ({
        move: { type: "place", to: index } as MorrisAIMove,
        score: scorePlacement(state.board, 2, index),
      }));
    return candidates.length ? pickBest(candidates).move : null;
  }

  const candidates: CandidateScore[] = [];
  state.board.forEach((piece, from) => {
    if (piece !== 2) {
      return;
    }
    getLegalMoves(state, from).forEach((to) => {
      candidates.push({
        move: { type: "move", from, to },
        score: scoreMove(state, from, to),
      });
    });
  });

  return candidates.length ? pickBest(candidates).move : null;
}

export function applyAIMove(state: MorrisState, move: MorrisAIMove): MorrisState {
  if (move.type === "remove") {
    return applyHumanAction({ ...state }, move.at).nextState;
  }

  if (move.type === "place") {
    return applyHumanAction({ ...state }, move.to).nextState;
  }

  const selected = applyHumanAction({ ...state }, move.from).nextState;
  return applyHumanAction(selected, move.to).nextState;
}
