-- Create enums for various shot categories
CREATE TYPE public.game_type AS ENUM ('8-ball', '9-ball', '10-ball');
CREATE TYPE public.player_mode AS ENUM ('single', 'double');
CREATE TYPE public.shot_type AS ENUM ('attack', 'defense');
CREATE TYPE public.cut_angle AS ENUM ('8/8', '7/8', '6/8', '5/8', '4/8', '3/8', '2/8', '1/8');
CREATE TYPE public.distance AS ENUM ('short', 'long');
CREATE TYPE public.table_position AS ENUM ('open', 'rail', 'bank');
CREATE TYPE public.spin_type AS ENUM ('none', 'top', 'bottom', 'left', 'right');
CREATE TYPE public.shot_outcome AS ENUM ('pocketed', 'safety', 'fail', 'miss', 'scratch');
CREATE TYPE public.cue_ball_control AS ENUM ('on_target', 'safe_zone', 'out_of_line');
CREATE TYPE public.error_type AS ENUM ('none', 'aim', 'power', 'spin_deflection', 'mental');
CREATE TYPE public.strategic_intent AS ENUM ('positioning', 'safety', 'breakout', 'straight_shot');

-- Create players table
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create games table
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_type public.game_type NOT NULL,
  player_mode public.player_mode NOT NULL,
  player_a_id UUID REFERENCES public.players(id),
  player_b_id UUID REFERENCES public.players(id),
  team_a_score INTEGER DEFAULT 0,
  team_b_score INTEGER DEFAULT 0,
  current_inning INTEGER DEFAULT 1,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shots table with all detailed logging fields
CREATE TABLE public.shots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES public.players(id),
  shot_number INTEGER NOT NULL,
  inning INTEGER NOT NULL,
  
  -- Plan & Setup
  shot_type public.shot_type DEFAULT 'attack',
  ball_number INTEGER CHECK (ball_number >= 1 AND ball_number <= 15),
  cut_angle public.cut_angle,
  distance public.distance DEFAULT 'short',
  table_position public.table_position DEFAULT 'open',
  
  -- Execution
  spin public.spin_type DEFAULT 'none',
  power_level INTEGER DEFAULT 3 CHECK (power_level >= 1 AND power_level <= 5),
  
  -- Result
  outcome public.shot_outcome DEFAULT 'pocketed',
  cue_ball_control public.cue_ball_control DEFAULT 'on_target',
  error_type public.error_type DEFAULT 'none',
  confidence_rating INTEGER DEFAULT 10 CHECK (confidence_rating >= 1 AND confidence_rating <= 10),
  strategic_intent public.strategic_intent,
  notes TEXT,
  
  -- Break shot specific fields
  is_break_shot BOOLEAN DEFAULT FALSE,
  balls_pocketed_on_break INTEGER DEFAULT 0,
  break_spread_quality INTEGER CHECK (break_spread_quality >= 1 AND break_spread_quality <= 10),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for players
CREATE POLICY "Users can view their own players" 
ON public.players 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own players" 
ON public.players 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own players" 
ON public.players 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own players" 
ON public.players 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for games
CREATE POLICY "Users can view their own games" 
ON public.games 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own games" 
ON public.games 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own games" 
ON public.games 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own games" 
ON public.games 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for shots
CREATE POLICY "Users can view shots from their games" 
ON public.shots 
FOR SELECT 
USING (
  game_id IN (
    SELECT id FROM public.games WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create shots for their games" 
ON public.shots 
FOR INSERT 
WITH CHECK (
  game_id IN (
    SELECT id FROM public.games WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update shots from their games" 
ON public.shots 
FOR UPDATE 
USING (
  game_id IN (
    SELECT id FROM public.games WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete shots from their games" 
ON public.shots 
FOR DELETE 
USING (
  game_id IN (
    SELECT id FROM public.games WHERE user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shots_updated_at
  BEFORE UPDATE ON public.shots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_games_user_id ON public.games(user_id);
CREATE INDEX idx_games_started_at ON public.games(started_at DESC);
CREATE INDEX idx_shots_game_id ON public.shots(game_id);
CREATE INDEX idx_shots_created_at ON public.shots(created_at DESC);
CREATE INDEX idx_players_user_id ON public.players(user_id);