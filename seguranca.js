// Farol Operacional — avisos de segurança do dia (DDS) às 7h, 11h e 15h.
// Usa as dicas buscadas em fontes oficiais (data/seguranca.json); sem elas, usa o banco abaixo, focado no nosso negócio.
(function (g) {
  const HORAS = [7, 11, 15];
  const ROTULO = ["Bom dia com segurança", "Pausa de segurança", "Segurança à tarde"];
  const MSG = [
    "Celular e volante não combinam. Pare em local seguro para atender.",
    "Cinto afivelado antes de dar a partida. Sempre.",
    "Checklist pré-viagem feito? Pneus, freios, luzes e tacógrafo.",
    "Respeite a velocidade da via. Chegar bem vale mais que chegar cedo.",
    "Mantenha distância segura do veículo da frente: no mínimo 3 segundos.",
    "Sono ao volante mata. Sentiu cansaço, pare e descanse.",
    "Hidrate-se. Calor e desidratação tiram a atenção.",
    "Na manobra de ré, peça apoio de um sinaleiro.",
    "EPI completo na área operacional: capacete, óculos, luva e bota.",
    "Nunca fique na zona cega de caminhões e pás carregadeiras.",
    "Amarração e lona conferidas antes de sair do pátio.",
    "Carga dentro do limite de peso. Excesso é risco e é multa.",
    "Chuva na pista? Reduza a velocidade e aumente a distância.",
    "Faróis acesos na rodovia, de dia e de noite.",
    "Ultrapassagem só com visibilidade total e faixa liberada.",
    "Ao estacionar, freio de mão puxado e calço na roda.",
    "Subir e descer da cabine com 3 pontos de apoio.",
    "Viu uma condição insegura? Pare, avise e só siga quando estiver resolvido.",
    "Álcool e direção: tolerância zero.",
    "Descarga a granel: nunca entre no silo ou na carreta sem liberação.",
    "Atenção redobrada em pátios: pedestres têm prioridade.",
    "Pressa é inimiga da segurança. Planeje a rota com folga.",
    "Pausa obrigatória respeitada é vida preservada.",
    "Freio fazendo barulho ou puxando? Comunique a manutenção hoje.",
    "Mantenha a cabine organizada. Objeto solto vira projétil.",
    "Na dúvida, não faça. Pergunte ao seu líder.",
    "Sinalize a parada na via com triângulo a pelo menos 30 metros.",
    "Cuidado com a mão: nunca entre entre partes em movimento.",
    "Abasteça com motor desligado e sem celular.",
    "Neblina: farol baixo, velocidade reduzida e pisca só se parar.",
    "Conferir os retrovisores antes de cada mudança de faixa.",
    "Quase-acidente também se reporta. É assim que evitamos o próximo.",
    "Ninguém se machuca hoje. Esse é o nosso compromisso.",
    "Segurança não é prioridade, é valor: não muda conforme o dia.",
    "Volte para casa do mesmo jeito que saiu.",
    "Cuide de você e do colega ao lado.",
    "Carreta graneleira: nunca suba no tanque sem cinto de segurança e ponto de ancoragem.",
    "Descarga pneumática de cimento: confira mangotes e engates antes de pressurizar.",
    "Nunca alivie a pressão do tanque com gente perto da tampa de inspeção.",
    "Curva com carga a granel pede velocidade baixa: o centro de gravidade é alto.",
    "Cal virgem queima pele e olhos: óculos, luva e manga longa na descarga.",
    "Drop & hook: confira pino-rei, quinta-roda e trava antes de sair com a carreta.",
    "Pátio de fábrica: siga a sinalização e a velocidade máxima do cliente.",
    "Saco de cimento tem 50 kg: levante com as pernas, não com a coluna.",
    "Lona rasgada é carga exposta e risco na pista. Troque antes de sair.",
  ];
  function diaDoAno(d) { const i = new Date(d.getFullYear(), 0, 0); return Math.floor((d - i) / 864e5); }
  function chave(d, slot) { return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + "#" + slot; }
  // slot atual: último horário já passado hoje (-1 antes das 7h)
  function slotAtual(d) { const h = d.getHours() + d.getMinutes() / 60; let s = -1; HORAS.forEach((x, i) => { if (h >= x) s = i; }); return s; }
  function mensagem(d, slot) { const n = diaDoAno(d) * 3 + slot; return MSG[(n * 7) % MSG.length]; }
  function aviso(d, slot, api) { const dia = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); const x = api && api.data === dia && api.dicas && api.dicas[slot];
    if (x) return { titulo: "DDS do dia · " + String(HORAS[slot]).padStart(2, "0") + "h", rotulo: ROTULO[slot], texto: x.dica || x.titulo, contexto: x.dica ? x.titulo : "", fonte: x.fonte, url: x.url, chave: chave(d, slot) };
    return { titulo: "DDS do dia · " + String(HORAS[slot]).padStart(2, "0") + "h", rotulo: ROTULO[slot], texto: mensagem(d, slot), chave: chave(d, slot) }; }
  g.FarolSeg = { HORAS, slotAtual, aviso };
})(typeof self !== "undefined" ? self : this);
