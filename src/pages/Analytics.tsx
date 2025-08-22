import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ArrowLeft, Target, Trophy, TrendingUp, Activity, Calendar, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface GameStats {
  totalGames: number;
  totalShots: number;
  avgShotsPerGame: number;
  gamesWon: number;
  winRate: number;
  successfulShots: number;
  shotAccuracy: number;
}

interface GameTypeData {
  gameType: string;
  games: number;
  winRate: number;
}

interface ShotOutcomeData {
  outcome: string;
  count: number;
  percentage: number;
}

interface MonthlyData {
  month: string;
  games: number;
  shots: number;
}

interface ShotAnalysis {
  category: string;
  value: string;
  total: number;
  successful: number;
  successRate: number;
}

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<GameStats>({
    totalGames: 0,
    totalShots: 0,
    avgShotsPerGame: 0,
    gamesWon: 0,
    winRate: 0,
    successfulShots: 0,
    shotAccuracy: 0,
  });
  const [gameTypeData, setGameTypeData] = useState<GameTypeData[]>([]);
  const [shotOutcomeData, setShotOutcomeData] = useState<ShotOutcomeData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [distanceAnalysis, setDistanceAnalysis] = useState<ShotAnalysis[]>([]);
  const [positionAnalysis, setPositionAnalysis] = useState<ShotAnalysis[]>([]);
  const [cutAngleAnalysis, setCutAngleAnalysis] = useState<ShotAnalysis[]>([]);
  const [powerAnalysis, setPowerAnalysis] = useState<ShotAnalysis[]>([]);
  const [spinAnalysis, setSpinAnalysis] = useState<ShotAnalysis[]>([]);
  const [cueBallAnalysis, setCueBallAnalysis] = useState<ShotAnalysis[]>([]);
  const [shotTypeAnalysis, setShotTypeAnalysis] = useState<ShotAnalysis[]>([]);
  const [strategicAnalysis, setStrategicAnalysis] = useState<ShotAnalysis[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchAnalytics();
  }, [user, navigate]);

  const fetchAnalytics = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch games data
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .eq('user_id', user.id);

      if (gamesError) throw gamesError;

      // Fetch shots data
      const { data: shots, error: shotsError } = await supabase
        .from('shots')
        .select('*')
        .in('game_id', (games || []).map(g => g.id));

      if (shotsError) throw shotsError;

      // Calculate basic stats
      const totalGames = games?.length || 0;
      const totalShots = shots?.length || 0;
      const avgShotsPerGame = totalGames > 0 ? Math.round(totalShots / totalGames) : 0;
      
      // Calculate games won (assuming team_a_score > team_b_score means win)
      const gamesWon = games?.filter(g => g.completed_at && g.team_a_score > g.team_b_score).length || 0;
      const winRate = totalGames > 0 ? Math.round((gamesWon / totalGames) * 100) : 0;
      
      // Calculate shot accuracy
      const successfulShots = shots?.filter(s => s.outcome === 'pocketed').length || 0;
      const shotAccuracy = totalShots > 0 ? Math.round((successfulShots / totalShots) * 100) : 0;

      setStats({
        totalGames,
        totalShots,
        avgShotsPerGame,
        gamesWon,
        winRate,
        successfulShots,
        shotAccuracy,
      });

      // Game type performance
      const gameTypeStats = games?.reduce((acc: any, game) => {
        const type = game.game_type;
        if (!acc[type]) {
          acc[type] = { games: 0, wins: 0 };
        }
        acc[type].games++;
        if (game.completed_at && game.team_a_score > game.team_b_score) {
          acc[type].wins++;
        }
        return acc;
      }, {}) || {};

      const gameTypeChartData = Object.entries(gameTypeStats).map(([type, data]: [string, any]) => ({
        gameType: type.replace('-', ' ').toUpperCase(),
        games: data.games,
        winRate: data.games > 0 ? Math.round((data.wins / data.games) * 100) : 0,
      }));

      setGameTypeData(gameTypeChartData);

      // Shot outcomes
      const outcomeStats = shots?.reduce((acc: any, shot) => {
        const outcome = shot.outcome || 'unknown';
        acc[outcome] = (acc[outcome] || 0) + 1;
        return acc;
      }, {}) || {};

      const outcomeChartData = Object.entries(outcomeStats).map(([outcome, count]: [string, any]) => ({
        outcome: outcome.charAt(0).toUpperCase() + outcome.slice(1),
        count,
        percentage: totalShots > 0 ? Math.round((count / totalShots) * 100) : 0,
      }));

      setShotOutcomeData(outcomeChartData);

      // Monthly activity
      const monthlyStats = games?.reduce((acc: any, game) => {
        const date = new Date(game.started_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!acc[monthKey]) {
          acc[monthKey] = { games: 0, shots: 0 };
        }
        acc[monthKey].games++;
        
        // Count shots for this game
        const gameShotCount = shots?.filter(s => s.game_id === game.id).length || 0;
        acc[monthKey].shots += gameShotCount;
        
        return acc;
      }, {}) || {};

      const monthlyChartData = Object.entries(monthlyStats)
        .map(([month, data]: [string, any]) => ({
          month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          games: data.games,
          shots: data.shots,
        }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6); // Last 6 months

      setMonthlyData(monthlyChartData);

      // Advanced shot analysis
      const createShotAnalysis = (shots: any[], field: string, categoryName: string) => {
        const analysis = shots?.reduce((acc: any, shot) => {
          const value = shot[field];
          if (value) {
            if (!acc[value]) {
              acc[value] = { total: 0, successful: 0 };
            }
            acc[value].total++;
            if (shot.outcome === 'pocketed') {
              acc[value].successful++;
            }
          }
          return acc;
        }, {}) || {};

        return Object.entries(analysis).map(([value, data]: [string, any]) => ({
          category: categoryName,
          value: value.replace('_', ' ').replace('-', ' ').toUpperCase(),
          total: data.total,
          successful: data.successful,
          successRate: data.total > 0 ? Math.round((data.successful / data.total) * 100) : 0,
        }));
      };

      setDistanceAnalysis(createShotAnalysis(shots, 'distance', 'Distance'));
      setPositionAnalysis(createShotAnalysis(shots, 'table_position', 'Position'));
      setCutAngleAnalysis(createShotAnalysis(shots, 'cut_angle', 'Cut Angle'));
      setSpinAnalysis(createShotAnalysis(shots, 'spin', 'Spin Type'));
      setCueBallAnalysis(createShotAnalysis(shots, 'cue_ball_control', 'Cue Ball Control'));
      setShotTypeAnalysis(createShotAnalysis(shots, 'shot_type', 'Shot Type'));
      setStrategicAnalysis(createShotAnalysis(shots, 'strategic_intent', 'Strategic Intent'));

      // Power level analysis (special handling for integer values)
      const powerStats = shots?.reduce((acc: any, shot) => {
        const power = shot.power_level;
        if (power !== null && power !== undefined) {
          const powerRange = power <= 2 ? 'Low (1-2)' : power <= 4 ? 'Medium (3-4)' : 'High (5)';
          if (!acc[powerRange]) {
            acc[powerRange] = { total: 0, successful: 0 };
          }
          acc[powerRange].total++;
          if (shot.outcome === 'pocketed') {
            acc[powerRange].successful++;
          }
        }
        return acc;
      }, {}) || {};

      const powerAnalysisData = Object.entries(powerStats).map(([value, data]: [string, any]) => ({
        category: 'Power Level',
        value,
        total: data.total,
        successful: data.successful,
        successRate: data.total > 0 ? Math.round((data.successful / data.total) * 100) : 0,
      }));

      setPowerAnalysis(powerAnalysisData);

    } catch (error: any) {
      toast({
        title: "Error loading analytics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    games: {
      label: "Games",
      color: "hsl(var(--chart-1))",
    },
    shots: {
      label: "Shots",
      color: "hsl(var(--chart-2))",
    },
    winRate: {
      label: "Win Rate %",
      color: "hsl(var(--chart-3))",
    },
  };

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground">Your billiards performance insights</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <Trophy className="h-8 w-8 mb-2 text-primary" />
                  <div className="text-2xl font-bold">{stats.totalGames}</div>
                  <div className="text-sm text-muted-foreground">Total Games</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <Target className="h-8 w-8 mb-2 text-primary" />
                  <div className="text-2xl font-bold">{stats.shotAccuracy}%</div>
                  <div className="text-sm text-muted-foreground">Shot Accuracy</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <TrendingUp className="h-8 w-8 mb-2 text-primary" />
                  <div className="text-2xl font-bold">{stats.winRate}%</div>
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <Activity className="h-8 w-8 mb-2 text-primary" />
                  <div className="text-2xl font-bold">{stats.avgShotsPerGame}</div>
                  <div className="text-sm text-muted-foreground">Avg Shots/Game</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Game Type Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance by Game Type</CardTitle>
                  <CardDescription>Win rate and games played per type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={gameTypeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="gameType" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="games" fill="var(--color-games)" name="Games Played" />
                        <Bar dataKey="winRate" fill="var(--color-winRate)" name="Win Rate %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Shot Outcomes */}
              <Card>
                <CardHeader>
                  <CardTitle>Shot Outcomes</CardTitle>
                  <CardDescription>Distribution of shot results</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={shotOutcomeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name} ${percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {shotOutcomeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Monthly Activity
                </CardTitle>
                <CardDescription>Games and shots over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="games" 
                        stroke="var(--color-games)" 
                        strokeWidth={2}
                        name="Games"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="shots" 
                        stroke="var(--color-shots)" 
                        strokeWidth={2}
                        name="Shots"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Detailed Shot Analysis */}
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Detailed Shot Analysis</h2>
                <p className="text-muted-foreground">Success rates by shot characteristics to help improve your game</p>
              </div>

              {/* Basic Shot Characteristics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distance Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle>Distance Analysis</CardTitle>
                    <CardDescription>Success rate by shot distance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {distanceAnalysis.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                          <div>
                            <div className="font-medium">{item.value}</div>
                            <div className="text-sm text-muted-foreground">{item.successful}/{item.total} shots</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">{item.successRate}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Table Position Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle>Table Position Analysis</CardTitle>
                    <CardDescription>Success rate by table position</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {positionAnalysis.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                          <div>
                            <div className="font-medium">{item.value}</div>
                            <div className="text-sm text-muted-foreground">{item.successful}/{item.total} shots</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">{item.successRate}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Cut Angle Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle>Cut Angle Analysis</CardTitle>
                    <CardDescription>Success rate by cut angle</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {cutAngleAnalysis.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                          <div>
                            <div className="font-medium">{item.value}</div>
                            <div className="text-sm text-muted-foreground">{item.successful}/{item.total} shots</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">{item.successRate}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Power Level Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle>Power Level Analysis</CardTitle>
                    <CardDescription>Success rate by power level</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {powerAnalysis.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                          <div>
                            <div className="font-medium">{item.value}</div>
                            <div className="text-sm text-muted-foreground">{item.successful}/{item.total} shots</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">{item.successRate}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Advanced Options Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Spin Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle>Spin Type Analysis</CardTitle>
                    <CardDescription>Success rate by spin type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {spinAnalysis.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                          <div>
                            <div className="font-medium text-sm">{item.value}</div>
                            <div className="text-xs text-muted-foreground">{item.successful}/{item.total}</div>
                          </div>
                          <div className="text-primary font-bold">{item.successRate}%</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Cue Ball Control Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle>Cue Ball Control</CardTitle>
                    <CardDescription>Success rate by cue ball control</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {cueBallAnalysis.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                          <div>
                            <div className="font-medium text-sm">{item.value}</div>
                            <div className="text-xs text-muted-foreground">{item.successful}/{item.total}</div>
                          </div>
                          <div className="text-primary font-bold">{item.successRate}%</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Shot Type Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle>Shot Type Analysis</CardTitle>
                    <CardDescription>Success rate by shot type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {shotTypeAnalysis.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                          <div>
                            <div className="font-medium text-sm">{item.value}</div>
                            <div className="text-xs text-muted-foreground">{item.successful}/{item.total}</div>
                          </div>
                          <div className="text-primary font-bold">{item.successRate}%</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Strategic Intent Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle>Strategic Intent</CardTitle>
                    <CardDescription>Success rate by strategic intent</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {strategicAnalysis.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                          <div>
                            <div className="font-medium text-sm">{item.value}</div>
                            <div className="text-xs text-muted-foreground">{item.successful}/{item.total}</div>
                          </div>
                          <div className="text-primary font-bold">{item.successRate}%</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Additional Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Shots Taken:</span>
                    <span className="font-semibold">{stats.totalShots}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Successful Shots:</span>
                    <span className="font-semibold">{stats.successfulShots}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Games Won:</span>
                    <span className="font-semibold">{stats.gamesWon}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Games Lost:</span>
                    <span className="font-semibold">{stats.totalGames - stats.gamesWon}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="p-3 bg-accent/50 rounded-lg">
                    <div className="font-medium">
                      {stats.shotAccuracy >= 70 ? '🎯 Excellent accuracy!' : 
                       stats.shotAccuracy >= 50 ? '👍 Good accuracy!' : 
                       '📈 Room for improvement!'}
                    </div>
                    <div className="text-muted-foreground">
                      Your shot accuracy is {stats.shotAccuracy}%
                    </div>
                  </div>
                  
                  <div className="p-3 bg-accent/50 rounded-lg">
                    <div className="font-medium">
                      {stats.winRate >= 60 ? '🏆 Great win rate!' : 
                       stats.winRate >= 40 ? '⚡ Solid performance!' : 
                       '💪 Keep practicing!'}
                    </div>
                    <div className="text-muted-foreground">
                      You win {stats.winRate}% of your games
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;