export class AIPlayer {
  private difficulty: number
  private maxDepth: number

  constructor(difficulty: number) {
    this.difficulty = difficulty
    this.maxDepth = difficulty === 1 ? 1 : difficulty === 2 ? 3 : 5
  }

  getBestMove(gameState: any): any {
    if (this.difficulty === 1) {
      return this.getRandomMove(gameState)
    }

    return this.minimax(gameState, this.maxDepth, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, true).move
  }

  getHint(gameState: any): any {
    // Return a good move for the human player
    return this.minimax(gameState, 2, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, false).move
  }

  private getRandomMove(gameState: any): any {
    const validMoves = this.getValidMoves(gameState)
    return validMoves[Math.floor(Math.random() * validMoves.length)]
  }

  private minimax(
    gameState: any,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
  ): { score: number; move: any } {
    if (depth === 0 || this.isGameOver(gameState)) {
      return { score: this.evaluateBoard(gameState), move: null }
    }

    const validMoves = this.getValidMoves(gameState)
    let bestMove = null

    if (isMaximizing) {
      let maxScore = Number.NEGATIVE_INFINITY

      for (const move of validMoves) {
        const newState = this.applyMove(gameState, move)
        const score = this.minimax(newState, depth - 1, alpha, beta, false).score

        if (score > maxScore) {
          maxScore = score
          bestMove = move
        }

        alpha = Math.max(alpha, score)
        if (beta <= alpha) break // Alpha-beta pruning
      }

      return { score: maxScore, move: bestMove }
    } else {
      let minScore = Number.POSITIVE_INFINITY

      for (const move of validMoves) {
        const newState = this.applyMove(gameState, move)
        const score = this.minimax(newState, depth - 1, alpha, beta, true).score

        if (score < minScore) {
          minScore = score
          bestMove = move
        }

        beta = Math.min(beta, score)
        if (beta <= alpha) break // Alpha-beta pruning
      }

      return { score: minScore, move: bestMove }
    }
  }

  private evaluateBoard(gameState: any): number {
    let score = 0

    // Piece count advantage
    score += (gameState.boardPieces[1] - gameState.boardPieces[0]) * 10

    // Mill formation bonus
    score += this.countMills(gameState, 2) * 20
    score -= this.countMills(gameState, 1) * 20

    // Potential mills
    score += this.countPotentialMills(gameState, 2) * 5
    score -= this.countPotentialMills(gameState, 1) * 5

    // Mobility (number of valid moves)
    score += this.countValidMoves(gameState, 2) * 2
    score -= this.countValidMoves(gameState, 1) * 2

    // Center control bonus
    const centerPositions = [9, 11, 13, 15] // Middle square corners
    for (const pos of centerPositions) {
      if (gameState.board[pos] === 2) score += 3
      if (gameState.board[pos] === 1) score -= 3
    }

    return score
  }

  private countMills(gameState: any, player: number): number {
    const mills = [
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
      // Cross lines
      [1, 9, 17],
      [3, 11, 19],
      [5, 13, 21],
      [7, 15, 23],
      // Diagonal mills - ADDED
      [0, 8, 16],
      [2, 10, 18],
      [4, 12, 20],
      [6, 14, 22],
    ]

    return mills.filter((mill) => mill.every((pos) => gameState.board[pos] === player)).length
  }

  private countPotentialMills(gameState: any, player: number): number {
    const mills = [
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
      // Cross lines
      [1, 9, 17],
      [3, 11, 19],
      [5, 13, 21],
      [7, 15, 23],
      // Diagonal mills - ADDED
      [0, 8, 16],
      [2, 10, 18],
      [4, 12, 20],
      [6, 14, 22],
    ]

    return mills.filter((mill) => {
      const playerPieces = mill.filter((pos) => gameState.board[pos] === player).length
      const emptySpaces = mill.filter((pos) => gameState.board[pos] === 0).length
      return playerPieces === 2 && emptySpaces === 1
    }).length
  }

  private countValidMoves(gameState: any, player: number): number {
    // Simplified valid move counting
    let count = 0

    if (gameState.phase === "placement") {
      return gameState.board.filter((piece: number) => piece === 0).length
    }

    // Count movement possibilities
    for (let i = 0; i < 24; i++) {
      if (gameState.board[i] === player) {
        // If player has 3 pieces, can jump anywhere
        if (gameState.boardPieces[player - 1] === 3) {
          count += gameState.board.filter((piece: number) => piece === 0).length
        } else {
          // Count adjacent empty spaces
          const connections = [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 4],
            [4, 5],
            [5, 6],
            [6, 7],
            [7, 0],
            [8, 9],
            [9, 10],
            [10, 11],
            [11, 12],
            [12, 13],
            [13, 14],
            [14, 15],
            [15, 8],
            [16, 17],
            [17, 18],
            [18, 19],
            [19, 20],
            [20, 21],
            [21, 22],
            [22, 23],
            [23, 16],
            [1, 9],
            [9, 17],
            [3, 11],
            [11, 19],
            [5, 13],
            [13, 21],
            [7, 15],
            [15, 23],
            [0, 8],
            [8, 16],
            [2, 10],
            [10, 18],
            [4, 12],
            [12, 20],
            [6, 14],
            [14, 22],
          ]

          for (const [a, b] of connections) {
            if (a === i && gameState.board[b] === 0) count++
            if (b === i && gameState.board[a] === 0) count++
          }
        }
      }
    }

    return count
  }

  private getValidMoves(gameState: any): any[] {
    // Return array of valid moves based on current game state
    const moves: any[] = []

    if (gameState.removingPiece) {
      // Return opponent pieces that can be removed
      const opponent = gameState.currentPlayer === 1 ? 2 : 1
      for (let i = 0; i < 24; i++) {
        if (gameState.board[i] === opponent) {
          moves.push({ type: "remove", position: i })
        }
      }
    } else if (gameState.phase === "placement") {
      // Return empty positions for placement
      for (let i = 0; i < 24; i++) {
        if (gameState.board[i] === 0) {
          moves.push({ type: "place", position: i })
        }
      }
    } else {
      // Return valid movement moves
      for (let from = 0; from < 24; from++) {
        if (gameState.board[from] === gameState.currentPlayer) {
          for (let to = 0; to < 24; to++) {
            if (gameState.board[to] === 0 && this.canMoveTo(gameState, from, to)) {
              moves.push({ type: "move", from, to })
            }
          }
        }
      }
    }

    return moves
  }

  private canMoveTo(gameState: any, from: number, to: number): boolean {
    // If player has only 3 pieces, they can jump anywhere
    if (gameState.boardPieces[gameState.currentPlayer - 1] === 3) {
      return true
    }

    // Otherwise, must move to adjacent connected point
    const connections = [
      // Outer square
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 0],
      // Middle square
      [8, 9],
      [9, 10],
      [10, 11],
      [11, 12],
      [12, 13],
      [13, 14],
      [14, 15],
      [15, 8],
      // Inner square
      [16, 17],
      [17, 18],
      [18, 19],
      [19, 20],
      [20, 21],
      [21, 22],
      [22, 23],
      [23, 16],
      // Cross connections
      [1, 9],
      [9, 17],
      [3, 11],
      [11, 19],
      [5, 13],
      [13, 21],
      [7, 15],
      [15, 23],
      // Diagonal connections - ADDED
      [0, 8],
      [8, 16],
      [2, 10],
      [10, 18],
      [4, 12],
      [12, 20],
      [6, 14],
      [14, 22],
    ]

    return connections.some(([a, b]) => (a === from && b === to) || (a === to && b === from))
  }

  private applyMove(gameState: any, move: any): any {
    // Create a new game state with the move applied
    const newState = JSON.parse(JSON.stringify(gameState))

    if (move.type === "place") {
      newState.board[move.position] = newState.currentPlayer
      newState.playerPieces[newState.currentPlayer - 1]--
      newState.boardPieces[newState.currentPlayer - 1]++
    } else if (move.type === "move") {
      newState.board[move.to] = newState.currentPlayer
      newState.board[move.from] = 0
    } else if (move.type === "remove") {
      const opponent = newState.currentPlayer === 1 ? 2 : 1
      newState.board[move.position] = 0
      newState.boardPieces[opponent - 1]--
    }

    // Switch player
    newState.currentPlayer = newState.currentPlayer === 1 ? 2 : 1

    return newState
  }

  private isGameOver(gameState: any): boolean {
    return gameState.gameOver || gameState.boardPieces[0] < 3 || gameState.boardPieces[1] < 3
  }
}
