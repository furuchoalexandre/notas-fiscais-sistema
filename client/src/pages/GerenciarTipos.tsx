import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function GerenciarTipos() {
  const { data: tipos, refetch } = trpc.tipos.list.useQuery();
  const [editId, setEditId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ codigo: "", nome: "", descricao: "" });
  const [editForm, setEditForm] = useState({ codigo: "", nome: "", descricao: "", ativo: true });

  const createMut = trpc.tipos.create.useMutation({ onSuccess: () => { toast.success("Tipo criado!"); refetch(); setShowNew(false); setForm({ codigo: "", nome: "", descricao: "" }); }, onError: e => toast.error(e.message) });
  const updateMut = trpc.tipos.update.useMutation({ onSuccess: () => { toast.success("Tipo atualizado!"); refetch(); setEditId(null); }, onError: e => toast.error(e.message) });
  const deleteMut = trpc.tipos.delete.useMutation({ onSuccess: () => { toast.success("Tipo excluído!"); refetch(); }, onError: e => toast.error(e.message) });

  const startEdit = (t: NonNullable<typeof tipos>[0]) => {
    setEditId(t.id);
    setEditForm({ codigo: t.codigo, nome: t.nome, descricao: t.descricao || "", ativo: t.ativo ?? true });
  };

  const SUGESTOES = [
    { codigo: "NF-e", nome: "Nota Fiscal Eletrônica", descricao: "Nota fiscal de produto/mercadoria" },
    { codigo: "NFS-e", nome: "Nota Fiscal de Serviço Eletrônica", descricao: "Nota fiscal de prestação de serviço" },
    { codigo: "CT-e", nome: "Conhecimento de Transporte Eletrônico", descricao: "Documento de transporte de carga" },
  ];

  const codigosExistentes = tipos?.map(t => t.codigo) || [];

  return (
    <AppLayout title="Tipos de Nota">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Tipos de Nota</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>Gerencie os tipos de nota fiscal disponíveis no sistema</p>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "var(--primary)" }}>
          <Plus className="w-4 h-4" /> Novo Tipo
        </button>
      </div>

      <div className="max-w-2xl">
        {/* Sugestões */}
        {codigosExistentes.length < 3 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
            <p className="text-sm font-medium text-blue-800 mb-2">Tipos sugeridos para importação de XML:</p>
            <div className="flex flex-wrap gap-2">
              {SUGESTOES.filter(s => !codigosExistentes.includes(s.codigo)).map(s => (
                <button key={s.codigo} onClick={() => createMut.mutate({ codigo: s.codigo, nome: s.nome, descricao: s.descricao })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-blue-200 text-blue-700 hover:bg-blue-100">
                  <Plus className="w-3.5 h-3.5" /> {s.codigo}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {/* Novo */}
          {showNew && (
            <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "var(--primary)" }}>
              <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--foreground)" }}>Novo Tipo</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="form-label">Código *</label>
                  <input value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value.toUpperCase() }))}
                    placeholder="Ex: NF-e, CT-e..."
                    className="w-full px-3 py-2 rounded-lg border text-sm mono" style={{ borderColor: "var(--border)" }} />
                </div>
                <div>
                  <label className="form-label">Nome *</label>
                  <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border)" }} />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Descrição</label>
                  <input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border)" }} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => createMut.mutate({ codigo: form.codigo, nome: form.nome, descricao: form.descricao })} disabled={!form.codigo || !form.nome || createMut.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ background: "var(--primary)" }}>
                  <Check className="w-4 h-4" /> Salvar
                </button>
                <button onClick={() => setShowNew(false)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border hover:bg-gray-50" style={{ borderColor: "var(--border)" }}>
                  <X className="w-4 h-4" /> Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Lista */}
          {tipos?.map(t => (
            <div key={t.id} className="bg-white rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
              {editId === t.id ? (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="form-label">Código *</label>
                      <input value={editForm.codigo} onChange={e => setEditForm(f => ({ ...f, codigo: e.target.value.toUpperCase() }))}
                        className="w-full px-3 py-2 rounded-lg border text-sm mono" style={{ borderColor: "var(--border)" }} />
                    </div>
                    <div>
                      <label className="form-label">Nome *</label>
                      <input value={editForm.nome} onChange={e => setEditForm(f => ({ ...f, nome: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border)" }} />
                    </div>
                    <div>
                      <label className="form-label">Descrição</label>
                      <input value={editForm.descricao} onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border)" }} />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={editForm.ativo} onChange={e => setEditForm(f => ({ ...f, ativo: e.target.checked }))} />
                        <span className="text-sm">Ativo</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateMut.mutate({ id: t.id, ...editForm })} disabled={!editForm.codigo || !editForm.nome || updateMut.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ background: "var(--primary)" }}>
                      <Check className="w-4 h-4" /> Salvar
                    </button>
                    <button onClick={() => setEditId(null)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border hover:bg-gray-50" style={{ borderColor: "var(--border)" }}>
                      <X className="w-4 h-4" /> Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="mono font-bold text-sm px-2 py-0.5 rounded" style={{ background: "var(--muted)", color: "var(--primary)" }}>{t.codigo}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{t.nome}</span>
                      {!t.ativo && <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">Inativo</span>}
                    </div>
                    {t.descricao && <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{t.descricao}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(t)} className="p-1.5 rounded hover:bg-gray-100" style={{ color: "var(--muted-foreground)" }}><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => { if (confirm(`Excluir tipo "${t.codigo}"?`)) deleteMut.mutate({ id: t.id }); }} className="p-1.5 rounded hover:bg-red-50" style={{ color: "var(--destructive)" }}><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {tipos?.length === 0 && !showNew && (
            <div className="text-center py-12 bg-white rounded-xl border" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhum tipo cadastrado. Use as sugestões acima ou clique em "Novo Tipo".</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
