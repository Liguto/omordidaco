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

## ☁️ Deploy na Nuvem (Vercel & Render)

### A. Deploy na Vercel (Recomendado - Ultra Rápido)
1. Conecte o repositório `Liguto/omordidaco` no [vercel.com](https://vercel.com).
2. O arquivo `vercel.json` já está configurado para rotear as APIs e o painel KDS.
3. O deploy ocorre automaticamente a cada push na branch `main`!

### B. Deploy no Render (Alternativa)
1. Crie um **Web Service** no [render.com](https://render.com) com o repositório `Liguto/omordidaco`.
2. Environment: Node | Build: `npm install` | Start: `node server.js`.
