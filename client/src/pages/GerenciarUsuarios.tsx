import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Shield, ShieldCheck, Settings, Check, X, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PERMISSIONS = [
  { key: "canViewNotas", label: "Visualizar Notas", desc: "Ver lista e detalhes de notas fiscais" },
  { key: "canCreateNota", label: "Criar Nota Manual", desc: "Cadastrar notas manualmente" },
  { key: "canEditNota", label: "Editar Nota", desc: "Alterar status e dados de notas" },
  { key: "canDeleteNota", label: "Excluir Nota", desc: "Remover notas do sistema" },
  { key: "canImportXml", label: "Importar XML", desc: "Importar notas via arquivo XML" },
  { key: "canManageStatus", label: "Gerenciar Status", desc: "Criar, editar e excluir status" },
  { key: "canManageTipos", label: "Gerenciar Tipos", desc: "Criar, editar e excluir tipos de nota" },
  { key: "canManageUsers", label: "Gerenciar Usuários", desc: "Administrar usuários (admin only)" },
  { key: "canViewDashboard", label: "Ver Dashboard", desc: "Acessar o painel de estatísticas" },
];

const DEFAULT_PERMS = Object.fromEntries(PERMISSIONS.map(p => [p.key, false]));

export default function GerenciarUsuarios() {
  const { data: usuarios, refetch } = trpc.usuarios.list.useQuery();
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [permsForm, setPermsForm] = useState<Record<string, boolean>>(DEFAULT_PERMS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"user" | "admin">("user");

  const createUserMut = trpc.auth.createUser.useMutation({
    onSuccess: () => {
      toast.success("Usuário criado com sucesso!");
      setShowCreateModal(false);
      setNewName(""); setNewEmail(""); setNewPassword(""); setNewRole("user");
      refetch();
    },
    onError: e => toast.error(e.message),
  });

  const { data: userPerms } = trpc.usuarios.getPermissions.useQuery(
    { userId: editUserId! },
    { enabled: editUserId !== null }
  );

  const savePermsMut = trpc.usuarios.savePermissions.useMutation({
    onSuccess: () => { toast.success("Permissões salvas!"); setEditUserId(null); },
    onError: e => toast.error(e.message),
  });

  const updateRoleMut = trpc.usuarios.updateRole.useMutation({
    onSuccess: () => { toast.success("Perfil atualizado!"); refetch(); },
    onError: e => toast.error(e.message),
  });

  const openPerms = (userId: number) => {
    setEditUserId(userId);
    const p = userPerms as Record<string, unknown> | null | undefined;
    if (p) {
      setPermsForm(Object.fromEntries(PERMISSIONS.map(perm => [perm.key, p[perm.key] === true])));
    } else {
      setPermsForm(DEFAULT_PERMS);
    }
  };

  const handleSavePerms = () => {
    if (!editUserId) return;
    savePermsMut.mutate({
      userId: editUserId,
      canViewNotas: permsForm.canViewNotas ?? false,
      canCreateNota: permsForm.canCreateNota ?? false,
      canEditNota: permsForm.canEditNota ?? false,
      canDeleteNota: permsForm.canDeleteNota ?? false,
      canImportXml: permsForm.canImportXml ?? false,
      canManageStatus: permsForm.canManageStatus ?? false,
      canManageTipos: permsForm.canManageTipos ?? false,
      canManageUsers: permsForm.canManageUsers ?? false,
      canViewDashboard: permsForm.canViewDashboard ?? false,
    });
  };

  const toggleAll = (val: boolean) => {
    setPermsForm(Object.fromEntries(PERMISSIONS.map(p => [p.key, val])));
  };

  return (
    <AppLayout title="Usuários">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Gerenciar Usuários</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            Controle de acesso e permissões por usuário
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "var(--primary)" }}
        >
          <UserPlus className="w-4 h-4" /> Novo Usuário
        </button>
      </div>

      {/* Modal Criar Usuário */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border shadow-xl p-6 w-full max-w-md mx-4" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>Novo Usuário</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "var(--foreground)" }}>Nome</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome completo"
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border)" }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "var(--foreground)" }}>E-mail</label>
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@empresa.com"
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border)" }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "var(--foreground)" }}>Senha (mín. 6 caracteres)</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••"
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border)" }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "var(--foreground)" }}>Perfil</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value as "user" | "admin")}
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border)" }}>
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => createUserMut.mutate({ name: newName, email: newEmail, password: newPassword, role: newRole })}
                disabled={createUserMut.isPending || !newName || !newEmail || newPassword.length < 6}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                style={{ background: "var(--primary)" }}
              >
                {createUserMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Criar Usuário
              </button>
              <button onClick={() => setShowCreateModal(false)} className="px-3 py-2 rounded-lg text-sm border hover:bg-gray-50" style={{ borderColor: "var(--border)" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl">
        {/* Painel de permissões */}
        {editUserId !== null && (
          <div className="bg-white rounded-xl border p-5 mb-5 shadow-sm" style={{ borderColor: "var(--primary)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                Permissões — {usuarios?.find(u => u.id === editUserId)?.name || "Usuário"}
              </h3>
              <div className="flex gap-2">
                <button onClick={() => toggleAll(true)} className="text-xs px-2 py-1 rounded border hover:bg-gray-50" style={{ borderColor: "var(--border)" }}>Marcar tudo</button>
                <button onClick={() => toggleAll(false)} className="text-xs px-2 py-1 rounded border hover:bg-gray-50" style={{ borderColor: "var(--border)" }}>Desmarcar tudo</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
              {PERMISSIONS.map(perm => (
                <label key={perm.key} className="flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 border" style={{ borderColor: permsForm[perm.key] ? "var(--primary)" : "var(--border)", background: permsForm[perm.key] ? "oklch(0.97 0.01 255)" : "white" }}>
                  <input
                    type="checkbox"
                    checked={permsForm[perm.key] ?? false}
                    onChange={e => setPermsForm(f => ({ ...f, [perm.key]: e.target.checked }))}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{perm.label}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{perm.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={handleSavePerms} disabled={savePermsMut.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ background: "var(--primary)" }}>
                <Check className="w-4 h-4" /> Salvar Permissões
              </button>
              <button onClick={() => setEditUserId(null)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border hover:bg-gray-50" style={{ borderColor: "var(--border)" }}>
                <X className="w-4 h-4" /> Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Lista de usuários */}
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Cadastro</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {!usuarios?.length ? (
                <tr>
                  <td colSpan={5} className="text-center py-8" style={{ color: "var(--muted-foreground)" }}>
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                usuarios.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: u.role === "admin" ? "var(--primary)" : "var(--muted)", color: u.role === "admin" ? "white" : "var(--foreground)" }}>
                          {(u.name || u.email || "U")[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{u.name || "—"}</span>
                      </div>
                    </td>
                    <td className="text-sm" style={{ color: "var(--muted-foreground)" }}>{u.email || "—"}</td>
                    <td>
                      <span className={`status-badge ${u.role === "admin" ? "text-blue-700 bg-blue-50" : "text-gray-600 bg-gray-100"}`}>
                        {u.role === "admin" ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                        {u.role === "admin" ? "Administrador" : "Usuário"}
                      </span>
                    </td>
                    <td className="text-sm mono" style={{ color: "var(--muted-foreground)" }}>
                      {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {u.role !== "admin" && (
                          <button onClick={() => openPerms(u.id)} className="flex items-center gap-1 px-2 py-1.5 rounded text-xs border hover:bg-gray-50" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                            <Settings className="w-3.5 h-3.5" /> Permissões
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const newRole = u.role === "admin" ? "user" : "admin";
                            if (confirm(`Alterar perfil de "${u.name}" para ${newRole === "admin" ? "Administrador" : "Usuário"}?`)) {
                              updateRoleMut.mutate({ userId: u.id, role: newRole });
                            }
                          }}
                          className="flex items-center gap-1 px-2 py-1.5 rounded text-xs border hover:bg-gray-50"
                          style={{ borderColor: "var(--border)", color: u.role === "admin" ? "var(--destructive)" : "var(--primary)" }}
                        >
                          {u.role === "admin" ? "→ Usuário" : "→ Admin"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-4 rounded-xl border bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-800">
            <strong>Atenção:</strong> Administradores têm acesso total ao sistema. As permissões individuais só se aplicam a usuários com perfil "Usuário".
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
