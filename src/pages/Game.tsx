import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Trophy, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import ShotLogger from '@/components/ShotLogger';

const Game = () => {
  const { gameId } = useParams();
  const [game, setGame] = useState<any>(null);
  const [shots, setShots] = useState<any[]>([]);
  const [showShotLogger, setShowShotLogger] = useState(false);
  const [showRackResult, setShowRackResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (gameId) {
      fetchGameData();
    }
  }, [user, gameId, navigate]);

  const fetchGameData = async () => {
    if (!gameId) return;
    
    try {
      // Fetch game details
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select(`
          *,
          player_a:players!games_player_a_id_fkey(name),
          player_b:players!games_player_b_id_fkey(name)
        `)
        .eq('id', gameId)
        .single();

      if (gameError) throw gameError;
      setGame(gameData);

      // Fetch shots for this game
      const { data: shotsData, error: shotsError } = await supabase
        .from('shots')
        .select(`
          *,
          player:players(name)
        `)
        .eq('game_id', gameId)
        .order('shot_number', { ascending: true });

      if (shotsError) throw shotsError;
      setShots(shotsData || []);
    } catch (error: any) {
      toast({
        title: "Error loading game",
        description: error.message,
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleShotLogged = () => {
    setShowShotLogger(false);
    fetchGameData(); // Refresh the shots list
  };

  const handleFinishTraining = async () => {
    try {
      const { error } = await supabase
        .from('games')
        .update({ 
          completed_at: new Date().toISOString()
        })
        .eq('id', gameId);

      if (error) throw error;

      toast({
        title: "Training completed!",
        description: "Your training session has been saved.",
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error finishing training",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFinishRack = () => {
    setShowRackResult(true);
  };

  const handleRackResult = async (won: boolean) => {
    try {
      const updatedScoreA = won ? game.team_a_score + 1 : game.team_a_score;
      const updatedScoreB = won ? game.team_b_score : game.team_b_score + 1;

      const { error } = await supabase
        .from('games')
        .update({ 
          current_rack: game.current_rack + 1,
          team_a_score: updatedScoreA,
          team_b_score: updatedScoreB,
        })
        .eq('id', gameId);

      if (error) throw error;

      toast({
        title: won ? "Rack won!" : "Rack lost",
        description: `Score: ${updatedScoreA} - ${updatedScoreB}. Starting rack #${game.current_rack + 1}`,
      });

      setShowRackResult(false);
      fetchGameData(); // Refresh to show new rack number and scores
    } catch (error: any) {
      toast({
        title: "Error finishing rack",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFinishGame = async () => {
    try {
      const { error } = await supabase
        .from('games')
        .update({ 
          completed_at: new Date().toISOString()
        })
        .eq('id', gameId);

      if (error) throw error;

      toast({
        title: "Game completed!",
        description: "Your game has been saved to history.",
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error finishing game",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg">Loading game...</div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg mb-4">Game not found</div>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  if (showShotLogger) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => setShowShotLogger(false)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Game
          </Button>
          <ShotLogger 
            game={game}
            shotNumber={shots.length + 1}
            onShotLogged={handleShotLogged}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <div className="text-sm text-muted-foreground">
            {game.completed_at ? 'Completed' : 'In Progress'}
          </div>
        </div>

        {/* Game Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>🎱 {game.game_type}</span>
              <span className="text-lg">{game.team_a_score} - {game.team_b_score}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Players:</span>
                <span>
                  {game.player_a?.name}
                  {game.player_mode === 'double' && game.player_b?.name && ` vs ${game.player_b.name}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Started:</span>
                <span>{new Date(game.started_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Current Rack:</span>
                <span>{game.current_rack}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {!game.completed_at && (
          <div className="space-y-3 mb-6">
            {/* Log New Shot Button */}
            <Button 
              onClick={() => setShowShotLogger(true)}
              className="w-full h-16 text-lg font-semibold"
              size="lg"
            >
              <Plus className="h-6 w-6 mr-2" />
              Log Shot #{shots.length + 1}
            </Button>

            {/* Game Type Specific Buttons */}
            {game.game_type === 'free-training' ? (
              // Free Training - Only Finish Training button
              <Button 
                onClick={handleFinishTraining}
                variant="outline"
                className="w-full h-12 text-base"
              >
                <Target className="h-5 w-5 mr-2" />
                Finish Training
              </Button>
            ) : (
              // 8-ball, 9-ball, 10-ball - Finish Rack and Finish Game buttons
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={handleFinishRack}
                  variant="outline"
                  className="h-12 text-sm"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Finish Rack
                </Button>
                <Button 
                  onClick={handleFinishGame}
                  variant="outline"
                  className="h-12 text-sm"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Finish Game
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Shots History */}
        <Card>
          <CardHeader>
            <CardTitle>Shot History ({shots.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {shots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-lg mb-2">No shots logged yet</div>
                <div className="text-sm">Tap "Log Shot" to start tracking</div>
              </div>
            ) : (
              <div className="space-y-3">
                {shots.slice(-5).reverse().map((shot) => (
                  <div
                    key={shot.id}
                    className="p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">
                        Shot #{shot.shot_number}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          shot.outcome === 'pocketed' ? 'bg-green-100 text-green-800' :
                          shot.outcome === 'safety' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {shot.outcome}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Confidence: {shot.confidence_rating}/10
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>Type: {shot.shot_type}</div>
                      <div>Ball: {shot.ball_number || 'N/A'}</div>
                      <div>Angle: {shot.cut_angle || 'N/A'}</div>
                      <div>Power: {shot.power_level}/5</div>
                    </div>
                    {shot.notes && (
                      <div className="mt-2 text-xs text-muted-foreground italic">
                        "{shot.notes}"
                      </div>
                    )}
                  </div>
                ))}
                
                {shots.length > 5 && (
                  <div className="text-center py-2">
                    <span className="text-sm text-muted-foreground">
                      Showing latest 5 shots
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rack Result Dialog */}
        <Dialog open={showRackResult} onOpenChange={setShowRackResult}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rack Result</DialogTitle>
              <DialogDescription>
                Did you win or lose this rack?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleRackResult(false)}
                className="flex-1"
              >
                Lost Rack
              </Button>
              <Button 
                onClick={() => handleRackResult(true)}
                className="flex-1"
              >
                Won Rack
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Game;