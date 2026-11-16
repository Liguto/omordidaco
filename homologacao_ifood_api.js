/**
 * Módulo de Homologação Manual do iFood (Sandbox)
 * Suporte aos Checklists de Vídeo dos Módulos Merchant e Catalog
 */

const express = require('express');
const router = express.Router();

const SANDBOX_CONFIG = {
  clientId: 'd543f817-4252-46e3-919b-9280bbb4ed8f',
  clientSecret: 'n912lea0o0sa1zx108s6t0xhxco90p6t97ohlrt7kpkw8fvc9qmpitzkqjuxa4opdqga0s58zbo0av1r2za464lkxu787hsogma',
  merchantId: '1c6a85ea-2063-4bb9-a2ab-a198c2d9946b',
  catalogId: '3dab72cd-7f8d-4bc6-9131-f5d0ad9779e9'
};

let tokenSandboxCache = null;
let tokenSandboxExpira = 0;

async function obterTokenSandbox() {
  const agora = Date.now();
  if (tokenSandboxCache && tokenSandboxExpira > agora + 60000) {
    return tokenSandboxCache;
  }

  const params = new URLSearchParams();
  params.append('grantType', 'client_credentials');
  params.append('clientId', SANDBOX_CONFIG.clientId);
  params.append('clientSecret', SANDBOX_CONFIG.clientSecret);

  const res = await fetch('https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Falha na autenticação do Sandbox iFood (${res.status}): ${errText}`);
  }

  const data = await res.json();
  tokenSandboxCache = data.accessToken;
  tokenSandboxExpira = agora + ((data.expiresIn || 3600) * 1000);
  return tokenSandboxCache;
}

// ----------------------------------------------------
// 1. MERCHANT: Cenário 1 - Informações e Disponibilidade
// ----------------------------------------------------
router.get('/loja', async (req, res) => {
  try {
    const token = await obterTokenSandbox();

    // Lista lojas
    const resLojas = await fetch('https://merchant-api.ifood.com.br/merchant/v1.0/merchants', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const lojas = await resLojas.json();

    // Detalhes da loja
    const resDetalhe = await fetch(`https://merchant-api.ifood.com.br/merchant/v1.0/merchants/${SANDBOX_CONFIG.merchantId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const detalhe = await resDetalhe.json();

    // Status / Disponibilidade
    const resStatus = await fetch(`https://merchant-api.ifood.com.br/merchant/v1.0/merchants/${SANDBOX_CONFIG.merchantId}/status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const status = await resStatus.json();

    res.json({
      success: true,
      config: {
        clientId: SANDBOX_CONFIG.clientId,
        merchantId: SANDBOX_CONFIG.merchantId
      },
      lojas,
      detalhe,
      status
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// 2. MERCHANT: Cenário 2 - Interrupções e Pausas
// ----------------------------------------------------
router.get('/pausas', async (req, res) => {
  try {
    const token = await obterTokenSandbox();
    const resPausas = await fetch(`https://merchant-api.ifood.com.br/merchant/v1.0/merchants/${SANDBOX_CONFIG.merchantId}/interruptions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const pausas = await resPausas.json();
    res.json({ success: true, pausas });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/pausas', async (req, res) => {
  try {
    const token = await obterTokenSandbox();
    const { description = 'Pausa para reabastecimento de insumos', durationMinutes = 60 } = req.body || {};

    const agora = new Date();
    const start = new Date(agora.getTime() + 10000).toISOString();
    const end = new Date(agora.getTime() + (Number(durationMinutes) * 60000)).toISOString();

    const resCriar = await fetch(`https://merchant-api.ifood.com.br/merchant/v1.0/merchants/${SANDBOX_CONFIG.merchantId}/interruptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ description, start, end })
    });

    const data = await resCriar.json();
    res.status(resCriar.status).json({ success: resCriar.ok, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/pausas/:id', async (req, res) => {
  try {
    const token = await obterTokenSandbox();
    const interruptionId = req.params.id;

    const resDel = await fetch(`https://merchant-api.ifood.com.br/merchant/v1.0/merchants/${SANDBOX_CONFIG.merchantId}/interruptions/${interruptionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    res.json({ success: resDel.ok, status: resDel.status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// 3. MERCHANT: Cenário 3 - Horários de Funcionamento
// ----------------------------------------------------
router.get('/horarios', async (req, res) => {
  try {
    const token = await obterTokenSandbox();
    const resHorarios = await fetch(`https://merchant-api.ifood.com.br/merchant/v1.0/merchants/${SANDBOX_CONFIG.merchantId}/opening-hours`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await resHorarios.json();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/horarios', async (req, res) => {
  try {
    const token = await obterTokenSandbox();
    const { shifts } = req.body || {};

    const shiftsConfig = (Array.isArray(shifts) && shifts.length > 0) ? shifts : [
      { dayOfWeek: 'SATURDAY', start: '10:00:00', duration: 540 },
      { dayOfWeek: 'SUNDAY', start: '09:00:00', duration: 180 },
      { dayOfWeek: 'SUNDAY', start: '13:00:00', duration: 180 },
      { dayOfWeek: 'SUNDAY', start: '17:00:00', duration: 360 }
    ];

    const resPut = await fetch(`https://merchant-api.ifood.com.br/merchant/v1.0/merchants/${SANDBOX_CONFIG.merchantId}/opening-hours`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        storeId: SANDBOX_CONFIG.merchantId,
        shifts: shiftsConfig
      })
    });

    const data = await resPut.json();
    res.status(resPut.status).json({ success: resPut.ok, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// 4. CATALOG: Cenário 1 - Criar Categoria e Item
// ----------------------------------------------------
router.post('/categoria', async (req, res) => {
  try {
    const token = await obterTokenSandbox();
    const { name = 'Teste Homologação' } = req.body || {};

    const resCat = await fetch(`https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${SANDBOX_CONFIG.merchantId}/catalogs/${SANDBOX_CONFIG.catalogId}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name,
        status: 'AVAILABLE',
        template: 'DEFAULT',
        sequence: 1
      })
    });

    const data = await resCat.json();
    res.status(resCat.status).json({ success: resCat.ok, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/item', async (req, res) => {
  try {
    const token = await obterTokenSandbox();
    const {
      name = 'Produto Teste',
      description = 'Item criado para validação do checklist de homologação iFood',
      price = 25.00,
      categoryId
    } = req.body || {};

    // 1. Cria produto
    const resProd = await fetch(`https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${SANDBOX_CONFIG.merchantId}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name,
        description,
        serving: 'SERVES_1',
        shifts: []
      })
    });
    const prodData = await resProd.json();

    // 2. Vincula item à categoria
    const targetCatId = categoryId || 'b35afb8c-b736-41a7-b351-a741b30afce8';
    const resItem = await fetch(`https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${SANDBOX_CONFIG.merchantId}/items`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        item: {
          productId: prodData.id,
          categoryId: targetCatId,
          status: 'AVAILABLE',
          price: { value: Number(price) }
        }
      })
    });

    const itemData = await resItem.json();
    res.status(resItem.status).json({
      success: resItem.ok,
      productId: prodData.id,
      item: itemData.item,
      fullResponse: itemData
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// 5. CATALOG: Cenário 2 - Grupo de Complementos
// ----------------------------------------------------
router.post('/grupo-complementos', async (req, res) => {
  try {
    const token = await obterTokenSandbox();
    const {
      name = 'Adicionais Teste Homologação',
      min = 0,
      max = 2
    } = req.body || {};

    // 1. Busca dinamicamente a categoria de teste ativa
    const resCats = await fetch(`https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${SANDBOX_CONFIG.merchantId}/catalogs/${SANDBOX_CONFIG.catalogId}/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const cats = await resCats.json();
    const cat = (Array.isArray(cats) && cats.find(c => c.name.includes('Teste'))) || (Array.isArray(cats) && cats[0]) || { id: 'fd4f4c44-33a4-40a6-889a-cd602b468da4', name: 'Teste Homologação' };

    // 2. Busca o item Produto Teste dentro da categoria
    const resCat = await fetch(`https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${SANDBOX_CONFIG.merchantId}/catalogs/${SANDBOX_CONFIG.catalogId}/categories/${cat.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const catData = await resCat.json();
    let item = catData.items && catData.items.find(i => i.name.includes('Teste')) || (catData.items && catData.items[0]);

    // Se não tiver item cadastrado, cria o Produto Teste na hora
    if (!item) {
      const resNewProd = await fetch(`https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${SANDBOX_CONFIG.merchantId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: 'Produto Teste', description: 'Item criado para validação do checklist de homologação ifood', serving: 'SERVES_1' })
      });
      const newProd = await resNewProd.json();
      const resNewItem = await fetch(`https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${SANDBOX_CONFIG.merchantId}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          item: { productId: newProd.id, categoryId: cat.id, status: 'AVAILABLE', price: { value: 25.00 } }
        })
      });
      const newItemData = await resNewItem.json();
      item = newItemData.item;
    }

    const ts = Date.now();

    // 3. Cria 2 produtos com foto e externalCode único
    const p1Res = await fetch(`https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${SANDBOX_CONFIG.merchantId}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: 'Bacon Extra Teste',
        externalCode: 'BACON_' + ts,
        serving: 'NOT_APPLICABLE',
        imagePath: 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=500'
      })
    });
    const p1 = await p1Res.json();

    const p2Res = await fetch(`https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${SANDBOX_CONFIG.merchantId}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: 'Queijo Extra Teste',
        externalCode: 'QUEIJO_' + ts,
        serving: 'NOT_APPLICABLE',
        imagePath: 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?w=500'
      })
    });
    const p2 = await p2Res.json();

    // 4. Cria OptionGroup
    const grpRes = await fetch(`https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${SANDBOX_CONFIG.merchantId}/optionGroups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, min: Number(min), max: Number(max), status: 'AVAILABLE' })
    });
    const grp = await grpRes.json();

    // 5. Cria as Opções no OptionGroup
    const opt1Res = await fetch(`https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${SANDBOX_CONFIG.merchantId}/optionGroups/${grp.id}/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId: p1.id, status: 'AVAILABLE', price: { value: 5.00 } })
    });
    const opt1 = await opt1Res.json();

    const opt2Res = await fetch(`https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${SANDBOX_CONFIG.merchantId}/optionGroups/${grp.id}/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId: p2.id, status: 'AVAILABLE', price: { value: 4.00 } })
    });
    const opt2 = await opt2Res.json();

    // 6. Executa PUT /items para persistir o vínculo atômico dentro do Produto Teste
    const payload = {
      item: {
        id: item.id,
        productId: item.productId,
        categoryId: cat.id,
        status: 'AVAILABLE',
        price: { value: 25.00 }
      },
      products: [
        {
          id: item.productId,
          name: item.name || 'Produto Teste',
          description: 'Item criado para validação do checklist de homologação ifood',
          serving: 'SERVES_1',
          optionGroups: [
            {
              id: grp.id,
              min: Number(min),
              max: Number(max)
            }
          ]
        },
        { id: p1.id, name: 'Bacon Extra Teste', serving: 'NOT_APPLICABLE', imagePath: 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=500' },
        { id: p2.id, name: 'Queijo Extra Teste', serving: 'NOT_APPLICABLE', imagePath: 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?w=500' }
      ],
      optionGroups: [
        {
          id: grp.id,
          name: name,
          status: 'AVAILABLE',
          min: Number(min),
          max: Number(max),
          optionIds: [opt1.id, opt2.id]
        }
      ],
      options: [
        {
          id: opt1.id,
          optionGroupId: grp.id,
          productId: p1.id,
          status: 'AVAILABLE',
          price: { value: 5.00 }
        },
        {
          id: opt2.id,
          optionGroupId: grp.id,
          productId: p2.id,
          status: 'AVAILABLE',
          price: { value: 4.00 }
        }
      ]
    };

    const resPut = await fetch(`https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${SANDBOX_CONFIG.merchantId}/items`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });

    if (!resPut.ok) {
      const errText = await resPut.text();
      return res.status(resPut.status).json({ success: false, error: errText });
    }

    const putData = await resPut.json();

    res.status(200).json({
      success: true,
      message: 'Grupo de complementos e 2 complementos vinculados ao Produto Teste com sucesso!',
      group: { id: grp.id, name },
      targetItem: { id: item.id, name: item.name },
      complementos: [
        { nome: 'Bacon Extra Teste', preco: 5.00, optionId: opt1.id, foto: 'Anexada ✅', status: 'AVAILABLE' },
        { nome: 'Queijo Extra Teste', preco: 4.00, optionId: opt2.id, foto: 'Anexada ✅', status: 'AVAILABLE' }
      ],
      ifoodResponse: putData
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Helper para localizar Item e Opção de Teste Ativos
// ----------------------------------------------------
async function obterItemEOpcaoTeste(token) {
  try {
    const resCats = await fetch(`https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${SANDBOX_CONFIG.merchantId}/catalogs/${SANDBOX_CONFIG.catalogId}/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const cats = await resCats.json();
    const cat = (Array.isArray(cats) && cats.find(c => c.name.includes('Teste'))) || (Array.isArray(cats) && cats[0]);
    if (!cat) return { itemId: null, optionId: null };

    const resCat = await fetch(`https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${SANDBOX_CONFIG.merchantId}/catalogs/${SANDBOX_CONFIG.catalogId}/categories/${cat.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const catData = await resCat.json();
    const item = (catData.items && catData.items.find(i => i.name.includes('Teste'))) || (catData.items && catData.items[0]);
    const option = item && item.optionGroups && item.optionGroups[0] && item.optionGroups[0].options && item.optionGroups[0].options[0];
    return {
      categoryId: cat ? cat.id : null,
      categoryName: cat ? cat.name : null,
      itemId: item ? item.id : null,
      itemName: item ? item.name : null,
      itemPrice: item && item.price ? item.price.value : 25.00,
      itemStatus: item ? item.status : 'AVAILABLE',
      optionId: option ? option.id : null,
      optionName: option ? option.name : null,
      optionPrice: option && option.price ? option.price.value : 5.00,
      optionStatus: option ? option.status : 'AVAILABLE'
    };
  } catch (e) {
    return { itemId: null, optionId: null };
  }
}

// Endpoint para o frontend consultar dados em tempo real do item de teste
router.get('/dados-teste', async (req, res) => {
  try {
    const token = await obterTokenSandbox();
    const dados = await obterItemEOpcaoTeste(token);
    res.json({ success: true, data: dados });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// 6. CATALOG: Cenário 3 - Alterações via PATCH (Obrigatório)
// ----------------------------------------------------
router.patch('/item/preco', async (req, res) => {
  try {
    const token = await obterTokenSandbox();
    let { itemId, price = 28.00 } = req.body || {};

    if (!itemId || itemId === 'cf0edf6f-b044-4032-b447-fe64ce5226a7') {
      const info = await obterItemEOpcaoTeste(token);
      if (info.itemId) itemId = info.itemId;
    }

    const resPatch = await fetch(`https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${SANDBOX_CONFIG.merchantId}/items/price`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        itemId,
        price: { value: Number(price) }
      })
    });

    const isOk = resPatch.ok;
    const data = isOk ? { message: `Preço atualizado para R$ ${Number(price).toFixed(2)} com sucesso via PATCH!`, itemId } : await resPatch.json();
    res.status(resPatch.status).json({ success: isOk, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/item/status', async (req, res) => {
  try {
    const token = await obterTokenSandbox();
    let { itemId, status = 'UNAVAILABLE' } = req.body || {};

    if (!itemId || itemId === 'cf0edf6f-b044-4032-b447-fe64ce5226a7') {
      const info = await obterItemEOpcaoTeste(token);
      if (info.itemId) itemId = info.itemId;
    }

    const resPatch = await fetch(`https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${SANDBOX_CONFIG.merchantId}/items/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        itemId,
        status: status.toUpperCase() === 'PAUSED' ? 'UNAVAILABLE' : status.toUpperCase()
      })
    });

    const isOk = resPatch.ok;
    const data = isOk ? { message: `Status alterado para ${status} com sucesso via PATCH!`, itemId } : await resPatch.json();
    res.status(resPatch.status).json({ success: isOk, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/opcao/preco', async (req, res) => {
  try {
    const token = await obterTokenSandbox();
    let { optionId, price = 6.00 } = req.body || {};

    if (!optionId || optionId === '2f4fc898-ff08-4a63-84a7-87432436ea8c' || optionId === '95162207-5d6a-444c-aa39-9c55058dd469') {
      const info = await obterItemEOpcaoTeste(token);
      if (info.optionId) optionId = info.optionId;
    }

    const resPatch = await fetch(`https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${SANDBOX_CONFIG.merchantId}/options/price`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        optionId,
        price: { value: Number(price) }
      })
    });

    const isOk = resPatch.ok;
    const data = isOk ? { message: `Preço do complemento atualizado para R$ ${Number(price).toFixed(2)} com sucesso via PATCH!`, optionId } : await resPatch.json();
    res.status(resPatch.status).json({ success: isOk, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/opcao/status', async (req, res) => {
  try {
    const token = await obterTokenSandbox();
    let { optionId, status = 'UNAVAILABLE' } = req.body || {};

    if (!optionId || optionId === '2f4fc898-ff08-4a63-84a7-87432436ea8c' || optionId === '95162207-5d6a-444c-aa39-9c55058dd469') {
      const info = await obterItemEOpcaoTeste(token);
      if (info.optionId) optionId = info.optionId;
    }

    const resPatch = await fetch(`https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${SANDBOX_CONFIG.merchantId}/options/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        optionId,
        status: status.toUpperCase() === 'PAUSED' ? 'UNAVAILABLE' : status.toUpperCase()
      })
    });

    const isOk = resPatch.ok;
    const data = isOk ? { message: `Status do complemento alterado para ${status} com sucesso via PATCH!`, optionId } : await resPatch.json();
    res.status(resPatch.status).json({ success: isOk, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
