import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  BarChart3, FileText, FileUp, FilePlus, Settings,
  Tag, Layers, Users, LogOut, Menu, X, ChevronRight,
  FileCheck
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  permission?: string;
  adminOnly?: boolean;
}

const navGroups = [
  {
    label: "Principal",
    items: [
      { href: "/", label: "Dashboard", icon: BarChart3 },
      { href: "/notas", label: "Notas Fiscais", icon: FileText, permission: "canViewNotas" },
    ] as NavItem[],
  },
  {
    label: "Operações",
    items: [
      { href: "/notas/importar", label: "Importar XML", icon: FileUp, permission: "canImportXml" },
      { href: "/notas/nova", label: "Nova Nota Manual", icon: FilePlus, permission: "canCreateNota" },
    ] as NavItem[],
  },
  {
    label: "Configurações",
    items: [
      { href: "/configuracoes/status", label: "Status de Nota", icon: Tag, permission: "canManageStatus" },
      { href: "/configuracoes/tipos", label: "Tipos de Nota", icon: Layers, permission: "canManageTipos" },
      { href: "/configuracoes/usuarios", label: "Usuários", icon: Users, adminOnly: true },
    ] as NavItem[],
  },
];

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { data: perms } = trpc.auth.myPermissions.useQuery(undefined, { enabled: isAuthenticated });
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const isAdmin = user?.role === "admin";

  const canSeeItem = (item: NavItem) => {
    if (item.adminOnly) return isAdmin;
    if (!item.permission) return true;
    if (isAdmin) return true;
    if (!perms) return false;
    return (perms as Record<string, unknown>)[item.permission] === true;
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-4 py-5 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--sidebar-active)" }}>
            <FileCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-semibold text-sm leading-tight" style={{ color: "var(--sidebar-fg)" }}>
              Notas Fiscais
            </div>
            <div className="text-xs" style={{ color: "var(--sidebar-muted)", fontFamily: "var(--font-mono)" }}>
              Sistema de Controle
            </div>
          </div>
        </div>
      </div>

      {/* User */}
      <div className="px-4 py-3 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "var(--sidebar-active)", color: "white" }}>
            {(user?.name || user?.email || "U")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate" style={{ color: "var(--sidebar-fg)" }}>
              {user?.name || user?.email || "Usuário"}
            </div>
            <div className="text-xs" style={{ color: "var(--sidebar-muted)" }}>
              {isAdmin ? "Administrador" : "Usuário"}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(canSeeItem);
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label}>
              <div className="sidebar-section-label">{group.label}</div>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                  return (
                    <Link key={item.href} href={item.href}>
                      <button
                        className={`sidebar-nav-item w-full ${isActive ? "active" : ""}`}
                        onClick={() => setMobileOpen(false)}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {isActive && <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-60" />}
                      </button>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 py-3 border-t" style={{ borderColor: "var(--sidebar-border)" }}>
        <button className="sidebar-nav-item w-full" onClick={() => logout()}>
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Sair</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)" }}>
      {/* Desktop Sidebar */}
      <aside className="sidebar hidden lg:flex flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="sidebar flex flex-col relative z-10">
            <button
              className="absolute top-4 right-4 p-1 rounded"
              style={{ color: "var(--sidebar-muted)" }}
              onClick={() => setMobileOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b bg-white sticky top-0 z-30" style={{ borderColor: "var(--border)" }}>
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded" style={{ color: "var(--muted-foreground)" }}>
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
            {title || "Notas Fiscais"}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
