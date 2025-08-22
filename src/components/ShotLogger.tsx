import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Slider } from '@/components/ui/slider';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ShotLoggerProps {
  game: any;
  shotNumber: number;
  onShotLogged: () => void;
}

const ShotLogger = ({ game, shotNumber, onShotLogged }: ShotLoggerProps) => {
  // Plan & Setup
  const [shotType, setShotType] = useState<'attack' | 'defense'>('attack');
  const [ballNumber, setBallNumber] = useState<number | null>(null);
  const [cutAngle, setCutAngle] = useState<string>('');
  const [distance, setDistance] = useState<'short' | 'long'>('short');
  const [tablePosition, setTablePosition] = useState<'open' | 'rail' | 'bank'>('open');

  // Execution
  const [spinApplied, setSpinApplied] = useState(false);
  const [horizontalSpin, setHorizontalSpin] = useState<'none' | 'left' | 'right'>('none');
  const [verticalSpin, setVerticalSpin] = useState<'none' | 'top' | 'bottom'>('none');
  const [powerLevel, setPowerLevel] = useState(3);

  // Result
  const [outcome, setOutcome] = useState<'pocketed' | 'safety' | 'fail' | 'miss' | 'scratch'>('pocketed');
  const [cueBallControl, setCueBallControl] = useState<'on_target' | 'safe_zone' | 'out_of_line'>('on_target');
  const [errorType, setErrorType] = useState<'none' | 'aim' | 'power' | 'spin_deflection' | 'mental'>('none');
  const [confidenceRating, setConfidenceRating] = useState(10);
  const [strategicIntent, setStrategicIntent] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Break shot specific
  const [isBreakShot, setIsBreakShot] = useState(shotNumber === 1);
  const [ballsPocketedOnBreak, setBallsPocketedOnBreak] = useState(0);
  const [breakSpreadQuality, setBreakSpreadQuality] = useState(5);

  // UI State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  const handleLogShot = async () => {
    if (!user || !game) return;
    
    setLoading(true);
    
    // Calculate combined spin value
    const calculateSpin = () => {
      if (!spinApplied) return 'none';
      if (horizontalSpin !== 'none' && verticalSpin !== 'none') {
        return `${verticalSpin}_${horizontalSpin}` as any; // e.g., 'top_left'
      }
      return horizontalSpin !== 'none' ? horizontalSpin : verticalSpin;
    };
    
    try {
      const shotData = {
        game_id: game.id,
        player_id: game.player_a_id, // For now, default to player A
        shot_number: shotNumber,
        rack: game.current_rack,
        
        // Plan & Setup
        shot_type: shotType,
        ball_number: ballNumber,
        cut_angle: (cutAngle || null) as any,
        distance,
        table_position: tablePosition,
        
        // Execution
        spin: calculateSpin(),
        power_level: powerLevel,
        
        // Result
        outcome,
        cue_ball_control: cueBallControl,
        error_type: errorType,
        confidence_rating: confidenceRating,
        strategic_intent: (strategicIntent || null) as any,
        notes: notes || null,
        
        // Break shot specific
        is_break_shot: isBreakShot,
        balls_pocketed_on_break: isBreakShot ? ballsPocketedOnBreak : 0,
        break_spread_quality: isBreakShot ? breakSpreadQuality : null,
      };

      const { error } = await supabase
        .from('shots')
        .insert(shotData);

      if (error) throw error;

      toast({
        title: "Shot logged!",
        description: `Shot #${shotNumber} recorded successfully.`,
      });

      onShotLogged();
    } catch (error: any) {
      toast({
        title: "Error logging shot",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            🎯 Log Shot #{shotNumber}
            {isBreakShot && <Badge className="ml-2">Break Shot</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan & Setup Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">📋 Plan & Setup</h3>
            
            {/* Shot Type */}
            <div className="space-y-2">
              <Label>Shot Type</Label>
              <div className="flex gap-2">
                <Button
                  variant={shotType === 'attack' ? 'default' : 'outline'}
                  onClick={() => setShotType('attack')}
                  className="flex-1 h-12"
                >
                  Attack
                </Button>
                <Button
                  variant={shotType === 'defense' ? 'default' : 'outline'}
                  onClick={() => setShotType('defense')}
                  className="flex-1 h-12"
                >
                  Defense
                </Button>
              </div>
            </div>

            {/* Ball Number - only show if not free training */}
            {game.game_type !== 'free-training' && (
              <div className="space-y-2">
                <Label>Ball Number (1-{game.game_type === '9-ball' ? '9' : game.game_type === '10-ball' ? '10' : '15'})</Label>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({
                    length: game.game_type === '9-ball' ? 9 : game.game_type === '10-ball' ? 10 : 15
                  }, (_, i) => i + 1).map((number) => (
                    <Button
                      key={number}
                      variant={ballNumber === number ? 'default' : 'outline'}
                      onClick={() => setBallNumber(ballNumber === number ? null : number)}
                      className="h-12 text-sm"
                    >
                      {number}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Distance & Table Position */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Distance</Label>
                <Select value={distance} onValueChange={(value) => setDistance(value as any)}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="long">Long</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Position</Label>
                <Select value={tablePosition} onValueChange={(value) => setTablePosition(value as any)}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="rail">Rail</SelectItem>
                    <SelectItem value="bank">Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Cut Angle */}
            <div className="space-y-2">
              <Label>Cut Angle</Label>
              <Select value={cutAngle} onValueChange={setCutAngle}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select angle" />
                </SelectTrigger>
                <SelectContent>
                  {['8/8', '7/8', '6/8', '5/8', '4/8', '3/8', '2/8', '1/8'].map((angle) => (
                    <SelectItem key={angle} value={angle}>{angle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Execution Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">⚡ Execution</h3>
            
            {/* Spin Applied */}
            <div className="space-y-2">
              <Label>Spin Applied</Label>
              <div className="flex gap-2">
                <Button
                  variant={!spinApplied ? 'default' : 'outline'}
                  onClick={() => {
                    setSpinApplied(false);
                    setHorizontalSpin('none');
                    setVerticalSpin('none');
                  }}
                  className="flex-1 h-12"
                >
                  No
                </Button>
                <Button
                  variant={spinApplied ? 'default' : 'outline'}
                  onClick={() => setSpinApplied(true)}
                  className="flex-1 h-12"
                >
                  Yes
                </Button>
              </div>
            </div>

            {/* Spin Controls - only show if spin is applied */}
            {spinApplied && (
              <div className="space-y-4">
                {/* Horizontal Spin */}
                <div className="space-y-2">
                  <Label>Horizontal Spin</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={horizontalSpin === 'none' ? 'default' : 'outline'}
                      onClick={() => setHorizontalSpin('none')}
                      className="h-10"
                    >
                      None
                    </Button>
                    <Button
                      variant={horizontalSpin === 'left' ? 'default' : 'outline'}
                      onClick={() => setHorizontalSpin('left')}
                      className="h-10"
                    >
                      Left
                    </Button>
                    <Button
                      variant={horizontalSpin === 'right' ? 'default' : 'outline'}
                      onClick={() => setHorizontalSpin('right')}
                      className="h-10"
                    >
                      Right
                    </Button>
                  </div>
                </div>

                {/* Vertical Spin */}
                <div className="space-y-2">
                  <Label>Vertical Spin</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={verticalSpin === 'none' ? 'default' : 'outline'}
                      onClick={() => setVerticalSpin('none')}
                      className="h-10"
                    >
                      None
                    </Button>
                    <Button
                      variant={verticalSpin === 'top' ? 'default' : 'outline'}
                      onClick={() => setVerticalSpin('top')}
                      className="h-10"
                    >
                      Top
                    </Button>
                    <Button
                      variant={verticalSpin === 'bottom' ? 'default' : 'outline'}
                      onClick={() => setVerticalSpin('bottom')}
                      className="h-10"
                    >
                      Bottom
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Power Level */}
            <div className="space-y-2">
              <Label>Power Level: {powerLevel}/5</Label>
              <Slider
                value={[powerLevel]}
                onValueChange={(value) => setPowerLevel(value[0])}
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>3</span>
                <span>5</span>
              </div>
            </div>
          </div>

          {/* Result Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">🎯 Result</h3>
            
            {/* Outcome */}
            <div className="space-y-2">
              <Label>Outcome</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'pocketed', label: 'Pocketed', color: 'bg-green-500' },
                  { value: 'safety', label: 'Safety', color: 'bg-blue-500' },
                  { value: 'fail', label: 'Fail', color: 'bg-orange-500' },
                  { value: 'miss', label: 'Miss', color: 'bg-red-500' },
                  { value: 'scratch', label: 'Scratch', color: 'bg-purple-500' }
                ].map((outcomeOption) => (
                  <Button
                    key={outcomeOption.value}
                    variant={outcome === outcomeOption.value ? 'default' : 'outline'}
                    onClick={() => setOutcome(outcomeOption.value as any)}
                    className="h-12"
                  >
                    {outcomeOption.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Confidence Rating */}
            <div className="space-y-2">
              <Label>Confidence Rating: {confidenceRating}/10</Label>
              <Slider
                value={[confidenceRating]}
                onValueChange={(value) => setConfidenceRating(value[0])}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full h-12">
                Advanced Options
                {showAdvanced ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              {/* Cue Ball Control */}
              <div className="space-y-2">
                <Label>Cue Ball Control</Label>
                <Select value={cueBallControl} onValueChange={(value) => setCueBallControl(value as any)}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_target">On Target</SelectItem>
                    <SelectItem value="safe_zone">Safe Zone</SelectItem>
                    <SelectItem value="out_of_line">Out of Line</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Error Type */}
              <div className="space-y-2">
                <Label>Error Type</Label>
                <Select value={errorType} onValueChange={(value) => setErrorType(value as any)}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="aim">Aim</SelectItem>
                    <SelectItem value="power">Power</SelectItem>
                    <SelectItem value="spin_deflection">Spin Deflection</SelectItem>
                    <SelectItem value="mental">Mental</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Strategic Intent */}
              <div className="space-y-2">
                <Label>Strategic Intent</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['positioning', 'safety', 'breakout', 'straight_shot'].map((intent) => (
                    <Button
                      key={intent}
                      variant={strategicIntent === intent ? 'default' : 'outline'}
                      onClick={() => setStrategicIntent(strategicIntent === intent ? '' : intent)}
                      className="h-10 text-sm"
                    >
                      {intent.charAt(0).toUpperCase() + intent.slice(1).replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Break Shot Details - separate section */}
          {isBreakShot && (
            <Card className="border-accent">
              <CardHeader>
                <CardTitle className="text-lg">🎱 Break Shot Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Balls Pocketed on Break: {ballsPocketedOnBreak}</Label>
                  <Slider
                    value={[ballsPocketedOnBreak]}
                    onValueChange={(value) => setBallsPocketedOnBreak(value[0])}
                    max={15}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span>7</span>
                    <span>15</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Break Spread Quality: {breakSpreadQuality}/10</Label>
                  <Slider
                    value={[breakSpreadQuality]}
                    onValueChange={(value) => setBreakSpreadQuality(value[0])}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Collapsible open={showNotes} onOpenChange={setShowNotes}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full h-12">
                Add Notes
                {showNotes ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add reflection notes about this shot..."
                className="min-h-20"
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Log Shot Button */}
          <Button 
            onClick={handleLogShot}
            disabled={loading}
            className="w-full h-16 text-lg font-semibold"
            size="lg"
          >
            {loading ? "Logging Shot..." : `Log Shot #${shotNumber}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShotLogger;