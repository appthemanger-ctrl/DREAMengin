-- Expand game_scores to accept all 21 game IDs (was only 4).
-- Drop the old narrow check constraint and replace it with one that covers every game in GamesHub.
ALTER TABLE public.game_scores DROP CONSTRAINT IF EXISTS game_scores_game_check;
ALTER TABLE public.game_scores ADD CONSTRAINT game_scores_game_check
  CHECK (game IN (
    'platformer', 'word-sprint', 'memory-grid', 'speed-tap',
    'rts', 'tower-defense', 'space-shooter', 'snake', 'breakout',
    'flappy', 'match3', 'tetris', 'pong', 'minesweeper', 'chess',
    'racing', 'trivia', 'rpg', 'rhythm', 'maze', 'solitaire'
  ));
