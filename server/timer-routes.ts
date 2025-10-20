import { Express } from "express";
import { z } from "zod";
import { storage } from "./storage";

export function registerTimerRoutes(app: Express) {
  // Get active timers for all employees
  app.get('/api/timesheets/active', async (req, res) => {
    try {
      const activeTimers = await storage.getActiveTimers();
      res.json(activeTimers);
    } catch (error) {
      console.error('Error fetching active timers:', error);
      res.status(500).json({ error: 'Failed to fetch active timers' });
    }
  });

  // Get all timesheet entries
  app.get('/api/timesheets', async (req, res) => {
    try {
      const entries = await storage.getTimesheetEntries();
      res.json(entries);
    } catch (error) {
      console.error('Error fetching timesheet entries:', error);
      res.status(500).json({ error: 'Failed to fetch timesheet entries' });
    }
  });

  // Start timer for employee (handles both new start and resume)
  app.post("/api/timesheets/timer/start", async (req, res) => {
    try {
      const schema = z.object({
        employeeName: z.string(),
        notes: z.string().optional(),
      });
      
      const parsedData = schema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: parsedData.error.format() 
        });
      }
      
      const { employeeName, notes } = parsedData.data;
      
      // Check if employee already has an active timer
      const activeTimers = await storage.getActiveTimers();
      const existingTimer = activeTimers.find(t => t.employeeName === employeeName);
      
      if (existingTimer) {
        return res.status(400).json({ 
          message: `Timer already running for ${employeeName}`,
          activeTimer: existingTimer 
        });
      }

      // Check if employee has a paused timer to resume
      const pausedTimer = await storage.getPausedTimer(employeeName);
      if (pausedTimer) {
        // Resume paused timer by clearing endTime and updating startTime
        // Preserve the accumulated time from the paused timer
        const resumedTimer = await storage.updateTimesheet(pausedTimer.id, {
          endTime: null, // Clear endTime to make it active again
          startTime: new Date(), // Set new start time for resume
          // Keep totalTimeMinutes as is - this preserves accumulated time
        });
        return res.json(resumedTimer);
      }
      
      // Create new timer entry
      const now = new Date();
      const hourlyRateEuros = employeeName === "Hans" ? 0 : 15;
      
      const timerData = {
        employeeName,
        workDate: now,
        startTime: now,
        endTime: null,
        totalTimeMinutes: null,
        breakTimeMinutes: 0,
        workedTimeMinutes: null,
        hourlyRate: hourlyRateEuros * 100,
        totalAmount: null,
        isPaid: false,
        notes: notes || null,
      };
      
      const timer = await storage.createTimesheet(timerData);
      res.status(201).json(timer);
    } catch (error) {
      console.error("Failed to start timer:", error);
      res.status(500).json({ message: "Failed to start timer" });
    }
  });

  // Stop timer for employee (Reset & Save functionality)
  app.post("/api/timesheets/timer/stop", async (req, res) => {
    try {
      const schema = z.object({
        employeeName: z.string(),
        breakTimeMinutes: z.number().optional().default(0),
      });
      
      const parsedData = schema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: parsedData.error.format() 
        });
      }
      
      const { employeeName, breakTimeMinutes } = parsedData.data;
      
      // Find active or paused timer for employee
      const activeTimers = await storage.getActiveTimers();
      let timer = activeTimers.find(t => t.employeeName === employeeName);
      
      // If no active timer, check for paused timer
      if (!timer) {
        timer = await storage.getPausedTimer(employeeName);
      }
      
      if (!timer) {
        return res.status(404).json({ 
          message: `No active or paused timer found for ${employeeName}` 
        });
      }
      
      // Calculate total time worked including any accumulated time
      const now = new Date();
      let totalMinutes = timer.totalTimeMinutes || 0;
      
      // If timer is currently active (has no endTime), add current session time
      if (!timer.endTime) {
        const startTime = new Date(timer.startTime);
        const sessionMinutes = Math.floor((now.getTime() - startTime.getTime()) / 60000);
        totalMinutes += sessionMinutes;
      }
      
      const workedMinutes = totalMinutes - breakTimeMinutes;
      const hourlyRateCents = timer.hourlyRate || 0;
      const totalAmount = Math.round((workedMinutes / 60) * hourlyRateCents);
      
      // Update timer with final values
      const updatedTimer = await storage.updateTimesheet(timer.id, {
        endTime: now,
        totalTimeMinutes: totalMinutes,
        breakTimeMinutes: breakTimeMinutes,
        workedTimeMinutes: workedMinutes,
        totalAmount: totalAmount,
      });
      
      res.json(updatedTimer);
    } catch (error) {
      console.error("Failed to stop timer:", error);
      res.status(500).json({ message: "Failed to stop timer" });
    }
  });

  // Pause timer for employee (keeps accumulated time)
  app.post("/api/timesheets/timer/pause", async (req, res) => {
    try {
      const schema = z.object({
        employeeName: z.string(),
      });
      
      const parsedData = schema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: parsedData.error.format() 
        });
      }
      
      const { employeeName } = parsedData.data;
      
      // Find active timer for employee
      const activeTimers = await storage.getActiveTimers();
      const activeTimer = activeTimers.find(t => t.employeeName === employeeName);
      
      if (!activeTimer) {
        return res.status(404).json({ 
          message: `No active timer found for ${employeeName}` 
        });
      }
      
      // Calculate time elapsed in this session and add to accumulated time
      const now = new Date();
      const startTime = new Date(activeTimer.startTime);
      const sessionSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      // Convert everything to whole minutes for database storage
      const sessionMinutes = Math.floor(sessionSeconds / 60);
      const newTotalMinutes = (activeTimer.totalTimeMinutes || 0) + sessionMinutes;
      
      // Update timer with accumulated time and mark as paused by setting endTime 
      const updatedTimer = await storage.updateTimesheet(activeTimer.id, {
        totalTimeMinutes: newTotalMinutes,
        endTime: now, // Mark as paused/ended to remove from active list
      });
      
      res.json(updatedTimer);
    } catch (error) {
      console.error("Failed to pause timer:", error);
      res.status(500).json({ message: "Failed to pause timer" });
    }
  });

  // Reset & Save timer for employee (saves accumulated time to history and resets)
  app.post("/api/timesheets/timer/reset", async (req, res) => {
    try {
      const schema = z.object({
        employeeName: z.string(),
        breakTimeMinutes: z.number().optional().default(0),
      });
      
      const parsedData = schema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: parsedData.error.format() 
        });
      }
      
      const { employeeName, breakTimeMinutes } = parsedData.data;
      
      // Find active timer for employee
      const activeTimers = await storage.getActiveTimers();
      let activeTimer = activeTimers.find(t => t.employeeName === employeeName);
      
      // If no active timer, check for paused timer
      if (!activeTimer) {
        const pausedTimer = await storage.getPausedTimer(employeeName);
        if (pausedTimer) {
          activeTimer = pausedTimer;
        }
      }
      
      if (!activeTimer) {
        return res.status(404).json({ 
          message: `No active or paused timer found for ${employeeName}` 
        });
      }
      
      // Calculate total time worked including any accumulated time
      const now = new Date();
      let totalMinutes = activeTimer.totalTimeMinutes || 0;
      
      // If timer is currently active (has no endTime), add current session time
      if (!activeTimer.endTime) {
        const startTime = new Date(activeTimer.startTime);
        const sessionSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        // Convert to whole minutes for database storage
        const sessionMinutes = Math.floor(sessionSeconds / 60);
        totalMinutes += sessionMinutes;
      }
      
      const workedMinutes = Math.max(0, totalMinutes - breakTimeMinutes);
      const hourlyRateCents = activeTimer.hourlyRate || 0;
      const totalAmount = Math.round((workedMinutes / 60) * hourlyRateCents);
      
      // Save the final timesheet entry to history - use integers only
      const finalTimer = await storage.updateTimesheet(activeTimer.id, {
        endTime: now,
        totalTimeMinutes: totalMinutes,
        breakTimeMinutes: breakTimeMinutes,
        workedTimeMinutes: workedMinutes,
        totalAmount: totalAmount,
      });
      
      res.json({
        message: `Timer reset and saved for ${employeeName}`,
        savedTimesheet: finalTimer,
        totalMinutes: totalMinutes,
        workedMinutes: workedMinutes,
        totalAmount: totalAmount
      });
    } catch (error) {
      console.error("Failed to reset timer:", error);
      res.status(500).json({ message: "Failed to reset timer" });
    }
  });

  // Delete a timesheet entry
  app.delete("/api/timesheets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid timesheet ID" });
      }
      
      const success = await storage.deleteTimesheet(id);
      
      if (success) {
        res.json({ message: "Timesheet entry deleted successfully" });
      } else {
        res.status(404).json({ message: "Timesheet entry not found" });
      }
    } catch (error) {
      console.error("Failed to delete timesheet entry:", error);
      res.status(500).json({ message: "Failed to delete timesheet entry" });
    }
  });
}