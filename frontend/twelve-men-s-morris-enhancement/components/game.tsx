"use client"

import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"
import { ArrowLeft, Lightbulb, RotateCcw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { GameEngine } from "../lib/game-engine"
import {
  MultiplayerConfig,
  RoomActionResponse,
  RoomSyncPayload,
  SerializedGameState,
} from "../lib/multiplayer"
import { AIPlayer } from "../lib/ai-player"
import { SoundManager } from "../lib/sound-manager"

interface TwelveMensMorrisGameProps {
  difficulty: number
  soundEnabled: boolean
  darkMode: boolean
  isTutorial: boolean
  playerMode: "local" | "ai" | "online"
  multiplayerConfig?: MultiplayerConfig | null
  onGameEnd: (result: "win" | "loss" | "draw") => void
  onBackToMenu: () => void
}

interface GameViewState extends SerializedGameState {
  canUndo: boolean
  validMoves: number[]
  message: string
}

const initialGameState: GameViewState = {
  board: new Array(24).fill(0),
  phase: "placement",
  currentPlayer: 1,
  playerPieces: [12, 12],
  boardPieces: [0, 0],
  gameOver: false,
  winner: null,
  selectedPiece: -1,
  removingPiece: false,
  canUndo: false,
  validMoves: [],
  message: "",
}

export function TwelveMensMorrisGame({
  difficulty,
  soundEnabled,
  darkMode,
  isTutorial,
  playerMode,
  multiplayerConfig,
  onGameEnd,
  onBackToMenu,
}: TwelveMensMorrisGameProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const gameEngineRef = useRef<GameEngine | null>(null)
  const aiPlayerRef = useRef<AIPlayer | null>(null)
  const soundManagerRef = useRef<SoundManager | null>(null)
  const p5InstanceRef = useRef<any>(null)
  const socketRef = useRef<Socket | null>(null)
  const gameStateRef = useRef<GameViewState>(initialGameState)
  const playerModeRef = useRef(playerMode)
  const roomSyncRef = useRef<RoomSyncPayload | null>(null)
  const reportedWinnerRef = useRef<number | null>(null)

  const [gameState, setGameState] = useState<GameViewState>(initialGameState)
  const [hintMessage, setHintMessage] = useState("")
  const [roomSync, setRoomSync] = useState<RoomSyncPayload | null>(null)
  const [roomError, setRoomError] = useState("")
  const [connectionLabel, setConnectionLabel] = useState(
    playerMode === "online" ? "Connecting to room..." : "",
  )
  const [playerNumber, setPlayerNumber] = useState<1 | 2 | null>(null)
  const [chatMessage, setChatMessage] = useState("")

  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  useEffect(() => {
    playerModeRef.current = playerMode
  }, [playerMode])

  const syncViewFromEngine = (message?: string) => {
    if (!gameEngineRef.current) {
      return
    }

    const state = gameEngineRef.current.getGameState()
    const nextState: GameViewState = {
      ...state,
      canUndo: playerModeRef.current !== "online" && gameEngineRef.current.canUndo(),
      validMoves: state.gameOver ? [] : gameEngineRef.current.getValidMoves(),
      message: message ?? gameStateRef.current.message,
    }

    gameStateRef.current = nextState
    setGameState(nextState)

    if (!state.gameOver) {
      reportedWinnerRef.current = null
      return
    }

    if (state.winner === null || reportedWinnerRef.current === state.winner) {
      return
    }

    reportedWinnerRef.current = state.winner

    if (playerModeRef.current === "online") {
      return
    }

    if (playerModeRef.current === "local") {
      return
    }

    const result = state.winner === 1 ? "win" : "loss"
    soundManagerRef.current?.playSound(result === "win" ? "win" : "lose")
    onGameEnd(result)
  }

  const syncViewFromRoom = (payload: RoomSyncPayload) => {
    roomSyncRef.current = payload

    if (gameEngineRef.current) {
      gameEngineRef.current.loadGameState(payload.gameState)
    }

    const nextState: GameViewState = {
      ...payload.gameState,
      canUndo: false,
      validMoves: payload.validMoves,
      message: payload.status,
    }

    gameStateRef.current = nextState
    setGameState(nextState)
    setRoomSync(payload)
  }

  const describeHint = (hint: { type?: string; position?: number; from?: number; to?: number } | null) => {
    if (!hint) {
      return "No hint available right now."
    }

    if (hint.type === "place") {
      return `Try placing at point ${hint.position}.`
    }

    if (hint.type === "move") {
      return `Try moving from point ${hint.from} to point ${hint.to}.`
    }

    if (hint.type === "remove") {
      return `Try removing the piece at point ${hint.position}.`
    }

    return "Think about your strongest mill setup."
  }

  const makeAIMove = () => {
    if (!gameEngineRef.current || !aiPlayerRef.current) {
      return
    }

    const move = aiPlayerRef.current.getBestMove(gameEngineRef.current.getGameState())
    const result = gameEngineRef.current.handleAIMove(move)

    if (!result.success) {
      return
    }

    soundManagerRef.current?.playSound("place")

    if (result.millFormed) {
      soundManagerRef.current?.playSound("mill")
    }

    syncViewFromEngine()
  }

  const sendRoomAction = (eventName: string, payload: Record<string, unknown>) => {
    socketRef.current?.emit(eventName, payload, (response: RoomActionResponse) => {
      if (!response.ok) {
        setRoomError(response.error ?? "Something went wrong.")
      } else {
        setRoomError("")
      }
    })
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    import("p5").then((p5Module) => {
      const p5 = p5Module.default

      const sketch = (p: any) => {
        p.setup = () => {
          const canvas = p.createCanvas(600, 600)
          canvas.parent(canvasRef.current)

          gameEngineRef.current = new GameEngine()
          aiPlayerRef.current = new AIPlayer(difficulty)
          soundManagerRef.current = new SoundManager(soundEnabled)

          if (roomSyncRef.current) {
            gameEngineRef.current.loadGameState(roomSyncRef.current.gameState)
            syncViewFromRoom(roomSyncRef.current)
          } else {
            syncViewFromEngine(
              isTutorial ? "Click an empty point to place your first piece." : "",
            )
          }
        }

        p.draw = () => {
          if (!gameEngineRef.current) {
            return
          }

          const bgColor = darkMode ? [30, 30, 30] : [240, 240, 240]
          const lineColor = darkMode ? [200, 200, 200] : [60, 60, 60]
          const boardColor = darkMode ? [50, 50, 50] : [255, 255, 255]

          p.background(...bgColor)
          p.fill(...boardColor)
          p.stroke(...lineColor)
          p.strokeWeight(2)
          p.rect(50, 50, 500, 500, 10)

          const positions = gameEngineRef.current.getBoardPositions()
          const connections = gameEngineRef.current.getConnections()
          const board = gameEngineRef.current.getBoard()

          connections.forEach(([from, to]) => {
            const pos1 = positions[from]
            const pos2 = positions[to]
            p.line(pos1.x, pos1.y, pos2.x, pos2.y)
          })

          positions.forEach((pos, index) => {
            p.fill(darkMode ? [70, 70, 70] : [220, 220, 220])
            p.stroke(...lineColor)
            p.strokeWeight(2)
            p.circle(pos.x, pos.y, 20)

            if (isTutorial) {
              p.fill(...lineColor)
              p.noStroke()
              p.textAlign(p.CENTER, p.CENTER)
              p.textSize(10)
              p.text(index, pos.x, pos.y)
            }
          })

          board.forEach((piece, index) => {
            if (piece === 0) {
              return
            }

            const pos = positions[index]
            const isPlayer1 = piece === 1
            p.fill(isPlayer1 ? [100, 150, 255] : [255, 100, 100])
            p.stroke(darkMode ? [255, 255, 255] : [0, 0, 0])
            p.strokeWeight(2)
            p.circle(pos.x, pos.y, 30)

            p.fill(isPlayer1 ? [150, 200, 255] : [255, 150, 150])
            p.noStroke()
            p.circle(pos.x - 3, pos.y - 3, 20)
          })

          gameStateRef.current.validMoves.forEach((index) => {
            const pos = positions[index]
            p.fill(100, 255, 100, 100)
            p.noStroke()
            p.circle(pos.x, pos.y, 35)
          })

          if (isTutorial) {
            p.fill(0, 0, 0, 150)
            p.noStroke()
            p.rect(0, 0, p.width, p.height)

            p.fill(255)
            p.textAlign(p.CENTER, p.CENTER)
            p.textSize(16)
            p.text(gameStateRef.current.message, p.width / 2, 30)
          }
        }

        p.mousePressed = () => {
          if (!gameEngineRef.current || gameStateRef.current.gameOver) {
            return
          }

          const positions = gameEngineRef.current.getBoardPositions()

          for (let index = 0; index < positions.length; index += 1) {
            const position = positions[index]
            const distance = Math.sqrt((p.mouseX - position.x) ** 2 + (p.mouseY - position.y) ** 2)

            if (distance >= 20) {
              continue
            }

            if (playerModeRef.current === "online") {
              if (!multiplayerConfig) {
                return
              }

              sendRoomAction("game:action", {
                roomId: multiplayerConfig.roomId,
                pointIndex: index,
              })
              return
            }

            const currentPlayerBeforeMove = gameEngineRef.current.getGameState().currentPlayer
            const result = gameEngineRef.current.handlePlayerMove(index)

            if (!result.success) {
              return
            }

            soundManagerRef.current?.playSound("place")

            if (result.millFormed) {
              soundManagerRef.current?.playSound("mill")
              syncViewFromEngine("Mill formed. Remove one of your opponent's pieces.")
            } else {
              syncViewFromEngine()
            }

            const nextState = gameEngineRef.current.getGameState()

            if (
              playerModeRef.current === "ai" &&
              currentPlayerBeforeMove === 1 &&
              nextState.currentPlayer === 2 &&
              !nextState.gameOver
            ) {
              window.setTimeout(() => {
                makeAIMove()
              }, 500)
            }

            return
          }
        }
      }

      p5InstanceRef.current = new p5(sketch)
    })

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove()
      }
    }
  }, [darkMode, difficulty, isTutorial, multiplayerConfig, soundEnabled])

  useEffect(() => {
    if (!soundManagerRef.current) {
      return
    }

    soundManagerRef.current.setEnabled(soundEnabled)
  }, [soundEnabled])

  useEffect(() => {
    if (playerMode !== "online" || !multiplayerConfig) {
      return
    }

    const socket = io(multiplayerConfig.serverUrl, {
      transports: ["websocket"],
    })

    socketRef.current = socket
    setConnectionLabel("Connecting to room...")
    setRoomError("")

    socket.on("connect", () => {
      setConnectionLabel("Connected")

      const eventName = multiplayerConfig.action === "create" ? "room:create" : "room:join"
      socket.emit(
        eventName,
        {
          roomId: multiplayerConfig.roomId,
          playerName: multiplayerConfig.playerName,
        },
        (response: RoomActionResponse) => {
          if (!response.ok) {
            setRoomError(response.error ?? "Unable to connect to the room.")
            return
          }

          setPlayerNumber(response.playerNumber ?? null)
        },
      )
    })

    socket.on("room:sync", (payload: RoomSyncPayload) => {
      setConnectionLabel(payload.isReady ? "Match live" : "Waiting for opponent")
      syncViewFromRoom(payload)
    })

    socket.on("disconnect", () => {
      setConnectionLabel("Disconnected")
    })

    socket.on("connect_error", () => {
      setConnectionLabel("Connection error")
      setRoomError("Could not reach the multiplayer server.")
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      roomSyncRef.current = null
      setRoomSync(null)
      setPlayerNumber(null)
      setChatMessage("")
    }
  }, [multiplayerConfig, playerMode])

  const handleUndo = () => {
    if (playerMode === "online") {
      return
    }

    if (gameEngineRef.current?.canUndo()) {
      gameEngineRef.current.undo()
      syncViewFromEngine()
    }
  }

  const handleRestart = () => {
    reportedWinnerRef.current = null

    if (playerMode === "online" && multiplayerConfig) {
      sendRoomAction("game:restart", { roomId: multiplayerConfig.roomId })
      return
    }

    if (gameEngineRef.current) {
      gameEngineRef.current.restart()
      syncViewFromEngine(isTutorial ? "Click an empty point to place your first piece." : "")
    }
  }

  const handleHint = () => {
    if (!gameEngineRef.current || !aiPlayerRef.current) {
      return
    }

    const hint = aiPlayerRef.current.getHint(gameEngineRef.current.getGameState())
    setHintMessage(describeHint(hint))
    window.setTimeout(() => setHintMessage(""), 3000)
  }

  const handleSendChat = () => {
    if (!multiplayerConfig) {
      return
    }

    const message = chatMessage.trim()
    if (!message) {
      return
    }

    sendRoomAction("chat:send", {
      roomId: multiplayerConfig.roomId,
      message,
    })
    setChatMessage("")
  }

  const currentTurnLabel =
    playerMode === "online"
      ? gameState.currentPlayer === playerNumber
        ? "Your turn"
        : roomSync?.isReady
          ? "Opponent's turn"
          : "Waiting for opponent"
      : playerMode === "local"
        ? `Player ${gameState.currentPlayer}'s Turn`
        : gameState.currentPlayer === 1
          ? "Your Turn"
          : "AI Turn"

  const playerOneLabel = playerMode === "online" ? roomSync?.players[0]?.name ?? "Player 1" : playerMode === "local" ? "Player 1" : "You"
  const playerTwoLabel = playerMode === "online" ? roomSync?.players[1]?.name ?? "Waiting..." : playerMode === "local" ? "Player 2" : "AI"

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button onClick={onBackToMenu} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Menu
          </Button>

          <div className="flex items-center gap-2">
            {playerMode === "ai" && (
              <Button onClick={handleHint} variant="outline" size="sm">
                <Lightbulb className="w-4 h-4 mr-2" />
                Hint
              </Button>
            )}
            <Button
              onClick={handleUndo}
              variant="outline"
              size="sm"
              disabled={playerMode === "online" || !gameState.canUndo}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Undo
            </Button>
            <Button onClick={handleRestart} variant="outline" size="sm">
              Restart
            </Button>
          </div>
        </div>

        {playerMode === "online" && (
          <Card>
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="space-y-1">
                <p className="font-semibold">Room {multiplayerConfig?.roomId}</p>
                <p className="text-muted-foreground">{connectionLabel}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="font-medium">{gameState.message}</p>
                <p className="text-muted-foreground">
                  You are Player {playerNumber ?? "?"} ({multiplayerConfig?.playerName})
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {roomError && (
          <Card className="border-red-200">
            <CardContent className="p-4 text-sm text-red-600">{roomError}</CardContent>
          </Card>
        )}

        {hintMessage && (
          <Card>
            <CardContent className="p-4 text-sm">{hintMessage}</CardContent>
          </Card>
        )}

        <div className={`grid gap-4 ${playerMode === "online" ? "grid-cols-1 xl:grid-cols-5" : "grid-cols-1 lg:grid-cols-4"}`}>
          <div className={playerMode === "online" ? "xl:col-span-3" : "lg:col-span-3"}>
            <Card>
              <CardContent className="p-4">
                <div ref={canvasRef} className="flex justify-center overflow-x-auto" />
              </CardContent>
            </Card>
          </div>

          <div className={`space-y-4 ${playerMode === "online" ? "xl:col-span-2" : ""}`}>
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="text-center">
                  <Badge variant={gameState.currentPlayer === 1 ? "default" : "secondary"}>
                    {currentTurnLabel}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Phase</span>
                    <Badge variant="outline">
                      {gameState.phase === "placement" ? "Placement" : "Movement"}
                    </Badge>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span>{playerOneLabel}</span>
                    <span>{gameState.playerPieces[0]} left</span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span>{playerTwoLabel}</span>
                    <span>{gameState.playerPieces[1]} left</span>
                  </div>

                  <div className="flex justify-between">
                    <span>On board</span>
                    <span>
                      {gameState.boardPieces[0]} vs {gameState.boardPieces[1]}
                    </span>
                  </div>
                </div>

                {gameState.gameOver && (
                  <div className="text-center">
                    <Badge variant={gameState.winner === 1 ? "default" : "destructive"}>
                      {playerMode === "online"
                        ? gameState.winner === playerNumber
                          ? "You win!"
                          : "You lose!"
                        : playerMode === "local"
                          ? `Player ${gameState.winner} wins!`
                          : gameState.winner === 1
                            ? "You win!"
                            : "AI wins!"}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {isTutorial && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Tutorial</h3>
                  <p className="text-sm text-muted-foreground">
                    {gameState.message || "Click on empty points to place your pieces."}
                  </p>
                </CardContent>
              </Card>
            )}

            {playerMode === "online" && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-semibold">Room Chat</h3>
                    <p className="text-sm text-muted-foreground">
                      Use the room code to invite a second player from another browser or device.
                    </p>
                  </div>

                  <div className="h-64 overflow-y-auto rounded-md border p-3 space-y-3">
                    {roomSync?.chat.length ? (
                      roomSync.chat.map((message) => (
                        <div key={message.id} className="space-y-1 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium">
                              {message.playerName}
                              {message.playerNumber === playerNumber ? " (You)" : ""}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(message.sentAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="rounded-md bg-muted px-3 py-2">{message.message}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Chat messages will appear here once someone says hello.
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={chatMessage}
                      onChange={(event) => setChatMessage(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault()
                          handleSendChat()
                        }
                      }}
                      placeholder="Type a message"
                    />
                    <Button onClick={handleSendChat}>Send</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
