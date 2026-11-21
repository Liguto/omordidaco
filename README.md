# 🌭 O Mordidaço | Hot-Dogueria Artesanal
### *"A mordida mais caprichada de Campinas !"*
**Sistema de Cardápio Digital Mobile, Pedidos & Painel da Cozinha KDS**

Plataforma oficial de pedidos diretos de **O Mordidaço** (Jardim Tamoio, Campinas - SP).

---

## 📱 Recursos Principais
- **Cardápio Mobile-First:** Experiência fluida e responsiva para smartphones (PWA look & feel), com packshots em miniatura dos produtos.
- **7 Combos Estratégicos:** No topo do menu (Solos, Casal, Família com upgrade 2L e Casal VIP com 2 sobremesas no pote).
- **Formatos:** Hot Dog Tradicional de Rua (No Pão) e Hot Dog No Prato (Marmitinha Térmica 500ml).
- **Upsell Inteligente de 1 Clique:** Sugestão de refrigerante com desconto (+ R$ 5,00) ou sobremesa artesanal (+ R$ 9,00) diretamente no modal.
- **Gestão Operacional de Status da Loja:** Seletor interativo no KDS (🟢 Aberta / 🟡 Pausar Loja / 🔴 Fechar Loja) com sincronização em tempo real via SSE (`/api/status-loja`).
- **Checkout Simples:** Dados de entrega em Campinas e pagamentos na entrega (Pix na Moderninha Pro 2, Cartões de Débito/Crédito/Vouchers PAT e Dinheiro com troco dinâmico).
- **Integração WhatsApp:** Disparo de mensagens com o resumo completo do pedido para o WhatsApp oficial.
- **Painel KDS da Cozinha:** Tempo real com alarme sonoro alto, visual de combos com quebra de linha dedicada por dog (`#1`, `#2`, No Pão vs No Prato, retiradas e adicionais) e impressão térmica 58mm/80mm formatada com QR Code de avaliações do Google.
- **Integrações de Delivery Multicanal:**
  - iFood (Merchant & Catalog API v2.0): Sincronização automatizada, catálogo auditado com zero duplicados e ordenação estrita por preço crescente.
  - 99Food (OpenAPI DiDi v3.0): Cardápio sincronizado ao vivo via upload v3 e webhook de despacho/finalização.
- **CRM Invisível:** Cadastro automático de clientes VIP com histórico de pedidos e exportação de contatos.

---

## 🚀 Como Rodar Localmente

```bash
# Instalar dependências
npm install

# Iniciar servidor
npm start
```
- Cardápio do Cliente: `http://localhost:3000`
- Painel da Cozinha KDS: `http://localhost:3000/cozinha.html`

---

## ☁️ Deploy na Nuvem (Vercel & Render)

### A. Deploy na Vercel (Recomendado - Ultra Rápido)
1. Conecte o repositório `Liguto/omordidaco` no [vercel.com](https://vercel.com).
2. O arquivo `vercel.json` já está configurado para rotear as APIs e o painel KDS.
3. O deploy ocorre automaticamente a cada push na branch `main`!

### B. Deploy no Render (Alternativa)
1. Crie um **Web Service** no [render.com](https://render.com) com o repositório `Liguto/omordidaco`.
2. Environment: Node | Build: `npm install` | Start: `node server.js`.
