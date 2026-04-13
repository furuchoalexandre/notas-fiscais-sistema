import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ArrowLeft, FileText, Edit3, Save, X, Download,
  Building2, User, Calendar, Hash, DollarSign, FileCheck,
  MapPin, Tag, Clock, Info, ExternalLink
} from "lucide-react";

function fmtMoeda(v: string | number | null | undefined) {
  if (v === null || v === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}
function fmtData(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR");
}
function fmtCnpj(v: string | null | undefined) {
  if (!v) return "—";
  const n = v.replace(/\D/g, "");
  if (n.length === 14) return n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  if (n.length === 11) return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  return v;
}

interface Props { params: { id: string } }

export default function DetalhesNota({ params }: Props) {
  const id = parseInt(params.id, 10);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);

  const { data, isLoading, refetch } = trpc.notas.get.useQuery({ id }, { enabled: !isNaN(id) });
  const { data: statusList } = trpc.status.list.useQuery();
  const { data: perms } = trpc.auth.myPermissions.useQuery();

  const isAdmin = user?.role === "admin";
  const canEdit = isAdmin || (perms as Record<string, unknown> | null | undefined)?.canEditNota === true;
  const canDelete = isAdmin || (perms as Record<string, unknown> | null | undefined)?.canDeleteNota === true;

  const nota = data?.nota;
  const tipo = data?.tipo;
  const status = data?.status;

  // Form state
  const [statusId, setStatusId] = useState<number | "">("");
  const [destinatarioCnpjCpf, setDestinatarioCnpjCpf] = useState("");
  const [destinatarioNome, setDestinatarioNome] = useState("");
  const [dataEntradaSaida, setDataEntradaSaida] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (nota) {
      setStatusId(nota.statusId ?? "");
      setDestinatarioCnpjCpf(nota.destinatarioCnpjCpf ?? "");
      setDestinatarioNome(nota.destinatarioNome ?? "");
      setDataEntradaSaida(
        nota.dataEntradaSaida
          ? new Date(nota.dataEntradaSaida).toISOString().slice(0, 16)
          : ""
      );
      setObservacoes(nota.observacoes ?? "");
    }
  }, [nota]);

  const updateMutation = trpc.notas.update.useMutation({
    onSuccess: () => {
      toast.success("Nota atualizada com sucesso!");
      setEditing(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.notas.delete.useMutation({
    onSuccess: () => {
      toast.success("Nota excluída com sucesso!");
      navigate("/notas");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    updateMutation.mutate({
      id,
      statusId: statusId !== "" ? Number(statusId) : undefined,
      destinatarioCnpjCpf: destinatarioCnpjCpf || undefined,
      destinatarioNome: destinatarioNome || undefined,
      dataEntradaSaida: dataEntradaSaida || undefined,
      observacoes: observacoes || undefined,
    });
  };

  const handleDelete = () => {
    if (confirm(`Tem certeza que deseja excluir a nota ${nota?.numero}? Esta ação não pode ser desfeita.`)) {
      deleteMutation.mutate({ id });
    }
  };

  if (isNaN(id)) {
    return (
      <AppLayout title="Nota não encontrada">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <FileText className="w-12 h-12" style={{ color: "var(--muted-foreground)" }} />
          <p style={{ color: "var(--muted-foreground)" }}>ID de nota inválido.</p>
          <Link href="/notas">
            <button className="btn-secondary flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Voltar para Notas
            </button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout title="Carregando...">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--primary)" }} />
        </div>
      </AppLayout>
    );
  }

  if (!nota) {
    return (
      <AppLayout title="Nota não encontrada">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <FileText className="w-12 h-12" style={{ color: "var(--muted-foreground)" }} />
          <p style={{ color: "var(--muted-foreground)" }}>Nota não encontrada.</p>
          <Link href="/notas">
            <button className="btn-secondary flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Voltar para Notas
            </button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const tipoLabel = tipo?.nome ?? tipo?.codigo ?? "—";
  const statusLabel = status?.nome ?? "Sem status";
  const statusCor = status?.cor ?? "#94a3b8";

  return (
    <AppLayout title={`Nota ${nota.numero}`}>
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/notas">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Voltar">
              <ArrowLeft className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
                {tipoLabel} — Nº {nota.numero}
              </h1>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: statusCor + "22", color: statusCor, border: `1px solid ${statusCor}44` }}
              >
                {statusLabel}
              </span>
            </div>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Emitida em {fmtData(nota.dataEmissao)} · Origem: {nota.origem === "xml" ? "XML" : "Manual"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {nota.xmlUrl && (
            <a href={nota.xmlUrl} target="_blank" rel="noopener noreferrer">
              <button className="btn-secondary flex items-center gap-2 text-sm">
                <Download className="w-4 h-4" /> Baixar XML
              </button>
            </a>
          )}
          {canEdit && !editing && (
            <button
              className="btn-primary flex items-center gap-2 text-sm"
              onClick={() => setEditing(true)}
            >
              <Edit3 className="w-4 h-4" /> Editar
            </button>
          )}
          {editing && (
            <>
              <button
                className="btn-secondary flex items-center gap-2 text-sm"
                onClick={() => { setEditing(false); }}
              >
                <X className="w-4 h-4" /> Cancelar
              </button>
              <button
                className="btn-primary flex items-center gap-2 text-sm"
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                <Save className="w-4 h-4" />
                {updateMutation.isPending ? "Salvando..." : "Salvar"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Coluna principal */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Dados do Emitente */}
          <div className="card">
            <div className="card-header">
              <Building2 className="w-4 h-4" style={{ color: "var(--primary)" }} />
              <h2 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Emitente</h2>
            </div>
            <div className="card-body grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Razão Social / Nome</label>
                <p className="field-value">{nota.emitenteNome}</p>
              </div>
              <div>
                <label className="field-label">CNPJ / CPF</label>
                <p className="field-value mono">{fmtCnpj(nota.emitenteCnpj)}</p>
              </div>
              {nota.emitenteUf && (
                <div>
                  <label className="field-label">UF</label>
                  <p className="field-value">{nota.emitenteUf}</p>
                </div>
              )}
            </div>
          </div>

          {/* Dados do Destinatário */}
          <div className="card">
            <div className="card-header">
              <User className="w-4 h-4" style={{ color: "var(--primary)" }} />
              <h2 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Destinatário</h2>
              {editing && <span className="text-xs ml-auto" style={{ color: "var(--muted-foreground)" }}>Editável</span>}
            </div>
            <div className="card-body grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Razão Social / Nome</label>
                {editing ? (
                  <input
                    className="field-input"
                    value={destinatarioNome}
                    onChange={e => setDestinatarioNome(e.target.value)}
                    placeholder="Nome do destinatário"
                  />
                ) : (
                  <p className="field-value">{nota.destinatarioNome || "—"}</p>
                )}
              </div>
              <div>
                <label className="field-label">CNPJ / CPF</label>
                {editing ? (
                  <input
                    className="field-input mono"
                    value={destinatarioCnpjCpf}
                    onChange={e => setDestinatarioCnpjCpf(e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                ) : (
                  <p className="field-value mono">{fmtCnpj(nota.destinatarioCnpjCpf)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Valores */}
          <div className="card">
            <div className="card-header">
              <DollarSign className="w-4 h-4" style={{ color: "var(--primary)" }} />
              <h2 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Valores</h2>
            </div>
            <div className="card-body grid grid-cols-3 gap-3">
              <div>
                <label className="field-label">Valor Total</label>
                <p className="field-value font-bold text-base" style={{ color: "var(--primary)" }}>
                  {fmtMoeda(nota.valorTotal)}
                </p>
              </div>
              <div>
                <label className="field-label">Desconto</label>
                <p className="field-value">{fmtMoeda(nota.valorDesconto)}</p>
              </div>
              <div>
                <label className="field-label">Impostos</label>
                <p className="field-value">{fmtMoeda(nota.valorImpostos)}</p>
              </div>
            </div>
          </div>

          {/* Datas */}
          <div className="card">
            <div className="card-header">
              <Calendar className="w-4 h-4" style={{ color: "var(--primary)" }} />
              <h2 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Datas</h2>
            </div>
            <div className="card-body grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Data de Emissão</label>
                <p className="field-value">{fmtData(nota.dataEmissao)}</p>
              </div>
              <div>
                <label className="field-label">Data de Entrada / Saída</label>
                {editing ? (
                  <input
                    type="datetime-local"
                    className="field-input"
                    value={dataEntradaSaida}
                    onChange={e => setDataEntradaSaida(e.target.value)}
                  />
                ) : (
                  <p className="field-value">{fmtData(nota.dataEntradaSaida)}</p>
                )}
              </div>
              <div>
                <label className="field-label">Criado em</label>
                <p className="field-value">{fmtData(nota.createdAt)}</p>
              </div>
              <div>
                <label className="field-label">Última atualização</label>
                <p className="field-value">{fmtData(nota.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* Chave de Acesso */}
          {nota.chaveAcesso && (
            <div className="card">
              <div className="card-header">
                <FileCheck className="w-4 h-4" style={{ color: "var(--primary)" }} />
                <h2 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Chave de Acesso</h2>
              </div>
              <div className="card-body">
                <p className="mono text-xs break-all" style={{ color: "var(--foreground)" }}>{nota.chaveAcesso}</p>
                <a
                  href={`https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=completa&nfe=${nota.chaveAcesso}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs mt-2"
                  style={{ color: "var(--primary)" }}
                >
                  <ExternalLink className="w-3 h-3" /> Consultar na SEFAZ
                </a>
              </div>
            </div>
          )}

          {/* Observações */}
          <div className="card">
            <div className="card-header">
              <Info className="w-4 h-4" style={{ color: "var(--primary)" }} />
              <h2 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Observações</h2>
              {editing && <span className="text-xs ml-auto" style={{ color: "var(--muted-foreground)" }}>Editável</span>}
            </div>
            <div className="card-body">
              {editing ? (
                <textarea
                  className="field-input w-full"
                  rows={4}
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  placeholder="Observações internas sobre esta nota..."
                />
              ) : (
                <p className="text-sm" style={{ color: nota.observacoes ? "var(--foreground)" : "var(--muted-foreground)" }}>
                  {nota.observacoes || "Nenhuma observação registrada."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Coluna lateral */}
        <div className="flex flex-col gap-4">

          {/* Status */}
          <div className="card">
            <div className="card-header">
              <Tag className="w-4 h-4" style={{ color: "var(--primary)" }} />
              <h2 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Status</h2>
              {editing && <span className="text-xs ml-auto" style={{ color: "var(--muted-foreground)" }}>Editável</span>}
            </div>
            <div className="card-body">
              {editing ? (
                <select
                  className="field-input w-full"
                  value={statusId}
                  onChange={e => setStatusId(e.target.value === "" ? "" : Number(e.target.value))}
                >
                  <option value="">Sem status</option>
                  {statusList?.map(s => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: statusCor }}
                  />
                  <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{statusLabel}</span>
                </div>
              )}
            </div>
          </div>

          {/* Identificação */}
          <div className="card">
            <div className="card-header">
              <Hash className="w-4 h-4" style={{ color: "var(--primary)" }} />
              <h2 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Identificação</h2>
            </div>
            <div className="card-body flex flex-col gap-3">
              <div>
                <label className="field-label">Tipo</label>
                <p className="field-value">{tipoLabel}</p>
              </div>
              <div>
                <label className="field-label">Número</label>
                <p className="field-value mono">{nota.numero}</p>
              </div>
              <div>
                <label className="field-label">Série</label>
                <p className="field-value mono">{nota.serie}</p>
              </div>
              <div>
                <label className="field-label">ID interno</label>
                <p className="field-value mono text-xs">{nota.id}</p>
              </div>
            </div>
          </div>

          {/* Arquivo XML */}
          {(nota.xmlUrl || nota.xmlNomeArquivo) && (
            <div className="card">
              <div className="card-header">
                <FileText className="w-4 h-4" style={{ color: "var(--primary)" }} />
                <h2 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Arquivo XML</h2>
              </div>
              <div className="card-body flex flex-col gap-2">
                {nota.xmlNomeArquivo && (
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{nota.xmlNomeArquivo}</p>
                )}
                {nota.xmlUrl && (
                  <a href={nota.xmlUrl} target="_blank" rel="noopener noreferrer">
                    <button className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
                      <Download className="w-4 h-4" /> Baixar XML
                    </button>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Ações perigosas */}
          {canDelete && (
            <div className="card border-red-100">
              <div className="card-header">
                <h2 className="font-semibold text-sm text-red-600">Zona de Perigo</h2>
              </div>
              <div className="card-body">
                <button
                  className="w-full text-sm px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Excluindo..." : "Excluir esta nota"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
