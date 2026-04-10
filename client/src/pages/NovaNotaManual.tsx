import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { ArrowLeft, AlertTriangle, Save } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function NovaNotaManual() {
  const [, navigate] = useLocation();
  const { data: tipos } = trpc.tipos.list.useQuery();
  const { data: statusList } = trpc.status.list.useQuery();

  const [form, setForm] = useState({
    numero: "", serie: "1", tipoId: "", statusId: "",
    emitenteCnpj: "", emitenteNome: "", emitenteUf: "",
    destinatarioCnpjCpf: "", destinatarioNome: "",
    valorTotal: "", valorDesconto: "0", valorImpostos: "0",
    dataEmissao: "", dataEntradaSaida: "",
    chaveAcesso: "", observacoes: "",
  });

  const [dupWarning, setDupWarning] = useState(false);

  const utils = trpc.useUtils();

  const checkDup = trpc.notas.checkDuplicate.useQuery(
    {
      numero: form.numero,
      serie: form.serie,
      emitenteCnpj: form.emitenteCnpj,
      tipoId: Number(form.tipoId),
      chaveAcesso: form.chaveAcesso || undefined,
    },
    {
      enabled: !!(form.numero && form.serie && form.emitenteCnpj && form.tipoId),
      refetchOnWindowFocus: false,
    }
  );

  const createMutation = trpc.notas.create.useMutation({
    onSuccess: () => {
      toast.success("Nota cadastrada com sucesso!");
      utils.notas.list.invalidate();
      navigate("/notas");
    },
    onError: (e) => toast.error(e.message),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.numero || !form.tipoId || !form.emitenteCnpj || !form.emitenteNome || !form.valorTotal || !form.dataEmissao) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    createMutation.mutate({
      ...form,
      tipoId: Number(form.tipoId),
      statusId: form.statusId !== "" ? Number(form.statusId) : undefined,
    });
  };

  const isDup = checkDup.data?.isDuplicate;

  return (
    <AppLayout title="Nova Nota Manual">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/notas">
            <button className="p-1.5 rounded hover:bg-gray-100" style={{ color: "var(--muted-foreground)" }}>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Nova Nota Manual</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Preencha os dados da nota fiscal manualmente
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
        {/* Aviso duplicata */}
        {isDup && (
          <div className="duplicate-warning">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              <strong>Atenção:</strong> Já existe uma nota com este número, série, CNPJ e tipo cadastrada no sistema.
            </span>
          </div>
        )}

        {/* Identificação */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-semibold text-sm mb-4" style={{ color: "var(--foreground)" }}>Identificação da Nota</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Número *</label>
              <input type="text" value={form.numero} onChange={e => set("numero", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                style={{ borderColor: "var(--border)", background: "var(--background)" }} />
            </div>
            <div>
              <label className="form-label">Série *</label>
              <input type="text" value={form.serie} onChange={e => set("serie", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                style={{ borderColor: "var(--border)", background: "var(--background)" }} />
            </div>
            <div>
              <label className="form-label">Tipo *</label>
              <select value={form.tipoId} onChange={e => set("tipoId", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                style={{ borderColor: "var(--border)", background: "var(--background)" }}>
                <option value="">Selecione...</option>
                {tipos?.filter(t => t.ativo).map(t => <option key={t.id} value={t.id}>{t.codigo} — {t.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Status <span className="text-xs font-normal" style={{ color: "var(--muted-foreground)" }}>(opcional)</span></label>
              <select value={form.statusId} onChange={e => set("statusId", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                style={{ borderColor: "var(--border)", background: "var(--background)" }}>
                <option value="">Sem status (definir depois)</option>
                {statusList?.filter(s => s.ativo).map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="form-label">Chave de Acesso (44 dígitos)</label>
            <input type="text" value={form.chaveAcesso} onChange={e => set("chaveAcesso", e.target.value)}
              maxLength={60} placeholder="Opcional para notas manuais"
              className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none mono"
              style={{ borderColor: "var(--border)", background: "var(--background)" }} />
          </div>
        </div>

        {/* Emitente */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-semibold text-sm mb-4" style={{ color: "var(--foreground)" }}>Emitente</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">CNPJ *</label>
              <input type="text" value={form.emitenteCnpj} onChange={e => set("emitenteCnpj", e.target.value)}
                placeholder="00.000.000/0000-00"
                className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none mono"
                style={{ borderColor: "var(--border)", background: "var(--background)" }} />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Razão Social *</label>
              <input type="text" value={form.emitenteNome} onChange={e => set("emitenteNome", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                style={{ borderColor: "var(--border)", background: "var(--background)" }} />
            </div>
            <div>
              <label className="form-label">UF</label>
              <input type="text" value={form.emitenteUf} onChange={e => set("emitenteUf", e.target.value.toUpperCase())}
                maxLength={2} placeholder="SP"
                className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none mono"
                style={{ borderColor: "var(--border)", background: "var(--background)" }} />
            </div>
          </div>
        </div>

        {/* Destinatário */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-semibold text-sm mb-4" style={{ color: "var(--foreground)" }}>Destinatário (opcional)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">CNPJ / CPF</label>
              <input type="text" value={form.destinatarioCnpjCpf} onChange={e => set("destinatarioCnpjCpf", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none mono"
                style={{ borderColor: "var(--border)", background: "var(--background)" }} />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Nome / Razão Social</label>
              <input type="text" value={form.destinatarioNome} onChange={e => set("destinatarioNome", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                style={{ borderColor: "var(--border)", background: "var(--background)" }} />
            </div>
          </div>
        </div>

        {/* Valores e Datas */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-semibold text-sm mb-4" style={{ color: "var(--foreground)" }}>Valores e Datas</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Valor Total (R$) *</label>
              <input type="number" step="0.01" min="0" value={form.valorTotal} onChange={e => set("valorTotal", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none mono"
                style={{ borderColor: "var(--border)", background: "var(--background)" }} />
            </div>
            <div>
              <label className="form-label">Desconto (R$)</label>
              <input type="number" step="0.01" min="0" value={form.valorDesconto} onChange={e => set("valorDesconto", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none mono"
                style={{ borderColor: "var(--border)", background: "var(--background)" }} />
            </div>
            <div>
              <label className="form-label">Impostos (R$)</label>
              <input type="number" step="0.01" min="0" value={form.valorImpostos} onChange={e => set("valorImpostos", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none mono"
                style={{ borderColor: "var(--border)", background: "var(--background)" }} />
            </div>
            <div>
              <label className="form-label">Data de Emissão *</label>
              <input type="datetime-local" value={form.dataEmissao} onChange={e => set("dataEmissao", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                style={{ borderColor: "var(--border)", background: "var(--background)" }} />
            </div>
            <div>
              <label className="form-label">Data Entrada/Saída</label>
              <input type="datetime-local" value={form.dataEntradaSaida} onChange={e => set("dataEntradaSaida", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                style={{ borderColor: "var(--border)", background: "var(--background)" }} />
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "var(--border)" }}>
          <label className="form-label">Observações</label>
          <textarea value={form.observacoes} onChange={e => set("observacoes", e.target.value)}
            rows={3} placeholder="Informações adicionais sobre a nota..."
            className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none resize-none"
            style={{ borderColor: "var(--border)", background: "var(--background)" }} />
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <Link href="/notas">
            <button type="button" className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
              Cancelar
            </button>
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending || isDup === true}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ background: "var(--primary)" }}
          >
            {createMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar Nota
          </button>
        </div>
      </form>
    </AppLayout>
  );
}
