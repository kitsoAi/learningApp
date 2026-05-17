"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, RotateCcw, Lightbulb } from "lucide-react"
import { GameEngine } from "../../lib/game-engine"
import { AIPlayer } from "../../lib/ai-player"
import { SoundManager } from "../../lib/sound-manager"

interface TwelveMensMorrisGameProps {
  difficulty: number
  soundEnabled: boolean
  darkMode: boolean
  isTutorial: boolean
  onGameEnd: (result: "win" | "loss" | "draw") => void
  onBackToMenu: () => void
}

export function TwelveMensMorrisGame({
  difficulty,
  soundEnabled,
  darkMode,
  isTutorial,
  onGameEnd,
  onBackToMenu,
}: TwelveMensMorrisGameProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const gameEngineRef = useRef<GameEngine | null>(null)
  const aiPlayerRef = useRef<AIPlayer | null>(null)
  const soundManagerRef = useRef<SoundManager | null>(null)
  const p5InstanceRef = useRef<any>(null)

  const [gameState, setGameState] = useState({
    phase: "placement" as "placement" | "movement",
    currentPlayer: 1,
    playerPieces: [12, 12],
    boardPieces: [0, 0],
    gameOver: false,
    winner: null as number | null,
    canUndo: false,
    validMoves: [] as number[],
    tutorialStep: 0,
    message: "",
  })

  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("p5").then((p5Module) => {
        const p5 = p5Module.default

        const sketch = (p: any) => {
          p.setup = () => {
            const canvas = p.createCanvas(600, 600)
            canvas.parent(canvasRef.current)

            // Initialize game components
            gameEngineRef.current = new GameEngine()
            aiPlayerRef.current = new AIPlayer(difficulty)
            soundManagerRef.current = new SoundManager(soundEnabled)

            updateGameState()
          }

          p.draw = () => {
            if (!gameEngineRef.current) return

            // Set theme colors
            const bgColor = darkMode ? [30, 30, 30] : [240, 240, 240]
            const lineColor = darkMode ? [200, 200, 200] : [60, 60, 60]
            const boardColor = darkMode ? [50, 50, 50] : [255, 255, 255]

            p.background(...bgColor)

            // Draw board background
            p.fill(...boardColor)
            p.stroke(...lineColor)
            p.strokeWeight(2)
            p.rect(50, 50, 500, 500, 10)

            drawBoard(p, lineColor)
            drawPieces(p)
            drawValidMoves(p)

            if (isTutorial) {
              drawTutorialOverlay(p)
            }
          }

          p.mousePressed = () => {
            if (!gameEngineRef.current || gameState.gameOver) return

            const clickedPoint = getClickedPoint(p.mouseX, p.mouseY)
            if (clickedPoint !== -1) {
              handlePointClick(clickedPoint)
            }
          }

          const drawBoard = (p: any, lineColor: number[]) => {
            p.stroke(...lineColor)
            p.strokeWeight(3)

            const positions = gameEngineRef.current!.getBoardPositions()
            const connections = gameEngineRef.current!.getConnections()

            // Draw connections
            connections.forEach(([from, to]) => {
              const pos1 = positions[from]
              const pos2 = positions[to]
              p.line(pos1.x, pos1.y, pos2.x, pos2.y)
            })

            // Draw points
            positions.forEach((pos, index) => {
              p.fill(darkMode ? [70, 70, 70] : [220, 220, 220])
              p.stroke(...lineColor)
              p.strokeWeight(2)
              p.circle(pos.x, pos.y, 20)

              // Point numbers for tutorial
              if (isTutorial) {
                p.fill(...lineColor)
                p.noStroke()
                p.textAlign(p.CENTER, p.CENTER)
                p.textSize(10)
                p.text(index, pos.x, pos.y)
              }
            })
          }

          const drawPieces = (p: any) => {
            const board = gameEngineRef.current!.getBoard()
            const positions = gameEngineRef.current!.getBoardPositions()

            board.forEach((piece, index) => {
              if (piece !== 0) {
                const pos = positions[index]
                const isPlayer1 = piece === 1

                // Piece colors
                p.fill(isPlayer1 ? [100, 150, 255] : [255, 100, 100])
                p.stroke(darkMode ? [255, 255, 255] : [0, 0, 0])
                p.strokeWeight(2)
                p.circle(pos.x, pos.y, 30)

                // Inner highlight
                p.fill(isPlayer1 ? [150, 200, 255] : [255, 150, 150])
                p.noStroke()
                p.circle(pos.x - 3, pos.y - 3, 20)
              }
            })
          }

          const drawValidMoves = (p: any) => {
            if (gameState.validMoves.length === 0) return

            const positions = gameEngineRef.current!.getBoardPositions()

            gameState.validMoves.forEach((index) => {
              const pos = positions[index]
              p.fill(100, 255, 100, 100)
              p.noStroke()
              p.circle(pos.x, pos.y, 35)
            })
          }

          const drawTutorialOverlay = (p: any) => {
            // Tutorial messages and highlights
            p.fill(0, 0, 0, 150)
            p.noStroke()
            p.rect(0, 0, p.width, p.height)

            p.fill(255)
            p.textAlign(p.CENTER, p.CENTER)
            p.textSize(16)
            p.text(gameState.message, p.width / 2, 30)
          }

          const getClickedPoint = (mouseX: number, mouseY: number) => {
            const positions = gameEngineRef.current!.getBoardPositions()

            for (let i = 0; i < positions.length; i++) {
              const pos = positions[i]
              const distance = Math.sqrt((mouseX - pos.x) ** 2 + (mouseY - pos.y) ** 2)
              if (distance < 20) {
                return i
              }
            }
            return -1
          }

          const handlePointClick = (pointIndex: number) => {
            if (!gameEngineRef.current) return

            const result = gameEngineRef.current.handlePlayerMove(pointIndex)

            if (result.success) {
              soundManagerRef.current?.playSound("place")

              if (result.millFormed) {
                soundManagerRef.current?.playSound("mill")
                setGameState((prev) => ({ ...prev, message: "Mill formed! Remove an opponent piece." }))
              }

              updateGameState()

              // AI turn after a delay
              if (!gameState.gameOver && gameState.currentPlayer === 2) {
                setTimeout(() => {
                  makeAIMove()
                }, 500)
              }
            }
          }

          const makeAIMove = () => {
            if (!gameEngineRef.current || !aiPlayerRef.current) return

            const move = aiPlayerRef.current.getBestMove(gameEngineRef.current.getGameState())
            const result = gameEngineRef.current.handleAIMove(move)

            if (result.success) {
              soundManagerRef.current?.playSound("place")

              if (result.millFormed) {
                soundManagerRef.current?.playSound("mill")
              }

              updateGameState()
            }
          }

          const updateGameState = () => {
            if (!gameEngineRef.current) return

            const state = gameEngineRef.current.getGameState()

            setGameState((prev) => ({
              ...prev,
              ...state,
              canUndo: gameEngineRef.current!.canUndo(),
              validMoves: gameEngineRef.current!.getValidMoves(),
            }))

            if (state.gameOver && state.winner !== null) {
              const result = state.winner === 1 ? "win" : "loss"
              soundManagerRef.current?.playSound(result === "win" ? "win" : "lose")
              onGameEnd(result)
            }
          }
        }

        p5InstanceRef.current = new p5(sketch)
      })
    }

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove()
      }
    }
  }, [difficulty, soundEnabled, darkMode, isTutorial])

  const handleUndo = () => {
    if (gameEngineRef.current?.canUndo()) {
      gameEngineRef.current.undo()
      updateGameState()
    }
  }

  const handleRestart = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.restart()
      updateGameState()
    }
  }

  const handleHint = () => {
    if (!gameEngineRef.current || !aiPlayerRef.current) return

    const hint = aiPlayerRef.current.getHint(gameEngineRef.current.getGameState())
    setShowHint(true)

    setTimeout(() => setShowHint(false), 3000)
  }

  const updateGameState = () => {
    if (!gameEngineRef.current) return

    const state = gameEngineRef.current.getGameState()

    setGameState((prev) => ({
      ...prev,
      ...state,
      canUndo: gameEngineRef.current!.canUndo(),
      validMoves: gameEngineRef.current!.getValidMoves(),
    }))
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Button onClick={onBackToMenu} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Menu
          </Button>

          <div className="flex items-center gap-2">
            <Button onClick={handleHint} variant="outline" size="sm">
              <Lightbulb className="w-4 h-4" />
            </Button>
            <Button onClick={handleUndo} variant="outline" size="sm" disabled={!gameState.canUndo}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button onClick={handleRestart} variant="outline" size="sm">
              Restart
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Game Board */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-4">
                <div ref={canvasRef} className="flex justify-center" />
              </CardContent>
            </Card>
          </div>

          {/* Game Info */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="text-center">
                  <Badge variant={gameState.currentPlayer === 1 ? "default" : "secondary"}>
                    {gameState.currentPlayer === 1 ? "Your Turn" : "AI Turn"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Phase:</span>
                    <Badge variant="outline">{gameState.phase === "placement" ? "Placement" : "Movement"}</Badge>
                  </div>

                  <div className="flex justify-between">
                    <span>Your pieces:</span>
                    <span>{gameState.playerPieces[0]} left</span>
                  </div>

                  <div className="flex justify-between">
                    <span>AI pieces:</span>
                    <span>{gameState.playerPieces[1]} left</span>
                  </div>

                  <div className="flex justify-between">
                    <span>On board:</span>
                    <span>
                      {gameState.boardPieces[0]} vs {gameState.boardPieces[1]}
                    </span>
                  </div>
                </div>

                {gameState.gameOver && (
                  <div className="text-center">
                    <Badge variant={gameState.winner === 1 ? "default" : "destructive"}>
                      {gameState.winner === 1 ? "You Win!" : "AI Wins!"}
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
          </div>
        </div>
      </div>
    </div>
  )
}
