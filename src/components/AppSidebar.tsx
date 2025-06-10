
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
import { FileText, BookOpen, Target, Briefcase, LayoutGrid } from "lucide-react";
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
  },
  {
    title: "Resume Management",
    section: "resumes" as Section,
    icon: FileText,
  },
  {
    title: "Course Management",
    section: "courses" as Section,
    icon: BookOpen,
  },
  {
    title: "Activity Tracking",
    section: "activities" as Section,
    icon: Target,
  },
  {
    title: "Job Applications",
    section: "jobs" as Section,
    icon: Briefcase,
  },
];

export function AppSidebar({ activeSection, setActiveSection }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="px-4 py-3">
          <h2 className="text-lg font-bold text-gradient">Personal Hub</h2>
          <p className="text-sm text-muted-foreground">Manage your career journey</p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.section}>
                  <SidebarMenuButton
                    onClick={() => setActiveSection(item.section)}
                    isActive={activeSection === item.section}
                    className="w-full"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
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
