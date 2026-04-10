import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Search, FileUp, FilePlus, Trash2, Eye, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

function fmtMoeda(v: string | number | null) {
  if (v === null || v === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}

function fmtData(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

export default function Notas() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [tipoId, setTipoId] = useState<number | undefined>();
  const [statusId, setStatusId] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, refetch } = trpc.notas.list.useQuery({ search, tipoId, statusId, page, limit: 20 });
  const { data: tipos } = trpc.tipos.list.useQuery();
  const { data: statusList } = trpc.status.list.useQuery();
  const { data: perms } = trpc.auth.myPermissions.useQuery();

  const isAdmin = user?.role === "admin";
  const canDelete = isAdmin || (perms as Record<string, unknown> | null | undefined)?.canDeleteNota === true;
  const canCreate = isAdmin || (perms as Record<string, unknown> | null | undefined)?.canCreateNota === true;
  const canImport = isAdmin || (perms as Record<string, unknown> | null | undefined)?.canImportXml === true;

  const deleteMutation = trpc.notas.delete.useMutation({
    onSuccess: () => { toast.success("Nota excluída com sucesso!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <AppLayout title="Notas Fiscais">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Notas Fiscais</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {data ? `${data.total} nota(s) encontrada(s)` : "Carregando..."}
          </p>
        </div>
        <div className="flex gap-2">
          {canImport && (
            <Link href="/notas/importar">
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border hover:bg-gray-50"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                <FileUp className="w-4 h-4" /> Importar XML
              </button>
            </Link>
          )}
          {canCreate && (
            <Link href="/notas/nova">
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90"
                style={{ background: "var(--primary)" }}>
                <FilePlus className="w-4 h-4" /> Nova Nota
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border p-4 mb-4 flex flex-wrap gap-3 items-end" style={{ borderColor: "var(--border)" }}>
        <div className="flex-1 min-w-48">
          <label className="form-label">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
            <input
              type="text"
              placeholder="Número, CNPJ, nome..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }}
            />
          </div>
        </div>
        <div>
          <label className="form-label">Tipo</label>
          <select
            value={tipoId ?? ""}
            onChange={(e) => { setTipoId(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
            className="px-3 py-2 rounded-lg border text-sm focus:outline-none"
            style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }}
          >
            <option value="">Todos</option>
            {tipos?.map(t => <option key={t.id} value={t.id}>{t.codigo} — {t.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Status</label>
          <select
            value={statusId ?? ""}
            onChange={(e) => { setStatusId(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
            className="px-3 py-2 rounded-lg border text-sm focus:outline-none"
            style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }}
          >
            <option value="">Todos</option>
            {statusList?.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>
        <button
          onClick={handleSearch}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "var(--primary)" }}
        >
          <Search className="w-4 h-4" /> Buscar
        </button>
        <button
          onClick={() => { setSearch(""); setSearchInput(""); setTipoId(undefined); setStatusId(undefined); setPage(1); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border hover:bg-gray-50"
          style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
        >
          <RefreshCw className="w-4 h-4" /> Limpar
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Número / Série</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Emitente</th>
                <th>Destinatário</th>
                <th>Emissão</th>
                <th>Valor Total</th>
                <th>Origem</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(9)].map((_, j) => (
                      <td key={j}><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : !data?.items?.length ? (
                <tr>
                  <td colSpan={9} className="text-center py-12" style={{ color: "var(--muted-foreground)" }}>
                    Nenhuma nota encontrada
                  </td>
                </tr>
              ) : (
                data.items.map(({ nota, tipo, status }) => (
                  <tr key={nota.id}>
                    <td>
                      <div className="mono font-medium" style={{ color: "var(--primary)" }}>{nota.numero}</div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>Série {nota.serie}</div>
                    </td>
                    <td>
                      <span className="mono text-xs font-medium px-2 py-0.5 rounded"
                        style={{ background: "var(--muted)", color: "var(--foreground)" }}>
                        {tipo?.codigo || "—"}
                      </span>
                    </td>
                    <td>
                      {status ? (
                        <span className="status-badge" style={{ background: `${status.cor}20`, color: status.cor }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.cor }} />
                          {status.nome}
                        </span>
                      ) : "—"}
                    </td>
                    <td>
                      <div className="text-sm font-medium truncate max-w-36" style={{ color: "var(--foreground)" }}>
                        {nota.emitenteNome}
                      </div>
                      <div className="mono text-xs" style={{ color: "var(--muted-foreground)" }}>{nota.emitenteCnpj}</div>
                    </td>
                    <td>
                      <div className="text-sm truncate max-w-36" style={{ color: "var(--foreground)" }}>
                        {nota.destinatarioNome || "—"}
                      </div>
                      {nota.destinatarioCnpjCpf && (
                        <div className="mono text-xs" style={{ color: "var(--muted-foreground)" }}>{nota.destinatarioCnpjCpf}</div>
                      )}
                    </td>
                    <td className="mono text-xs">{fmtData(nota.dataEmissao)}</td>
                    <td className="mono font-medium" style={{ color: "var(--foreground)" }}>
                      {fmtMoeda(nota.valorTotal)}
                    </td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${nota.origem === "xml" ? "text-blue-700 bg-blue-50" : "text-gray-600 bg-gray-100"}`}>
                        {nota.origem === "xml" ? "XML" : "Manual"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded hover:bg-gray-100" title="Ver detalhes"
                          style={{ color: "var(--muted-foreground)" }}>
                          <Eye className="w-4 h-4" />
                        </button>
                        {canDelete && (
                          <button
                            className="p-1.5 rounded hover:bg-red-50"
                            title="Excluir"
                            style={{ color: "var(--destructive)" }}
                            onClick={() => {
                              if (confirm(`Excluir nota ${nota.numero}?`)) {
                                deleteMutation.mutate({ id: nota.id });
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
            <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded border text-sm disabled:opacity-40"
                style={{ borderColor: "var(--border)" }}
              >
                Anterior
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded border text-sm disabled:opacity-40"
                style={{ borderColor: "var(--border)" }}
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
