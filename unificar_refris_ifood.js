/**
 * Script para Unificar Refrigerantes no iFood com Opção Obrigatória de Versão (Normal vs Zero)
 */

const { obterTokenAcesso } = require('./integracao_ifood');

const MERCHANT_ID = '1aafd9ac-f972-49bd-9a5d-9fec4036132e';
const CATALOG_ID = 'bb3534e9-c3c5-42db-b9cb-b63d53ce9ce1';
const CAT_BEBIDAS = '4b528010-cd24-4da7-92ee-af47d7b05aa0';

function genUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

async function request(endpoint, method = 'GET', body = null) {
  const token = await obterTokenAcesso();
  const url = `https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${MERCHANT_ID}${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`[${res.status}] ${url}: ${errText}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function unificarRefrisIFood() {
  console.log('🚀 Iniciando unificação de Refrigerantes no iFood...');

  // 1. Obter itens atuais de Bebidas Geladas
  const catDetalhe = await request(`/catalogs/${CATALOG_ID}/categories/${CAT_BEBIDAS}`);
  const items = catDetalhe.items || [];

  // Remover itens avulsos de Coca 2.5L, Coca Lata e Guaraná 1.5L separados
  for (const item of items) {
    const nome = item.name.toLowerCase();
    if (
      (nome.includes('coca') && (nome.includes('lata') || nome.includes('350'))) ||
      (nome.includes('coca') && (nome.includes('2,5') || nome.includes('2.5'))) ||
      (nome.includes('guaraná') || nome.includes('guarana'))
    ) {
      try {
        await request(`/categories/${CAT_BEBIDAS}/products/${item.productId}`, 'DELETE');
        console.log(`  🗑️ Desvinculado item separado: "${item.name}"`);
      } catch (e) {
        console.warn(`  ⚠️ Falha ao remover "${item.name}":`, e.message);
      }
    }
  }

  // 2. Criar os 3 Refrigerantes Unificados com Opção Obrigatória de Versão
  const refrisUnificados = [
    {
      nome: 'Coca-Cola 350ml Lata (Normal ou Zero)',
      descricao: 'Lata 350ml trincando de gelada. Escolha Normal (Original) ou Zero Açúcar.',
      preco: 7.90,
      opcoes: [
        { nome: '🔴 Original (Normal)' },
        { nome: '⚫ Zero Açúcar' }
      ]
    },
    {
      nome: 'Guaraná Antarctica 1,5 Litros (Normal ou Zero)',
      descricao: 'Garrafa 1,5 Litros gelada. Escolha Tradicional (Normal) ou Zero Açúcar/Diet.',
      preco: 13.90,
      opcoes: [
        { nome: '🟢 Tradicional (Normal)' },
        { nome: '⚪ Zero Açúcar / Diet' }
      ]
    },
    {
      nome: 'Coca-Cola 2,5 Litros (Normal ou Zero)',
      descricao: 'Garrafa 2,5 Litros tamanho família gelada. Escolha Normal (Original) ou Zero Açúcar.',
      preco: 18.90,
      opcoes: [
        { nome: '🔴 Original (Normal)' },
        { nome: '⚫ Zero Açúcar' }
      ]
    }
  ];

  for (const refri of refrisUnificados) {
    console.log(`\n🥤 Cadastrando item unificado: "${refri.nome}"...`);

    const ogId = genUuid();
    const prodRefriId = genUuid();
    const itemId = genUuid();

    // Cria as opções
    const optIds = [];
    const optProducts = [];
    const options = [];

    refri.opcoes.forEach((opt, idx) => {
      const optProdId = genUuid();
      const optId = genUuid();
      optIds.push(optId);

      optProducts.push({
        id: optProdId,
        name: opt.nome,
        serving: 'NOT_APPLICABLE'
      });

      options.push({
        id: optId,
        productId: optProdId,
        optionGroupId: ogId,
        status: 'AVAILABLE',
        index: idx,
        price: { value: 0 }
      });
    });

    const products = [
      {
        id: prodRefriId,
        name: refri.nome,
        description: refri.descricao,
        serving: 'NOT_APPLICABLE',
        optionGroups: [
          { id: ogId, min: 1, max: 1, index: 0 }
        ]
      },
      ...optProducts
    ];

    const optionGroups = [
      {
        id: ogId,
        name: 'Escolha a Versão do Refrigerante (Obrigatório)',
        status: 'AVAILABLE',
        min: 1,
        max: 1,
        index: 0,
        optionIds: optIds
      }
    ];

    const payload = {
      item: {
        id: itemId,
        productId: prodRefriId,
        categoryId: CAT_BEBIDAS,
        status: 'AVAILABLE',
        price: { value: refri.preco }
      },
      products,
      optionGroups,
      options
    };

    try {
      await request('/items', 'PUT', payload);
      console.log(`  ✓ "${refri.nome}" cadastrado com sucesso com escolha de Normal ou Zero!`);
    } catch (e) {
      console.error(`  ❌ Falha ao cadastrar "${refri.nome}":`, e.message);
    }
  }

  console.log('\n🎉 Unificação de Refrigerantes no iFood concluída com sucesso!');
}

unificarRefrisIFood().catch(console.error);
