# Librio Art Assets

O app foi preparado para consumir arte real como arquivo, em vez de redesenhar
a identidade visual em CSS.

## Regra principal

Sempre que uma arte aprovada existir, coloque o arquivo no caminho canônico
abaixo. O app tentará o arquivo canônico primeiro e só usará o fallback antigo
se ele ainda não existir.

### Ações do swipe

- `actions/like.png` — Quero ler
- `actions/pass.png` — Passar
- `actions/rewind.png` — Voltar

### Superfícies e decoração

- `paper/background.png` — papel principal
- `labels/campus.png` — etiqueta "no seu campus"
- `swatches/active.png` — pincelada de item ativo

## Como trocar uma arte

Substitua o arquivo no caminho canônico mantendo o mesmo nome. Não é preciso
alterar React ou CSS.

Para elementos com bordas irregulares, prefira PNG com transparência. A arte
deve conter o acabamento visual completo: tinta, textura, contorno, respingos,
rasgos ou imperfeições. O CSS só controla tamanho, posição e interação.

## Novos slots

Novos elementos artísticos devem ser cadastrados em
`src/art/librioArt.tsx`. Componentes usam `<ArtAsset slot="..." />` e não
referenciam caminhos de arquivo diretamente.
