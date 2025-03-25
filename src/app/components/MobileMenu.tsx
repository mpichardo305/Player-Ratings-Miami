"use client";

import { useRouter, usePathname } from "next/navigation";
import { 
  ChartBarIcon,
  UserGroupIcon,
  PlayIcon,
  ArrowLeftStartOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { 
  LayoutDashboard,
  Users,
  Trophy,
  LogOut,
  Menu,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";


export default function MobileMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    router.push("/logout");
    setOpen(false); // Close the sheet after logout
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setOpen(false); // Close the sheet after navigation
  };

  if (pathname === '/login') return null;

  // Helper function to determine if a path is active
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  // Button class generator based on active state with hover states disabled
  const getButtonClass = (path: string) => {
    return `w-full justify-start space-x-2 text-[1.05rem] hover:bg-transparent hover:text-current ${
      isActive(path) ? 'bg-primary text-primary-foreground' : ''
    }`;
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-foreground h-12 w-12 hover:bg-transparent">
            <Menu className="h-12 w-12" />
          </Button>
        </SheetTrigger>
        <SheetContent className="bg-secondary border-secondary [&>button>svg]:h-[1.65rem] [&>button>svg]:w-[1.65rem]">
          <SheetHeader>
            <SheetTitle className="text-foreground text-[1.05rem]">Menu</SheetTitle>
          </SheetHeader>
          <div className="mt-8 flex flex-col space-y-2">
          <Button
              variant="ghost"
              className={getButtonClass('/games')}
              onClick={() => handleNavigation('/games')}
            >
              <Trophy className="h-[1.05rem] w-[1.05rem]" />
              <span>Games</span>
            </Button>
            <Button
              variant="ghost"
              className={getButtonClass('/players')}
              onClick={() => handleNavigation('/players')}
            >
              <Users className="h-[1.05rem] w-[1.05rem]" />
              <span>Players</span>
            </Button>
            <Button
              variant="ghost"
              className={getButtonClass('/dashboard')}
              onClick={() => handleNavigation('/dashboard')}
            >
              <LayoutDashboard className="h-[1.05rem] w-[1.05rem]" />
              <span>Dashboard</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start space-x-2 text-[1.05rem] text-destructive hover:bg-transparent hover:text-destructive"
              onClick={handleLogout}
            >
              <ArrowLeftStartOnRectangleIcon className="h-[1.05rem] w-[1.05rem]" />
              <span>Logout</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
