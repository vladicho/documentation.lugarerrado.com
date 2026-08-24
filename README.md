# documentation.lugarerrado.com

## Descrição
Documentação — Documentação técnica e guias do lugarerrado.

## Stack
HTML, Cloudflare Workers com Static Assets e Cloudflare D1.

## Arquitetura
O Worker publica a página em `documentation.lugarerrado.com` e oferece a API
`/api/search-history`. A API grava e consulta o histórico de pesquisas no D1.

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
