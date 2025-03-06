const chatContainer = document.getElementById('chat-container');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');

// Configurações de controle de taxa
const MAX_REQUESTS_PER_MINUTE = 60; // Número máximo de requisições permitidas por minuto
let requestCount = 0;
let resetTime = Date.now() + 60000; // Tempo para resetar o contador de requisições

sendButton.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

function addMessage(text, sender) {
  const messageElem = document.createElement('div');
  messageElem.classList.add('message', sender);
  messageElem.textContent = text;
  chatContainer.appendChild(messageElem);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
  const userMessage = chatInput.value.trim();
  if (!userMessage) return;
  addMessage(userMessage, 'user');
  chatInput.value = '';

  // Verifica se o limite de requisições foi atingido
  if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
    const currentTime = Date.now();
    if (currentTime < resetTime) {
      const waitTime = Math.ceil((resetTime - currentTime) / 1000);
      addMessage(`Limite de requisições atingido. Aguarde ${waitTime} segundos antes de tentar novamente.`, 'ai');
      return;
    } else {
      // Reseta o contador e o tempo de reset
      requestCount = 0;
      resetTime = currentTime + 60000;
    }
  }

  // Incrementa o contador de requisições
  requestCount++;

  // Chamada à API do OpenAI – insira sua chave em "YOUR_API_KEY_HERE"
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY_HERE'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) : 60;
        addMessage(`Limite de requisições excedido. Aguarde ${waitTime} segundos antes de tentar novamente.`, 'ai');
      } else {
        throw new Error(`Erro: ${response.status}`);
      }
      return;
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content.trim();
    addMessage(aiMessage, 'ai');
  } catch (error) {
    addMessage('Erro ao chamar API: ' + error.message, 'ai');
  }
}
