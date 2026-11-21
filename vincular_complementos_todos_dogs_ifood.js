/**
 * Script para Vincular Grupos de Complementos a Todos os Hot Dogs no iFood
 * 1. Escolha o Formato (Obrigatório - Mín 1, Máx 1):
 *    - 🥖 Tradicional de Rua (No Pão) (R$ 0,00)
 *    - 🥣 No Prato (Marmitinha 500ml - Sem Pão) (+ R$ 2,00)
 * 2. Deseja Retirar Algum Ingrediente? (Opcional - Mín 0, Máx 10 - R$ 0,00)
 * 3. Turbine seu Hot Dog (Adicionais Extras - Mín 0, Máx 10 - R$ 3,50 a R$ 6,90)
 */

const crypto = require('crypto');
const { obterTokenAcesso } = require('./integracao_ifood');

const MERCHANT_ID = '1aafd9ac-f972-49bd-9a5d-9fec4036132e';
const CATALOG_ID = 'bb3534e9-c3c5-42db-b9cb-b63d53ce9ce1';
const CAT_HOTDOGS = '792e4161-a95d-4c3c-b869-17c177abef91';

function genUuid() {
  return crypto.randomUUID();
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

// Produtos das Opções
const PROD_PAO_ID = '750e6333-123d-4575-bf41-f79cc7159de0';
const PROD_PRATO_ID = 'c3e77628-97b0-4630-a9d9-db8aebad85aa';

const RETIRADAS_DEFS = [
  { id: '11111111-0001-4000-8000-000000000001', name: 'Sem Maionese Hellmann\'s' },
  { id: '11111111-0002-4000-8000-000000000002', name: 'Sem Ketchup' },
  { id: '11111111-0003-4000-8000-000000000003', name: 'Sem Mostarda' },
  { id: '11111111-0004-4000-8000-000000000004', name: 'Sem Milho' },
  { id: '11111111-0005-4000-8000-000000000005', name: 'Sem Ervilha' },
  { id: '11111111-0006-4000-8000-000000000006', name: 'Sem Vinagrete' },
  { id: '11111111-0007-4000-8000-000000000007', name: 'Sem Purê de Batata' },
  { id: '11111111-0008-4000-8000-000000000008', name: 'Sem Batata Palha Crocante' },
  { id: '11111111-0009-4000-8000-000000000009', name: 'Sem Queijo Parmesão' },
  { id: '11111111-0010-4000-8000-000000000010', name: 'Sem Salsicha Sadia' }
];

const ADICIONAIS_DEFS = [
  { id: '22222222-0001-4000-8000-000000000001', name: '1 Salsicha Sadia Extra', preco: 4.90 },
  { id: '22222222-0002-4000-8000-000000000002', name: 'Catupiry Original Extra (40g)', preco: 6.90 },
  { id: '22222222-0003-4000-8000-000000000003', name: 'Bacon Crocante Extra em Cubos (40g)', preco: 6.90 },
  { id: '22222222-0004-4000-8000-000000000004', name: 'Calabresa Ralada Douradinha (40g)', preco: 5.90 },
  { id: '22222222-0005-4000-8000-000000000005', name: 'Parmesão Ralado Fresco (20g)', preco: 4.50 },
  { id: '22222222-0006-4000-8000-000000000006', name: 'Purê de Batata Artesanal Extra (80g)', preco: 4.90 },
  { id: '22222222-0007-4000-8000-000000000007', name: 'Milho Verde Extra', preco: 3.50 },
  { id: '22222222-0008-4000-8000-000000000008', name: 'Ervilha Extra', preco: 3.50 },
  { id: '22222222-0009-4000-8000-000000000009', name: 'Pote de Molho Especial da Casa (50ml)', preco: 4.50 },
  { id: '22222222-0010-4000-8000-000000000010', name: 'Batata Palha Crocante Extra', preco: 3.50 }
];

async function vincularComplementosItem(itemInfo) {
  console.log(`\n🌭 Configurando complementos para ${itemInfo.name}...`);

  // IDs únicos para este item
  const ogFormatoId = genUuid();
  const ogRetirarId = genUuid();
  const ogAdicionaisId = genUuid();

  // Opções Formato
  const formatoOptions = [
    {
      id: genUuid(),
      productId: PROD_PAO_ID,
      optionGroupId: ogFormatoId,
      status: 'AVAILABLE',
      price: { value: 0 }
    },
    {
      id: genUuid(),
      productId: PROD_PRATO_ID,
      optionGroupId: ogFormatoId,
      status: 'AVAILABLE',
      price: { value: 2.00 }
    }
  ];

  // Filtra retiradas
  const retiradasFiltradas = RETIRADAS_DEFS.filter(r => {
    if (itemInfo.name.includes('Veg') && r.name.includes('Salsicha')) return false;
    return true;
  });

  const retirarOptions = retiradasFiltradas.map(r => ({
    id: genUuid(),
    productId: r.id,
    optionGroupId: ogRetirarId,
    status: 'AVAILABLE',
    price: { value: 0 }
  }));

  // Opções Adicionais
  const adicionaisOptions = ADICIONAIS_DEFS.map(a => ({
    id: genUuid(),
    productId: a.id,
    optionGroupId: ogAdicionaisId,
    status: 'AVAILABLE',
    price: { value: a.preco }
  }));

  // PRODUTOS: O produto principal DEVE listar os optionGroups dele!
  const products = [
    {
      id: itemInfo.productId,
      name: itemInfo.name,
      description: itemInfo.desc || '',
      serving: 'SERVES_1',
      optionGroups: [
        { id: ogFormatoId, min: 1, max: 1 },
        { id: ogRetirarId, min: 0, max: 10 },
        { id: ogAdicionaisId, min: 0, max: 10 }
      ]
    },
    {
      id: PROD_PAO_ID,
      name: '🥖 Tradicional de Rua (No Pão)',
      serving: 'NOT_APPLICABLE'
    },
    {
      id: PROD_PRATO_ID,
      name: '🥣 No Prato (+ R$ 2,00) - Marmitinha Térmica 500ml',
      serving: 'NOT_APPLICABLE'
    }
  ];

  retiradasFiltradas.forEach(r => {
    products.push({ id: r.id, name: r.name, serving: 'NOT_APPLICABLE' });
  });

  ADICIONAIS_DEFS.forEach(a => {
    products.push({ id: a.id, name: a.name, serving: 'NOT_APPLICABLE' });
  });

  // OPTION GROUPS
  const optionGroups = [
    {
      id: ogFormatoId,
      name: 'Escolha o Formato do Hot Dog',
      status: 'AVAILABLE',
      min: 1,
      max: 1,
      optionIds: formatoOptions.map(o => o.id)
    },
    {
      id: ogRetirarId,
      name: 'Deseja Retirar Algum Ingrediente? (Opcional)',
      status: 'AVAILABLE',
      min: 0,
      max: 10,
      optionIds: retirarOptions.map(o => o.id)
    },
    {
      id: ogAdicionaisId,
      name: 'Turbine seu Hot Dog (Adicionais Extras)',
      status: 'AVAILABLE',
      min: 0,
      max: 10,
      optionIds: adicionaisOptions.map(o => o.id)
    }
  ];

  const options = [...formatoOptions, ...retirarOptions, ...adicionaisOptions];

  const payload = {
    item: {
      id: itemInfo.itemId,
      productId: itemInfo.productId,
      categoryId: CAT_HOTDOGS,
      status: 'AVAILABLE',
      price: { value: itemInfo.price }
    },
    products,
    optionGroups,
    options
  };

  const res = await request('/items', 'PUT', payload);
  console.log(`  ✓ ${itemInfo.name} configurado com Formato, Retiradas e Adicionais!`);
  return res;
}

async function executar() {
  console.log('🚀 Iniciando configuração de complementos em todos os 6 Hot Dogs do iFood...');
  
  const dogs = [
    {
      name: 'Mordidaço Clássico',
      itemId: '205606e9-8269-464d-ba3d-19461ed49ff9',
      productId: 'c34954eb-157d-47cf-9de3-5539edec8b8d',
      price: 22.90,
      desc: '1 salsicha Sadia, maionese Hellmann\'s, ketchup, mostarda, milho, ervilha, vinagrete, purê de batata artesanal e batata palha crocante.'
    },
    {
      name: 'Mordidaço em Dobro',
      itemId: '1325b091-7041-459c-9035-bed1f073b390',
      productId: '3876535e-059a-44cc-8212-e1388f8d85a8',
      price: 28.90,
      desc: 'O campeão de vendas! 2 salsichas Sadia, o verdadeiro dobro de queijo muçarela derretido, maionese Hellmann\'s, ketchup, mostarda, milho, ervilha, vinagrete, purê artesanal, batata palha e chuva de parmesão ralado por cima.'
    },
    {
      name: 'Mordidaço Queijudo (Veg)',
      itemId: '34021b5f-d80d-45e5-a09e-c4e5134ad399',
      productId: '0fb8a509-1014-44e6-af22-12070667f60f',
      price: 31.90,
      desc: '🌱 Opção Vegetariana! 2 palitos de queijo empanados crocantes com queijo puxa-puxa derretido, purê artesanal da casa, vinagrete fresco, milho, ketchup, mostarda, maionese Hellmann\'s e batata palha crocante.'
    },
    {
      name: 'Mordidaço Bacon',
      itemId: '1dc9c6ba-88c1-45a5-ad5f-556fb7d667da',
      productId: 'a81c6165-fcc4-4376-8fa6-70386ee3dc98',
      price: 33.90,
      desc: '2 salsichas Sadia, maionese Hellmann\'s, purê de batata artesanal, milho, ervilha, bacon crocante em cubos, queijo muçarela derretido, batata palha e parmesão ralado por cima.'
    },
    {
      name: 'Mordidaço Cremoso',
      itemId: 'a758a12b-4ca2-43e3-8184-bebd525aed5e',
      productId: '31b11fd2-79b3-4229-a1cc-85839bc9a322',
      price: 34.90,
      desc: '1 salsicha Sadia, frango desfiado temperado, Catupiry® Original cremoso, maionese Hellmann\'s, ketchup, mostarda, milho, vinagrete, purê de batata artesanal e batata palha crocante.'
    },
    {
      name: 'Mordidaço Tudão',
      itemId: '1ed0b788-af00-4c7e-87a1-54d3c925a157',
      productId: '9d9cff23-0e77-4a1c-9c46-b3d29f11e973',
      price: 44.90,
      desc: 'O gigante da casa! 1 salsicha Sadia, frango desfiado temperado, Catupiry® Original, purê artesanal, maionese Hellmann\'s, ketchup, mostarda, milho, ervilha, vinagrete, bacon em dobro, calabresa ralada douradinha, queijo muçarela em dobro derretido, batata palha e parmesão ralado por cima.'
    }
  ];

  for (const dog of dogs) {
    try {
      await vincularComplementosItem(dog);
    } catch (e) {
      console.error(`❌ Erro no ${dog.name}:`, e.message);
    }
  }

  console.log('\n🎉 SUCESSO TOTAL! Todos os 6 Hot Dogs do iFood agora possuem Formato (No Pão/No Prato), Retiradas e Adicionais!');
}

executar().catch(err => {
  console.error('Falha geral:', err);
});
