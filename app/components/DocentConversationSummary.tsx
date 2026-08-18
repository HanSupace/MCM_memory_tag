import { useEffect, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

type ConversationTurn = {
  question: string;
  answerSummary: string;
  createdAt?: string;
};

const UNVERIFIED_ANSWER_MARKERS = [
  "확인된 자료가 없습니다",
  "확인된 정보가 없습니다",
  "등록된 자료가 없습니다",
  "근거 자료가 없습니다",
  "정확한 정보가 없습니다",
  "정보가 없습니다",
  "알 수 없습니다",
  "확인할 수 없습니다",
  "자료만으로는",
  "자료에서는 확인되지",
  "근거에서는 확인되지",
];

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function limitText(value: string, maxLength: number) {
  const compact = compactText(value);
  if (compact.length <= maxLength) return compact;
  const shortened = compact.slice(0, maxLength + 1);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, lastSpace > maxLength * 0.65 ? lastSpace : maxLength).trim()}…`;
}

function summarizeAnswer(value: string) {
  const compact = compactText(value);
  const sentences = compact.match(/[^.!?。]+[.!?。]?/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [];
  return limitText(sentences.slice(0, 2).join(" ") || compact, 240);
}

function hasVerifiedInformation(value: string) {
  const compact = compactText(value);
  return compact.length > 0 && !UNVERIFIED_ANSWER_MARKERS.some((marker) => compact.includes(marker));
}

function buildConversationTurns(messages: ChatMessage[]) {
  const turns: ConversationTurn[] = [];
  let pendingQuestion: ChatMessage | null = null;

  for (const message of messages) {
    if (message.role === "user") {
      pendingQuestion = message;
      continue;
    }

    if (!pendingQuestion || !hasVerifiedInformation(message.content)) {
      pendingQuestion = null;
      continue;
    }

    const answerSummary = summarizeAnswer(message.content);
    if (answerSummary) {
      turns.push({
        question: compactText(pendingQuestion.content),
        answerSummary,
        createdAt: pendingQuestion.createdAt ?? message.createdAt,
      });
    }
    pendingQuestion = null;
  }

  return turns;
}

function formatDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function DocentConversationSummary({ exhibitionArtworkId }: { exhibitionArtworkId: string }) {
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetch(`/api/docent/chat?exhibitionArtworkId=${encodeURIComponent(exhibitionArtworkId)}`, { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json() as { messages?: ChatMessage[]; error?: string };
        if (!response.ok) throw new Error(body.error ?? "대화 기록을 불러오지 못했습니다.");
        return buildConversationTurns(body.messages ?? []);
      })
      .then((nextTurns) => {
        if (active) setTurns(nextTurns);
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "대화 기록을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [exhibitionArtworkId]);

  return (
    <article className="artwork-description-card personal-ai-history-card">
      <div className="docent-summary-heading">
        <div>
          <span className="section-kicker">AI CONVERSATION</span>
          <h3>AI와 나눈 대화</h3>
        </div>
        {!loading && turns.length > 0 && <span>{turns.length}개의 대화</span>}
      </div>

      {loading && <p className="docent-summary-state">대화를 정리하는 중입니다…</p>}
      {!loading && error && <p className="form-error" role="alert">{error}</p>}
      {!loading && !error && turns.length === 0 && (
        <div className="docent-summary-empty">
          <span aria-hidden="true">✦</span>
          <div>
            <strong>아직 정리할 수 있는 대화가 없어요</strong>
            <p>작품 정보에 근거한 질문과 답변이 쌓이면 이곳에 순서대로 정리됩니다.</p>
          </div>
        </div>
      )}

      {!loading && !error && turns.length > 0 && (
        <div className="docent-summary-list">
          {turns.map((turn, index) => {
            const date = formatDate(turn.createdAt);
            return (
              <section className="docent-summary-item" key={`${turn.createdAt ?? "conversation"}-${index}`}>
                <header>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {date && <time dateTime={turn.createdAt}>{date}</time>}
                </header>
                <div className="docent-question-summary">
                  <small>질문</small>
                  <h4>{turn.question}</h4>
                </div>
                <div className="docent-answer-summary">
                  <small>핵심 답변</small>
                  <p>{turn.answerSummary}</p>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </article>
  );
}
