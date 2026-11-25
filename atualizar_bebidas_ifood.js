/**
 * Script para Atualizar Bebidas no iFood Produção:
 * - Pausar/Remover bebidas com 0 unidades em estoque
 * - Cadastrar/Atualizar as novas bebidas reais (Del Valle Goiaba, Limon Tropical, Guaraná 1.5L, Coca 2.5L)
 * - Atualizar grupos de opções de bebidas nos combos
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

async function atualizarBebidasIFood() {
  console.log('🚀 Iniciando atualização de Bebidas no iFood Produção...');

  // 1. Obter Categoria de Bebidas
  const categorias = await request(`/catalogs/${CATALOG_ID}/categories`);
  const catBebidas = categorias.find(c => c.name.includes('Bebidas'));
  if (!catBebidas) throw new Error('Categoria de bebidas não encontrada!');

  const catDetalhe = await request(`/catalogs/${CATALOG_ID}/categories/${catBebidas.id}`);
  const items = catDetalhe.items || [];

  // 2. Itens a serem PAUSADOS (UNAVAILABLE) por estoque zerado
  const nomesZerados = [
    'fanta laranja',
    'guaraná antarctica 350ml',
    'guaraná antarctica zero',
    'guarana antarctica 350ml',
    'guarana antarctica zero',
    'suco del valle uva',
    'guaraná antarctica 2 litros',
    'guarana antarctica 2 litros',
    'coca-cola original 2 litros',
    'coca-cola 2 litros zero'
  ];

  console.log('\n⏸️ Pausando bebidas com estoque zerado...');
  for (const item of items) {
    const nomeNorm = item.name.toLowerCase();
    const devePausar = nomesZerados.some(z => nomeNorm.includes(z));
    if (devePausar) {
      try {
        await request(`/items/status`, 'PATCH', {
          status: 'UNAVAILABLE',
          itemId: item.id
        });
        console.log(`  ✓ Pausado com sucesso: ${item.name} (${item.id})`);
      } catch (err) {
        console.warn(`  ⚠️ Erro ao pausar ${item.name}:`, err.message);
      }
    }
  }

  // 3. Cadastrar ou Atualizar as Novas Bebidas Reais
  console.log('\n🥤 Cadastrando novas bebidas em estoque...');
  const novasBebidas = [
    { nome: 'Suco Del Valle Goiaba 290ml (Lata)', descricao: 'Lata 290ml trincando de gelada.', preco: 8.50 },
    { nome: 'Refresco Del Valle Limon Tropical 290ml', descricao: 'Garrafinha 290ml gelada refrescante.', preco: 8.50 },
    { nome: 'Guaraná Antarctica 1,5 Litros', descricao: 'Garrafa de 1,5L gelada (Tradicional ou Diet).', preco: 13.90 },
    { nome: 'Coca-Cola 2,5 Litros Original', descricao: 'Garrafa gigante de 2,5 Litros bem gelada para a família.', preco: 18.90 },
    { nome: 'Coca-Cola 2,5 Litros Zero', descricao: 'Garrafa gigante de 2,5 Litros sem açúcar gelada.', preco: 18.90 }
  ];

  for (const b of novasBebidas) {
    try {
      const prod = await request('/products', 'POST', {
        name: b.nome,
        description: b.descricao,
        serving: 'NOT_APPLICABLE'
      });
      await request('/items', 'PUT', {
        item: {
          productId: prod.id,
          categoryId: catBebidas.id,
          status: 'AVAILABLE',
          price: { value: b.preco }
        }
      });
      console.log(`  ✓ Nova bebida cadastrada: ${b.nome} (R$ ${b.preco.toFixed(2)})`);
    } catch (err) {
      console.warn(`  ⚠️ Erro ao cadastrar ${b.nome}:`, err.message);
    }
  }

  // 4. Atualizar opções de bebidas nos combos (Option Groups)
  console.log('\n🍔 Verificando grupos de opções dos Combos no iFood...');
  try {
    const optGroups = await request('/option-groups');
    if (Array.isArray(optGroups)) {
      for (const og of optGroups) {
        if (og.name && (og.name.toLowerCase().includes('bebida') || og.name.toLowerCase().includes('refrigerante'))) {
          console.log(`  🔍 Grupo de opções encontrado: "${og.name}" (${og.id})`);
          // Se tiver opções com Guaraná Lata ou Fanta Lata, pausa cada uma
          if (Array.isArray(og.options)) {
            for (const opt of og.options) {
              const optNome = (opt.name || '').toLowerCase();
              if (optNome.includes('fanta') || optNome.includes('guaraná') || optNome.includes('guarana') || optNome.includes('uva')) {
                try {
                  await request(`/options/${opt.id}/status`, 'PATCH', { status: 'UNAVAILABLE' });
                  console.log(`    ✓ Opção de combo pausada: ${opt.name}`);
                } catch (e) {
                  console.warn(`    ⚠️ Não foi possível alterar status da opção ${opt.name}:`, e.message);
                }
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('  ⚠️ Aviso ao verificar option-groups:', e.message);
  }

  console.log('\n🎉 Sincronização de Bebidas no iFood concluída com sucesso!');
}

atualizarBebidasIFood().catch(err => {
  console.error('\n❌ Erro fatal:', err.message);
});
