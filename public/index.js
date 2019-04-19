const $ = window.$;

$(() => {
  const inputQuery = $('#input');
  const sendQuery = $('#send');
  const chatAreaQuery = $('#chatArea');
  const errorModalQuery = $('#errorModal');
  const errorRefreshQuery = $('#errorRefresh');
  const errorBodyQuery = $('#errorBody');
  const loadingQuery = $('#loading');

  const protocol = (window.location.protocol === 'https:' ? 'wss:' : 'ws:');
  const url = protocol + '//' + window.location.hostname + ':3000/api' + window.location.pathname;
  const ws = new WebSocket(url);

  const send = object => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(object));
    }
  };

  ws.addEventListener('open', () => {
    loadingQuery.addClass('loading-finished');
  });

  const appendChatBubble = (who, text) => {
    const chatArea = chatAreaQuery.get(0);
    const isAtBottom = chatArea.scrollHeight - chatArea.scrollTop === chatArea.clientHeight;
    const bubble = $(`<div class="chat-bubble chat-${who}"></div>`);
    bubble.text(text);
    const item = $('<div class="chat-item"></div>');
    item.append(bubble);
    chatAreaQuery.append(item);

    if (isAtBottom) {
      chatArea.scrollTop = chatArea.scrollHeight;
    }
  };

  ws.addEventListener('message', e => {
    const json = JSON.parse(e.data);
    switch (json.type) {
    case 'chat':
      appendChatBubble(json.sender, json.text);
      break;
    }
  });

  const sendMessage = () => {
    const text = inputQuery.val();
    if (text) {
      send({
        type: 'chat',
        text: text
      });

      inputQuery.val('');
    }
  };

  inputQuery.on('keydown', e => {
    if (e.key === 'Enter' && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      sendMessage();
      e.preventDefault();
    }
  });
  sendQuery.on('click', sendMessage);

  errorModalQuery.on('shown.bs.modal', () => {
    errorRefreshQuery.focus();
  });
  errorModalQuery.on('hide.bs.modal', () => {
    location.reload();
  });
  const showErrorModal = e => {
    errorModalQuery.modal('show');
    errorBodyQuery.text(e.reason || e.message || 'You have been disconnected.');
  };
  ws.addEventListener('close', showErrorModal);
  ws.addEventListener('error', showErrorModal);
});
