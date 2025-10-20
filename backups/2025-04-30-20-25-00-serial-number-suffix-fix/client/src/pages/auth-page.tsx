import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

// Form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { user, isLoading, loginMutation } = useAuth();

  // Login form with fixed username/password
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "Reiger65",
      password: "Johannes@@2025",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };
  
  // Auto login on page load - with better error handling
  useEffect(() => {
    // Only try to log in if not already logged in and not already loading
    // Adding a delay to prevent login loops
    let autoLoginTimer: number | undefined;
    
    // Only attempt auto-login if this is a fresh visit (not after a failed login attempt)
    if (!user && !isLoading && !loginMutation.isPending && !loginMutation.isError) {
      autoLoginTimer = window.setTimeout(() => {
        const credentials = {
          username: "Reiger65",
          password: "Johannes@@2025"
        };
        console.log("Attempting auto-login...");
        loginMutation.mutate(credentials);
      }, 500); // Small delay to prevent rapid login attempts
    }
    
    return () => {
      if (autoLoginTimer) {
        clearTimeout(autoLoginTimer);
      }
    };
  }, [user, isLoading, loginMutation.isPending, loginMutation.isError]);

  // If user is already logged in, redirect to home
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex min-h-screen bg-background items-center justify-center p-4">
      <Card className="w-full max-w-md border-[#1F5B61]/20">
        <div className="p-6 flex justify-center">
          <img 
            src="/assets/logo-wit-blauw.jpeg" 
            alt="StoneWhistle Logo" 
            className="h-24 object-contain"
            onError={(e) => {
              // Fallback if image doesn't load
              const target = e.target as HTMLImageElement;
              target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%231F5B61' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m8 3 4 8 5-5 5 15H2L8 3z'%3E%3C/path%3E%3C/svg%3E";
              target.style.padding = "0.5rem";
            }}
          />
        </div>
        <CardContent>
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-[#1F5B61] hover:bg-[#174349] text-white"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
              {loginMutation.isError && (
                <p className="text-sm text-destructive mt-2 text-center">
                  {(loginMutation.error as Error)?.message || "Invalid username or password. Please try again."}
                </p>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}