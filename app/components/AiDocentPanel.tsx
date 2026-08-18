import { useEffect, useState } from "react";
import { getDocentQuestionPresets } from "../../db/seeds/docent-question-data";

type ChatMessage = { role: "user" | "assistant"; content: string; createdAt?: string };

const SUGGESTION_COUNT = 3;

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 100,
  display: "grid",
  placeItems: "center",
  padding: 20,
  background: "rgba(22, 22, 19, 0.6)",
};

const cardStyle: React.CSSProperties = {
  width: "min(100%, 460px)",
  maxHeight: "90vh",
  padding: "28px 24px",
  borderRadius: 4,
  background: "var(--paper)",
  color: "var(--ink)",
  display: "grid",
  gridTemplateRows: "auto auto 1fr auto auto",
  gap: 14,
};

const messageListStyle: React.CSSProperties = {
  overflowY: "auto",
  display: "grid",
  gap: 10,
  padding: "4px 2px",
  minHeight: 160,
};

const bubbleBase: React.CSSProperties = {
  maxWidth: "85%",
  padding: "10px 14px",
  borderRadius: 10,
  fontSize: 13,
  lineHeight: 1.5,
  whiteSpace: "pre-wrap",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 44,
  padding: "10px 14px",
  border: "1px solid var(--line)",
  borderRadius: 3,
  background: "#fff",
  color: "var(--ink)",
  fontSize: 13,
  boxSizing: "border-box",
  resize: "none",
};

const primaryButtonStyle: React.CSSProperties = {
  height: 44,
  border: "1px solid var(--ink)",
  borderRadius: 3,
  background: "var(--ink)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  height: 40,
  padding: "0 12px",
  border: "1px solid var(--line)",
  borderRadius: 3,
  background: "none",
  color: "var(--ink)",
  fontSize: 12,
  cursor: "pointer",
};

export function AiDocentPanel({
  exhibitionArtworkId,
  artworkTitle,
  onClose,
  announce,
}: {
  exhibitionArtworkId: string;
  artworkTitle: string;
  onClose: () => void;
  announce: (message: string) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [sharePersonalization, setSharePersonalization] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const suggestedQuestions = getDocentQuestionPresets(exhibitionArtworkId, artworkTitle).slice(0, SUGGESTION_COUNT);

  useEffect(() => {
    let active = true;
    fetch(`/api/docent/chat?exhibitionArtworkId=${exhibitionArtworkId}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return [];
        const data = (await response.json()) as { messages?: ChatMessage[] };
        return data.messages ?? [];
      })
      .then((history) => {
        if (active) setMessages(history);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoadingHistory(false);
      });
    return () => {
      active = false;
    };
  }, [exhibitionArtworkId]);

  async function sendQuestion(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError(null);
    setMessages((current) => [...current, { role: "user", content: trimmed }]);
    setQuestion("");

    try {
      const response = await fetch("/api/docent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exhibitionArtworkId, question: trimmed, sharePersonalization }),
      });
      const data = (await response.json()) as { answer?: string; error?: string };
      if (!response.ok || !data.answer) {
        setError(data.error ?? "AI 도슨트 응답을 받지 못했습니다.");
        return;
      }
      setMessages((current) => [...current, { role: "assistant", content: data.answer as string }]);
    } catch {
      setError("네트워크 오류로 질문을 보내지 못했습니다.");
    } finally {
      setSending(false);
    }
  }

  async function resetHistory() {
    try {
      await fetch(`/api/docent/chat?exhibitionArtworkId=${exhibitionArtworkId}`, { method: "DELETE" });
      setMessages([]);
      announce("AI 도슨트 대화 기록을 초기화했습니다.");
    } catch {
      setError("대화 기록을 초기화하지 못했습니다.");
    }
  }

  function submitForm(event: React.FormEvent) {
    event.preventDefault();
    void sendQuestion(question);
  }

  return (
    <div className="ai-docent-overlay" style={overlayStyle} role="dialog" aria-modal="true">
      <div style={cardStyle}>
        <div>
          <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>AI 도슨트</h2>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>{artworkTitle}에 대해 질문해 보세요.</p>
        </div>

        {messages.length === 0 && !loadingHistory && (
          <div style={{ display: "grid", gap: 9 }}>
            <strong style={{ fontSize: 11 }}>이런 질문은 어떠세요?</strong>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {suggestedQuestions.map((suggested) => (
                <button
                  key={`${suggested.category}-${suggested.question}`}
                  type="button"
                  title={suggested.category}
                  style={{ ...secondaryButtonStyle, height: "auto", minHeight: 36, padding: "7px 10px", textAlign: "left" }}
                  onClick={() => void sendQuestion(suggested.question)}
                >
                  <span style={{ display: "block", marginBottom: 2, color: "var(--gold)", fontSize: 8, fontWeight: 800 }}>
                    {suggested.category}
                  </span>
                  {suggested.question}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={messageListStyle}>
          {loadingHistory && <span style={{ fontSize: 12, color: "var(--muted)" }}>대화 기록을 불러오는 중...</span>}
          {messages.map((message, index) => (
            <div
              key={index}
              style={{
                ...bubbleBase,
                justifySelf: message.role === "user" ? "end" : "start",
                background: message.role === "user" ? "var(--ink)" : "var(--paper-deep)",
                color: message.role === "user" ? "#fff" : "var(--ink)",
              }}
            >
              {message.content}
            </div>
          ))}
          {sending && (
            <div style={{ ...bubbleBase, justifySelf: "start", background: "var(--paper-deep)", color: "var(--muted)" }}>
              답변을 생각하는 중...
            </div>
          )}
        </div>

        {error && <span style={{ color: "#9c3b32", fontSize: 12 }} role="alert">{error}</span>}

        <form onSubmit={submitForm} style={{ display: "grid", gap: 8 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted)" }}>
            <input
              type="checkbox"
              checked={sharePersonalization}
              onChange={(event) => setSharePersonalization(event.target.checked)}
            />
            이 대화를 취향 리포트 등 개인화에 활용하도록 허용
          </label>
          <textarea
            style={inputStyle}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="작품에 대해 궁금한 점을 입력하세요"
            rows={2}
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
            <button type="button" style={secondaryButtonStyle} onClick={resetHistory}>대화 기록 초기화</button>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" style={secondaryButtonStyle} onClick={onClose}>닫기</button>
              <button type="submit" style={primaryButtonStyle} disabled={sending || !question.trim()}>
                {sending ? "전송 중..." : "질문하기"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
