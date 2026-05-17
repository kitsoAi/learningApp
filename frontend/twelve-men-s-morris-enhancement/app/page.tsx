"use client"

import { useEffect, useState } from "react"
import { HelpCircle, Play, RotateCcw, Settings, User, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { TwelveMensMorrisGame } from "@/components/game"
import {
  DEFAULT_SOCKET_SERVER_URL,
  generateRoomCode,
  MultiplayerConfig,
} from "@/lib/multiplayer"

type PlayerMode = "local" | "ai" | "online"

export default function GamePage() {
  const [gameMode, setGameMode] = useState<"menu" | "game" | "tutorial">("menu")
  const [playerMode, setPlayerMode] = useState<PlayerMode>("local")
  const [difficulty, setDifficulty] = useState(2)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [menuError, setMenuError] = useState("")
  const [gameStats, setGameStats] = useState({
    wins: 0,
    losses: 0,
    draws: 0,
  })
  const [playerName, setPlayerName] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const [multiplayerConfig, setMultiplayerConfig] = useState<MultiplayerConfig | null>(null)

  useEffect(() => {
    const savedStats = localStorage.getItem("morris-stats")
    if (savedStats) {
      setGameStats(JSON.parse(savedStats))
    }
  }, [])

  const updateStats = (result: "win" | "loss" | "draw") => {
    const nextStats = {
      ...gameStats,
      [result === "win" ? "wins" : result === "loss" ? "losses" : "draws"]:
        gameStats[result === "win" ? "wins" : result === "loss" ? "losses" : "draws"] + 1,
    }
    setGameStats(nextStats)
    localStorage.setItem("morris-stats", JSON.stringify(nextStats))
  }

  const resetStats = () => {
    const nextStats = { wins: 0, losses: 0, draws: 0 }
    setGameStats(nextStats)
    localStorage.setItem("morris-stats", JSON.stringify(nextStats))
  }

  const startOfflineGame = () => {
    setMultiplayerConfig(null)
    setMenuError("")
    setGameMode("game")
  }

  const startOnlineGame = (action: "create" | "join") => {
    const trimmedName = playerName.trim()
    const normalizedRoomCode =
      action === "create" ? generateRoomCode(6) : roomCode.trim().toUpperCase()

    if (!trimmedName) {
      setMenuError("Choose a player name before entering an online room.")
      return
    }

    if (!normalizedRoomCode) {
      setMenuError("Enter a room code to join an existing room.")
      return
    }

    setMenuError("")
    setRoomCode(normalizedRoomCode)
    setMultiplayerConfig({
      action,
      roomId: normalizedRoomCode,
      playerName: trimmedName,
      serverUrl: DEFAULT_SOCKET_SERVER_URL,
    })
    setGameMode("game")
  }

  const handleBackToMenu = () => {
    setGameMode("menu")
    setMultiplayerConfig(null)
    setMenuError("")
  }

  if (gameMode === "game" || gameMode === "tutorial") {
    return (
      <div className={`min-h-screen ${darkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
        <TwelveMensMorrisGame
          difficulty={difficulty}
          soundEnabled={soundEnabled}
          darkMode={darkMode}
          isTutorial={gameMode === "tutorial"}
          playerMode={playerMode}
          multiplayerConfig={multiplayerConfig}
          onGameEnd={updateStats}
          onBackToMenu={handleBackToMenu}
        />
      </div>
    )
  }

  return (
    <div className={`min-h-screen p-4 ${darkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Twelve Men's Morris</CardTitle>
            <p className="text-muted-foreground">
              Local play, AI matches, and real-time room play for two remote players.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {playerMode === "ai" && (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <Badge variant="default" className="text-lg px-4 py-2">
                    Wins: {gameStats.wins}
                  </Badge>
                </div>
                <div>
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    Draws: {gameStats.draws}
                  </Badge>
                </div>
                <div>
                  <Badge variant="destructive" className="text-lg px-4 py-2">
                    Losses: {gameStats.losses}
                  </Badge>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Game Options
                </h3>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Label htmlFor="mode">Play Mode</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={playerMode === "local" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPlayerMode("local")}
                      >
                        <Users className="w-4 h-4 mr-1" />
                        Local 2P
                      </Button>
                      <Button
                        variant={playerMode === "online" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPlayerMode("online")}
                      >
                        <Users className="w-4 h-4 mr-1" />
                        Online Room
                      </Button>
                      <Button
                        variant={playerMode === "ai" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPlayerMode("ai")}
                      >
                        <User className="w-4 h-4 mr-1" />
                        vs AI
                      </Button>
                    </div>
                  </div>

                  {playerMode === "ai" && (
                    <div>
                      <Label className="text-sm font-medium">
                        AI Difficulty: {["Easy", "Medium", "Hard"][difficulty - 1]}
                      </Label>
                      <Slider
                        value={[difficulty]}
                        onValueChange={(value) => setDifficulty(value[0])}
                        max={3}
                        min={1}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  )}

                  {playerMode === "online" && (
                    <div className="space-y-3 rounded-lg border p-4">
                      <div className="space-y-2">
                        <Label htmlFor="player-name">Player Name</Label>
                        <Input
                          id="player-name"
                          value={playerName}
                          onChange={(event) => setPlayerName(event.target.value)}
                          placeholder="Enter your display name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="room-code">Room Code</Label>
                        <Input
                          id="room-code"
                          value={roomCode}
                          onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                          placeholder="Join an existing room"
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => startOnlineGame("create")} className="flex-1 min-w-[160px]">
                          Create Online Room
                        </Button>
                        <Button
                          onClick={() => startOnlineGame("join")}
                          variant="outline"
                          className="flex-1 min-w-[160px]"
                        >
                          Join Room
                        </Button>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        The game client expects the Socket.io server at {DEFAULT_SOCKET_SERVER_URL}.
                      </p>
                    </div>
                  )}
                </div>

                {playerMode !== "online" && (
                  <Button onClick={startOfflineGame} className="w-full" size="lg">
                    {playerMode === "local" ? (
                      <>
                        <Users className="w-4 h-4 mr-2" />
                        Start Local Match
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4 mr-2" />
                        Play vs AI
                      </>
                    )}
                  </Button>
                )}

                <Button
                  onClick={() => {
                    setMultiplayerConfig(null)
                    setMenuError("")
                    setGameMode("tutorial")
                  }}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Tutorial Mode
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Settings
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sound">Sound Effects</Label>
                    <Switch id="sound" checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="theme">Dark Mode</Label>
                    <Switch id="theme" checked={darkMode} onCheckedChange={setDarkMode} />
                  </div>
                </div>
              </div>
            </div>

            {menuError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {menuError}
              </div>
            )}

            {playerMode === "ai" && (
              <div className="text-center pt-4 border-t">
                <Button onClick={resetStats} variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Statistics
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">How to Play</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <strong>Placement Phase:</strong> Players take turns placing their 12 pieces on empty
              points. Form mills to remove an opponent piece.
            </div>
            <div>
              <strong>Movement Phase:</strong> Move pieces to connected points. If you are down to 3
              pieces, you may jump to any empty point.
            </div>
            <div>
              <strong>Win Conditions:</strong> Reduce your opponent to 2 pieces or block all their
              legal moves.
            </div>
            <div>
              <strong>Online Rooms:</strong> Create a room code, share it, and the second player can
              join from another tab, browser, or device.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
