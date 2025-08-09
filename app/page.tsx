"use client";
import React, { useMemo, useState } from "react";

/** ---------------- Budgets ---------------- **/
const BUDGETS = {
  "Зенит": 20.0,
  "Краснодар": 16.0,
  "Спартак": 9.0,
  "Локомотив": 7.0,
  "ЦСКА": 7.0,
  "Динамо Москва": 5.5,
  "Рубин": 2.0,
  "Акрон": 1.75,
  "Ахмат": 1.5,
  "Ростов": 1.5,
  "Крылья Советов": 1.5,
  "Динамо Махачкала": 1.5,
  "Оренбург": 1.5,
  "Пари Нижний Новгород": 1.5,
  "Сочи": 1.5,
  "Балтика": 1.2,
};
const TEAMS = Object.keys(BUDGETS);

/** ---------------- Matches (25 сыгранных) ---------------- **/
const MATCHES = [
  // Тур 1
  { date: "2025-07-19", home: "Динамо Москва", away: "Балтика", hg: 1, ag: 1 },
  { date: "2025-07-19", home: "Акрон", away: "Крылья Советов", hg: 1, ag: 1 },
  { date: "2025-07-20", home: "Локомотив", away: "Сочи", hg: 3, ag: 0 },
  { date: "2025-07-20", home: "Спартак", away: "Динамо Махачкала", hg: 1, ag: 0 },
  { date: "2025-07-20", home: "Пари Нижний Новгород", away: "Краснодар", hg: 0, ag: 3 },
  { date: "2025-07-21", home: "Зенит", away: "Ростов", hg: 2, ag: 1 },
  { date: "2025-07-21", home: "Ахмат", away: "Рубин", hg: 0, ag: 2 },
  { date: "2025-07-21", home: "Оренбург", away: "ЦСКА", hg: 0, ag: 0 },
  // Тур 2
  { date: "2025-07-26", home: "Крылья Советов", away: "Пари Нижний Новгород", hg: 2, ag: 0 },
  { date: "2025-07-26", home: "Спартак", away: "Балтика", hg: 0, ag: 3 },
  { date: "2025-07-27", home: "Динамо Москва", away: "Ростов", hg: 1, ag: 0 },
  { date: "2025-07-27", home: "Краснодар", away: "Локомотив", hg: 1, ag: 2 },
  { date: "2025-07-27", home: "Сочи", away: "Акрон", hg: 0, ag: 4 },
  { date: "2025-07-27", home: "ЦСКА", away: "Ахмат", hg: 2, ag: 1 },
  { date: "2025-07-28", home: "Оренбург", away: "Динамо Махачкала", hg: 1, ag: 1 },
  { date: "2025-07-28", home: "Рубин", away: "Зенит", hg: 2, ag: 2 },
  // Тур 3
  { date: "2025-08-02", home: "Ростов", away: "Крылья Советов", hg: 1, ag: 4 },
  { date: "2025-08-02", home: "Пари Нижний Новгород", away: "Локомотив", hg: 2, ag: 3 },
  { date: "2025-08-03", home: "Краснодар", away: "Динамо Москва", hg: 1, ag: 0 },
  { date: "2025-08-03", home: "Акрон", away: "Спартак", hg: 1, ag: 1 },
  { date: "2025-08-03", home: "Балтика", away: "Оренбург", hg: 3, ag: 2 },
  { date: "2025-08-03", home: "Зенит", away: "ЦСКА", hg: 1, ag: 1 },
  { date: "2025-08-04", home: "Динамо Махачкала", away: "Ахмат", hg: 1, ag: 0 },
  { date: "2025-08-04", home: "Рубин", away: "Сочи", hg: 2, ag: 1 },
  // Тур 4 (один сыгранный)
  { date: "2025-08-09", home: "Динамо Махачкала", away: "Акрон", hg: 1, ag: 1 },
];

/** ---------------- BAP math ---------------- **/
const ALPHA = 0.4;
const CLIP_MIN = 0.6;
const CLIP_MAX = 1.4;
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const basePoints = (hg, ag) => (hg > ag ? [3, 0] : hg < ag ? [0, 3] : [1, 1]);

function strengths(budgets) {
  const vals = Object.values(budgets);
  const bmin = Math.min(...vals);
  const bmax = Math.max(...vals);
  const denom = bmax - bmin || 1;
  const S = {};
  for (const [team, b] of Object.entries(budgets)) {
    S[team] = (b - bmin) / denom; // [0..1]
  }
  return S;
}
const dCoef = (S, i, j) => clamp(1 + ALPHA * (S[j] - S[i]), CLIP_MIN, CLIP_MAX);

/** ---------------- UI helpers ---------------- **/
const UTable = ({ children }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #ddd" }}>{children}</table>
);
const TH = ({ children }) => (
  <th style={{ textAlign: "left", padding: 8, border: "1px solid #ddd", background: "#f7f7f7" }}>{children}</th>
);
const TD = ({ children, bold, color, style }) => (
  <td style={{ padding: 8, border: "1px solid #eee", fontWeight: bold ? 600 : 400, color, ...style }}>{children}</td>
);

/** ----------- visuals: S mini-bar & contrast shading ----------- **/
function SBar({ s }) {
  const pct = Math.max(0, Math.min(1, s)) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 10, background: "#f0f0f0", borderRadius: 6, overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: `linear-gradient(90deg, #22c55e, #facc15, #ef4444)`,
          }}
        />
      </div>
      <div style={{ minWidth: 38, textAlign: "right" }}>{s.toFixed(2)}</div>
    </div>
  );
}
// Монохромная подсветка контраста сил: белый → тёмно-розовый
function contrastBgMono(s1, s2) {
  const diff = Math.abs(s1 - s2); // 0..1
  const alpha = Math.min(0.45, diff * 0.7); // сила подсветки
  return `rgba(235, 60, 125, ${alpha})`;
}

/** ---------------- Page ---------------- **/
export default function Page() {
  const [tab, setTab] = useState("table"); // table | matches | budgets | about
  const S = useMemo(() => strengths(BUDGETS), []);

  // агрегируем очки для таблицы
  const table = useMemo(() => {
    const stats = {};
    TEAMS.forEach((t) => (stats[t] = { mp: 0, base: 0, adj: 0 }));
    for (const m of MATCHES) {
      const [bh, ba] = basePoints(m.hg, m.ag);
      const Dh = dCoef(S, m.home, m.away);
      const Da = dCoef(S, m.away, m.home);
      stats[m.home].mp += 1;
      stats[m.away].mp += 1;
      stats[m.home].base += bh;
      stats[m.away].base += ba;
      stats[m.home].adj += bh * Dh;
      stats[m.away].adj += ba * Da;
    }
    return Object.entries(stats)
      .map(([club, v]) => ({
        club,
        mp: v.mp,
        base: +v.base.toFixed(2),
        adj: +v.adj.toFixed(2),
        delta: +(v.adj - v.base).toFixed(2),
      }))
      .sort((a, b) => b.adj - a.adj || b.base - a.base);
  }, [S]);

  // список матчей
  const matchRows = useMemo(() => {
    return MATCHES.map((m) => {
      const [bh, ba] = basePoints(m.hg, m.ag);
      const Dh = dCoef(S, m.home, m.away);
      const Da = dCoef(S, m.away, m.home);
      const sHome = S[m.home], sAway = S[m.away];
      return {
        ...m,
        Dh: +Dh.toFixed(3),
        Da: +Da.toFixed(3),
        homeAdj: +(bh * Dh).toFixed(3),
        awayAdj: +(ba * Da).toFixed(3),
        sHome, sAway,
      };
    });
  }, [S]);

  const navBtn = (key, label) => (
    <button
      onClick={() => setTab(key)}
      style={{
        padding: "8px 14px",
        border: "1px solid #e5e7eb",
        background: tab === key ? "#111827" : "#fff",
        color: tab === key ? "#fff" : "#111827",
        borderRadius: 8,
        fontSize: 14,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ padding: 20, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
      <h1 style={{ marginBottom: 16, fontSize: 26 }}>RPL Fair Table — BAP</h1>

      {/* Навигация вкладок */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {navBtn("table", "Таблица")}
        {navBtn("matches", "Матчи")}
        {navBtn("budgets", "Бюджеты")}
        {navBtn("about", "О проекте")}
      </div>

      {/* TAB: Таблица */}
      {tab === "table" && (
        <section>
          <h2 style={{ fontSize: 22, margin: "8px 0 12px" }}>Турнирная таблица (после 25 матчей)</h2>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <UTable>
              <thead>
                <tr>
                  <TH>#</TH>
                  <TH>Клуб</TH>
                  <TH>Матчей</TH>
                  <TH>Очки (база)</TH>
                  <TH>Очки (adj)</TH>
                  <TH>Δ</TH>
                </tr>
              </thead>
              <tbody>
                {table.map((r, i) => {
                  const top3 = i < 3 ? { background: "#ecfdf5" } : null; // светло-зелёный
                  return (
                    <tr key={r.club} style={top3}>
                      <TD>{i + 1}</TD>
                      <TD>{r.club}</TD>
                      <TD>{r.mp}</TD>
                      <TD>{r.base}</TD>
                      <TD bold>{r.adj}</TD>
                      <TD color={r.delta >= 0 ? "#15803d" : "#b91c1c"}>{r.delta}</TD>
                    </tr>
                  );
                })}
              </tbody>
            </UTable>
          </div>
        </section>
      )}

      {/* TAB: Матчи */}
      {tab === "matches" && (
        <section>
          <h2 style={{ fontSize: 22, margin: "8px 0 12px" }}>Матчи и начисленные очки (BAP)</h2>
          <UTable>
            <thead>
              <tr>
                <TH>Дата</TH>
                <TH>Матч</TH>
                <TH>Счёт</TH>
                <TH>Dh / Da</TH>
                <TH>Очки хозяев (adj)</TH>
                <TH>Очки гостей (adj)</TH>
              </tr>
            </thead>
            <tbody>
              {matchRows.map((m, idx) => (
                <tr key={idx} style={{ background: contrastBgMono(m.sHome, m.sAway) }}>
                  <TD>{m.date}</TD>
                  <TD>{m.home} — {m.away}</TD>
                  <TD>{m.hg}:{m.ag}</TD>
                  <TD>{m.Dh} / {m.Da}</TD>
                  <TD>{m.homeAdj}</TD>
                  <TD>{m.awayAdj}</TD>
                </tr>
              ))}
            </tbody>
          </UTable>
        </section>
      )}

      {/* TAB: Бюджеты */}
      {tab === "budgets" && (
        <section>
          <h2 style={{ fontSize: 22, margin: "8px 0 12px" }}>Бюджеты и сила S</h2>
          <div style={{ maxWidth: 520 }}>
            <UTable>
              <thead>
                <tr>
                  <TH>Клуб</TH>
                  <TH>Бюджет, млрд ₽</TH>
                  <TH>S (0..1)</TH>
                </tr>
              </thead>
              <tbody>
                {Object.entries(BUDGETS)
                  .sort((a, b) => b[1] - a[1])
                  .map(([club, b]) => (
                    <tr key={club}>
                      <TD>{club}</TD>
                      <TD>{b.toFixed(2)}</TD>
                      <TD><SBar s={S[club]} /></TD>
                    </tr>
                  ))}
              </tbody>
            </UTable>
          </div>
        </section>
      )}

      {/* TAB: О проекте */}
      {tab === "about" && (
        <section>
          <h2 style={{ fontSize: 22, margin: "8px 0 12px" }}>О проекте</h2>
          <div style={{ lineHeight: 1.6, color: "#374151", fontSize: 15 }}>
            <p>
              Этот проект показывает альтернативную таблицу РПЛ с поправкой на бюджеты клубов (BAP — Budget Adjusted Points).
              Идея: победы над богатыми соперниками «весят» больше, чем над бедными.
            </p>
            <p>
              Формула матча для команды <b>i</b> против <b>j</b>:
              <code style={{ padding: "0 6px" }}>D = 1 + α·(S<sub>j</sub> − S<sub>i</sub>)</code>,
              где <b>S</b> — сила ресурса (min–max от бюджета в диапазон 0..1), <b>α</b> — чувствительность (здесь 0.4),
              клип значений D — [{CLIP_MIN};{CLIP_MAX}].
            </p>
            <p>
              Начисление очков: берём базовые очки (3/1/0) и умножаем на <b>D</b>.
              В итоге апсеты и равные матчи видны сразу, а сильные клубы не «перекошены» ресурсом.
            </p>
            <p>
              На вкладках сверху можно посмотреть текущую таблицу, список матчей с коэффициентами, а также бюджеты и визуализацию силы <b>S</b>.
              В следующих версиях планируются: онлайн-обновление расписания, ввод счёта прямо на сайте, и сравнение с режимом стартового гандикапа.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
