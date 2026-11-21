/**
 * Script de Ingestão do Cardápio Oficial de O Mordidaço na API Catalog v2.0 do iFood
 */

const { obterTokenAcesso } = require('./integracao_ifood');

const MERCHANT_ID = process.env.IFOOD_MERCHANT_ID || '1aafd9ac-f972-49bd-9a5d-9fec4036132e';
const CATALOG_ID = process.env.IFOOD_CATALOG_ID || '3dab72cd-7f8d-4bc6-9131-f5d0ad9779e9';

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
  return res.json();
}

async function criarCategoria(nome, sequence = 1) {
  return request(`/catalogs/${CATALOG_ID}/categories`, 'POST', {
    name: nome,
    status: 'AVAILABLE',
    sequence,
    template: 'DEFAULT'
  });
}

async function criarProduto(nome, descricao, serving = 'SERVES_1') {
  return request('/products', 'POST', {
    name: nome,
    description: descricao,
    serving
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

async function sincronizarCardapioCompleto() {
  console.log('🚀 Iniciando sincronização do cardápio oficial de O Mordidaço com o iFood...');

  // 1. Categorias
  console.log('📂 Verificando / Criando categorias...');
  const catHotDogsId = '9e299ae8-f344-40a5-af46-dee338372652'; // Hot Dogs Artesanais (Já criada)
  
  const catCombos = await criarCategoria('⭐ Combos Campeões (Mais Pedidos)', 2);
  console.log('✓ Categoria Combos criada:', catCombos.id);

  const catBebidas = await criarCategoria('Bebidas Geladas', 3);
  console.log('✓ Categoria Bebidas criada:', catBebidas.id);

  // 2. Hot Dogs Artesanais (6 Modelos Oficiais ordenados por preço crescente)
  const lanches = [
    {
      nome: 'Mordidaço Clássico',
      descricao: '1 salsicha Sadia, maionese Hellmann\'s, ketchup, mostarda, milho, ervilha, vinagrete, purê de batata artesanal e batata palha crocante.',
      preco: 22.90
    },
    {
      nome: 'Mordidaço em Dobro',
      descricao: 'O campeão de vendas! 2 salsichas Sadia, o verdadeiro dobro de queijo muçarela derretido, maionese Hellmann\'s, ketchup, mostarda, milho, ervilha, vinagrete, purê artesanal, batata palha e chuva de parmesão ralado por cima.',
      preco: 28.90
    },
    {
      nome: 'Mordidaço Queijudo (VEG)',
      descricao: '🌱 Opção Vegetariana! 2 palitos de queijo empanados crocantes com queijo puxa-puxa derretido, purê artesanal da casa, vinagrete fresco, milho, ketchup, mostarda, maionese Hellmann\'s e batata palha crocante.',
      preco: 31.90
    },
    {
      nome: 'Mordidaço Bacon',
      descricao: '2 salsichas Sadia, maionese Hellmann\'s, purê de batata artesanal, milho, ervilha, bacon crocante em cubos, queijo muçarela derretido, batata palha e parmesão ralado por cima.',
      preco: 33.90
    },
    {
      nome: 'Mordidaço Cremoso',
      descricao: '1 salsicha Sadia, frango desfiado temperado, Catupiry® Original cremoso, maionese Hellmann\'s, ketchup, mostarda, milho, vinagrete, purê de batata artesanal e batata palha crocante.',
      preco: 34.90
    },
    {
      nome: 'Mordidaço Tudão',
      descricao: 'O gigante da casa! 1 salsicha Sadia, frango desfiado temperado, Catupiry® Original, purê artesanal, maionese Hellmann\'s, ketchup, mostarda, milho, ervilha, vinagrete, bacon em dobro, calabresa ralada douradinha, queijo muçarela em dobro derretido, batata palha e parmesão ralado por cima.',
      preco: 44.90
    }
  ];

  for (const l of lanches) {
    console.log(`🌭 Cadastrando ${l.nome}...`);
    const prod = await criarProduto(l.nome, l.descricao, 'SERVES_1');
    await vincularItem(catHotDogsId, prod.id, l.preco);
    console.log(`  ✓ Item vinculado: R$ ${l.preco.toFixed(2)}`);
  }

  // 3. Combos Oficiais
  const combos = [
    {
      nome: 'Combo Mordidaço Casal',
      descricao: '2 Mordidaços em Dobro (escolha individual no Pão ou no Prato para cada um) + 2 Refrigerantes Lata (escolha Coca, Guaraná ou Fanta) + 2 Potes de Molho da Casa (50ml). A janta perfeita para dois!',
      preco: 68.90,
      serving: 'SERVES_2'
    },
    {
      nome: 'Combo Família Mordidaço',
      descricao: '2 Mordidaços em Dobro + 1 Mordidaço Clássico (escolha individual no Pão ou no Prato para cada um) + 1 Guaraná Antarctica 2 Litros + 3 Potes de Molho da Casa (50ml). Fartura garantida para toda a família!',
      preco: 86.90,
      serving: 'SERVES_3'
    }
  ];

  for (const c of combos) {
    console.log(`⭐ Cadastrando combo ${c.nome}...`);
    const prod = await criarProduto(c.nome, c.descricao, c.serving);
    await vincularItem(catCombos.id, prod.id, c.preco);
    console.log(`  ✓ Combo vinculado: R$ ${c.preco.toFixed(2)}`);
  }

  // 4. Sobremesas Artesanais no Pote (170ml)
  console.log('🍰 Criando categoria Sobremesas no Pote...');
  const catSobremesas = await criarCategoria('🍰 Sobremesas no Pote (170ml)', 3);
  const sobremesas = [
    {
      nome: 'Tortinha de Limão no Pote (170ml)',
      descricao: 'Camadas perfeitas de farofa amanteigada crocante de biscoito, creme aveludado de limão fresco e raspas de limão verde. Acompanha colherzinha descartável lacrada! (~161g).',
      preco: 14.90
    },
    {
      nome: 'Escondidinho de Nutella com Brownie (170ml)',
      descricao: 'Base e topo de brigadeiro cremoso de Leite Ninho®, recheado com pedaços de brownie artesanal e Nutella® Ferrero pura. Uma explosão de sabor! Acompanha colherzinha lacrada! (~155g).',
      preco: 21.90
    }
  ];

  for (const s of sobremesas) {
    console.log(`🍰 Cadastrando sobremesa ${s.nome}...`);
    const prod = await criarProduto(s.nome, s.descricao, 'SERVES_1');
    await vincularItem(catSobremesas.id, prod.id, s.preco);
    console.log(`  ✓ Sobremesa vinculada: R$ ${s.preco.toFixed(2)}`);
  }

  // 5. Categoria Adicionais Extras
  console.log('📂 Criando categoria Adicionais Extras...');
  const catAdicionais = await criarCategoria('➕ Adicionais Extras', 4);
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
  }
  console.log('✓ 10 Adicionais Extras vinculados com preços de delivery!');

  // 5. Bebidas Geladas (Preços Calibrados para Delivery)
  const bebidas = [
    { nome: 'Refrigerante Coca-Cola (Lata 350ml)', descricao: 'Lata 350ml trincando de gelada.', preco: 7.90 },
    { nome: 'Refrigerante Coca-Cola Zero (Lata 350ml)', descricao: 'Lata 350ml sem açúcar gelada.', preco: 7.90 },
    { nome: 'Refrigerante Guaraná Antarctica (Lata 350ml)', descricao: 'Lata 350ml trincando de gelada.', preco: 7.90 },
    { nome: 'Refrigerante Guaraná Antarctica Zero (Lata 350ml)', descricao: 'Lata 350ml zero açúcar.', preco: 7.90 },
    { nome: 'Refrigerante Fanta Laranja (Lata 350ml)', descricao: 'Lata 350ml gelada.', preco: 7.90 },
    { nome: 'Suco Del Valle Uva (Lata 290ml)', descricao: 'Lata 290ml gelada.', preco: 8.50 },
    { nome: 'Refrigerante Coca-Cola Original (Garrafa 2 Litros)', descricao: 'Garrafa 2 Litros gelada.', preco: 17.90 },
    { nome: 'Refrigerante Guaraná Antarctica (Garrafa 2 Litros)', descricao: 'Garrafa 2 Litros para acompanhar o dogão em família.', preco: 15.90 },
    { nome: 'Água Mineral 500ml (sem gás)', descricao: 'Garrafa 500ml gelada.', preco: 5.00 },
    { nome: 'Água Mineral 500ml (com gás)', descricao: 'Garrafa 500ml gelada.', preco: 5.50 },
    { nome: 'Cerveja Original 350ml (Lata)', descricao: 'Lata 350ml trincando de gelada.', preco: 9.90 },
    { nome: 'Cerveja Heineken 330ml (Long Neck)', descricao: 'Long Neck 330ml gelada.', preco: 12.90 }
  ];

  for (const b of bebidas) {
    console.log(`🥤 Cadastrando bebida ${b.nome}...`);
    const prod = await criarProduto(b.nome, b.descricao, 'NOT_APPLICABLE');
    await vincularItem(catBebidas.id, prod.id, b.preco);
    console.log(`  ✓ Bebida vinculada: R$ ${b.preco.toFixed(2)}`);
  }

  console.log('\n🎉 SUCESSO TOTAL! O cardápio oficial de O Mordidaço está 100% publicado no catálogo do iFood!');
}

sincronizarCardapioCompleto().catch(err => {
  console.error('❌ Falha:', err.message);
});
