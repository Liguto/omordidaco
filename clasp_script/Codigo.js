/**
 * Automação de Preenchimento da Lista de Compras e Ações - O Mordidaço
 * Vinculado à Planilha: Lista de Compras - O Mordidaço
 * 100% Sincronizado com o Portal Business, CEASA, TENDA Atacado, Bambini e Loja do Lancheiro
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🌭 O Mordidaço')
    .addItem('🚀 Atualizar Planilha c/ Portal Business', 'preencherListaDeCompras')
    .addToUi();
}

function preencherListaDeCompras() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Lista de Compras & Ações') || ss.getActiveSheet();
  sheet.setName('Lista de Compras & Ações');
  sheet.clear();

  // Cabeçalho Oficial (9 Colunas)
  const headers = [
    ['Check', 'Categoria', 'Item / Insumo', 'Descrição / Especificação', 'Fornecedor / Local', 'Quantidade', 'Custo (R$)', 'Rendimento Estimado', 'Status / Prioridade']
  ];

  const dados = [
    // 🏛️ Burocracia & Legalização (Concluídos e Homologados)
    [true, '🏛️ Burocracia', 'Abertura do MEI', 'CNPJ 69.985.669/0001-86 com CNAEs 5611-2 e 5620-1 ativos', 'Portal do Empreendedor', '1 un', 0.00, 'Regularização fiscal', 'Concluído ✅'],
    [true, '🏛️ Burocracia', 'Conta Bancária PJ', 'Nubank PJ (Banco 260) ativa e vinculada ao CNPJ da empresa', 'Nubank PJ', '1 un', 0.00, 'Conta centralizadora', 'Concluído ✅'],
    [true, '🏛️ Burocracia', 'Homologação iFood', 'Loja Produção 1aafd9ac-f972-49bd-9a5d-9fec4036132e ativa e auditada', 'iFood Developer', '1 un', 0.00, 'Canal oficial delivery', 'Concluído ✅'],
    [true, '🏛️ Burocracia', 'Homologação 99Food', 'Loja Produção mordidaco_tamoio_1 sincronizada com OpenAPI v3', '99Food Open API', '1 un', 0.00, 'Canal oficial delivery', 'Concluído ✅'],
    [true, '🏛️ Burocracia', 'Maquininha PagBank Moderninha Pro 2', 'Moderninha Pro 2 com chip 4G + bobina impressa no CNPJ MEI', 'PagBank Oficial', '1 un', 178.80, 'Débito 1,44% / Crédito 3,49%', 'Concluído ✅'],
    [true, '🏛️ Burocracia', 'Contrato Vouchers PAT (VR/VA)', 'Contrato homologado a 3,60% e R$ 0,00 taxa (Alelo, Ticket, Sodexo, VR)', 'PagBank Vouchers', '1 un', 0.00, 'Aceitação de vales refeição', 'Concluído ✅'],

    // 🥖 COMPRADO NA PANIFICADORA BAMBINI (Pedido nº 727486 - R$ 142,20 à vista)
    [true, '🥖 Pães Artesanais', 'Pão de Hot Dog 70g (18cm)', '3 caixas c/ 30un a R$ 47,40/cx (Cód 13.377) - Entrega 25/11 motorista Francisco', 'Panificadora Bambini', '90 un (3 cx)', 142.20, 'Rende 90 lanches no pão', 'Comprado ✅'],

    // 📦 COMPRADOS NA LOJA DO LANCHEIRO (Pedido nº 12118 - R$ 468,50)
    [true, '📦 Embalagens', 'Dogueira Térmica Bom Apetite BH 05', 'Embalagem térmica individual para hot dog tradicional no pão (Cód 97)', 'Loja do Lancheiro', '100 un', 59.90, 'Rende 100 lanches no pão', 'Comprado ✅'],
    [true, '📦 Embalagens', 'Sacos Kraft G 24x14x31', 'Sacos kraft grandes para combos família e pedidos volumosos (Cód 1760)', 'Loja do Lancheiro', '100 un', 51.90, 'Rende 100 pedidos grandes', 'Comprado ✅'],
    [true, '📦 Embalagens', 'Sacos Kraft M 22x12x32', 'Sacos kraft médios para pedidos individuais e duplos (Cód 1451)', 'Loja do Lancheiro', '100 un', 43.90, 'Rende 100 pedidos médios', 'Comprado ✅'],
    [true, '📦 Embalagens', 'Pote Térmico 700ml Galvanotek G302', 'Potes retangulares para mise en place e congelamento de salsichas no freezer (Cód 104924)', 'Loja do Lancheiro', '20 un (2 cx)', 33.80, '20 porções freezer', 'Comprado ✅'],
    [true, '📦 Embalagens', 'Pote Molho 30ml Preto Galvanotek G695', 'Potinhos pretos com tampa para Maioneses Artesanais da Casa (Cód 107747)', 'Loja do Lancheiro', '100 un', 21.90, 'Rende 50 kits overdelivery (2 por pedido)', 'Comprado ✅'],
    [true, '📦 Embalagens', 'Lacre de Segurança Preto', 'Rolos de adesivo lacre de segurança para sacolas kraft (Cód 106261)', 'Loja do Lancheiro', '500 un', 16.90, 'Rende 500 pedidos lacrados', 'Comprado ✅'],
    [true, '📦 Embalagens', 'Guardanapo Sachê Individual Líder', 'Guardanapos higiênicos individuais embalados em sachê (Cód 103316)', 'Loja do Lancheiro', '500 un', 36.90, 'Rende 250 a 500 pedidos', 'Comprado ✅'],
    [true, '🌭 Insumos', 'Ketchup Heinz Sachê 7g', 'Caixa com 144 sachês individuais de Ketchup Heinz (Cód 736)', 'Loja do Lancheiro', '144 un', 29.90, 'Rende 144 lanches cortesia', 'Comprado ✅'],
    [true, '🌭 Insumos', 'Mostarda Amarela Heinz Sachê 5g', 'Caixa com 144 sachês individuais de Mostarda Heinz (Cód 737)', 'Loja do Lancheiro', '144 un', 26.90, 'Rende 144 lanches cortesia', 'Comprado ✅'],
    [true, '🌭 Insumos', 'Maionese Heinz Sachê 7g', 'Caixa com 144 sachês individuais de Maionese Heinz (Cód 738)', 'Loja do Lancheiro', '144 un', 29.90, 'Rende 144 lanches cortesia', 'Comprado ✅'],
    [true, '🌭 Insumos', 'Milho Verde Quero Lata 1,7kg', 'Lata grande profissional de milho verde em conserva (Cód 1559)', 'Loja do Lancheiro', '1,7 kg', 25.90, 'Rende ~40 a 50 lanches', 'Comprado ✅'],
    [true, '🌭 Insumos', 'Ervilha Quero Lata 1,7kg', 'Lata grande profissional de ervilha em conserva (Cód 117106)', 'Loja do Lancheiro', '1,7 kg', 19.90, 'Rende ~40 a 50 lanches', 'Comprado ✅'],
    [true, '🌭 Insumos', 'Bacon Mister Beef em Cubos 1kg', 'Pacote de bacon em cubos douradinhos e sequinhos (Cód 170)', 'Loja do Lancheiro', '1,0 kg', 35.90, 'Rende ~25 lanches no bacon', 'Comprado ✅'],
    [true, '🌭 Insumos', 'Muçarela Ralada Fresca 1kg', 'Queijo muçarela ralado fresco para a estreia (Cód 121589)', 'Loja do Lancheiro', '1,0 kg', 34.90, 'Rende ~25 lanches no dobro', 'Comprado ✅'],

    // 🥬 PENDENTES PARA COMPRA: CEASA CAMPINAS (Amanhã)
    [false, '🥬 Hortifrúti', 'Batata Asterix / Especial p/ Purê', 'Casca firme e lisa, sem água, para o Purê de Ouro artesanal aveludado', 'CEASA Campinas', '15 kg (saco)', 75.00, 'Rende ~180 a 220 lanches', 'Pendente (Amanhã)'],
    [false, '🥬 Hortifrúti', 'Tomate Italiano Maduro', 'Maduros e firmes para o molho especial caseiro refogado e vinagrete', 'CEASA Campinas', '5 kg', 25.00, 'Rende ~100 lanches', 'Pendente (Amanhã)'],
    [false, '🥬 Hortifrúti', 'Cebola Branca e Roxa', 'Cebolas selecionadas para a base de refogados e vinagrete fresco', 'CEASA Campinas', '3 kg', 13.50, 'Rende ~100 lanches', 'Pendente (Amanhã)'],
    [false, '🥬 Hortifrúti', 'Limão Taiti Fresco', 'Casca fina, verde e brilhante para o creme e raspas da Tortinha de Limão', 'CEASA Campinas', '2,5 kg', 12.50, 'Rende ~30 a 40 tortinhas', 'Pendente (Amanhã)'],
    [false, '🥬 Hortifrúti', 'Cheiro-Verde Fresco', 'Salsinha e cebolinha frescas para a Maionese de Ervas (Overdelivery)', 'CEASA Campinas', '3 maços', 9.00, 'Rende ~80 potes maionese ervas', 'Pendente (Amanhã)'],
    [false, '🥬 Hortifrúti', 'Ovos Frescos Selecionados', 'Bandeja com ovos frescos para a fornada de Brownie da Monique', 'CEASA Campinas', '2 a 3 dúzias', 20.00, 'Rende 2 a 3 tabuleiros brownie', 'Pendente (Amanhã)'],
    [false, '🥬 Hortifrúti', 'Alho Roxo', 'Alho fresco para o refogado do molho especial caseiro e purê', 'CEASA Campinas', '1 kg', 15.00, 'Rende ~150 lanches', 'Pendente (Amanhã)'],
    [false, '📦 Embalagens', 'Potes Cristal 170ml c/ Tampa + Colheres', 'Potes cristal descartáveis herméticos com colherzinhas de sobremesa', 'Lojas Embalagens CEASA', 'Pct 50un potes + 50 colheres', 35.00, 'Rende 50 sobremesas no pote', 'Pendente (Amanhã)'],
    [false, '📦 Embalagens', 'Marmitinhas Térmicas 500ml c/ Tampa', 'Marmitinha térmica descartável para servir o Dog No Prato quentinho', 'Lojas Embalagens CEASA', 'Pct 25 ou 50un', 30.00, 'Rende 25 a 50 dogs no prato', 'Pendente (Amanhã)'],
    [false, '📦 Embalagens', 'Garfo Reforçado Descartável Branco', 'Garfo plástico reforçado linha refeição para o formato No Prato', 'Lojas Embalagens CEASA', 'Pct 50 ou 100un', 12.00, 'Rende 50 a 100 dogs no prato', 'Pendente (Amanhã)'],

    // 🏬 PENDENTES PARA COMPRA: TENDA ATACADO (Amanhã)
    [false, '🌭 Frios & Carnes', 'Salsicha Sadia Oficial Hot Dog', '100% Sadia (firme e sem soltar água). O coração de todos os lanches!', 'TENDA Atacado', 'Pacote 3kg ou 5kg', 65.00, 'Rende ~42 a 70 lanches', 'Pendente (Amanhã)'],
    [false, '🌭 Frios & Carnes', 'Queijo Muçarela Extra (Peça/Fatiada)', 'Muçarela extra para somar ao 1kg do Lancheiro e garantir fartura nos testes', 'TENDA Atacado', '1,5 kg', 52.00, 'Rende ~37 lanches no dobro', 'Pendente (Amanhã)'],
    [false, '🌭 Frios & Carnes', 'Legítimo Catupiry® Original', 'Bisnaga legítima de 1,5kg sem amido para o Cremoso e Tudão', 'TENDA Atacado', '1 bisnaga (1,5kg)', 54.00, 'Rende 37 lanches', 'Pendente (Amanhã)'],
    [false, '🌭 Frios & Carnes', 'Calabresa Defumada Sadia/Perdigão', 'Calabresa para ralar fininha e dourar para o Mordidaço Tudão', 'TENDA Atacado', '1,5 kg', 39.00, 'Rende ~37 Tudões', 'Pendente (Amanhã)'],
    [false, '🌭 Frios & Carnes', 'Peito de Frango Congelado', 'Peito de frango para cozinhar e desfiar temperado bem úmido', 'TENDA Atacado', '2 kg', 36.00, 'Rende ~30 lanches cremosos', 'Pendente (Amanhã)'],
    [false, '🌭 Frios & Carnes', 'Queijo Parmesão (Pedaço/Cunha)', 'Parmesão fresco para ralar na hora na finalização de todos os dogs', 'TENDA Atacado', '500g a 1kg', 42.00, 'Rende ~50 a 100 lanches', 'Pendente (Amanhã)'],
    [false, '🌭 Frios & Carnes', 'Palito Stick Mussarela McCain', 'Stick de mussarela empanado crocante para o Mordidaço Queijudo (VEG)', 'TENDA Atacado', '1 pacote (1kg)', 49.00, 'Rende 17 lanches Queijudo', 'Pendente (Amanhã)'],

    // 🍰 CONFEITARIA & SOBREMESAS DA MONIQUE (TENDA Atacado)
    [false, '🍰 Confeitaria', 'Leite Condensado 395g (Moça/Itambé/Italac)', 'Pack fechado com 12 caixinhas de 395g (zero desperdício e longa validade)', 'TENDA Atacado', 'Pack c/ 12un', 62.00, 'Rende ~30 sobremesas no pote', 'Pendente (Amanhã)'],
    [false, '🍰 Confeitaria', 'Creme de Leite 200g (Itambé/Italac/Piracanjuba)', 'Pack com 12 caixinhas de 200g para ponto aveludado', 'TENDA Atacado', 'Pack c/ 12un', 37.00, 'Rende ~30 sobremesas no pote', 'Pendente (Amanhã)'],
    [false, '🍰 Confeitaria', 'Leite em Pó Ninho Integral Nestlé', 'Leite Ninho oficial para o brigadeiro cremoso de colher', 'TENDA Atacado', '2 latas 380g (ou 1 sachê 800g)', 35.80, 'Rende ~60 escondidinhos', 'Pendente (Amanhã)'],
    [false, '🍰 Confeitaria', 'Nutella Ferrero Legítima Pura', 'Recheio central nobre do Escondidinho de Ninho com Brownie', 'TENDA Atacado', 'Balde 3kg ou 2 potes 650g', 85.00, 'Rende ~30 a 85 potes', 'Pendente (Amanhã)'],
    [false, '🍰 Confeitaria', 'Chocolate Meio Amargo Nobre (Barra 1kg)', 'Harald Melken, Sicao ou Nestlé para a massa densa do Brownie', 'TENDA Atacado', 'Barra 1kg', 42.00, 'Rende ~50 brownies nobres', 'Pendente (Amanhã)'],
    [false, '🍰 Confeitaria', 'Chocolate em Pó 50% Cacau', 'Para cor e sabor marcante do brownie artesanal da Monique', 'TENDA Atacado', 'Pct 500g ou 1kg', 26.00, 'Rende ~40 brownies', 'Pendente (Amanhã)'],
    [false, '🍰 Confeitaria', 'Manteiga Sem Sal', 'Barras de 500g para farofinha da torta, brownie e brigadeiro', 'TENDA Atacado', '2 barras (1kg)', 32.00, 'Rende tortas e brownies', 'Pendente (Amanhã)'],
    [false, '🍰 Confeitaria', 'Biscoito Maisena 400g (Marilan/Triunfo)', 'Biscoito maisena para triturar na farofa amanteigada da tortinha', 'TENDA Atacado', '3 pacotes', 15.60, 'Rende ~40 tortinhas', 'Pendente (Amanhã)'],
    [false, '🍰 Confeitaria', 'Açúcar Refinado & Farinha de Trigo', 'Para a estrutura e casquinha craquelada do brownie artesanal', 'TENDA Atacado', '2kg açúcar + 2kg farinha', 19.00, 'Rende ~8 fornadas', 'Pendente (Amanhã)'],

    // 🥫 MERCEARIA, MOLHOS E BEBIDAS (TENDA Atacado)
    [false, '🥫 Mercearia', 'Batata Palha Tradicional Extra Fina', 'Batata palha crocante pacote profissional grande', 'TENDA Atacado', '2 pacotes (1kg a 1,5kg)', 32.00, 'Rende ~75 lanches', 'Pendente (Amanhã)'],
    [false, '🥫 Mercearia', 'Maionese Hellmann\'s Legítima', 'Balde de 3kg para a base dos lanches e molhos especiais da casa', 'TENDA Atacado', '1 balde (3kg)', 38.00, 'Rende ~100 potes e lanches', 'Pendente (Amanhã)'],
    [false, '🥫 Mercearia', 'Azeitonas Pretas sem Caroço', 'Para a Maionese Temperada de Azeitonas da casa (Overdelivery Secreto)', 'TENDA Atacado', '1 sachê/vidro', 12.00, 'Rende ~50 potes molho', 'Pendente (Amanhã)'],
    [false, '🥫 Mercearia', 'Paçocas Rolha Santa Helena', 'Pote c/ 50 ou 100un para mimos doces de cortesia dos combos', 'TENDA Atacado', '1 pote', 24.00, 'Rende 50 a 100 mimos combos', 'Pendente (Amanhã)'],
    [false, '🥤 Bebidas', 'Coca-Cola 350ml Lata (Original e Zero)', 'Packs com 12 latinhas de cada para o estoque de bebidas', 'TENDA Atacado', '2 packs (24 latas)', 55.20, '24 vendas de bebida', 'Pendente (Amanhã)'],
    [false, '🥤 Bebidas', 'Guaraná Antarctica 350ml Lata (Original e Zero)', 'Packs com 12 latinhas de cada para os combos oficiais', 'TENDA Atacado', '2 packs (24 latas)', 52.80, '24 vendas de bebida', 'Pendente (Amanhã)'],
    [false, '🥤 Bebidas', 'Fanta Laranja Lata & Suco Del Valle Lata', 'Latinhas de Fanta e Sucos de Uva/Maracujá para variedade', 'TENDA Atacado', '12 latas variadas', 28.00, '12 vendas de bebida', 'Pendente (Amanhã)'],
    [false, '🥤 Bebidas', 'Guaraná Antarctica 2L & Coca-Cola 2L (Orig./Zero)', 'Garrafas de 2 Litros para os Combos Família', 'TENDA Atacado', '6 garrafas variadas', 42.00, '6 combos família', 'Pendente (Amanhã)'],
    [false, '🥤 Bebidas', 'Água Mineral 500ml (Com e Sem Gás)', 'Fardos de água mineral gelada para o delivery', 'TENDA Atacado', '2 fardos (24 garrafas)', 27.00, '24 vendas de água', 'Pendente (Amanhã)'],
    [false, '🥤 Bebidas', 'Cerveja Original 350ml Lata & Heineken 330ml', 'Cervejas geladas para o público adulto do final de semana', 'TENDA Atacado', '2 packs (18un total)', 72.00, '18 vendas de cerveja', 'Pendente (Amanhã)']
  ];

  // 1. Cabeçalho Vermelho O Mordidaço
  sheet.getRange(1, 1, 1, 9).setValues(headers)
    .setBackground('#ea1d2c')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontSize(11)
    .setHorizontalAlignment('center');

  // 2. Inserção de Dados
  sheet.getRange(2, 1, dados.length, 9).setValues(dados);

  // 3. Checkboxes Interativos na Coluna A
  sheet.getRange(2, 1, dados.length, 1).insertCheckboxes();

  // 4. Formatação de Moeda na Coluna G (Custo)
  sheet.getRange(2, 7, dados.length, 1).setNumberFormat('R$ #,##0.00');

  // 5. Linhas de Totalizadores no Rodapé (Fórmulas Corrigidas)
  const totalRow = dados.length + 2;
  sheet.getRange(totalRow, 6).setValue('TOTAL GERAL (INVESTIMENTO GLOBAL):').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange(totalRow, 7).setFormula(`=SUM(G2:G${dados.length + 1})`).setFontWeight('bold').setNumberFormat('R$ #,##0.00').setBackground('#fef08a');

  const compradoRow = dados.length + 3;
  sheet.getRange(compradoRow, 6).setValue('TOTAL JÁ COMPRADO (BAMBINI + LANCHEIRO):').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange(compradoRow, 7).setFormula(`=SUMIF(A2:A${dados.length + 1}; true; G2:G${dados.length + 1})`).setFontWeight('bold').setNumberFormat('R$ #,##0.00').setBackground('#bbf7d0');

  const pendenteRow = dados.length + 4;
  sheet.getRange(pendenteRow, 6).setValue('TOTAL ESTIMADO P/ COMPRA DE AMANHÃ:').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange(pendenteRow, 7).setFormula(`=SUMIF(A2:A${dados.length + 1}; false; G2:G${dados.length + 1})`).setFontWeight('bold').setNumberFormat('R$ #,##0.00').setBackground('#fed7aa');

  // 6. Alinhamentos e Cores de Linha
  sheet.getRange(2, 1, dados.length, 1).setHorizontalAlignment('center');
  sheet.getRange(2, 2, dados.length, 1).setHorizontalAlignment('left');
  sheet.getRange(2, 5, dados.length, 1).setHorizontalAlignment('center');
  sheet.getRange(2, 6, dados.length, 1).setHorizontalAlignment('center');
  sheet.getRange(2, 8, dados.length, 1).setHorizontalAlignment('center');
  sheet.getRange(2, 9, dados.length, 1).setHorizontalAlignment('center');

  // Destaque de cor nas linhas de compras realizadas
  for (let r = 0; r < dados.length; r++) {
    const rowNum = r + 2;
    const isComprado = dados[r][0] === true;
    const fornecedor = dados[r][4];

    if (isComprado && (fornecedor.includes('Bambini') || fornecedor.includes('Lancheiro'))) {
      sheet.getRange(rowNum, 1, 1, 9).setBackground('#f0fdf4');
    } else if (fornecedor.includes('CEASA')) {
      sheet.getRange(rowNum, 1, 1, 9).setBackground('#fffbeb');
    } else if (fornecedor.includes('TENDA')) {
      sheet.getRange(rowNum, 1, 1, 9).setBackground('#f8fafc');
    }
  }

  // 7. Larguras das Colunas
  sheet.setColumnWidth(1, 60);  // Check
  sheet.setColumnWidth(2, 140); // Categoria
  sheet.setColumnWidth(3, 260); // Item
  sheet.setColumnWidth(4, 380); // Descrição
  sheet.setColumnWidth(5, 190); // Fornecedor
  sheet.setColumnWidth(6, 120); // Qtd
  sheet.setColumnWidth(7, 120); // Custo
  sheet.setColumnWidth(8, 200); // Rendimento
  sheet.setColumnWidth(9, 140); // Status

  sheet.setFrozenRows(1);
}
