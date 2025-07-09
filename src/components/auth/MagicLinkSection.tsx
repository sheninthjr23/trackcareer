
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";

interface MagicLinkSectionProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  email: string;
}

export function MagicLinkSection({ loading, setLoading, email }: MagicLinkSectionProps) {
  const { toast } = useToast();

  const handleMagicLink = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      toast({
        title: "Magic link sent!",
        description: "Check your email for the sign in link.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send magic link",
        description: error.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/20" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-black px-4 text-gray-400 font-medium">Or continue with</span>
        </div>
      </div>
      
      <Button 
        type="button" 
        variant="outline" 
        className="w-full h-11 border-white/20 text-white hover:bg-white/10 transition-all duration-200"
        onClick={handleMagicLink}
        disabled={loading}
      >
        <Mail className="h-4 w-4 mr-2" />
        Send Magic Link
      </Button>
    </div>
  );
}
