import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface GameSetupProps {
  onGameCreated?: (gameId: string) => void;
}

const GameSetup = ({ onGameCreated }: GameSetupProps) => {
  const [gameType, setGameType] = useState<'8-ball' | '9-ball' | '10-ball' | 'free-training'>('8-ball');
  const [playerMode, setPlayerMode] = useState<'single' | 'double'>('single');
  const [playerAName, setPlayerAName] = useState('');
  const [playerBName, setPlayerBName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleStartGame = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Create players if they don't exist
      let playerAId = null;
      let playerBId = null;

      if (playerAName) {
        const { data: playerA, error: playerAError } = await supabase
          .from('players')
          .insert({ name: playerAName, user_id: user.id })
          .select()
          .single();
        
        if (playerAError) throw playerAError;
        playerAId = playerA.id;
      }

      if (playerMode === 'double' && playerBName) {
        const { data: playerB, error: playerBError } = await supabase
          .from('players')
          .insert({ name: playerBName, user_id: user.id })
          .select()
          .single();
        
        if (playerBError) throw playerBError;
        playerBId = playerB.id;
      }

      // Create the game
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          user_id: user.id,
          game_type: gameType as any, // Type assertion until types are updated
          player_mode: playerMode,
          player_a_id: playerAId,
          player_b_id: playerBId,
        })
        .select()
        .single();

      if (gameError) throw gameError;

      toast({
        title: "Game started!",
        description: `${gameType} game created successfully.`,
      });

      if (onGameCreated) {
        onGameCreated(game.id);
      } else {
        navigate(`/game/${game.id}`);
      }
    } catch (error: any) {
      toast({
        title: "Error creating game",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">🎱 New Game Setup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Game Type */}
        <div className="space-y-2">
          <Label>Game Type</Label>
          <Select value={gameType} onValueChange={(value) => setGameType(value as any)}>
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="8-ball">8-Ball</SelectItem>
              <SelectItem value="9-ball">9-Ball</SelectItem>
              <SelectItem value="10-ball">10-Ball</SelectItem>
              <SelectItem value="free-training">Free Training</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Player Mode */}
        <div className="space-y-2">
          <Label>Player Mode</Label>
          <Select value={playerMode} onValueChange={(value) => setPlayerMode(value as any)}>
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single Player</SelectItem>
              <SelectItem value="double">Two Players</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Player Names */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playerA">Player A Name</Label>
            <Input
              id="playerA"
              value={playerAName}
              onChange={(e) => setPlayerAName(e.target.value)}
              placeholder="Enter Player A name"
              className="h-12"
            />
          </div>
          
          {playerMode === 'double' && (
            <div className="space-y-2">
              <Label htmlFor="playerB">Player B Name</Label>
              <Input
                id="playerB"
                value={playerBName}
                onChange={(e) => setPlayerBName(e.target.value)}
                placeholder="Enter Player B name"
                className="h-12"
              />
            </div>
          )}
        </div>

        <Button 
          onClick={handleStartGame}
          disabled={loading || !playerAName || (playerMode === 'double' && !playerBName)}
          className="w-full h-12 text-lg font-semibold"
        >
          {loading ? "Starting Game..." : "Start Game"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default GameSetup;