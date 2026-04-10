/* ============================================================
   DESIGN: Editorial Técnico
   - Space Grotesk display + IBM Plex Mono para dados
   - Sidebar escura fixa + área de conteúdo off-white
   - Métricas gigantes, bordas âmbar à esquerda, cards editoriais
   ============================================================ */

import { useState, useEffect, useRef } from "react";
import {
  BookOpen, Search, Users, GitPullRequest, Tag, Gauge, Zap, Bell,
  Star, GitFork, AlertCircle, ExternalLink, ChevronRight, Code2,
  Activity, Shield, Globe, BarChart3, Menu, X
} from "lucide-react";
import {
  authenticatedUser, rateLimits, topRepositories, topUsers,
  fccIssues, reactReleases, apiCapabilities, languageStats,
  formatNumber, formatDate, langColorMap
} from "@/lib/github-data";

const NAV_SECTIONS = [
  { id: "visao-geral", label: "Visão Geral", icon: Activity },
  { id: "capacidades", label: "Capacidades da API", icon: Zap },
  { id: "repositorios", label: "Repositórios Populares", icon: BookOpen },
  { id: "usuarios", label: "Top Usuários", icon: Users },
  { id: "issues", label: "Issues em Tempo Real", icon: GitPullRequest },
  { id: "releases", label: "Releases do React", icon: Tag },
  { id: "rate-limit", label: "Rate Limits", icon: Gauge },
  { id: "autenticacao", label: "Autenticação", icon: Shield },
];

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen, Search, Users, GitPullRequest, Tag, Gauge, Zap, Bell
};

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const animate = (now: number) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(eased * target));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const { count, ref } = useCountUp(value);
  return (
    <div ref={ref} className="metric-display text-5xl md:text-6xl" style={{ color: "oklch(0.32 0.12 268)" }}>
      {formatNumber(count)}{suffix}
    </div>
  );
}

function LangDot({ lang }: { lang: string | null }) {
  const color = lang ? (langColorMap[lang] ?? "#8b949e") : "#8b949e";
  return (
    <span className="flex items-center gap-1 text-xs" style={{ color: "oklch(0.52 0.03 265)" }}>
      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />
      {lang ?? "N/A"}
    </span>
  );
}

function RateBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = Math.round((used / limit) * 100);
  const remaining = limit - used;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="font-mono text-xs font-medium" style={{ color: "oklch(0.52 0.03 265)" }}>{label}</span>
        <span className="font-mono text-xs" style={{ color: "oklch(0.68 0.19 45)" }}>
          {remaining.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="progress-bar">
        <div
          className="rate-bar-fill h-full rounded-full transition-all duration-1000"
          style={{ width: `${Math.max(pct, 0.5)}%` }}
        />
      </div>
      <div className="text-right font-mono text-xs" style={{ color: "oklch(0.72 0.03 265)" }}>
        {pct}% utilizado
      </div>
    </div>
  );
}

export default function Home() {
  const [activeSection, setActiveSection] = useState("visao-geral");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeCapTab, setActiveCapTab] = useState("repos");

  useEffect(() => {
    const handleScroll = () => {
      const sections = NAV_SECTIONS.map(s => document.getElementById(s.id));
      const scrollY = window.scrollY + 120;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = sections[i];
        if (el && el.offsetTop <= scrollY) {
          setActiveSection(NAV_SECTIONS[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setSidebarOpen(false);
  };

  const activeCap = apiCapabilities.find(c => c.id === activeCapTab) ?? apiCapabilities[0];

  return (
    <div className="min-h-screen flex" style={{ background: "oklch(0.975 0.003 240)" }}>
      {/* ── SIDEBAR ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "oklch(0.18 0.04 265)" }}
      >
        {/* Logo */}
        <div className="px-5 py-6 border-b" style={{ borderColor: "oklch(0.28 0.06 265)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.68 0.19 45)" }}>
              <Code2 className="w-4 h-4" style={{ color: "oklch(0.18 0.04 265)" }} />
            </div>
            <div>
              <div className="font-bold text-sm leading-tight" style={{ color: "oklch(0.98 0 0)", fontFamily: "'Space Grotesk', sans-serif" }}>
                GitHub Connector
              </div>
              <div className="text-xs" style={{ color: "oklch(0.68 0.19 45)", fontFamily: "'IBM Plex Mono', monospace" }}>
                v1.0 · Demo
              </div>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b" style={{ borderColor: "oklch(0.28 0.06 265)" }}>
          <div className="flex items-center gap-2.5">
            <img
              src={authenticatedUser.avatar_url}
              alt={authenticatedUser.login}
              className="w-8 h-8 rounded-full border-2"
              style={{ borderColor: "oklch(0.68 0.19 45)" }}
            />
            <div>
              <div className="text-xs font-semibold" style={{ color: "oklch(0.92 0.005 240)" }}>
                {authenticatedUser.login}
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "oklch(0.65 0.18 140)" }} />
                <span className="text-xs" style={{ color: "oklch(0.65 0.18 140)", fontFamily: "'IBM Plex Mono', monospace" }}>
                  autenticado
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          <div className="px-3 mb-3">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(0.52 0.03 265)" }}>
              Navegação
            </span>
          </div>
          {NAV_SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`nav-item w-full text-left ${activeSection === id ? "active" : ""}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t" style={{ borderColor: "oklch(0.28 0.06 265)" }}>
          <div className="text-xs" style={{ color: "oklch(0.45 0.02 265)", fontFamily: "'IBM Plex Mono', monospace" }}>
            Dados coletados em<br />
            <span style={{ color: "oklch(0.68 0.19 45)" }}>10 Abr 2026</span>
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b" style={{ background: "oklch(0.975 0.003 240)", borderColor: "oklch(0.88 0.008 240)" }}>
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-md" style={{ color: "oklch(0.32 0.12 268)" }}>
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm" style={{ color: "oklch(0.18 0.04 265)" }}>GitHub Connector Demo</span>
        </div>

        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-20">

          {/* ══════════════════════════════════════════
              SEÇÃO 1: VISÃO GERAL
          ══════════════════════════════════════════ */}
          <section id="visao-geral">
            {/* Hero */}
            <div className="relative rounded-2xl overflow-hidden mb-10" style={{ minHeight: 320 }}>
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663485050390/KLyv39L8omtqdFyK9NXD7f/github-hero-UJS7KSHcbZGYxyasP8DCds.webp"
                alt="GitHub Connector Hero"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, oklch(0.18 0.04 265 / 0.85) 0%, oklch(0.18 0.04 265 / 0.5) 100%)" }} />
              <div className="relative z-10 p-8 md:p-12 flex flex-col justify-end h-full" style={{ minHeight: 320 }}>
                <div className="mb-3">
                  <span className="section-label" style={{ color: "oklch(0.68 0.19 45)" }}>Conector GitHub · Demonstração</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4" style={{ color: "oklch(0.98 0 0)", fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}>
                  GitHub API<br />em Ação
                </h1>
                <p className="text-base md:text-lg max-w-xl" style={{ color: "oklch(0.82 0.01 240)" }}>
                  Dados reais coletados via GitHub Connector. Explore repositórios, usuários, issues, releases e muito mais — tudo através da API oficial do GitHub.
                </p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { label: "Repositórios indexados", value: 10, suffix: "+" },
                { label: "Stars no top repo", value: 488490, suffix: "" },
                { label: "Req/hora disponíveis", value: 14990, suffix: "" },
                { label: "Endpoints testados", value: 12, suffix: "" },
              ].map(({ label, value, suffix }) => (
                <div key={label} className="editorial-card">
                  <AnimatedNumber value={value} suffix={suffix} />
                  <div className="mt-2 text-sm font-medium" style={{ color: "oklch(0.52 0.03 265)" }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Intro text */}
            <div className="editorial-card">
              <h2 className="text-xl font-bold mb-3" style={{ color: "oklch(0.18 0.04 265)" }}>
                O que é o GitHub Connector?
              </h2>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "oklch(0.35 0.03 265)" }}>
                O <strong>GitHub Connector</strong> é uma integração com a API REST e GraphQL do GitHub que permite ao agente autenticar, consultar e interagir com qualquer dado público ou privado da plataforma. Através do GitHub CLI (<code className="code-badge">gh</code>), é possível executar chamadas autenticadas com token OAuth, acessar dados em tempo real e automatizar fluxos de trabalho.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { icon: Globe, label: "REST API v3", desc: "Endpoints para todos os recursos do GitHub" },
                  { icon: Zap, label: "GraphQL API v4", desc: "Consultas flexíveis e eficientes" },
                  { icon: Shield, label: "OAuth 2.0", desc: "Autenticação segura com escopos granulares" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "oklch(0.94 0.005 240)" }}>
                    <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "oklch(0.32 0.12 268 / 0.1)" }}>
                      <Icon className="w-4 h-4" style={{ color: "oklch(0.32 0.12 268)" }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "oklch(0.18 0.04 265)" }}>{label}</div>
                      <div className="text-xs mt-0.5" style={{ color: "oklch(0.52 0.03 265)" }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════
              SEÇÃO 2: CAPACIDADES DA API
          ══════════════════════════════════════════ */}
          <section id="capacidades">
            <div className="mb-6">
              <span className="section-label">Capacidades</span>
              <h2 className="text-2xl md:text-3xl font-bold mt-1" style={{ color: "oklch(0.18 0.04 265)", letterSpacing: "-0.02em" }}>
                O que o conector pode fazer
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {apiCapabilities.map((cap) => {
                const Icon = ICON_MAP[cap.icon] ?? BookOpen;
                const isActive = activeCapTab === cap.id;
                return (
                  <button
                    key={cap.id}
                    onClick={() => setActiveCapTab(cap.id)}
                    className={`editorial-card text-left transition-all ${isActive ? "outline outline-2 outline-offset-0" : ""}`}
                    style={isActive ? { outlineColor: "oklch(0.32 0.12 268)", background: "oklch(0.32 0.12 268 / 0.04)" } : {}}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: cap.color === "amber" ? "oklch(0.68 0.19 45 / 0.12)" : "oklch(0.32 0.12 268 / 0.1)" }}
                      >
                        <Icon
                          className="w-4 h-4"
                          style={{ color: cap.color === "amber" ? "oklch(0.68 0.19 45)" : "oklch(0.32 0.12 268)" }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm mb-1" style={{ color: "oklch(0.18 0.04 265)" }}>{cap.title}</div>
                        <div className="text-xs leading-relaxed" style={{ color: "oklch(0.52 0.03 265)" }}>{cap.description}</div>
                      </div>
                      {isActive && <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "oklch(0.32 0.12 268)" }} />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Endpoints detail */}
            <div className="editorial-card" style={{ borderLeftColor: "oklch(0.32 0.12 268)" }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="section-label">Endpoints — {activeCap.title}</span>
              </div>
              <div className="space-y-2">
                {activeCap.endpoints.map((ep) => (
                  <div key={ep} className="flex items-center gap-3 p-2.5 rounded-md" style={{ background: "oklch(0.94 0.005 240)" }}>
                    <span className="code-badge" style={{ background: "oklch(0.32 0.12 268 / 0.1)", color: "oklch(0.32 0.12 268)" }}>
                      {ep.split(" ")[0]}
                    </span>
                    <code className="text-xs font-mono flex-1" style={{ color: "oklch(0.35 0.03 265)" }}>
                      {ep.split(" ").slice(1).join(" ")}
                    </code>
                  </div>
                ))}
              </div>
            </div>

            {/* Capabilities image */}
            <div className="mt-6 rounded-xl overflow-hidden border" style={{ borderColor: "oklch(0.88 0.008 240)" }}>
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663485050390/KLyv39L8omtqdFyK9NXD7f/github-capabilities-UdYiz6DkZekUEbxXsoWaBQ.webp"
                alt="GitHub API Capabilities Map"
                className="w-full object-contain"
                style={{ maxHeight: 400 }}
              />
            </div>
          </section>

          {/* ══════════════════════════════════════════
              SEÇÃO 3: REPOSITÓRIOS POPULARES
          ══════════════════════════════════════════ */}
          <section id="repositorios">
            <div className="mb-6">
              <span className="section-label">Dados Reais · Search API</span>
              <h2 className="text-2xl md:text-3xl font-bold mt-1" style={{ color: "oklch(0.18 0.04 265)", letterSpacing: "-0.02em" }}>
                Repositórios mais populares
              </h2>
              <p className="text-sm mt-2" style={{ color: "oklch(0.52 0.03 265)" }}>
                Resultado de <code className="code-badge">GET /search/repositories?q=stars:&gt;100000&sort=stars</code>
              </p>
            </div>

            <div className="space-y-3">
              {topRepositories.map((repo, i) => (
                <div key={repo.full_name} className="editorial-card group">
                  <div className="flex items-start gap-4">
                    {/* Rank */}
                    <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 font-mono font-bold text-sm"
                      style={{ background: i < 3 ? "oklch(0.68 0.19 45 / 0.15)" : "oklch(0.94 0.005 240)", color: i < 3 ? "oklch(0.68 0.19 45)" : "oklch(0.52 0.03 265)" }}>
                      {i + 1}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a href={repo.url} target="_blank" rel="noopener noreferrer"
                          className="font-semibold text-sm hover:underline flex items-center gap-1"
                          style={{ color: "oklch(0.32 0.12 268)" }}>
                          {repo.full_name}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                        <LangDot lang={repo.language} />
                      </div>
                      {repo.description && (
                        <p className="text-xs mt-1 line-clamp-1" style={{ color: "oklch(0.52 0.03 265)" }}>{repo.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "oklch(0.68 0.19 45)" }}>
                          <Star className="w-3.5 h-3.5" />
                          {formatNumber(repo.stars)}
                        </span>
                        <span className="flex items-center gap-1 text-xs" style={{ color: "oklch(0.52 0.03 265)" }}>
                          <GitFork className="w-3.5 h-3.5" />
                          {formatNumber(repo.forks)}
                        </span>
                        <span className="flex items-center gap-1 text-xs" style={{ color: "oklch(0.52 0.03 265)" }}>
                          <AlertCircle className="w-3.5 h-3.5" />
                          {repo.open_issues}
                        </span>
                      </div>
                    </div>
                    {/* Star bar */}
                    <div className="hidden md:flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="metric-display text-2xl" style={{ color: "oklch(0.32 0.12 268)" }}>
                        {formatNumber(repo.stars)}
                      </span>
                      <span className="text-xs" style={{ color: "oklch(0.52 0.03 265)" }}>stars</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Language breakdown */}
            <div className="mt-6 editorial-card" style={{ borderLeftColor: "oklch(0.32 0.12 268)" }}>
              <div className="section-label mb-4">Distribuição por linguagem</div>
              <div className="space-y-3">
                {languageStats.map(({ language, repos, color }) => (
                  <div key={language} className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-sm font-medium w-32 flex-shrink-0" style={{ color: "oklch(0.35 0.03 265)" }}>{language}</span>
                    <div className="flex-1 progress-bar">
                      <div className="progress-fill" style={{ width: `${(repos / 10) * 100}%` }} />
                    </div>
                    <span className="font-mono text-xs w-8 text-right" style={{ color: "oklch(0.52 0.03 265)" }}>{repos}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════
              SEÇÃO 4: TOP USUÁRIOS
          ══════════════════════════════════════════ */}
          <section id="usuarios">
            <div className="mb-6">
              <span className="section-label">Dados Reais · Users API</span>
              <h2 className="text-2xl md:text-3xl font-bold mt-1" style={{ color: "oklch(0.18 0.04 265)", letterSpacing: "-0.02em" }}>
                Usuários mais seguidos
              </h2>
              <p className="text-sm mt-2" style={{ color: "oklch(0.52 0.03 265)" }}>
                Resultado de <code className="code-badge">GET /search/users?q=followers:&gt;10000&sort=followers</code>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {topUsers.map((user, i) => (
                <a
                  key={user.login}
                  href={user.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="editorial-card flex items-center gap-3 group no-underline"
                  style={{ borderLeftColor: i % 2 === 0 ? "oklch(0.68 0.19 45)" : "oklch(0.32 0.12 268)" }}
                >
                  <img
                    src={user.avatar_url}
                    alt={user.login}
                    className="w-10 h-10 rounded-full border-2 flex-shrink-0"
                    style={{ borderColor: i % 2 === 0 ? "oklch(0.68 0.19 45)" : "oklch(0.32 0.12 268)" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm flex items-center gap-1" style={{ color: "oklch(0.18 0.04 265)" }}>
                      {user.login}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "oklch(0.32 0.12 268)" }} />
                    </div>
                    <div className="text-xs mt-0.5 truncate" style={{ color: "oklch(0.52 0.03 265)" }}>{user.bio}</div>
                  </div>
                  <span className="font-mono text-xs font-bold flex-shrink-0" style={{ color: "oklch(0.68 0.19 45)" }}>
                    #{i + 1}
                  </span>
                </a>
              ))}
            </div>
          </section>

          {/* ══════════════════════════════════════════
              SEÇÃO 5: ISSUES EM TEMPO REAL
          ══════════════════════════════════════════ */}
          <section id="issues">
            <div className="mb-6">
              <span className="section-label">Dados Reais · Issues API</span>
              <h2 className="text-2xl md:text-3xl font-bold mt-1" style={{ color: "oklch(0.18 0.04 265)", letterSpacing: "-0.02em" }}>
                Issues abertas — freeCodeCamp
              </h2>
              <p className="text-sm mt-2" style={{ color: "oklch(0.52 0.03 265)" }}>
                Resultado de <code className="code-badge">GET /repos/freeCodeCamp/freeCodeCamp/issues?state=open</code>
              </p>
            </div>

            {/* Repo summary */}
            <div className="editorial-card mb-4" style={{ borderLeftColor: "oklch(0.32 0.12 268)" }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Stars", value: "442K", icon: Star },
                  { label: "Forks", value: "44.2K", icon: GitFork },
                  { label: "Issues abertas", value: "194", icon: AlertCircle },
                  { label: "Linguagem", value: "TypeScript", icon: Code2 },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.68 0.19 45)" }} />
                    <div>
                      <div className="font-bold text-sm" style={{ color: "oklch(0.18 0.04 265)" }}>{value}</div>
                      <div className="text-xs" style={{ color: "oklch(0.52 0.03 265)" }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {fccIssues.map((issue) => (
                <div key={issue.number} className="editorial-card" style={{ borderLeftColor: "oklch(0.68 0.19 45)" }}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "oklch(0.65 0.18 140)" }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium" style={{ color: "oklch(0.18 0.04 265)" }}>{issue.title}</div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="font-mono text-xs" style={{ color: "oklch(0.52 0.03 265)" }}>#{issue.number}</span>
                        {issue.labels.map((label) => (
                          <span key={label} className="tag">{label}</span>
                        ))}
                        <span className="text-xs" style={{ color: "oklch(0.52 0.03 265)" }}>
                          {formatDate(issue.created_at)}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "oklch(0.65 0.18 140 / 0.1)", color: "oklch(0.45 0.15 140)" }}>
                      open
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ══════════════════════════════════════════
              SEÇÃO 6: RELEASES DO REACT
          ══════════════════════════════════════════ */}
          <section id="releases">
            <div className="mb-6">
              <span className="section-label">Dados Reais · Releases API</span>
              <h2 className="text-2xl md:text-3xl font-bold mt-1" style={{ color: "oklch(0.18 0.04 265)", letterSpacing: "-0.02em" }}>
                Releases — facebook/react
              </h2>
              <p className="text-sm mt-2" style={{ color: "oklch(0.52 0.03 265)" }}>
                Resultado de <code className="code-badge">GET /repos/facebook/react/releases?per_page=5</code>
              </p>
            </div>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5" style={{ background: "oklch(0.88 0.008 240)" }} />
              <div className="space-y-4 pl-12">
                {reactReleases.map((release, i) => (
                  <div key={release.tag_name} className="relative">
                    {/* Dot */}
                    <div
                      className="absolute -left-7 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                      style={{
                        background: i === 0 ? "oklch(0.68 0.19 45)" : "oklch(0.975 0.003 240)",
                        borderColor: i === 0 ? "oklch(0.68 0.19 45)" : "oklch(0.88 0.008 240)"
                      }}
                    >
                      {i === 0 && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "oklch(0.18 0.04 265)" }} />}
                    </div>
                    <div className="editorial-card" style={{ borderLeftColor: i === 0 ? "oklch(0.68 0.19 45)" : "oklch(0.32 0.12 268)" }}>
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm" style={{ color: "oklch(0.32 0.12 268)" }}>
                              {release.tag_name}
                            </span>
                            {i === 0 && (
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "oklch(0.68 0.19 45 / 0.15)", color: "oklch(0.68 0.19 45)" }}>
                                latest
                              </span>
                            )}
                          </div>
                          <div className="text-sm mt-0.5" style={{ color: "oklch(0.35 0.03 265)" }}>{release.name}</div>
                        </div>
                        <span className="font-mono text-xs" style={{ color: "oklch(0.52 0.03 265)" }}>
                          {formatDate(release.published_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════
              SEÇÃO 7: RATE LIMITS
          ══════════════════════════════════════════ */}
          <section id="rate-limit">
            <div className="mb-6">
              <span className="section-label">Dados Reais · Rate Limit API</span>
              <h2 className="text-2xl md:text-3xl font-bold mt-1" style={{ color: "oklch(0.18 0.04 265)", letterSpacing: "-0.02em" }}>
                Consumo de Rate Limit
              </h2>
              <p className="text-sm mt-2" style={{ color: "oklch(0.52 0.03 265)" }}>
                Resultado de <code className="code-badge">GET /rate_limit</code> — coletado em tempo real
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="editorial-card" style={{ borderLeftColor: "oklch(0.65 0.18 140)" }}>
                <div className="section-label mb-4">APIs Principais</div>
                <div className="space-y-5">
                  <RateBar label="Core API" used={rateLimits.core.used} limit={rateLimits.core.limit} />
                  <RateBar label="GraphQL API" used={rateLimits.graphql.used} limit={rateLimits.graphql.limit} />
                  <RateBar label="Search API" used={rateLimits.search.used} limit={rateLimits.search.limit} />
                  <RateBar label="Code Search" used={rateLimits.code_search.used} limit={rateLimits.code_search.limit} />
                </div>
              </div>
              <div className="editorial-card" style={{ borderLeftColor: "oklch(0.68 0.19 45)" }}>
                <div className="section-label mb-4">APIs Especializadas</div>
                <div className="space-y-5">
                  <RateBar label="Actions Runner" used={rateLimits.actions_runner_registration.used} limit={rateLimits.actions_runner_registration.limit} />
                  <RateBar label="SCIM" used={rateLimits.scim.used} limit={rateLimits.scim.limit} />
                  <RateBar label="Audit Log" used={rateLimits.audit_log.used} limit={rateLimits.audit_log.limit} />
                  <RateBar label="Source Import" used={rateLimits.source_import.used} limit={rateLimits.source_import.limit} />
                </div>
              </div>
            </div>

            <div className="mt-4 editorial-card" style={{ borderLeftColor: "oklch(0.32 0.12 268)" }}>
              <div className="flex items-start gap-3">
                <BarChart3 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "oklch(0.32 0.12 268)" }} />
                <div>
                  <div className="font-semibold text-sm mb-1" style={{ color: "oklch(0.18 0.04 265)" }}>Resumo do Rate Limit</div>
                  <p className="text-xs leading-relaxed" style={{ color: "oklch(0.52 0.03 265)" }}>
                    Com autenticação OAuth, o GitHub permite <strong>15.000 requisições/hora</strong> para a Core API e <strong>5.000 pontos/hora</strong> para GraphQL. Sem autenticação, o limite cai para apenas 60 req/hora. O conector utiliza token autenticado, garantindo capacidade máxima de uso.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════
              SEÇÃO 8: AUTENTICAÇÃO
          ══════════════════════════════════════════ */}
          <section id="autenticacao">
            <div className="mb-6">
              <span className="section-label">Segurança</span>
              <h2 className="text-2xl md:text-3xl font-bold mt-1" style={{ color: "oklch(0.18 0.04 265)", letterSpacing: "-0.02em" }}>
                Autenticação & Sessão Ativa
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current session */}
              <div className="editorial-card" style={{ borderLeftColor: "oklch(0.65 0.18 140)" }}>
                <div className="section-label mb-4">Sessão Atual</div>
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={authenticatedUser.avatar_url}
                    alt={authenticatedUser.login}
                    className="w-12 h-12 rounded-full border-2"
                    style={{ borderColor: "oklch(0.65 0.18 140)" }}
                  />
                  <div>
                    <div className="font-bold" style={{ color: "oklch(0.18 0.04 265)" }}>{authenticatedUser.login}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: "oklch(0.65 0.18 140)" }} />
                      <span className="text-xs font-medium" style={{ color: "oklch(0.65 0.18 140)" }}>Autenticado via GH_TOKEN</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "ID do usuário", value: authenticatedUser.id.toString() },
                    { label: "Conta criada", value: formatDate(authenticatedUser.created_at) },
                    { label: "Protocolo Git", value: "HTTPS" },
                    { label: "Plataforma", value: "github.com" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: "oklch(0.92 0.004 240)" }}>
                      <span className="text-xs" style={{ color: "oklch(0.52 0.03 265)" }}>{label}</span>
                      <span className="font-mono text-xs font-medium" style={{ color: "oklch(0.35 0.03 265)" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Auth methods */}
              <div className="editorial-card" style={{ borderLeftColor: "oklch(0.68 0.19 45)" }}>
                <div className="section-label mb-4">Métodos de Autenticação</div>
                <div className="space-y-3">
                  {[
                    { method: "Personal Access Token (PAT)", desc: "Token clássico ou fine-grained com escopos configuráveis", active: true },
                    { method: "OAuth App", desc: "Fluxo de autorização para aplicações de terceiros", active: false },
                    { method: "GitHub App", desc: "Instalação por repositório com permissões granulares", active: false },
                    { method: "GitHub Actions", desc: "GITHUB_TOKEN automático em workflows CI/CD", active: false },
                  ].map(({ method, desc, active }) => (
                    <div key={method} className="flex items-start gap-2.5 p-2.5 rounded-md" style={{ background: active ? "oklch(0.65 0.18 140 / 0.06)" : "oklch(0.94 0.005 240)" }}>
                      <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: active ? "oklch(0.65 0.18 140)" : "oklch(0.52 0.03 265)" }} />
                      <div>
                        <div className="text-xs font-semibold flex items-center gap-2" style={{ color: "oklch(0.18 0.04 265)" }}>
                          {method}
                          {active && <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ background: "oklch(0.65 0.18 140 / 0.15)", color: "oklch(0.45 0.15 140)" }}>em uso</span>}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "oklch(0.52 0.03 265)" }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary table */}
            <div className="mt-6 editorial-card" style={{ borderLeftColor: "oklch(0.32 0.12 268)" }}>
              <div className="section-label mb-4">Resumo das Capacidades do Conector</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "2px solid oklch(0.88 0.008 240)" }}>
                      {["Capacidade", "Endpoint", "Autenticação", "Limite"].map(h => (
                        <th key={h} className="text-left py-2 pr-4 font-semibold text-xs" style={{ color: "oklch(0.52 0.03 265)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { cap: "Perfil do usuário", ep: "GET /user", auth: "Obrigatória", limit: "15K/h" },
                      { cap: "Busca de repos", ep: "GET /search/repositories", auth: "Opcional", limit: "30/min" },
                      { cap: "Issues", ep: "GET /repos/.../issues", auth: "Opcional", limit: "15K/h" },
                      { cap: "Releases", ep: "GET /repos/.../releases", auth: "Opcional", limit: "15K/h" },
                      { cap: "Rate limit", ep: "GET /rate_limit", auth: "Opcional", limit: "15K/h" },
                      { cap: "GraphQL", ep: "POST /graphql", auth: "Obrigatória", limit: "5K pts/h" },
                    ].map(({ cap, ep, auth, limit }, i) => (
                      <tr key={cap} style={{ borderBottom: "1px solid oklch(0.92 0.004 240)", background: i % 2 === 0 ? "transparent" : "oklch(0.975 0.003 240 / 0.5)" }}>
                        <td className="py-2 pr-4 font-medium text-xs" style={{ color: "oklch(0.35 0.03 265)" }}>{cap}</td>
                        <td className="py-2 pr-4"><code className="code-badge">{ep}</code></td>
                        <td className="py-2 pr-4 text-xs" style={{ color: auth === "Obrigatória" ? "oklch(0.68 0.19 45)" : "oklch(0.52 0.03 265)" }}>{auth}</td>
                        <td className="py-2 font-mono text-xs font-medium" style={{ color: "oklch(0.32 0.12 268)" }}>{limit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t pt-8 pb-4" style={{ borderColor: "oklch(0.88 0.008 240)" }}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="font-bold text-sm" style={{ color: "oklch(0.18 0.04 265)" }}>GitHub Connector Demo</div>
                <div className="text-xs mt-0.5" style={{ color: "oklch(0.52 0.03 265)", fontFamily: "'IBM Plex Mono', monospace" }}>
                  Dados coletados em 10 Abr 2026 · Usuário: furuchoalexandre
                </div>
              </div>
              <a href="https://docs.github.com/en/rest" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium"
                style={{ color: "oklch(0.32 0.12 268)" }}>
                <Globe className="w-3.5 h-3.5" />
                GitHub REST API Docs
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </footer>

        </div>
      </main>
    </div>
  );
}
