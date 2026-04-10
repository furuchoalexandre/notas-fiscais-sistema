import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { FileCheck } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl border p-8 shadow-sm text-center" style={{ borderColor: "var(--border)" }}>
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--primary)" }}>
            <FileCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold mb-1" style={{ color: "var(--foreground)" }}>
            Sistema de Controle de Notas
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
            Faça login para acessar o sistema
          </p>
          <a
            href={getLoginUrl()}
            className="block w-full py-2.5 px-4 rounded-lg text-sm font-medium text-white text-center transition-opacity hover:opacity-90"
            style={{ background: "var(--primary)" }}
          >
            Entrar com Manus
          </a>
        </div>
      </div>
    </div>
  );
}
