"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

export default function MobileMenu() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    router.push("/logout");
  };

  return (
    <>
      {/* Hamburger Menu Button */}
      <div className="absolute top-4 right-4 z-50">
        <button
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
          <div className="absolute right-0 top-0 h-full w-64 bg-gray-800 p-4 shadow-lg">
            <div className="mt-16 flex flex-col space-y-4">
              <button
                onClick={() => router.push('/players')}
                className="text-white hover:bg-gray-700 px-4 py-2 rounded-lg text-left"
              >
                Players
              </button>
              <button
                onClick={() => router.push('/games')}
                className="text-white hover:bg-gray-700 px-4 py-2 rounded-lg text-left"
              >
                Games
              </button>
              <button
                onClick={handleLogout}
                className="text-white hover:bg-gray-700 px-4 py-2 rounded-lg text-left"
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
