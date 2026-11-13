/**
 * Script de Ingestão e Upload do Cardápio Oficial para a 99Food (DiDi OpenAPI v3)
 * Loja: O Mordidaço - Hot-Dogueria Artesanal
 */

const FOOD99_APP_ID = process.env.FOOD99_APP_ID || '5764607596705613899';
const FOOD99_APP_SECRET = process.env.FOOD99_APP_SECRET || '86252f9902d2155cf74d82a542e3c415';
const FOOD99_APP_SHOP_ID = process.env.FOOD99_APP_SHOP_ID || 'mordidaco_test_1';
const BASE_URL_99 = 'https://openapi.99food.com';

async function obterToken() {
  const url = `${BASE_URL_99}/v1/auth/authtoken/get?app_id=${FOOD99_APP_ID}&app_secret=${FOOD99_APP_SECRET}&app_shop_id=${FOOD99_APP_SHOP_ID}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.errno === 0 && data.data && data.data.auth_token) {
    return data.data.auth_token;
  }
  throw new Error('Falha ao obter auth_token: ' + JSON.stringify(data));
}

async function sincronizarCardapio99Food() {
  console.log('🚀 Iniciando sincronização do cardápio oficial de O Mordidaço com a 99Food...');
  const token = await obterToken();
  console.log('✓ Token de acesso autenticado!');

  // Menus
  const menus = [
    {
      app_menu_id: 'menu_mordidaco',
      menu_name: 'Cardápio Oficial O Mordidaço',
      app_category_id_list: ['cat_hotdogs', 'cat_combos', 'cat_bebidas']
    }
  ];

  // Categorias
  const categories = [
    {
      app_category_id: 'cat_hotdogs',
      category_name: '🌭 Hot Dogs Artesanais',
      app_item_id_list: [
        'dog_classico',
        'dog_em_dobro',
        'dog_bacon',
        'dog_cremoso',
        'dog_tudao'
      ]
    },
    {
      app_category_id: 'cat_combos',
      category_name: '⭐ Combos Campeões',
      app_item_id_list: [
        'combo_casal',
        'combo_familia'
      ]
    },
    {
      app_category_id: 'cat_bebidas',
      category_name: '🥤 Bebidas Geladas',
      app_item_id_list: [
        'refri_coca_lata',
        'refri_guarana_lata',
        'suco_delvalle_uva',
        'agua_sem_gas'
      ]
    }
  ];

  // Itens (Preços em centavos de Real: R$ 22,90 = 2290)
  const items = [
    // Opções de modificador (não vendidas separadamente)
    {
      app_item_id: 'mod_pao',
      item_name: 'Tradicional no Pão macio Bambini 70g',
      short_desc: 'Aberto e prensadinho na medida',
      price: 0,
      is_sold_separately: false
    },
    {
      app_item_id: 'mod_prato',
      item_name: 'No Prato (Sem Pão - Marmitinha Térmica 500ml)',
      short_desc: 'Sem pão! +40g de purê artesanal e garfo reforçado',
      price: 200, // + R$ 2,00
      is_sold_separately: false
    },

    // 5 Hot Dogs Oficiais
    {
      app_item_id: 'dog_classico',
      item_name: 'Mordidaço Clássico',
      short_desc: '1 salsicha Sadia, molho especial da casa, ketchup, mostarda, milho, ervilha, vinagrete, purê de batata artesanal e batata palha crocante.',
      price: 2290, // R$ 22,90
      is_sold_separately: true,
      app_modifier_group_ids: ['mg_formato']
    },
    {
      app_item_id: 'dog_em_dobro',
      item_name: 'Mordidaço em Dobro',
      short_desc: 'O campeão de vendas! 2 salsichas Sadia, o verdadeiro dobro de queijo muçarela derretido, molho especial, ketchup, mostarda, milho, ervilha, vinagrete, purê artesanal, batata palha e parmesão ralado.',
      price: 2890, // R$ 28,90
      is_sold_separately: true,
      app_modifier_group_ids: ['mg_formato']
    },
    {
      app_item_id: 'dog_bacon',
      item_name: 'Mordidaço Bacon',
      short_desc: '2 salsichas Sadia, molho especial da casa, purê de batata artesanal, milho, ervilha, bacon crocante em cubos, queijo muçarela derretido, batata palha e parmesão ralado.',
      price: 3390, // R$ 33,90
      is_sold_separately: true,
      app_modifier_group_ids: ['mg_formato']
    },
    {
      app_item_id: 'dog_cremoso',
      item_name: 'Mordidaço Cremoso',
      short_desc: '1 salsicha Sadia, ketchup, mostarda, milho, vinagrete, frango desfiado temperado, Catupiry® Original cremoso, molho da casa, purê de batata artesanal e batata palha.',
      price: 3490, // R$ 34,90
      is_sold_separately: true,
      app_modifier_group_ids: ['mg_formato']
    },
    {
      app_item_id: 'dog_tudao',
      item_name: 'Mordidaço Tudão',
      short_desc: 'O gigante da casa! 1 salsicha Sadia, frango temperado, Catupiry® Original, purê artesanal, molho da casa, ketchup, mostarda, milho, ervilha, vinagrete, bacon em dobro, calabresa ralada douradinha, muçarela dobro e parmesão.',
      price: 4490, // R$ 44,90
      is_sold_separately: true,
      app_modifier_group_ids: ['mg_formato']
    },

    // Combos Oficiais
    {
      app_item_id: 'combo_casal',
      item_name: 'Combo Mordidaço Casal',
      short_desc: '2 Mordidaços em Dobro + 2 Refrigerantes Lata 350ml + 2 Potes de Molho Especial da Casa (50ml). A pedida perfeita para duas pessoas!',
      price: 6890, // R$ 68,90
      is_sold_separately: true
    },
    {
      app_item_id: 'combo_familia',
      item_name: 'Combo Família Mordidaço',
      short_desc: '2 Mordidaços em Dobro + 1 Mordidaço Clássico + 1 Guaraná Antarctica 2 Litros + 3 Potes de Molho da Casa (50ml). Fartura garantida!',
      price: 8690, // R$ 86,90
      is_sold_separately: true
    },

    // Bebidas
    {
      app_item_id: 'refri_coca_lata',
      item_name: 'Coca-Cola Original 350ml (Lata)',
      short_desc: 'Lata 350ml bem gelada',
      price: 790,
      is_sold_separately: true
    },
    {
      app_item_id: 'refri_guarana_lata',
      item_name: 'Guaraná Antarctica 350ml (Lata)',
      short_desc: 'Lata 350ml bem gelada',
      price: 790,
      is_sold_separately: true
    },
    {
      app_item_id: 'suco_delvalle_uva',
      item_name: 'Suco Del Valle Uva 290ml (Lata)',
      short_desc: 'Lata 290ml gelada',
      price: 790,
      is_sold_separately: true
    },
    {
      app_item_id: 'agua_sem_gas',
      item_name: 'Água Mineral 500ml (Sem Gás)',
      short_desc: 'Garrafa 500ml gelada',
      price: 500,
      is_sold_separately: true
    }
  ];

  // Grupos de Modificadores (Formato do Hot Dog)
  const modifier_groups = [
    {
      app_modifier_group_id: 'mg_formato',
      modifier_group_name: 'Escolha o Formato do Dog',
      is_required: 1,
      quantity_min_permitted: 1,
      quantity_max_permitted: 1,
      buy_mode: 0,
      app_mg_items: [
        { app_item_id: 'mod_pao', price: 0 },
        { app_item_id: 'mod_prato', price: 200 }
      ]
    }
  ];

  const payload = {
    auth_token: token,
    menus,
    categories,
    items,
    modifier_groups
  };

  console.log('📦 Enviando catálogo completo via POST /v3/item/item/upload...');
  const res = await fetch(`${BASE_URL_99}/v3/item/item/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  console.log('HTTP Status Upload:', res.status);
  const data = await res.json();
  console.log('Resposta do Upload 99Food:', JSON.stringify(data, null, 2));

  if (data.errno === 0) {
    console.log('🎉 SUCESSO! Cardápio de O Mordidaço enviado com sucesso para a 99Food!');
  } else {
    console.log('⚠️ Aviso ou detalhe retornado:', data.errmsg);
  }
}

if (require.main === module) {
  sincronizarCardapio99Food().catch(err => console.error('Erro na sincronização:', err.message));
}

module.exports = { sincronizarCardapio99Food };
