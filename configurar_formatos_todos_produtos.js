/**
 * Configuração de Formatos (No Pão vs No Prato + R$ 2,00) para Todos os Dogs e Combos
 * API Catalog v2.0 do iFood
 */

const { obterTokenAcesso } = require('./integracao_ifood');

const MERCHANT_ID = '1c6a85ea-2063-4bb9-a2ab-a198c2d9946b';
const CAT_HOTDOGS = '9e299ae8-f344-40a5-af46-dee338372652';
const CAT_COMBOS = '84b64714-e83c-46e7-98a0-4cb41980f462';

// Produtos das opções de formato
const PROD_PAO = '15336d63-1ba7-41af-97b4-6c71203ce535';
const PROD_PRATO = '73d5933f-2ca2-4ff6-96ed-fa2095b2930d';

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
    const err = await res.text();
    throw new Error(`[${res.status}] ${url}: ${err}`);
  }
  return res.json();
}

async function criarGrupoOpcoes(nome) {
  const grp = await request('/optionGroups', 'POST', { name: nome });
  
  // Cria Opção No Pão (R$ 0,00)
  const optPao = await request(`/optionGroups/${grp.id}/options`, 'POST', {
    productId: PROD_PAO,
    status: 'AVAILABLE',
    price: { value: 0 }
  });

  // Cria Opção No Prato (+ R$ 2,00)
  const optPrato = await request(`/optionGroups/${grp.id}/options`, 'POST', {
    productId: PROD_PRATO,
    status: 'AVAILABLE',
    price: { value: 2.00 }
  });

  return {
    id: grp.id,
    name: nome,
    optPaoId: optPao.id,
    optPratoId: optPrato.id
  };
}

async function atualizarItemComOpcoes(categoryId, itemId, productId, productName, productDesc, preco, optionGroupDefs) {
  const payloadProducts = [
    {
      id: productId,
      name: productName,
      description: productDesc,
      optionGroups: optionGroupDefs.map(g => ({
        id: g.id,
        min: 1,
        max: 1
      }))
    },
    { id: PROD_PAO, name: 'Tradicional no Pão Macio', serving: 'NOT_APPLICABLE' },
    { id: PROD_PRATO, name: 'No Prato (+ R$ 2,00) - Marmitinha Térmica 500ml', serving: 'NOT_APPLICABLE' }
  ];

  const payloadOptionGroups = optionGroupDefs.map(g => ({
    id: g.id,
    name: g.name,
    status: 'AVAILABLE',
    min: 1,
    max: 1,
    optionIds: [g.optPaoId, g.optPratoId]
  }));

  const payloadOptions = [];
  optionGroupDefs.forEach(g => {
    payloadOptions.push({
      id: g.optPaoId,
      optionGroupId: g.id,
      productId: PROD_PAO,
      status: 'AVAILABLE',
      price: { value: 0 }
    });
    payloadOptions.push({
      id: g.optPratoId,
      optionGroupId: g.id,
      productId: PROD_PRATO,
      status: 'AVAILABLE',
      price: { value: 2.00 }
    });
  });

  const payload = {
    item: {
      id: itemId,
      productId,
      categoryId,
      status: 'AVAILABLE',
      price: { value: preco }
    },
    products: payloadProducts,
    optionGroups: payloadOptionGroups,
    options: payloadOptions
  };

  return request('/items', 'PUT', payload);
}

async function executar() {
  console.log('🚀 Configurando opções de formato (No Pão / No Prato + R$ 2,00) em todo o cardápio...');

  // 1. Grupo Geral de Formato para Hot Dogs Individuais
  const grupoFormatoGeral = {
    id: 'fb239ff7-d911-46b2-9269-428ffa68be33',
    name: 'Escolha o Formato do Hot Dog',
    optPaoId: '3fa5394c-d1d9-4705-be41-ae45f1d69b59',
    optPratoId: 'ac4dc3f4-ea43-49c1-96db-be9e45419b39'
  };

  // 2. Vincular aos Dogs Individuais
  const dogsIndividuais = [
    {
      nome: 'Dog Tradicional do Mordidaço',
      itemId: '64aaeef9-63bc-4cde-a9e5-18e387ce4361',
      prodId: '8afaca0f-0931-4588-8d20-e4ede56ba6d8',
      desc: '1 salsicha Perdigão no molho fervilhante, base de purê de batata artesanal cremoso, milho, vinagrete caseiro, maionese verde secreta e queijo parmesão ralado fresco na hora.',
      preco: 21.90
    },
    {
      nome: 'Dog Bacon Supreme',
      itemId: '6c903bd6-eadf-421b-9daf-82f014a7f9ff',
      prodId: '2d202aa0-4a7c-40be-9bad-ef6fae26e185',
      desc: '2 salsichas Perdigão, purê artesanal, molho de tomate refogado, muçarela derretida no calor do molho, coberto com chuva de bacon crocante dourado em cubos.',
      preco: 29.90
    },
    {
      nome: 'Dog Frango Catupiry',
      itemId: 'e9b25a06-3174-4f0a-8715-dd2ec8333a2b',
      prodId: 'b4c4801b-3929-4c58-8557-53f90afcdd05',
      desc: '2 salsichas Perdigão, purê cremoso, peito de frango desfiado refogado bem temperadinho e o legítimo Catupiry original maçaricado com parmesão ralado na hora.',
      preco: 29.90
    }
  ];

  for (const d of dogsIndividuais) {
    console.log(`🌭 Vinculando opções ao ${d.nome}...`);
    await atualizarItemComOpcoes(CAT_HOTDOGS, d.itemId, d.prodId, d.nome, d.desc, d.preco, [grupoFormatoGeral]);
    console.log(`  ✓ ${d.nome} configurado com No Pão / No Prato (+ R$ 2,00)!`);
  }

  // 3. Criar Grupos Individuais para os Combos
  console.log('\n⭐ Criando grupos de escolha para os Combos...');
  const grpComboCasal1 = await criarGrupoOpcoes('1º Dog Duplo Especial: Escolha o Formato');
  const grpComboCasal2 = await criarGrupoOpcoes('2º Dog Duplo Especial: Escolha o Formato');
  console.log('✓ Grupos do Combo Casal criados!');

  console.log('⭐ Atualizando Combo Casal do Mordidaço...');
  await atualizarItemComOpcoes(
    CAT_COMBOS,
    '236e55fd-1b49-47db-a9f5-befa1da95899',
    'b6be19a6-7e20-4b2c-a63c-375946cda79d',
    'Combo Casal do Mordidaço',
    '2 Dogs Duplos Especiais (escolha individual no Pão ou no Prato para cada um) + 2 Refrigerantes Lata (ou 1 Guaraná 2L) + 2 Potes de Maionese Verde Secreta da Casa (50ml). A janta perfeita para dois!',
    49.90,
    [grpComboCasal1, grpComboCasal2]
  );
  console.log('  ✓ Combo Casal configurado com escolha independente para o 1º e 2º dog (+ R$ 2,00 no prato)!');

  // Combo Família (3 Dogs)
  const grpComboFam1 = await criarGrupoOpcoes('1º Dog Duplo Especial: Escolha o Formato');
  const grpComboFam2 = await criarGrupoOpcoes('2º Dog Duplo Especial: Escolha o Formato');
  const grpComboFam3 = await criarGrupoOpcoes('3º Dog Tradicional: Escolha o Formato');
  console.log('✓ Grupos do Combo Família criados!');

  console.log('⭐ Atualizando Combo Família do Tamoio...');
  await atualizarItemComOpcoes(
    CAT_COMBOS,
    '82b30cec-f89e-45a4-a2d4-ad832dbefb19',
    'e280a023-eb6b-454d-a335-261558a31723',
    'Combo Família do Tamoio',
    '2 Dogs Duplos Especiais + 1 Dog Tradicional + 1 Guaraná Antarctica 2 Litros bem gelado + 2 Potes generosos da Maionese Verde artesanal da casa.',
    69.90,
    [grpComboFam1, grpComboFam2, grpComboFam3]
  );
  console.log('  ✓ Combo Família configurado com escolha independente para os 3 dogs (+ R$ 2,00 no prato)!');

  console.log('\n🎉 PARABÉNS! TODOS os hot dogs e TODOS os combos agora exigem obrigatoriamente a escolha No Pão (R$ 0,00) ou No Prato (+ R$ 2,00) no iFood!');
}

executar().catch(e => console.error('❌ Falha:', e.message));
