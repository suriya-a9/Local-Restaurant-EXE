import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const MainLayout = ({ hideHeader = false, fullscreen = false }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const updateResize = () => {
            const mobile = window.innerWidth <= 768;

            setIsMobile(mobile);

            if (!mobile) {
                setIsSidebarOpen(false);
            }
        };

        updateResize();

        window.addEventListener("resize", updateResize);

        return () => {
            window.removeEventListener("resize", updateResize);
        };
    }, []);

    const toggleSidebar = () => {
        if (isMobile) {
            setIsSidebarOpen((prev) => !prev);
        }
    };

    const closeSidebar = () => {
        if (isMobile) {
            setIsSidebarOpen(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#f5f7fa]">
            {!hideHeader && <Header />}

            <div className="flex flex-1 overflow-hidden relative">

                {isMobile && (
                    <button
                        className="fixed top-3 left-3 z-95 w-10 h-10 flex items-center justify-center bg-white border border-[#e0e6ed] rounded-lg text-[#2d1b4e] cursor-pointer shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
                        onClick={toggleSidebar}
                        aria-label="Open navigation"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        >
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                )}

                <Sidebar
                    isOpen={isSidebarOpen}
                    isMobile={isMobile}
                    closeSidebar={closeSidebar}
                />

                <main className={`flex-1 overflow-y-auto bg-[#f5f7fa] w-full min-w-0
                    ${fullscreen ? "p-0" : "p-4 pt-16 sm:p-6 sm:pt-18 md:p-8 md:pt-8"}
                    [&::-webkit-scrollbar]:w-1.5
                    [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:bg-[#cbd5e0]
                    [&::-webkit-scrollbar-thumb]:rounded-[3px]
                    hover:[&::-webkit-scrollbar-thumb]:bg-[#a0aec0]`}
                >
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;