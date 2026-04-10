import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";

const CORES = ["#6b7280","#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4","#84cc16","#f97316"];

export default function GerenciarStatus() {
  const { data: statusList, refetch } = trpc.status.list.useQuery();
  const [editId, setEditId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ nome: "", descricao: "", cor: "#6b7280", ordem: 0 });
  const [editForm, setEditForm] = useState({ nome: "", descricao: "", cor: "#6b7280", ordem: 0, ativo: true });

  const createMut = trpc.status.create.useMutation({ onSuccess: () => { toast.success("Status criado!"); refetch(); setShowNew(false); setForm({ nome: "", descricao: "", cor: "#6b7280", ordem: 0 }); }, onError: e => toast.error(e.message) });
  const updateMut = trpc.status.update.useMutation({ onSuccess: () => { toast.success("Status atualizado!"); refetch(); setEditId(null); }, onError: e => toast.error(e.message) });
  const deleteMut = trpc.status.delete.useMutation({ onSuccess: () => { toast.success("Status excluído!"); refetch(); }, onError: e => toast.error(e.message) });

  const startEdit = (s: NonNullable<typeof statusList>[0]) => {
    setEditId(s.id);
    setEditForm({ nome: s.nome, descricao: s.descricao || "", cor: s.cor || "#6b7280", ordem: s.ordem || 0, ativo: s.ativo ?? true });
  };

  return (
    <AppLayout title="Status de Nota">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Status de Nota</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>Gerencie os status disponíveis para as notas fiscais</p>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "var(--primary)" }}>
          <Plus className="w-4 h-4" /> Novo Status
        </button>
      </div>

      <div className="max-w-2xl space-y-3">
        {/* Novo */}
        {showNew && (
          <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: "var(--primary)" }}>
            <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--foreground)" }}>Novo Status</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="form-label">Nome *</label>
                <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border)" }} />
              </div>
              <div>
                <label className="form-label">Ordem</label>
                <input type="number" value={form.ordem} onChange={e => setForm(f => ({ ...f, ordem: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border)" }} />
              </div>
              <div className="col-span-2">
                <label className="form-label">Descrição</label>
                <input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border)" }} />
              </div>
              <div className="col-span-2">
                <label className="form-label">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {CORES.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, cor: c }))} className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110" style={{ background: c, borderColor: form.cor === c ? "var(--foreground)" : "transparent" }} />
                  ))}
                  <input type="color" value={form.cor} onChange={e => setForm(f => ({ ...f, cor: e.target.value }))} className="w-7 h-7 rounded cursor-pointer border" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => createMut.mutate(form)} disabled={!form.nome || createMut.isPending} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ background: "var(--primary)" }}>
                <Check className="w-4 h-4" /> Salvar
              </button>
              <button onClick={() => setShowNew(false)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border hover:bg-gray-50" style={{ borderColor: "var(--border)" }}>
                <X className="w-4 h-4" /> Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Lista */}
        {statusList?.map(s => (
          <div key={s.id} className="bg-white rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
            {editId === s.id ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="form-label">Nome *</label>
                    <input value={editForm.nome} onChange={e => setEditForm(f => ({ ...f, nome: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border)" }} />
                  </div>
                  <div>
                    <label className="form-label">Ordem</label>
                    <input type="number" value={editForm.ordem} onChange={e => setEditForm(f => ({ ...f, ordem: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border)" }} />
                  </div>
                  <div className="col-span-2">
                    <label className="form-label">Descrição</label>
                    <input value={editForm.descricao} onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border)" }} />
                  </div>
                  <div>
                    <label className="form-label">Cor</label>
                    <div className="flex gap-2 flex-wrap">
                      {CORES.map(c => (
                        <button key={c} onClick={() => setEditForm(f => ({ ...f, cor: c }))} className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110" style={{ background: c, borderColor: editForm.cor === c ? "var(--foreground)" : "transparent" }} />
                      ))}
                      <input type="color" value={editForm.cor} onChange={e => setEditForm(f => ({ ...f, cor: e.target.value }))} className="w-7 h-7 rounded cursor-pointer border" />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editForm.ativo} onChange={e => setEditForm(f => ({ ...f, ativo: e.target.checked }))} />
                      <span className="text-sm">Ativo</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => updateMut.mutate({ id: s.id, ...editForm })} disabled={!editForm.nome || updateMut.isPending} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ background: "var(--primary)" }}>
                    <Check className="w-4 h-4" /> Salvar
                  </button>
                  <button onClick={() => setEditId(null)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border hover:bg-gray-50" style={{ borderColor: "var(--border)" }}>
                    <X className="w-4 h-4" /> Cancelar
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: s.cor || "#6b7280" }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{s.nome}</span>
                    {!s.ativo && <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">Inativo</span>}
                    {s.ordem !== null && s.ordem !== undefined && <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Ordem: {s.ordem}</span>}
                  </div>
                  {s.descricao && <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{s.descricao}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(s)} className="p-1.5 rounded hover:bg-gray-100" style={{ color: "var(--muted-foreground)" }}><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => { if (confirm(`Excluir status "${s.nome}"?`)) deleteMut.mutate({ id: s.id }); }} className="p-1.5 rounded hover:bg-red-50" style={{ color: "var(--destructive)" }}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        ))}

        {statusList?.length === 0 && !showNew && (
          <div className="text-center py-12 bg-white rounded-xl border" style={{ borderColor: "var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhum status cadastrado. Clique em "Novo Status" para começar.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
