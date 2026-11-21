/**
 * Script Oficial de Sincronização do Cardápio Completo na 99Food (OpenAPI DiDi v3.0)
 * Loja: O Mordidaço - Dogs (Campinas - SP)
 * 100% Idêntico ao Site Próprio, com Modificadores (No Pão / No Prato, Retiradas e Adicionais)
 * e Valores Calibrados de Delivery.
 */

const { obterTokenAcesso99 } = require('./integracao_99food');
const BASE_URL = 'https://openapi.99food.com';

async function sincronizarCardapioCompleto() {
  console.log('🚀 Iniciando sincronização do cardápio completo de O Mordidaço com a 99Food...');
  const token = await obterTokenAcesso99();
  if (!token) {
    throw new Error('Não foi possível obter o token de acesso da 99Food');
  }
  console.log('✓ Token de acesso autenticado!');

  const menus = [
    {
      app_menu_id: '5764617594607502251',
      menu_name: 'O Mordidaço - Dogs',
      app_category_ids: ['cat_combos', 'cat_hotdogs', 'cat_sobremesas', 'cat_adicionais', 'cat_bebidas']
    }
  ];

  const categories = [
    {
      app_category_id: 'cat_combos',
      category_name: '⭐ Combos Campeões (Mais Pedidos)',
      app_item_ids: ['combo_casal', 'combo_familia']
    },
    {
      app_category_id: 'cat_hotdogs',
      category_name: '🌭 Hot Dogs Artesanais (No Pão ou No Prato)',
      app_item_ids: ['dog_classico', 'dog_em_dobro', 'dog_veg', 'dog_bacon', 'dog_cremoso', 'dog_tudao']
    },
    {
      app_category_id: 'cat_sobremesas',
      category_name: '🍰 Sobremesas no Pote (170ml)',
      app_item_ids: ['sobremesa_tortinha_limao', 'sobremesa_escondidinho_nutella']
    },
    {
      app_category_id: 'cat_adicionais',
      category_name: '➕ Adicionais Extras',
      app_item_ids: [
        'add_salsicha', 'add_catupiry', 'add_bacon', 'add_calabresa',
        'add_parmesao', 'add_pure', 'add_milho', 'add_ervilha',
        'add_maionese', 'add_batata_palha'
      ]
    },
    {
      app_category_id: 'cat_bebidas',
      category_name: '🥤 Bebidas Geladas',
      app_item_ids: [
        'refri_coca_lata', 'refri_coca_zero_lata', 'refri_guarana_lata',
        'refri_guarana_zero_lata', 'refri_fanta_lata', 'suco_delvalle_uva',
        'suco_delvalle_maracuja', 'suco_delvalle_laranja', 'refri_coca_2l',
        'refri_coca_zero_2l', 'refri_guarana_2l', 'agua_mineral_sem_gas',
        'agua_mineral_com_gas', 'cerveja_original_lata', 'cerveja_heineken_ln'
      ]
    }
  ];

  const items = [
    // Opções de modificador internas (não vendidas soltas)
    { app_item_id: 'mod_pao', item_name: '🥖 Tradicional de Rua (No Pão Bambini 70g)', price: 0, status: 1, is_sold_separately: false, short_desc: 'Aberto farto, selado e com queijo ralado na hora' },
    { app_item_id: 'mod_prato', item_name: '🥣 No Prato (+ R$ 2,00) - Marmitinha Térmica 500ml', price: 200, status: 1, is_sold_separately: false, short_desc: 'Sem pão! +40g de purê artesanal e garfo descartável reforçado' },

    // Retiradas (Grátis)
    { app_item_id: 'ret_milho', item_name: 'Sem Milho', price: 0, status: 1, is_sold_separately: false },
    { app_item_id: 'ret_ervilha', item_name: 'Sem Ervilha', price: 0, status: 1, is_sold_separately: false },
    { app_item_id: 'ret_vinagrete', item_name: 'Sem Vinagrete', price: 0, status: 1, is_sold_separately: false },
    { app_item_id: 'ret_pure', item_name: 'Sem Purê de Batata', price: 0, status: 1, is_sold_separately: false },
    { app_item_id: 'ret_palha', item_name: 'Sem Batata Palha', price: 0, status: 1, is_sold_separately: false },
    { app_item_id: 'ret_molho', item_name: "Sem Maionese Hellmann's", price: 0, status: 1, is_sold_separately: false },
    { app_item_id: 'ret_ketchup', item_name: 'Sem Ketchup', price: 0, status: 1, is_sold_separately: false },
    { app_item_id: 'ret_mostarda', item_name: 'Sem Mostarda', price: 0, status: 1, is_sold_separately: false },
    { app_item_id: 'ret_parmesao', item_name: 'Sem Queijo Parmesão', price: 0, status: 1, is_sold_separately: false },

    // Refris Combo
    { app_item_id: 'mod_coca_lata', item_name: '1x Coca-Cola Original 350ml (Lata)', price: 0, status: 1, is_sold_separately: false },
    { app_item_id: 'mod_coca_zero_lata', item_name: '1x Coca-Cola Zero 350ml (Lata)', price: 0, status: 1, is_sold_separately: false },
    { app_item_id: 'mod_guarana_lata', item_name: '1x Guaraná Antarctica 350ml (Lata)', price: 0, status: 1, is_sold_separately: false },
    { app_item_id: 'mod_guarana_zero_lata', item_name: '1x Guaraná Antarctica Zero 350ml (Lata)', price: 0, status: 1, is_sold_separately: false },
    { app_item_id: 'mod_fanta_lata', item_name: '1x Fanta Laranja 350ml (Lata)', price: 0, status: 1, is_sold_separately: false },
    { app_item_id: 'mod_delvalle_uva', item_name: '1x Suco Del Valle Uva 290ml (Lata)', price: 0, status: 1, is_sold_separately: false },
    { app_item_id: 'mod_agua_mineral', item_name: '1x Água Mineral 500ml (sem gás)', price: 0, status: 1, is_sold_separately: false },

    // 1. COMBOS OFICIAIS (Com modificadores de formato por dog e refris)
    {
      app_item_id: 'combo_casal',
      item_name: 'Combo Mordidaço Casal',
      price: 6890,
      status: 1,
      is_sold_separately: true,
      short_desc: '2 Mordidaços em Dobro (escolha no Pão ou no Prato para cada um) + 2 Refrigerantes Lata + 2 Potes de Molho Especial da Casa (50ml). A pedida perfeita para duas pessoas!',
      app_modifier_group_ids: ['mg_formato_dog1', 'mg_formato_dog2', 'mg_refri_1', 'mg_refri_2', 'mg_adicionais']
    },
    {
      app_item_id: 'combo_familia',
      item_name: 'Combo Família Mordidaço',
      price: 8690,
      status: 1,
      is_sold_separately: true,
      short_desc: '2 Mordidaços em Dobro + 1 Mordidaço Clássico (escolha no Pão ou no Prato para cada um) + 1 Guaraná Antarctica 2 Litros + 3 Potes de Molho da Casa (50ml). Fartura garantida!',
      app_modifier_group_ids: ['mg_formato_dog1', 'mg_formato_dog2', 'mg_formato_dog3', 'mg_adicionais']
    },

    // 2. 6 HOT DOGS ARTESANAIS OFICIAIS (Com Escolha No Pão/No Prato, Retiradas e Adicionais)
    {
      app_item_id: 'dog_classico',
      item_name: 'Mordidaço Clássico',
      price: 2290,
      status: 1,
      is_sold_separately: true,
      short_desc: '1 salsicha Sadia, maionese Hellmann\'s, ketchup, mostarda, milho, ervilha, vinagrete, purê de batata artesanal e batata palha crocante.',
      app_modifier_group_ids: ['mg_formato', 'mg_retirar', 'mg_adicionais']
    },
    {
      app_item_id: 'dog_em_dobro',
      item_name: 'Mordidaço em Dobro',
      price: 2890,
      status: 1,
      is_sold_separately: true,
      short_desc: 'O campeão de vendas! 2 salsichas Sadia, o verdadeiro dobro de queijo muçarela derretido, maionese Hellmann\'s, ketchup, mostarda, milho, ervilha, vinagrete, purê artesanal, batata palha e chuva de parmesão ralado por cima.',
      app_modifier_group_ids: ['mg_formato', 'mg_retirar', 'mg_adicionais']
    },
    {
      app_item_id: 'dog_veg',
      item_name: 'Mordidaço Queijudo (VEG)',
      price: 3190,
      status: 1,
      is_sold_separately: true,
      short_desc: '🌱 Opção Vegetariana! 2 palitos de queijo empanados crocantes com queijo puxa-puxa derretido, purê artesanal da casa, vinagrete fresco, milho, ketchup, mostarda, maionese Hellmann\'s e batata palha crocante.',
      app_modifier_group_ids: ['mg_formato', 'mg_retirar', 'mg_adicionais']
    },
    {
      app_item_id: 'dog_bacon',
      item_name: 'Mordidaço Bacon',
      price: 3390,
      status: 1,
      is_sold_separately: true,
      short_desc: '2 salsichas Sadia, maionese Hellmann\'s, purê de batata artesanal, milho, ervilha, bacon crocante em cubos, queijo muçarela derretido, batata palha e parmesão ralado por cima.',
      app_modifier_group_ids: ['mg_formato', 'mg_retirar', 'mg_adicionais']
    },
    {
      app_item_id: 'dog_cremoso',
      item_name: 'Mordidaço Cremoso',
      price: 3490,
      status: 1,
      is_sold_separately: true,
      short_desc: '1 salsicha Sadia, frango desfiado temperado, Catupiry® Original cremoso, maionese Hellmann\'s, ketchup, mostarda, milho, vinagrete, purê de batata artesanal e batata palha crocante.',
      app_modifier_group_ids: ['mg_formato', 'mg_retirar', 'mg_adicionais']
    },
    {
      app_item_id: 'dog_tudao',
      item_name: 'Mordidaço Tudão',
      price: 4490,
      status: 1,
      is_sold_separately: true,
      short_desc: 'O gigante da casa! 1 salsicha Sadia, frango desfiado temperado, Catupiry® Original, purê artesanal, maionese Hellmann\'s, ketchup, mostarda, milho, ervilha, vinagrete, bacon em dobro, calabresa ralada douradinha, queijo muçarela em dobro derretido, batata palha e parmesão ralado por cima.',
      app_modifier_group_ids: ['mg_formato', 'mg_retirar', 'mg_adicionais']
    },

    // 3. SOBREMESAS ARTESANAIS NO POTE (170ML)
    {
      app_item_id: 'sobremesa_tortinha_limao',
      item_name: 'Tortinha de Limão no Pote (170ml)',
      price: 1490,
      status: 1,
      is_sold_separately: true,
      short_desc: 'Camadas de farofa amanteigada de biscoito, creme aveludado de limão fresco e raspas de limão verde. Acompanha colherzinha lacrada! (~161g).'
    },
    {
      app_item_id: 'sobremesa_escondidinho_nutella',
      item_name: 'Escondidinho de Nutella com Brownie (170ml)',
      price: 2190,
      status: 1,
      is_sold_separately: true,
      short_desc: 'Base e topo de brigadeiro de Leite Ninho®, recheado com brownie artesanal e Nutella® Ferrero pura. Acompanha colherzinha lacrada! (~155g).'
    },

    // 3. ADICIONAIS EXTRAS (Vendidos avulsos e como opcionais)
    { app_item_id: 'add_salsicha', item_name: '1 Salsicha Sadia Extra', price: 490, status: 1, is_sold_separately: true, short_desc: 'Salsicha Sadia cozida no molho especial' },
    { app_item_id: 'add_catupiry', item_name: 'Catupiry Original Extra (40g)', price: 690, status: 1, is_sold_separately: true, short_desc: 'Legítimo Catupiry cremoso' },
    { app_item_id: 'add_bacon', item_name: 'Bacon Crocante Extra em Cubos (40g)', price: 690, status: 1, is_sold_separately: true, short_desc: 'Bacon em cubos douradinho e sequinho' },
    { app_item_id: 'add_calabresa', item_name: 'Calabresa Ralada Douradinha (40g)', price: 590, status: 1, is_sold_separately: true, short_desc: 'Calabresa fininha refogada' },
    { app_item_id: 'add_parmesao', item_name: 'Parmesão Ralado Fresco (20g)', price: 450, status: 1, is_sold_separately: true, short_desc: 'Ralado na hora' },
    { app_item_id: 'add_pure', item_name: 'Purê de Batata Artesanal Extra (80g)', price: 490, status: 1, is_sold_separately: true, short_desc: 'Purê de batata artesanal cremoso' },
    { app_item_id: 'add_milho', item_name: 'Milho Verde Extra', price: 350, status: 1, is_sold_separately: true, short_desc: 'Milho verde selecionado' },
    { app_item_id: 'add_ervilha', item_name: 'Ervilha Extra', price: 350, status: 1, is_sold_separately: true, short_desc: 'Ervilha fresca tenra' },
    { app_item_id: 'add_maionese', item_name: 'Pote de Molho Especial da Casa (50ml)', price: 450, status: 1, is_sold_separately: true, short_desc: 'Molho verde especial da casa em potinho' },
    { app_item_id: 'add_batata_palha', item_name: 'Batata Palha Crocante Extra', price: 350, status: 1, is_sold_separately: true, short_desc: 'Batata palha fininha crocante' },

    // 4. BEBIDAS GELADAS
    { app_item_id: 'refri_coca_lata', item_name: 'Coca-Cola Original 350ml (Lata)', price: 790, status: 1, is_sold_separately: true, short_desc: 'Lata 350ml gelada' },
    { app_item_id: 'refri_coca_zero_lata', item_name: 'Coca-Cola Zero 350ml (Lata)', price: 790, status: 1, is_sold_separately: true, short_desc: 'Lata 350ml gelada' },
    { app_item_id: 'refri_guarana_lata', item_name: 'Guaraná Antarctica 350ml (Lata)', price: 790, status: 1, is_sold_separately: true, short_desc: 'Lata 350ml gelada' },
    { app_item_id: 'refri_guarana_zero_lata', item_name: 'Guaraná Antarctica Zero 350ml (Lata)', price: 790, status: 1, is_sold_separately: true, short_desc: 'Lata 350ml gelada' },
    { app_item_id: 'refri_fanta_lata', item_name: 'Fanta Laranja 350ml (Lata)', price: 790, status: 1, is_sold_separately: true, short_desc: 'Lata 350ml gelada' },
    { app_item_id: 'suco_delvalle_uva', item_name: 'Suco Del Valle Uva 290ml (Lata)', price: 850, status: 1, is_sold_separately: true, short_desc: 'Lata 290ml gelada' },
    { app_item_id: 'suco_delvalle_maracuja', item_name: 'Suco Del Valle Maracujá 290ml (Lata)', price: 850, status: 1, is_sold_separately: true, short_desc: 'Lata 290ml gelada' },
    { app_item_id: 'suco_delvalle_laranja', item_name: 'Suco Del Valle Laranja 290ml (Lata)', price: 850, status: 1, is_sold_separately: true, short_desc: 'Lata 290ml gelada' },
    { app_item_id: 'refri_coca_2l', item_name: 'Coca-Cola 2 Litros Normal', price: 1790, status: 1, is_sold_separately: true, short_desc: 'Garrafa 2 Litros gelada' },
    { app_item_id: 'refri_coca_zero_2l', item_name: 'Coca-Cola 2 Litros Zero', price: 1790, status: 1, is_sold_separately: true, short_desc: 'Garrafa 2 Litros gelada' },
    { app_item_id: 'refri_guarana_2l', item_name: 'Guaraná Antarctica 2 Litros', price: 1590, status: 1, is_sold_separately: true, short_desc: 'Garrafa 2 Litros gelada' },
    { app_item_id: 'agua_mineral_sem_gas', item_name: 'Água Mineral 500ml (sem gás)', price: 500, status: 1, is_sold_separately: true, short_desc: 'Garrafa 500ml gelada' },
    { app_item_id: 'agua_mineral_com_gas', item_name: 'Água Mineral 500ml (com gás)', price: 550, status: 1, is_sold_separately: true, short_desc: 'Garrafa 500ml gelada' },
    { app_item_id: 'cerveja_original_lata', item_name: 'Cerveja Original 350ml (Lata)', price: 950, status: 1, is_sold_separately: true, short_desc: 'Lata 350ml gelada' },
    { app_item_id: 'cerveja_heineken_ln', item_name: 'Cerveja Heineken 330ml (Long Neck)', price: 1290, status: 1, is_sold_separately: true, short_desc: 'Long Neck 330ml gelada' }
  ];

  // Grupos de Modificadores (Formatos, Retiradas e Adicionais)
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
      app_modifier_group_id: 'mg_retirar',
      modifier_group_name: 'Deseja Retirar Algo deste Dog? (Opcional)',
      is_required: 2,
      quantity_min_permitted: 0,
      quantity_max_permitted: 8,
      buy_mode: 0,
      app_mg_items: [
        { app_item_id: 'ret_milho', price: 0 },
        { app_item_id: 'ret_ervilha', price: 0 },
        { app_item_id: 'ret_vinagrete', price: 0 },
        { app_item_id: 'ret_pure', price: 0 },
        { app_item_id: 'ret_palha', price: 0 },
        { app_item_id: 'ret_molho', price: 0 },
        { app_item_id: 'ret_ketchup', price: 0 },
        { app_item_id: 'ret_mostarda', price: 0 },
        { app_item_id: 'ret_parmesao', price: 0 }
      ]
    },
    {
      app_modifier_group_id: 'mg_adicionais',
      modifier_group_name: '🥫 Turbinar com Adicionais Extras? (Opcional)',
      is_required: 2,
      quantity_min_permitted: 0,
      quantity_max_permitted: 10,
      buy_mode: 0,
      app_mg_items: [
        { app_item_id: 'add_salsicha', price: 490 },
        { app_item_id: 'add_catupiry', price: 690 },
        { app_item_id: 'add_bacon', price: 690 },
        { app_item_id: 'add_calabresa', price: 590 },
        { app_item_id: 'add_parmesao', price: 450 },
        { app_item_id: 'add_pure', price: 490 },
        { app_item_id: 'add_milho', price: 350 },
        { app_item_id: 'add_ervilha', price: 350 },
        { app_item_id: 'add_maionese', price: 450 },
        { app_item_id: 'add_batata_palha', price: 350 }
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
        { app_item_id: 'mod_coca_lata', price: 0 },
        { app_item_id: 'mod_coca_zero_lata', price: 0 },
        { app_item_id: 'mod_guarana_lata', price: 0 },
        { app_item_id: 'mod_guarana_zero_lata', price: 0 },
        { app_item_id: 'mod_fanta_lata', price: 0 },
        { app_item_id: 'mod_delvalle_uva', price: 0 },
        { app_item_id: 'mod_agua_mineral', price: 0 }
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
        { app_item_id: 'mod_coca_lata', price: 0 },
        { app_item_id: 'mod_coca_zero_lata', price: 0 },
        { app_item_id: 'mod_guarana_lata', price: 0 },
        { app_item_id: 'mod_guarana_zero_lata', price: 0 },
        { app_item_id: 'mod_fanta_lata', price: 0 },
        { app_item_id: 'mod_delvalle_uva', price: 0 },
        { app_item_id: 'mod_agua_mineral', price: 0 }
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

  const res = await fetch(`${BASE_URL}/v3/item/item/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  console.log('HTTP Status:', res.status);
  console.log('Resposta 99Food:', JSON.stringify(data, null, 2));
}

sincronizarCardapioCompleto();
