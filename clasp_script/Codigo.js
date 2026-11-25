/**
 * Automação de Preenchimento da Lista de Compras e Ações - O Mordidaço
 * Vinculado à Planilha: Lista de Compras - O Mordidaço
 * 100% Sincronizado com o Portal Business, CEASA, TENDA Atacado, Bambini e Loja do Lancheiro
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🌭 O Mordidaço')
    .addItem('🚀 Atualizar Planilha c/ Compras Realizadas', 'preencherListaDeCompras')
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
    [true, '🥖 Pães Artesanais', 'Pão de Hot Dog 70g (18cm)', '3 caixas c/ 30un a R$ 47,40/cx (Cód 13.377) - Entregue 25/11 motorista Francisco', 'Panificadora Bambini', '90 un (3 cx)', 142.20, 'Rende 90 lanches no pão', 'Comprado ✅'],

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

    // 🥬 COMPRADOS HOJE NO CEASA CAMPINAS (25/11/2026 - Total R$ 491,00 à vista)
    [true, '🥬 Hortifrúti', 'Batata Especial p/ Purê de Ouro', 'Saco fechado com 25kg de batata especial para purê da casa a R$ 4,80/kg', 'Rossi Hortifruti (CEASA)', '25 kg (saco)', 120.00, 'Rende ~200 a 250 lanches purê', 'Comprado ✅'],
    [true, '🥬 Hortifrúti', 'Ovos Selecionados p/ Brownie Monique', 'Bandeja com 30 ovos selecionados a R$ 0,833/un para brownie denso', 'Vera Ovos (CEASA)', '30 un (2,5 dz)', 25.00, 'Rende ~7 fornadas de brownie', 'Comprado ✅'],
    [true, '📦 Embalagens', 'Pote Molho 30ml Preto G695 c/ Tampa', 'Caixa fechada com 700 conjuntos a R$ 0,1557/un para overdelivery secreto', 'M.A. Embalagens (CEASA)', '700 un (caixa)', 109.00, 'Rende 350 kits overdelivery', 'Comprado ✅'],
    [true, '📦 Embalagens', 'Pote Pet Articulado PF-642A 250ml', 'Caixa com 300 conjuntos articulados a R$ 0,20/un para sobremesas no pote', 'M.A. Embalagens (CEASA)', '300 un (caixa)', 60.00, 'Rende 300 sobremesas no pote', 'Comprado ✅'],
    [true, '📦 Embalagens', 'Marmita Fit Retangular PP 750ml c/ Tampa', 'Pacote c/ 24 marmitinhas térmicas para o formato Dog No Prato a R$ 1,33/un', 'M.A. Embalagens (CEASA)', '24 un (pct)', 32.00, 'Rende 24 dogs no prato quentes', 'Comprado ✅'],
    [true, '📦 Embalagens', 'Colher Sobremesa Ice Branca', 'Pacote c/ 50 colheres sobremesa reforçadas a R$ 0,08/un', 'M.A. Embalagens (CEASA)', '50 un (pct)', 4.00, 'Rende 50 sobremesas', 'Comprado ✅'],
    [true, '📦 Embalagens', 'Garfo Refeição Master Branco', 'Pacote c/ 50 garfos refeição resistentes a R$ 0,20/un para Dog No Prato', 'M.A. Embalagens (CEASA)', '50 un (pct)', 10.00, 'Rende 50 dogs no prato', 'Comprado ✅'],
    [true, '📦 Embalagens', 'Faca Refeição Master Branca', 'Pacote c/ 50 facas refeição a R$ 0,20/un para corte e apoio da cozinha', 'M.A. Embalagens (CEASA)', '50 un (pct)', 10.00, 'Apoio e corte operacional', 'Comprado ✅'],
    [true, '🧼 Higiene & Limpeza', 'Álcool 70% Líquido Hospitalar 5L', 'Galão de 5 Litros para assepsia total de bancadas e utensílios sanitários', 'M.A. Embalagens (CEASA)', '1 galão (5L)', 38.00, 'Higienização RDC 216', 'Comprado ✅'],
    [true, '📦 Embalagens', 'Sacola Lisa Leitosa 30x40', 'Pacote de sacolas leitosas reforçadas para entregas diretas e balcão', 'M.A. Embalagens (CEASA)', '1 pacote', 30.00, 'Entregas e balcão', 'Comprado ✅'],
    [true, '🧼 Higiene & Limpeza', 'Pano Multiuso Perfex Rolo', 'Rolo de pano multiuso descartável para higienização ágil da bancada', 'M.A. Embalagens (CEASA)', '1 rolo', 17.00, 'Higienização contínua', 'Comprado ✅'],
    [true, '🧼 Higiene & Limpeza', 'Sacos de Lixo 60L + 100L Reforçados', '1kg saco lixo 60L (R$ 13) + 1kg saco lixo 100L (R$ 13)', 'M.A. Embalagens (CEASA)', '2 kg (2 pct)', 26.00, 'Descarte sanitário', 'Comprado ✅'],
    [true, '🧼 Higiene & Limpeza', 'Pulverizador Spray 500ml', 'Pulverizador para borrifar álcool 70% na linha de montagem e balcão', 'M.A. Embalagens (CEASA)', '1 un', 10.00, 'Higienização spray', 'Comprado ✅'],

    // 🏬 COMPRADOS HOJE NO TENDA ATACADO CEASA CAMPINAS (25/11/2026 - Total R$ 1.500,14 à vista)
    [true, '🍰 Confeitaria', 'Leite Condensado Semidesnatado Italac TP 395g', 'Caixa Fechada com 27 caixinhas a R$ 5,99 cada! Economia brutal de atacado', 'TENDA Atacado', '27 un (caixa)', 161.73, 'Rende ~67 sobremesas no pote', 'Comprado ✅'],
    [true, '🍰 Confeitaria', 'Creme de Leite Piracanjuba TP 200g', 'Caixa Fechada com 27 caixinhas a R$ 3,59 cada! Textura aveludada doces', 'TENDA Atacado', '27 un (caixa)', 96.93, 'Rende ~67 sobremesas no pote', 'Comprado ✅'],
    [true, '🍰 Confeitaria', 'Nutella Ferrero Legítima Pura 700g', '2 potes de 700g (1,4kg total a R$ 44,89/pote) para o Escondidinho de Nutella', 'TENDA Atacado', '2 un (1,4 kg)', 89.78, 'Rende ~40 escondidinhos', 'Comprado ✅'],
    [true, '🥤 Bebidas', 'Coca-Cola 2,5 Litros (3 Orig. + 6 Zero)', '3 garrafas 2,5L Orig. (R$ 37,50) + 6 garrafas 2,5L Zero (R$ 68,94)', 'TENDA Atacado', '9 garrafas 2,5L', 106.44, '9 combos família/upgrades', 'Comprado ✅'],
    [true, '🥤 Bebidas', 'Cerveja Original 350ml Lata + Heineken LN 330ml', 'Caixa c/ 12 latas Original (R$ 57,48) + 6 Long Necks Heineken (R$ 41,94)', 'TENDA Atacado', '18 un (geladas)', 99.42, '18 vendas de cervejas', 'Comprado ✅'],
    [true, '🥤 Bebidas', 'Guaraná Antarctica 1,5L (6 Normal + 6 Diet)', '12 garrafas de 1,5L a R$ 7,19 cada para os combos família da casa', 'TENDA Atacado', '12 garrafas 1,5L', 86.28, '12 combos família', 'Comprado ✅'],
    [true, '🥤 Bebidas', 'Coca-Cola 350ml Lata (12 Orig. + 12 Zero)', '12 latas Coca normal (R$ 35,92) + 12 latas Coca Zero (R$ 35,92) a R$ 2,99/un', 'TENDA Atacado', '24 latas 350ml', 71.84, '24 vendas refrigerante lata', 'Comprado ✅'],
    [true, '🍰 Confeitaria', 'Chocolate em Pó Cacau Foods 55% Cacau 1,005kg', 'Pacote 1,005kg Cacau Foods 55% a R$ 58,60/kg para cor intensa do brownie', 'TENDA Atacado', '1 pct (1,005 kg)', 58.90, 'Rende ~40 fornadas densas', 'Comprado ✅'],
    [true, '🌭 Frios & Carnes', 'Legítimo Catupiry® Original Bisnaga 1,5kg', 'Bisnaga 1,5kg de Catupiry legítimo sem amido para o Cremoso e Tudão', 'TENDA Atacado', '1 un (1,5 kg)', 58.79, 'Rende 37 lanches legítimos', 'Comprado ✅'],
    [true, '🍰 Confeitaria', 'Leite em Pó Ninho Instantâneo Nestlé 975g', 'Sachê gigante institucional de 975g Leite Ninho para brigadeiro cremoso', 'TENDA Atacado', '1 sachê (975g)', 54.90, 'Rende ~75 potes Ninho puro', 'Comprado ✅'],
    [true, '🥤 Bebidas', 'Néctar Del Valle 290ml Lata (Goiaba & Limon)', '6 latas Del Valle Goiaba (R$ 23,94) + 6 latas Limon Tropical (R$ 23,94)', 'TENDA Atacado', '12 latas 290ml', 47.88, '12 vendas suco em lata', 'Comprado ✅'],
    [true, '🌭 Frios & Carnes', 'Filé Peito Frango Cong Seara IQF 1kg (2 pct)', '2 pacotes de 1kg (2kg total a R$ 22,50/kg) para desfiar suculento da casa', 'TENDA Atacado', '2 kg (2 pct)', 45.00, 'Rende ~40 lanches cremosos', 'Comprado ✅'],
    [true, '🌭 Frios & Carnes', 'Queijo Parmesão Scala Cilindro 180g (2 un)', '2 cilindros 180g (360g total a R$ 22,39/un) para ralar fresco na hora', 'TENDA Atacado', '2 un (360g)', 44.78, 'Rende ~36 chuvas de queijo', 'Comprado ✅'],
    [true, '🍰 Confeitaria', 'Cobertura Chocolate Mavalerio Barra 1,01kg', 'Barra 1,01kg nobre meio amargo para a massa aveludada do brownie', 'TENDA Atacado', '1 barra (1,01 kg)', 40.90, 'Rende ~50 brownies nobres', 'Comprado ✅'],
    [true, '🥫 Mercearia', 'Maionese Hellmann\'s Sachê 1kg (2 pct)', '2 sachês de 1kg (2kg total a R$ 19,90/kg) para base e molhos artesanais', 'TENDA Atacado', '2 kg (2 pct)', 39.80, 'Rende ~75 potes e lanches', 'Comprado ✅'],
    [true, '🥤 Bebidas', 'Água Mineral Cristal Gold 510ml (24 un)', '12 s/ gás Cristal Gold a R$ 0,99/un (R$ 11,88) + 12 c/ gás a R$ 2,19/un (R$ 26,28)', 'TENDA Atacado', '24 garrafas', 38.16, '24 vendas de água gelada', 'Comprado ✅'],
    [true, '🌭 Frios & Carnes', 'Salsicha Hot Dog Sadia Pacote kg', 'Pacote profissional de salsicha Sadia (firme e sem soltar água)', 'TENDA Atacado', '1 pct (~60 un)', 29.97, 'Rende ~40 a 50 lanches', 'Comprado ✅'],
    [true, '🥫 Mercearia', 'Batata Palha Select Extra Crocante 400g (2 pct)', '2 pacotes de 400g (800g a R$ 14,90/un) sequinha e extra crocante', 'TENDA Atacado', '2 pct (800g)', 29.80, 'Rende 40 lanches nobres', 'Comprado ✅'],
    [true, '🥫 Mercearia', 'Ketchup Cepera Tradicional Bombona 3,5kg', 'Bombona profissional de 3,5kg para recheio dos dogs artesanais', 'TENDA Atacado', '1 un (3,5 kg)', 28.90, 'Rende ~100 lanches', 'Comprado ✅'],
    [true, '🌭 Frios & Carnes', 'Linguiça Calabresa Defumada Sadia 0,952kg', 'Calabresa defumada Sadia para ralar fininha e dourar no Tudão', 'TENDA Atacado', '0,952 kg', 27.51, 'Rende 24 Tudões especiais', 'Comprado ✅'],
    [true, '🥫 Mercearia', 'Azeitona Preta Azapa Select Vidro 300g', 'Vidro de azeitona preta Azapa pura para Maionese de Azeitonas da Casa', 'TENDA Atacado', '1 vidro (300g)', 22.90, 'Rende ~50 potinhos molho', 'Comprado ✅'],
    [true, '🧼 Higiene & Limpeza', 'Kit Limpeza (Lava Roupa Ypê + Sanol + Veja)', 'Ypê 900ml (R$ 10,99) + Sanol 2L (R$ 5,99) + Multiuso Veja 500ml (R$ 4,19)', 'TENDA Atacado', '3 unidades', 21.17, 'Higienização operacional', 'Comprado ✅'],
    [true, '🌭 Frios & Carnes', 'Empanitos Stick Lar 1,5kg (Queijudo VEG)', 'Pacote de 1,5kg stick empanado super crocante para o Mordidaço Queijudo', 'TENDA Atacado', '1 pct (1,5 kg)', 20.99, 'Rende 15 lanches Queijudo VEG', 'Comprado ✅'],
    [true, '🍰 Confeitaria', 'Margarina Doriana c/ Sal 1kg', 'Pote de 1kg culinária para farofinha da torta, brownie e purê de ouro', 'TENDA Atacado', '1 un (1,0 kg)', 14.90, 'Tortas, brownies e purê', 'Comprado ✅'],
    [true, '🍰 Confeitaria', 'Biscoito Maisena Marilan 300g (2 pct)', '2 pacotes de 300g (600g a R$ 6,49/un) para farofa crocante amanteigada', 'TENDA Atacado', '2 pct (600g)', 12.98, 'Rende ~25 tortinhas limão', 'Comprado ✅'],
    [true, '🥫 Mercearia', 'Maionese Hellmann\'s Ervas Verdes Frasco 335g', 'Frasco 335g toque aromático para a Maionese de Ervas Frescas (Overdelivery)', 'TENDA Atacado', '1 frasco (335g)', 11.90, 'Rende ~30 potinhos ervas', 'Comprado ✅'],
    [true, '🍰 Confeitaria', 'Leite Desnatado Italac Zero Lactose 1L (2 un)', '2 litros de leite desnatado zero lactose para preparos culinários', 'TENDA Atacado', '2 litros', 11.58, 'Preparo de cremes', 'Comprado ✅'],
    [true, '🥫 Mercearia', 'Mostarda Cepera Tradicional Frasco 1,01kg', 'Frasco de 1,01kg mostarda tradicional suave da casa', 'TENDA Atacado', '1 frasco (1,01 kg)', 10.59, 'Rende ~100 lanches', 'Comprado ✅'],
    [true, '🍰 Confeitaria', 'Farinha de Trigo Especial Nita 1kg (2 pct)', '2 pacotes de 1kg (2kg total a R$ 4,59/kg) para estrutura do brownie', 'TENDA Atacado', '2 kg (2 pct)', 9.18, 'Rende ~8 fornadas brownie', 'Comprado ✅'],
    [true, '🥫 Mercearia', 'Molho de Tomate Quero Sachê 240g (4 pct)', '4 sachês de 240g (960g total a R$ 2,04/un) para o molho fervilhante', 'TENDA Atacado', '4 pct (960g)', 8.16, 'Rende ~32 lanches molho', 'Comprado ✅'],
    [true, '🥫 Mercearia', 'Sal Refinado Cisne 1kg + Vinagre Castelo 750ml', 'Sal Cisne (R$ 4,29) + Vinagre Álcool Castelo (R$ 4,59)', 'TENDA Atacado', '1kg Sal + 750ml Vin.', 8.88, 'Vinagrete fresco e purê', 'Comprado ✅'],
    [true, '🍰 Confeitaria', 'Açúcar Refinado Da Barra 1kg (2 pct)', '2 pacotes de 1kg (2kg total a R$ 3,49/kg) para casquinha do brownie', 'TENDA Atacado', '2 kg (2 pct)', 6.98, 'Rende ~8 fornadas brownie', 'Comprado ✅']
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

  // 5. Linhas de Totalizadores no Rodapé (Fórmulas Automáticas)
  const totalRow = dados.length + 2;
  sheet.getRange(totalRow, 6).setValue('TOTAL GERAL INVESTIDO (100% CONSOLIDADO):').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange(totalRow, 7).setFormula(`=SUM(G2:G${dados.length + 1})`).setFontWeight('bold').setNumberFormat('R$ #,##0.00').setBackground('#bbf7d0');

  const compradoRow = dados.length + 3;
  sheet.getRange(compradoRow, 6).setValue('TOTAL JÁ COMPRADO & FATURADO:').setFontWeight('bold').setHorizontalAlignment('right');
  sheet.getRange(compradoRow, 7).setFormula(`=SUMIF(A2:A${dados.length + 1}; true; G2:G${dados.length + 1})`).setFontWeight('bold').setNumberFormat('R$ #,##0.00').setBackground('#86efac');

  const pendenteRow = dados.length + 4;
  sheet.getRange(pendenteRow, 6).setValue('TOTAL PENDENTE DE COMPRA:').setFontWeight('bold').setHorizontalAlignment('right');
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
    const fornecedor = dados[r][4];

    if (fornecedor.includes('Bambini') || fornecedor.includes('Lancheiro')) {
      sheet.getRange(rowNum, 1, 1, 9).setBackground('#f0fdf4');
    } else if (fornecedor.includes('CEASA')) {
      sheet.getRange(rowNum, 1, 1, 9).setBackground('#ecfdf5');
    } else if (fornecedor.includes('TENDA')) {
      sheet.getRange(rowNum, 1, 1, 9).setBackground('#f8fafc');
    } else {
      sheet.getRange(rowNum, 1, 1, 9).setBackground('#fffbeb');
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
