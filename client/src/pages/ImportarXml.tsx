import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";
import { Upload, FileText, AlertTriangle, CheckCircle, X, ArrowLeft, Eye } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

// Parser client-side para preview antes de enviar ao servidor
function parseXmlPreview(xml: string) {
  const get = (tag: string) => {
    const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, 'i'));
    return m ? m[1].trim() : null;
  };
  const isNFe = /<nfeProc|<NFe/.test(xml);
  const isCTe = /<cteProc|<CTe/.test(xml);
  const isNFSe = /<CompNfse|<Nfse|<nfse/.test(xml);

  let tipo = "Desconhecido";
  if (isNFe) tipo = "NF-e";
  else if (isCTe) tipo = "CT-e";
  else if (isNFSe) tipo = "NFS-e";

  const numero = get('nNF') || get('nCT') || get('nNfse') || get('Numero') || "—";
  const serie = get('serie') || get('Serie') || "1";
  const chave = get('chNFe') || get('chCTe') || null;
  const emitenteCnpj = xml.match(/<emit>[\s\S]*?<CNPJ>([^<]*)<\/CNPJ>/i)?.[1]
    || xml.match(/<Prestador>[\s\S]*?<Cnpj>([^<]*)<\/Cnpj>/i)?.[1] || "—";
  const emitenteNome = xml.match(/<emit>[\s\S]*?<xNome>([^<]*)<\/xNome>/i)?.[1]
    || xml.match(/<RazaoSocial>([^<]*)<\/RazaoSocial>/i)?.[1] || "—";
  const valorTotal = get('vNF') || get('vTPrest') || get('ValorServicos') || get('ValorLiquidoNfse') || "—";
  const dataEmissao = get('dhEmi') || get('dhEmi') || get('DataEmissao') || get('dEmi') || "—";

  return { tipo, numero, serie, chave, emitenteCnpj, emitenteNome, valorTotal, dataEmissao };
}

function fmtMoeda(v: string) {
  const n = parseFloat(v);
  if (isNaN(n)) return v;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

export default function ImportarXml() {
  const [, navigate] = useLocation();
  const [xmlContent, setXmlContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [statusId, setStatusId] = useState<number | "">("");
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<ReturnType<typeof parseXmlPreview> | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: statusList } = trpc.status.list.useQuery();

  const importMutation = trpc.notas.importXml.useMutation({
    onSuccess: (data) => {
      toast.success(`Nota ${data.tipo} nº ${data.numero} importada com sucesso!`);
      navigate("/notas");
    },
    onError: (e) => {
      toast.error(e.message);
    },
  });

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".xml")) {
      toast.error("Apenas arquivos XML são aceitos.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setXmlContent(content);
      setFileName(file.name);
      setPreview(parseXmlPreview(content));
      setShowPreview(true);
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSubmit = () => {
    if (!xmlContent) { toast.error("Selecione um arquivo XML."); return; }
    if (!statusId) { toast.error("Selecione um status para a nota."); return; }
    importMutation.mutate({ xmlContent, fileName, statusId: Number(statusId) });
  };

  return (
    <AppLayout title="Importar XML">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/notas">
            <button className="p-1.5 rounded hover:bg-gray-100" style={{ color: "var(--muted-foreground)" }}>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Importar XML</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Importe NF-e, NFS-e ou CT-e a partir de arquivo XML
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl">
        {/* Tipos suportados */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">Formatos suportados</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { code: "NF-e", name: "Nota Fiscal Eletrônica", desc: "Produto/mercadoria" },
              { code: "NFS-e", name: "Nota Fiscal de Serviço", desc: "Prestação de serviço" },
              { code: "CT-e", name: "Conhecimento de Transporte", desc: "Transporte de carga" },
            ].map(t => (
              <div key={t.code} className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="font-bold text-sm text-blue-700 mono">{t.code}</div>
                <div className="text-xs text-blue-600 font-medium">{t.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Upload area */}
        <div className="bg-white rounded-xl border p-6 mb-4" style={{ borderColor: "var(--border)" }}>
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragOver ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            {xmlContent ? (
              <div className="flex items-center justify-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <div className="text-left">
                  <div className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{fileName}</div>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {(xmlContent.length / 1024).toFixed(1)} KB · Clique para trocar
                  </div>
                </div>
                <button
                  className="ml-2 p-1 rounded hover:bg-gray-100"
                  onClick={(e) => { e.stopPropagation(); setXmlContent(""); setFileName(""); setPreview(null); setShowPreview(false); }}
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--muted-foreground)" }} />
                <p className="font-medium text-sm mb-1" style={{ color: "var(--foreground)" }}>
                  Arraste o arquivo XML aqui
                </p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  ou clique para selecionar · Apenas .xml
                </p>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".xml"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>

        {/* Preview dos dados parseados */}
        {showPreview && preview && (
          <div className="bg-white rounded-xl border p-5 mb-4" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-4 h-4" style={{ color: "var(--primary)" }} />
              <h3 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                Preview dos dados extraídos do XML
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {[
                { label: "Tipo de Nota", value: preview.tipo, highlight: true },
                { label: "Número", value: preview.numero },
                { label: "Série", value: preview.serie },
                { label: "Valor Total", value: fmtMoeda(preview.valorTotal) },
                { label: "Emitente CNPJ", value: preview.emitenteCnpj },
                { label: "Emitente Nome", value: preview.emitenteNome },
                { label: "Data de Emissão", value: preview.dataEmissao !== "—" ? new Date(preview.dataEmissao).toLocaleString("pt-BR") : "—" },
                { label: "Chave de Acesso", value: preview.chave ? `${preview.chave.substring(0, 12)}...` : "Não encontrada" },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="flex flex-col">
                  <span className="text-xs font-medium mb-0.5" style={{ color: "var(--muted-foreground)" }}>{label}</span>
                  <span className={`text-sm font-medium mono ${highlight ? "text-blue-700" : ""}`} style={!highlight ? { color: "var(--foreground)" } : {}}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
            {preview.tipo === "Desconhecido" && (
              <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-xs text-amber-800">
                  <strong>Aviso:</strong> Não foi possível identificar o tipo de nota automaticamente. O servidor tentará detectar o formato ao importar.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Status */}
        <div className="bg-white rounded-xl border p-5 mb-4" style={{ borderColor: "var(--border)" }}>
          <label className="form-label">Status da Nota *</label>
          <select
            value={statusId}
            onChange={(e) => setStatusId(e.target.value ? Number(e.target.value) : "")}
            className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }}
          >
            <option value="">Selecione um status...</option>
            {statusList?.map(s => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>
          {statusList?.length === 0 && (
            <p className="text-xs mt-2" style={{ color: "var(--destructive)" }}>
              Nenhum status cadastrado.{" "}
              <Link href="/configuracoes/status" className="underline">Cadastre um status primeiro.</Link>
            </p>
          )}
        </div>

        {/* Aviso duplicata */}
        <div className="duplicate-warning mb-4">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>O sistema verificará automaticamente se a nota já foi importada antes de salvar.</span>
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <Link href="/notas">
            <button className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
              Cancelar
            </button>
          </Link>
          <button
            onClick={handleSubmit}
            disabled={!xmlContent || !statusId || importMutation.isPending}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--primary)" }}
          >
            {importMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Confirmar Importação
              </>
            )}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
