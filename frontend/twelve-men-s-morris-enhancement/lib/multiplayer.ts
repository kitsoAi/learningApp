export interface MultiplayerPlayer {
  socketId: string
  name: string
  playerNumber: 1 | 2
}

export interface ChatMessage {
  id: string
  playerName: string
  playerNumber: 1 | 2
  message: string
  sentAt: string
}

export interface SerializedGameState {
  board: number[]
  phase: 'placement' | 'movement'
  currentPlayer: number
  playerPieces: [number, number]
  boardPieces: [number, number]
  gameOver: boolean
  winner: number | null
  selectedPiece: number
  removingPiece: boolean
}

export interface RoomSyncPayload {
  roomId: string
  players: MultiplayerPlayer[]
  chat: ChatMessage[]
  gameState: SerializedGameState
  validMoves: number[]
  isReady: boolean
  status: string
}

export interface RoomActionResponse {
  ok: boolean
  error?: string
  playerNumber?: 1 | 2
}

export interface MultiplayerConfig {
  action: 'create' | 'join'
  roomId: string
  playerName: string
  serverUrl: string
}

export const DEFAULT_SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ?? 'http://localhost:4001'

export function generateRoomCode(length = 6): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let roomCode = ''

  for (let index = 0; index < length; index += 1) {
    roomCode += characters[Math.floor(Math.random() * characters.length)]
  }

  return roomCode
}
