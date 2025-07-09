
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Mail, Lock } from "lucide-react";

interface SignUpFormProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
}

export function SignUpForm({ loading, setLoading, email, setEmail, password, setPassword }: SignUpFormProps) {
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            title: "Account exists",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Account created successfully!",
          description: "Please check your email to confirm your account.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "An error occurred during sign up.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSignUp} className="space-y-4 w-full">
        <div className="space-y-2 w-full">
          <Label htmlFor="signup-email" className="text-white text-sm font-medium block">
            Email Address
          </Label>
          <div className="relative w-full">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="signup-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-white/40 focus:ring-white/20 h-11"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2 w-full">
          <Label htmlFor="signup-password" className="text-white text-sm font-medium block">
            Password
          </Label>
          <div className="relative w-full">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="signup-password"
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-white/40 focus:ring-white/20 h-11"
              required
            />
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full h-11 bg-white text-black hover:bg-gray-100 font-medium transition-all duration-200" 
          disabled={loading}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
        
        <div className="text-center mt-4">
          <p className="text-xs text-gray-400">
            By creating an account, you agree to our{' '}
            <span className="text-white underline cursor-pointer">Terms of Service</span>
            {' '}and{' '}
            <span className="text-white underline cursor-pointer">Privacy Policy</span>
          </p>
        </div>
      </form>
    </div>
  );
}
