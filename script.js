const formBusca = document.querySelector(".busca");
const campoBusca = document.querySelector(".campo-busca");
const mensagem = document.querySelector(".mensagem");
const listaPontos = document.querySelector(".lista-pontos");
const tituloPonto = document.querySelector(".titulo-ponto");
const filtro = document.querySelector(".filtro");
const filtroAcessiveis = document.querySelector(".filtro-acessiveis");
const listaLinhas = document.querySelector(".lista-linhas");

let pontos = [];
let pontoAtual = null;
let previsao = null;

const mapa = L.map("mapa").setView([-23.5505, -46.6333], 12);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap",
}).addTo(mapa);
const camadaMapa = L.layerGroup().addTo(mapa);

// A página chama /api/olhovivo, que guarda o token e faz o login na SPTrans
async function chamarApi(rota, parametro, valor) {
  const resposta = await fetch(`/api/olhovivo?rota=${rota}&${parametro}=${encodeURIComponent(valor)}`);
  if (!resposta.ok) {
    throw new Error("Não foi possível consultar a SPTrans agora.");
  }
  return resposta.json();
}

function paraMinutos(hhmm) {
  const partes = hhmm.split(":");
  return Number(partes[0]) * 60 + Number(partes[1]);
}

// O % 1440 trata a virada da meia-noite (consulta 23:50, ônibus 00:04 = 14 min)
function minutosAte(horaConsulta, horaPrevista) {
  return (paraMinutos(horaPrevista) - paraMinutos(horaConsulta) + 1440) % 1440;
}

function textoMinutos(minutos) {
  if (minutos === 0) return "Chegando";
  return minutos + " min";
}

function mostrarPontos() {
  listaPontos.innerHTML = "";

  pontos.slice(0, 10).forEach((ponto, indice) => {
    listaPontos.innerHTML += `
      <li data-indice="${indice}">
        <strong>${ponto.np}</strong>
        <span>${ponto.ed}</span>
      </li>
    `;
  });

  if (pontos.length === 0) {
    mensagem.textContent = "Nenhum ponto encontrado. Tente outro nome.";
  } else {
    mensagem.textContent = "Escolha o seu ponto:";
  }
}

function mostrarLinhas() {
  listaLinhas.innerHTML = "";
  camadaMapa.clearLayers();

  const marcadorPonto = L.marker([pontoAtual.py, pontoAtual.px]).addTo(camadaMapa);
  marcadorPonto.bindTooltip("Seu ponto");
  const posicoes = [[pontoAtual.py, pontoAtual.px]];

  const linhas = (previsao.p ? previsao.p.l : []).filter((linha) => linha.vs.length > 0);

  linhas.forEach((linha) => {
    linha.vs.sort((a, b) => minutosAte(previsao.hr, a.t) - minutosAte(previsao.hr, b.t));
  });
  linhas.sort((a, b) => minutosAte(previsao.hr, a.vs[0].t) - minutosAte(previsao.hr, b.vs[0].t));

  linhas.forEach((linha) => {
    let onibus = linha.vs;
    if (filtroAcessiveis.checked) {
      onibus = onibus.filter((v) => v.a === true);
    }
    if (onibus.length === 0) return;

    const tempos = onibus.map((v) => minutosAte(previsao.hr, v.t));
    const primeiro = tempos[0];
    const depois = tempos.slice(1, 4).map((m) => m + " min").join(" · ");
    const acessivel = onibus[0].a ? " ♿" : "";

    listaLinhas.innerHTML += `
      <li>
        <span class="letreiro">${linha.c}</span>
        <span class="destino">${linha.lt0}<small>saindo de ${linha.lt1}</small></span>
        <span class="tempo">
          <strong class="${primeiro === 0 ? "chegando" : ""}">${textoMinutos(primeiro)}${acessivel}</strong>
          <small>${depois}</small>
        </span>
      </li>
    `;

    onibus.slice(0, 3).forEach((v) => {
      const bolinha = L.circleMarker([v.py, v.px], { color: "#4d6a08", fillColor: "#8dc63f", fillOpacity: 1, radius: 8 });
      bolinha.bindTooltip(linha.c, { permanent: true });
      bolinha.addTo(camadaMapa);
      posicoes.push([v.py, v.px]);
    });
  });

  if (listaLinhas.innerHTML === "") {
    listaLinhas.innerHTML = '<li class="mensagem">Nenhum ônibus previsto agora.</li>';
  }
  return posicoes;
}

async function carregarPrevisao(ajustarMapa) {
  try {
    previsao = await chamarApi("Previsao/Parada", "codigoParada", pontoAtual.cp);
    const posicoes = mostrarLinhas();
    if (ajustarMapa) {
      mapa.fitBounds(posicoes, { maxZoom: 16, padding: [40, 40] });
    }
  } catch (erro) {
    mensagem.textContent = erro.message;
  }
}

async function escolherPonto(indice) {
  pontoAtual = pontos[indice];
  previsao = null;
  listaPontos.innerHTML = "";
  mensagem.textContent = "Carregando previsões…";
  tituloPonto.textContent = pontoAtual.np + " - " + pontoAtual.ed;
  filtro.hidden = false;

  await carregarPrevisao(true);
  if (previsao) {
    mensagem.textContent = "Atualizado às " + previsao.hr + ". A lista se atualiza sozinha.";
  }
}

formBusca.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const termo = campoBusca.value.trim();

  if (termo.length < 3) {
    mensagem.textContent = "Digite pelo menos 3 letras.";
    return;
  }

  pontoAtual = null;
  tituloPonto.textContent = "";
  listaLinhas.innerHTML = "";
  filtro.hidden = true;
  camadaMapa.clearLayers();
  mensagem.textContent = "Buscando pontos…";

  try {
    pontos = await chamarApi("Parada/Buscar", "termosBusca", termo);
    mostrarPontos();
  } catch (erro) {
    mensagem.textContent = erro.message;
  }
});

listaPontos.addEventListener("click", (evento) => {
  const item = evento.target.closest("li");
  if (item) escolherPonto(Number(item.dataset.indice));
});

filtroAcessiveis.addEventListener("change", () => {
  if (previsao) mostrarLinhas();
});

setInterval(() => {
  if (pontoAtual) carregarPrevisao(false);
}, 30000);
