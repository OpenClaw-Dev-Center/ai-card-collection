-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  provider VARCHAR(50), -- which AI provider they align with
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (game state)
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  credits INTEGER DEFAULT 0,
  prestige_crystals INTEGER DEFAULT 0,
  packs JSONB DEFAULT '{"basic": 0, "premium": 0, "provider": {}}'::jsonb,
  collection JSONB DEFAULT '[]'::jsonb, -- array of card objects with stats
  deck_presets JSONB DEFAULT '[]'::jsonb,
  stats JSONB DEFAULT '{"wins": 0, "losses": 0, "totalBattles": 0, "playtimeHours": 0}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard (materialized view would be better for performance)
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  total_battles INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0.0,
  playtime_hours DECIMAL(6,2) DEFAULT 0.0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PvP battles
CREATE TABLE IF NOT EXISTS battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID NOT NULL REFERENCES users(id),
  player2_id UUID NOT NULL REFERENCES users(id),
  winner_id UUID REFERENCES users(id),
  deck1_id VARCHAR(100), -- which deck preset was used
  deck2_id VARCHAR(100),
  turn_count INTEGER NOT NULL,
  duration_seconds INTEGER,
  battle_data JSONB DEFAULT '{}'::jsonb, -- full battle replay data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Deck Battle streaks (optional achievements)
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_type VARCHAR(50) NOT NULL,
  value JSONB DEFAULT '{}'::jsonb,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_battles_player1 ON battles(player1_id);
CREATE INDEX IF NOT EXISTS idx_battles_player2 ON battles(player2_id);
CREATE INDEX IF NOT EXISTS idx_battles_completed_at ON battles(completed_at);
CREATE INDEX IF NOT EXISTS idx_leaderboard_win_rate ON leaderboard_entries(win_rate DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_wins ON leaderboard_entries(wins DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_playtime ON leaderboard_entries(playtime_hours DESC);

-- Function to update leaderboard entry when user profile changes
CREATE OR REPLACE FUNCTION update_leaderboard_entry()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO leaderboard_entries (user_id, wins, losses, total_battles, win_rate, playtime_hours)
  VALUES (
    NEW.user_id,
    NEW.stats->>'wins',
    NEW.stats->>'losses',
    NEW.stats->>'totalBattles',
    CASE WHEN (NEW.stats->>'totalBattles')::INTEGER > 0
      THEN ((NEW.stats->>'wins')::DECIMAL / (NEW.stats->>'totalBattles')::DECIMAL * 100)
      ELSE 0.0
    END,
    (NEW.stats->>'playtimeHours')::DECIMAL
  )
  ON CONFLICT (user_id) DO UPDATE SET
    wins = EXCLUDED.wins,
    losses = EXCLUDED.losses,
    total_battles = EXCLUDED.total_battles,
    win_rate = EXCLUDED.win_rate,
    playtime_hours = EXCLUDED.playtime_hours,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update leaderboard when user profile updates
DROP TRIGGER IF EXISTS trigger_update_leaderboard ON user_profiles;
CREATE TRIGGER trigger_update_leaderboard
  AFTER INSERT OR UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_leaderboard_entry();
