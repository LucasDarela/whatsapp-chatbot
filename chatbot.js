const qrcode = require('qrcode-terminal');
const { Client, MessageMedia } = require('whatsapp-web.js');
const client = new Client();

// Objeto para armazenar o estado da conversa por contato e tempo da última interação
const conversationState = {};

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Tudo certo! WhatsApp conectado.');
});

client.initialize();

const delay = ms => new Promise(res => setTimeout(res, ms));

client.on('message', async msg => {
  if (!msg.from.endsWith('@c.us')) return;

  const now = Date.now();

  // Captura a opção digitada pelo usuário
  const option = msg.body.trim().toLowerCase();

  // Se o usuário digitar 'menu', ignora a verificação de tempo e inicia o fluxo
  if (option === 'menu') {
    conversationState[msg.from] = {
      state: 'main',
      lastInteraction: now
    };
    const chat = await msg.getChat();
    await delay(1000);
    await chat.sendStateTyping();
    await delay(1000);
    await client.sendMessage(
      msg.from,
      "Voltando ao menu principal. Digite uma das opções abaixo:\n\n1 - Comercial 🍺\n2 - Técnico 🔧\n3 - Financeiro/Administrativo 💵\n4 - Outras perguntas 👤\n5 - Encerrar atendimento ❌"
    );
    return;
  }

  // Se for a primeira interação ou se passou mais de 24h, reinicia o fluxo
  if (!conversationState[msg.from] || (now - conversationState[msg.from].lastInteraction) > 24 * 60 * 60 * 1000) {
    conversationState[msg.from] = {
      state: 'main',
      lastInteraction: now
    };

    const chat = await msg.getChat();
    const contact = await msg.getContact();
    const name = contact.pushname || 'Cliente';

    await delay(1000);
    await chat.sendStateTyping();
    await delay(2000);
    await client.sendMessage(
      msg.from,
      `Olá, ${name.split(" ")[0]}! Sou o assistente virtual da Darela Chopp Criciúma. Como posso ajudá-lo hoje? Digite uma das opções abaixo:\n\n1 - Comercial 🍺\n2 - Técnico 🔧\n3 - Financeiro/Administrativo 💵\n4 - Outras perguntas 👤\n5 - Encerrar atendimento ❌`
    );
    return;
  }

  // Atualiza o tempo da última interação
  conversationState[msg.from].lastInteraction = now;

  try {
    const chat = await msg.getChat();

    // Lógica do menu principal continua inalterada...
    if (conversationState[msg.from].state === 'main') {
      if (option === '1') {
        conversationState[msg.from].state = 'comercial';
        await delay(1000);
        await chat.sendStateTyping();
        await delay(1000);
        await client.sendMessage(
          msg.from,
          "*Você escolheu Comercial.* Selecione uma das opções abaixo:\n\n1 - Como funciona?\n2 - Catálogo de Produtos e Valores\n3 - Fazer um Pedido\n4 - Falar com um Vendedor\n5 - Voltar ao Menu"
        );
        return;
      } 

      if (option === '2') {
        conversationState[msg.from].state = 'tecnico';
        await delay(1000);
        await chat.sendStateTyping();
        await delay(1000);
        await client.sendMessage(
          msg.from,
          "*Você escolheu Técnico.* \n\nEnvie sua dúvida que o especialista já irá te atender."
        );
        return;
      }

      if (option === '3') {
        conversationState[msg.from].state = 'financeiro';
        await delay(1000);
        await chat.sendStateTyping();
        await delay(1000);
        await client.sendMessage(
          msg.from,
          "*Você escolheu Financeiro/Administrativo.*"
        );
        await client.sendMessage(msg.from, "Clique no link abaixo para abrir a conversa com o Financeiro/Administrativo.");
        await client.sendMessage(msg.from, "https://wa.me/5548999900087");
        return;
      }

      if (option === '4') {
        await delay(1000);
        await chat.sendStateTyping();
        await delay(1000);
        await client.sendMessage(
          msg.from,
          "*Outras perguntas.* \n\nEnvie sua dúvida que um atendente já irá te atender."
        );
        return;
      }

      if (option === '5') {
        await delay(1000);
        await chat.sendStateTyping();
        await delay(1000);
        await client.sendMessage(
          msg.from,
          "Encerrando atendimento. Agradecemos seu contato!"
        );
        conversationState[msg.from].state = 'main';
        return;
      }
    }


    // Estado Financeiro (Retorno ao menu)
    if (conversationState[msg.from] === 'financeiro' && option === 'menu') {
      conversationState[msg.from] = 'main';
      await delay(1000);
      await chat.sendStateTyping();
      await delay(1000);
      await client.sendMessage(
        msg.from,
        "Voltando ao menu principal. Digite uma das opções abaixo:\n\n1 - Comercial 🍺\n2 - Técnico 🔧\n3 - Financeiro/Administrativo 💵\n4 - Outras perguntas 👤\n5 - Encerrar atendimento ❌"
      );
      return;
    }

    // Submenu Comercial
    if (conversationState[msg.from].state === 'comercial') {
      if (option === '1') {
        await delay(1000);
        await chat.sendStateTyping();
        await delay(1000);
        await client.sendMessage(
          msg.from,
          "*Como funciona:* \n\nNosso serviço oferece um atendimento rápido e prático. Trabalhamos com barris de 30lts e 50lts.\n\nVocê escolhe a marca e quantidade de chopp, realiza seu cadastro e, após o pagamento, nossa equipe instala no local e data agendada. \n\nApós o evento nossa equipe recolhe o material."
        );
        await client.sendMessage(msg.from, "Digite 'menu' para voltar ao menu principal.");

      } else if (option === '2') {
        await delay(1000);
        await chat.sendStateTyping();
        await delay(1000);
        await client.sendMessage(msg.from, "Segue nosso catálogo com marcas e valores.");
        
        try {
            const media = MessageMedia.fromFilePath(__dirname + "/assets/catalogo.jpeg"); // Caminho absoluto
            await client.sendMessage(msg.from, media);
            await client.sendMessage(msg.from, "Digite 3 para voltar fazer seu agendamento, ou 'menu' para voltar ao início.");
        } catch (error) {
            console.error("Erro ao enviar catálogo:", error);
            await client.sendMessage(msg.from, "Desculpe, houve um erro ao carregar o catálogo. Tente novamente.");
        }
    }
      else if (option === '3') {
        await delay(1000);
        await chat.sendStateTyping();
        await delay(1000);
        await client.sendMessage(
          msg.from,
          "Para fazer um pedido, envie os seguintes dados:\n*Nome completo*:\n*CPF*:\n*Localização da entrega*:\n*Data*:\n*Horário do evento*:\n*Forma de pagamento:* \n\n(Pagamento no integral ou 50% do valor para confirmar o agendamento. Após enviar os dados, aguarde a confirmação do vendedor)"
        );
        await client.sendMessage(msg.from, "Caso queira voltar, é só digitar 'menu'.");
        conversationState[msg.from] = 'pedido';
      } else if (option === '4') {
        await delay(1000);
        await chat.sendStateTyping();
        await delay(1000);
        await client.sendMessage(
          msg.from,
          "Você será encaminhado para um vendedor. Por favor, aguarde um momento..."
        );
      } else if (option === '5') {
        conversationState[msg.from] = 'main';
        await delay(1000);
        await chat.sendStateTyping();
        await delay(1000);
        await client.sendMessage(
          msg.from,
          "Voltando ao menu principal. Digite uma das opções abaixo:\n\n1 - Comercial 🍺\n2 - Técnico 🔧\n3 - Financeiro/Administrativo 💵\n4 - Outras perguntas 👤\n5 - Encerrar atendimento ❌"
        );
      }
      return;
    }

  } catch (error) {
    console.error("Erro ao processar mensagem:", error);
  }
});