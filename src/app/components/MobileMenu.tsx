"use client";

import { useRouter, usePathname } from "next/navigation";
import { 
  ChartBarIcon,
  UserGroupIcon, // Replace CleatIcon with UserGroupIcon for Players
  PlayIcon,      // Replace PlayCircleIcon with PlayIcon for Games
  ArrowLeftStartOnRectangleIcon, // Replace deprecated ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";
import { Menu } from "lucide-react"; // Add this import
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function MobileMenu() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    router.push("/logout");
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  if (pathname === '/login') return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-foreground h-12 w-12">
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
              className="w-full justify-start space-x-2 text-[1.05rem]" 
              onClick={() => handleNavigation('/dashboard')}
            >
              <ChartBarIcon className="h-[1.05rem] w-[1.05rem]" /> {/* 5% larger icons */}
              <span>Dashboard</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start space-x-2 text-[1.05rem]"
              onClick={() => handleNavigation('/players')}
            >
              <UserGroupIcon className="h-[1.05rem] w-[1.05rem]" />
              <span>Players</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start space-x-2 text-[1.05rem]"
              onClick={() => handleNavigation('/games')}
            >
              <PlayIcon className="h-[1.05rem] w-[1.05rem]" />
              <span>Games</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start space-x-2 text-[1.05rem] text-destructive"
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
