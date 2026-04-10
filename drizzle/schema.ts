import {
  int, mysqlEnum, mysqlTable, text, timestamp, varchar,
  boolean, decimal, json, unique
} from "drizzle-orm/mysql-core";

// ─── USUÁRIOS ───────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── PERMISSÕES DE USUÁRIO ───────────────────────────────────────────────────
export const userPermissions = mysqlTable("user_permissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  canViewNotas: boolean("canViewNotas").default(true).notNull(),
  canCreateNota: boolean("canCreateNota").default(false).notNull(),
  canEditNota: boolean("canEditNota").default(false).notNull(),
  canDeleteNota: boolean("canDeleteNota").default(false).notNull(),
  canImportXml: boolean("canImportXml").default(false).notNull(),
  canManageStatus: boolean("canManageStatus").default(false).notNull(),
  canManageTipos: boolean("canManageTipos").default(false).notNull(),
  canManageUsers: boolean("canManageUsers").default(false).notNull(),
  canViewDashboard: boolean("canViewDashboard").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = typeof userPermissions.$inferInsert;

// ─── STATUS DE NOTA ──────────────────────────────────────────────────────────
export const notaStatus = mysqlTable("nota_status", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(),
  descricao: text("descricao"),
  cor: varchar("cor", { length: 20 }).default("#6b7280").notNull(),
  ativo: boolean("ativo").default(true).notNull(),
  ordem: int("ordem").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotaStatus = typeof notaStatus.$inferSelect;
export type InsertNotaStatus = typeof notaStatus.$inferInsert;

// ─── TIPO DE NOTA ────────────────────────────────────────────────────────────
export const notaTipo = mysqlTable("nota_tipo", {
  id: int("id").autoincrement().primaryKey(),
  codigo: varchar("codigo", { length: 20 }).notNull().unique(),
  nome: varchar("nome", { length: 100 }).notNull(),
  descricao: text("descricao"),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotaTipo = typeof notaTipo.$inferSelect;
export type InsertNotaTipo = typeof notaTipo.$inferInsert;

// ─── NOTAS FISCAIS ───────────────────────────────────────────────────────────
export const notas = mysqlTable("notas", {
  id: int("id").autoincrement().primaryKey(),
  chaveAcesso: varchar("chaveAcesso", { length: 60 }).unique(),
  numero: varchar("numero", { length: 20 }).notNull(),
  serie: varchar("serie", { length: 10 }).default("1").notNull(),
  tipoId: int("tipoId").notNull().references(() => notaTipo.id),
  statusId: int("statusId").references(() => notaStatus.id),
  emitenteCnpj: varchar("emitenteCnpj", { length: 18 }).notNull(),
  emitenteNome: varchar("emitenteNome", { length: 200 }).notNull(),
  emitenteUf: varchar("emitenteUf", { length: 2 }),
  destinatarioCnpjCpf: varchar("destinatarioCnpjCpf", { length: 18 }),
  destinatarioNome: varchar("destinatarioNome", { length: 200 }),
  valorTotal: decimal("valorTotal", { precision: 15, scale: 2 }).notNull(),
  valorDesconto: decimal("valorDesconto", { precision: 15, scale: 2 }).default("0"),
  valorImpostos: decimal("valorImpostos", { precision: 15, scale: 2 }).default("0"),
  dataEmissao: timestamp("dataEmissao").notNull(),
  dataEntradaSaida: timestamp("dataEntradaSaida"),
  origem: mysqlEnum("origem", ["xml", "manual"]).default("manual").notNull(),
  xmlUrl: text("xmlUrl"),
  xmlNomeArquivo: varchar("xmlNomeArquivo", { length: 255 }),
  dadosExtras: json("dadosExtras"),
  observacoes: text("observacoes"),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  uniqueNota: unique("unique_nota").on(table.numero, table.serie, table.emitenteCnpj, table.tipoId),
}));

export type Nota = typeof notas.$inferSelect;
export type InsertNota = typeof notas.$inferInsert;