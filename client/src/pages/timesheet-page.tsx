import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, Square, Clock, Trash2 } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";

interface TimerState {
  isRunning: boolean;
  startTime: string | null;
  totalMinutes: number;
  employeeName: string;
}

interface TimesheetEntry {
  id: number;
  employeeName: string;
  workDate: string;
  startTime: string;
  endTime: string | null;
  totalTimeMinutes: number;
  workedTimeMinutes: number;
  totalAmount: number;
  hourlyRate: number;
}

const employees = [
  { name: "Hans", rate: 0 },
  { name: "Tara", rate: 15 },
  { name: "Mariena", rate: 15 }
];

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function formatTimeWithSeconds(minutes: number, seconds: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function formatAmount(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

export default function TimesheetPage() {
  const [timers, setTimers] = useState<Record<string, TimerState>>({});
  const [history, setHistory] = useState<TimesheetEntry[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Initialize timer states and fetch active timers
  useEffect(() => {
    const initializeTimers = async () => {
      try {
        // Fetch active timers from the backend
        const response = await fetch('/api/timesheets/active');
        if (response.ok) {
          const activeTimers = await response.json();
          const initialTimers: Record<string, TimerState> = {};
          
          employees.forEach(emp => {
            const activeTimer = activeTimers.find((t: any) => t.employeeName === emp.name);
            initialTimers[emp.name] = {
              isRunning: activeTimer?.isRunning || false,
              startTime: activeTimer?.startTime || null,
              totalMinutes: activeTimer?.totalTimeMinutes || 0,
              employeeName: emp.name
            };
          });
          
          setTimers(initialTimers);
        } else {
          // Fallback to empty timers if API fails
          const initialTimers: Record<string, TimerState> = {};
          employees.forEach(emp => {
            initialTimers[emp.name] = {
              isRunning: false,
              startTime: null,
              totalMinutes: 0,
              employeeName: emp.name
            };
          });
          setTimers(initialTimers);
        }
      } catch (error) {
        console.error('Failed to fetch active timers:', error);
        // Fallback initialization
        const initialTimers: Record<string, TimerState> = {};
        employees.forEach(emp => {
          initialTimers[emp.name] = {
            isRunning: false,
            startTime: null,
            totalMinutes: 0,
            employeeName: emp.name
          };
        });
        setTimers(initialTimers);
      }
    };

    initializeTimers();
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/timesheets');
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const startTimer = async (employeeName: string) => {
    try {
      const response = await fetch('/api/timesheets/timer/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeName })
      });

      if (response.ok) {
        setTimers(prev => ({
          ...prev,
          [employeeName]: {
            ...prev[employeeName],
            isRunning: true,
            startTime: new Date().toISOString()
          }
        }));
        toast({ title: `Timer started for ${employeeName}` });
      } else {
        const error = await response.json();
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to start timer", variant: "destructive" });
    }
  };

  const pauseTimer = async (employeeName: string) => {
    try {
      const response = await fetch('/api/timesheets/timer/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeName })
      });

      if (response.ok) {
        const data = await response.json();
        setTimers(prev => ({
          ...prev,
          [employeeName]: {
            ...prev[employeeName],
            isRunning: false,
            totalMinutes: data.totalTimeMinutes || 0
          }
        }));
        toast({ title: `Timer paused for ${employeeName}` });
      } else {
        const error = await response.json();
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to pause timer", variant: "destructive" });
    }
  };

  const resetTimer = async (employeeName: string) => {
    try {
      const response = await fetch('/api/timesheets/timer/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeName })
      });

      if (response.ok) {
        const data = await response.json();
        setTimers(prev => ({
          ...prev,
          [employeeName]: {
            ...prev[employeeName],
            isRunning: false,
            startTime: null,
            totalMinutes: 0
          }
        }));
        toast({ 
          title: `Timer reset for ${employeeName}`, 
          description: `Saved ${data.totalMinutes} minutes (${formatAmount(data.totalAmount)})`
        });
        fetchHistory();
      } else {
        const error = await response.json();
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to reset timer", variant: "destructive" });
    }
  };

  const deleteTimesheetEntry = async (entryId: number) => {
    try {
      const response = await fetch(`/api/timesheets/${entryId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({ title: "Entry deleted", description: "Timesheet entry has been removed" });
        fetchHistory();
      } else {
        const error = await response.json();
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete entry", variant: "destructive" });
    }
  };

  const getCurrentElapsed = (timer: TimerState): { minutes: number; seconds: number } => {
    // Ensure we have valid timer data
    const totalMinutes = isNaN(timer.totalMinutes) ? 0 : timer.totalMinutes;
    
    if (!timer.isRunning || !timer.startTime) {
      return { minutes: totalMinutes, seconds: 0 };
    }
    
    try {
      const startTime = new Date(timer.startTime);
      if (isNaN(startTime.getTime())) {
        return { minutes: totalMinutes, seconds: 0 };
      }
      
      const elapsedMs = currentTime.getTime() - startTime.getTime();
      if (elapsedMs < 0) {
        return { minutes: totalMinutes, seconds: 0 };
      }
      
      const totalElapsedSeconds = Math.floor(elapsedMs / 1000);
      const elapsedMinutes = Math.floor(totalElapsedSeconds / 60);
      const currentSeconds = totalElapsedSeconds % 60;
      
      return { 
        minutes: totalMinutes + elapsedMinutes, 
        seconds: currentSeconds 
      };
    } catch (error) {
      console.error('Error calculating elapsed time:', error);
      return { minutes: totalMinutes, seconds: 0 };
    }
  };

  const getTodaysTotal = (employeeName: string): { minutes: number; amount: number } => {
    const today = new Date().toISOString().split('T')[0];
    const todaysEntries = history.filter(entry => 
      entry.employeeName === employeeName && 
      entry.workDate.startsWith(today)
    );
    
    const minutes = todaysEntries.reduce((sum, entry) => sum + entry.workedTimeMinutes, 0);
    const amount = todaysEntries.reduce((sum, entry) => sum + entry.totalAmount, 0);
    
    return { minutes, amount };
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Workshop Timesheets</h1>
          <p className="text-muted-foreground">Simple stopwatch timers for Hans, Tara, and Mariena</p>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {employees.map(employee => {
          const timer = timers[employee.name];
          const currentElapsed = timer ? getCurrentElapsed(timer) : { minutes: 0, seconds: 0 };
          const todaysTotal = getTodaysTotal(employee.name);
          
          return (
            <Card key={employee.name} className="relative">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {employee.name}
                  <Badge variant={timer?.isRunning ? "default" : "secondary"}>
                    {timer?.isRunning ? "Running" : "Stopped"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-mono font-bold">
                    {formatTimeWithSeconds(currentElapsed.minutes, currentElapsed.seconds)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Current Session
                  </div>
                </div>

                <div className="flex justify-center space-x-2">
                  {!timer?.isRunning ? (
                    <Button 
                      onClick={() => startTimer(employee.name)}
                      className="flex items-center space-x-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>Start</span>
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => pauseTimer(employee.name)}
                      variant="secondary"
                      className="flex items-center space-x-2"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </Button>
                  )}
                  
                  <Button 
                    onClick={() => resetTimer(employee.name)}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <Square className="w-4 h-4" />
                    <span>Reset & Save</span>
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Today's Total:</span>
                    <span className="font-medium">{formatTime(todaysTotal.minutes)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Rate:</span>
                    <span className="font-medium">€{employee.rate}/hour</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Today's Earnings:</span>
                    <span className="font-medium">{formatAmount(todaysTotal.amount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Recent History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {history.slice(0, 10).map(entry => {
              const workDate = entry.workDate;
              const employeeName = entry.employeeName;
              const workedMinutes = entry.workedTimeMinutes || 0;
              const totalAmount = entry.totalAmount || 0;
              
              return (
                <div key={entry.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div>
                    <span className="font-medium">{employeeName}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {workDate ? new Date(workDate).toLocaleDateString() : 'Today'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="font-medium">{formatTime(workedMinutes)}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatAmount(totalAmount)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTimesheetEntry(entry.id)}
                      className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {history.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No timesheet entries yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </MainLayout>
  );
}