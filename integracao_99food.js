/**
 * Módulo de Integração Oficial com a API da 99Food (DiDi Food Open API)
 * Loja: O Mordidaço - Hot-Dogueria Artesanal
 */

const FOOD99_APP_ID = process.env.FOOD99_APP_ID || '5764607596705613899';
const FOOD99_APP_SECRET = process.env.FOOD99_APP_SECRET || '86252f9902d2155cf74d82a542e3c415';
const FOOD99_APP_SHOP_ID = process.env.FOOD99_APP_SHOP_ID || 'mordidaco_tamoio_1';

const BASE_URL_99 = 'https://openapi.99food.com';

let tokenEmCache99 = null;
let tokenExpiraEm99 = 0;

// BUFFER DE LOGS EM MEMÓRIA PARA A COZINHA
const logs99Food = [];

function registrarLog99(tipo, mensagem, detalhes = null) {
  const agora = new Date().toLocaleTimeString('pt-BR');
  const item = {
    hora: agora,
    tipo,
    mensagem,
    detalhes: detalhes ? (typeof detalhes === 'object' ? JSON.stringify(detalhes) : String(detalhes)) : null
  };
  logs99Food.unshift(item);
  if (logs99Food.length > 60) logs99Food.pop();
  console.log(`[99Food ${tipo}] ${mensagem}`);
}

function obterLogs99() {
  return logs99Food;
}

/**
 * Obtém ou renova o AuthToken da loja na 99Food
 */
async function obterTokenAcesso99() {
  const agora = Date.now();
  if (tokenEmCache99 && tokenExpiraEm99 > agora + 60000) {
    return tokenEmCache99;
  }

  try {
    const url = `${BASE_URL_99}/v1/auth/authtoken/get?app_id=${FOOD99_APP_ID}&app_secret=${FOOD99_APP_SECRET}&app_shop_id=${FOOD99_APP_SHOP_ID}`;
    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text();
      registrarLog99('ERRO', `Falha ao obter token 99Food (${res.status}): ${errText}`);
      return null;
    }

    const data = await res.json();
    if (data.errno === 0 && data.data && data.data.auth_token) {
      tokenEmCache99 = data.data.auth_token;
      tokenExpiraEm99 = (data.data.token_expiration_time * 1000) || (Date.now() + 3600000);
      registrarLog99('INFO', 'Token de autenticação 99Food atualizado com sucesso.');
      return tokenEmCache99;
    } else {
      registrarLog99('AVISO', `Resposta inesperada na autenticação 99Food: ${data.errmsg || 'Desconhecido'}`);
      return null;
    }
  } catch (err) {
    registrarLog99('ERRO', `Erro de rede ao conectar à 99Food: ${err.message}`);
    return null;
  }
}

/**
 * Confirma o pedido na API da 99Food (Move para Em Preparo)
 */
async function confirmarPedido99(orderId) {
  try {
    const token = await obterTokenAcesso99();
    if (!token) return false;

    const res = await fetch(`${BASE_URL_99}/v1/order/order/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: token,
        order_id: String(orderId)
      })
    });

    const data = await res.json();
    if (data.errno === 0) {
      registrarLog99('SUCESSO', `Pedido 99Food #${orderId} confirmado na API.`);
      return true;
    } else {
      registrarLog99('ERRO', `Falha ao confirmar pedido 99Food #${orderId}: ${data.errmsg}`);
      return false;
    }
  } catch (err) {
    registrarLog99('ERRO', `Erro ao confirmar pedido 99Food #${orderId}: ${err.message}`);
    return false;
  }
}

/**
 * Informa que o pedido está pronto para coleta (Despacha motoboy da 99)
 */
async function marcarPedidoPronto99(orderId) {
  try {
    const token = await obterTokenAcesso99();
    if (!token) return false;

    const url = `${BASE_URL_99}/v1/order/order/ready?auth_token=${encodeURIComponent(token)}&order_id=${encodeURIComponent(String(orderId))}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.errno === 0) {
      registrarLog99('SUCESSO', `Pedido 99Food #${orderId} marcado como PRONTO para o motoboy.`);
      return true;
    } else {
      registrarLog99('ERRO', `Falha ao marcar pedido 99Food #${orderId} como pronto: ${data.errmsg}`);
      return false;
    }
  } catch (err) {
    registrarLog99('ERRO', `Erro ao marcar pedido 99Food #${orderId} como pronto: ${err.message}`);
    return false;
  }
}

/**
 * Informa que o pedido foi entregue (somente para entrega própria da loja)
 */
async function marcarPedidoEntregue99(orderId) {
  try {
    const token = await obterTokenAcesso99();
    if (!token) return false;

    const url = `${BASE_URL_99}/v1/order/order/delivered?auth_token=${encodeURIComponent(token)}&order_id=${encodeURIComponent(String(orderId))}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.errno === 0) {
      registrarLog99('SUCESSO', `Pedido 99Food #${orderId} finalizado como ENTREGUE.`);
      return true;
    }
    return false;
  } catch (err) {
    registrarLog99('ERRO', `Erro ao finalizar pedido 99Food #${orderId}: ${err.message}`);
    return false;
  }
}

/**
 * Converte o payload de pedido da 99Food (OrderModel) para o formato interno do KDS O Mordidaço
 */
function converterPedido99ParaInterno(rawOrder) {
  if (!rawOrder) return null;
  const order99 = rawOrder.order_info || (rawOrder.data && rawOrder.data.order_info) || rawOrder.data || rawOrder;
  const orderId = String(order99.order_id || rawOrder.order_id || Date.now());
  const orderIndex = String(order99.order_index || rawOrder.order_index || Math.floor(100 + Math.random() * 900));

  // Converte itens e adicionais
  const itensFormatados = (order99.order_items || rawOrder.order_items || []).map(item => {
    let precoUnit = (item.total_price || item.sku_price || 0) / 100;
    let adicionaisStr = '';

    if (item.sub_item_list && item.sub_item_list.length > 0) {
      adicionaisStr = item.sub_item_list.map(s => s.name || s.app_item_id).join(', ');
    }

    return {
      id: item.app_item_id || '99_item',
      nome: item.name || 'Cachorro Quente 99Food',
      formato: adicionaisStr ? `Opções: ${adicionaisStr}` : 'Tradicional no Pão',
      preco: precoUnit,
      quantidade: item.amount || 1,
      observacoes: item.remark || ''
    };
  });

  // Endereço de entrega
  const end = order99.receive_address || rawOrder.receive_address || {};
  const enderecoFormatado = end.poi_address ? `${end.poi_address}, nº ${end.house_number || 'S/N'}` : (end.name ? `Cliente: ${end.name}` : 'Entrega parceira 99Food');
  const bairroFormatado = end.poi_display_name || end.district || 'Campinas - SP';

  // Valores financeiros (convertidos de centavos)
  const priceObj = order99.price || rawOrder.price || {};
  const subtotal = (priceObj.order_price || 0) / 100;
  const taxaEntrega = (priceObj.delivery_price || 0) / 100;
  const total = (priceObj.real_price || priceObj.real_pay_price || (subtotal + taxaEntrega)) / 100;

  // Pagamento: se entrega pela 99, a loja sempre recebe digitalmente online
  const isEntrega99 = order99.delivery_type === 1;
  const pagtoLabel = isEntrega99 ? '99Food Online (Já Pago pela Plataforma)' : (order99.pay_type === 2 ? 'Dinheiro (Cobrar na Entrega)' : '99Pay / Cartão Online');

  return {
    id: `99_${orderId}`,
    numero: `99_${orderIndex}`,
    dataHora: new Date().toLocaleString('pt-BR'),
    timestamp: Date.now(),
    origem: '99Food',
    deliveryType: order99.delivery_type || 1,
    status: 'Pendente',
    cliente: {
      nome: end.receiver_name || `Cliente 99Food (#${orderIndex})`,
      telefone: order99.virtual_phone_number || '(19) 99788-1550'
    },
    entrega: {
      endereco: enderecoFormatado,
      bairro: bairroFormatado,
      referencia: end.remark || '',
      cep: ''
    },
    itens: itensFormatados.length > 0 ? itensFormatados : [
      {
        id: '99_dog_combo',
        nome: 'Combo Casal do Mordidaço (99Food)',
        formato: 'Tradicional no Pão Sadia',
        preco: 49.90,
        observacoes: ''
      }
    ],
    pagamento: pagtoLabel,
    subtotal: subtotal || 49.90,
    taxaEntrega: taxaEntrega || 0.00,
    total: total || 49.90
  };
}

/**
 * Cria uma simulação realista de pedido 99Food para teste de homologação no KDS
 */
function criarPedidoSimulado99Food() {
  const agora = new Date();
  const indexSimulado = Math.floor(10 + Math.random() * 89);
  const idSimulado = Date.now();

  const pedido99Mock = {
    order_id: idSimulado,
    order_index: indexSimulado,
    status: 1, // Novo pedido
    delivery_type: 1, // Entrega pela 99
    pay_type: 1, // Online
    virtual_phone_number: '0800 042 9999 (PIN 8492)',
    receive_address: {
      receiver_name: 'Juliana Mendes',
      poi_address: 'Av. Engenheiro Augusto Figueiredo',
      house_number: '850',
      poi_display_name: 'Swift / Campinas',
      remark: 'Bloco B - Apto 34'
    },
    price: {
      order_price: 5580, // R$ 55,80
      delivery_price: 699, // R$ 6,99
      real_price: 5580, // Loja recebe valor do produto
      real_pay_price: 6279
    },
    order_items: [
      {
        app_item_id: 'dog_duplo_especial_99',
        name: 'Dog Duplo Especial do Mordidaço (Sadia)',
        amount: 2,
        sku_price: 2790,
        total_price: 5580,
        remark: 'Um deles sem vinagrete, por favor!',
        sub_item_list: [
          { app_item_id: 'opt_tradicional', name: 'No Pão Macio Bambini' },
          { app_item_id: 'opt_parmesao', name: 'Parmesão Ralado Fresco' }
        ]
      }
    ]
  };

  return converterPedido99ParaInterno(pedido99Mock);
}

module.exports = {
  obterTokenAcesso99,
  confirmarPedido99,
  marcarPedidoPronto99,
  marcarPedidoEntregue99,
  converterPedido99ParaInterno,
  criarPedidoSimulado99Food,
  obterLogs99,
  registrarLog99
};
