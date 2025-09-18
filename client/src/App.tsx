import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import { AppSidebar } from "@/components/AppSidebar";
import ServerSelector from "@/components/ServerSelector";
import ServerConnectionModal, { ProxmoxServer } from "@/components/ServerConnectionModal";
import Dashboard from "@/pages/Dashboard";
import VirtualMachines from "@/pages/VirtualMachines";
import Containers from "@/pages/Containers";
import Nodes from "@/pages/Nodes";
import Storage from "@/pages/Storage";
import Activity from "@/pages/Activity";
import NetworkPage from "@/pages/Network";
import ProxmoxScriptsPage from "@/pages/ProxmoxScripts";
import ScriptDetail from "@/pages/ScriptDetail";
import UsersPage from "@/pages/Users";
import SettingsPage from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import { useState, useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/vms" component={VirtualMachines} />
      <Route path="/containers" component={Containers} />
      <Route path="/nodes" component={Nodes} />
      <Route path="/storage" component={Storage} />
      <Route path="/network" component={NetworkPage} />
      <Route path="/activity" component={Activity} />
      <Route path="/users" component={UsersPage} />
      <Route path="/scripts" component={ProxmoxScriptsPage} />
      <Route path="/scripts/:slug" component={ScriptDetail} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const [servers, setServers] = useState<ProxmoxServer[]>([]);
  const [currentServerId, setCurrentServerId] = useState<string>("");
  const [showServerModal, setShowServerModal] = useState(false);

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  // Initialize with default server if none exist
  useEffect(() => {
    if (servers.length === 0) {
      // Could load from localStorage here
    }
  }, []);

  // Set current server to default when servers change
  useEffect(() => {
    if (!currentServerId && servers.length > 0) {
      const defaultServer = servers.find(s => s.isDefault) || servers[0];
      setCurrentServerId(defaultServer.id);
    }
  }, [servers, currentServerId]);

  const handleTestConnection = async (server: ProxmoxServer): Promise<boolean> => {
    try {
      // TODO: Implement actual Proxmox API connection test
      const response = await fetch('/api/proxmox/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(server)
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.success;
      }
      return false;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  };

  const currentServer = servers.find(s => s.id === currentServerId);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="proxclustercontrol-ui-theme">
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 min-w-0">
                <header className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <div className="flex items-center gap-4">
                    <ServerConnectionModal
                      servers={servers}
                      onServersChange={setServers}
                      onTestConnection={handleTestConnection}
                    >
                      <div style={{ display: 'contents' }}>
                        <ServerSelector
                          servers={servers}
                          currentServerId={currentServerId}
                          onServerChange={setCurrentServerId}
                          onManageServers={() => {}}
                        />
                      </div>
                    </ServerConnectionModal>
                    <ThemeToggle />
                  </div>
                </header>
                <main className="flex-1 overflow-auto p-6">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}