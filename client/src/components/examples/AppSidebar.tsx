import { AppSidebar } from "../AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AppSidebarExample() {
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">Sidebar Navigation</h2>
            <p className="text-muted-foreground">Click on the navigation items to see active states</p>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}