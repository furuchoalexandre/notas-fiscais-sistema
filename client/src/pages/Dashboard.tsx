import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { FileText, TrendingUp, CheckCircle, AlertCircle, FileUp, FilePlus } from "lucide-react";
import { Link } from "wouter";

function fmtMoeda(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default function Dashboard() {
  const { data: stats, isLoading } = trpc.notas.dashboard.useQuery();

  return (
    <AppLayout title="Dashboard">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            Visão geral do controle de notas fiscais
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/notas/importar">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-gray-50"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
              <FileUp className="w-4 h-4" />
              Importar XML
            </button>
          </Link>
          <Link href="/notas/nova">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--primary)" }}>
              <FilePlus className="w-4 h-4" />
              Nova Nota
            </button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4" style={{ color: "var(--primary)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Total de Notas</span>
              </div>
              <div className="stat-value">{stats?.totalNotas ?? 0}</div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4" style={{ color: "oklch(0.55 0.18 140)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Valor Total</span>
              </div>
              <div className="stat-value text-2xl">{fmtMoeda(stats?.valorTotal ?? 0)}</div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4" style={{ color: "oklch(0.55 0.18 140)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Tipos Cadastrados</span>
              </div>
              <div className="stat-value">{stats?.totalPorTipo?.length ?? 0}</div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4" style={{ color: "oklch(0.65 0.18 45)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Status Cadastrados</span>
              </div>
              <div className="stat-value">{stats?.totalPorStatus?.length ?? 0}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Por Status */}
            <div className="bg-white rounded-xl border p-5" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-semibold text-sm mb-4" style={{ color: "var(--foreground)" }}>Notas por Status</h2>
              {!stats?.totalPorStatus?.length ? (
                <p className="text-sm text-center py-6" style={{ color: "var(--muted-foreground)" }}>
                  Nenhuma nota cadastrada ainda
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.totalPorStatus.map((s) => {
                    const pct = stats.totalNotas > 0 ? Math.round((Number(s.count) / stats.totalNotas) * 100) : 0;
                    return (
                      <div key={s.statusId}>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.statusCor || "#6b7280" }} />
                            <span className="text-sm" style={{ color: "var(--foreground)" }}>{s.statusNome || "—"}</span>
                          </div>
                          <span className="text-sm font-medium mono" style={{ color: "var(--muted-foreground)" }}>
                            {Number(s.count)} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: "var(--muted)" }}>
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: s.statusCor || "#6b7280" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Por Tipo */}
            <div className="bg-white rounded-xl border p-5" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-semibold text-sm mb-4" style={{ color: "var(--foreground)" }}>Notas por Tipo</h2>
              {!stats?.totalPorTipo?.length ? (
                <p className="text-sm text-center py-6" style={{ color: "var(--muted-foreground)" }}>
                  Nenhuma nota cadastrada ainda
                </p>
              ) : (
                <div className="space-y-2">
                  {stats.totalPorTipo.map((t) => (
                    <div key={t.tipoId} className="flex items-center justify-between p-2.5 rounded-lg"
                      style={{ background: "var(--muted)" }}>
                      <div>
                        <span className="font-medium text-sm mono" style={{ color: "var(--primary)" }}>
                          {t.tipoCodigo || "—"}
                        </span>
                        <span className="text-xs ml-2" style={{ color: "var(--muted-foreground)" }}>
                          {t.tipoNome}
                        </span>
                      </div>
                      <span className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
                        {Number(t.count)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          {stats?.totalNotas === 0 && (
            <div className="mt-6 bg-white rounded-xl border p-8 text-center" style={{ borderColor: "var(--border)" }}>
              <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--muted-foreground)" }} />
              <h3 className="font-semibold mb-2" style={{ color: "var(--foreground)" }}>Nenhuma nota cadastrada</h3>
              <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
                Comece importando um XML ou cadastrando uma nota manualmente.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/notas/importar">
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border hover:bg-gray-50"
                    style={{ borderColor: "var(--border)" }}>
                    <FileUp className="w-4 h-4" /> Importar XML
                  </button>
                </Link>
                <Link href="/notas/nova">
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white"
                    style={{ background: "var(--primary)" }}>
                    <FilePlus className="w-4 h-4" /> Nova Nota Manual
                  </button>
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
