import { NavLink, Outlet } from "react-router-dom";
import { LogOut, Settings, Home, BarChart3, Wallet, PieChart, CreditCard, Map } from "lucide-react";
import React from "react";
import supabase from "../utils/supabaseClient";
import styles from "./Layout.module.css";

export default function Layout() {
    const handleLogout = async () => {
        await supabase.auth.signOut();
        console.log("Logging out...");
    };

    return (
        <div className={styles.layoutContainer}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div>
                    <div className={styles.sidebarHeader}>
                        <Map size={22} />
                        Money Map
                    </div>
                    <nav className={styles.sidebarNav}>
                        <SidebarLink to='/' icon={<Home size={18} />} label='Dashboard' />
                        <SidebarLink to='/accounts' icon={<Wallet size={18} />} label='Accounts' />
                        <SidebarLink to='/transactions' icon={<CreditCard size={18} />} label='Transactions' />
                        <SidebarLink to='/reports' icon={<PieChart size={18} />} label='Reports' />
                    </nav>
                </div>

                <div className={styles.sidebarFooter}>
                    <SidebarLink to='/settings' icon={<Settings size={18} />} label='Settings' />
                    <button onClick={handleLogout} className={`${styles.sidebarLink} ${styles.logout}`}>
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className={styles.mainContent}>
                <Outlet />
            </main>
        </div>
    );
}

interface SidebarLinkProps {
    to: string;
    icon: React.ReactElement;
    label: string;
}

function SidebarLink({ to, icon, label }: SidebarLinkProps) {
    return (
        <NavLink to={to} className={({ isActive }) => `${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ""}`}>
            {icon}
            {label}
        </NavLink>
    );
}
