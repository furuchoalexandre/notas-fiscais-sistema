# Sistema de Controle de Notas Fiscais — TODO

## Backend / Schema
- [x] Schema: tabelas notaStatus, notaTipo, notas, notaPermissoes, appUsers
- [x] db:push para sincronizar schema com banco
- [x] Routers: CRUD de status de nota
- [x] Routers: CRUD de tipo de nota
- [x] Routers: CRUD de usuários com permissões
- [x] Routers: CRUD de notas (manual + importação XML)
- [x] Lógica de detecção de duplicatas (chave: número + série + CNPJ emitente + tipo)
- [x] Parser de XML NF-e (nota de produto)
- [x] Parser de XML NFS-e (nota de serviço)
- [x] Parser de XML CT-e (conhecimento de transporte)
- [x] Upload de arquivo XML via S3

## Frontend
- [x] CSS global com tema azul-escuro profissional
- [x] Layout com DashboardLayout (sidebar + header)
- [x] Página de login (redirect OAuth)
- [x] Página Dashboard (resumo/estatísticas)
- [x] Página Notas (listagem, filtros, busca)
- [x] Página Importar XML (upload + preview + confirmação)
- [x] Página Cadastro Manual de Nota
- [x] Página Cadastro de Status
- [x] Página Cadastro de Tipos de Nota
- [x] Página Gerenciar Usuários (admin)
- [x] Controle de acesso por permissão no frontend
- [x] Feedback de duplicata ao importar/cadastrar

## Testes
- [x] Teste de detecção de duplicata
- [x] Teste de parser XML NF-e
- [x] Testes Vitest (8 testes passando)
