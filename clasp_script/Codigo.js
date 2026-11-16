/**
 * Automação de Preenchimento da Lista de Compras e Ações - O Mordidaço
 * Vinculado à Planilha: Lista de Compras - O Mordidaço
 * Atualizado com Pedido de Venda nº 12118 da Loja do Lancheiro Campinas (R$ 468,50)
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🌭 O Mordidaço')
    .addItem('🚀 Atualizar Planilha com Checks', 'preencherListaDeCompras')
    .addToUi();
}

function preencherListaDeCompras() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Página1') || ss.getActiveSheet();
  sheet.setName('Lista de Compras & Ações');
  sheet.clear();

  // Cabeçalho Oficial
  const headers = [
    ['Check', 'Categoria', 'Item / Ação', 'Descrição / Especificação', 'Fornecedor', 'Quantidade', 'Custo (R$)', 'Status / Prioridade']
  ];

  const dados = [
    // 🏛️ Burocracia & Pagamentos (Concluídos e Pendentes)
    [true, '🏛️ Burocracia', 'Abertura do MEI', 'CNPJ 69.985.669/0001-86 com CNAEs 5611-2 e 5620-1 ativos', 'Portal do Empreendedor', '1 un', 0.00, 'Concluído'],
    [true, '🏛️ Burocracia', 'Conta Bancária PJ', 'Nubank PJ (Banco 260) ativa e vinculada ao CNPJ da empresa', 'Nubank PJ', '1 un', 0.00, 'Concluído'],
    [true, '🏛️ Burocracia', 'Homologação iFood', 'Módulos Order, Events, Catalog e Merchant homologados', 'iFood Developer', '1 un', 0.00, 'Concluído'],
    [true, '🏛️ Burocracia', 'Homologação 99Food', 'Aplicação de Produção e Loja Real Campinas vinculadas', '99Food Open API', '1 un', 0.00, 'Concluído'],
    [false, '🏛️ Burocracia', 'Maquininha com VR/VA', 'Pedir Moderninha Pro 2 PagBank no CNPJ MEI (chip 4G incluso)', 'PagBank Oficial', '1 un', 178.80, 'Pendente (Alta)'],
    [false, '🏛️ Burocracia', 'Credenciamento VR/VA', 'Habilitar vouchers Alelo, Sodexo/Pluxee, Ticket e VR no app PagBank', 'App PagBank', '1 un', 0.00, 'Pendente (Alta)'],
    [false, '🏛️ Burocracia', 'Vouchers no iFood/99', 'Ativar pagamentos com VR/VA via app no Portal do Parceiro', 'Portal Parceiro', '1 un', 0.00, 'Pendente (Alta)'],

    // 🏗️ Equipamentos Pesados (Pendentes)
    [false, '🏗️ Equipamentos', 'Geladeira / Refrigerador', 'Geladeira Duplex ou Frost-Free (resfriamento de molhos, purê e bebidas)', 'Lojas / Usados', '1 un', 1200.00, 'Pendente (Alta)'],
    [false, '🏗️ Equipamentos', 'Bancada de Inox', 'Bancada de Inox (1,20m a 1,50m) para montagem higiênica e ágil', 'Loja do Lancheiro / Inox', '1 un', 380.00, 'Pendente (Alta)'],
    [false, '🏗️ Equipamentos', 'Balança Digital de Precisão', 'Balança digital de bancada (divisão de 1g até 10kg) para porcionar muçarela', 'Mercado / Internet', '1 un', 45.00, 'Pendente (Alta)'],
    [false, '🏗️ Equipamentos', 'Termômetro Culinário Digital', 'Termômetro tipo espeto para controle térmico do molho (>65°C)', 'Internet / Utensílios', '1 un', 25.00, 'Pendente (Média)'],

    // 🍳 Utensílios de Cozinha
    [false, '🍳 Utensílios', 'Panela Caldeirão Grande', 'Panela de inox/alumínio reforçado (8 a 10L) para o molho fervilhante', 'Loja do Lancheiro / Atacado', '1 un', 85.00, 'Pendente (Alta)'],
    [false, '🍳 Utensílios', 'Espremedor de Batatas', 'Espremedor reforçado de batatas para o Purê de Ouro artesanal', 'Utensílios', '1 un', 35.00, 'Pendente (Alta)'],
    [false, '🍳 Utensílios', 'Pegadores de Inox', '2 pegadores de silicone/inox com trava para manusear salsichas', 'Utensílios', '2 un', 30.00, 'Pendente (Alta)'],
    [false, '🍳 Utensílios', 'Ralador Manual de Parmesão', 'Ralador fino em inox para a chuva de parmesão ralado na hora', 'Utensílios', '1 un', 25.00, 'Pendente (Alta)'],
    [false, '🍳 Utensílios', 'Bisnagas Invertidas Fifo', 'Bisnagas de dosagem rápida para ketchup, mostarda e maioneses', 'Loja do Lancheiro', '4 un', 48.00, 'Pendente (Alta)'],
    [false, '🍳 Utensílios', 'Potes Herméticos c/ Tampa', 'Potes organizadores para o mise en place (milho, vinagrete, bacon)', 'Loja do Lancheiro / Assaí', '6 un', 60.00, 'Pendente (Alta)'],
    [false, '🍳 Utensílios', 'Facas Profissionais', '1 faca de serra grande para pão + 1 faca do chef para vinagrete', 'Utensílios', '2 un', 55.00, 'Pendente (Média)'],

    // 📦 COMPRADOS NA LOJA DO LANCHEIRO (Pedido nº 12118 - R$ 468,50)
    [true, '📦 Embalagens', 'Dogueira Bom Apetite BH 05', 'Embalagem térmica individual para hot dog tradicional (Cód 97)', 'Loja do Lancheiro', '100 un', 59.90, 'Comprado ✅'],
    [true, '📦 Embalagens', 'Sacos Kraft G Inteiro Liso', 'Sacos kraft 24x14x31 para entrega de combos grandes (Cód 1760)', 'Loja do Lancheiro', '100 un', 51.90, 'Comprado ✅'],
    [true, '📦 Embalagens', 'Sacos Kraft M Inteiro Liso', 'Sacos kraft 22x12x32 para pedidos individuais e duplos (Cód 1451)', 'Loja do Lancheiro', '100 un', 43.90, 'Comprado ✅'],
    [true, '📦 Embalagens', 'Pote Retangular 700ml Galvanotek G302', 'Marmitinha térmica descartável para o formato No Prato (Cód 104924)', 'Loja do Lancheiro', '20 un (2 cx)', 33.80, 'Comprado ✅'],
    [true, '📦 Embalagens', 'Pote Molho 30ml Preto Galvanotek G695', 'Potinhos pretos com tampa para Maionese Especial da Casa (Cód 107747)', 'Loja do Lancheiro', '100 un', 21.90, 'Comprado ✅'],
    [true, '📦 Embalagens', 'Lacre de Segurança Preto', 'Rolos de adesivo lacre de segurança para sacolas (Cód 106261)', 'Loja do Lancheiro', '500 un', 16.90, 'Comprado ✅'],
    [true, '📦 Embalagens', 'Guardanapo Sachê Líder', 'Guardanapos higiênicos individuais em sachê (Cód 103316)', 'Loja do Lancheiro', '500 un', 36.90, 'Comprado ✅'],
    [true, '🌭 Insumos', 'Ketchup Heinz Sachê 7g', 'Caixa com 144 sachês individuais de Ketchup Heinz (Cód 736)', 'Loja do Lancheiro', '144 un', 29.90, 'Comprado ✅'],
    [true, '🌭 Insumos', 'Mostarda Amarela Heinz Sachê 5g', 'Caixa com 144 sachês individuais de Mostarda Heinz (Cód 737)', 'Loja do Lancheiro', '144 un', 26.90, 'Comprado ✅'],
    [true, '🌭 Insumos', 'Maionese Heinz Sachê 7g', 'Caixa com 144 sachês individuais de Maionese Heinz (Cód 738)', 'Loja do Lancheiro', '144 un', 29.90, 'Comprado ✅'],
    [true, '🌭 Insumos', 'Milho Verde Quero Lata 1,7kg', 'Lata grande profissional de milho verde em conserva (Cód 1559)', 'Loja do Lancheiro', '1 lata (1,7kg)', 25.90, 'Comprado ✅'],
    [true, '🌭 Insumos', 'Ervilha Quero Lata 1,7kg', 'Lata grande profissional de ervilha em conserva (Cód 117106)', 'Loja do Lancheiro', '1 lata (1,7kg)', 19.90, 'Comprado ✅'],
    [true, '🌭 Insumos', 'Bacon Mister Beef em Cubos 1kg', 'Pacote de bacon defumado em cubos douradinhos (Cód 170)', 'Loja do Lancheiro', '1 kg', 35.90, 'Comprado ✅'],
    [true, '🌭 Insumos', 'Muçarela Ralada 1kg', 'Queijo muçarela ralado fresco para a estreia (Cód 121589)', 'Loja do Lancheiro', '1 kg', 34.90, 'Comprado ✅'],

    // 📦 Embalagens Complementares Restantes
    [false, '📦 Embalagens', 'Garfos Descartáveis Reforçados', 'Garfos plásticos reforçados para acompanhar o formato No Prato', 'Loja do Lancheiro / Assaí', '100 un', 18.00, 'Pendente (Alta)'],
    [false, '📦 Embalagens', 'Papel Acoplado Térmico', 'Papel barreira de gordura para embrulhar o Hot Dog', 'Loja do Lancheiro', '500 un', 38.00, 'Pendente (Alta)'],
    [false, '📦 Embalagens', 'Carimbo com Mascote Filhinho', 'Carimbo de madeira personalizado para carimbar as sacolas kraft', 'Gráfica / Internet', '1 un', 45.00, 'Pendente (Média)'],
    [false, '📦 Embalagens', 'Almofada de Tinta Vermelha', 'Almofada com tinta vermelha para o carimbo', 'Papelaria', '1 un', 18.00, 'Pendente (Média)'],
    [false, '📦 Embalagens', 'Bobinas Térmicas 58mm/80mm', 'Bobinas de papel térmico para impressora de pedidos da cozinha', 'Papelaria / Internet', '10 un', 35.00, 'Pendente (Alta)'],

    // 🌭 Insumos Faltantes (Assaí Abolição, CEASA & Bambini)
    [false, '🌭 Insumos', 'Salsichas Sadia', 'Pacotes de salsicha Sadia (padrão ouro, estalo na mordida)', 'Assaí Abolição', '10 kg', 125.00, 'Pendente (Alta)'],
    [false, '🌭 Insumos', 'Pães de Hot Dog Bambini 70g', 'Pães macios 18cm (encomenda diária fresca na panificadora)', 'Panificadora Bambini', '70 un', 63.00, 'Pendente (Alta)'],
    [false, '🌭 Insumos', 'Requeijão Catupiry® Original', 'Bisnaga legítima de 1,5kg Catupiry® cremoso', 'Assaí Abolição', '1 bisnaga', 52.00, 'Pendente (Alta)'],
    [false, '🌭 Insumos', 'Peito de Frango Desfiado', 'Peito de frango cozido e temperado para pré-preparo', 'Assaí Abolição', '2 kg', 38.00, 'Pendente (Alta)'],
    [false, '🌭 Insumos', 'Linguiça Calabresa Defumada', 'Calabresa ralada e frita para o Mordidaço Tudão', 'Assaí Abolição', '1 kg', 26.00, 'Pendente (Alta)'],
    [false, '🌭 Insumos', 'Queijo Parmesão em Pedaço', 'Pedaço de parmesão curado para ralar fresco em cima dos lanches', 'Assaí Abolição', '500 g', 35.00, 'Pendente (Alta)'],
    [false, '🌭 Insumos', 'Batatas Monalisa (Saco)', 'Batatas selecionadas para o preparo do purê caseiro cremoso', 'CEASA Campinas', '1 saco (25kg)', 45.00, 'Pendente (Alta)'],
    [false, '🌭 Insumos', 'Tomates Maduros p/ Molho', 'Caixa de tomate maduro para a base de molho caseiro da casa', 'CEASA Campinas', '1 caixa', 35.00, 'Pendente (Alta)'],
    [false, '🌭 Insumos', 'Cebola', 'Saco de cebola para molho e vinagrete diário', 'CEASA Campinas', '1 saco', 25.00, 'Pendente (Alta)'],
    [false, '🌭 Insumos', 'Temperos Frescos', 'Cheiro-verde, alho e pimentão no atacado', 'CEASA Campinas', 'Vários', 15.00, 'Pendente (Alta)'],
    [false, '🌭 Insumos', 'Leite Integral + Manteiga', 'Para o preparo do purê de batatas artesanal cremoso', 'Assaí Abolição', '2L + 1 pote', 22.00, 'Pendente (Alta)'],
    [false, '🌭 Insumos', 'Batata Palha Crocante', 'Batata palha tradicional crocante pacote profissional grande', 'Assaí Abolição', '2 kg', 36.00, 'Pendente (Alta)'],
    [false, '🌭 Insumos', 'Molho de Tomate Refogado', 'Extrato e polpa de tomate para encorpar o molho', 'Assaí Abolição', '6 sachês', 24.00, 'Pendente (Alta)'],

    // 🥤 Bebidas Geladas (Assaí Abolição)
    [false, '🥤 Bebidas', 'Coca-Cola Original 350ml', 'Fardo fechado com 12 latinhas geladas', 'Assaí Abolição', '1 fardo', 38.00, 'Pendente (Alta)'],
    [false, '🥤 Bebidas', 'Coca-Cola Zero 350ml', 'Fardo fechado com 12 latinhas geladas', 'Assaí Abolição', '1 fardo', 38.00, 'Pendente (Média)'],
    [false, '🥤 Bebidas', 'Guaraná Antarctica 350ml', 'Fardo fechado com 12 latinhas geladas', 'Assaí Abolição', '1 fardo', 34.00, 'Pendente (Alta)'],
    [false, '🥤 Bebidas', 'Guaraná Antarctica 2 Litros', 'Garrafas de 2L para os Combos Família', 'Assaí Abolição', '6 garrafas', 48.00, 'Pendente (Alta)'],
    [false, '🥤 Bebidas', 'Suco Del Valle Uva 290ml', 'Fardo com 12 latinhas', 'Assaí Abolição', '1 fardo', 32.00, 'Pendente (Média)'],
    [false, '🥤 Bebidas', 'Água Mineral 500ml sem gás', 'Fardo fechado com 12 garrafinhas', 'Assaí Abolição', '1 fardo', 18.00, 'Pendente (Média)']
  ];

  // 1. Cabeçalho Vermelho O Mordidaço
  sheet.getRange(1, 1, 1, 8).setValues(headers)
    .setBackground('#ea1d2c')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontSize(11)
    .setHorizontalAlignment('center');

  // 2. Dados
  sheet.getRange(2, 1, dados.length, 8).setValues(dados);

  // 3. Checkboxes interativos na Coluna A
  sheet.getRange(2, 1, dados.length, 1).insertCheckboxes();

  // 4. Formatação de Moeda na Coluna G
  sheet.getRange(2, 7, dados.length, 1).setNumberFormat('R$ #,##0.00');

  // 5. Linha de Totalizadores no Rodapé
  const totalRow = dados.length + 2;
  sheet.getRange(totalRow, 6).setValue('TOTAL GERAL:').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange(totalRow, 7).setFormula(`=SUM(G2:G${dados.length + 1})`).setFontWeight('bold').setNumberFormat('R$ #,##0.00').setBackground('#fef08a');

  const compradoRow = dados.length + 3;
  sheet.getRange(compradoRow, 6).setValue('TOTAL JÁ COMPRADO:').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange(compradoRow, 7).setFormula(`=SUMIF(A2:A${dados.length + 1}, TRUE, G2:G${dados.length + 1})`).setFontWeight('bold').setNumberFormat('R$ #,##0.00').setBackground('#bbf7d0');

  // 6. Alinhamentos e Larguras
  sheet.getRange(2, 2, dados.length, 1).setHorizontalAlignment('left'); // Categoria
  sheet.getRange(2, 5, dados.length, 1).setHorizontalAlignment('center'); // Fornecedor
  sheet.getRange(2, 6, dados.length, 1).setHorizontalAlignment('center'); // Qtd
  sheet.getRange(2, 8, dados.length, 1).setHorizontalAlignment('center'); // Prioridade

  sheet.setColumnWidth(1, 60);  // Check
  sheet.setColumnWidth(2, 140); // Categoria
  sheet.setColumnWidth(3, 240); // Item
  sheet.setColumnWidth(4, 380); // Descrição
  sheet.setColumnWidth(5, 180); // Fornecedor
  sheet.setColumnWidth(6, 110); // Qtd
  sheet.setColumnWidth(7, 120); // Custo
  sheet.setColumnWidth(8, 140); // Status

  sheet.setFrozenRows(1);
}
