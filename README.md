# Cardápio Online - Estrutura Reorganizada

Esta versão preserva o comportamento do `index.html` original, apenas separando responsabilidades em arquivos próprios.

## Estrutura

```txt
index.html
src/
  styles/
    app.css
  js/
    app.js
    config/
      tailwind.config.js
    core/
      viewport.js
      supabase.client.js
```

## O que foi preservado

- HTML original, IDs, classes, modais e atributos `onclick`.
- Tailwind via CDN.
- Font Awesome via CDN.
- Supabase JS via CDN.
- Canvas Confetti via CDN.
- Mesmas funções globais usadas pelo HTML.
- Mesmo fluxo de cardápio, carrinho, checkout, rastreio e painel admin.

## Como rodar

Abra `index.html` em um servidor estático.

Exemplo:

```bash
npx serve .
```

ou

```bash
python -m http.server 8000
```

Depois acesse:

```txt
http://localhost:8000
```

## Observação técnica

Não foi feita migração para React/JSX nesta etapa porque isso alteraria a forma de renderização e aumentaria o risco de mudar comportamento. A separação atual é a etapa mais segura para começarmos as melhorias com base estável.


## Supabase de teste

Este pacote está apontando para:

- Project ID: `lqfwpfaqcnfsybxchmtg`
- URL: `https://lqfwpfaqcnfsybxchmtg.supabase.co`

Antes de abrir o site, rode o arquivo SQL `instalanches_seed_supabase.sql` no SQL Editor do Supabase.
