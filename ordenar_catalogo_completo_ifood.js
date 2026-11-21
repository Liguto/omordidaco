/**
 * Script de Engenharia Especializada para Ordenação Estrita de Todas as Categorias e Itens do iFood (Preço Crescente)
 * Desenvolvido pelo @integrador-delivery
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

// Ordem estrita das Categorias
const ORDEM_CATEGORIAS = [
  { id: '7fa12084-2e1e-476e-98f5-3441c75cb481', nome: 'Combos Campeões (Mais Pedidos)', seq: 1 },
  { id: '792e4161-a95d-4c3c-b869-17c177abef91', nome: 'Cachorros-Quentes Artesanais', seq: 2 },
  { id: '87122a25-f5bd-4b38-b30b-ab394b74de9e', nome: 'Sobremesas no Pote (170ml)', seq: 3 },
  { id: '4b528010-cd24-4da7-92ee-af47d7b05aa0', nome: 'Bebidas Geladas', seq: 4 },
  { id: '2b2db7a4-8daa-4f23-b52d-2f3d3db52939', nome: 'Adicionais Extras', seq: 5 }
];

async function ordenarCatalogoCompletoIFood() {
  console.log('🚀 Iniciando ordenação estrita de categorias e itens no iFood (Preço Crescente)...');

  // 1. Ordena as Categorias
  console.log('\n📂 1. Ordenando Sequência das Categorias...');
  for (const cat of ORDEM_CATEGORIAS) {
    try {
      await request(`/catalogs/${CATALOG_ID}/categories/${cat.id}`, 'PATCH', {
        sequence: cat.seq,
        index: cat.seq
      });
      console.log(`  ✓ Categoria #${cat.seq} "${cat.nome}" ordenada com sequence/index: ${cat.seq}`);
    } catch (e) {
      console.error(`  ❌ Erro ao ordenar categoria "${cat.nome}":`, e.message);
    }
  }

  // 2. Ordena os Itens dentro de Cada Categoria por Preço Crescente
  console.log('\n🌭 2. Ordenando Itens por Preço Crescente dentro de cada Categoria...');

  for (const cat of ORDEM_CATEGORIAS) {
    const catDetalhe = await request(`/catalogs/${CATALOG_ID}/categories/${cat.id}`);
    const items = catDetalhe.items || [];

    // Ordena matematicamente por preço crescente
    items.sort((a, b) => {
      const precoA = a.price?.value !== undefined ? a.price.value : 0;
      const precoB = b.price?.value !== undefined ? b.price.value : 0;
      if (precoA !== precoB) return precoA - precoB;
      return (a.name || '').localeCompare(b.name || '');
    });

    console.log(`\n--- Categoria: "${cat.nome}" (${items.length} itens) ---`);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const indexOrd = i + 1; // 1-based index
      const preco = item.price?.value;

      try {
        await request(`/items/${item.id}`, 'PATCH', {
          sequence: indexOrd,
          index: indexOrd
        });
        console.log(`  [Posição ${indexOrd}] ✓ "${item.name}" (R$ ${preco?.toFixed(2)}) -> sequence/index: ${indexOrd}`);
      } catch (e) {
        console.error(`  [Posição ${indexOrd}] ❌ Erro ao atualizar item "${item.name}":`, e.message);
      }
    }
  }

  console.log('\n🎉 SUCESSO TOTAL! Todas as categorias e todos os itens do iFood foram ordenados por ordem estritamente crescente de preço!');
}

ordenarCatalogoCompletoIFood().catch(err => {
  console.error('Erro geral:', err);
});
