# documentation.lugarerrado.com

## Descrição
Documentação — Documentação técnica e guias do lugarerrado.

## Stack
HTML, Cloudflare Workers com Static Assets e Cloudflare D1.

## Arquitetura
O Worker publica em `documentation.lugarerrado.com` um painel de pesquisas que
se atualiza a cada cinco segundos. A API `/api/search-history` grava e consulta
o histórico no D1; `/api/search-report` fornece totais, termos mais buscados,
projetos, atividade das últimas 24 horas e registros recentes.

## Desenvolvimento

```bash
pnpm install
pnpm run dev
```

## Banco de dados

```bash
pnpm run db:migrate:local
```

## Publicação

```bash
pnpm run db:migrate:remote
pnpm run deploy
```

---

*Parte do [lugarerrado.com](https://lugarerrado.com)*
