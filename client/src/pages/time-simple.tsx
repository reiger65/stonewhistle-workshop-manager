import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Play, Pause, Clock, DollarSign, History, 
  Calendar, CheckCircle, AlertCircle, Trash2, Save 
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Timer {
  employee: string;
  startTime: Date;
  isRunning: boolean;
  elapsedSeconds: number;
  accumulatedSeconds?: number;
  activeTimerId?: number;
}

interface Timesheet {
  id: number;
  employeeName: string;
  workDate: Date;
  startTime: Date;
  endTime: Date | null;
  totalTimeMinutes: number | null;
  breakTimeMinutes: number;
  workedTimeMinutes: number | null;
  hourlyRate: number;
  totalAmount: number | null;
  isPaid: boolean;
  paidDate: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function TimeSimple() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [timers, setTimers] = useState<Timer[]>([
    { employee: "Hans", startTime: new Date(), isRunning: false, elapsedSeconds: 0 },
    { employee: "Tara", startTime: new Date(), isRunning: false, elapsedSeconds: 0 },
    { employee: "Mariena", startTime: new Date(), isRunning: false, elapsedSeconds: 0 },
  ]);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [selectedEmployee, setSelectedEmployee] = useState<string>("Hans");

  // Fetch active timers from backend
  const { data: activeTimers } = useQuery<Timesheet[]>({
    queryKey: ["/api/timesheets/active"],
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Fetch timesheet history
  const { data: timesheets } = useQuery<Timesheet[]>({
    queryKey: ["/api/timesheets"],
  });

  // Start timer mutation
  const startTimerMutation = useMutation({
    mutationFn: async (data: { employeeName: string; notes?: string }) => {
      const response = await apiRequest("POST", "/api/timesheets/timer/start", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timesheets/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/timesheets"] });
      toast({
        title: "Timer started",
        description: "Work timer has been started successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to start timer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Pause timer mutation
  const pauseTimerMutation = useMutation({
    mutationFn: async (data: { employeeName: string }) => {
      const response = await apiRequest("POST", "/api/timesheets/timer/pause", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timesheets/active"] });
      toast({
        title: "Timer paused",
        description: "Timer has been paused. Time is preserved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to pause timer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset and save timer mutation
  const resetTimerMutation = useMutation({
    mutationFn: async (data: { employeeName: string; breakTimeMinutes?: number; notes?: string }) => {
      const response = await apiRequest("POST", "/api/timesheets/timer/reset", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timesheets/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/timesheets"] });
      toast({
        title: "Session saved",
        description: "Work session has been saved to history and timer reset.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete timesheet mutation
  const deleteTimesheetMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/timesheets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timesheets"] });
      toast({
        title: "Entry deleted",
        description: "Timesheet entry has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update timer states with active timers from backend
  useEffect(() => {
    if (activeTimers) {
      setTimers(prevTimers =>
        prevTimers.map(timer => {
          const activeTimer = activeTimers.find(at => at.employeeName === timer.employee);
          if (activeTimer) {
            const startTime = new Date(activeTimer.startTime);
            const currentSessionSeconds = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
            const accumulatedSeconds = (activeTimer.totalTimeMinutes || 0) * 60;
            const totalElapsed = accumulatedSeconds + currentSessionSeconds;
            
            return {
              ...timer,
              startTime,
              isRunning: true,
              elapsedSeconds: totalElapsed,
              accumulatedSeconds,
              activeTimerId: activeTimer.id,
            };
          }
          return { 
            ...timer, 
            isRunning: false, 
            elapsedSeconds: timer.elapsedSeconds || 0, // Keep accumulated time when paused
            activeTimerId: undefined 
          };
        })
      );
    }
  }, [activeTimers]);

  // Real-time timer update for running timers
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prevTimers => 
        prevTimers.map(timer => {
          if (timer.isRunning && timer.startTime) {
            const now = new Date();
            const currentSessionSeconds = Math.floor((now.getTime() - timer.startTime.getTime()) / 1000);
            const accumulatedSeconds = timer.accumulatedSeconds || 0;
            const totalElapsed = accumulatedSeconds + currentSessionSeconds;
            return { ...timer, elapsedSeconds: totalElapsed };
          }
          return timer;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const startTimer = (employee: string) => {
    const employeeNotes = notes[employee] || "";
    startTimerMutation.mutate({
      employeeName: employee,
      notes: employeeNotes || undefined,
    });
  };

  const pauseTimer = (employee: string) => {
    pauseTimerMutation.mutate({
      employeeName: employee,
    });
  };

  const resetAndSaveTimer = (employee: string) => {
    // Prevent multiple rapid clicks
    if (resetTimerMutation.isPending) return;
    
    const employeeNotes = notes[employee] || "";
    resetTimerMutation.mutate({
      employeeName: employee,
      breakTimeMinutes: 0,
      notes: employeeNotes || undefined,
    });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const calculateEarnings = (employee: string, seconds: number) => {
    const hourlyRate = employee === "Hans" ? 0 : 15;
    const hours = seconds / 3600;
    return (hours * hourlyRate).toFixed(2);
  };

  const calculateEarningsFromAmount = (amount: number | null) => {
    if (!amount) return "€0.00";
    return `€${(amount / 100).toFixed(2)}`;
  };

  const getFilteredTimesheets = () => {
    if (!timesheets) return [];
    return timesheets
      .filter(t => t.employeeName === selectedEmployee)
      .sort((a, b) => new Date(b.workDate).getTime() - new Date(a.workDate).getTime())
      .slice(0, 10); // Show last 10 entries
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Time Tracking</h1>
          <p className="text-slate-600">Track work hours for Hans, Tara, and Mariena</p>
        </div>

        {/* Timer Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {timers.map((timer) => (
            <Card key={timer.employee} className="shadow-lg border-0 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-xl font-semibold text-slate-800">{timer.employee}</span>
                  <div className={`w-3 h-3 rounded-full ${timer.isRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-mono font-bold text-slate-800 mb-2">
                    {formatTime(timer.elapsedSeconds)}
                  </div>
                  <p className="text-sm text-slate-500">
                    {timer.isRunning ? 'Currently working' : 'Timer stopped'}
                  </p>
                </div>

                <div className="flex items-center justify-center space-x-2 text-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-slate-800">
                    €{calculateEarnings(timer.employee, timer.elapsedSeconds)}
                  </span>
                </div>

                {/* Notes input */}
                <div className="space-y-2">
                  <Label htmlFor={`notes-${timer.employee}`} className="text-sm">Notes</Label>
                  <Textarea
                    id={`notes-${timer.employee}`}
                    placeholder="Optional work notes..."
                    value={notes[timer.employee] || ""}
                    onChange={(e) => setNotes(prev => ({ ...prev, [timer.employee]: e.target.value }))}
                    className="min-h-[60px] text-sm"
                    disabled={timer.isRunning}
                  />
                </div>

                <div className="flex space-x-2">
                  {!timer.isRunning ? (
                    <Button
                      onClick={() => startTimer(timer.employee)}
                      disabled={startTimerMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {timer.elapsedSeconds > 0 ? "Resume" : "Start"}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => pauseTimer(timer.employee)}
                      disabled={pauseTimerMutation.isPending}
                      variant="outline"
                      className="flex-1 border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => resetAndSaveTimer(timer.employee)}
                    disabled={timer.elapsedSeconds === 0 || resetTimerMutation.isPending}
                    variant="outline"
                    className="flex-1 border-blue-500 text-blue-600 hover:bg-blue-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Reset & Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Timesheet History */}
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <History className="w-5 h-5" />
              <span>Timesheet History</span>
            </CardTitle>
            
            {/* Employee filter */}
            <div className="flex space-x-2">
              {["Hans", "Tara", "Mariena"].map((employee) => (
                <Button
                  key={employee}
                  variant={selectedEmployee === employee ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedEmployee(employee)}
                >
                  {employee}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {getFilteredTimesheets().map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="font-medium">
                          {format(new Date(entry.workDate), 'MMM dd, yyyy')}
                        </span>
                        {entry.endTime ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-slate-600">
                        <span>
                          <Clock className="w-3 h-3 inline mr-1" />
                          {format(new Date(entry.startTime), 'HH:mm')}
                          {entry.endTime && ` - ${format(new Date(entry.endTime), 'HH:mm')}`}
                        </span>
                        {entry.workedTimeMinutes && (
                          <span>Duration: {formatMinutes(entry.workedTimeMinutes)}</span>
                        )}
                        <span className="font-medium text-green-600">
                          {calculateEarningsFromAmount(entry.totalAmount)}
                        </span>
                      </div>
                      
                      {entry.notes && (
                        <p className="text-sm text-slate-500 mt-2 italic">"{entry.notes}"</p>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteTimesheetMutation.mutate(entry.id)}
                      disabled={deleteTimesheetMutation.isPending}
                      className="text-red-600 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                
                {getFilteredTimesheets().length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No timesheet entries found for {selectedEmployee}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}