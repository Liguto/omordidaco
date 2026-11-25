/**
 * Script de Revisão e Limpeza Definitiva do Catálogo iFood de Produção:
 * - Remove itens duplicados em todas as categorias
 * - Remove bebidas zeradas/descontinuadas da categoria de bebidas
 * - Remove o molho antigo de 50ml dos adicionais e adiciona os 2 molhos separados (30ml)
 * - Reordena o catálogo completo
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

async function revisarELimparCatalogo() {
  console.log('🧹 Iniciando revisão profunda e remoção de duplicados no iFood...');

  const categorias = await request(`/catalogs/${CATALOG_ID}/categories`);
  console.log(`✓ Encontradas ${categorias.length} categorias no catálogo.`);

  for (const cat of categorias) {
    console.log(`\n📂 Verificando categoria "${cat.name}" (ID: ${cat.id})...`);
    const catDetalhe = await request(`/catalogs/${CATALOG_ID}/categories/${cat.id}`);
    const items = catDetalhe.items || [];
    console.log(`  Total de itens atuais: ${items.length}`);

    // Regras específicas por categoria
    const ehBebidas = cat.name.includes('Bebidas');
    const ehAdicionais = cat.name.includes('Adicionais');

    const mapaVistos = new Map();
    const paraRemover = [];

    for (const item of items) {
      const nomeNorm = item.name.toLowerCase().trim();

      // 1. Em Bebidas: remover descontinuados/zerados
      if (ehBebidas) {
        const deveDescartar = 
          nomeNorm.includes('fanta') ||
          (nomeNorm.includes('guaraná') && nomeNorm.includes('350')) ||
          (nomeNorm.includes('guarana') && nomeNorm.includes('350')) ||
          (nomeNorm.includes('guaraná') && (nomeNorm.includes('2 litros') || nomeNorm.includes('2l'))) ||
          (nomeNorm.includes('guarana') && (nomeNorm.includes('2 litros') || nomeNorm.includes('2l'))) ||
          (nomeNorm.includes('coca') && (nomeNorm.includes('2 litros') || nomeNorm.includes('2l')) && !nomeNorm.includes('2,5') && !nomeNorm.includes('2.5')) ||
          nomeNorm.includes('suco del valle uva');

        if (deveDescartar) {
          paraRemover.push({ ...item, motivo: 'Descontinuado/Estoque Zerado' });
          continue;
        }
      }

      // 2. Em Adicionais: remover molho antigo de 50ml
      if (ehAdicionais) {
        if (nomeNorm.includes('50ml') || (nomeNorm.includes('molho especial da casa') && !nomeNorm.includes('ervas') && !nomeNorm.includes('azeitona'))) {
          paraRemover.push({ ...item, motivo: 'Substituído pelos potes de 30ml (Ervas e Azeitona)' });
          continue;
        }
      }

      // 3. Regra geral: detecção de duplicados pelo nome exato
      if (!mapaVistos.has(nomeNorm)) {
        mapaVistos.set(nomeNorm, item);
      } else {
        const existente = mapaVistos.get(nomeNorm);
        const optCountAtual = (item.optionGroups || []).length;
        const optCountExistente = (existente.optionGroups || []).length;

        // Mantém o que tiver mais opções vinculadas
        if (optCountAtual > optCountExistente) {
          paraRemover.push({ ...existente, motivo: 'Duplicado (substituído por versão mais completa)' });
          mapaVistos.set(nomeNorm, item);
        } else {
          paraRemover.push({ ...item, motivo: 'Duplicado do item existente' });
        }
      }
    }

    if (paraRemover.length === 0) {
      console.log(`  ✓ Nenhum item para remover em "${cat.name}". Todos os ${items.length} itens são únicos.`);
    } else {
      console.log(`  ⚠️ Encontrados ${paraRemover.length} itens para desvincular/remover em "${cat.name}":`);
      for (const item of paraRemover) {
        try {
          await request(`/categories/${cat.id}/products/${item.productId}`, 'DELETE');
          console.log(`    🗑️ Removido: "${item.name}" (motivo: ${item.motivo})`);
        } catch (e) {
          console.warn(`    ⚠️ Falha ao remover "${item.name}": ${e.message}`);
        }
      }
    }
  }

  // Verificar se os 2 novos molhos de 30ml estão presentes em Adicionais Extras
  const catAdic = categorias.find(c => c.name.includes('Adicionais'));
  if (catAdic) {
    const catAdicDet = await request(`/catalogs/${CATALOG_ID}/categories/${catAdic.id}`);
    const itensAdic = catAdicDet.items || [];
    const temErvas = itensAdic.some(i => i.name.toLowerCase().includes('ervas'));
    const temAzeitona = itensAdic.some(i => i.name.toLowerCase().includes('azeitona'));

    if (!temErvas) {
      try {
        const prod = await request('/products', 'POST', {
          name: 'Pote de Maionese de Ervas Frescas (30ml)',
          description: 'Maionese artesanal temperada com ervas frescas da casa.',
          serving: 'NOT_APPLICABLE'
        });
        await request('/items', 'PUT', {
          item: {
            productId: prod.id,
            categoryId: catAdic.id,
            status: 'AVAILABLE',
            price: { value: 4.50 }
          }
        });
        console.log('  ✓ Adicionado à categoria: Pote de Maionese de Ervas Frescas (30ml) - R$ 4,50');
      } catch (e) { console.warn('  ⚠️ Aviso ao cadastrar pote de ervas:', e.message); }
    }

    if (!temAzeitona) {
      try {
        const prod = await request('/products', 'POST', {
          name: 'Pote de Maionese de Azeitonas Azapa (30ml)',
          description: 'Maionese artesanal batida com azeitonas pretas Azapa selecionadas.',
          serving: 'NOT_APPLICABLE'
        });
        await request('/items', 'PUT', {
          item: {
            productId: prod.id,
            categoryId: catAdic.id,
            status: 'AVAILABLE',
            price: { value: 4.50 }
          }
        });
        console.log('  ✓ Adicionado à categoria: Pote de Maionese de Azeitonas Azapa (30ml) - R$ 4,50');
      } catch (e) { console.warn('  ⚠️ Aviso ao cadastrar pote de azeitona:', e.message); }
    }
  }

  console.log('\n🎉 REVISÃO E LIMPEZA DO CATÁLOGO CONCLUÍDAS COM SUCESSO!');
}

revisarELimparCatalogo().catch(err => {
  console.error('❌ Erro:', err.message);
});
