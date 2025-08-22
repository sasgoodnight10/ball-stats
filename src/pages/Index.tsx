import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trophy, BarChart3, LogOut, History, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import GameSetup from '@/components/GameSetup';

const Index = () => {
  const [showSetup, setShowSetup] = useState(false);
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchRecentGames();
  }, [user, navigate]);

  const fetchRecentGames = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          player_a:players!games_player_a_id_fkey(name),
          player_b:players!games_player_b_id_fkey(name)
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentGames(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading games",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleGameCreated = (gameId: string) => {
    setShowSetup(false);
    navigate(`/game/${gameId}`);
  };

  const handleDeleteGame = async (gameId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking delete
    
    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId);

      if (error) throw error;

      toast({
        title: "Game deleted",
        description: "The game has been removed from your history.",
      });

      fetchRecentGames(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error deleting game",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  if (showSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md space-y-4">
          <Button 
            variant="ghost" 
            onClick={() => setShowSetup(false)}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <GameSetup onGameCreated={handleGameCreated} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="max-w-md mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">🎱 Ball Stats Ace</h1>
            <p className="text-muted-foreground">Track your billiards performance</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setShowSetup(true)}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Plus className="h-8 w-8 mb-2 text-primary" />
              <span className="font-semibold">New Game</span>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate('/analytics')}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <BarChart3 className="h-8 w-8 mb-2 text-primary" />
              <span className="font-semibold">Analytics</span>
            </CardContent>
          </Card>
        </div>

        {/* Recent Games */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Games
                </CardTitle>
                <CardDescription>Your latest billiards sessions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Loading games...</div>
            ) : recentGames.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No games yet!</p>
                <Button onClick={() => setShowSetup(true)}>
                  Start Your First Game
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentGames.map((game) => (
                  <div
                    key={game.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/game/${game.id}`)}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{game.game_type}</div>
                      <div className="text-sm text-muted-foreground">
                        {game.player_a?.name}
                        {game.player_mode === 'double' && game.player_b?.name && ` vs ${game.player_b.name}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(game.started_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {game.team_a_score} - {game.team_b_score}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {game.completed_at ? 'Completed' : 'In Progress'}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDeleteGame(game.id, e)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/games')}>
                  View All Games
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
