-- Create table for storing game history
CREATE TABLE IF NOT EXISTS game_history (
    id SERIAL PRIMARY KEY,
    player_name VARCHAR(100) DEFAULT 'Player',
    result VARCHAR(10) CHECK (result IN ('win', 'loss', 'draw')),
    difficulty INTEGER CHECK (difficulty IN (1, 2, 3)),
    game_duration INTEGER, -- in seconds
    moves_count INTEGER,
    final_score VARCHAR(10), -- e.g., "12-8" (player pieces - AI pieces)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_game_history_player_result 
ON game_history (player_name, result);

CREATE INDEX IF NOT EXISTS idx_game_history_created_at 
ON game_history (created_at DESC);
