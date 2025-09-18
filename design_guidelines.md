# Proxmox Control Panel Design Guidelines

## Design Approach
**System-Based Approach**: Using a utility-focused design system approach similar to modern admin dashboards and enterprise applications like Linear, Notion, and monitoring tools. This prioritizes functionality, efficiency, and data clarity over visual flourish.

**Design System**: Material Design principles with enterprise customizations for data-heavy interfaces, emphasizing clear information hierarchy and professional aesthetics.

## Core Design Elements

### Color Palette
**Dark Mode Primary**:
- Background: 220 15% 8% (deep dark blue-gray)
- Surface: 220 12% 12% (elevated surfaces)
- Primary: 210 100% 56% (bright blue for actions)
- Success: 142 76% 36% (green for running states)
- Warning: 38 92% 50% (amber for warnings)
- Error: 0 84% 60% (red for critical states)
- Text Primary: 210 20% 98% (near white)
- Text Secondary: 215 20% 65% (muted gray)

**Light Mode Primary**:
- Background: 0 0% 98% (off-white)
- Surface: 0 0% 100% (pure white cards)
- Primary: 210 100% 50% (professional blue)
- Success: 142 71% 45% (darker green)
- Warning: 38 92% 45% (amber)
- Error: 0 72% 51% (red)
- Text Primary: 220 15% 15% (dark gray)
- Text Secondary: 215 15% 45% (medium gray)

### Typography
- **Primary Font**: Inter or Roboto from Google Fonts
- **Headers**: Medium weight (500), clear hierarchy (32px, 24px, 20px, 16px)
- **Body Text**: Regular weight (400), 14px for most content
- **Code/Technical**: JetBrains Mono for VM IDs, IP addresses, commands

### Layout System
**Spacing Units**: Tailwind units of 2, 4, and 8 (p-2, h-8, m-4, etc.)
- Base spacing: 8px (unit 2) for tight elements
- Standard spacing: 16px (unit 4) for most layouts
- Large spacing: 32px (unit 8) for major sections

### Component Library

#### Navigation
- **Sidebar**: Fixed left navigation (240px wide) with collapsible option
- **Top Bar**: Authentication status, theme toggle, notifications
- **Breadcrumbs**: Clear navigation path for nested resources

#### Data Display
- **Status Cards**: Resource usage with progress bars and color-coded states
- **Data Tables**: Sortable columns, row actions, pagination for VM/container lists
- **Status Badges**: Running/Stopped/Error states with appropriate colors
- **Metrics Charts**: Simple line charts for CPU/Memory usage over time

#### Interactive Elements
- **Primary Buttons**: Filled blue buttons for main actions (Start, Create)
- **Secondary Buttons**: Outlined buttons for less critical actions (Stop, Restart)
- **Icon Buttons**: For table row actions and toolbar items
- **Form Controls**: Clean inputs with proper validation states

#### Overlays
- **Modal Dialogs**: For VM creation, configuration, and confirmations
- **Toast Notifications**: For action feedback and system alerts
- **Loading States**: Skeleton screens for data loading

### Key Design Principles
1. **Information Density**: Efficiently display multiple VMs/containers without clutter
2. **Status Clarity**: Clear visual distinction between operational states
3. **Action Accessibility**: Quick access to common operations (start/stop/restart)
4. **Responsive Design**: Works on tablets and desktop screens
5. **Professional Aesthetic**: Clean, enterprise-ready appearance suitable for system administration

### Specific Layout Sections
1. **Dashboard**: Overview cards with cluster health, resource usage summaries
2. **Virtual Machines**: Tabular list with inline actions and status indicators
3. **Containers**: Similar layout to VMs with LXC-specific actions
4. **Nodes**: Individual node status with detailed resource monitoring
5. **Storage**: Pool utilization and storage allocation views

### Visual Hierarchy
- Use consistent card-based layouts for grouped information
- Employ subtle shadows and borders to define content areas
- Maintain consistent icon usage from Heroicons or Material Icons
- Implement proper loading and empty states for all data views

This design emphasizes professional functionality while maintaining visual clarity essential for infrastructure management tasks.