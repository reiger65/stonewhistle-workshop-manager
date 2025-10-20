import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Loader2, Download, Upload, Trash2, Database, RefreshCcw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/layout/main-layout';

interface Backup {
  name: string;
  size: number;
  sizeFormatted: string;
  date: string;
  dateFormatted: string;
}

export default function DatabaseBackupPage() {
  const { toast } = useToast();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [createBackupLoading, setCreateBackupLoading] = useState(false);

  // Fetch list of backups
  const fetchBackups = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/backup/list');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.success && data.backups) {
        // Transform the backup format to match our interface
        const formattedBackups = data.backups.map((backup: any) => ({
          name: backup.filename,
          size: parseFloat(backup.size) * 1024 * 1024, // Convert MB to bytes
          sizeFormatted: backup.size,
          date: backup.timestamp,
          dateFormatted: new Date(backup.timestamp).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        }));
        setBackups(formattedBackups);
      } else {
        setBackups([]);
      }
    } catch (err) {
      console.error('Failed to fetch backups:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch backups');
    } finally {
      setIsLoading(false);
    }
  };

  // Load backups on mount
  useEffect(() => {
    fetchBackups();
  }, []);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check if it's an SQL file
      if (!file.name.toLowerCase().endsWith('.sql')) {
        toast({
          title: "Invalid file type",
          description: "Only .sql files are supported.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  // Create a new backup
  const handleCreateBackup = async () => {
    try {
      setCreateBackupLoading(true);
      
      const response = await fetch('/api/backup/database', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Backup created",
          description: `Database backup created successfully: ${data.filename || ''}`,
        });
        // Wait a moment before refreshing to allow the backup to be written
        setTimeout(() => {
          fetchBackups(); // Refresh the list
        }, 1000);
      } else {
        throw new Error(data.error || 'Failed to create backup');
      }
    } catch (err) {
      console.error('Failed to create backup:', err);
      toast({
        title: "Backup failed",
        description: err instanceof Error ? err.message : 'Failed to create backup',
        variant: "destructive",
      });
    } finally {
      setCreateBackupLoading(false);
    }
  };

  // Handle backup restore
  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a backup file to upload.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('backup', selectedFile);
      
      // Use XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });
      
      xhr.onload = function() {
        setIsUploading(false);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          let response;
          try {
            response = JSON.parse(xhr.responseText);
          } catch (e) {
            console.error('Failed to parse response:', e);
            response = { success: false, error: 'Invalid server response' };
          }
          
          if (response.success) {
            toast({
              title: "Restore successful",
              description: "Database has been restored successfully.",
            });
            
            // Reset form and refresh list
            setSelectedFile(null);
            if (document.getElementById('file-upload')) {
              (document.getElementById('file-upload') as HTMLInputElement).value = '';
            }
            fetchBackups();
          } else {
            toast({
              title: "Restore failed",
              description: response.error || 'Failed to restore database',
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Restore failed",
            description: `Server returned status code ${xhr.status}`,
            variant: "destructive",
          });
        }
      };
      
      xhr.onerror = function() {
        setIsUploading(false);
        toast({
          title: "Upload failed",
          description: "Connection error occurred during upload",
          variant: "destructive",
        });
      };
      
      xhr.open('POST', '/api/backup/restore', true);
      xhr.send(formData);
      
    } catch (err) {
      setIsUploading(false);
      console.error('Failed to upload backup:', err);
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : 'Failed to upload backup',
        variant: "destructive",
      });
    }
  };

  // Delete a backup
  const handleDeleteBackup = async (fileName: string) => {
    if (!confirm(`Are you sure you want to delete the backup: ${fileName}?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/backup/delete/${encodeURIComponent(fileName)}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Backup deleted",
          description: `Backup ${fileName} has been deleted.`,
        });
        fetchBackups(); // Refresh the list
      } else {
        throw new Error(data.error || 'Failed to delete backup');
      }
    } catch (err) {
      console.error('Failed to delete backup:', err);
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : 'Failed to delete backup',
        variant: "destructive",
      });
    }
  };

  // Handle restoring an existing backup
  const handleRestoreBackup = async (fileName: string) => {
    if (!confirm(`Are you sure you want to restore the database from: ${fileName}?\n\nThis will overwrite all current data!`)) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/backup/restore/${encodeURIComponent(fileName)}`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Restore started',
          description: 'Database restore has started. The application will restart soon.',
          duration: 8000,
        });
      } else {
        throw new Error(data.error || 'Failed to restore backup');
      }
    } catch (err) {
      console.error('Failed to restore backup:', err);
      toast({
        title: "Restore failed",
        description: err instanceof Error ? err.message : 'Failed to restore backup',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Download a backup
  const handleDownloadBackup = (fileName: string) => {
    window.location.href = `/api/backup/download/${encodeURIComponent(fileName)}`;
  };

  return (
    <MainLayout className="overflow-auto">
      <div className="container max-w-4xl py-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold tracking-tight">Database Backup</h1>
              <form method="get" action="/">
                <button 
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 border rounded-md border-input bg-background hover:bg-accent hover:text-accent-foreground"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                  Back to Buildlist
                </button>
              </form>
            </div>
            <Button 
              variant="ghost" 
              onClick={fetchBackups}
              className="flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
          </div>
          
          <Alert className="bg-blue-50 text-blue-900 border-blue-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Make regular backups and download them to your local machine to ensure you can restore your data
              if you ever need to remix the app or migrate to a new instance.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Backup Card */}
            <Card>
              <CardHeader>
                <CardTitle>Create Database Backup</CardTitle>
                <CardDescription>
                  Make a complete backup of your current database
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button 
                  onClick={handleCreateBackup}
                  disabled={createBackupLoading}
                  className="w-full flex items-center gap-2"
                >
                  {createBackupLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating backup...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4" />
                      Create New Backup
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            {/* Restore Backup Card */}
            <Card>
              <CardHeader>
                <CardTitle>Restore Database</CardTitle>
                <CardDescription>
                  Upload a backup file to restore your database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <label htmlFor="file-upload" className="text-sm font-medium">
                      Select SQL backup file
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".sql"
                      onChange={handleFileChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium"
                      disabled={isUploading}
                    />
                  </div>
                  
                  {isUploading && (
                    <div className="w-full">
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600" 
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-center mt-1">{uploadProgress}% uploaded</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleUpload} 
                  disabled={!selectedFile || isUploading}
                  className="w-full flex items-center gap-2"
                  variant={!selectedFile ? "secondary" : "default"}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload & Restore Database
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <Separator className="my-2" />
          
          {/* Backup List */}
          <Card>
            <CardHeader>
              <CardTitle>Available Backups</CardTitle>
              <CardDescription>
                Download or delete your database backups
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              ) : backups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No backups available yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Create your first backup to get started
                  </p>
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableCaption>All available database backups</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Filename</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {backups.map((backup) => (
                        <TableRow key={backup.name}>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {backup.name}
                          </TableCell>
                          <TableCell>{backup.dateFormatted}</TableCell>
                          <TableCell>{backup.sizeFormatted}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadBackup(backup.name)}
                                title="Download backup"
                                className="h-8 px-2"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Download</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteBackup(backup.name)}
                                title="Delete backup"
                                className="h-8 px-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions for using in Remix */}
          <Card className="bg-amber-50 border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-900">How to Use with Replit Remix</CardTitle>
            </CardHeader>
            <CardContent className="text-amber-800">
              <ol className="list-decimal pl-5 space-y-2">
                <li>Create a backup using the button above.</li>
                <li>Download the backup file to your local machine.</li>
                <li>Create a new remix of this Replit.</li>
                <li>Once the new remix is running, visit this page in the remixed version.</li>
                <li>Use the "Upload & Restore Database" option to upload your backup file.</li>
                <li>Wait for the restore process to complete. The app will restart automatically.</li>
                <li>All your data and settings will now be available in the remixed version.</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}