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

    const catId = 'b35afb8c-b736-41a7-b351-a741b30afce8';
    const prodId = 'd78d7f56-5f42-48d2-a04c-1742a0a04720';
    const itemId = 'cf0edf6f-b044-4032-b447-fe64ce5226a7';
    const grpId = '9fe260d6-a6d0-4385-9dec-ba423b5f9bfb';
    const opt1Id = 'cb068786-9e67-401d-a84c-29ad63ea572d';
    const opt2Id = '8e44741a-8ece-4a39-80de-7770e4e15a26';

    // Cria produtos dos complementos
    const resP1 = await fetch(`https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${SANDBOX_CONFIG.merchantId}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'Bacon Extra Teste', serving: 'NOT_APPLICABLE' })
    });
    const p1 = await resP1.json();

    const resP2 = await fetch(`https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${SANDBOX_CONFIG.merchantId}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'Queijo Extra Teste', serving: 'NOT_APPLICABLE' })
    });
    const p2 = await resP2.json();

    const payload = {
      item: {
        id: itemId,
        productId: prodId,
        categoryId: catId,
        status: 'AVAILABLE',
        price: { value: 25.00 }
      },
      products: [
        {
          id: prodId,
          name: 'Produto Teste',
          serving: 'SERVES_1',
          optionGroups: [
            {
              id: grpId,
              min: Number(min),
              max: Number(max)
            }
          ]
        },
        { id: p1.id, name: 'Bacon Extra Teste', serving: 'NOT_APPLICABLE' },
        { id: p2.id, name: 'Queijo Extra Teste', serving: 'NOT_APPLICABLE' }
      ],
      optionGroups: [
        {
          id: grpId,
          name: name,
          status: 'AVAILABLE',
          min: Number(min),
          max: Number(max),
          optionIds: [opt1Id, opt2Id]
        }
      ],
      options: [
        {
          id: opt1Id,
          optionGroupId: grpId,
          productId: p1.id,
          status: 'AVAILABLE',
          price: { value: 5.00 }
        },
        {
          id: opt2Id,
          optionGroupId: grpId,
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

    const dataPut = await resPut.json();
    res.status(resPut.status).json({
      success: resPut.ok,
      message: 'Grupo de complementos e 2 complementos vinculados ao Produto Teste com sucesso!',
      group: dataPut.optionGroups ? dataPut.optionGroups[0] : { id: grpId, name },
      complementos: [
        { nome: 'Bacon Extra Teste', preco: 5.00, optionId: opt1Id },
        { nome: 'Queijo Extra Teste', preco: 4.00, optionId: opt2Id }
      ]
    });
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
    const { itemId = 'a7cbf2b4-5d76-483e-9ebf-165348da71bf', price = 28.00 } = req.body || {};

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
    const data = isOk ? { message: `Preço atualizado para R$ ${Number(price).toFixed(2)} com sucesso via PATCH!` } : await resPatch.json();
    res.status(resPatch.status).json({ success: isOk, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/item/status', async (req, res) => {
  try {
    const token = await obterTokenSandbox();
    const { itemId = 'a7cbf2b4-5d76-483e-9ebf-165348da71bf', status = 'UNAVAILABLE' } = req.body || {};

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
    const data = isOk ? { message: `Status alterado para ${status} com sucesso via PATCH!` } : await resPatch.json();
    res.status(resPatch.status).json({ success: isOk, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/opcao/preco', async (req, res) => {
  try {
    const token = await obterTokenSandbox();
    const { optionId = 'f96b23fe-07b3-4fe0-8f4d-c4341cdce5e1', price = 6.00 } = req.body || {};

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
    const data = isOk ? { message: `Preço do complemento atualizado para R$ ${Number(price).toFixed(2)} com sucesso via PATCH!` } : await resPatch.json();
    res.status(resPatch.status).json({ success: isOk, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/opcao/status', async (req, res) => {
  try {
    const token = await obterTokenSandbox();
    const { optionId = 'f96b23fe-07b3-4fe0-8f4d-c4341cdce5e1', status = 'UNAVAILABLE' } = req.body || {};

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
    const data = isOk ? { message: `Status do complemento alterado para ${status} com sucesso via PATCH!` } : await resPatch.json();
    res.status(resPatch.status).json({ success: isOk, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
