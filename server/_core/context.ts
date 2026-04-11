import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { jwtVerify } from "jose";
import { getUserById } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(";").map(c => {
      const [k, ...v] = c.trim().split("=");
      return [k.trim(), decodeURIComponent(v.join("="))];
    })
  );
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // 1. Tentar autenticação local (JWT no cookie local_session)
  try {
    const cookies = parseCookies(opts.req.headers.cookie);
    const localToken = cookies["local_session"];
    if (localToken) {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "notas-secret-key-2024");
      const { payload } = await jwtVerify(localToken, secret);
      const userId = payload.userId as number;
      if (userId) {
        const localUser = await getUserById(userId);
        if (localUser) {
          user = localUser;
        }
      }
    }
  } catch {
    // token inválido ou expirado — continua
  }

  // 2. Fallback: autenticação Manus OAuth (para uso no ambiente Manus)
  if (!user) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch {
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
