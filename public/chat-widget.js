(function() {
  // Vault AI Chat Widget
  var workspaceId = null;
  var isOpen = false;
  var iframe = null;
  var bubble = null;
  var container = null;

  // Get the script tag and workspace ID
  function init(wsId) {
    workspaceId = wsId;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createWidget);
    } else {
      createWidget();
    }
  }

  function createWidget() {
    // Create container
    container = document.createElement('div');
    container.id = 'vault-ai-widget-container';
    container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 99999; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;';

    // Create chat bubble button
    bubble = document.createElement('button');
    bubble.id = 'vault-ai-bubble';
    bubble.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    bubble.style.cssText = 'width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4); transition: transform 0.2s, box-shadow 0.2s;';
    bubble.onmouseover = function() {
      this.style.transform = 'scale(1.1)';
      this.style.boxShadow = '0 6px 25px rgba(99, 102, 241, 0.5)';
    };
    bubble.onmouseout = function() {
      this.style.transform = 'scale(1)';
      this.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.4)';
    };
    bubble.onclick = toggleChat;

    // Create iframe container (hidden initially)
    var iframeContainer = document.createElement('div');
    iframeContainer.id = 'vault-ai-chat-container';
    iframeContainer.style.cssText = 'display: none; position: absolute; bottom: 70px; right: 0; width: 380px; height: 550px; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.3); background: #1a1a2e;';

    // Create iframe
    iframe = document.createElement('iframe');
    iframe.src = 'https://my-vaultais.vercel.app/embed/chat/' + workspaceId;
    iframe.style.cssText = 'width: 100%; height: 100%; border: none;';
    iframe.title = 'Vault AI Chat';

    iframeContainer.appendChild(iframe);
    container.appendChild(iframeContainer);
    container.appendChild(bubble);
    document.body.appendChild(container);

    // Mobile responsive
    if (window.innerWidth < 500) {
      iframeContainer.style.width = 'calc(100vw - 40px)';
      iframeContainer.style.height = '70vh';
      iframeContainer.style.right = '-10px';
    }
  }

  function toggleChat() {
    isOpen = !isOpen;
    var chatContainer = document.getElementById('vault-ai-chat-container');
    if (isOpen) {
      chatContainer.style.display = 'block';
      bubble.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    } else {
      chatContainer.style.display = 'none';
      bubble.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    }
  }

  // Process queue
  window.vaultai = function() {
    var args = Array.prototype.slice.call(arguments);
    if (args[0] === 'init') {
      init(args[1]);
    }
  };

  // Process any queued calls
  if (window.vaultai && window.vaultai.q) {
    var queue = window.vaultai.q;
    for (var i = 0; i < queue.length; i++) {
      window.vaultai.apply(null, queue[i]);
    }
  }
})();
