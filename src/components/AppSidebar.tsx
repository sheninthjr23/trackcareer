
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
import { FileText, BookOpen, Target, Briefcase, LayoutGrid, Sparkles, MessageCircleQuestion, Youtube, Settings, BarChart3, Code, PenTool } from "lucide-react";
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
    title: "Doubt & Notes",
    section: "doubts" as Section,
    icon: MessageCircleQuestion,
    description: "Questions & Notes"
  },
  {
    title: "YouTube Learning",
    section: "youtube" as Section,
    icon: Youtube,
    description: "Video & Todos"
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
  {
    title: "DSA Problem Tracker",
    section: "dsa" as Section,
    icon: Code,
    description: "Data Structures & Algorithms"
  },
  {
    title: "Story Authoring",
    section: "stories" as Section,
    icon: PenTool,
    description: "Write & Publish Stories"
  },
  {
    title: "Analytics & Reports",
    section: "analytics" as Section,
    icon: BarChart3,
    description: "Progress Analytics"
  },
  {
    title: "Settings",
    section: "settings" as Section,
    icon: Settings,
    description: "Account & Preferences"
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
            <h2 className="text-xl font-bold text-gradient">TrackCareer</h2>
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
                    size="lg"
                    className={`w-full rounded-lg transition-all duration-200 h-auto min-h-[60px] py-3 ${
                      activeSection === item.section 
                        ? 'bg-white text-black hover:bg-white/90' 
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 shrink-0 ${
                      activeSection === item.section ? 'text-white' : 'text-gray-400'
                    }`} />
                    <div className="flex flex-col items-start gap-0.5 min-w-0 flex-1">
                      <span className="font-medium text-sm leading-tight">{item.title}</span>
                      <span className={`text-xs leading-tight ${
                        activeSection === item.section ? 'text-gray-600' : 'text-gray-500'
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
