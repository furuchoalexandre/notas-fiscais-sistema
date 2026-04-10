# Brainstorming de Design — GitHub Connector Demo

<response>
<idea>
**Design Movement:** Terminal Noir / Hacker Aesthetic
**Core Principles:** Monocromático com acentos verdes, tipografia monospace, densidade de informação alta, sensação de terminal real
**Color Philosophy:** Fundo quase-preto (#0d1117 estilo GitHub Dark), texto verde-lima (#39d353) para dados ativos, cinza para metadados
**Layout Paradigm:** Painel lateral fixo de navegação + área de conteúdo principal com scroll, sem grid centralizado
**Signature Elements:** Cursor piscante, linhas de separação estilo ASCII, badges com bordas nítidas
**Interaction Philosophy:** Hover revela detalhes adicionais como se fosse um `cat` no terminal
**Animation:** Digitação progressiva de texto, fade-in linha a linha
**Typography System:** JetBrains Mono para tudo, hierarquia por peso e cor
</idea>
<text>Terminal Noir</text>
<probability>0.07</probability>
</response>

<response>
<idea>
**Design Movement:** Editorial Técnico / Developer Documentation
**Core Principles:** Tipografia expressiva, assimetria intencional, dados como protagonistas visuais, contraste alto
**Color Philosophy:** Fundo branco-off (#f6f8fa estilo GitHub Light), azul-índigo profundo (#1a1f71) para títulos, laranja-âmbar (#f97316) como acento de destaque para números e métricas
**Layout Paradigm:** Layout de revista técnica — coluna larga para conteúdo principal, coluna estreita para metadados laterais. Hero assimétrico com dado numérico gigante.
**Signature Elements:** Números de métricas em tipografia display gigante (ex: "488K ⭐"), linhas divisórias coloridas, cards com bordas coloridas à esquerda
**Interaction Philosophy:** Tabs e filtros revelam camadas de dados progressivamente; hover em cards expande detalhes inline
**Animation:** Contagem animada de números (counter animation), slide-in dos cards por seção
**Typography System:** Space Grotesk (bold) para títulos e métricas + IBM Plex Mono para código e dados técnicos
</idea>
<text>Editorial Técnico</text>
<probability>0.08</probability>
</response>

<response>
<idea>
**Design Movement:** Glassmorphism Espacial / GitHub Universe
**Core Principles:** Profundidade com camadas translúcidas, fundo gradiente escuro estilo cosmos, dados flutuantes em cards de vidro
**Color Philosophy:** Fundo gradiente #0a0e1a → #1a0a2e (azul-noite para roxo-cósmico), cards com backdrop-blur e borda rgba branca, acentos em #58a6ff (azul GitHub) e #3fb950 (verde GitHub)
**Layout Paradigm:** Grid de cards flutuantes com tamanhos variados (masonry-like), hero central com animação de partículas
**Signature Elements:** Cards com blur e transparência, estrelas animadas no fundo, ícones do Octicons
**Interaction Philosophy:** Cards se elevam ao hover com sombra colorida, dados se animam ao entrar na viewport
**Animation:** Partículas flutuantes no hero, cards com spring animation ao hover, números com efeito de contagem
**Typography System:** Cal Sans / Geist (display) para títulos + Geist Mono para dados
</idea>
<text>Glassmorphism Espacial</text>
<probability>0.06</probability>
</response>

## Escolha: Editorial Técnico

Abordagem escolhida por equilibrar legibilidade de dados com impacto visual. A tipografia expressiva com Space Grotesk e IBM Plex Mono cria identidade forte sem recorrer a clichês de "AI slop". O layout assimétrico de revista técnica diferencia o site de dashboards genéricos.
