/**
 * Script Oficial de Sincronização em Produção no iFood (Catalog API v2.0)
 * Loja: O Mordidaço - Dogs (Campinas - SP)
 * Merchant UUID: 1aafd9ac-f972-49bd-9a5d-9fec4036132e
 * Catalog UUID: bb3534e9-c3c5-42db-b9cb-b63d53ce9ce1
 */

const { obterTokenAcesso } = require('./integracao_ifood');

const MERCHANT_ID = '1aafd9ac-f972-49bd-9a5d-9fec4036132e';
const CATALOG_ID = 'bb3534e9-c3c5-42db-b9cb-b63d53ce9ce1';

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

async function obterOuCriarCategoria(nome, sequence = 1) {
  const categorias = await request(`/catalogs/${CATALOG_ID}/categories`);
  const existente = categorias.find(c => c.name.toLowerCase().includes(nome.toLowerCase().trim()) || nome.toLowerCase().includes(c.name.toLowerCase().trim()));
  if (existente) {
    console.log(`✓ Categoria existente encontrada: "${existente.name}" (${existente.id})`);
    return existente;
  }
  console.log(`📂 Criando categoria "${nome}"...`);
  const nova = await request(`/catalogs/${CATALOG_ID}/categories`, 'POST', {
    name: nome,
    status: 'AVAILABLE',
    sequence,
    template: 'DEFAULT'
  });
  console.log(`✓ Categoria criada com sucesso: "${nova.name}" (${nova.id})`);
  return nova;
}

async function criarProduto(nome, descricao, serving = 'SERVES_1') {
  return request('/products', 'POST', {
    name: nome,
    description: descricao,
    serving
  });
}

async function atualizarProduto(productId, nome, descricao, serving = 'SERVES_1') {
  return request(`/products/${productId}`, 'PUT', {
    name: nome,
    description: descricao,
    serving
  });
}

async function atualizarPrecoItem(itemId, preco) {
  return request('/items/price', 'PATCH', {
    itemId,
    price: { value: preco }
  });
}

async function vincularItem(categoryId, productId, preco) {
  return request('/items', 'PUT', {
    item: {
      productId,
      categoryId,
      status: 'AVAILABLE',
      price: { value: preco }
    }
  });
}

async function sincronizarTudo() {
  console.log('🚀 Iniciando sincronização completa do cardápio oficial no iFood Produção...');

  // 1. Obter Categorias
  const catCombos = await obterOuCriarCategoria('Combos Campeões', 1);
  const catHotdogs = await obterOuCriarCategoria('Cachorros-Quentes Artesanais', 2);
  const catSobremesas = await obterOuCriarCategoria('Sobremesas no Pote', 3);
  const catAdicionais = await obterOuCriarCategoria('➕ Adicionais Extras', 4);
  const catBebidas = await obterOuCriarCategoria('🥤 Bebidas Geladas', 5);

  // 2. Atualizar Lanches Existentes
  console.log('\n🌭 Atualizando lanches existentes em Cachorros-Quentes Artesanais...');
  
  // Mordidaço Clássico
  await atualizarProduto(
    'c34954eb-157d-47cf-9de3-5539edec8b8d',
    'Mordidaço Clássico',
    '1 salsicha Sadia, maionese Hellmann\'s, ketchup, mostarda, milho, ervilha, vinagrete, purê de batata artesanal e batata palha crocante.'
  );
  await atualizarPrecoItem('205606e9-8269-464d-ba3d-19461ed49ff9', 22.90);
  console.log('  ✓ Mordidaço Clássico atualizado: R$ 22,90');

  // Mordidaço em Dobro
  await atualizarProduto(
    '3876535e-059a-44cc-8212-e1388f8d85a8',
    'Mordidaço em Dobro',
    'O campeão de vendas! 2 salsichas Sadia, o verdadeiro dobro de queijo muçarela derretido, maionese Hellmann\'s, ketchup, mostarda, milho, ervilha, vinagrete, purê artesanal, batata palha e chuva de parmesão ralado por cima.'
  );
  await atualizarPrecoItem('1325b091-7041-459c-9035-bed1f073b390', 28.90);
  console.log('  ✓ Mordidaço em Dobro atualizado: R$ 28,90');

  // Mordidaço Bacon
  await atualizarProduto(
    'a81c6165-fcc4-4376-8fa6-70386ee3dc98',
    'Mordidaço Bacon',
    '2 salsichas Sadia, maionese Hellmann\'s, purê de batata artesanal, milho, ervilha, bacon crocante em cubos, queijo muçarela derretido, batata palha e parmesão ralado por cima.'
  );
  await atualizarPrecoItem('1dc9c6ba-88c1-45a5-ad5f-556fb7d667da', 33.90);
  console.log('  ✓ Mordidaço Bacon atualizado: R$ 33,90');

  // Mordidaço Cremoso
  await atualizarProduto(
    '31b11fd2-79b3-4229-a1cc-85839bc9a322',
    'Mordidaço Cremoso',
    '1 salsicha Sadia, frango desfiado temperado, Catupiry® Original cremoso, maionese Hellmann\'s, ketchup, mostarda, milho, vinagrete, purê de batata artesanal e batata palha crocante.'
  );
  await atualizarPrecoItem('a758a12b-4ca2-43e3-8184-bebd525aed5e', 34.90);
  console.log('  ✓ Mordidaço Cremoso atualizado: R$ 34,90');

  // 3. Cadastrar Novos Lanches
  console.log('\n🌱 Cadastrando novos modelos de lanches...');
  
  // Mordidaço Queijudo (VEG)
  const prodVeg = await criarProduto(
    'Mordidaço Queijudo (VEG)',
    '🌱 Opção Vegetariana! 2 palitos de queijo empanados crocantes com queijo puxa-puxa derretido, purê artesanal da casa, vinagrete fresco, milho, ketchup, mostarda, maionese Hellmann\'s e batata palha crocante.',
    'SERVES_1'
  );
  await vincularItem(catHotdogs.id, prodVeg.id, 31.90);
  console.log('  ✓ Mordidaço Queijudo (VEG) cadastrado: R$ 31,90');

  // Mordidaço Tudão
  const prodTudao = await criarProduto(
    'Mordidaço Tudão',
    'O gigante da casa! 1 salsicha Sadia, frango desfiado temperado, Catupiry® Original, purê artesanal, maionese Hellmann\'s, ketchup, mostarda, milho, ervilha, vinagrete, bacon em dobro, calabresa ralada douradinha, queijo muçarela em dobro derretido, batata palha e parmesão ralado por cima.',
    'SERVES_1'
  );
  await vincularItem(catHotdogs.id, prodTudao.id, 44.90);
  console.log('  ✓ Mordidaço Tudão cadastrado: R$ 44,90');

  // 4. Atualizar e Cadastrar Combos
  console.log('\n⭐ Atualizando e Cadastrando Combos Campeões...');
  await atualizarProduto(
    '671428a3-b3f7-4ead-b0cf-0582cf658b0a',
    'Combo Mordidaço Casal',
    '2 Mordidaços em Dobro (escolha individual no Pão ou no Prato para cada um) + 2 Refrigerantes Lata (escolha Coca, Guaraná ou Fanta) + 2 Potes de Molho da Casa (50ml). A janta perfeita para dois!',
    'SERVES_2'
  );
  await atualizarPrecoItem('3ecab1bc-295b-4ce1-8235-a898c6a68b45', 68.90);
  console.log('  ✓ Combo Mordidaço Casal atualizado: R$ 68,90');

  await atualizarProduto(
    '11ec186b-dc70-4d86-9cbd-2b183ff9605e',
    'Combo Família Mordidaço',
    '2 Mordidaços em Dobro + 1 Mordidaço Clássico (escolha individual no Pão ou no Prato para cada um) + 1 Refrigerante 2 Litros (Guaraná incluso ou upgrade Coca 2L) + 3 Potes de Molho da Casa (50ml). Fartura garantida para toda a família!',
    'SERVES_3'
  );
  await atualizarPrecoItem('356850e2-d87d-4261-bcdc-b5794469afdf', 86.90);
  console.log('  ✓ Combo Família Mordidaço atualizado: R$ 86,90');

  // Novos Combos Estratégicos
  const novosCombos = [
    {
      nome: 'Mordidaço Solo Clássico',
      descricao: '1 Mordidaço Clássico (escolha No Pão ou No Prato) + 1 Refrigerante Lata 350ml + 2 Potes de Maionese da Casa.',
      preco: 28.90,
      serving: 'SERVES_1'
    },
    {
      nome: 'Mordidaço Solo Campeão',
      descricao: '1 Mordidaço em Dobro (2 salsichas Sadia e dobro de muçarela) + 1 Refrigerante Lata 350ml + 2 Potes de Maionese da Casa. O campeão de vendas individual!',
      preco: 33.90,
      serving: 'SERVES_1'
    },
    {
      nome: 'Mordidaço Completo c/ Sobremesa',
      descricao: '1 Mordidaço em Dobro (No Pão ou No Prato) + 1 Refrigerante Lata + 1 Tortinha de Limão no Pote (170ml) + 2 Potes de Maionese. A refeição completa!',
      preco: 45.90,
      serving: 'SERVES_1'
    },
    {
      nome: 'Mordidaço Solo Tudão',
      descricao: '1 Mordidaço Tudão (o gigante da casa!) + 1 Refrigerante Lata 350ml + 2 Potes de Maionese da Casa. Fartura máxima!',
      preco: 48.90,
      serving: 'SERVES_1'
    },
    {
      nome: 'Mordidaço Casal VIP (com Sobremesas)',
      descricao: '2 Mordidaços em Dobro + 2 Refrigerantes Lata + 1 Tortinha de Limão (170ml) + 1 Escondidinho de Nutella c/ Brownie (170ml) + 2 Potes de Maionese da Casa. A experiência completa a dois!',
      preco: 96.90,
      serving: 'SERVES_2'
    }
  ];

  for (const nc of novosCombos) {
    const prod = await criarProduto(nc.nome, nc.descricao, nc.serving);
    await vincularItem(catCombos.id, prod.id, nc.preco);
    console.log(`  ✓ ${nc.nome} cadastrado e vinculado: R$ ${nc.preco.toFixed(2)}`);
  }

  // 5. Cadastrar Sobremesa 2 (Escondidinho de Nutella)
  console.log('\n🍰 Cadastrando Escondidinho de Nutella com Brownie...');
  const prodNutella = await criarProduto(
    'Escondidinho de Nutella com Brownie (170ml)',
    'Base e topo de brigadeiro cremoso de Leite Ninho®, recheado com pedaços de brownie artesanal e Nutella® Ferrero pura. Uma explosão de sabor! Acompanha colherzinha lacrada! (~155g).',
    'SERVES_1'
  );
  await vincularItem(catSobremesas.id, prodNutella.id, 21.90);
  console.log('  ✓ Escondidinho de Nutella com Brownie vinculado: R$ 21,90');

  // 6. Cadastrar Adicionais Extras
  console.log('\n➕ Cadastrando Adicionais Extras...');
  const adicionais = [
    { nome: '1 Salsicha Sadia Extra', descricao: 'Salsicha Sadia cozida no molho artesanal.', preco: 4.90 },
    { nome: 'Catupiry Original Extra (40g)', descricao: 'Legítimo Catupiry cremoso original.', preco: 6.90 },
    { nome: 'Bacon Crocante Extra em Cubos (40g)', descricao: 'Bacon em cubos douradinho e sequinho.', preco: 6.90 },
    { nome: 'Calabresa Ralada Douradinha (40g)', descricao: 'Calabresa fininha refogada.', preco: 5.90 },
    { nome: 'Parmesão Ralado Fresco (20g)', descricao: 'Queijo parmesão ralado na hora.', preco: 4.50 },
    { nome: 'Purê de Batata Artesanal Extra (80g)', descricao: 'Purê aveludado e quentinho.', preco: 4.90 },
    { nome: 'Milho Verde Extra', descricao: 'Milho verde selecionado.', preco: 3.50 },
    { nome: 'Ervilha Extra', descricao: 'Ervilha fresca em conserva.', preco: 3.50 },
    { nome: 'Pote de Molho Especial da Casa (50ml)', descricao: 'Pote extra com a maionese temperada da casa.', preco: 4.50 },
    { nome: 'Batata Palha Crocante Extra', descricao: 'Chuva extra de batata palha fininha.', preco: 3.50 }
  ];

  for (const a of adicionais) {
    const prod = await criarProduto(a.nome, a.descricao, 'NOT_APPLICABLE');
    await vincularItem(catAdicionais.id, prod.id, a.preco);
    console.log(`  ✓ Adicional vinculado: ${a.nome} (R$ ${a.preco.toFixed(2)})`);
  }

  // 7. Cadastrar Bebidas Geladas
  console.log('\n🥤 Cadastrando Bebidas Geladas...');
  const bebidas = [
    { nome: 'Coca-Cola Original 350ml (Lata)', descricao: 'Lata 350ml trincando de gelada.', preco: 7.90 },
    { nome: 'Coca-Cola Zero 350ml (Lata)', descricao: 'Lata 350ml sem açúcar gelada.', preco: 7.90 },
    { nome: 'Guaraná Antarctica 350ml (Lata)', descricao: 'Lata 350ml trincando de gelada.', preco: 7.90 },
    { nome: 'Guaraná Antarctica Zero 350ml (Lata)', descricao: 'Lata 350ml zero açúcar.', preco: 7.90 },
    { nome: 'Fanta Laranja 350ml (Lata)', descricao: 'Lata 350ml gelada.', preco: 7.90 },
    { nome: 'Suco Del Valle Uva 290ml (Lata)', descricao: 'Lata 290ml gelada.', preco: 8.50 },
    { nome: 'Coca-Cola Original 2 Litros', descricao: 'Garrafa 2 Litros gelada.', preco: 17.90 },
    { nome: 'Guaraná Antarctica 2 Litros', descricao: 'Garrafa 2 Litros gelada.', preco: 15.90 },
    { nome: 'Água Mineral 500ml (sem gás)', descricao: 'Garrafa 500ml gelada.', preco: 5.00 },
    { nome: 'Água Mineral 500ml (com gás)', descricao: 'Garrafa 500ml gelada.', preco: 5.50 },
    { nome: 'Cerveja Original 350ml (Lata)', descricao: 'Lata 350ml trincando de gelada.', preco: 9.90 },
    { nome: 'Cerveja Heineken 330ml (Long Neck)', descricao: 'Long Neck 330ml gelada.', preco: 12.90 }
  ];

  for (const b of bebidas) {
    const prod = await criarProduto(b.nome, b.descricao, 'NOT_APPLICABLE');
    await vincularItem(catBebidas.id, prod.id, b.preco);
    console.log(`  ✓ Bebida vinculada: ${b.nome} (R$ ${b.preco.toFixed(2)})`);
  }

  console.log('\n🎉 SUCESSO TOTAL E ABSOLUTO! O cardápio oficial de O Mordidaço está 100% ATUALIZADO no iFood de Produção!');
}

sincronizarTudo().catch(err => {
  console.error('\n❌ Falha na sincronização:', err.message);
});
