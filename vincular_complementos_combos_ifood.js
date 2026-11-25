/**
 * Script para Configurar Complementos dos Combos Oficiais no iFood (Formato 2):
 * - Combo Família (3 Dogs + Bebida 2L com Escolha e Upgrade + Adicionais)
 * - Combo Casal e Casal VIP (2 Dogs + 2 Refris Lata + Adicionais)
 * - Combos Solos (Formato + Refri Incluso + Retiradas + Adicionais)
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

const BEBIDAS_2L_DEFS = [
  { id: '44444444-0001-4000-8000-000000000001', name: '🟢 1x Guaraná Antarctica 1,5L (Tradicional ou Diet)', preco: 0 },
  { id: '44444444-0003-4000-8000-000000000003', name: '🔴 Upgrade: 1x Coca-Cola 2,5L (Original)', preco: 3.00 },
  { id: '44444444-0004-4000-8000-000000000004', name: '🔴 Upgrade: 1x Coca-Cola 2,5L Zero', preco: 3.00 }
];

const REFRIS_DEFS = [
  { id: '33333333-0001-4000-8000-000000000001', name: '1x Coca-Cola Original 350ml (Lata)' },
  { id: '33333333-0002-4000-8000-000000000002', name: '1x Coca-Cola Zero 350ml (Lata)' },
  { id: '33333333-0006-4000-8000-000000000006', name: '1x Suco Del Valle Goiaba 290ml (Lata)' },
  { id: '33333333-0008-4000-8000-000000000008', name: '1x Refresco Del Valle Limon Tropical 290ml' },
  { id: '33333333-0007-4000-8000-000000000007', name: '1x Água Mineral 510ml (sem gás)' }
];

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
  { id: '22222222-0009-4000-8000-000000000009', name: 'Pote de Molho Especial da Casa (30ml)', preco: 4.50 },
  { id: '22222222-0010-4000-8000-000000000010', name: 'Batata Palha Crocante Extra', preco: 3.50 }
];

const MOLHOS_SOLO_DEFS = [
  { id: '55555555-0001-4000-8000-000000000001', name: '🌿 1x Molho Verde + 🫒 1x Molho Azeitona', preco: 0 },
  { id: '55555555-0002-4000-8000-000000000002', name: '🌿 2x Molho Verde de Ervas (Só Verde)', preco: 0 },
  { id: '55555555-0003-4000-8000-000000000003', name: '🫒 2x Molho de Azeitona Azapa (Só Azeitona)', preco: 0 },
  { id: '55555555-0004-4000-8000-000000000004', name: '❌ Não enviar molhos (Dispensar cortesia)', preco: 0 }
];

const MOLHOS_CASAL_DEFS = [
  { id: '55555555-0005-4000-8000-000000000001', name: '🌿 2x Molho Verde + 🫒 2x Molho Azeitona', preco: 0 },
  { id: '55555555-0005-4000-8000-000000000002', name: '🌿 4x Molho Verde de Ervas (Só Verde)', preco: 0 },
  { id: '55555555-0005-4000-8000-000000000003', name: '🫒 4x Molho de Azeitona Azapa (Só Azeitona)', preco: 0 },
  { id: '55555555-0005-4000-8000-000000000004', name: '❌ Não enviar molhos (Dispensar cortesia)', preco: 0 }
];

const MOLHOS_FAMILIA_DEFS = [
  { id: '55555555-0006-4000-8000-000000000001', name: '🌿 3x Molho Verde + 🫒 3x Molho Azeitona', preco: 0 },
  { id: '55555555-0006-4000-8000-000000000002', name: '🌿 6x Molho Verde de Ervas (Só Verde)', preco: 0 },
  { id: '55555555-0006-4000-8000-000000000003', name: '🫒 6x Molho de Azeitona Azapa (Só Azeitona)', preco: 0 },
  { id: '55555555-0006-4000-8000-000000000004', name: '❌ Não enviar molhos (Dispensar cortesia)', preco: 0 }
];

async function configurarComboFamilia() {
  console.log('⭐ Configurando Combo Família Mordidaço com Bebida 2L e Upgrade...');
  const itemId = '356850e2-d87d-4261-bcdc-b5794469afdf';
  const productId = '11ec186b-dc70-4d86-9cbd-2b183ff9605e';

  const ogFormatoId = genUuid();
  const ogBebida2LId = genUuid();
  const ogMolhosId = genUuid();
  const ogAdicionaisId = genUuid();

  const formatoOptions = [
    { id: genUuid(), productId: PROD_PAO_ID, optionGroupId: ogFormatoId, status: 'AVAILABLE', index: 0, price: { value: 0 } },
    { id: genUuid(), productId: PROD_PRATO_ID, optionGroupId: ogFormatoId, status: 'AVAILABLE', index: 1, price: { value: 2.00 } }
  ];

  const bebida2LOptions = BEBIDAS_2L_DEFS.map((b, idx) => ({
    id: genUuid(),
    productId: b.id,
    optionGroupId: ogBebida2LId,
    status: 'AVAILABLE',
    index: idx,
    price: { value: b.preco }
  }));

  const molhosOptions = MOLHOS_FAMILIA_DEFS.map((m, idx) => ({
    id: genUuid(),
    productId: m.id,
    optionGroupId: ogMolhosId,
    status: 'AVAILABLE',
    index: idx,
    price: { value: 0 }
  }));

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
      description: '2 Mordidaços em Dobro + 1 Mordidaço Clássico + 1 Refri 2 Litros (Guaraná ou upgrade Coca 2L) + 3 Potes de Molho.',
      serving: 'SERVES_3',
      optionGroups: [
        { id: ogFormatoId, min: 3, max: 3, index: 0 },
        { id: ogBebida2LId, min: 1, max: 1, index: 1 },
        { id: ogMolhosId, min: 1, max: 1, index: 2 },
        { id: ogAdicionaisId, min: 0, max: 10, index: 3 }
      ]
    },
    { id: PROD_PAO_ID, name: '🥖 Tradicional de Rua (No Pão Bambini 70g)', serving: 'NOT_APPLICABLE' },
    { id: PROD_PRATO_ID, name: '🥣 No Prato', serving: 'NOT_APPLICABLE' }
  ];

  BEBIDAS_2L_DEFS.forEach(b => products.push({ id: b.id, name: b.name, serving: 'NOT_APPLICABLE' }));
  MOLHOS_FAMILIA_DEFS.forEach(m => products.push({ id: m.id, name: m.name, serving: 'NOT_APPLICABLE' }));
  ADICIONAIS_DEFS.forEach(a => products.push({ id: a.id, name: a.name, serving: 'NOT_APPLICABLE' }));

  const optionGroups = [
    {
      id: ogFormatoId,
      name: 'Escolha o Formato dos 3 Dogs (Selecione 3)',
      status: 'AVAILABLE',
      min: 3,
      max: 3,
      index: 0,
      optionIds: formatoOptions.map(o => o.id)
    },
    {
      id: ogBebida2LId,
      name: 'Escolha a Bebida de 2 Litros da Família',
      status: 'AVAILABLE',
      min: 1,
      max: 1,
      index: 1,
      optionIds: bebida2LOptions.map(o => o.id)
    },
    {
      id: ogMolhosId,
      name: '🎁 Escolha os Molhos Cortesia da Casa (Obrigatório)',
      status: 'AVAILABLE',
      min: 1,
      max: 1,
      index: 2,
      optionIds: molhosOptions.map(o => o.id)
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

  const options = [...formatoOptions, ...bebida2LOptions, ...molhosOptions, ...adicionaisOptions];

  await request('/items', 'PUT', {
    item: { id: itemId, productId, categoryId: CAT_COMBOS, status: 'AVAILABLE', price: { value: 86.90 } },
    products,
    optionGroups,
    options
  });
  console.log('✓ Combo Família configurado com Bebida 2L e Upgrade no iFood!');
}

async function configurarComboDuplo(itemId, productId, nomeCombo, preco, serving) {
  console.log(`⭐ Configurando ${nomeCombo}...`);
  const ogFormatoId = genUuid();
  const ogRefri1Id = genUuid();
  const ogRefri2Id = genUuid();
  const ogMolhosId = genUuid();
  const ogAdicionaisId = genUuid();

  const formatoOptions = [
    { id: genUuid(), productId: PROD_PAO_ID, optionGroupId: ogFormatoId, status: 'AVAILABLE', index: 0, price: { value: 0 } },
    { id: genUuid(), productId: PROD_PRATO_ID, optionGroupId: ogFormatoId, status: 'AVAILABLE', index: 1, price: { value: 2.00 } }
  ];

  const refri1Options = REFRIS_DEFS.map((r, idx) => ({
    id: genUuid(),
    productId: r.id,
    optionGroupId: ogRefri1Id,
    status: 'AVAILABLE',
    index: idx,
    price: { value: 0 }
  }));

  const refri2Options = REFRIS_DEFS.map((r, idx) => ({
    id: genUuid(),
    productId: r.id,
    optionGroupId: ogRefri2Id,
    status: 'AVAILABLE',
    index: idx,
    price: { value: 0 }
  }));

  const molhosOptions = MOLHOS_CASAL_DEFS.map((m, idx) => ({
    id: genUuid(),
    productId: m.id,
    optionGroupId: ogMolhosId,
    status: 'AVAILABLE',
    index: idx,
    price: { value: 0 }
  }));

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
      name: nomeCombo,
      description: 'Combo para 2 pessoas.',
      serving,
      optionGroups: [
        { id: ogFormatoId, min: 2, max: 2, index: 0 },
        { id: ogRefri1Id, min: 1, max: 1, index: 1 },
        { id: ogRefri2Id, min: 1, max: 1, index: 2 },
        { id: ogMolhosId, min: 1, max: 1, index: 3 },
        { id: ogAdicionaisId, min: 0, max: 10, index: 4 }
      ]
    },
    { id: PROD_PAO_ID, name: '🥖 Tradicional de Rua (No Pão Bambini 70g)', serving: 'NOT_APPLICABLE' },
    { id: PROD_PRATO_ID, name: '🥣 No Prato', serving: 'NOT_APPLICABLE' }
  ];

  REFRIS_DEFS.forEach(r => products.push({ id: r.id, name: r.name, serving: 'NOT_APPLICABLE' }));
  MOLHOS_CASAL_DEFS.forEach(m => products.push({ id: m.id, name: m.name, serving: 'NOT_APPLICABLE' }));
  ADICIONAIS_DEFS.forEach(a => products.push({ id: a.id, name: a.name, serving: 'NOT_APPLICABLE' }));

  const optionGroups = [
    {
      id: ogFormatoId,
      name: 'Escolha o Formato dos 2 Dogs (Selecione 2)',
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
      id: ogMolhosId,
      name: '🎁 Escolha os Molhos Cortesia da Casa (Obrigatório)',
      status: 'AVAILABLE',
      min: 1,
      max: 1,
      index: 3,
      optionIds: molhosOptions.map(o => o.id)
    },
    {
      id: ogAdicionaisId,
      name: 'Turbine seu Combo com Adicionais Extras? (Opcional)',
      status: 'AVAILABLE',
      min: 0,
      max: 10,
      index: 4,
      optionIds: adicionaisOptions.map(o => o.id)
    }
  ];

  const options = [...formatoOptions, ...refri1Options, ...refri2Options, ...molhosOptions, ...adicionaisOptions];

  await request('/items', 'PUT', {
    item: { id: itemId, productId, categoryId: CAT_COMBOS, status: 'AVAILABLE', price: { value: preco } },
    products,
    optionGroups,
    options
  });
  console.log(`✓ ${nomeCombo} configurado com sucesso!`);
}

async function configurarComboSolo(itemId, productId, nomeCombo, preco) {
  console.log(`⭐ Configurando ${nomeCombo}...`);
  const ogFormatoId = genUuid();
  const ogRefriId = genUuid();
  const ogMolhosId = genUuid();
  const ogRetirarId = genUuid();
  const ogAdicionaisId = genUuid();

  const formatoOptions = [
    { id: genUuid(), productId: PROD_PAO_ID, optionGroupId: ogFormatoId, status: 'AVAILABLE', index: 0, price: { value: 0 } },
    { id: genUuid(), productId: PROD_PRATO_ID, optionGroupId: ogFormatoId, status: 'AVAILABLE', index: 1, price: { value: 2.00 } }
  ];

  const refriOptions = REFRIS_DEFS.map((r, idx) => ({
    id: genUuid(),
    productId: r.id,
    optionGroupId: ogRefriId,
    status: 'AVAILABLE',
    index: idx,
    price: { value: 0 }
  }));

  const molhosOptions = MOLHOS_SOLO_DEFS.map((m, idx) => ({
    id: genUuid(),
    productId: m.id,
    optionGroupId: ogMolhosId,
    status: 'AVAILABLE',
    index: idx,
    price: { value: 0 }
  }));

  const retirarOptions = RETIRADAS_DEFS.map((r, idx) => ({
    id: genUuid(),
    productId: r.id,
    optionGroupId: ogRetirarId,
    status: 'AVAILABLE',
    index: idx,
    price: { value: 0 }
  }));

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
      name: nomeCombo,
      description: 'Combo individual.',
      serving: 'SERVES_1',
      optionGroups: [
        { id: ogFormatoId, min: 1, max: 1, index: 0 },
        { id: ogRefriId, min: 1, max: 1, index: 1 },
        { id: ogMolhosId, min: 1, max: 1, index: 2 },
        { id: ogRetirarId, min: 0, max: 10, index: 3 },
        { id: ogAdicionaisId, min: 0, max: 10, index: 4 }
      ]
    },
    { id: PROD_PAO_ID, name: '🥖 Tradicional de Rua (No Pão Bambini 70g)', serving: 'NOT_APPLICABLE' },
    { id: PROD_PRATO_ID, name: '🥣 No Prato', serving: 'NOT_APPLICABLE' }
  ];

  REFRIS_DEFS.forEach(r => products.push({ id: r.id, name: r.name, serving: 'NOT_APPLICABLE' }));
  MOLHOS_SOLO_DEFS.forEach(m => products.push({ id: m.id, name: m.name, serving: 'NOT_APPLICABLE' }));
  RETIRADAS_DEFS.forEach(r => products.push({ id: r.id, name: r.name, serving: 'NOT_APPLICABLE' }));
  ADICIONAIS_DEFS.forEach(a => products.push({ id: a.id, name: a.name, serving: 'NOT_APPLICABLE' }));

  const optionGroups = [
    {
      id: ogFormatoId,
      name: 'Escolha o Formato do Hot Dog',
      status: 'AVAILABLE',
      min: 1,
      max: 1,
      index: 0,
      optionIds: formatoOptions.map(o => o.id)
    },
    {
      id: ogRefriId,
      name: 'Escolha o Refrigerante Lata (350ml) incluso',
      status: 'AVAILABLE',
      min: 1,
      max: 1,
      index: 1,
      optionIds: refriOptions.map(o => o.id)
    },
    {
      id: ogMolhosId,
      name: '🎁 Escolha os Molhos Cortesia da Casa (Obrigatório)',
      status: 'AVAILABLE',
      min: 1,
      max: 1,
      index: 2,
      optionIds: molhosOptions.map(o => o.id)
    },
    {
      id: ogRetirarId,
      name: 'Deseja Retirar Algum Ingrediente? (Opcional)',
      status: 'AVAILABLE',
      min: 0,
      max: 10,
      index: 3,
      optionIds: retirarOptions.map(o => o.id)
    },
    {
      id: ogAdicionaisId,
      name: 'Turbine seu Combo com Adicionais Extras? (Opcional)',
      status: 'AVAILABLE',
      min: 0,
      max: 10,
      index: 4,
      optionIds: adicionaisOptions.map(o => o.id)
    }
  ];

  const options = [...formatoOptions, ...refriOptions, ...molhosOptions, ...retirarOptions, ...adicionaisOptions];

  await request('/items', 'PUT', {
    item: { id: itemId, productId, categoryId: CAT_COMBOS, status: 'AVAILABLE', price: { value: preco } },
    products,
    optionGroups,
    options
  });
  console.log(`✓ ${nomeCombo} configurado com sucesso!`);
}

async function main() {
  await configurarComboFamilia();
  await configurarComboDuplo('3ecab1bc-295b-4ce1-8235-a898c6a68b45', '671428a3-b3f7-4ead-b0cf-0582cf658b0a', 'Combo Mordidaço Casal', 68.90, 'SERVES_2');
  await configurarComboDuplo('0b5af259-0008-4e40-ae6d-33051ffdf840', '38bb329d-dd14-49f9-8725-bf6b86b75750', 'Mordidaço Casal VIP (com Sobremesas)', 96.90, 'SERVES_2');

  await configurarComboSolo('293ad361-17c6-4b81-bc5f-9d577a055cae', '805e7ba9-fd8f-4559-8cf9-d3a78a2bae84', 'Mordidaço Solo Clássico', 28.90);
  await configurarComboSolo('f42ec129-f2c5-407a-bf43-0f547ceb7bc4', '48fbfde1-0dac-4752-aff8-a5328bd8b8a2', 'Mordidaço Solo Campeão', 33.90);
  await configurarComboSolo('173d3fd1-68fe-4e9d-adb4-ee397c6e5b7d', 'c03da3b6-b1d2-4585-976d-3fedd13fd6bf', 'Mordidaço Completo c/ Sobremesa', 45.90);
  await configurarComboSolo('f6db864c-05e5-451d-97fd-ab360fe3ddee', '6c30a66a-2dd9-4728-844c-51596ae361ca', 'Mordidaço Solo Tudão', 48.90);

  console.log('\n🎉 SUCESSO TOTAL! Todos os 7 Combos Oficiais do iFood configurados no Formato 2!');
}

main().catch(err => console.error('Erro:', err));
