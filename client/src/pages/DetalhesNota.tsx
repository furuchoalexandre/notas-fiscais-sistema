import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ArrowLeft, ExternalLink, Trash2, X, Plus, Minus, Clock, User
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtMoeda(v: string | number | null | undefined) {
  if (v === null || v === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}
function fmtData(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR");
}
function fmtDataCurta(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}
function fmtCnpj(v: string | null | undefined) {
  if (!v) return "—";
  const n = v.replace(/\D/g, "");
  if (n.length === 14) return n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  if (n.length === 11) return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  return v;
}
function toInputDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}
function labelFormaPagamento(f: string | null | undefined) {
  if (f === "boleto") return "Boleto";
  if (f === "ted") return "TED";
  if (f === "avista") return "À Vista";
  return "—";
}

// ─── Campo de detalhe ─────────────────────────────────────────────────────────
function Campo({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
        {label}
      </span>
      <span className="text-sm" style={{ color: "var(--foreground)" }}>{value || "—"}</span>
    </div>
  );
}

// ─── Modal de Edição ─────────────────────────────────────────────────────────
interface EditModalProps {
  nota: Record<string, unknown>;
  statusList: Array<{ id: number; nome: string; cor: string }>;
  onClose: () => void;
  onSaved: () => void;
  notaId: number;
}

function EditModal({ nota, statusList, onClose, onSaved, notaId }: EditModalProps) {
  const [statusId, setStatusId] = useState<string>(nota.statusId ? String(nota.statusId) : "");
  const [observacoes, setObservacoes] = useState<string>((nota.observacoes as string) || "");
  const [dataEntradaSaida, setDataEntradaSaida] = useState<string>(toInputDate(nota.dataEntradaSaida as Date));
  const [numeroContrato, setNumeroContrato] = useState<string>((nota.numeroContrato as string) || "");
  const [numeroPedido, setNumeroPedido] = useState<string>((nota.numeroPedido as string) || "");
  const [dataPedido, setDataPedido] = useState<string>(toInputDate(nota.dataPedido as Date));
  const [numeroOC, setNumeroOC] = useState<string>((nota.numeroOC as string) || "");
  const [dataOC, setDataOC] = useState<string>(toInputDate(nota.dataOC as Date));
  const [dataTriagem, setDataTriagem] = useState<string>(toInputDate(nota.dataTriagem as Date));
  const [dataVencimento, setDataVencimento] = useState<string>(toInputDate(nota.dataVencimento as Date));
  const [formaPagamento, setFormaPagamento] = useState<string>((nota.formaPagamento as string) || "");
  const [numParcelas, setNumParcelas] = useState<number>(() => {
    const p = nota.parcelas as string[] | null;
    return p && p.length > 0 ? p.length : 1;
  });
  const [parcelas, setParcelas] = useState<string[]>(() => {
    const p = nota.parcelas as string[] | null;
    if (p && p.length > 0) return p.map(d => toInputDate(d));
    return [""];
  });

  const updateMutation = trpc.notas.update.useMutation({
    onSuccess: () => {
      toast.success("Nota atualizada com sucesso!");
      onSaved();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleParcelaChange = (idx: number, val: string) => {
    setParcelas(prev => prev.map((p, i) => i === idx ? val : p));
  };

  const handleNumParcelasChange = (n: number) => {
    const clamped = Math.max(1, Math.min(48, n));
    setNumParcelas(clamped);
    setParcelas(prev => {
      const arr = [...prev];
      while (arr.length < clamped) arr.push("");
      return arr.slice(0, clamped);
    });
  };

  const handleSave = () => {
    const parcelasValidas = (formaPagamento === "boleto" || formaPagamento === "ted")
      ? parcelas.filter(Boolean).map(d => new Date(d).toISOString())
      : null;

    updateMutation.mutate({
      id: notaId,
      statusId: statusId ? Number(statusId) : null,
      observacoes: observacoes || null,
      dataEntradaSaida: dataEntradaSaida || null,
      numeroContrato: numeroContrato || null,
      numeroPedido: numeroPedido || null,
      dataPedido: dataPedido || null,
      numeroOC: numeroOC || null,
      dataOC: dataOC || null,
      dataTriagem: dataTriagem || null,
      dataVencimento: dataVencimento || null,
      formaPagamento: (formaPagamento as "boleto" | "ted" | "avista") || null,
      parcelas: parcelasValidas,
    });
  };

  const showParcelas = formaPagamento === "boleto" || formaPagamento === "ted";

  const inputClass = "w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
          <h2 className="text-lg font-bold text-white">Editar Nota</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6">

          {/* Status */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">Status</h3>
            <select
              value={statusId}
              onChange={e => setStatusId(e.target.value)}
              className={inputClass}
            >
              <option value="">— Sem status —</option>
              {statusList.map(s => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </div>

          {/* Gestão */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">Gestão</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Número do Contrato</label>
                <input type="text" value={numeroContrato} onChange={e => setNumeroContrato(e.target.value)}
                  placeholder="Ex: CONT-2024-001" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Data de Entrada / Saída</label>
                <input type="date" value={dataEntradaSaida} onChange={e => setDataEntradaSaida(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Número do Pedido</label>
                <input type="text" value={numeroPedido} onChange={e => setNumeroPedido(e.target.value)}
                  placeholder="Ex: PED-2024-0042" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Data do Pedido</label>
                <input type="date" value={dataPedido} onChange={e => setDataPedido(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Número da Ordem de Compra</label>
                <input type="text" value={numeroOC} onChange={e => setNumeroOC(e.target.value)}
                  placeholder="Ex: OC-2024-0099" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Data da Ordem de Compra</label>
                <input type="date" value={dataOC} onChange={e => setDataOC(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Data da Triagem</label>
                <input type="date" value={dataTriagem} onChange={e => setDataTriagem(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Data de Vencimento</label>
                <input type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">Forma de Pagamento</h3>
            <div className="flex gap-3 flex-wrap">
              {[
                { value: "", label: "Não definido" },
                { value: "boleto", label: "Boleto" },
                { value: "ted", label: "TED" },
                { value: "avista", label: "À Vista" },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormaPagamento(opt.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    formaPagamento === opt.value
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Parcelas (Boleto ou TED) */}
            {showParcelas && (
              <div className="mt-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm text-gray-300">Número de parcelas:</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => handleNumParcelasChange(numParcelas - 1)}
                      className="w-7 h-7 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white">
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-white font-bold">{numParcelas}</span>
                    <button type="button" onClick={() => handleNumParcelasChange(numParcelas + 1)}
                      className="w-7 h-7 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {parcelas.map((p, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <label className="text-xs text-gray-400">Parcela {i + 1}</label>
                      <input type="date" value={p} onChange={e => handleParcelaChange(i, e.target.value)}
                        className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Observações */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">Observações</h3>
            <textarea
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              rows={3}
              placeholder="Adicione observações sobre esta nota..."
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-gray-700 sticky bottom-0 bg-gray-900">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={updateMutation.isPending}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-60">
            {updateMutation.isPending ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
interface Props { params: { id: string } }

export default function DetalhesNota({ params }: Props) {
  const id = parseInt(params.id, 10);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  // Modal abre automaticamente ao entrar na página
  const [showEditModal, setShowEditModal] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const { data, isLoading, refetch } = trpc.notas.get.useQuery({ id }, { enabled: !isNaN(id) });
  const { data: statusList } = trpc.status.list.useQuery();
  const { data: perms } = trpc.auth.myPermissions.useQuery();
  const { data: historico } = trpc.notas.historico.useQuery({ notaId: id }, { enabled: !isNaN(id) });

  const nota = data?.nota;
  const tipo = data?.tipo;
  const status = data?.status;

  const isAdmin = user?.role === "admin";
  const canEdit = isAdmin || (perms as Record<string, unknown> | null | undefined)?.canEditNota === true;
  const canDelete = isAdmin || (perms as Record<string, unknown> | null | undefined)?.canDeleteNota === true;

  // Abrir modal automaticamente quando os dados carregarem (apenas uma vez)
  useEffect(() => {
    if (nota && canEdit && !dataLoaded) {
      setDataLoaded(true);
      setShowEditModal(true);
    }
  }, [nota, canEdit, dataLoaded]);

  const deleteMutation = trpc.notas.delete.useMutation({
    onSuccess: () => {
      toast.success("Nota excluída com sucesso!");
      navigate("/notas");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleDelete = () => {
    if (confirm(`Tem certeza que deseja excluir a nota ${nota?.numero}? Esta ação não pode ser desfeita.`)) {
      deleteMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64" style={{ color: "var(--muted-foreground)" }}>
          Carregando...
        </div>
      </AppLayout>
    );
  }
  if (!nota) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p style={{ color: "var(--muted-foreground)" }}>Nota não encontrada.</p>
          <button onClick={() => navigate("/notas")} className="text-blue-400 hover:underline text-sm">
            Voltar para Notas
          </button>
        </div>
      </AppLayout>
    );
  }

  const parcelas = nota.parcelas as string[] | null;
  const statusCor = (status?.cor as string) ?? "#94a3b8";

  return (
    <AppLayout>
      {/* Modal de edição */}
      {showEditModal && (
        <EditModal
          nota={nota as Record<string, unknown>}
          statusList={(statusList || []) as Array<{ id: number; nome: string; cor: string }>}
          notaId={id}
          onClose={() => setShowEditModal(false)}
          onSaved={() => refetch()}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/notas")}
              className="p-2 rounded-lg transition-colors"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <ArrowLeft size={18} style={{ color: "var(--muted-foreground)" }} />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
                  {(tipo?.nome as string) || "Nota"} — Nº {nota.numero as string}
                </h1>
                {status && (
                  <span
                    className="px-3 py-0.5 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: statusCor + "33", color: statusCor, border: `1px solid ${statusCor}55` }}
                  >
                    {status.nome as string}
                  </span>
                )}
              </div>
              <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                Emitida em {fmtData(nota.dataEmissao as Date)} · Origem: {nota.origem === "xml" ? "XML" : "Manual"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                Editar
              </button>
            )}
          </div>
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Coluna esquerda (2/3) */}
          <div className="lg:col-span-2 space-y-4">

            {/* Emitente */}
            <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--primary)" }}>Emitente</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Campo label="Razão Social / Nome" value={nota.emitenteNome as string} />
                <Campo label="CNPJ / CPF" value={fmtCnpj(nota.emitenteCnpj as string)} />
                <Campo label="UF" value={nota.emitenteUf as string} />
              </div>
            </div>

            {/* Valores */}
            <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--primary)" }}>Valores</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>Valor Total</span>
                  <span className="text-lg font-bold text-green-500">{fmtMoeda(nota.valorTotal as string)}</span>
                </div>
                <Campo label="Desconto" value={fmtMoeda(nota.valorDesconto as string)} />
                <Campo label="Impostos" value={fmtMoeda(nota.valorImpostos as string)} />
              </div>
            </div>

            {/* Datas */}
            <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--primary)" }}>Datas</h2>
              <div className="grid grid-cols-2 gap-4">
                <Campo label="Data de Emissão" value={fmtData(nota.dataEmissao as Date)} />
                <Campo label="Data de Entrada / Saída" value={fmtData(nota.dataEntradaSaida as Date)} />
                <Campo label="Criado em" value={fmtData(nota.createdAt as Date)} />
                <Campo label="Última atualização" value={fmtData(nota.updatedAt as Date)} />
              </div>
            </div>

            {/* Chave de Acesso */}
            {nota.chaveAcesso && (
              <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--primary)" }}>Chave de Acesso</h2>
                <p className="text-xs font-mono break-all mb-2" style={{ color: "var(--foreground)" }}>{nota.chaveAcesso as string}</p>
                <a
                  href={`https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=completa&tipoConteudo=7PhJ+gAVw2g=&nfe=${nota.chaveAcesso}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-400 transition-colors"
                >
                  <ExternalLink size={12} />
                  Consultar na SEFAZ
                </a>
              </div>
            )}

            {/* Observações */}
            <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--primary)" }}>Observações</h2>
              <p className="text-sm" style={{ color: "var(--foreground)" }}>
                {(nota.observacoes as string) || "Nenhuma observação registrada."}
              </p>
            </div>
          </div>

          {/* Coluna direita (1/3) */}
          <div className="space-y-4">

            {/* Identificação */}
            <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--primary)" }}>Identificação</h2>
              <div className="space-y-3">
                <Campo label="Tipo" value={tipo?.nome as string} />
                <Campo label="Número" value={nota.numero as string} />
                <Campo label="Série" value={nota.serie as string} />
                <Campo label="ID interno" value={String(nota.id)} />
              </div>
            </div>

            {/* Gestão */}
            <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--primary)" }}>Gestão</h2>
              <div className="space-y-3">
                <Campo label="Nº Contrato" value={nota.numeroContrato as string} />
                <Campo label="Nº Pedido" value={nota.numeroPedido as string} />
                <Campo label="Data do Pedido" value={fmtDataCurta(nota.dataPedido as Date)} />
                <Campo label="Nº Ordem de Compra" value={nota.numeroOC as string} />
                <Campo label="Data da OC" value={fmtDataCurta(nota.dataOC as Date)} />
                <Campo label="Data da Triagem" value={fmtDataCurta(nota.dataTriagem as Date)} />
                <Campo label="Data de Vencimento" value={fmtDataCurta(nota.dataVencimento as Date)} />
                <Campo label="Forma de Pagamento" value={labelFormaPagamento(nota.formaPagamento as string)} />
              </div>
            </div>

            {/* Parcelas */}
            {parcelas && parcelas.length > 0 && (
              <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--primary)" }}>
                  Parcelas ({parcelas.length}x)
                </h2>
                <div className="space-y-1.5">
                  {parcelas.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span style={{ color: "var(--muted-foreground)" }}>Parcela {i + 1}</span>
                      <span style={{ color: "var(--foreground)" }}>{fmtDataCurta(p)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Arquivo XML */}
            {nota.xmlNomeArquivo && (
              <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--primary)" }}>Arquivo XML</h2>
                <p className="text-sm" style={{ color: "var(--foreground)" }}>{nota.xmlNomeArquivo as string}</p>
                {nota.xmlUrl && (
                  <a
                    href={nota.xmlUrl as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-400 mt-2 transition-colors"
                  >
                    <ExternalLink size={12} />
                    Baixar XML
                  </a>
                )}
              </div>
            )}

            {/* Histórico de Edições */}
            {historico && historico.length > 0 && (
              <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--primary)" }}>
                  Histórico de Edições
                </h2>
                <div className="space-y-3">
                  {historico.map((h) => (
                    <div key={h.id} className="flex gap-3 text-sm">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                          <User size={13} style={{ color: "var(--muted-foreground)" }} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold" style={{ color: "var(--foreground)" }}>
                            {h.userName || "Usuário desconhecido"}
                          </span>
                          {h.userEmail && (
                            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>({h.userEmail})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                          <Clock size={11} />
                          <span className="text-xs">{new Date(h.createdAt as Date).toLocaleString("pt-BR")}</span>
                        </div>
                        {h.camposAlterados && Object.keys(h.camposAlterados as Record<string, unknown>).length > 0 && (
                          <div className="mt-1.5 space-y-0.5">
                            {Object.entries(h.camposAlterados as Record<string, { de: unknown; para: unknown }>).map(([campo, val]) => (
                              <div key={campo} className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                                <span className="font-medium" style={{ color: "var(--foreground)" }}>{campo}:</span>{" "}
                                <span className="line-through opacity-60">{String(val.de ?? "—")}</span>
                                {" "}→{" "}
                                <span style={{ color: "var(--foreground)" }}>{String(val.para ?? "—")}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Zona de Perigo */}
            {canDelete && (
              <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid #7f1d1d55" }}>
                <h2 className="text-xs font-semibold uppercase tracking-widest mb-3 text-red-500">Zona de Perigo</h2>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-700 text-red-500 hover:bg-red-900/20 text-sm font-medium transition-colors disabled:opacity-60"
                >
                  <Trash2 size={14} />
                  {deleteMutation.isPending ? "Excluindo..." : "Excluir esta nota"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
