# Meu ponto

Aplicativo web que mostra, em tempo real, os próximos ônibus de um ponto de São Paulo.
Feito em HTML, CSS e JavaScript com a API Olho Vivo da SPTrans, para a Global Solution 2026.2 de Application Development (FIAP).

## O que o app faz

- Busca pontos de ônibus pelo nome ou endereço (`/Parada/Buscar`).
- Mostra no mapa (Leaflet) o ponto e a posição dos ônibus que estão chegando.
- Lista as linhas do ponto e quantos minutos faltam para cada ônibus (`/Previsao/Parada`).
- Atualiza a lista sozinho a cada 30 segundos.
- Marca com ♿ os ônibus acessíveis e tem o filtro "Só ônibus acessíveis".
- Funciona no celular: o mapa fica em cima e a lista embaixo.

## Como funciona

```
Navegador (index.html + script.js)  ->  /api/olhovivo (função do Vercel)  ->  API Olho Vivo
```

A API da SPTrans exige um token e um cookie de sessão. Por isso o navegador não a chama direto:
a função `api/olhovivo.js` guarda o token em uma variável de ambiente, faz o login e repassa só as rotas permitidas.

Arquivos:

```
index.html        página
style.css         estilos
script.js         lógica do app
api/olhovivo.js   função serverless que fala com a SPTrans
.env.example      modelo do arquivo .env (variável SPTRANS_TOKEN)
INTEGRANTES.txt   integrantes e divisão do trabalho
```

## Como executar

1. Crie uma conta na [área de desenvolvedores da SPTrans](https://www.sptrans.com.br/desenvolvedores/), abra "Meus Aplicativos" e gere um token.
2. Instale a CLI do Vercel: `npm i -g vercel`.
3. Na pasta do projeto, copie `.env.example` para `.env` e troque pelo seu token (o `.env` não vai para o GitHub).
4. Rode `vercel dev` e abra o endereço que aparecer (normalmente http://localhost:3000).

## Como publicar no Vercel

1. Suba o repositório no GitHub.
2. No Vercel: Add New -> Project -> importe o repositório.
3. Antes de clicar em Deploy, abra Environment Variables e crie `SPTRANS_TOKEN` com o seu token.
4. Clique em Deploy. A URL do app aparece quando terminar.

## Créditos

Dados da SPTrans, API Olho Vivo. Mapa com Leaflet, © OpenStreetMap. As previsões dependem do trânsito e podem variar.
