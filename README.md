# 🌭 O Mordidaço | Hot-Dogueria Artesanal
### Sistema de Cardápio Digital Mobile, Pedidos & Painel da Cozinha KDS

Plataforma oficial de pedidos diretos de **O Mordidaço** (Jardim Tamoio, Campinas - SP).

---

## 📱 Recursos Principais
- **Cardápio Mobile-First:** Experiência fluida e responsiva para smartphones (PWA look & feel).
- **Formatos:** Hot Dog Tradicional de Rua (No Pão) e Hot Dog No Prato (Marmitinha Térmica 500ml).
- **Checkout Simples:** Dados de entrega em Campinas e pagamentos na entrega (Pix na maquininha Ton, Cartão Débito/Crédito e Dinheiro com troco dinâmico).
- **Integração WhatsApp:** Disparo de mensagens com o resumo completo do pedido para o WhatsApp oficial.
- **Painel KDS da Cozinha:** Tempo real com alarme sonoro alto, gestão reversível de status e impressão térmica 58mm/80mm formatada.
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

## ☁️ Deploy no Render (Instruções)
1. Crie um novo **Web Service** no [render.com](https://render.com).
2. Conecte com o repositório GitHub `Liguto/omordidaco`.
3. Configurações automáticas:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. Deploy concluído! Seu link público estará ativo gratuitamente em segundos.
