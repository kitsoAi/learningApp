import { SerializedGameState } from "./multiplayer"

export class GameEngine {
  private board: number[] = new Array(24).fill(0) // 0=empty, 1=player1, 2=player2
  private phase: "placement" | "movement" = "placement"
  private currentPlayer = 1
  private playerPieces: [number, number] = [12, 12] // pieces left to place
  private boardPieces: [number, number] = [0, 0] // pieces on board
  private gameOver = false
  private winner: number | null = null
  private moveHistory: any[] = []
  private selectedPiece = -1
  private removingPiece = false

  // Board positions (x, y coordinates)
  private positions = [
    // Outer square
    { x: 100, y: 100 },
    { x: 300, y: 100 },
    { x: 500, y: 100 },
    { x: 500, y: 300 },
    { x: 500, y: 500 },
    { x: 300, y: 500 },
    { x: 100, y: 500 },
    { x: 100, y: 300 },

    // Middle square
    { x: 150, y: 150 },
    { x: 300, y: 150 },
    { x: 450, y: 150 },
    { x: 450, y: 300 },
    { x: 450, y: 450 },
    { x: 300, y: 450 },
    { x: 150, y: 450 },
    { x: 150, y: 300 },

    // Inner square
    { x: 200, y: 200 },
    { x: 300, y: 200 },
    { x: 400, y: 200 },
    { x: 400, y: 300 },
    { x: 400, y: 400 },
    { x: 300, y: 400 },
    { x: 200, y: 400 },
    { x: 200, y: 300 },
  ]

  // Connection map for valid moves - Updated with diagonal connections
  private connections: [number, number][] = [
    // Outer square connections
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 0],
    // Middle square connections
    [8, 9],
    [9, 10],
    [10, 11],
    [11, 12],
    [12, 13],
    [13, 14],
    [14, 15],
    [15, 8],
    // Inner square connections
    [16, 17],
    [17, 18],
    [18, 19],
    [19, 20],
    [20, 21],
    [21, 22],
    [22, 23],
    [23, 16],
    // Cross connections (vertical/horizontal between squares)
    [1, 9],
    [9, 17],
    [3, 11],
    [11, 19],
    [5, 13],
    [13, 21],
    [7, 15],
    [15, 23],
    // Diagonal connections - NEW
    [0, 8],
    [8, 16], // Top-left diagonal line
    [2, 10],
    [10, 18], // Top-right diagonal line
    [4, 12],
    [12, 20], // Bottom-right diagonal line
    [6, 14],
    [14, 22], // Bottom-left diagonal line
  ]

  // Mill patterns (three in a row) - Updated with diagonal mills
  private mills = [
    // Outer square
    [0, 1, 2],
    [2, 3, 4],
    [4, 5, 6],
    [6, 7, 0],
    // Middle square
    [8, 9, 10],
    [10, 11, 12],
    [12, 13, 14],
    [14, 15, 8],
    // Inner square
    [16, 17, 18],
    [18, 19, 20],
    [20, 21, 22],
    [22, 23, 16],
    // Cross lines (vertical/horizontal connections between squares)
    [1, 9, 17],
    [3, 11, 19],
    [5, 13, 21],
    [7, 15, 23],
    // Diagonal mills - the ones you mentioned
    [0, 8, 16], // Top-left diagonal
    [2, 10, 18], // Top-right diagonal
    [4, 12, 20], // Bottom-right diagonal
    [6, 14, 22], // Bottom-left diagonal
  ]

  getBoardPositions() {
    return this.positions
  }

  getConnections() {
    return this.connections
  }

  getBoard() {
    return [...this.board]
  }

  getGameState() {
    return {
      board: [...this.board],
      phase: this.phase,
      currentPlayer: this.currentPlayer,
      playerPieces: [...this.playerPieces] as [number, number],
      boardPieces: [...this.boardPieces] as [number, number],
      gameOver: this.gameOver,
      winner: this.winner,
      selectedPiece: this.selectedPiece,
      removingPiece: this.removingPiece,
    } satisfies SerializedGameState
  }

  loadGameState(state: SerializedGameState) {
    this.board = [...state.board]
    this.phase = state.phase
    this.currentPlayer = state.currentPlayer
    this.playerPieces = [...state.playerPieces] as [number, number]
    this.boardPieces = [...state.boardPieces] as [number, number]
    this.gameOver = state.gameOver
    this.winner = state.winner
    this.selectedPiece = state.selectedPiece
    this.removingPiece = state.removingPiece
  }

  handlePlayerMove(pointIndex: number): { success: boolean; millFormed: boolean } {
    if (this.gameOver) {
      return { success: false, millFormed: false }
    }

    if (this.removingPiece) {
      return this.removePiece(pointIndex)
    }

    if (this.phase === "placement") {
      return this.placePiece(pointIndex)
    } else {
      return this.movePiece(pointIndex)
    }
  }

  handleAIMove(move: any): { success: boolean; millFormed: boolean } {
    if (this.gameOver || this.currentPlayer !== 2) {
      return { success: false, millFormed: false }
    }

    if (!move?.type) {
      return { success: false, millFormed: false }
    }

    if (move.type === "place") {
      return this.placePiece(move.position)
    }

    if (move.type === "move") {
      this.selectedPiece = move.from
      return this.movePiece(move.to)
    }

    if (move.type === "remove") {
      return this.removePiece(move.position)
    }

    return { success: false, millFormed: false }
  }

  private placePiece(pointIndex: number): { success: boolean; millFormed: boolean } {
    if (this.board[pointIndex] !== 0) {
      return { success: false, millFormed: false }
    }

    // Save state for undo
    this.saveState()

    this.board[pointIndex] = this.currentPlayer
    this.playerPieces[this.currentPlayer - 1]--
    this.boardPieces[this.currentPlayer - 1]++

    const millFormed = this.checkMill(pointIndex)

    if (!millFormed) {
      this.switchPlayer()
    } else {
      this.removingPiece = true
    }

    // Check if placement phase is over
    if (this.playerPieces[0] === 0 && this.playerPieces[1] === 0) {
      this.phase = "movement"
    }

    this.checkGameEnd()

    return { success: true, millFormed }
  }

  private movePiece(pointIndex: number): { success: boolean; millFormed: boolean } {
    if (this.selectedPiece === -1) {
      // Select piece to move
      if (this.board[pointIndex] === this.currentPlayer) {
        this.selectedPiece = pointIndex
        return { success: true, millFormed: false }
      }
      return { success: false, millFormed: false }
    } else {
      // Move selected piece
      if (this.board[pointIndex] !== 0) {
        return { success: false, millFormed: false }
      }

      const canMove = this.canMoveTo(this.selectedPiece, pointIndex)
      if (!canMove) {
        return { success: false, millFormed: false }
      }

      // Save state for undo
      this.saveState()

      this.board[pointIndex] = this.currentPlayer
      this.board[this.selectedPiece] = 0
      this.selectedPiece = -1

      const millFormed = this.checkMill(pointIndex)

      if (!millFormed) {
        this.switchPlayer()
      } else {
        this.removingPiece = true
      }

      this.checkGameEnd()

      return { success: true, millFormed }
    }
  }

  private removePiece(pointIndex: number): { success: boolean; millFormed: boolean } {
    const opponent = this.currentPlayer === 1 ? 2 : 1

    if (this.board[pointIndex] !== opponent) {
      return { success: false, millFormed: false }
    }

    // Can't remove piece that's part of a mill unless no other choice
    if (this.isPartOfMill(pointIndex) && this.hasNonMillPieces(opponent)) {
      return { success: false, millFormed: false }
    }

    this.board[pointIndex] = 0
    this.boardPieces[opponent - 1]--
    this.removingPiece = false
    this.switchPlayer()
    this.checkGameEnd()

    return { success: true, millFormed: false }
  }

  private canMoveTo(from: number, to: number): boolean {
    // If player has only 3 pieces, they can jump anywhere
    if (this.boardPieces[this.currentPlayer - 1] === 3) {
      return true
    }

    // Otherwise, must move to adjacent connected point
    return this.connections.some(([a, b]) => (a === from && b === to) || (a === to && b === from))
  }

  private checkMill(pointIndex: number): boolean {
    const player = this.board[pointIndex]
    return this.mills.some((mill) => mill.includes(pointIndex) && mill.every((pos) => this.board[pos] === player))
  }

  private isPartOfMill(pointIndex: number): boolean {
    const player = this.board[pointIndex]
    return this.mills.some((mill) => mill.includes(pointIndex) && mill.every((pos) => this.board[pos] === player))
  }

  private hasNonMillPieces(player: number): boolean {
    for (let i = 0; i < 24; i++) {
      if (this.board[i] === player && !this.isPartOfMill(i)) {
        return true
      }
    }
    return false
  }

  private switchPlayer(): void {
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1
  }

  private checkGameEnd(): void {
    // Check if a player has only 2 pieces
    if (this.boardPieces[0] < 3 && this.playerPieces[0] === 0) {
      this.gameOver = true
      this.winner = 2
      return
    }

    if (this.boardPieces[1] < 3 && this.playerPieces[1] === 0) {
      this.gameOver = true
      this.winner = 1
      return
    }

    // Check if current player has no valid moves
    if (this.phase === "movement" && !this.hasValidMoves()) {
      this.gameOver = true
      this.winner = this.currentPlayer === 1 ? 2 : 1
    }
  }

  private hasValidMoves(): boolean {
    for (let i = 0; i < 24; i++) {
      if (this.board[i] === this.currentPlayer) {
        // If player has 3 pieces, they can jump anywhere
        if (this.boardPieces[this.currentPlayer - 1] === 3) {
          return this.board.some((piece) => piece === 0)
        }

        // Check adjacent moves
        for (const [a, b] of this.connections) {
          const adjacent = a === i ? b : b === i ? a : -1
          if (adjacent !== -1 && this.board[adjacent] === 0) {
            return true
          }
        }
      }
    }
    return false
  }

  getValidMoves(): number[] {
    const validMoves: number[] = []

    if (this.removingPiece) {
      const opponent = this.currentPlayer === 1 ? 2 : 1
      for (let i = 0; i < 24; i++) {
        if (this.board[i] === opponent) {
          if (!this.isPartOfMill(i) || !this.hasNonMillPieces(opponent)) {
            validMoves.push(i)
          }
        }
      }
      return validMoves
    }

    if (this.phase === "placement") {
      for (let i = 0; i < 24; i++) {
        if (this.board[i] === 0) {
          validMoves.push(i)
        }
      }
    } else if (this.selectedPiece !== -1) {
      for (let i = 0; i < 24; i++) {
        if (this.board[i] === 0 && this.canMoveTo(this.selectedPiece, i)) {
          validMoves.push(i)
        }
      }
    }

    return validMoves
  }

  private saveState(): void {
    this.moveHistory.push({
      board: [...this.board],
      phase: this.phase,
      currentPlayer: this.currentPlayer,
      playerPieces: [...this.playerPieces],
      boardPieces: [...this.boardPieces],
      selectedPiece: this.selectedPiece,
      removingPiece: this.removingPiece,
    })
  }

  canUndo(): boolean {
    return this.moveHistory.length > 0
  }

  undo(): void {
    if (!this.canUndo()) return

    const lastState = this.moveHistory.pop()!
    this.board = lastState.board
    this.phase = lastState.phase
    this.currentPlayer = lastState.currentPlayer
    this.playerPieces = lastState.playerPieces
    this.boardPieces = lastState.boardPieces
    this.selectedPiece = lastState.selectedPiece
    this.removingPiece = lastState.removingPiece
    this.gameOver = false
    this.winner = null
  }

  restart(): void {
    this.board = new Array(24).fill(0)
    this.phase = "placement"
    this.currentPlayer = 1
    this.playerPieces = [12, 12]
    this.boardPieces = [0, 0]
    this.gameOver = false
    this.winner = null
    this.moveHistory = []
    this.selectedPiece = -1
    this.removingPiece = false
  }
}
