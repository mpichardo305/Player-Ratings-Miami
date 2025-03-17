"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

export default function MobileMenu() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleLogout = async () => {
    setIsMenuOpen(false);
    router.push("/logout");
  };

  // New navigation handler function
  const handleNavigation = (path: string) => {
    setIsMenuOpen(false);
    router.push(path);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      menuRef.current && 
      buttonRef.current &&
      !menuRef.current.contains(event.target as Node) &&
      !buttonRef.current.contains(event.target as Node)
    ) {
      setIsMenuOpen(false);
    }
  };

  useEffect(() => {
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <>
      {/* Hamburger Menu Button */}
      <div className="absolute top-4 right-4 z-50">
        <button
          ref={buttonRef}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-white p-2 rounded-lg hover:bg-gray-700"
        >
          {isMenuOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40">
          <div ref={menuRef} className="absolute right-0 top-0 h-full w-64 bg-gray-800 p-4 shadow-lg">
            <div className="mt-16 flex flex-col space-y-1">
            <button
                onClick={() => handleNavigation('/dashboard')}
                className="text-white hover:bg-gray-700 px-4 py-1.5 rounded-lg text-left"
              >
                Dashboard
            </button>
              <button
                onClick={() => handleNavigation('/players')}
                className="text-white hover:bg-gray-700 px-4 py-1.5 rounded-lg text-left"
              >
                Players
              </button>
              <button
                onClick={() => handleNavigation('/games')}
                className="text-white hover:bg-gray-700 px-4 py-1.5 rounded-lg text-left"
              >
                Games
              </button>
              <button
                onClick={handleLogout}
                className="text-white hover:bg-gray-700 px-4 py-1.5 rounded-lg text-left"
              >
                Logout
              </button>
              {/* Add more menu items here */}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
