/**
 * Script de Ingestão e Upload do Cardápio Oficial para a 99Food (DiDi OpenAPI v3)
 * Loja: O Mordidaço - Hot-Dogueria Artesanal (Produção - Campinas - SP)
 * Esqueleto idêntico ao site próprio com preços calibrados para delivery de marketplace
 */

const FOOD99_APP_ID = process.env.FOOD99_APP_ID || '5764607545191172268';
const FOOD99_APP_SECRET = process.env.FOOD99_APP_SECRET || 'd706e3190a17c3488ee5074a6af5e628';
const FOOD99_APP_SHOP_ID = process.env.FOOD99_APP_SHOP_ID || 'mordidaco_tamoio_1';
const BASE_URL_99 = 'https://openapi.99food.com';

async function obterToken() {
  const url = `${BASE_URL_99}/v1/auth/authtoken/get?app_id=${FOOD99_APP_ID}&app_secret=${FOOD99_APP_SECRET}&app_shop_id=${FOOD99_APP_SHOP_ID}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.errno === 0 && data.data && data.data.auth_token) {
    return data.data.auth_token;
  }
  
  // Tenta refresh se expirado
  const urlRefresh = `${BASE_URL_99}/v1/auth/authtoken/refresh?app_id=${FOOD99_APP_ID}&app_secret=${FOOD99_APP_SECRET}&app_shop_id=${FOOD99_APP_SHOP_ID}`;
  await fetch(urlRefresh);
  const res2 = await fetch(url);
  const data2 = await res2.json();
  if (data2.errno === 0 && data2.data && data2.data.auth_token) {
    return data2.data.auth_token;
  }
  throw new Error('Falha ao obter auth_token: ' + JSON.stringify(data2));
}

async function sincronizarCardapio99Food() {
  console.log('🚀 Iniciando sincronização do cardápio oficial de O Mordidaço com a 99Food (Produção)...');
  const token = await obterToken();
  console.log('✓ Token de acesso autenticado!');

  // Menus (Vincula ao menu oficial ativo da loja)
  const menus = [
    {
      app_menu_id: '5764617594607502251',
      menu_name: 'O Mordidaço - Dogs',
      app_category_id_list: ['cat_combos', 'cat_hotdogs', 'cat_adicionais', 'cat_bebidas']
    }
  ];

  // Categorias (Idêntico ao site próprio)
  const categories = [
    {
      app_category_id: 'cat_combos',
      category_name: '⭐ Combos Campeões (Mais Pedidos)',
      app_item_id_list: [
        'combo_casal',
        'combo_familia'
      ]
    },
    {
      app_category_id: 'cat_hotdogs',
      category_name: '🌭 Hot Dogs Artesanais (No Pão ou No Prato)',
      app_item_id_list: [
        'dog_classico',
        'dog_em_dobro',
        'dog_bacon',
        'dog_cremoso',
        'dog_tudao'
      ]
    },
    {
      app_category_id: 'cat_adicionais',
      category_name: '➕ Adicionais Extras',
      app_item_id_list: [
        'add_salsicha',
        'add_catupiry',
        'add_bacon',
        'add_calabresa',
        'add_parmesao',
        'add_pure',
        'add_milho',
        'add_ervilha',
        'add_maionese',
        'add_batata_palha'
      ]
    },
    {
      app_category_id: 'cat_bebidas',
      category_name: '🥤 Bebidas Geladas',
      app_item_id_list: [
        'refri_coca_lata',
        'refri_coca_zero_lata',
        'refri_guarana_lata',
        'refri_guarana_zero_lata',
        'refri_fanta_lata',
        'suco_delvalle_uva',
        'suco_delvalle_maracuja',
        'suco_delvalle_laranja',
        'refri_coca_2l',
        'refri_coca_zero_2l',
        'refri_guarana_2l',
        'agua_mineral_sem_gas',
        'agua_mineral_com_gas',
        'cerveja_original_lata',
        'cerveja_heineken_ln'
      ]
    }
  ];

  // Itens (Preços em centavos com markup calibrado de marketplace)
  const items = [
    // Opções de modificador do Formato (Não vendidas separadamente)
    {
      app_item_id: 'mod_pao',
      item_name: '🥖 Tradicional de Rua (No Pão Bambini 70g)',
      short_desc: 'Aberto e prensadinho na medida com parmesão maçaricado',
      price: 0,
      is_sold_separately: false
    },
    {
      app_item_id: 'mod_prato',
      item_name: '🥣 No Prato (+ R$ 2,00) - Marmitinha Térmica 500ml',
      short_desc: 'Sem pão! +40g de purê artesanal e garfo reforçado',
      price: 200, // + R$ 2,00
      is_sold_separately: false
    },

    // Opções de modificador de Bebidas do Combo Casal
    {
      app_item_id: 'mod_coca',
      item_name: '1x Coca-Cola Original 350ml (Lata)',
      short_desc: 'Gelada',
      price: 0,
      is_sold_separately: false
    },
    {
      app_item_id: 'mod_coca_zero',
      item_name: '1x Coca-Cola Zero 350ml (Lata)',
      short_desc: 'Gelada',
      price: 0,
      is_sold_separately: false
    },
    {
      app_item_id: 'mod_guarana',
      item_name: '1x Guaraná Antarctica 350ml (Lata)',
      short_desc: 'Gelada',
      price: 0,
      is_sold_separately: false
    },
    {
      app_item_id: 'mod_fanta',
      item_name: '1x Fanta Laranja 350ml (Lata)',
      short_desc: 'Gelada',
      price: 0,
      is_sold_separately: false
    },

    // 1. COMBOS OFICIAIS
    {
      app_item_id: 'combo_casal',
      item_name: 'Combo Mordidaço Casal',
      short_desc: '2 Mordidaços em Dobro (escolha individual no Pão ou no Prato para cada um) + 2 Refrigerantes Lata (escolha Coca, Guaraná ou Fanta) + 2 Potes de Molho da Casa (50ml). A janta perfeita para dois!',
      price: 6890, // R$ 68,90
      is_sold_separately: true,
      app_modifier_group_ids: ['mg_formato_dog1', 'mg_formato_dog2', 'mg_refri_1', 'mg_refri_2']
    },
    {
      app_item_id: 'combo_familia',
      item_name: 'Combo Família Mordidaço',
      short_desc: '2 Mordidaços em Dobro + 1 Mordidaço Clássico (escolha individual no Pão ou no Prato para cada um) + 1 Guaraná Antarctica 2 Litros + 3 Potes de Molho da Casa (50ml). Fartura garantida para toda a família!',
      price: 8690, // R$ 86,90
      is_sold_separately: true,
      app_modifier_group_ids: ['mg_formato_dog1', 'mg_formato_dog2', 'mg_formato_dog3']
    },

    // 2. 5 HOT DOGS ARTESANAIS OFICIAIS
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
      short_desc: 'O campeão de vendas! 2 salsichas Sadia, o verdadeiro dobro de queijo muçarela derretido, molho especial da casa, ketchup, mostarda, milho, ervilha, vinagrete, purê artesanal, batata palha e chuva de parmesão ralado por cima.',
      price: 2890, // R$ 28,90
      is_sold_separately: true,
      app_modifier_group_ids: ['mg_formato']
    },
    {
      app_item_id: 'dog_bacon',
      item_name: 'Mordidaço Bacon',
      short_desc: '2 salsichas Sadia, molho especial da casa, purê de batata artesanal, milho, ervilha, bacon crocante em cubos, queijo muçarela derretido, batata palha e parmesão ralado por cima.',
      price: 3390, // R$ 33,90
      is_sold_separately: true,
      app_modifier_group_ids: ['mg_formato']
    },
    {
      app_item_id: 'dog_cremoso',
      item_name: 'Mordidaço Cremoso',
      short_desc: '1 salsicha Sadia, ketchup, mostarda, milho, vinagrete, frango desfiado temperado, Catupiry® Original cremoso, molho especial da casa, purê de batata artesanal e batata palha crocante.',
      price: 3490, // R$ 34,90
      is_sold_separately: true,
      app_modifier_group_ids: ['mg_formato']
    },
    {
      app_item_id: 'dog_tudao',
      item_name: 'Mordidaço Tudão',
      short_desc: 'O gigante da casa! 1 salsicha Sadia, frango desfiado temperado, Catupiry® Original, purê artesanal, molho especial da casa, ketchup, mostarda, milho, ervilha, vinagrete, bacon em dobro, calabresa ralada douradinha, queijo muçarela em dobro derretido, batata palha e parmesão ralado por cima.',
      price: 4490, // R$ 44,90
      is_sold_separately: true,
      app_modifier_group_ids: ['mg_formato']
    },

    // 3. ADICIONAIS EXTRAS
    {
      app_item_id: 'add_salsicha',
      item_name: '1 Salsicha Sadia Extra',
      short_desc: 'Salsicha Sadia cozida no molho especial',
      price: 490, // R$ 4,90
      is_sold_separately: true
    },
    {
      app_item_id: 'add_catupiry',
      item_name: 'Catupiry Original Extra (40g)',
      short_desc: 'Legítimo Catupiry® cremoso',
      price: 690, // R$ 6,90
      is_sold_separately: true
    },
    {
      app_item_id: 'add_bacon',
      item_name: 'Bacon Crocante Extra em Cubos (40g)',
      short_desc: 'Bacon em cubos douradinho e sequinho',
      price: 690, // R$ 6,90
      is_sold_separately: true
    },
    {
      app_item_id: 'add_calabresa',
      item_name: 'Calabresa Ralada Douradinha (40g)',
      short_desc: 'Calabresa fininha refogada',
      price: 590, // R$ 5,90
      is_sold_separately: true
    },
    {
      app_item_id: 'add_parmesao',
      item_name: 'Parmesão Ralado Fresco (20g)',
      short_desc: 'Ralado na hora',
      price: 450, // R$ 4,50
      is_sold_separately: true
    },
    {
      app_item_id: 'add_pure',
      item_name: 'Purê de Batata Artesanal Extra (80g)',
      short_desc: 'Purê de batata artesanal da casa bem quentinho',
      price: 490, // R$ 4,90
      is_sold_separately: true
    },
    {
      app_item_id: 'add_milho',
      item_name: 'Milho Verde Extra',
      short_desc: 'Milho verde selecionado',
      price: 350, // R$ 3,50
      is_sold_separately: true
    },
    {
      app_item_id: 'add_ervilha',
      item_name: 'Ervilha Extra',
      short_desc: 'Ervilha fresca tenra',
      price: 350, // R$ 3,50
      is_sold_separately: true
    },
    {
      app_item_id: 'add_maionese',
      item_name: 'Pote de Molho Especial da Casa (50ml)',
      short_desc: 'Molho verde especial da casa em potinho',
      price: 450, // R$ 4,50
      is_sold_separately: true
    },
    {
      app_item_id: 'add_batata_palha',
      item_name: 'Batata Palha Crocante Extra',
      short_desc: 'Porção de batata palha fininha crocante',
      price: 350, // R$ 3,50
      is_sold_separately: true
    },

    // 4. BEBIDAS GELADAS
    {
      app_item_id: 'refri_coca_lata',
      item_name: 'Coca-Cola Original 350ml (Lata)',
      short_desc: 'Lata 350ml bem gelada',
      price: 790, // R$ 7,90
      is_sold_separately: true
    },
    {
      app_item_id: 'refri_coca_zero_lata',
      item_name: 'Coca-Cola Zero 350ml (Lata)',
      short_desc: 'Lata 350ml bem gelada',
      price: 790, // R$ 7,90
      is_sold_separately: true
    },
    {
      app_item_id: 'refri_guarana_lata',
      item_name: 'Guaraná Antarctica 350ml (Lata)',
      short_desc: 'Lata 350ml bem gelada',
      price: 790, // R$ 7,90
      is_sold_separately: true
    },
    {
      app_item_id: 'refri_guarana_zero_lata',
      item_name: 'Guaraná Antarctica Zero 350ml (Lata)',
      short_desc: 'Lata 350ml bem gelada',
      price: 790, // R$ 7,90
      is_sold_separately: true
    },
    {
      app_item_id: 'refri_fanta_lata',
      item_name: 'Fanta Laranja 350ml (Lata)',
      short_desc: 'Lata 350ml bem gelada',
      price: 790, // R$ 7,90
      is_sold_separately: true
    },
    {
      app_item_id: 'suco_delvalle_uva',
      item_name: 'Suco Del Valle Uva 290ml (Lata)',
      short_desc: 'Lata 290ml gelada',
      price: 850, // R$ 8,50
      is_sold_separately: true
    },
    {
      app_item_id: 'suco_delvalle_maracuja',
      item_name: 'Suco Del Valle Maracujá 290ml (Lata)',
      short_desc: 'Lata 290ml gelada',
      price: 850, // R$ 8,50
      is_sold_separately: true
    },
    {
      app_item_id: 'suco_delvalle_laranja',
      item_name: 'Suco Del Valle Laranja 290ml (Lata)',
      short_desc: 'Lata 290ml gelada',
      price: 850, // R$ 8,50
      is_sold_separately: true
    },
    {
      app_item_id: 'refri_coca_2l',
      item_name: 'Coca-Cola 2 Litros Normal',
      short_desc: 'Garrafa 2 Litros gelada',
      price: 1790, // R$ 17,90
      is_sold_separately: true
    },
    {
      app_item_id: 'refri_coca_zero_2l',
      item_name: 'Coca-Cola 2 Litros Zero',
      short_desc: 'Garrafa 2 Litros gelada',
      price: 1790, // R$ 17,90
      is_sold_separately: true
    },
    {
      app_item_id: 'refri_guarana_2l',
      item_name: 'Guaraná Antarctica 2 Litros',
      short_desc: 'Garrafa 2 Litros gelada',
      price: 1590, // R$ 15,90
      is_sold_separately: true
    },
    {
      app_item_id: 'agua_mineral_sem_gas',
      item_name: 'Água Mineral 500ml (sem gás)',
      short_desc: 'Garrafa 500ml gelada',
      price: 500, // R$ 5,00
      is_sold_separately: true
    },
    {
      app_item_id: 'agua_mineral_com_gas',
      item_name: 'Água Mineral 500ml (com gás)',
      short_desc: 'Garrafa 500ml gelada com gás',
      price: 550, // R$ 5,50
      is_sold_separately: true
    },
    {
      app_item_id: 'cerveja_original_lata',
      item_name: 'Cerveja Original 350ml (Lata)',
      short_desc: 'Lata 350ml gelada',
      price: 950, // R$ 9,50
      is_sold_separately: true
    },
    {
      app_item_id: 'cerveja_heineken_ln',
      item_name: 'Cerveja Heineken 330ml (Long Neck)',
      short_desc: 'Long Neck 330ml bem gelada',
      price: 1290, // R$ 12,90
      is_sold_separately: true
    }
  ];

  // Grupos de Modificadores (Formatos e Escolha de Bebidas)
  const modifier_groups = [
    {
      app_modifier_group_id: 'mg_formato',
      modifier_group_name: 'Escolha o Formato do Hot Dog',
      is_required: 1,
      quantity_min_permitted: 1,
      quantity_max_permitted: 1,
      buy_mode: 0,
      app_mg_items: [
        { app_item_id: 'mod_pao', price: 0 },
        { app_item_id: 'mod_prato', price: 200 }
      ]
    },
    {
      app_modifier_group_id: 'mg_formato_dog1',
      modifier_group_name: '1º Dog: Escolha o Formato',
      is_required: 1,
      quantity_min_permitted: 1,
      quantity_max_permitted: 1,
      buy_mode: 0,
      app_mg_items: [
        { app_item_id: 'mod_pao', price: 0 },
        { app_item_id: 'mod_prato', price: 200 }
      ]
    },
    {
      app_modifier_group_id: 'mg_formato_dog2',
      modifier_group_name: '2º Dog: Escolha o Formato',
      is_required: 1,
      quantity_min_permitted: 1,
      quantity_max_permitted: 1,
      buy_mode: 0,
      app_mg_items: [
        { app_item_id: 'mod_pao', price: 0 },
        { app_item_id: 'mod_prato', price: 200 }
      ]
    },
    {
      app_modifier_group_id: 'mg_formato_dog3',
      modifier_group_name: '3º Dog: Escolha o Formato',
      is_required: 1,
      quantity_min_permitted: 1,
      quantity_max_permitted: 1,
      buy_mode: 0,
      app_mg_items: [
        { app_item_id: 'mod_pao', price: 0 },
        { app_item_id: 'mod_prato', price: 200 }
      ]
    },
    {
      app_modifier_group_id: 'mg_refri_1',
      modifier_group_name: '1º Refrigerante do Combo',
      is_required: 1,
      quantity_min_permitted: 1,
      quantity_max_permitted: 1,
      buy_mode: 0,
      app_mg_items: [
        { app_item_id: 'mod_coca', price: 0 },
        { app_item_id: 'mod_coca_zero', price: 0 },
        { app_item_id: 'mod_guarana', price: 0 },
        { app_item_id: 'mod_fanta', price: 0 }
      ]
    },
    {
      app_modifier_group_id: 'mg_refri_2',
      modifier_group_name: '2º Refrigerante do Combo',
      is_required: 1,
      quantity_min_permitted: 1,
      quantity_max_permitted: 1,
      buy_mode: 0,
      app_mg_items: [
        { app_item_id: 'mod_coca', price: 0 },
        { app_item_id: 'mod_coca_zero', price: 0 },
        { app_item_id: 'mod_guarana', price: 0 },
        { app_item_id: 'mod_fanta', price: 0 }
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

  console.log(`📦 Enviando cardápio completo calibrado (${items.length} itens) via POST /v3/item/item/upload...`);
  const res = await fetch(`${BASE_URL_99}/v3/item/item/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  console.log('HTTP Status Upload:', res.status);
  const data = await res.json();
  console.log('Resposta do Upload 99Food:', JSON.stringify(data, null, 2));

  if (data.errno === 0) {
    console.log('🎉 SUCESSO! Cardápio oficial calibrado de O Mordidaço enviado para a 99Food em Produção!');
  } else {
    console.log('⚠️ Aviso retornado:', data.errmsg);
  }
}

if (require.main === module) {
  sincronizarCardapio99Food().catch(err => console.error('Erro na sincronização:', err.message));
}

module.exports = { sincronizarCardapio99Food };
