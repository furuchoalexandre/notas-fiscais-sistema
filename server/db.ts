import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import {
  InsertNota, InsertNotaStatus, InsertNotaTipo, InsertUserPermission, InsertUser,
  notas, notaStatus, notaTipo, userPermissions, users
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  const connStr = process.env.NEON_DATABASE_URL;
  if (!_db && connStr) {
    try {
      const sql_client = neon(connStr);
      _db = drizzle(sql_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── USUÁRIOS ────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = 'admin';
    updateSet.role = 'admin';
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  // PostgreSQL upsert via onConflictDoUpdate
  await db.insert(users).values(values).onConflictDoUpdate({
    target: users.openId,
    set: updateSet,
  });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ─── PERMISSÕES ──────────────────────────────────────────────────────────────

export async function getUserPermissions(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userPermissions).where(eq(userPermissions.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertUserPermissions(perm: InsertUserPermission) {
  const db = await getDb();
  if (!db) return;
  const existing = await getUserPermissions(perm.userId);
  if (existing) {
    await db.update(userPermissions).set(perm).where(eq(userPermissions.userId, perm.userId));
  } else {
    await db.insert(userPermissions).values(perm);
  }
}

// ─── STATUS DE NOTA ──────────────────────────────────────────────────────────

export async function getAllStatus() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notaStatus).orderBy(notaStatus.ordem, notaStatus.nome);
}

export async function getStatusById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(notaStatus).where(eq(notaStatus.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createStatus(data: InsertNotaStatus) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(notaStatus).values(data).returning({ id: notaStatus.id });
  return result[0].id;
}

export async function updateStatus(id: number, data: Partial<InsertNotaStatus>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(notaStatus).set(data).where(eq(notaStatus.id, id));
}

export async function deleteStatus(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const notasUsando = await db.select({ id: notas.id }).from(notas).where(eq(notas.statusId, id)).limit(1);
  if (notasUsando.length > 0) throw new Error("Não é possível excluir: há notas usando este status.");
  await db.delete(notaStatus).where(eq(notaStatus.id, id));
}

// ─── TIPO DE NOTA ────────────────────────────────────────────────────────────

export async function getAllTipos() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notaTipo).orderBy(notaTipo.codigo);
}

export async function getTipoById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(notaTipo).where(eq(notaTipo.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createTipo(data: InsertNotaTipo) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(notaTipo).values(data).returning({ id: notaTipo.id });
  return result[0].id;
}

export async function updateTipo(id: number, data: Partial<InsertNotaTipo>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(notaTipo).set(data).where(eq(notaTipo.id, id));
}

export async function deleteTipo(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const notasUsando = await db.select({ id: notas.id }).from(notas).where(eq(notas.tipoId, id)).limit(1);
  if (notasUsando.length > 0) throw new Error("Não é possível excluir: há notas usando este tipo.");
  await db.delete(notaTipo).where(eq(notaTipo.id, id));
}

// ─── NOTAS FISCAIS ────────────────────────────────────────────────────────────

export interface NotaFilter {
  search?: string;
  tipoId?: number;
  statusId?: number;
  page?: number;
  limit?: number;
}

export async function getNotas(filter: NotaFilter = {}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const { search, tipoId, statusId, page = 1, limit = 20 } = filter;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(notas.numero, `%${search}%`),
        ilike(notas.emitenteNome, `%${search}%`),
        ilike(notas.emitenteCnpj, `%${search}%`),
        ilike(notas.destinatarioNome, `%${search}%`),
        ilike(notas.chaveAcesso, `%${search}%`)
      )
    );
  }
  if (tipoId) conditions.push(eq(notas.tipoId, tipoId));
  if (statusId) conditions.push(eq(notas.statusId, statusId));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db.select({
      nota: notas,
      tipo: notaTipo,
      status: notaStatus,
    })
      .from(notas)
      .leftJoin(notaTipo, eq(notas.tipoId, notaTipo.id))
      .leftJoin(notaStatus, eq(notas.statusId, notaStatus.id))
      .where(where)
      .orderBy(desc(notas.dataEmissao))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`COUNT(*)` }).from(notas).where(where),
  ]);

  return { items, total: Number(countResult[0]?.count ?? 0) };
}

export async function getNotaById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({
    nota: notas,
    tipo: notaTipo,
    status: notaStatus,
  })
    .from(notas)
    .leftJoin(notaTipo, eq(notas.tipoId, notaTipo.id))
    .leftJoin(notaStatus, eq(notas.statusId, notaStatus.id))
    .where(eq(notas.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function checkDuplicate(
  numero: string, serie: string, emitenteCnpj: string, tipoId: number, excludeId?: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const conditions = [
    eq(notas.numero, numero),
    eq(notas.serie, serie),
    eq(notas.emitenteCnpj, emitenteCnpj),
    eq(notas.tipoId, tipoId),
  ];
  const result = await db.select({ id: notas.id }).from(notas).where(and(...conditions)).limit(1);
  if (excludeId) return result.length > 0 && result[0].id !== excludeId;
  return result.length > 0;
}

export async function checkDuplicateChave(chaveAcesso: string, excludeId?: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: notas.id }).from(notas).where(eq(notas.chaveAcesso, chaveAcesso)).limit(1);
  if (excludeId) return result.length > 0 && result[0].id !== excludeId;
  return result.length > 0;
}

export async function createNota(data: InsertNota) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(notas).values(data).returning({ id: notas.id });
  return result[0].id;
}

export async function updateNota(id: number, data: Partial<InsertNota>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(notas).set({ ...data, updatedAt: new Date() }).where(eq(notas.id, id));
}

export async function deleteNota(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(notas).where(eq(notas.id, id));
}

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;

  const [totalNotas, totalPorStatus, totalPorTipo, valorTotal, totalStatus, totalTipos] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(notas),
    db.select({
      statusId: notas.statusId,
      statusNome: notaStatus.nome,
      statusCor: notaStatus.cor,
      count: sql<number>`COUNT(*)`,
    }).from(notas).leftJoin(notaStatus, eq(notas.statusId, notaStatus.id)).groupBy(notas.statusId, notaStatus.nome, notaStatus.cor),
    db.select({
      tipoId: notas.tipoId,
      tipoCodigo: notaTipo.codigo,
      tipoNome: notaTipo.nome,
      count: sql<number>`COUNT(*)`,
    }).from(notas).leftJoin(notaTipo, eq(notas.tipoId, notaTipo.id)).groupBy(notas.tipoId, notaTipo.codigo, notaTipo.nome),
    db.select({ total: sql<string>`SUM("valorTotal")` }).from(notas),
    db.select({ count: sql<number>`COUNT(*)` }).from(notaStatus),
    db.select({ count: sql<number>`COUNT(*)` }).from(notaTipo),
  ]);

  return {
    totalNotas: Number(totalNotas[0]?.count ?? 0),
    totalPorStatus,
    totalPorTipo,
    valorTotal: Number(valorTotal[0]?.total ?? 0),
    totalStatus: Number(totalStatus[0]?.count ?? 0),
    totalTipos: Number(totalTipos[0]?.count ?? 0),
  };
}
