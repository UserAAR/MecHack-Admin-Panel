import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        icon: Icons.HomeIcon,
        url: "/",
        items: [],
      },
      {
        title: "Content",
        icon: Icons.Table,
        items: [
          { title: "News", url: "/content/news", icon: Icons.NewsIcon },
          { title: "Projects", url: "/content/projects", icon: Icons.ProjectsIcon },
          { title: "Events", url: "/content/events", icon: Icons.EventsIcon },
        ],
      },
      {
        title: "Media Library",
        url: "/media",
        icon: Icons.FourCircle,
        items: [],
      },
      {
        title: "Calendar",
        url: "/calendar",
        icon: Icons.Calendar,
        items: [],
      },
      {
        title: "Profiles",
        url: "/profiles",
        icon: Icons.User,
        items: [],
      },
      {
        title: "Settings",
        url: "/settings",
        icon: Icons.Alphabet,
        items: [],
      },
    ],
  },
] as const;
