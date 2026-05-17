import cors from "cors"
import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"

import { GameEngine } from "../lib/game-engine"
import {
  ChatMessage,
  MultiplayerPlayer,
  RoomActionResponse,
  RoomSyncPayload,
} from "../lib/multiplayer"

interface RoomState {
  id: string
  engine: GameEngine
  players: MultiplayerPlayer[]
  chat: ChatMessage[]
}

const app = express()
app.use(cors())
app.use(express.json())

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "twelve-mens-morris-multiplayer" })
})

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
})

const rooms = new Map<string, RoomState>()

function buildRoomPayload(room: RoomState): RoomSyncPayload {
  const playerNames = room.players.map((player) => player.name).join(" and ")

  return {
    roomId: room.id,
    players: room.players,
    chat: room.chat,
    gameState: room.engine.getGameState(),
    validMoves: room.engine.getValidMoves(),
    isReady: room.players.length === 2,
    status:
      room.players.length === 2
        ? `${playerNames} are connected.`
        : `${room.players[0]?.name ?? "Player 1"} is waiting for an opponent.`,
  }
}

function emitRoomSync(room: RoomState) {
  const payload = buildRoomPayload(room)
  io.to(room.id).emit("room:sync", payload)
}

function findRoomBySocketId(socketId: string) {
  for (const room of rooms.values()) {
    if (room.players.some((player) => player.socketId === socketId)) {
      return room
    }
  }

  return null
}

function addChatMessage(room: RoomState, player: MultiplayerPlayer, message: string) {
  room.chat.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    playerName: player.name,
    playerNumber: player.playerNumber,
    message,
    sentAt: new Date().toISOString(),
  })

  room.chat = room.chat.slice(-50)
}

io.on("connection", (socket) => {
  socket.on(
    "room:create",
    (
      payload: { roomId: string; playerName: string },
      callback?: (response: RoomActionResponse) => void,
    ) => {
      const roomId = payload.roomId.trim().toUpperCase()
      const playerName = payload.playerName.trim()

      if (!roomId || !playerName) {
        callback?.({ ok: false, error: "Room code and player name are required." })
        return
      }

      if (rooms.has(roomId)) {
        callback?.({ ok: false, error: "That room code is already in use." })
        return
      }

      const room: RoomState = {
        id: roomId,
        engine: new GameEngine(),
        players: [{ socketId: socket.id, name: playerName, playerNumber: 1 }],
        chat: [],
      }

      rooms.set(roomId, room)
      socket.join(roomId)
      emitRoomSync(room)
      callback?.({ ok: true, playerNumber: 1 })
    },
  )

  socket.on(
    "room:join",
    (
      payload: { roomId: string; playerName: string },
      callback?: (response: RoomActionResponse) => void,
    ) => {
      const roomId = payload.roomId.trim().toUpperCase()
      const playerName = payload.playerName.trim()
      const room = rooms.get(roomId)

      if (!room) {
        callback?.({ ok: false, error: "Room not found." })
        return
      }

      if (room.players.length >= 2) {
        callback?.({ ok: false, error: "This room already has two players." })
        return
      }

      const player: MultiplayerPlayer = {
        socketId: socket.id,
        name: playerName,
        playerNumber: 2,
      }

      room.players.push(player)
      socket.join(roomId)
      emitRoomSync(room)
      callback?.({ ok: true, playerNumber: 2 })
    },
  )

  socket.on(
    "game:action",
    (
      payload: { roomId: string; pointIndex: number },
      callback?: (response: RoomActionResponse) => void,
    ) => {
      const room = rooms.get(payload.roomId)
      const player = room?.players.find((entry) => entry.socketId === socket.id)

      if (!room || !player) {
        callback?.({ ok: false, error: "Room session not found." })
        return
      }

      if (room.players.length < 2) {
        callback?.({ ok: false, error: "Waiting for another player to join." })
        return
      }

      if (room.engine.getGameState().currentPlayer !== player.playerNumber) {
        callback?.({ ok: false, error: "It is not your turn yet." })
        return
      }

      const result = room.engine.handlePlayerMove(payload.pointIndex)

      if (!result.success) {
        callback?.({ ok: false, error: "That move is not valid right now." })
        return
      }

      emitRoomSync(room)
      callback?.({ ok: true })
    },
  )

  socket.on(
    "game:restart",
    (payload: { roomId: string }, callback?: (response: RoomActionResponse) => void) => {
      const room = rooms.get(payload.roomId)
      const player = room?.players.find((entry) => entry.socketId === socket.id)

      if (!room || !player) {
        callback?.({ ok: false, error: "Room session not found." })
        return
      }

      room.engine.restart()
      room.chat = []
      emitRoomSync(room)
      callback?.({ ok: true })
    },
  )

  socket.on(
    "chat:send",
    (
      payload: { roomId: string; message: string },
      callback?: (response: RoomActionResponse) => void,
    ) => {
      const room = rooms.get(payload.roomId)
      const player = room?.players.find((entry) => entry.socketId === socket.id)
      const message = payload.message.trim()

      if (!room || !player) {
        callback?.({ ok: false, error: "Room session not found." })
        return
      }

      if (!message) {
        callback?.({ ok: false, error: "Message cannot be empty." })
        return
      }

      addChatMessage(room, player, message)
      emitRoomSync(room)
      callback?.({ ok: true })
    },
  )

  socket.on("disconnect", () => {
    const room = findRoomBySocketId(socket.id)

    if (!room) {
      return
    }

    room.players = room.players.filter((player) => player.socketId !== socket.id)

    if (room.players.length === 0) {
      rooms.delete(room.id)
      return
    }

    emitRoomSync(room)
  })
})

const port = Number(process.env.PORT ?? 4001)

httpServer.listen(port, () => {
  console.log(`Twelve Men's Morris socket server listening on ${port}`)
})
