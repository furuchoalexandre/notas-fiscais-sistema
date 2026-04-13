import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getAllUsers, updateUserRole, getUserPermissions, upsertUserPermissions,
  getAllStatus, createStatus, updateStatus, deleteStatus,
  getAllTipos, createTipo, updateTipo, deleteTipo,
  getNotas, getNotaById, createNota, updateNota, deleteNota,
  checkDuplicate, checkDuplicateChave, getDashboardStats,
  getUserByEmail, createLocalUser, countAdmins, getUserById,
} from "./db";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

function requirePermission(permission: string) {
  return protectedProcedure.use(async ({ ctx, next }) => {
    if (ctx.user.role === "admin") return next({ ctx });
    const perms = await getUserPermissions(ctx.user.id);
    if (!perms || !(perms as Record<string, unknown>)[permission]) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para esta ação." });
    }
    return next({ ctx });
  });
}

function parseXmlNota(xmlContent: string) {
  const get = (tag: string) => {
    const m = xmlContent.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, 'i'));
    return m ? m[1].trim() : null;
  };
  const getAttr = (tag: string, attr: string) => {
    const m = xmlContent.match(new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'i'));
    return m ? m[1].trim() : null;
  };

  // Detectar tipo: NF-e, CT-e ou NFS-e (suporta padrão antigo e novo SPED)
  // NF-e: nfeProc, NFe
  const isNFe = /<nfeProc[\s>]|<NFe[\s>]/.test(xmlContent);
  // CT-e: cteProc, CTe
  const isCTe = /<cteProc[\s>]|<CTe[\s>]/.test(xmlContent);
  // NFS-e: padrão antigo (CompNfse, Nfse, nfse) e novo padrão SPED (NFSe, infNFSe, nNFSe)
  const isNFSe = /<CompNfse[\s>]|<Nfse[\s>]|<nfse[\s>]|<NFSe[\s>]|<infNFSe[\s>]|<nNFSe[\s>]/.test(xmlContent);

  if (isNFe) {
    const chNFe = get('chNFe') || getAttr('infNFe', 'Id')?.replace('NFe', '') || null;
    return {
      tipo: 'NF-e',
      chaveAcesso: chNFe,
      numero: get('nNF'),
      serie: get('serie') || '1',
      dataEmissao: (() => { const d = get('dhEmi') || get('dEmi'); return d ? new Date(d) : null; })(),
      dataEntradaSaida: (() => { const d = get('dhSaiEnt') || get('dSaiEnt'); return d ? new Date(d) : null; })(),
      valorTotal: (() => { const v = get('vNF'); return v ? parseFloat(v) : null; })(),
      valorDesconto: (() => { const v = get('vDesc'); return v ? parseFloat(v) : 0; })(),
      valorImpostos: (() => { const v = get('vTotTrib'); return v ? parseFloat(v) : 0; })(),
      emitenteCnpj: xmlContent.match(/<emit>[\s\S]*?<CNPJ>([^<]*)<\/CNPJ>/i)?.[1] || null,
      emitenteNome: xmlContent.match(/<emit>[\s\S]*?<xNome>([^<]*)<\/xNome>/i)?.[1] || null,
      emitenteUf: xmlContent.match(/<emit>[\s\S]*?<UF>([^<]*)<\/UF>/i)?.[1] || null,
      destinatarioCnpjCpf: xmlContent.match(/<dest>[\s\S]*?<CNPJ>([^<]*)<\/CNPJ>/i)?.[1] || xmlContent.match(/<dest>[\s\S]*?<CPF>([^<]*)<\/CPF>/i)?.[1] || null,
      destinatarioNome: xmlContent.match(/<dest>[\s\S]*?<xNome>([^<]*)<\/xNome>/i)?.[1] || null,
    };
  }

  if (isCTe) {
    const chCTe = get('chCTe') || getAttr('infCte', 'Id')?.replace('CTe', '') || null;
    return {
      tipo: 'CT-e',
      chaveAcesso: chCTe,
      numero: get('nCT'),
      serie: get('serie') || '1',
      dataEmissao: (() => { const d = get('dhEmi'); return d ? new Date(d) : null; })(),
      dataEntradaSaida: null,
      valorTotal: (() => { const v = get('vTPrest'); return v ? parseFloat(v) : null; })(),
      valorDesconto: 0,
      valorImpostos: 0,
      emitenteCnpj: xmlContent.match(/<emit>[\s\S]*?<CNPJ>([^<]*)<\/CNPJ>/i)?.[1] || null,
      emitenteNome: xmlContent.match(/<emit>[\s\S]*?<xNome>([^<]*)<\/xNome>/i)?.[1] || null,
      emitenteUf: xmlContent.match(/<emit>[\s\S]*?<UF>([^<]*)<\/UF>/i)?.[1] || null,
      destinatarioCnpjCpf: xmlContent.match(/<toma[^>]*>[\s\S]*?<CNPJ>([^<]*)<\/CNPJ>/i)?.[1] || null,
      destinatarioNome: xmlContent.match(/<toma[^>]*>[\s\S]*?<xNome>([^<]*)<\/xNome>/i)?.[1] || null,
    };
  }

  if (isNFSe) {
    // Novo padrão SPED/Nacional (NFSe com xmlns sped.fazenda.gov.br/nfse)
    const isNFSeNacional = /<NFSe[\s>]|<infNFSe[\s>]/.test(xmlContent);

    // Chave de acesso: Id do infNFSe
    const chaveNFSe = isNFSeNacional
      ? (getAttr('infNFSe', 'Id') || null)
      : null;

    // Número da nota
    const numeroNota = isNFSeNacional
      ? (get('nNFSe') || get('nDFSe') || get('nDPS'))
      : (get('Numero') || get('NumeroNfse') || get('numero'));

    // Data de emissão
    const dataEmissaoStr = isNFSeNacional
      ? (get('dhProc') || get('dhEmi') || get('dCompet'))
      : (get('Competencia') || get('DataEmissao'));

    // Valor total
    const valorTotalStr = isNFSeNacional
      ? (get('vLiq') || get('vServ') || get('vCalcDR'))
      : (get('ValorServicos') || get('ValorLiquidoNfse'));

    // Emitente (prestador)
    const emitenteCnpj = isNFSeNacional
      ? (xmlContent.match(/<emit>[\s\S]*?<CNPJ>([^<]*)<\/CNPJ>/i)?.[1] ||
         xmlContent.match(/<prest>[\s\S]*?<CNPJ>([^<]*)<\/CNPJ>/i)?.[1] || null)
      : (xmlContent.match(/<Prestador[\s\S]*?<Cnpj>([^<]*)<\/Cnpj>/i)?.[1] ||
         xmlContent.match(/<PrestadorServico[\s\S]*?<Cnpj>([^<]*)<\/Cnpj>/i)?.[1] || null);

    const emitenteNome = isNFSeNacional
      ? (xmlContent.match(/<emit>[\s\S]*?<xNome>([^<]*)<\/xNome>/i)?.[1] || null)
      : (xmlContent.match(/<RazaoSocial>([^<]*)<\/RazaoSocial>/i)?.[1] || null);

    const emitenteUf = isNFSeNacional
      ? (xmlContent.match(/<emit>[\s\S]*?<UF>([^<]*)<\/UF>/i)?.[1] || null)
      : null;

    // Destinatário (tomador)
    const destinatarioCnpjCpf = isNFSeNacional
      ? (xmlContent.match(/<toma>[\s\S]*?<CNPJ>([^<]*)<\/CNPJ>/i)?.[1] ||
         xmlContent.match(/<toma>[\s\S]*?<CPF>([^<]*)<\/CPF>/i)?.[1] || null)
      : (xmlContent.match(/<Tomador[\s\S]*?<Cnpj>([^<]*)<\/Cnpj>/i)?.[1] || null);

    const destinatarioNome = isNFSeNacional
      ? (xmlContent.match(/<toma>[\s\S]*?<xNome>([^<]*)<\/xNome>/i)?.[1] || null)
      : (xmlContent.match(/<Tomador[\s\S]*?<RazaoSocial>([^<]*)<\/RazaoSocial>/i)?.[1] || null);

    return {
      tipo: 'NFS-e',
      chaveAcesso: chaveNFSe,
      numero: numeroNota,
      serie: get('serie') || '1',
      dataEmissao: (() => { return dataEmissaoStr ? new Date(dataEmissaoStr) : null; })(),
      dataEntradaSaida: null,
      valorTotal: (() => { return valorTotalStr ? parseFloat(valorTotalStr) : null; })(),
      valorDesconto: (() => { const v = isNFSeNacional ? get('vDR') : null; return v ? parseFloat(v) : 0; })(),
      valorImpostos: (() => { const v = isNFSeNacional ? get('vISSQN') : null; return v ? parseFloat(v) : 0; })(),
      emitenteCnpj,
      emitenteNome,
      emitenteUf,
      destinatarioCnpjCpf,
      destinatarioNome,
    };
  }

  throw new Error("Formato de XML não reconhecido. Suportados: NF-e, CT-e, NFS-e.");
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie('local_session', { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    myPermissions: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === "admin") return null;
      return getUserPermissions(ctx.user.id);
    }),

    // ── Login local (e-mail + senha) ──────────────────────────────────────────
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'E-mail ou senha inválidos.' });
        }
        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'E-mail ou senha inválidos.' });
        }
        // Gerar JWT
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'notas-secret-key-2024');
        const token = await new SignJWT({ userId: user.id, role: user.role })
          .setProtectedHeader({ alg: 'HS256' })
          .setExpirationTime('7d')
          .sign(secret);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie('local_session', token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
        return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      }),

    // ── Verificar sessão local ────────────────────────────────────────────────
    meLocal: publicProcedure.query(async ({ ctx }) => {
      // Usar parseCookies pois cookie-parser não está configurado no Express
      function parseCookies(cookieHeader: string | undefined): Record<string, string> {
        if (!cookieHeader) return {};
        return Object.fromEntries(
          cookieHeader.split(";").map(c => {
            const [k, ...v] = c.trim().split("=");
            return [k.trim(), decodeURIComponent(v.join("="))];
          })
        );
      }
      const cookies = parseCookies(ctx.req.headers.cookie);
      const token = cookies["local_session"];
      if (!token) return null;
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'notas-secret-key-2024');
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.userId as number;
        const user = await getUserById(userId);
        if (!user) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role, openId: user.openId };
      } catch {
        return null;
      }
    }),

    // ── Setup inicial: criar primeiro admin ───────────────────────────────────
    setup: publicProcedure
      .input(z.object({ name: z.string().min(1), email: z.string().email(), password: z.string().min(6) }))
      .mutation(async ({ input }) => {
        const admins = await countAdmins();
        if (admins > 0) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Setup já realizado. Contate um administrador.' });
        }
        const existing = await getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({ code: 'CONFLICT', message: 'E-mail já cadastrado.' });
        }
        const passwordHash = await bcrypt.hash(input.password, 10);
        const user = await createLocalUser(input.name, input.email, passwordHash, 'admin');
        return { success: true, userId: user?.id };
      }),

    // ── Criar usuário (admin only) ────────────────────────────────────────────
    createUser: protectedProcedure
      .input(z.object({ name: z.string().min(1), email: z.string().email(), password: z.string().min(6), role: z.enum(['user', 'admin']).default('user') }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const existing = await getUserByEmail(input.email);
        if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'E-mail já cadastrado.' });
        const passwordHash = await bcrypt.hash(input.password, 10);
        const user = await createLocalUser(input.name, input.email, passwordHash, input.role);
        return { success: true, userId: user?.id };
      }),

    // ── Verificar se setup foi feito ──────────────────────────────────────────
    needsSetup: publicProcedure.query(async () => {
      const admins = await countAdmins();
      return admins === 0;
    }),
  }),

  usuarios: router({
    list: protectedProcedure.use(({ ctx, next }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return next({ ctx });
    }).query(() => getAllUsers()),

    updateRole: protectedProcedure.use(({ ctx, next }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return next({ ctx });
    }).input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
      .mutation(({ input }) => updateUserRole(input.userId, input.role)),

    getPermissions: protectedProcedure.use(({ ctx, next }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return next({ ctx });
    }).input(z.object({ userId: z.number() }))
      .query(({ input }) => getUserPermissions(input.userId)),

    savePermissions: protectedProcedure.use(({ ctx, next }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return next({ ctx });
    }).input(z.object({
      userId: z.number(),
      canViewNotas: z.boolean(),
      canCreateNota: z.boolean(),
      canEditNota: z.boolean(),
      canDeleteNota: z.boolean(),
      canImportXml: z.boolean(),
      canManageStatus: z.boolean(),
      canManageTipos: z.boolean(),
      canManageUsers: z.boolean(),
      canViewDashboard: z.boolean(),
    })).mutation(({ input }) => upsertUserPermissions(input)),
  }),

  status: router({
    list: protectedProcedure.query(() => getAllStatus()),

    create: requirePermission("canManageStatus")
      .input(z.object({
        nome: z.string().min(1).max(100),
        descricao: z.string().optional(),
        cor: z.string().default("#6b7280"),
        ordem: z.number().default(0),
      })).mutation(async ({ input }) => {
        const id = await createStatus({ ...input, ativo: true });
        return { id };
      }),

    update: requirePermission("canManageStatus")
      .input(z.object({
        id: z.number(),
        nome: z.string().min(1).max(100).optional(),
        descricao: z.string().optional(),
        cor: z.string().optional(),
        ativo: z.boolean().optional(),
        ordem: z.number().optional(),
      })).mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateStatus(id, data);
        return { success: true };
      }),

    delete: requirePermission("canManageStatus")
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteStatus(input.id);
        return { success: true };
      }),
  }),

  tipos: router({
    list: protectedProcedure.query(() => getAllTipos()),

    create: requirePermission("canManageTipos")
      .input(z.object({
        codigo: z.string().min(1).max(20),
        nome: z.string().min(1).max(100),
        descricao: z.string().optional(),
      })).mutation(async ({ input }) => {
        const id = await createTipo({ ...input, ativo: true });
        return { id };
      }),

    update: requirePermission("canManageTipos")
      .input(z.object({
        id: z.number(),
        codigo: z.string().min(1).max(20).optional(),
        nome: z.string().min(1).max(100).optional(),
        descricao: z.string().optional(),
        ativo: z.boolean().optional(),
      })).mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateTipo(id, data);
        return { success: true };
      }),

    delete: requirePermission("canManageTipos")
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteTipo(input.id);
        return { success: true };
      }),
  }),

  notas: router({
    list: requirePermission("canViewNotas")
      .input(z.object({
        search: z.string().optional(),
        tipoId: z.number().optional(),
        statusId: z.number().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })).query(({ input }) => getNotas(input)),

    get: requirePermission("canViewNotas")
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getNotaById(input.id)),

    dashboard: protectedProcedure.query(() => getDashboardStats()),

    create: requirePermission("canCreateNota")
      .input(z.object({
        numero: z.string().min(1),
        serie: z.string().default("1"),
        tipoId: z.number(),
        statusId: z.number().optional(),
        emitenteCnpj: z.string().min(1),
        emitenteNome: z.string().min(1),
        emitenteUf: z.string().optional(),
        destinatarioCnpjCpf: z.string().optional(),
        destinatarioNome: z.string().optional(),
        valorTotal: z.string(),
        valorDesconto: z.string().optional(),
        valorImpostos: z.string().optional(),
        dataEmissao: z.string(),
        dataEntradaSaida: z.string().optional(),
        chaveAcesso: z.string().optional(),
        observacoes: z.string().optional(),
      })).mutation(async ({ input, ctx }) => {
        const isDup = await checkDuplicate(input.numero, input.serie, input.emitenteCnpj, input.tipoId);
        if (isDup) throw new TRPCError({ code: "CONFLICT", message: "Nota duplicada: já existe uma nota com este número, série, CNPJ e tipo." });
        if (input.chaveAcesso) {
          const isDupChave = await checkDuplicateChave(input.chaveAcesso);
          if (isDupChave) throw new TRPCError({ code: "CONFLICT", message: "Nota duplicada: chave de acesso já cadastrada." });
        }
        const id = await createNota({
          ...input,
          dataEmissao: new Date(input.dataEmissao),
          dataEntradaSaida: input.dataEntradaSaida ? new Date(input.dataEntradaSaida) : undefined,
          origem: "manual",
          createdBy: ctx.user.id,
        });
        return { id };
      }),

    update: requirePermission("canEditNota")
      .input(z.object({
        id: z.number(),
        statusId: z.number().nullable().optional(),
        observacoes: z.string().nullable().optional(),
        dataEntradaSaida: z.string().nullable().optional(),
        // Campos de gestão
        numeroContrato: z.string().nullable().optional(),
        numeroPedido: z.string().nullable().optional(),
        dataPedido: z.string().nullable().optional(),
        numeroOC: z.string().nullable().optional(),
        dataOC: z.string().nullable().optional(),
        dataTriagem: z.string().nullable().optional(),
        dataVencimento: z.string().nullable().optional(),
        formaPagamento: z.enum(["boleto", "ted", "avista"]).nullable().optional(),
        parcelas: z.array(z.string()).nullable().optional(),
      })).mutation(async ({ input }) => {
        const {
          id,
          dataEntradaSaida,
          dataPedido,
          dataOC,
          dataTriagem,
          dataVencimento,
          ...rest
        } = input;
        const toDate = (v: string | null | undefined) =>
          v !== undefined ? (v ? new Date(v) : null) : undefined;
        await updateNota(id, {
          ...rest,
          ...(dataEntradaSaida !== undefined ? { dataEntradaSaida: toDate(dataEntradaSaida) } : {}),
          ...(dataPedido !== undefined ? { dataPedido: toDate(dataPedido) } : {}),
          ...(dataOC !== undefined ? { dataOC: toDate(dataOC) } : {}),
          ...(dataTriagem !== undefined ? { dataTriagem: toDate(dataTriagem) } : {}),
          ...(dataVencimento !== undefined ? { dataVencimento: toDate(dataVencimento) } : {}),
        } as Parameters<typeof updateNota>[1]);
        return { success: true };
      }),

    checkDuplicate: requirePermission("canCreateNota")
      .input(z.object({
        numero: z.string(),
        serie: z.string(),
        emitenteCnpj: z.string(),
        tipoId: z.number(),
        chaveAcesso: z.string().optional(),
      })).query(async ({ input }) => {
        const isDup = await checkDuplicate(input.numero, input.serie, input.emitenteCnpj, input.tipoId);
        const isDupChave = input.chaveAcesso ? await checkDuplicateChave(input.chaveAcesso) : false;
        return { isDuplicate: isDup || isDupChave };
      }),

    delete: requirePermission("canDeleteNota")
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteNota(input.id);
        return { success: true };
      }),

    importXml: requirePermission("canImportXml")
      .input(z.object({
        xmlContent: z.string(),
        fileName: z.string(),
        statusId: z.number().optional(),
      })).mutation(async ({ input, ctx }) => {
        let parsed: ReturnType<typeof parseXmlNota>;
        try {
          parsed = parseXmlNota(input.xmlContent);
        } catch (e: unknown) {
          throw new TRPCError({ code: "BAD_REQUEST", message: e instanceof Error ? e.message : "Erro ao processar XML." });
        }

        if (!parsed.numero || !parsed.emitenteCnpj || !parsed.emitenteNome) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "XML inválido: campos obrigatórios não encontrados." });
        }
        if (!parsed.valorTotal || parsed.valorTotal <= 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "XML inválido: valor total não encontrado." });
        }
        if (!parsed.dataEmissao) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "XML inválido: data de emissão não encontrada." });
        }

        const tipos = await getAllTipos();
        const tipo = tipos.find(t => t.codigo === parsed.tipo);
        if (!tipo) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Tipo "${parsed.tipo}" não cadastrado. Cadastre-o primeiro em Tipos de Nota.` });
        }

        if (parsed.chaveAcesso) {
          const isDupChave = await checkDuplicateChave(parsed.chaveAcesso);
          if (isDupChave) throw new TRPCError({ code: "CONFLICT", message: "Nota duplicada: chave de acesso já cadastrada." });
        }
        const isDup = await checkDuplicate(parsed.numero, parsed.serie, parsed.emitenteCnpj, tipo.id);
        if (isDup) throw new TRPCError({ code: "CONFLICT", message: "Nota duplicada: já existe uma nota com este número, série, CNPJ e tipo." });

        let xmlUrl: string | undefined;
        try {
          const key = `xmls/${ctx.user.id}/${nanoid()}-${input.fileName}`;
          const result = await storagePut(key, input.xmlContent, "application/xml");
          xmlUrl = result.url;
        } catch { /* continua sem URL */ }

        const id = await createNota({
          numero: parsed.numero,
          serie: parsed.serie,
          tipoId: tipo.id,
          statusId: input.statusId ?? undefined,
          emitenteCnpj: parsed.emitenteCnpj,
          emitenteNome: parsed.emitenteNome,
          emitenteUf: parsed.emitenteUf ?? undefined,
          destinatarioCnpjCpf: parsed.destinatarioCnpjCpf ?? undefined,
          destinatarioNome: parsed.destinatarioNome ?? undefined,
          valorTotal: String(parsed.valorTotal),
          valorDesconto: String(parsed.valorDesconto ?? 0),
          valorImpostos: String(parsed.valorImpostos ?? 0),
          dataEmissao: parsed.dataEmissao,
          dataEntradaSaida: parsed.dataEntradaSaida ?? undefined,
          chaveAcesso: parsed.chaveAcesso ?? undefined,
          origem: "xml",
          xmlUrl,
          xmlNomeArquivo: input.fileName,
          createdBy: ctx.user.id,
        });

        return { id, tipo: parsed.tipo, numero: parsed.numero, valorTotal: parsed.valorTotal };
      }),
  }),
});

export type AppRouter = typeof appRouter;
