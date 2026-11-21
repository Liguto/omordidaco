/**
 * Script para Remover Itens Duplicados e Limpar o Catálogo de Produção do iFood
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

async function limparDuplicados() {
  console.log('🧹 Iniciando limpeza de itens duplicados em todas as categorias do iFood...');

  const categorias = await request(`/catalogs/${CATALOG_ID}/categories`);
  console.log(`✓ Encontradas ${categorias.length} categorias.`);

  for (const cat of categorias) {
    const catDetalhe = await request(`/catalogs/${CATALOG_ID}/categories/${cat.id}`);
    const items = catDetalhe.items || [];
    console.log(`\n📂 Verificando categoria "${cat.name}" (${items.length} itens)...`);

    const mapaVistos = new Map();
    const duplicadosParaRemover = [];

    for (const item of items) {
      const chave = item.name.toLowerCase().trim();
      const optionsCount = (item.optionGroups || []).length;

      if (!mapaVistos.has(chave)) {
        mapaVistos.set(chave, item);
      } else {
        const existente = mapaVistos.get(chave);
        const existenteOptionsCount = (existente.optionGroups || []).length;

        // Se o item atual tem mais complementos/opções que o existente, mantém o atual e remove o antigo
        if (optionsCount > existenteOptionsCount) {
          duplicadosParaRemover.push(existente);
          mapaVistos.set(chave, item);
        } else {
          duplicadosParaRemover.push(item);
        }
      }
    }

    if (duplicadosParaRemover.length === 0) {
      console.log(`  ✓ Nenhum item duplicado encontrado em "${cat.name}".`);
      continue;
    }

    console.log(`  ⚠️ Encontrados ${duplicadosParaRemover.length} itens duplicados para remover em "${cat.name}":`);
    for (const dup of duplicadosParaRemover) {
      try {
        await request(`/categories/${cat.id}/products/${dup.productId}`, 'DELETE');
        console.log(`    🗑️ Desvinculado: "${dup.name}" (productId: ${dup.productId})`);
      } catch (e) {
        console.error(`    ❌ Falha ao desvincular "${dup.name}": ${e.message}`);
      }
    }
  }

  console.log('\n🎉 LIMPEZA CONCLUÍDA! Todos os itens duplicados foram removidos do iFood.');
}

limparDuplicados().catch(err => {
  console.error('Erro na limpeza:', err);
});
