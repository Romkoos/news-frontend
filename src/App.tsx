import {useEffect, useState} from "react";
import {Button, Card, Flex, FloatButton, notification} from "antd";

type News = { id:number; ts:number; date:string; hash:string; text:string };

import { SmileOutlined } from '@ant-design/icons';
import Paragraph from "antd/es/typography/Paragraph";

export default function App() {
    const [items, setItems] = useState<News[]>([]);
    const [err, setErr] = useState<string | null>(null);
    const [api, contextHolder] = notification.useNotification();
    const [notifyData, setNotifyData] = useState<null | { message: string; description: string }>(null);

    const API = import.meta.env.VITE_API_BASE || '/api';

    async function loadToday() {
        setErr(null);
        try {
            const res = await fetch(`${API}/news/today`);
            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
            const data = await res.json();
            setItems(data);
            console.log(data);
        } catch (e: unknown) {
            if (e && typeof e === 'object' && 'message' in e && typeof (e as any).message === 'string') {
                setErr((e as any).message);
            } else {
                setErr(String(e));
            }
        }
    }

    function removePostById(id:number) {
        setItems(prev => prev.filter(item => item.id !== id));
    }

    async function copyTexts() {
        try {
            // 1) Берем текущие тексты из items
            const texts = items.map(n => n.text).filter(Boolean);

            // 2) Промпт, как просили
            const prompt = `
            У тебя есть список объектов.
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
            Список новостей:
            `;

            // 3) Превращаем массив новостей в строку
            // Используем маркеры для удобства чтения
            const newsAsString = texts.length
                ? texts.map((t) => `- ${t}`).join("\n\n")
                : "(нет новостей)";

            // 4) Объединяем с промптом
            const finalText = `${prompt}\n\n${newsAsString}`;

            // 5) Копируем в буфер обмена: сперва современный API, затем фоллбек
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
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                try { document.execCommand('copy'); } catch (e) { /* ignore */ }
                document.body.removeChild(ta);
            }
            setNotifyData({
                message: 'Copied to clipboard!',
                description:
                    'The news texts have been copied to your clipboard.',
            })
        } catch (e) {
            console.error('Не удалось скопировать в буфер обмена', e);
            // Нестрогий UX: просто уведомим пользователя
            alert('Не удалось скопировать текст в буфер обмена');
        }
    }
    useEffect(() => {
        if (notifyData) {
            api.open({
                message: notifyData.message,
                description: notifyData.description,
                icon: <SmileOutlined style={{ color: '#108ee9' }} />,
            });
            setNotifyData(null);
        }
    }, [notifyData, api]);

    useEffect(() => {
        loadToday();
    }, [])


    return (
        <Flex gap="middle" vertical>
            {contextHolder}
            <h2 style={{marginLeft: "24px"}}>News Today</h2>
            <FloatButton onClick={() => copyTexts()}>Copy</FloatButton >
                <Card>
                    {err && <p style={{color:"crimson"}}>Ошибка: {err}</p>}
                        {items.map(n => (
                            <Card.Grid  key={n.id} style={{minWidth: "300px"}}>
                                <div style={{opacity:.6, fontSize:12}}>{new Date(n.ts).toLocaleString()}</div>
                                <div>{n.text}</div>
                                <Button onClick={() => removePostById(n.id)}>Remove</Button>
                            </Card.Grid>
                        ))}
            </Card>
        </Flex>
    );
}
