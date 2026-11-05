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
const CLIENTES_FILE = isServerless ? path.join(os.tmpdir(), 'clientes.json') : path.join(__dirname, 'clientes.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Inicializar banco de dados JSON de Pedidos
let pedidos = [];
if (fs.existsSync(DB_FILE)) {
  try {
    pedidos = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
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

// Inicializar banco de dados JSON de Clientes VIP (invisível aos clientes)
let clientes = [];
if (fs.existsSync(CLIENTES_FILE)) {
  try {
    clientes = JSON.parse(fs.readFileSync(CLIENTES_FILE, 'utf8'));
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

function registrarOuAtualizarCliente(clienteData, entregaData, valorPedido) {
  const telLimpo = (clienteData.telefone || '').replace(/\D/g, '');
  if (!telLimpo) return;

  const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  let clienteExistente = clientes.find(c => c.telefone.replace(/\D/g, '') === telLimpo);

  if (clienteExistente) {
    clienteExistente.nome = clienteData.nome || clienteExistente.nome;
    clienteExistente.endereco = entregaData.endereco || clienteExistente.endereco;
    clienteExistente.bairro = entregaData.bairro || clienteExistente.bairro;
    clienteExistente.totalPedidos += 1;
    clienteExistente.totalGasto += Number(valorPedido);
    clienteExistente.ultimoPedido = agora;
  } else {
    clientes.push({
      id: 'CLI-' + Date.now(),
      nome: clienteData.nome,
      telefone: clienteData.telefone,
      endereco: entregaData.endereco,
      bairro: entregaData.bairro,
      totalPedidos: 1,
      totalGasto: Number(valorPedido),
      primeiroPedido: agora,
      ultimoPedido: agora
    });
  }
  salvarClientes();
}

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
    whatsapp: "5519997981104"
  },
  categorias: [
    {
      id: "combos",
      nome: "⭐ Combos Campeões (Mais Pedidos)",
      itens: [
        {
          id: "combo-casal",
          nome: "Combo Casal do Mordidaço",
          descricao: "2 Dogs Duplos Especiais (à sua escolha: Tradicional no Pão ou No Prato) + 2 Refrigerantes Lata (ou 1 Guaraná 2L) + 2 Potes de Maionese Verde Secreta da Casa (50ml). A janta perfeita para dois!",
          preco: 49.90,
          permiteFormato: true,
          destaque: true
        },
        {
          id: "combo-familia",
          nome: "Combo Família do Tamoio",
          descricao: "2 Dogs Duplos Especiais + 1 Dog Tradicional + 1 Guaraná Antarctica 2 Litros + 2 Potes de Maionese Verde da Casa. Fartura garantida para toda a família!",
          preco: 62.00,
          permiteFormato: true,
          destaque: false
        }
      ]
    },
    {
      id: "tradicionais",
      nome: "🌭 Hot Dogs Tradicionais de Rua (No Pão)",
      itens: [
        {
          id: "dog-tradicional-pao",
          nome: "Hot Dog Tradicional (No Pão)",
          descricao: "Pão macio aberto por cima, purê de batata artesanal cremoso, 1 salsicha suculenta no molho caseiro, milho, vinagrete suave, maionese verde da casa, batata palha e coroado com queijo parmesão ralado na hora.",
          preco: 16.00,
          formato: "Tradicional no Pão"
        },
        {
          id: "dog-duplo-pao",
          nome: "Hot Dog Duplo Especial (No Pão)",
          descricao: "O campeão de vendas! 2 salsichas, dobro de queijo muçarela (2 fatias que derretem no calor do molho), purê cremoso artesanal, molho caseiro, milho, vinagrete, maionese verde, batata palha e chuva de parmesão ralado.",
          preco: 20.00,
          formato: "Tradicional no Pão",
          destaque: true
        },
        {
          id: "dog-bacon-pao",
          nome: "Hot Dog Bacon Supreme (No Pão)",
          descricao: "2 salsichas, muito bacon em cubos dourados e crocantes, queijo muçarela derretido, purê de batata artesanal, molho caseiro e batata palha crocante.",
          preco: 24.00,
          formato: "Tradicional no Pão"
        },
        {
          id: "dog-frango-pao",
          nome: "Hot Dog Frango Cremoso c/ Catupiry (No Pão)",
          descricao: "1 salsicha, peito de frango desfiado artesanal bem temperado, Catupiry original em espiral generosa, purê de batata artesanal e batata palha.",
          preco: 25.00,
          formato: "Tradicional no Pão"
        }
      ]
    },
    {
      id: "noprato",
      nome: "🥣 Hot Dogs No Prato (Marmitinha Térmica 500ml - Sem Pão)",
      itens: [
        {
          id: "dog-tradicional-prato",
          nome: "Hot Dog Tradicional No Prato",
          descricao: "Sem pão! Na marmitinha térmica de 500ml com base reforçada de purê (+40g), salsicha em rodelas bem quente com molho caseiro, milho, vinagrete, maionese verde e batata palha. Acompanha garfo reforçado.",
          preco: 17.00,
          formato: "No Prato (Sem Pão)"
        },
        {
          id: "dog-duplo-prato",
          nome: "Hot Dog Duplo Especial No Prato",
          descricao: "A janta no sofá perfeita! 2 salsichas em rodelas, 2 fatias de muçarela derretida no calor do molho, purê de batata reforçado, molho caseiro, milho, vinagrete e batata palha. Acompanha garfo reforçado.",
          preco: 22.00,
          formato: "No Prato (Sem Pão)",
          destaque: true
        },
        {
          id: "dog-bacon-prato",
          nome: "Hot Dog Bacon Supreme No Prato",
          descricao: "Sem pão! 2 salsichas fatiadas, cubos de bacon crocante, muçarela derretida no molho e purê cremoso com garfo reforçado.",
          preco: 26.00,
          formato: "No Prato (Sem Pão)"
        },
        {
          id: "dog-frango-prato",
          nome: "Hot Dog Frango Cremoso c/ Catupiry No Prato",
          descricao: "Sem pão! Frango desfiado suculento, Catupiry original, 1 salsicha fatiada, purê reforçado e garfo reforçado.",
          preco: 27.00,
          formato: "No Prato (Sem Pão)"
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
        { id: "add-queijo", nome: "Queijo Muçarela Derretido Extra", preco: 3.50 },
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
app.get(['/api/pedidos', '/pedidos'], (req, res) => {
  res.json(pedidos);
});

// Receber Novo Pedido
app.post(['/api/pedidos', '/pedidos'], (req, res) => {
  try {
    const { cliente, itens, entrega, pagamento, observacoes, subtotal, taxaEntrega, total } = req.body;

    if (!cliente || !cliente.nome || !cliente.telefone || !itens || itens.length === 0) {
      return res.status(400).json({ error: 'Dados incompletos do pedido.' });
    }

    const proximoNumero = pedidos.length > 0 ? (pedidos[0].numero || 100) + 1 : 101;

    const novoPedido = {
      id: 'PED-' + Date.now(),
      numero: proximoNumero,
      dataHora: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      status: 'Pendente',
      cliente,
      itens,
      entrega,
      pagamento,
      observacoes: observacoes || '',
      subtotal: Number(subtotal),
      taxaEntrega: Number(taxaEntrega),
      total: Number(total)
    };

    pedidos.unshift(novoPedido);
    salvarPedidos();

    // Salva ou atualiza cliente na lista VIP de forma invisível
    registrarOuAtualizarCliente(cliente, entrega, total);

    // Avisa a tela da cozinha em tempo real
    notificarCozinha(novoPedido);

    res.status(201).json(novoPedido);
  } catch (err) {
    console.error('Erro ao processar pedido:', err);
    res.status(500).json({ error: 'Erro interno ao processar pedido: ' + err.message });
  }
});

// Listar Clientes VIP (invisível aos clientes, exclusivo para o painel administrativo)
app.get(['/api/clientes', '/clientes'], (req, res) => {
  res.json(clientes);
});

// Atualizar Status do Pedido (Ex: Em Preparo, Saiu para Entrega)
app.patch(['/api/pedidos/:id/status', '/pedidos/:id/status'], (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const pedido = pedidos.find(p => p.id === id);
  if (!pedido) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }

  pedido.status = status;
  salvarPedidos();

  // Notifica painel da cozinha
  notificarCozinha({ tipo: 'status_atualizado', id, status });

  res.json(pedido);
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
