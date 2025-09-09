import type {News} from '../../../entities/news/model/types';

export async function copyNewsTexts(items: News[]): Promise<void> {
  const texts = items.map(n => n.text).filter((t): t is string => Boolean(t));

  const prompt = `У тебя есть список объектов.
            Проанализируй список.
            Составь дайджест новостей на русском языке.
            Объедини новости по темам (например: международные события, Израиль/Газа, происшествия, политика).
            Исключи неинформативные посты (односложные подписи к фото/видео, повторяющиеся кадры, пустые новости).
            Сделай дайджест структурированным с заголовками и краткими абзацами.
            После дайджеста сгенерируй сценарий для TikTok в формате «быстрых новостей»:
            Без приветствия и прощания.
            Только тело контента.
            Короткие и динамичные фразы, которые удобно зачитывать вслух.
            Максимум 5–6 блоков.
            Сохрани стиль как в новостных сводках: нейтральный, информативный, без воды.
            Список новостей: `;

  const newsAsString = texts.length
    ? texts.map((t) => `- ${t}`).join("\n\n")
    : "(нет новостей)";

  const finalText = `${prompt}\n\n${newsAsString}`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(finalText);
  } else {
    const ta = document.createElement('textarea');
    ta.value = finalText;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch { /* ignore */ }
    document.body.removeChild(ta);
  }
}
