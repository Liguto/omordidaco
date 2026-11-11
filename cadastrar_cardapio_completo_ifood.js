/**
 * Script de Ingestão do Cardápio Oficial de O Mordidaço na API Catalog v2.0 do iFood
 */

const { obterTokenAcesso } = require('./integracao_ifood');

const MERCHANT_ID = '1c6a85ea-2063-4bb9-a2ab-a198c2d9946b';
const CATALOG_ID = '3dab72cd-7f8d-4bc6-9131-f5d0ad9779e9';

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

  // 2. Hot Dogs Artesanais (Novos 5 Modelos Oficiais)
  const lanches = [
    {
      nome: 'Mordidaço Clássico',
      descricao: '1 salsicha Sadia, molho especial da casa, ketchup, mostarda, milho, vinagrete, purê de batata artesanal, ervilha e batata palha crocante.',
      preco: 22.90
    },
    {
      nome: 'Mordidaço Duplo',
      descricao: 'O campeão de vendas! 2 salsichas Sadia, molho especial da casa, queijo muçarela derretido, ketchup, mostarda, milho, vinagrete, purê artesanal, ervilha, batata palha e chuva de parmesão ralado por cima.',
      preco: 28.90
    },
    {
      nome: 'Mordidaço Bacon',
      descricao: '2 salsichas Sadia, molho especial da casa, purê de batata artesanal, milho, ervilha, bacon crocante em cubos, queijo muçarela, batata palha e parmesão ralado por cima.',
      preco: 33.90
    },
    {
      nome: 'Mordidaço Frango com Catupiry',
      descricao: '1 salsicha Sadia, peito de frango desfiado temperado, o Legítimo Catupiry® Original cremoso (sem amido), molho especial da casa, purê de batata artesanal, ketchup, mostarda, milho, vinagrete e batata palha.',
      preco: 34.90
    },
    {
      nome: 'Mordidaço Tudão',
      descricao: 'O gigante da casa! 1 salsicha Sadia, frango desfiado temperado, Catupiry® Original, purê artesanal, molho especial da casa, ketchup, mostarda, milho, vinagrete, ervilha, bacon em dobro, calabresa fatiada dourada, queijo muçarela em dobro derretido, batata palha e parmesão ralado por cima.',
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
      nome: 'Combo Dupla Mordida',
      descricao: '2 Mordidaços Duplos (escolha individual no Pão ou no Prato para cada um) + 2 Refrigerantes Lata (escolha Coca, Guaraná ou Fanta) + 2 Potes de Molho da Casa (50ml). A janta perfeita para dois!',
      preco: 68.90,
      serving: 'SERVES_2'
    },
    {
      nome: 'Combo Família Mordidaço',
      descricao: '2 Mordidaços Duplos + 1 Mordidaço Clássico (escolha individual no Pão ou no Prato para cada um) + 1 Guaraná Antarctica 2 Litros + 3 Potes de Molho da Casa (50ml). Fartura garantida para toda a família!',
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

  // 4. Bebidas
  const bebidas = [
    {
      nome: 'Refrigerante Coca-Cola (Lata 350ml)',
      descricao: 'Lata 350ml trincando de gelada.',
      preco: 6.00
    },
    {
      nome: 'Refrigerante Guaraná Antarctica (Lata 350ml)',
      descricao: 'Lata 350ml trincando de gelada.',
      preco: 6.00
    },
    {
      nome: 'Refrigerante Guaraná Antarctica (Garrafa 2 Litros)',
      descricao: 'Garrafa 2 Litros para acompanhar o dogão em família.',
      preco: 12.00
    },
    {
      nome: 'Refrigerante Coca-Cola Original (Garrafa 2 Litros)',
      descricao: 'Garrafa 2 Litros gelada.',
      preco: 14.00
    }
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
