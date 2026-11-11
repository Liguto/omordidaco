/**
 * Módulo de Inteligência de Estoque, Fichas Técnicas e Métricas Financeiras
 * O Mordidaço - Hot-Dogueria Artesanal
 */

const fs = require('fs');
const path = require('path');

const ARQUIVO_ESTOQUE = path.join(__dirname, 'estoque.json');

function carregarEstoque() {
  try {
    if (fs.existsSync(ARQUIVO_ESTOQUE)) {
      const data = fs.readFileSync(ARQUIVO_ESTOQUE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Erro ao ler estoque.json:', err.message);
  }
  return { insumos: [], movimentacoes: [] };
}

function salvarEstoque(dados) {
  try {
    fs.writeFileSync(ARQUIVO_ESTOQUE, JSON.stringify(dados, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Erro ao salvar estoque.json:', err.message);
    return false;
  }
}

/**
 * Deduz automaticamente os insumos e embalagens com base na Ficha Técnica do pedido
 */
function deduzirEstoquePorPedido(pedido) {
  if (!pedido || !Array.isArray(pedido.itens)) return null;

  const estoque = carregarEstoque();
  const baixas = {};

  const registrarBaixa = (insumoId, qtd) => {
    baixas[insumoId] = (baixas[insumoId] || 0) + qtd;
  };

  let totalDogsNoPedido = 0;

  pedido.itens.forEach(item => {
    const nome = (item.nome || '').toLowerCase();
    const formato = (item.formato || '').toLowerCase();
    const qtdItem = Number(item.quantidade || 1);

    const isNoPrato = formato.includes('prato') || nome.includes('prato');
    const isCombo = nome.includes('combo');

    // 1. ANÁLISE DE COMBOS
    if (isCombo) {
      if (nome.includes('casal')) {
        // 2 Dogs Duplos + 2 Refris + 2 Maioneses 50ml + Saco Kraft G
        totalDogsNoPedido += (2 * qtdItem);
        registrarBaixa('salsicha_sadia', 4 * qtdItem); // 2 dogs com 2 salsichas cada
        registrarBaixa('queijo_mussarela', 0.076 * qtdItem); // 4 fatias de mussarela
        registrarBaixa('milho_conserva', 0.040 * qtdItem);
        registrarBaixa('batata_palha', 0.040 * qtdItem);
        registrarBaixa('maionese_verde', 0.040 * qtdItem);
        registrarBaixa('pote_maionese_50ml', 2 * qtdItem);
        registrarBaixa('saco_kraft_g', 1 * qtdItem);

        if (isNoPrato) {
          registrarBaixa('garfo_reforcado', 2 * qtdItem);
          registrarBaixa('pure_batata', 0.240 * qtdItem); // 120g cada
          registrarBaixa('molho_tomate', 0.080 * qtdItem);
          registrarBaixa('pote_berco', 2 * qtdItem);
        } else {
          registrarBaixa('pao_bambini', 2 * qtdItem);
          registrarBaixa('pure_batata', 0.160 * qtdItem); // 80g cada
          registrarBaixa('molho_tomate', 0.060 * qtdItem);
          registrarBaixa('pote_berco', 2 * qtdItem);
        }

        // Bebidas do Combo Casal
        if (nome.includes('guaraná') || nome.includes('guarana')) {
          registrarBaixa('guarana_lata', 2 * qtdItem);
        } else {
          registrarBaixa('coca_lata', 2 * qtdItem);
        }
      } else if (nome.includes('família') || nome.includes('familia')) {
        // Combo Família: 2 Duplos + 1 Tradicional + 1 Refri 2L + 2 Maioneses
        totalDogsNoPedido += (3 * qtdItem);
        registrarBaixa('salsicha_sadia', 5 * qtdItem);
        registrarBaixa('queijo_mussarela', 0.076 * qtdItem);
        registrarBaixa('queijo_parmesao', 0.012 * qtdItem);
        registrarBaixa('milho_conserva', 0.060 * qtdItem);
        registrarBaixa('batata_palha', 0.060 * qtdItem);
        registrarBaixa('maionese_verde', 0.060 * qtdItem);
        registrarBaixa('pote_maionese_50ml', 2 * qtdItem);
        registrarBaixa('guarana_2l', 1 * qtdItem);
        registrarBaixa('saco_kraft_g', 1 * qtdItem);
        registrarBaixa('pao_bambini', 3 * qtdItem);
        registrarBaixa('pure_batata', 0.240 * qtdItem);
        registrarBaixa('molho_tomate', 0.090 * qtdItem);
        registrarBaixa('pote_berco', 3 * qtdItem);
      }
      return;
    }

    // 2. ANÁLISE DE DOGS INDIVIDUAIS
    const isDog = nome.includes('dog') || nome.includes('cachorro');
    if (isDog) {
      totalDogsNoPedido += qtdItem;
      registrarBaixa('pote_berco', 1 * qtdItem);

      // Base do Formato
      if (isNoPrato) {
        registrarBaixa('garfo_reforcado', 1 * qtdItem);
        registrarBaixa('pure_batata', 0.120 * qtdItem); // 120g purê no prato
        registrarBaixa('molho_tomate', 0.040 * qtdItem);
      } else {
        registrarBaixa('pao_bambini', 1 * qtdItem);
        registrarBaixa('pure_batata', 0.080 * qtdItem); // 80g purê no pão
        registrarBaixa('molho_tomate', 0.030 * qtdItem);
      }

      // Recheios por Receita
      registrarBaixa('milho_conserva', 0.020 * qtdItem);
      registrarBaixa('batata_palha', 0.020 * qtdItem);
      registrarBaixa('maionese_verde', 0.020 * qtdItem);

      if (nome.includes('duplo')) {
        registrarBaixa('salsicha_sadia', 2 * qtdItem);
        registrarBaixa('queijo_mussarela', 0.038 * qtdItem); // 2 fatias dobro
      } else if (nome.includes('bacon')) {
        registrarBaixa('salsicha_sadia', 1 * qtdItem);
        registrarBaixa('bacon_cubos', 0.040 * qtdItem);
        registrarBaixa('queijo_mussarela', 0.020 * qtdItem);
      } else if (nome.includes('frango')) {
        registrarBaixa('salsicha_sadia', 1 * qtdItem);
        registrarBaixa('frango_desfiado', 0.050 * qtdItem);
        registrarBaixa('catupiry_original', 0.040 * qtdItem);
        registrarBaixa('queijo_mussarela', 0.020 * qtdItem);
      } else {
        // Tradicional Simples
        registrarBaixa('salsicha_sadia', 1 * qtdItem);
        registrarBaixa('queijo_parmesao', 0.012 * qtdItem);
      }
      return;
    }

    // 3. ANÁLISE DE BEBIDAS INDIVIDUAIS
    if (nome.includes('coca') && nome.includes('zero')) {
      registrarBaixa('coca_zero_lata', 1 * qtdItem);
    } else if (nome.includes('coca') && (nome.includes('2l') || nome.includes('2 litros'))) {
      registrarBaixa('coca_2l', 1 * qtdItem);
    } else if (nome.includes('coca')) {
      registrarBaixa('coca_lata', 1 * qtdItem);
    } else if (nome.includes('guaraná') || nome.includes('guarana')) {
      if (nome.includes('2l') || nome.includes('2 litros')) {
        registrarBaixa('guarana_2l', 1 * qtdItem);
      } else {
        registrarBaixa('guarana_lata', 1 * qtdItem);
      }
    } else if (nome.includes('água') || nome.includes('agua')) {
      registrarBaixa('agua_sem_gas', 1 * qtdItem);
    } else if (nome.includes('maionese extra') || nome.includes('pote')) {
      registrarBaixa('pote_maionese_50ml', 1 * qtdItem);
      registrarBaixa('maionese_verde', 0.050 * qtdItem);
    }
  });

  // Embalagens gerais do pedido
  registrarBaixa('lacre_seguranca', 1);
  if (totalDogsNoPedido > 2) {
    registrarBaixa('saco_kraft_g', 1);
  } else if (totalDogsNoPedido > 0) {
    registrarBaixa('saco_kraft_m', 1);
  }

  // Aplica as baixas nos insumos do estoque
  const alertasCriticos = [];
  const resumoBaixas = [];

  for (const [idInsumo, qtdBaixa] of Object.entries(baixas)) {
    const itemEstoque = estoque.insumos.find(i => i.id === idInsumo);
    if (itemEstoque) {
      const qtdAntes = itemEstoque.quantidade;
      const decPlaces = itemEstoque.unidade === 'un' ? 0 : 3;
      itemEstoque.quantidade = Math.max(0, Number((itemEstoque.quantidade - qtdBaixa).toFixed(decPlaces)));

      resumoBaixas.push({
        id: idInsumo,
        nome: itemEstoque.nome,
        baixado: qtdBaixa,
        saldo: itemEstoque.quantidade,
        unidade: itemEstoque.unidade
      });

      // Checa se atingiu estoque crítico
      if (itemEstoque.quantidade <= itemEstoque.minimo) {
        alertasCriticos.push({
          nome: itemEstoque.nome,
          saldo: itemEstoque.quantidade,
          minimo: itemEstoque.minimo,
          unidade: itemEstoque.unidade
        });
      }
    }
  }

  // Registra movimentação no histórico
  estoque.movimentacoes.unshift({
    dataHora: new Date().toLocaleString('pt-BR'),
    pedidoId: pedido.id,
    pedidoNumero: pedido.numero,
    origem: pedido.origem || 'Site',
    baixas: resumoBaixas
  });

  if (estoque.movimentacoes.length > 80) estoque.movimentacoes.pop();

  salvarEstoque(estoque);

  return {
    baixas: resumoBaixas,
    alertas: alertasCriticos
  };
}

/**
 * Ajusta ou repõe estoque manualmente no painel
 */
function ajustarEstoqueManual(idInsumo, quantidadeAlterada, motivo = 'Reposição de Compras') {
  const estoque = carregarEstoque();
  const item = estoque.insumos.find(i => i.id === idInsumo);
  if (!item) return false;

  const anterior = item.quantidade;
  item.quantidade = Number(quantidadeAlterada);

  estoque.movimentacoes.unshift({
    dataHora: new Date().toLocaleString('pt-BR'),
    pedidoNumero: 'MANUAL',
    origem: 'Ajuste Manual',
    baixas: [
      {
        id: idInsumo,
        nome: item.nome,
        baixado: (anterior - item.quantidade),
        saldo: item.quantidade,
        unidade: item.unidade,
        motivo
      }
    ]
  });

  if (estoque.movimentacoes.length > 80) estoque.movimentacoes.pop();
  salvarEstoque(estoque);
  return item;
}

/**
 * Adiciona quantidade comprada (Ex: +20 pães)
 */
function adicionarEntradaEstoque(idInsumo, quantidadeEntrada) {
  const estoque = carregarEstoque();
  const item = estoque.insumos.find(i => i.id === idInsumo);
  if (!item) return false;

  const decPlaces = item.unidade === 'un' ? 0 : 3;
  item.quantidade = Number((item.quantidade + Number(quantidadeEntrada)).toFixed(decPlaces));

  estoque.movimentacoes.unshift({
    dataHora: new Date().toLocaleString('pt-BR'),
    pedidoNumero: 'COMPRA',
    origem: 'Entrada de Mercadoria',
    baixas: [
      {
        id: idInsumo,
        nome: item.nome,
        baixado: -Number(quantidadeEntrada),
        saldo: item.quantidade,
        unidade: item.unidade,
        motivo: 'Entrada / Compra'
      }
    ]
  });

  if (estoque.movimentacoes.length > 80) estoque.movimentacoes.pop();
  salvarEstoque(estoque);
  return item;
}

/**
 * Consolida todas as métricas financeiras, margens e status do consignado
 */
function calcularMetricasBusiness(todosPedidos, estoqueData) {
  const pedidosValidos = (todosPedidos || []).filter(p => p.status !== 'Cancelado');

  let faturamentoTotal = 0;
  let faturamentoSite = 0;
  let faturamentoIFood = 0;
  let faturamento99Food = 0;

  let totalPedidosSite = 0;
  let totalPedidosIFood = 0;
  let totalPedidos99Food = 0;

  let custoInsumosEstimado = 0;
  let taxasMarketplacePagas = 0;

  pedidosValidos.forEach(p => {
    const val = Number(p.total || 0);
    faturamentoTotal += val;

    if (p.origem === 'iFood') {
      faturamentoIFood += val;
      totalPedidosIFood++;
      taxasMarketplacePagas += (val * 0.27); // taxa média parceira 27%
      custoInsumosEstimado += (val * 0.24); // CMV médio calibrado
    } else if (p.origem === '99Food') {
      faturamento99Food += val;
      totalPedidos99Food++;
      taxasMarketplacePagas += (val * 0.25); // taxa 99Food ~25%
      custoInsumosEstimado += (val * 0.24);
    } else {
      faturamentoSite += val;
      totalPedidosSite++;
      custoInsumosEstimado += (val * 0.26); // CMV médio canal direto
    }
  });

  const totalPedidos = pedidosValidos.length;
  const ticketMedio = totalPedidos > 0 ? (faturamentoTotal / totalPedidos) : 0;
  const lucroLiquidoReal = faturamentoTotal - custoInsumosEstimado - taxasMarketplacePagas;
  const cmvPercentual = faturamentoTotal > 0 ? ((custoInsumosEstimado / faturamentoTotal) * 100) : 0;
  const margemLiquidaMedia = faturamentoTotal > 0 ? ((lucroLiquidoReal / faturamentoTotal) * 100) : 0;

  // TERMÔMETRO DO EMPRÉSTIMO CONSIGNADO (R$ 35,00/semana -> R$ 140,00/mês)
  const metaMensalConsignado = 140.00;
  const provisionamentoConsignado = Math.min(metaMensalConsignado, Math.max(0, lucroLiquidoReal * 0.15));
  const percentualConsignado = Math.min(100, (provisionamentoConsignado / metaMensalConsignado) * 100);

  // Alertas de estoque
  const alertasEstoque = (estoqueData.insumos || []).filter(i => i.quantidade <= i.minimo);

  return {
    faturamento: {
      total: faturamentoTotal,
      site: faturamentoSite,
      ifood: faturamentoIFood,
      ninetyNine: faturamento99Food
    },
    pedidos: {
      total: totalPedidos,
      site: totalPedidosSite,
      ifood: totalPedidosIFood,
      ninetyNine: totalPedidos99Food,
      ticketMedio
    },
    lucro: {
      liquidoReal: lucroLiquidoReal,
      cmvTotal: custoInsumosEstimado,
      cmvPercentual: cmvPercentual,
      taxasMarketplace: taxasMarketplacePagas,
      margemPercentual: margemLiquidaMedia
    },
    consignado: {
      metaMensal: metaMensalConsignado,
      metaSemanal: 35.00,
      provisionado: provisionamentoConsignado,
      percentualGarantido: percentualConsignado,
      status: percentualConsignado >= 100 ? '100% GARANTIDO' : (percentualConsignado >= 50 ? 'EM ANDAMENTO' : 'ATENÇÃO')
    },
    alertasEstoque
  };
}

module.exports = {
  carregarEstoque,
  salvarEstoque,
  deduzirEstoquePorPedido,
  ajustarEstoqueManual,
  adicionarEntradaEstoque,
  calcularMetricasBusiness
};
