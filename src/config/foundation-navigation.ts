import { BookOpen, CheckSquare, ClipboardList, FileBarChart, LayoutDashboard, Settings, ShoppingBasket } from 'lucide-react';

export const foundationNavigation = [
  { key: 'overview', label: 'Overview', segment: '', icon: LayoutDashboard },
  { key: 'requests', label: 'Requests', segment: 'requests', icon: ClipboardList, moduleKey: 'requests' },
  { key: 'catalog', label: 'Catalog', segment: 'catalog', icon: ShoppingBasket },
  { key: 'knowledge', label: 'Knowledge', segment: 'knowledge', icon: BookOpen },
  { key: 'approvals', label: 'Approvals', segment: 'approvals', icon: CheckSquare },
  { key: 'reports', label: 'Reports', segment: 'reports', icon: FileBarChart },
  { key: 'settings', label: 'Settings', segment: 'settings', icon: Settings, permission: 'workspace.administer' },
] as const;