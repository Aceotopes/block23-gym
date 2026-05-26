import {
  LayoutDashboard,
  Users,
  CreditCard,
  ClipboardCheck,
  Settings,
} from "lucide-react";

export const navigation = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },

  {
    title: "Members",
    href: "/members",
    icon: Users,
  },

  {
    title: "Attendance",
    href: "/attendance",
    icon: ClipboardCheck,
  },

  {
    title: "Payments",
    href: "/payments",
    icon: CreditCard,
  },

  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];
