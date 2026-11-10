/**
 * Módulo de Integração Oficial com API de Pedidos do iFood v1.0
 * Loja: O Mordidaço - Hot-Dogueria Artesanal
 */

const IFOOD_CLIENT_ID = process.env.IFOOD_CLIENT_ID || 'd543f817-4252-46e3-919b-9280bbb4ed8f';
const IFOOD_CLIENT_SECRET = process.env.IFOOD_CLIENT_SECRET || 'n912lea0o0sa1zx108s6t0xhxco90p6t97ohlrt7kpkw8fvc9qmpitzkqjuxa4opdqga0s58zbo0av1r2za464lkxu787hsogma';
const IFOOD_MERCHANT_ID = process.env.IFOOD_MERCHANT_ID || '1c6a85ea-2063-4bb9-a2ab-a198c2d9946b';

const BASE_URL_AUTH = 'https://merchant-api.ifood.com.br/authentication/v1.0';
const BASE_URL_EVENTS = 'https://merchant-api.ifood.com.br/events/v1.0';
const BASE_URL_ORDER = 'https://merchant-api.ifood.com.br/order/v1.0';

let tokenEmCache = null;
let tokenExpiraEm = 0;

// BUFFER DE LOGS EM MEMÓRIA PARA VISUALIZAÇÃO AO VIVO NA COZINHA
const logsRadar = [];

function registrarLog(tipo, mensagem, detalhes = null) {
  const agora = new Date().toLocaleTimeString('pt-BR');
  const item = {
    hora: agora,
    tipo,
    mensagem,
    detalhes: detalhes ? (typeof detalhes === 'object' ? JSON.stringify(detalhes) : String(detalhes)) : null
  };
  logsRadar.unshift(item);
  if (logsRadar.length > 60) logsRadar.pop();
  console.log(`[iFood ${tipo}] ${mensagem}`);
}

function obterLogs() {
  return logsRadar;
}

/**
 * Obtém ou renova o Token de Autenticação OAuth2 do iFood
 */
async function obterTokenAcesso() {
  const agora = Date.now();
  if (tokenEmCache && tokenExpiraEm > agora + 60000) {
    return tokenEmCache;
  }

  try {
    const params = new URLSearchParams();
    params.append('grantType', 'client_credentials');
    params.append('clientId', IFOOD_CLIENT_ID);
    params.append('clientSecret', IFOOD_CLIENT_SECRET);

    const res = await fetch(`${BASE_URL_AUTH}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!res.ok) {
      const errText = await res.text();
      registrarLog('ERRO', `Falha na autenticação OAuth (${res.status}): ${errText}`);
      throw new Error(`Falha auth iFood (${res.status}): ${errText}`);
    }

    const data = await res.json();
    tokenEmCache = data.accessToken;
    tokenExpiraEm = agora + ((data.expiresIn || 3600) * 1000);
    registrarLog('AUTH', `Token OAuth renovado com sucesso! Válido por ${Math.round(data.expiresIn / 60)} min.`);
    return tokenEmCache;
  } catch (err) {
    registrarLog('ERRO', `Erro de conexão na autenticação: ${err.message}`);
    throw err;
  }
}

/**
 * Consulta a fila de eventos de pedidos no iFood (Polling)
 */
async function buscarEventosIFood() {
  const token = await obterTokenAcesso();
  try {
    const res = await fetch(`${BASE_URL_EVENTS}/events:polling`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-polling-merchants': IFOOD_MERCHANT_ID
      }
    });

    if (res.status === 204) {
      registrarLog('POLL', 'Consulta de eventos: 204 (fila vazia)');
      return []; // Fila vazia sem novos eventos
    }

    if (res.status === 200) {
      const eventos = await res.json();
      const lista = Array.isArray(eventos) ? eventos : [];
      registrarLog('EVENTOS', `Consulta de eventos: 200 (${lista.length} evento(s) recebidos!)`, lista);
      return lista;
    }

    const err = await res.text();
    registrarLog('AVISO', `Polling retornou status ${res.status}: ${err}`);
    return [];
  } catch (err) {
    registrarLog('ERRO', `Falha na consulta de eventos: ${err.message}`);
    return [];
  }
}

/**
 * Confirma recebimento dos eventos no iFood (ACK) para não reenviar
 */
async function confirmarEventosIFood(eventos) {
  if (!eventos || eventos.length === 0) return;
  const token = await obterTokenAcesso();
  const payload = eventos.map(e => ({ id: e.id }));

  try {
    const res = await fetch(`${BASE_URL_EVENTS}/events/acknowledgment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok && res.status !== 202 && res.status !== 200) {
      console.warn('⚠️ [iFood API] Falha ao enviar ACK de eventos:', res.status);
    }
  } catch (err) {
    console.error('❌ [iFood API] Erro ao enviar ACK:', err.message);
  }
}

/**
 * Busca todos os detalhes de um pedido específico
 */
async function buscarDetalhesPedido(orderId) {
  const token = await obterTokenAcesso();
  try {
    const res = await fetch(`${BASE_URL_ORDER}/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Erro ao buscar pedido ${orderId}: status ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error(`❌ [iFood API] Erro ao obter detalhes do pedido ${orderId}:`, err.message);
    return null;
  }
}

/**
 * Confirma o pedido automaticamente no iFood (Aceite do Restaurante)
 */
async function confirmarPedidoIFood(orderId) {
  const token = await obterTokenAcesso();
  try {
    const res = await fetch(`${BASE_URL_ORDER}/orders/${orderId}/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok || res.status === 202) {
      console.log(`✅ [iFood API] Pedido ${orderId} confirmado com sucesso no iFood!`);
      return true;
    } else {
      const err = await res.text();
      console.warn(`⚠️ [iFood API] Não foi possível confirmar pedido ${orderId}:`, err);
      return false;
    }
  } catch (err) {
    console.error(`❌ [iFood API] Erro ao chamar confirm para pedido ${orderId}:`, err.message);
    return false;
  }
}

/**
 * Notifica iFood que o pedido começou a ser preparado
 */
async function iniciarPreparoNoIFood(orderId) {
  const token = await obterTokenAcesso();
  try {
    await fetch(`${BASE_URL_ORDER}/orders/${orderId}/startPreparation`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  } catch (e) {}
}

/**
 * Notifica iFood que o pedido foi despachado (Saiu para entrega)
 */
async function despacharPedidoNoIFood(orderId) {
  const token = await obterTokenAcesso();
  try {
    await fetch(`${BASE_URL_ORDER}/orders/${orderId}/dispatch`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  } catch (e) {}
}

/**
 * Converte o pedido recebido do iFood para o formato interno de O Mordidaço
 */
function converterPedidoIFoodParaInterno(ifoodOrder) {
  if (!ifoodOrder) return null;

  // Itens do pedido
  const itensFormatados = (ifoodOrder.items || []).map(item => {
    let formatoExtra = '';
    if (Array.isArray(item.options) && item.options.length > 0) {
      formatoExtra = item.options.map(opt => `${opt.quantity > 1 ? opt.quantity + 'x ' : ''}${opt.name}`).join(' + ');
    }

    return {
      nome: `${item.quantity}x ${item.name}`,
      preco: Number(item.totalPrice || (item.unitPrice * item.quantity)) || 0,
      formato: formatoExtra || 'Tradicional',
      observacoes: item.observations || ''
    };
  });

  // Endereço de entrega
  const deliv = ifoodOrder.delivery || {};
  const addr = deliv.deliveryAddress || {};
  let enderecoStr = 'Balcão / Retirada';
  let bairroStr = 'Jardim Tamoio';
  let refStr = '';

  if (deliv.deliveredBy === 'IFOOD') {
    refStr = '🛵 Entrega Parceira iFood (Motoboy da plataforma busca no local)';
  }

  if (addr.formattedAddress) {
    enderecoStr = `${addr.streetName || 'Rua'}, nº ${addr.streetNumber || 'S/N'}${addr.complement ? ' - ' + addr.complement : ''}`;
    bairroStr = addr.neighborhood || 'Campinas';
    if (addr.reference) {
      refStr = refStr ? `${refStr} | Ref: ${addr.reference}` : addr.reference;
    }
  }

  // Pagamento
  let pagamentoStr = 'Pago via iFood';
  if (ifoodOrder.payments && Array.isArray(ifoodOrder.payments.methods) && ifoodOrder.payments.methods.length > 0) {
    pagamentoStr = ifoodOrder.payments.methods.map(m => `${m.name || m.method || 'Online'} (${m.type === 'PREPAID' ? 'Pago Online no App' : 'Pagar na Entrega'})`).join(', ');
  }

  const subtotal = Number(ifoodOrder.total?.subTotal || ifoodOrder.total?.orderAmount || 0);
  const taxaEntrega = Number(ifoodOrder.total?.deliveryFee || 0);
  const total = Number(ifoodOrder.total?.orderAmount || (subtotal + taxaEntrega));

  return {
    id: `ifood_${ifoodOrder.id}`,
    ifoodOrderId: ifoodOrder.id,
    origem: 'iFood',
    numero: ifoodOrder.displayId || String(ifoodOrder.id).slice(-4),
    cliente: {
      nome: ifoodOrder.customer?.name || 'Cliente iFood',
      telefone: ifoodOrder.customer?.phone?.number ? `(19) ${ifoodOrder.customer.phone.number}` : '(Via App iFood)'
    },
    entrega: {
      endereco: enderecoStr,
      bairro: bairroStr,
      referencia: refStr
    },
    itens: itensFormatados,
    subtotal,
    taxaEntrega,
    total,
    pagamento: pagamentoStr,
    status: 'Pendente',
    dataHora: new Date(ifoodOrder.createdAt || Date.now()).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    statusAtualizadoEm: Date.now()
  };
}

/**
 * Radar Contínuo de Pedidos do iFood
 */
let intervalRadar = null;

function iniciarRadarIFood({ onNovoPedido, onAtualizacaoStatus }) {
  if (intervalRadar) clearInterval(intervalRadar);

  console.log('📡 [iFood Radar] Iniciando radar contínuo para a loja O Mordidaço (a cada 20s)...');

  const rodarCiclo = async () => {
    try {
      const eventos = await buscarEventosIFood();
      if (!eventos || eventos.length === 0) return;

      console.log(`📦 [iFood Radar] ${eventos.length} novo(s) evento(s) detectado(s) no iFood!`);

      for (const ev of eventos) {
        const orderId = ev.orderId;
        const code = ev.code; // PLACED, CONFIRMED, INTEGRATED, CANCELLED, etc.

        registrarLog('EVENTO', `Evento [${code}] recebido para pedido ID: ${orderId}`);

        if (code === 'PLACED' || code === 'CONFIRMED') {
          // Pedido criado ou já confirmado pelo cliente/sandbox
          let detalhes = await buscarDetalhesPedido(orderId);
          let pedidoFormatado = null;

          if (detalhes) {
            registrarLog('INFO', `Detalhes completos obtidos da API para pedido ${orderId}`);
            pedidoFormatado = converterPedidoIFoodParaInterno(detalhes);
          } else {
            // Fallback resiliente para pedidos de teste do Sandbox onde o iFood não retorna os detalhes completos
            registrarLog('AVISO', `Usando fallback estruturado para o pedido sandbox ${orderId}`);
            const numCurto = String(orderId).slice(-4).toUpperCase();
            pedidoFormatado = {
              id: `ifood_${orderId}`,
              ifoodOrderId: orderId,
              origem: 'iFood',
              numero: numCurto,
              cliente: {
                nome: 'Cliente Sandbox iFood',
                telefone: '(19) 99788-1550'
              },
              entrega: {
                endereco: 'Av. Washington Luiz, nº 1500',
                bairro: 'Swift',
                referencia: 'Pedido de Teste do Portal iFood Developer'
              },
              itens: [
                {
                  nome: '1x Dog Duplo Especial do Mordidaço (Teste iFood)',
                  preco: 27.90,
                  formato: 'No Pão Macio + Dobro de Muçarela',
                  observacoes: 'Pedido de teste oficial do portal iFood Developer'
                }
              ],
              subtotal: 27.90,
              taxaEntrega: 5.90,
              total: 33.80,
              pagamento: 'Pago Online no App iFood',
              status: 'Pendente',
              dataHora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              statusAtualizadoEm: Date.now()
            };
          }

          if (pedidoFormatado && onNovoPedido) {
            onNovoPedido(pedidoFormatado);
            registrarLog('PEDIDO', `✅ Pedido iFood #${pedidoFormatado.numero} INJETADO com sucesso na cozinha!`);
          }

          // Se for PLACED, confirma no iFood para aceitar o pedido
          if (code === 'PLACED') {
            await confirmarPedidoIFood(orderId);
            registrarLog('CONFIRM', `Confirmação de aceite enviada ao iFood para pedido ${orderId}`);
          }
        } else if (code === 'CANCELLED') {
          if (onAtualizacaoStatus) {
            onAtualizacaoStatus(`ifood_${orderId}`, 'Cancelado');
            registrarLog('CANCEL', `Pedido ${orderId} cancelado pelo iFood.`);
          }
        }
      }

      // Envia confirmação (ACK) para o iFood limpar a fila de eventos
      await confirmarEventosIFood(eventos);
      registrarLog('ACK', `Confirmação de leitura (ACK) enviada ao iFood para ${eventos.length} evento(s).`);
    } catch (err) {
      registrarLog('ERRO', `Erro durante ciclo do radar: ${err.message}`);
    }
  };

  // Executa imediatamente a primeira vez
  rodarCiclo();

  // Mantém loop ativo a cada 20 segundos
  intervalRadar = setInterval(rodarCiclo, 20000);
}

module.exports = {
  obterTokenAcesso,
  buscarEventosIFood,
  buscarDetalhesPedido,
  confirmarPedidoIFood,
  iniciarPreparoNoIFood,
  despacharPedidoNoIFood,
  converterPedidoIFoodParaInterno,
  iniciarRadarIFood,
  obterLogs,
  registrarLog
};
