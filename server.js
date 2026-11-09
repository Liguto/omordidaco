const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

// No Vercel (Serverless), o sistema de arquivos em __dirname é somente leitura.
// Usamos a pasta temporária do sistema operacional (os.tmpdir()) com fallback para memória.
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DB_FILE = isServerless ? path.join(os.tmpdir(), 'pedidos.json') : path.join(__dirname, 'pedidos.json');
const HISTORICO_FILE = isServerless ? path.join(os.tmpdir(), 'historico_pedidos.json') : path.join(__dirname, 'historico_pedidos.json');
const CLIENTES_FILE = isServerless ? path.join(os.tmpdir(), 'clientes.json') : path.join(__dirname, 'clientes.json');

app.use(express.json());
app.use((req, res, next) => {
  if (typeof req.body === 'string' && req.body.length > 0) {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {}
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Integração de nuvem para Serverless (Vercel KV / Upstash Redis e Cloud Pub/Sub)
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const CLOUD_TOPIC = process.env.CLOUD_TOPIC || 'omordidaco_pedidos_tamoio_campinas_live';

async function salvarPedidosNuvem() {
  if (!KV_URL || !KV_TOKEN) return;
  try {
    await fetch(`${KV_URL}/set/omordidaco_pedidos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
      body: JSON.stringify(pedidos)
    });
  } catch (e) {}
}

async function carregarPedidosNuvem() {
  if (!KV_URL || !KV_TOKEN) return false;
  try {
    const res = await fetch(`${KV_URL}/get/omordidaco_pedidos`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.result) {
        pedidos = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
        return true;
      }
    }
  } catch (e) {}
  return false;
}

async function salvarClientesNuvem() {
  if (!KV_URL || !KV_TOKEN) return;
  try {
    await fetch(`${KV_URL}/set/omordidaco_clientes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
      body: JSON.stringify(clientes)
    });
  } catch (e) {}
}

async function carregarClientesNuvem() {
  if (!KV_URL || !KV_TOKEN) return false;
  try {
    const res = await fetch(`${KV_URL}/get/omordidaco_clientes`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.result) {
        const listaNuvem = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
        if (Array.isArray(listaNuvem) && listaNuvem.length > 0) {
          mesclarClientesComLista(listaNuvem);
          return true;
        }
      }
    }
  } catch (e) {}
  return false;
}

async function despacharEventoNuvem(evento) {
  try {
    const isStatusUpdate = evento.tipo === 'status_atualizado';
    const titulo = isStatusUpdate 
      ? `🔄 Status Pedido #${evento.numero || ''}: ${evento.status || ''}`
      : `🌭 Novo Pedido #${evento.numero || ''} - ${evento.cliente ? evento.cliente.nome : ''}`;

    await fetch(`https://ntfy.sh/${CLOUD_TOPIC}`, {
      method: 'POST',
      headers: {
        'Title': titulo,
        'Priority': isStatusUpdate ? 'default' : 'urgent',
        'Tags': isStatusUpdate ? 'arrows_counterclockwise' : 'hotdog,bell'
      },
      body: JSON.stringify(evento)
    });
  } catch (err) {}
}

// Inicializar banco de dados JSON de Pedidos
let pedidos = [];
if (fs.existsSync(DB_FILE)) {
  try {
    pedidos = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    pedidos = [];
  }
} else if (isServerless && fs.existsSync(path.join(__dirname, 'pedidos.json'))) {
  try {
    pedidos = JSON.parse(fs.readFileSync(path.join(__dirname, 'pedidos.json'), 'utf8'));
  } catch (e) {
    pedidos = [];
  }
}

function salvarPedidos() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(pedidos, null, 2), 'utf8');
  } catch (err) {
    console.warn('Aviso: Gravação em disco ignorada em ambiente Serverless (dados preservados em memória):', err.message);
  }
}

function recarregarPedidosDoDisco() {
  if (fs.existsSync(DB_FILE)) {
    try {
      pedidos = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
      console.warn('Aviso: Erro ao reler DB_FILE:', e.message);
    }
  } else if (isServerless && fs.existsSync(path.join(__dirname, 'pedidos.json'))) {
    try {
      pedidos = JSON.parse(fs.readFileSync(path.join(__dirname, 'pedidos.json'), 'utf8'));
    } catch (e) {}
  }
}

// Inicializar banco de dados JSON de Histórico de Pedidos Anteriores
let historicoPedidos = [];
if (fs.existsSync(HISTORICO_FILE)) {
  try {
    historicoPedidos = JSON.parse(fs.readFileSync(HISTORICO_FILE, 'utf8'));
  } catch (e) {
    historicoPedidos = [];
  }
} else if (isServerless && fs.existsSync(path.join(__dirname, 'historico_pedidos.json'))) {
  try {
    historicoPedidos = JSON.parse(fs.readFileSync(path.join(__dirname, 'historico_pedidos.json'), 'utf8'));
  } catch (e) {
    historicoPedidos = [];
  }
}

function salvarHistorico() {
  try {
    fs.writeFileSync(HISTORICO_FILE, JSON.stringify(historicoPedidos, null, 2), 'utf8');
  } catch (err) {
    console.warn('Aviso: Gravação de histórico em disco ignorada em ambiente Serverless:', err.message);
  }
}

function recarregarHistoricoDoDisco() {
  if (fs.existsSync(HISTORICO_FILE)) {
    try {
      historicoPedidos = JSON.parse(fs.readFileSync(HISTORICO_FILE, 'utf8'));
    } catch (e) {}
  } else if (isServerless && fs.existsSync(path.join(__dirname, 'historico_pedidos.json'))) {
    try {
      historicoPedidos = JSON.parse(fs.readFileSync(path.join(__dirname, 'historico_pedidos.json'), 'utf8'));
    } catch (e) {}
  }
}

// Inicializar banco de dados JSON de Clientes VIP (invisível aos clientes)
let clientes = [];
if (fs.existsSync(CLIENTES_FILE)) {
  try {
    clientes = JSON.parse(fs.readFileSync(CLIENTES_FILE, 'utf8'));
  } catch (e) {
    clientes = [];
  }
} else if (isServerless && fs.existsSync(path.join(__dirname, 'clientes.json'))) {
  try {
    clientes = JSON.parse(fs.readFileSync(path.join(__dirname, 'clientes.json'), 'utf8'));
  } catch (e) {
    clientes = [];
  }
}

function salvarClientes() {
  try {
    fs.writeFileSync(CLIENTES_FILE, JSON.stringify(clientes, null, 2), 'utf8');
  } catch (err) {
    console.warn('Aviso: Gravação de clientes em disco ignorada em ambiente Serverless:', err.message);
  }
}

function recarregarClientesDoDisco() {
  if (fs.existsSync(CLIENTES_FILE)) {
    try {
      clientes = JSON.parse(fs.readFileSync(CLIENTES_FILE, 'utf8'));
    } catch (e) {
      console.warn('Aviso: Erro ao reler CLIENTES_FILE:', e.message);
    }
  } else if (isServerless && fs.existsSync(path.join(__dirname, 'clientes.json'))) {
    try {
      clientes = JSON.parse(fs.readFileSync(path.join(__dirname, 'clientes.json'), 'utf8'));
    } catch (e) {}
  }
}

function normalizarTelefone(tel) {
  if (!tel) return '';
  const digitos = String(tel).replace(/\D/g, '');
  if (!digitos) return '';
  // Se vier com DDI Brasil (55) e tiver 12 ou 13 dígitos: 5519997981104 -> 19997981104
  if (digitos.startsWith('55') && (digitos.length === 12 || digitos.length === 13)) {
    return digitos.slice(2);
  }
  return digitos;
}

function saoTelefonesIguais(telA, telB) {
  const a = normalizarTelefone(telA);
  const b = normalizarTelefone(telB);
  if (!a || !b) return false;
  if (a === b) return true;
  // Se ambos tiverem pelo menos 8 dígitos significativos (com ou sem DDD ou 9º dígito)
  if (a.length >= 8 && b.length >= 8) {
    return a.slice(-8) === b.slice(-8);
  }
  return false;
}

function encontrarClienteExistente(clienteData, lista = clientes) {
  if (!clienteData) return null;
  const tel = (clienteData.telefone || '').trim();
  if (!tel) return null;

  // Chave ÚNICA ESTRITA: número de telefone
  return lista.find(c => saoTelefonesIguais(c.telefone, tel)) || null;
}

function deduplicarClientes() {
  if (!Array.isArray(clientes) || clientes.length === 0) return;

  const mapa = new Map();
  clientes.forEach(c => {
    if (!c || !c.telefone) return;
    const chave = normalizarTelefone(c.telefone).slice(-8) || normalizarTelefone(c.telefone);
    if (!chave) return;

    if (!mapa.has(chave)) {
      mapa.set(chave, {
        id: c.id || ('CLI-' + Date.now() + '-' + Math.floor(Math.random() * 1000)),
        nome: c.nome || 'Cliente VIP',
        telefone: c.telefone,
        endereco: c.endereco || 'Balcão / Retirada',
        bairro: c.bairro || 'Jardim Tamoio',
        totalPedidos: Number(c.totalPedidos) || 1,
        totalGasto: Number((Number(c.totalGasto) || 0).toFixed(2)),
        primeiroPedido: c.primeiroPedido || '',
        ultimoPedido: c.ultimoPedido || ''
      });
    } else {
      const existente = mapa.get(chave);
      // Se tiver nome mais completo, atualiza
      if (c.nome && c.nome !== 'Cliente' && c.nome !== 'Cliente VIP' && (existente.nome === 'Cliente' || existente.nome === 'Cliente VIP' || c.nome.length > existente.nome.length)) {
        existente.nome = c.nome;
      }
      if (c.endereco && c.endereco !== 'Balcão / Retirada') existente.endereco = c.endereco;
      if (c.bairro && c.bairro !== 'Jardim Tamoio') existente.bairro = c.bairro;
      existente.totalPedidos += (Number(c.totalPedidos) || 1);
      existente.totalGasto = Number((existente.totalGasto + (Number(c.totalGasto) || 0)).toFixed(2));
      if (c.ultimoPedido) existente.ultimoPedido = c.ultimoPedido;
      if (!existente.primeiroPedido && c.primeiroPedido) existente.primeiroPedido = c.primeiroPedido;
    }
  });

  clientes = Array.from(mapa.values());
  salvarClientes();
}

function mesclarClientesComLista(listaExterna) {
  if (!Array.isArray(listaExterna)) return;
  listaExterna.forEach(cExt => {
    if (!cExt || !cExt.telefone) return;
    const existente = encontrarClienteExistente(cExt);
    if (existente) {
      if (cExt.nome && cExt.nome !== 'Cliente' && cExt.nome !== 'Cliente VIP') {
        existente.nome = cExt.nome;
      }
      if (cExt.endereco && cExt.endereco !== 'Balcão / Retirada') existente.endereco = cExt.endereco;
      if (cExt.bairro && cExt.bairro !== 'Jardim Tamoio') existente.bairro = cExt.bairro;
      existente.totalPedidos = Math.max(existente.totalPedidos || 0, cExt.totalPedidos || 0);
      existente.totalGasto = Math.max(existente.totalGasto || 0, cExt.totalGasto || 0);
      if (cExt.ultimoPedido) existente.ultimoPedido = cExt.ultimoPedido;
    } else {
      clientes.push(cExt);
    }
  });
  deduplicarClientes();
}

function registrarOuAtualizarCliente(clienteData, entregaData, valorPedido, dataHoraPedido) {
  if (!clienteData) return;
  const telOriginal = (clienteData.telefone || '').trim();
  if (!telOriginal) return;

  const nomeOriginal = (clienteData.nome || 'Cliente').trim();
  const endereco = (entregaData && entregaData.endereco) ? entregaData.endereco.trim() : '';
  const bairro = (entregaData && entregaData.bairro) ? entregaData.bairro.trim() : '';
  const agora = dataHoraPedido || new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const valor = Number(valorPedido) || 0;

  let clienteExistente = encontrarClienteExistente(clienteData);

  if (clienteExistente) {
    // Chave única por telefone: já tem cliente cadastrado com esse número!
    // Aumenta o número de pedidos da mesma pessoa
    clienteExistente.totalPedidos = (clienteExistente.totalPedidos || 0) + 1;
    clienteExistente.totalGasto = Number(((clienteExistente.totalGasto || 0) + valor).toFixed(2));
    clienteExistente.ultimoPedido = agora;

    // Atualiza nome caso o novo seja mais completo ou o anterior fosse genérico
    if (nomeOriginal && nomeOriginal !== 'Cliente' && nomeOriginal !== 'Cliente VIP') {
      clienteExistente.nome = nomeOriginal;
    }
    // Atualiza endereço e bairro para o do último pedido feito
    if (endereco && endereco !== 'Balcão / Retirada') clienteExistente.endereco = endereco;
    if (bairro && bairro !== 'Jardim Tamoio') clienteExistente.bairro = bairro;
    if (telOriginal) clienteExistente.telefone = telOriginal;
  } else {
    // Novo contato com telefone inédito
    clientes.push({
      id: 'CLI-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      nome: nomeOriginal || 'Cliente VIP',
      telefone: telOriginal,
      endereco: endereco || 'Balcão / Retirada',
      bairro: bairro || 'Jardim Tamoio',
      totalPedidos: 1,
      totalGasto: Number(valor.toFixed(2)),
      primeiroPedido: agora,
      ultimoPedido: agora
    });
  }
  salvarClientes();
}

function sincronizarClientesComPedidos() {
  const todosOsPedidos = [...(historicoPedidos || []), ...(pedidos || [])];
  if (todosOsPedidos.length === 0) return;

  // Deduplica primeiro a lista existente
  deduplicarClientes();

  // Mapeia histórico consolidado de pedidos por número de telefone
  // Ordena pedidos do mais antigo para o mais recente para calcular primeiro e último pedido
  const pedidosOrdenados = [...todosOsPedidos].sort((a, b) => {
    const tA = Number((a.id || '').replace('PED-', '').split('-')[0]) || 0;
    const tB = Number((b.id || '').replace('PED-', '').split('-')[0]) || 0;
    return tA - tB;
  });

  const consolidadoPorTelefone = new Map();

  pedidosOrdenados.forEach(p => {
    if (!p.cliente || !p.cliente.telefone) return;
    const tel = p.cliente.telefone.trim();
    const chave = normalizarTelefone(tel).slice(-8) || normalizarTelefone(tel);
    if (!chave) return;

    const valor = Number(p.total) || 0;
    const dataHora = p.dataHora || '';
    const end = (p.entrega && p.entrega.endereco) || '';
    const bai = (p.entrega && p.entrega.bairro) || '';
    const nome = (p.cliente.nome || '').trim();

    if (!consolidadoPorTelefone.has(chave)) {
      consolidadoPorTelefone.set(chave, {
        nome: nome || 'Cliente VIP',
        telefone: tel,
        endereco: end || 'Balcão / Retirada',
        bairro: bai || 'Jardim Tamoio',
        totalPedidos: 1,
        totalGasto: valor,
        primeiroPedido: dataHora,
        ultimoPedido: dataHora
      });
    } else {
      const c = consolidadoPorTelefone.get(chave);
      c.totalPedidos += 1;
      c.totalGasto = Number((c.totalGasto + valor).toFixed(2));
      if (nome && nome !== 'Cliente' && (c.nome === 'Cliente' || nome.length > c.nome.length)) {
        c.nome = nome;
      }
      if (end && end !== 'Balcão / Retirada') c.endereco = end;
      if (bai && bai !== 'Jardim Tamoio') c.bairro = bai;
      c.ultimoPedido = dataHora;
    }
  });

  // Atualiza ou insere na lista de clientes VIP
  consolidadoPorTelefone.forEach((dadosConsolidados, chave) => {
    const existente = clientes.find(c => saoTelefonesIguais(c.telefone, dadosConsolidados.telefone));
    if (existente) {
      if (dadosConsolidados.nome && dadosConsolidados.nome !== 'Cliente' && (existente.nome === 'Cliente' || existente.nome === 'Cliente VIP' || dadosConsolidados.nome.length > existente.nome.length)) {
        existente.nome = dadosConsolidados.nome;
      }
      if (dadosConsolidados.endereco && dadosConsolidados.endereco !== 'Balcão / Retirada') existente.endereco = dadosConsolidados.endereco;
      if (dadosConsolidados.bairro && dadosConsolidados.bairro !== 'Jardim Tamoio') existente.bairro = dadosConsolidados.bairro;
      // Garante que o total de pedidos reflita com exatidão o histórico real dos pedidos
      existente.totalPedidos = Math.max(existente.totalPedidos || 0, dadosConsolidados.totalPedidos);
      existente.totalGasto = Number(Math.max(existente.totalGasto || 0, dadosConsolidados.totalGasto).toFixed(2));
      if (dadosConsolidados.ultimoPedido) existente.ultimoPedido = dadosConsolidados.ultimoPedido;
      if (!existente.primeiroPedido && dadosConsolidados.primeiroPedido) existente.primeiroPedido = dadosConsolidados.primeiroPedido;
    } else {
      clientes.push({
        id: 'CLI-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        nome: dadosConsolidados.nome || 'Cliente VIP',
        telefone: dadosConsolidados.telefone,
        endereco: dadosConsolidados.endereco || 'Balcão / Retirada',
        bairro: dadosConsolidados.bairro || 'Jardim Tamoio',
        totalPedidos: dadosConsolidados.totalPedidos,
        totalGasto: Number(dadosConsolidados.totalGasto.toFixed(2)),
        primeiroPedido: dadosConsolidados.primeiroPedido,
        ultimoPedido: dadosConsolidados.ultimoPedido
      });
    }
  });

  deduplicarClientes();
}

// Sincroniza clientes na inicialização do servidor
sincronizarClientesComPedidos();

// Lista de clientes conectados ao SSE (tempo real para a cozinha)
let sseClients = [];

function notificarCozinha(novoPedido) {
  sseClients.forEach(client => {
    try {
      client.res.write(`data: ${JSON.stringify(novoPedido)}\n\n`);
    } catch (e) {
      // Ignora clientes desconectados
    }
  });
  despacharEventoNuvem(novoPedido);
}

// SSE: Conexão em tempo real do painel da cozinha
app.get(['/api/pedidos/stream', '/pedidos/stream'], (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.write('\n');

  const clientId = Date.now();
  sseClients.push({ id: clientId, res });

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// Cardápio Oficial de O Mordidaço (100% Cachorro Quente)
const CARDAPIO = {
  restaurante: {
    nome: "O Mordidaço",
    segmento: "Hot-Dogueria Artesanal",
    slogan: "A mordida mais caprichada de Campinas !",
    endereco: "Jardim Tamoio, Campinas - SP",
    tempoEntrega: "35 a 50 min",
    taxaEntregaPadrao: 5.00,
    whatsapp: "5519997881550"
  },
  categorias: [
    {
      id: "combos",
      nome: "⭐ Combos Campeões (Mais Pedidos)",
      itens: [
        {
          id: "combo-casal",
          nome: "Combo Casal do Mordidaço",
          descricao: "2 Dogs Duplos Especiais (escolha individual no Pão ou no Prato para cada um) + 2 Refrigerantes Lata (ou 1 Guaraná 2L) + 2 Potes de Maionese Verde Secreta da Casa (50ml). A janta perfeita para dois!",
          preco: 49.90,
          adicionalPrato: 2.00,
          permiteFormato: true,
          lanchesCombo: [
            { label: "1º Dog Duplo Especial" },
            { label: "2º Dog Duplo Especial" }
          ],
          destaque: true,
          isLanche: true
        },
        {
          id: "combo-familia",
          nome: "Combo Família do Tamoio",
          descricao: "2 Dogs Duplos Especiais + 1 Dog Tradicional (escolha individual no Pão ou no Prato para cada um) + 1 Guaraná Antarctica 2 Litros + 2 Potes de Maionese Verde da Casa. Fartura garantida para toda a família!",
          preco: 62.00,
          adicionalPrato: 2.00,
          permiteFormato: true,
          lanchesCombo: [
            { label: "1º Dog Duplo Especial" },
            { label: "2º Dog Duplo Especial" },
            { label: "3º Dog Tradicional" }
          ],
          destaque: false,
          isLanche: true
        }
      ]
    },
    {
      id: "hotdogs",
      nome: "🌭 Hot Dogs Artesanais (No Pão ou No Prato)",
      itens: [
        {
          id: "dog-tradicional",
          nome: "Dog Tradicional do Mordidaço",
          descricao: "Purê de batata artesanal cremoso, 1 salsicha suculenta no molho caseiro, milho, vinagrete suave, maionese verde da casa, batata palha e queijo parmesão ralado na hora. Escolha no Pão macio ou no Prato (Marmitinha 500ml).",
          preco: 16.00,
          adicionalPrato: 1.00,
          permiteFormato: true,
          destaque: false,
          isLanche: true
        },
        {
          id: "dog-duplo",
          nome: "Dog Duplo Especial do Mordidaço",
          descricao: "O campeão de vendas! 2 salsichas, dobro de queijo muçarela (2 fatias generosas derretidas no calor do molho), purê cremoso artesanal, molho caseiro, milho, vinagrete, maionese verde, batata palha e chuva de parmesão ralado.",
          preco: 20.00,
          adicionalPrato: 2.00,
          permiteFormato: true,
          destaque: true,
          isLanche: true
        },
        {
          id: "dog-bacon",
          nome: "Dog Bacon Supreme",
          descricao: "2 salsichas, muito bacon em cubos dourados e crocantes, queijo muçarela derretido no molho, purê de batata artesanal, molho caseiro e batata palha crocante.",
          preco: 24.00,
          adicionalPrato: 2.00,
          permiteFormato: true,
          destaque: false,
          isLanche: true
        },
        {
          id: "dog-frango",
          nome: "Dog Frango Cremoso c/ Catupiry",
          descricao: "1 salsicha, peito de frango desfiado artesanal bem temperado, Catupiry original em espiral generosa, purê de batata artesanal e batata palha crocante.",
          preco: 25.00,
          adicionalPrato: 2.00,
          permiteFormato: true,
          destaque: false,
          isLanche: true
        }
      ]
    },
    {
      id: "bebidas",
      nome: "🥤 Bebidas Geladas",
      itens: [
        { id: "refri-coca-lata", nome: "Coca-Cola Original 350ml (Lata)", preco: 6.00 },
        { id: "refri-guarana-lata", nome: "Guaraná Antarctica 350ml (Lata)", preco: 6.00 },
        { id: "refri-fanta-lata", nome: "Fanta Laranja 350ml (Lata)", preco: 6.00 },
        { id: "refri-guarana-2l", nome: "Guaraná Antarctica 2 Litros", preco: 12.00 },
        { id: "agua-mineral", nome: "Água Mineral 500ml (sem gás)", preco: 4.00 }
      ]
    },
    {
      id: "adicionais",
      nome: "🥫 Molhos & Adicionais Extras",
      itens: [
        { id: "add-maionese", nome: "Pote Extra de Maionese Verde (50ml)", preco: 3.50 },
        { id: "add-bacon", nome: "Bacon Crocante Extra em Cubos", preco: 4.50 },
        { id: "add-catupiry", nome: "Catupiry Original Extra", preco: 4.00 },
        { id: "add-batata-palha", nome: "Batata Palha Crocante Extra", preco: 2.50 }
      ]
    }
  ]
};

// Rota amigável para o Painel da Cozinha
app.get('/cozinha', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cozinha.html'));
});

// Obter Cardápio
app.get(['/api/cardapio', '/cardapio'], (req, res) => {
  res.json(CARDAPIO);
});

// Listar Pedidos (para a Cozinha)
app.get(['/api/pedidos', '/pedidos'], async (req, res) => {
  recarregarPedidosDoDisco();
  if (KV_URL && KV_TOKEN) {
    await carregarPedidosNuvem();
  }
  // Garante timestamp de atualização em pedidos legados
  pedidos.forEach(p => {
    if (!p.statusAtualizadoEm) {
      const tsFromId = Number((p.id || '').replace('PED-', ''));
      p.statusAtualizadoEm = !isNaN(tsFromId) && tsFromId > 0 ? tsFromId : 0;
    }
  });
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.json(pedidos);
});

// Gerador de número de pedido sequencial limpo e determinístico
async function obterProximoNumeroPedido() {
  recarregarPedidosDoDisco();
  recarregarHistoricoDoDisco();

  let max = 100;
  pedidos.forEach(p => {
    const n = Number(p.numero);
    if (!isNaN(n) && n > max) max = n;
  });
  historicoPedidos.forEach(h => {
    const n = Number(h.numero);
    if (!isNaN(n) && n > max) max = n;
  });

  return max + 1;
}

// Buscar Detalhes de um Pedido Específico (para Acompanhamento em Tempo Real)
app.get(['/api/pedidos/:id', '/pedidos/:id'], async (req, res) => {
  recarregarPedidosDoDisco();
  recarregarHistoricoDoDisco();
  if (KV_URL && KV_TOKEN) {
    await carregarPedidosNuvem();
  }
  const { id } = req.params;
  let pedido = pedidos.find(p => p.id === id || String(p.numero) === String(id));
  if (!pedido) {
    pedido = historicoPedidos.find(p => p.id === id || String(p.numero) === String(id));
  }
  if (!pedido) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.json(pedido);
});

// Rota de visualização direta do rastreamento no navegador
app.get(['/pedido/:id', '/acompanhar/:id'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Receber Novo Pedido
app.post(['/api/pedidos', '/pedidos'], async (req, res) => {
  recarregarPedidosDoDisco();
  if (KV_URL && KV_TOKEN) {
    await carregarPedidosNuvem();
  }
  try {
    const body = req.body || {};
    const { cliente, itens, entrega, pagamento, observacoes, subtotal, taxaEntrega, total, acompanharWhatsapp } = body;

    if (!cliente || !cliente.nome || !cliente.telefone || !itens || itens.length === 0) {
      return res.status(400).json({ error: 'Dados incompletos do pedido.' });
    }

    const proximoNumero = await obterProximoNumeroPedido();
    const agora = Date.now();
    const uniqueSuffix = Math.floor(Math.random() * 10000);

    const novoPedido = {
      id: 'PED-' + agora + '-' + uniqueSuffix,
      numero: proximoNumero,
      dataHora: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      status: 'Pendente',
      statusAtualizadoEm: agora,
      acompanharWhatsapp: acompanharWhatsapp !== undefined ? Boolean(acompanharWhatsapp) : true,
      cliente,
      itens,
      entrega: entrega || { endereco: 'Balcão / Retirada', bairro: 'Jardim Tamoio' },
      pagamento: pagamento || 'A Combinar na Entrega',
      observacoes: observacoes || '',
      subtotal: Number(subtotal) || 0,
      taxaEntrega: Number(taxaEntrega) || 0,
      total: Number(total) || 0
    };

    pedidos.unshift(novoPedido);
    salvarPedidos();
    if (KV_URL && KV_TOKEN) {
      await salvarPedidosNuvem();
    }

    // Salva ou atualiza cliente na lista VIP de forma invisível
    registrarOuAtualizarCliente(cliente, entrega, total);
    if (KV_URL && KV_TOKEN) {
      await salvarClientesNuvem();
    }

    // Avisa a tela da cozinha em tempo real (Local SSE + Cloud SSE ntfy.sh)
    notificarCozinha(novoPedido);

    res.status(201).json(novoPedido);
  } catch (err) {
    console.error('Erro ao processar pedido:', err);
    res.status(500).json({ error: 'Erro interno ao processar pedido: ' + err.message });
  }
});

// Ativar Opt-in de Acompanhamento no WhatsApp após clique na tela de sucesso
app.post(['/api/pedidos/:id/acompanhar-whatsapp', '/pedidos/:id/acompanhar-whatsapp'], async (req, res) => {
  recarregarPedidosDoDisco();
  const { id } = req.params;
  const pedido = pedidos.find(p => p.id === id);
  if (pedido) {
    pedido.acompanharWhatsapp = true;
    salvarPedidos();
    if (KV_URL && KV_TOKEN) {
      await salvarPedidosNuvem();
    }
    notificarCozinha({
      tipo: 'optin_whatsapp',
      id,
      numero: pedido.numero
    });
  }
  res.json({ success: true, acompanharWhatsapp: true });
});

// Listar Clientes VIP (invisível aos clientes, exclusivo para o painel administrativo)
app.get(['/api/clientes', '/clientes'], async (req, res) => {
  recarregarClientesDoDisco();
  recarregarPedidosDoDisco();
  if (KV_URL && KV_TOKEN) {
    await carregarPedidosNuvem();
    await carregarClientesNuvem();
  }
  sincronizarClientesComPedidos();
  if (KV_URL && KV_TOKEN) {
    await salvarClientesNuvem();
  }
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.json(clientes);
});

// Atualizar Status do Pedido (Ex: Em Preparo, Saiu para Entrega)
app.patch(['/api/pedidos/:id/status', '/pedidos/:id/status'], async (req, res) => {
  recarregarPedidosDoDisco();
  recarregarHistoricoDoDisco();
  if (KV_URL && KV_TOKEN) {
    await carregarPedidosNuvem();
  }
  const { id } = req.params;
  const { status, statusAtualizadoEm, pedidoCompleto } = req.body || {};

  const timestampAtualizacao = Number(statusAtualizadoEm) || Date.now();

  let pedido = pedidos.find(p => p.id === id);
  let encontradoNoHistorico = false;

  if (!pedido) {
    pedido = historicoPedidos.find(p => p.id === id);
    if (pedido) encontradoNoHistorico = true;
  }

  if (!pedido) {
    // Se o pedido não estava em memória, hidrata com o pedidoCompleto enviado pela cozinha
    if (pedidoCompleto && pedidoCompleto.id) {
      pedido = {
        ...pedidoCompleto,
        status: status || pedidoCompleto.status || 'Pendente',
        statusAtualizadoEm: timestampAtualizacao
      };
    } else {
      pedido = {
        id,
        status: status || 'Pendente',
        statusAtualizadoEm: timestampAtualizacao
      };
    }
    pedidos.unshift(pedido);
  } else {
    // Se o pedido já existia mas faltavam dados essenciais (como número ou itens)
    if (pedidoCompleto && (!pedido.numero || !pedido.itens || !pedido.total)) {
      Object.assign(pedido, pedidoCompleto);
    }
    pedido.status = status;
    pedido.statusAtualizadoEm = timestampAtualizacao;
  }

  salvarPedidos();
  if (encontradoNoHistorico) {
    salvarHistorico();
  }

  if (KV_URL && KV_TOKEN) {
    await salvarPedidosNuvem();
  }

  // Notifica painel da cozinha com versão temporal
  notificarCozinha({
    tipo: 'status_atualizado',
    id,
    status: pedido.status,
    statusAtualizadoEm: pedido.statusAtualizadoEm,
    numero: pedido.numero
  });

  res.json(pedido);
});

// Listar Histórico de Pedidos Anteriores
app.get(['/api/pedidos/historico', '/pedidos/historico'], (req, res) => {
  recarregarHistoricoDoDisco();
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.json(historicoPedidos);
});

// Fechar Caixa / Resetar Pedidos do Dia (Arquiva no histórico e limpa o painel da cozinha)
// OS CLIENTES VIP NUNCA SÃO RESETADOS!
app.post(['/api/pedidos/fechar-dia', '/api/pedidos/reset', '/pedidos/fechar-dia', '/pedidos/reset'], async (req, res) => {
  recarregarPedidosDoDisco();
  recarregarHistoricoDoDisco();

  const pedidosParaArquivar = [...pedidos];
  let arquivadosCount = 0;

  pedidosParaArquivar.forEach(p => {
    if (!p || !p.id) return;
    const jaTemNoHistorico = historicoPedidos.some(h => h.id === p.id);
    if (!jaTemNoHistorico) {
      historicoPedidos.unshift(p);
      arquivadosCount++;
    }
  });

  // Limpa os pedidos ativos do dia
  pedidos = [];
  salvarPedidos();
  salvarHistorico();

  // Limpa também na nuvem se KV estiver configurado
  if (KV_URL && KV_TOKEN) {
    try {
      await fetch(`${KV_URL}/set/omordidaco_pedidos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
        body: JSON.stringify([])
      });
      await fetch(`${KV_URL}/set/omordidaco_historico`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
        body: JSON.stringify(historicoPedidos)
      });
    } catch (e) {}
  }

  // Reseta o contador cloud para 100 para o próximo dia começar limpo do #101
  try {
    await fetch(`https://api.restful-api.dev/objects/${COUNTER_STORE_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'omordidaco_order_counter',
        data: { current: 100, lastUpdated: Date.now() }
      })
    });
  } catch (e) {}

  // Notifica a cozinha em tempo real de que o dia foi encerrado
  notificarCozinha({
    tipo: 'pedidos_resetados',
    dataFechamento: new Date().toLocaleDateString('pt-BR')
  });

  res.json({
    success: true,
    message: 'Expediente encerrado com sucesso! Pedidos arquivados no histórico.',
    arquivados: arquivadosCount,
    totalHistorico: historicoPedidos.length
  });
});

// Reset Total do Sistema (Limpa Pedidos Ativos, Histórico e Clientes, e reinicia em #101)
app.post(['/api/pedidos/reset-total', '/pedidos/reset-total'], async (req, res) => {
  pedidos = [];
  historicoPedidos = [];
  clientes = [];

  salvarPedidos();
  salvarHistorico();
  salvarClientes();

  if (KV_URL && KV_TOKEN) {
    try {
      await fetch(`${KV_URL}/set/omordidaco_pedidos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
        body: JSON.stringify([])
      });
      await fetch(`${KV_URL}/set/omordidaco_historico`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
        body: JSON.stringify([])
      });
      await fetch(`${KV_URL}/set/omordidaco_clientes`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
        body: JSON.stringify([])
      });
    } catch (e) {}
  }

  notificarCozinha({
    tipo: 'pedidos_resetados',
    resetTotal: true,
    timestamp: Date.now()
  });

  res.json({
    success: true,
    message: 'Todos os pedidos e histórico foram completamente resetados! Próximo pedido iniciará no #101.'
  });
});

// Exporta o app para o Vercel Serverless
module.exports = app;

// Se for executado diretamente no terminal (iniciar_sistema.bat / node server.js)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🌭 O MORDIDAÇO - Sistema de Pedidos & Cozinha`);
    console.log(`📱 Cardápio do Cliente: http://localhost:${PORT}`);
    console.log(`👨‍🍳 Painel da Cozinha / Impressão: http://localhost:${PORT}/cozinha.html`);
    console.log(`=================================================`);
  });
}
