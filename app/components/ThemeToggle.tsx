"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <button className="sidebar-link" style={{ width: "100%" }}>
                <div style={{ width: 18, height: 18 }} />
                <span>Theme</span>
            </button>
        );
    }

    const isDark = theme === "dark";

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="sidebar-link"
            style={{ width: "100%" }}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
        >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
        </button>
    );
}
