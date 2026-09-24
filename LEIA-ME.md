# Sow — Men's Hair Stylist · site

Site institucional de página única. HTML + CSS + JS puro, sem build.

## Como abrir

O projeto é 100% local (nada de CDN). Dois cliques em `index.html` já abrem
o site no navegador.

Se algum navegador implicar com o vídeo de fundo em `file://`, rode um
servidor local na pasta e acesse `http://localhost:8000`:

```powershell
cd "$env:USERPROFILE\OneDrive\Desktop\barbearia-sou"
python -m http.server 8000
```

## Estrutura

```
index.html
assets/css/style.css
assets/js/main.js
img/      fotos usadas na galeria, kids, instagram
videos/   header.mp4 (fundo do topo) e corte-kids.mp4 (seção kids)
```

## O que já veio das imagens que você mandou (confira e ajuste)

| Item | Valor usado | Origem |
|---|---|---|
| Nome | **Sow — Men's Hair Stylist** | logo / fachada |
| Assinatura | "Um novo conceito para o homem" | material da marca |
| Instagram | **@espacosow** → `https://instagram.com/espacosow` | print do perfil |
| WhatsApp | `https://wa.me/message/MIBM3674OG5UF1` | link da bio do perfil |
| Região | Alphaville · Barueri/SP | bio "O Melhor Salão de Alphaville" |
| Horários | Ter–Sex 08h–19h30 · Sáb 08h–16h30 · Seg/Dom fechado | print "Funcionamento" |

## Placeholders — você disse que revisa depois

- **Endereço completo / rua e número** (hoje: "Alameda provisória, 000")
- **Telefone fixo** (hoje: `(11) 0000-0000`)
- **CNPJ** no rodapé
- **Preços dos serviços avulsos** (seção "Serviços")
- **Valores e regras dos planos mensais** (seção "Planos")
- Todos estão marcados no texto com "(a confirmar)" ou "provisório".

Busque por `MIBM3674OG5UF1`, `0000-0000`, `00.000.000` e `provis` para achar
tudo rápido.

## Trocar a identidade visual quando ela chegar

Tudo está em tokens no topo de `assets/css/style.css`, dentro de `:root`:

- `--c-base`, `--c-surface`, `--c-text`, `--c-text-dim` e **`--c-accent`**
  (a cor de destaque — hoje um dourado/latão provisório).
- Fontes: `--font-display` (Fraunces) e `--font-sans` (Archivo), carregadas do
  Google Fonts no `<head>`.
- Favicon: SVG inline no `<head>` do `index.html`.

## Animação

- **GSAP 3.13** (ScrollTrigger + SplitText) está salvo localmente em
  `assets/js/vendor/` — o site funciona **offline**, sem depender de CDN.
  Se os arquivos forem removidos, o site ainda abre (só sem as animações).
  Para atualizar a versão, baixe de `https://cdnjs.cloudflare.com/ajax/libs/gsap/<versão>/`.
- Usado com moderação: entrada do topo + a seção "kids" (parallax em camadas e
  o título montando palavra a palavra). O resto é CSS.
- `prefers-reduced-motion` é respeitado: sem parallax, sem vídeo de fundo, sem
  carrossel automático.

## Pendências de conteúdo (aguardando você)

- Vídeos otimizados/comprimidos (os atuais têm ~5–7 MB cada; recomendo gerar
  versão `.mp4` H.264 ~1080p e um `.webm` para reduzir).
- Fotos de corte "limpas" para a galeria (várias das atuais são prints de
  stories com tarja preta).
- Endereço com link de mapa, se quiser trocar o mapa ilustrativo por um real.

## Arquivos renomeados (tinham acento e quebravam em servidor)

- `videos/header-inspiraçao.mp4` → `videos/header.mp4`
- `img/inspiraçao-design.jpg` → `img/referencia-layout.jpg` (referência, não usada no site)
- `img/funcionamento-identidade-visual.jpg` → `img/identidade-funcionamento.jpg` (referência)
