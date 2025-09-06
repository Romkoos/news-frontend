import { useState } from "react";

type News = { id:number; ts:number; date:string; hash:string; text:string };

export default function App() {
    const [items, setItems] = useState<News[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const API = import.meta.env.VITE_API_BASE || '/api';

    async function loadToday() {
        setLoading(true); setErr(null);
        try {
            const res = await fetch(`${API}/news/today`);
            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
            const data = await res.json();
            setItems(data);
            console.log(data);
            // ts-ignore
        } catch (e: any) {
            setErr(e.message || String(e));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{maxWidth: 800, margin: "40px auto", fontFamily: "Inter, system-ui, sans-serif"}}>
            <h1>News Today</h1>
            <button onClick={loadToday} disabled={loading}>
                {loading ? "Загружаю..." : "Загрузить новости за сегодня"}
            </button>
            {err && <p style={{color:"crimson"}}>Ошибка: {err}</p>}
            <ul style={{marginTop:20, lineHeight:1.5}}>
                {items.map(n => (
                    <li key={n.id} style={{marginBottom:16, paddingBottom:16, borderBottom:"1px solid #eee"}}>
                        <div style={{opacity:.6, fontSize:12}}>{new Date(n.ts).toLocaleString()}</div>
                        <div>{n.text}</div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
