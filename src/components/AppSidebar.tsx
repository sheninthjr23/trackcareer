
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { FileText, BookOpen, Target, Briefcase, LayoutGrid, Sparkles } from "lucide-react";
import type { Section } from "@/pages/Index";

interface AppSidebarProps {
  activeSection: Section;
  setActiveSection: (section: Section) => void;
}

const menuItems = [
  {
    title: "Dashboard",
    section: "dashboard" as Section,
    icon: LayoutGrid,
    description: "Overview & Analytics"
  },
  {
    title: "Resume Collection",
    section: "resumes" as Section,
    icon: FileText,
    description: "Manage & Share"
  },
  {
    title: "Course Management",
    section: "courses" as Section,
    icon: BookOpen,
    description: "Learning Path"
  },
  {
    title: "Activity Tracking",
    section: "activities" as Section,
    icon: Target,
    description: "Progress Monitor"
  },
  {
    title: "Job Applications",
    section: "jobs" as Section,
    icon: Briefcase,
    description: "Career Tracker"
  },
];

export function AppSidebar({ activeSection, setActiveSection }: AppSidebarProps) {
  return (
    <Sidebar className="border-r border-white/10">
      <SidebarHeader className="border-b border-white/10 bg-gradient-to-b from-black/20 to-transparent">
        <div className="px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 bg-gradient-to-br from-white to-gray-300 rounded-lg flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-black" />
            </div>
            <h2 className="text-xl font-bold text-gradient">Professional Hub</h2>
          </div>
          <p className="text-sm text-muted-foreground">Elevate your career journey</p>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.section}>
                  <SidebarMenuButton
                    onClick={() => setActiveSection(item.section)}
                    isActive={activeSection === item.section}
                    className={`w-full rounded-lg transition-all duration-200 hover:bg-white/5 group ${
                      activeSection === item.section 
                        ? 'bg-white text-black hover:bg-white/90' 
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 ${
                      activeSection === item.section ? 'text-black' : 'text-gray-400 group-hover:text-white'
                    }`} />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{item.title}</span>
                      <span className={`text-xs ${
                        activeSection === item.section ? 'text-black/60' : 'text-gray-500 group-hover:text-gray-300'
                      }`}>
                        {item.description}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
