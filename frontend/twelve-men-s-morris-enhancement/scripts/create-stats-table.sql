-- Create table for storing game statistics
CREATE TABLE IF NOT EXISTS game_stats (
    id SERIAL PRIMARY KEY,
    player_name VARCHAR(100) DEFAULT 'Player',
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    total_games INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default stats record
INSERT INTO game_stats (player_name, wins, losses, draws, total_games, win_rate)
VALUES ('Player', 0, 0, 0, 0, 0.00)
ON CONFLICT DO NOTHING;
