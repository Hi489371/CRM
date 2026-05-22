import React, { useState, useEffect, useRef } from 'react';

const AIChatbot = () => {
  const [conversation, setConversation] = useState([]);
  const [input, setInput] = useState('');
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  const systemPrompt = `You are an expert in freelance client acquisition, proposal writing, pricing strategy (Indian ₹ market), tech stack advice, and client objection handling. Be conversational and helpful. Keep answers concise (under ~800 words) unless the user asks for more detail.`;

  const MAX_MESSAGE_CHARS = 8000;
  const MAX_TURNS = 24;

  const prepareConversation = (messages) =>
    messages
      .filter((m) => m?.role && m?.content)
      .map((m) => ({
        role: m.role,
        content: String(m.content).slice(0, MAX_MESSAGE_CHARS),
      }))
      .slice(-MAX_TURNS);

  const parseChatError = async (response) => {
    const raw = await response.text().catch(() => '');
    try {
      const json = JSON.parse(raw);
      if (Array.isArray(json.errors)) {
        return json.errors.map((e) => e.msg || e.message).filter(Boolean).join('; ');
      }
      if (json.error) return json.error;
      if (json.message) return json.message;
    } catch {
      /* not JSON */
    }
    return raw || `Server error ${response.status}`;
  };

  const buildApiEndpoint = () => {
    const rawApiUrl = process.env.REACT_APP_API_URL?.trim();
    if (rawApiUrl) {
      const cleaned = rawApiUrl.replace(/\/+$|\/api\/ai\/chat$|\/api\/ai$|\/api$/i, '');
      if (rawApiUrl.toLowerCase().endsWith('/api/ai/chat')) {
        return rawApiUrl.replace(/\/+$|\/api\/ai\/chat$/i, '/api/ai/chat');
      }
      if (rawApiUrl.toLowerCase().endsWith('/api/ai')) {
        return `${cleaned}/api/ai/chat`;
      }
      if (rawApiUrl.toLowerCase().endsWith('/api')) {
        return `${cleaned}/api/ai/chat`;
      }
      return `${cleaned}/api/ai/chat`;
    }

    if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      return `${window.location.protocol}//${window.location.hostname}:5000/api/ai/chat`;
    }

    return '/api/ai/chat';
  };

  const apiEndpoint = buildApiEndpoint();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [conversation, streamingMessage]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    if (trimmed.length > 4000) {
      setError('Please keep your message under 4000 characters.');
      return;
    }

    setError('');
    const userMessage = { role: 'user', content: trimmed };
    setConversation((prev) => [...prev, userMessage]);
    setInput('');
    setStreamingMessage('');
    setIsStreaming(true);

    try {
      await streamAssistantResponse(prepareConversation([...conversation, userMessage]));
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setIsStreaming(false);
    }
  };

  const streamAssistantResponse = async (conversationPayload) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ conversation: conversationPayload, systemPrompt }),
    });

    if (!response.ok) {
      throw new Error(await parseChatError(response));
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Streaming response is not available.');
    }

    const decoder = new TextDecoder();
    let assistantText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      assistantText += decoder.decode(value, { stream: true });
      setStreamingMessage(assistantText);
    }

    setConversation((prev) => [
      ...prev,
      { role: 'assistant', content: assistantText.slice(0, MAX_MESSAGE_CHARS) },
    ]);
    setStreamingMessage('');
    setIsStreaming(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  const styles = {
    page: {
      minHeight: '100vh',
      backgroundColor: '#020617',
      color: '#eef2ff',
      padding: '24px',
    },
    layout: {
      display: 'grid',
      gap: '24px',
      maxWidth: '1500px',
      margin: '0 auto',
      gridTemplateColumns: '1fr',
    },
    sidebar: {
      display: 'none',
    },
    card: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: 'calc(100vh - 48px)',
      borderRadius: '32px',
      backgroundColor: '#ffffff',
      boxShadow: '0 20px 60px rgba(15, 23, 42, 0.18)',
      overflow: 'hidden',
    },
    header: {
      borderBottom: '1px solid #e2e8f0',
      padding: '24px',
    },
    panel: {
      flex: 1,
      overflowY: 'auto',
      padding: '24px',
      backgroundColor: '#f8fafc',
    },
    footer: {
      borderTop: '1px solid #e2e8f0',
      padding: '24px',
      backgroundColor: '#f8fafc',
    },
    bubble: {
      maxWidth: '85%',
      borderRadius: '32px',
      padding: '20px',
      boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
      wordBreak: 'break-word',
      whiteSpace: 'pre-wrap',
    },
    input: {
      minHeight: '54px',
      flex: 1,
      borderRadius: '28px',
      border: '1px solid #cbd5e1',
      padding: '14px 18px',
      fontSize: '14px',
      color: '#0f172a',
      outline: 'none',
      marginRight: '12px',
    },
    button: {
      minHeight: '54px',
      padding: '0 22px',
      borderRadius: '28px',
      backgroundColor: '#0ea5e9',
      color: '#ffffff',
      fontWeight: 600,
      border: 'none',
      cursor: isStreaming || !input.trim() ? 'not-allowed' : 'pointer',
      opacity: isStreaming || !input.trim() ? 0.6 : 1,
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.layout}>
        <main style={styles.card}>
          <header style={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '18px',
                  backgroundColor: '#0ea5e9',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#ffffff',
                  fontSize: '20px',
                }}
              >
                🤖
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '12px', letterSpacing: '0.2em', color: '#64748b' }}>CRM AI</p>
                <h1 style={{ margin: '8px 0 0', fontSize: '28px', color: '#0f172a' }}>Sales assistant</h1>
              </div>
            </div>
          </header>

          <div style={styles.panel}>
            <div style={{ borderRadius: '28px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', padding: '28px', minHeight: '420px' }}>
              {conversation.length === 0 && (
                <div
                  style={{
                    borderRadius: '28px',
                    border: '1px dashed #cbd5e1',
                    padding: '36px',
                    textAlign: 'center',
                    color: '#64748b',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  Start your chat with the AI assistant here.
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {conversation.map((message, index) => {
                  const isUser = message.role === 'user';
                  return (
                    <div key={`${message.role}-${index}`} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                      {!isUser && (
                        <div
                          style={{
                            marginRight: '14px',
                            marginTop: '4px',
                            width: '40px',
                            minWidth: '40px',
                            height: '40px',
                            borderRadius: '14px',
                            backgroundColor: '#0ea5e9',
                            display: 'grid',
                            placeItems: 'center',
                            color: '#ffffff',
                            fontWeight: 700,
                          }}
                        >
                          AI
                        </div>
                      )}
                      <div
                        style={{
                          ...styles.bubble,
                          backgroundColor: isUser ? '#0ea5e9' : '#f8fafc',
                          color: isUser ? '#ffffff' : '#0f172a',
                          borderTopLeftRadius: isUser ? '32px' : '8px',
                          borderTopRightRadius: isUser ? '8px' : '32px',
                        }}
                      >
                        <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: isUser ? '#bfdbfe' : '#475569' }}>
                          {isUser ? 'You' : 'Assistant'}
                        </div>
                        <div>{message.content}</div>
                      </div>
                    </div>
                  );
                })}

                {isStreaming && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div
                      style={{
                        marginRight: '14px',
                        marginTop: '4px',
                        width: '40px',
                        minWidth: '40px',
                        height: '40px',
                        borderRadius: '14px',
                        backgroundColor: '#0ea5e9',
                        display: 'grid',
                        placeItems: 'center',
                        color: '#ffffff',
                        fontWeight: 700,
                      }}
                    >
                      AI
                    </div>
                    <div style={{ ...styles.bubble, backgroundColor: '#f8fafc', color: '#0f172a' }}>
                      <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>Assistant</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: '#475569', animation: 'pulse 1.2s infinite ease-in-out' }} />
                        <span style={{ color: '#64748b' }}>{streamingMessage || 'Typing...'}</span>
                        {streamingMessage && <span style={{ color: '#64748b' }}>|</span>}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={scrollRef} />
              </div>
            </div>
          </div>

          <footer style={styles.footer}>
            {error && (
              <div style={{ marginBottom: '16px', borderRadius: '24px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', padding: '16px', color: '#b91c1c' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: window.innerWidth >= 640 ? 'row' : 'column', gap: '12px' }}>
              <label htmlFor="chat-input" style={{ position: 'absolute', left: '-9999px' }}>
                Enter message
              </label>
              <input
                id="chat-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={isStreaming}
                placeholder="Ask your AI assistant anything..."
                style={styles.input}
              />
              <button type="submit" disabled={isStreaming || !input.trim()} style={styles.button}>
                Send →
              </button>
            </form>
          </footer>
        </main>
      </div>
      <style>
        {`@keyframes pulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }`}
      </style>
    </div>
  );
};

export default AIChatbot;
