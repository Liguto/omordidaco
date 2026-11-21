/**
 * Script para Configurar Complementos dos Combos Oficiais no iFood (Formato 2):
 * - Combo Casal:
 *   1. Montagem dos 2 Dogs (min 2, max 2: Pão R$ 0,00 ou Prato R$ 2,00) - Index 0
 *   2. 1º Refrigerante Lata 350ml (min 1, max 1) - Index 1
 *   3. 2º Refrigerante Lata 350ml (min 1, max 1) - Index 2
 *   4. Turbine seu Combo (Adicionais Extras - min 0, max 10) - Index 3
 * - Combo Família:
 *   1. Montagem dos 3 Dogs (min 3, max 3: Pão R$ 0,00 ou Prato R$ 2,00) - Index 0
 *   2. Turbine seu Combo (Adicionais Extras - min 0, max 10) - Index 1
 */

const crypto = require('crypto');
const { obterTokenAcesso } = require('./integracao_ifood');

const MERCHANT_ID = '1aafd9ac-f972-49bd-9a5d-9fec4036132e';
const CATALOG_ID = 'bb3534e9-c3c5-42db-b9cb-b63d53ce9ce1';
const CAT_COMBOS = '7fa12084-2e1e-476e-98f5-3441c75cb481';

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

// IDs fixos de opções comuns
const PROD_PAO_ID = '750e6333-123d-4575-bf41-f79cc7159de0';
const PROD_PRATO_ID = 'c3e77628-97b0-4630-a9d9-db8aebad85aa';

const REFRIS_DEFS = [
  { id: '33333333-0001-4000-8000-000000000001', name: '1x Coca-Cola Original 350ml (Lata)' },
  { id: '33333333-0002-4000-8000-000000000002', name: '1x Coca-Cola Zero 350ml (Lata)' },
  { id: '33333333-0003-4000-8000-000000000003', name: '1x Guaraná Antarctica 350ml (Lata)' },
  { id: '33333333-0004-4000-8000-000000000004', name: '1x Guaraná Antarctica Zero 350ml (Lata)' },
  { id: '33333333-0005-4000-8000-000000000005', name: '1x Fanta Laranja 350ml (Lata)' },
  { id: '33333333-0006-4000-8000-000000000006', name: '1x Suco Del Valle Uva 290ml (Lata)' },
  { id: '33333333-0007-4000-8000-000000000007', name: '1x Água Mineral 500ml (sem gás)' }
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

async function configurarComboCasal() {
  console.log('⭐ Configurando complementos do Combo Casal no iFood...');
  const itemId = '3ecab1bc-295b-4ce1-8235-a898c6a68b45';
  const productId = '671428a3-b3f7-4ead-b0cf-0582cf658b0a';

  const ogFormatoId = genUuid();
  const ogRefri1Id = genUuid();
  const ogRefri2Id = genUuid();
  const ogAdicionaisId = genUuid();

  // Opções Formato dos 2 Dogs (min 2, max 2)
  const formatoOptions = [
    {
      id: genUuid(),
      productId: PROD_PAO_ID,
      optionGroupId: ogFormatoId,
      status: 'AVAILABLE',
      index: 0,
      price: { value: 0 }
    },
    {
      id: genUuid(),
      productId: PROD_PRATO_ID,
      optionGroupId: ogFormatoId,
      status: 'AVAILABLE',
      index: 1,
      price: { value: 2.00 }
    }
  ];

  // Opções 1º Refri
  const refri1Options = REFRIS_DEFS.map((r, idx) => ({
    id: genUuid(),
    productId: r.id,
    optionGroupId: ogRefri1Id,
    status: 'AVAILABLE',
    index: idx,
    price: { value: 0 }
  }));

  // Opções 2º Refri
  const refri2Options = REFRIS_DEFS.map((r, idx) => ({
    id: genUuid(),
    productId: r.id,
    optionGroupId: ogRefri2Id,
    status: 'AVAILABLE',
    index: idx,
    price: { value: 0 }
  }));

  // Opções Adicionais Extras
  const adicionaisOptions = ADICIONAIS_DEFS.map((a, idx) => ({
    id: genUuid(),
    productId: a.id,
    optionGroupId: ogAdicionaisId,
    status: 'AVAILABLE',
    index: idx,
    price: { value: a.preco }
  }));

  // Produtos envolvidos
  const products = [
    {
      id: productId,
      name: 'Combo Mordidaço Casal',
      description: '2 Mordidaços em Dobro (escolha individual no Pão ou no Prato para cada um) + 2 Refrigerantes Lata (escolha Coca, Guaraná ou Fanta) + 2 Potes de Molho da Casa (50ml). A janta perfeita para dois!',
      serving: 'SERVES_2',
      optionGroups: [
        { id: ogFormatoId, min: 2, max: 2, index: 0 },
        { id: ogRefri1Id, min: 1, max: 1, index: 1 },
        { id: ogRefri2Id, min: 1, max: 1, index: 2 },
        { id: ogAdicionaisId, min: 0, max: 10, index: 3 }
      ]
    },
    { id: PROD_PAO_ID, name: '🥖 Tradicional de Rua (No Pão)', serving: 'NOT_APPLICABLE' },
    { id: PROD_PRATO_ID, name: '🥣 No Prato (+ R$ 2,00) - Marmitinha Térmica 500ml', serving: 'NOT_APPLICABLE' }
  ];

  REFRIS_DEFS.forEach(r => products.push({ id: r.id, name: r.name, serving: 'NOT_APPLICABLE' }));
  ADICIONAIS_DEFS.forEach(a => products.push({ id: a.id, name: a.name, serving: 'NOT_APPLICABLE' }));

  // Grupos de Opções
  const optionGroups = [
    {
      id: ogFormatoId,
      name: 'Escolha o Formato dos 2 Dogs (Selecione 2 opções)',
      status: 'AVAILABLE',
      min: 2,
      max: 2,
      index: 0,
      optionIds: formatoOptions.map(o => o.id)
    },
    {
      id: ogRefri1Id,
      name: '1º Refrigerante do Combo (Lata 350ml)',
      status: 'AVAILABLE',
      min: 1,
      max: 1,
      index: 1,
      optionIds: refri1Options.map(o => o.id)
    },
    {
      id: ogRefri2Id,
      name: '2º Refrigerante do Combo (Lata 350ml)',
      status: 'AVAILABLE',
      min: 1,
      max: 1,
      index: 2,
      optionIds: refri2Options.map(o => o.id)
    },
    {
      id: ogAdicionaisId,
      name: 'Turbine seu Combo com Adicionais Extras? (Opcional)',
      status: 'AVAILABLE',
      min: 0,
      max: 10,
      index: 3,
      optionIds: adicionaisOptions.map(o => o.id)
    }
  ];

  const options = [...formatoOptions, ...refri1Options, ...refri2Options, ...adicionaisOptions];

  const payload = {
    item: {
      id: itemId,
      productId,
      categoryId: CAT_COMBOS,
      status: 'AVAILABLE',
      price: { value: 68.90 }
    },
    products,
    optionGroups,
    options
  };

  await request('/items', 'PUT', payload);
  console.log('✓ Combo Casal configurado com Sucesso!');
}

async function configurarComboFamilia() {
  console.log('⭐ Configurando complementos do Combo Família no iFood...');
  const itemId = '356850e2-d87d-4261-bcdc-b5794469afdf';
  const productId = '11ec186b-dc70-4d86-9cbd-2b183ff9605e';

  const ogFormatoId = genUuid();
  const ogAdicionaisId = genUuid();

  // Opções Formato dos 3 Dogs (min 3, max 3)
  const formatoOptions = [
    {
      id: genUuid(),
      productId: PROD_PAO_ID,
      optionGroupId: ogFormatoId,
      status: 'AVAILABLE',
      index: 0,
      price: { value: 0 }
    },
    {
      id: genUuid(),
      productId: PROD_PRATO_ID,
      optionGroupId: ogFormatoId,
      status: 'AVAILABLE',
      index: 1,
      price: { value: 2.00 }
    }
  ];

  // Opções Adicionais Extras
  const adicionaisOptions = ADICIONAIS_DEFS.map((a, idx) => ({
    id: genUuid(),
    productId: a.id,
    optionGroupId: ogAdicionaisId,
    status: 'AVAILABLE',
    index: idx,
    price: { value: a.preco }
  }));

  const products = [
    {
      id: productId,
      name: 'Combo Família Mordidaço',
      description: '2 Mordidaços em Dobro + 1 Mordidaço Clássico (escolha individual no Pão ou no Prato para cada um) + 1 Guaraná Antarctica 2 Litros + 3 Potes de Molho da Casa (50ml). Fartura garantida para toda a família!',
      serving: 'SERVES_3',
      optionGroups: [
        { id: ogFormatoId, min: 3, max: 3, index: 0 },
        { id: ogAdicionaisId, min: 0, max: 10, index: 1 }
      ]
    },
    { id: PROD_PAO_ID, name: '🥖 Tradicional de Rua (No Pão)', serving: 'NOT_APPLICABLE' },
    { id: PROD_PRATO_ID, name: '🥣 No Prato (+ R$ 2,00) - Marmitinha Térmica 500ml', serving: 'NOT_APPLICABLE' }
  ];

  ADICIONAIS_DEFS.forEach(a => products.push({ id: a.id, name: a.name, serving: 'NOT_APPLICABLE' }));

  const optionGroups = [
    {
      id: ogFormatoId,
      name: 'Escolha o Formato dos 3 Dogs (Selecione 3 opções)',
      status: 'AVAILABLE',
      min: 3,
      max: 3,
      index: 0,
      optionIds: formatoOptions.map(o => o.id)
    },
    {
      id: ogAdicionaisId,
      name: 'Turbine seu Combo com Adicionais Extras? (Opcional)',
      status: 'AVAILABLE',
      min: 0,
      max: 10,
      index: 1,
      optionIds: adicionaisOptions.map(o => o.id)
    }
  ];

  const options = [...formatoOptions, ...adicionaisOptions];

  const payload = {
    item: {
      id: itemId,
      productId,
      categoryId: CAT_COMBOS,
      status: 'AVAILABLE',
      price: { value: 86.90 }
    },
    products,
    optionGroups,
    options
  };

  await request('/items', 'PUT', payload);
  console.log('✓ Combo Família configurado com Sucesso!');
}

async function main() {
  await configurarComboCasal();
  await configurarComboFamilia();
  console.log('\n🎉 SUCESSO TOTAL! Combos Oficiais configurados no iFood com o Formato 2!');
}

main().catch(err => console.error('Erro:', err));
