// Intermedia as chamadas à API Olho Vivo: o token fica em variável de ambiente
// e a SPTrans exige um cookie de sessão, por isso o navegador não a chama direto.
const BASE = 'https://api.olhovivo.sptrans.com.br/v2.1';

const ROTAS = {
  'Parada/Buscar': 'termosBusca',
  'Previsao/Parada': 'codigoParada',
  'Linha/Buscar': 'termosBusca',
};

// Reaproveitado enquanto a função estiver ativa na Vercel
let cookieSessao = null;

async function autenticar() {
  const token = process.env.SPTRANS_TOKEN;
  if (!token) throw new Error('Variável SPTRANS_TOKEN não configurada');

  const resposta = await fetch(`${BASE}/Login/Autenticar?token=${encodeURIComponent(token)}`, {
    method: 'POST',
  });
  if ((await resposta.text()).trim() !== 'true') throw new Error('Token recusado pela SPTrans');

  const cookies = resposta.headers.getSetCookie ? resposta.headers.getSetCookie() : [];
  cookieSessao = cookies.map((c) => c.split(';')[0]).join('; ');
}

function consultar(url) {
  return fetch(url, { headers: { Cookie: cookieSessao || '' } });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    return res.status(405).setHeader('Allow', 'GET').json({ erro: `O método ${req.method} não é aceito. Use GET.` });
  }

  const { rota, ...parametros } = req.query;
  const nomeParametro = ROTAS[rota];
  if (!nomeParametro) {
    return res.status(400).json({ erro: `Rota não permitida. Use: ${Object.keys(ROTAS).join(', ')}.` });
  }

  const valor = String(parametros[nomeParametro] ?? '').trim();
  if (valor === '' || valor.length > 100) {
    return res.status(400).json({ erro: `Informe "${nomeParametro}" com até 100 caracteres.` });
  }
  if (nomeParametro === 'codigoParada' && !/^\d+$/.test(valor)) {
    return res.status(400).json({ erro: '"codigoParada" deve ser um número inteiro.' });
  }

  const url = `${BASE}/${rota}?${new URLSearchParams({ [nomeParametro]: valor })}`;

  try {
    if (!cookieSessao) await autenticar();

    let resposta = await consultar(url);
    if (resposta.status === 401) {
      await autenticar();
      resposta = await consultar(url);
    }
    if (!resposta.ok) {
      return res.status(502).json({ erro: `A SPTrans respondeu com o status ${resposta.status}.` });
    }
    return res.status(200).json(await resposta.json());
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao consultar a SPTrans.' });
  }
}
