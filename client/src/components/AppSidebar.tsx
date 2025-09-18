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
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Monitor, 
  Box, 
  Server, 
  HardDrive,
  Network,
  Settings,
  Activity,
  Users,
  Terminal,
  LogOut,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigationItems = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
      },
      {
        title: "Activity",
        url: "/activity",
        icon: Activity,
      },
    ],
  },
  {
    title: "Resources",
    items: [
      {
        title: "Virtual Machines",
        url: "/vms",
        icon: Monitor,
      },
      {
        title: "Containers",
        url: "/containers", 
        icon: Box,
      },
      {
        title: "Nodes",
        url: "/nodes",
        icon: Server,
      },
      {
        title: "Storage",
        url: "/storage",
        icon: HardDrive,
      },
      {
        title: "Network",
        url: "/network",
        icon: Network,
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        title: "Users & Permissions",
        url: "/users",
        icon: Users,
      },
      {
        title: "Proxmox Scripts",
        url: "/scripts",
        icon: Terminal,
      },
      {
        title: "Settings",
        url: "/settings",
        icon: Settings,
      },
    ],
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  const handleLogout = () => {
    console.log("Logout clicked"); //todo: remove mock functionality
  };

  return (
    <Sidebar data-testid="app-sidebar">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Server className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">ProxClusterControl</h2>
            <p className="text-xs text-muted-foreground">Cluster Management</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {navigationItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      className={cn(
                        location === item.url && "bg-sidebar-accent text-sidebar-accent-foreground"
                      )}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <a href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        <ChevronRight className="h-3 w-3 ml-auto opacity-50" />
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="p-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
        <div className="px-4 pb-2">
          <div className="text-xs text-muted-foreground">
            <div>Connected to: pve-cluster</div>
            <div>User: root@pam</div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}