import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { getDocentQuestionPresets } from "../../db/seeds/docent-question-data";

type ChatMessage = { role: "user" | "assistant"; content: string; createdAt?: string };

const SUGGESTION_COUNT = 3;

function messageTime(value?: string) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" });
}

export function AiDocentPanel({
  exhibitionArtworkId,
  artworkTitle,
  onClose,
}: {
  exhibitionArtworkId: string;
  artworkTitle: string;
  onClose: () => void;
  announce: (message: string) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartY = useRef<number | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

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
        body: JSON.stringify({ exhibitionArtworkId, question: trimmed, sharePersonalization: false }),
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

  function submitForm(event: React.FormEvent) {
    event.preventDefault();
    void sendQuestion(question);
  }

  function startDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    dragStartY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (dragStartY.current === null) return;
    setDragOffset(Math.max(0, event.clientY - dragStartY.current));
  }

  function endDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (dragStartY.current === null) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragStartY.current = null;
    if (dragOffset >= 85) {
      setDragOffset(window.innerHeight);
      window.setTimeout(onClose, 180);
      return;
    }
    setDragOffset(0);
  }

  return (
    <div className="ai-docent-overlay" role="dialog" aria-modal="true" aria-labelledby="ai-docent-title">
      <section className={`ai-docent-sheet${dragOffset > 0 ? " dragging" : ""}`} style={{ transform: `translateY(${dragOffset}px)` }}>
        <button
          type="button"
          className="ai-docent-drag-handle"
          aria-label="아래로 끌어 AI 도슨트 닫기"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <span />
        </button>

        <header className="ai-docent-header">
          <h2 id="ai-docent-title"><span aria-hidden="true">✦</span> AI 도슨트</h2>
        </header>

        <div className="ai-docent-conversation">
          {messages.length === 0 && !loadingHistory && (
            <div className="ai-docent-suggestions" aria-label="추천 질문">
              {suggestedQuestions.map((suggested) => (
                <button
                  key={`${suggested.category}-${suggested.question}`}
                  type="button"
                  onClick={() => void sendQuestion(suggested.question)}
                >
                  {suggested.question}
                </button>
              ))}
            </div>
          )}

          {loadingHistory && <p className="ai-docent-loading">대화 기록을 불러오는 중...</p>}

          {messages.map((message, index) => (
            <div className={`ai-docent-message ${message.role}`} key={`${message.createdAt ?? index}-${index}`}>
              <div>{message.content}</div>
              <time>{messageTime(message.createdAt)}</time>
            </div>
          ))}

          {sending && (
            <div className="ai-docent-message assistant thinking">
              <div>답변을 생각하는 중...</div>
            </div>
          )}
          <div ref={messageEndRef} />
        </div>

        {error && <p className="ai-docent-error" role="alert">{error}</p>}

        <form className="ai-docent-input" onSubmit={submitForm}>
          <span aria-hidden="true">✦</span>
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="작품에 대해 궁금한 점을 입력하세요"
            aria-label="AI 도슨트에게 질문하기"
          />
          <button type="submit" disabled={sending || !question.trim()} aria-label="질문 보내기">↗</button>
        </form>
      </section>
    </div>
  );
}
