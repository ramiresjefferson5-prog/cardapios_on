# Cardápio InstaLanches - versão corrigida para GitHub Pages

Estrutura de deploy:

- `index.html`
- `assets/css/app.css`
- `assets/js/app.js`
- `assets/js/config/tailwind.config.js`
- `assets/js/core/viewport.js`
- `assets/js/core/supabase.client.js`

Para publicar no GitHub Pages, envie o `index.html` e a pasta `assets` para a raiz do repositório.

O site usa o projeto Supabase:

- Project ID: `lqfwpfaqcnfsybxchmtg`
- URL: `https://lqfwpfaqcnfsybxchmtg.supabase.co`

Correções desta versão:

1. Caminhos de assets simplificados para `assets/...`.
2. Query string `?v=20260101` para evitar cache antigo do navegador/GitHub Pages.
3. CSS crítico mínimo no `index.html` para impedir que modais apareçam como conteúdo da página se o CSS externo falhar.
4. Aplicação do status da loja logo ao carregar, mesmo antes da resposta do Supabase.
5. Cliente Supabase exposto também em `window.supabaseClient`.


## Atualização: Admin profissional responsivo

Esta versão mantém o cardápio público intacto e atualiza somente o painel administrativo:
- Layout desktop em tela ampla com sidebar, KPIs e área de operação.
- Layout mobile full-screen com abas horizontais.
- Cards profissionais para pedidos, produtos e taxas.
- Melhorias visuais com sombras, profundidade e ícones 3D via CSS.
- Mesmas funções e integrações Supabase preservadas.


## Atualização admin minimalista full-page

- Painel admin agora ocupa 100% da tela.
- Scroll interno corrigido em desktop e mobile.
- Visual reduzido, sem brilhos/gradientes excessivos.
- Arquivos principais: `index.html`, `assets/css/app.css`, `assets/js/app.js`.
