# Librio

Rede social local para leitores descobrirem, emprestarem e compartilharem livros físicos dentro de suas comunidades.

## Estado atual

Protótipo web mobile-first para validar experiência e fluxo antes da implementação do backend.

### Fluxos simulados

- descoberta de livros em formato de cards;
- interesse em um livro;
- estante pessoal;
- cadastro rápido de exemplar;
- matches;
- conversa simulada;
- perfil e reputação.

## Stack

- React
- TypeScript
- Vite
- CSS puro
- Cloudflare Pages

## Desenvolvimento

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
```

## Cloudflare Pages

- Framework preset: React (Vite)
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`

## Princípio de domínio

**Livro é catálogo. Exemplar é propriedade. Empréstimo acontece sobre o exemplar.**

O protótipo ainda usa dados locais. Autenticação, banco, chat em tempo real, notificações e empréstimos persistentes entram nas próximas fases.
