
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, User } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  title: string;
  description: string;
}

export function Header({ title, description }: HeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-black/50 to-black/30 backdrop-blur-sm px-2 xs:px-3 sm:px-4 md:px-6 py-3 xs:py-4 sm:py-5 safe-top">
      <div className="flex items-center gap-2 xs:gap-3 sm:gap-4 min-w-0 flex-1">
        <SidebarTrigger className="text-white hover:bg-white/10 touch-target" />
        <div className="min-w-0 flex-1">
          <h1 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-gradient truncate">
            {title}
          </h1>
          <p className="text-xs xs:text-sm text-muted-foreground mt-0.5 xs:mt-1 truncate hidden xs:block">
            {description}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 xs:gap-3 sm:gap-4 flex-shrink-0">
        <div className="hidden md:flex items-center gap-2">
          <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-muted-foreground">Online</span>
        </div>
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 touch-target p-1 xs:p-2">
                <User className="h-4 w-4 xs:mr-2" />
                <span className="hidden sm:inline truncate max-w-[120px] lg:max-w-none">
                  {user.email}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border">
              <DropdownMenuItem onClick={signOut} className="touch-target">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
