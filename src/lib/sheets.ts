// Utilities to sync trades and trading days to Google Sheets via Apps Script Web App
// Expects env var VITE_GAS_URL to be configured in your Vite app.

import type { Trade } from "../store/trades";
import { computePnL } from "../store/trades";

// Helper function to convert YYYY-MM-DD to DD-MM-YYYY
const convertDateFormat = (dateStr: string): string => {
  if (!dateStr || !dateStr.includes("-")) return dateStr;
  // Handle both YYYY-MM-DD and full ISO string
  const datePart = dateStr.split("T")[0];
  const parts = datePart.split("-");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

// Helper function to convert DD-MM-YYYY back to YYYY-MM-DD
const convertDateFormatReverse = (dateStr: string): string => {
  if (!dateStr || !dateStr.includes("-")) return dateStr;
  const parts = dateStr.split("-");
  if (
    parts.length === 3 &&
    parts[0].length === 2 &&
    parts[1].length === 2 &&
    parts[2].length === 4
  ) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

// Fallbacks (will be used if env vars are not set)`
const DEFAULT_GAS_URL =
  "https://script.google.com/macros/s/AKfycbytdWuWsGhWhEoRaiuOodqnMCyUC_jG-tYRzLVDe6NaokpwMC0JQDGigq9UIzxzH3PV/exec";
const DEFAULT_SPREADSHEET_ID = "1jfKHZypAhaJVzrQd76okmMipUr7luRFkF5N_q0TKJqo";

const GAS_URL_ENV: string | undefined = (import.meta as any).env?.VITE_GAS_URL;
const SPREADSHEET_ID_ENV: string | undefined = (import.meta as any).env
  ?.VITE_GS_SHEET_ID;
const IS_DEV: boolean = !!(import.meta as any).env?.DEV;
// Shared helper to compute the base Apps Script URL consistently
const GAS_BASE_URL: string = IS_DEV ? "/gs" : GAS_URL_ENV || DEFAULT_GAS_URL;

// In dev, prefer the Vite proxy path '/gs' to bypass CORS unless explicitly overridden by env
const GAS_URL: string = GAS_BASE_URL;
const SPREADSHEET_ID: string = SPREADSHEET_ID_ENV || DEFAULT_SPREADSHEET_ID;
const TRADES_SHEET_NAME_ENV: string | undefined = (import.meta as any).env
  ?.VITE_GS_TRADES_SHEET;
const DEFAULT_TRADES_SHEET: string = TRADES_SHEET_NAME_ENV || "All Record";

if (IS_DEV && !GAS_URL_ENV)
  console.warn(
    `[Sheets Sync] Using ${
      IS_DEV ? "dev proxy /gs" : "fallback GAS_URL"
    }. Set VITE_GAS_URL in .env.local to override.`
  );
if (IS_DEV && !SPREADSHEET_ID_ENV)
  console.warn(
    "[Sheets Sync] Using fallback Spreadsheet ID. Set VITE_GS_SHEET_ID in .env.local to override."
  );

function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 15000,
  externalSignal?: AbortSignal
): Promise<Response> {
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  if (externalSignal) {
    if (externalSignal.aborted) ctrl.abort();
    else externalSignal.addEventListener("abort", onAbort);
  }
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  return fetch(url, { ...options, signal: ctrl.signal }).finally(() => {
    clearTimeout(id);
    if (externalSignal) externalSignal.removeEventListener("abort", onAbort);
  });
}

async function postToAppsScript(
  payload: any,
  action: "insert" | "update" = "insert"
): Promise<void> {
  // GAS_URL is always defined because of fallback above
  const useProxy = GAS_URL.startsWith("/");

  // Convert to form data for Apps Script doPost
  const formData = new URLSearchParams();
  // Use configured/default sheet name
  formData.append("sheetName", DEFAULT_TRADES_SHEET);
  formData.append("action", action);

  let rowData: any[] = [];
  if (payload.type === "trade" && payload.data) {
    // Sheet column order (as per your screenshot):
    // [Timestamp, Serial No., Entry date, Exit date, Instrument, side, Entry, Exit, Qty, P&L, Strategy, Trading Result, Stoploss, takeprofit, Risk in rs, Risk in %, notes]
    // For insert, both Timestamp and Serial No. are auto-filled by the backend when blank.
    // For update, we send the current timestamp to update the last modified time, and Serial No. (id) to locate the row.
    const pnlValue = payload.data.pnl || 0;
    const tradingResult =
      pnlValue > 0 ? "Win" : pnlValue < 0 ? "Loss" : "Breakeven";

    rowData = [
      action === "update"
        ? new Date().toISOString().slice(0, 19).replace("T", " ")
        : "", // Timestamp (current for update, auto for insert)
      action === "update" ? payload.data.id : "", // Serial No. (use id for update to find the row)
      payload.data.date || "", // Entry date
      payload.data.exitDate || "", // Exit date
      payload.data.instrument || "", // Instrument
      payload.data.side || "", // side (Buy/Sell/Long/Short)
      payload.data.entryPrice || "", // Entry
      payload.data.exitPrice || "", // Exit
      payload.data.quantity || "", // Qty
      pnlValue, // P&L
      payload.data.strategy || "", // Strategy
      tradingResult, // Trading Result
      payload.data.stopLoss || "", // Stoploss
      payload.data.takeProfit || "", // takeprofit
      payload.data.riskAmount || "", // Risk in rs
      payload.data.riskPercent || "", // Risk in %
      payload.data.notes || "", // notes
    ];
  } else if (payload.type === "day" && payload.data) {
    // Insert trading day snapshot into the same columns as a trade row (17+ columns):
    rowData = [
      action === "update"
        ? new Date().toISOString().slice(0, 19).replace("T", " ")
        : "", // Timestamp (current for update, auto for insert)
      "", // Serial No. (auto for insert, use id for update to find the row)
      "", // Entry date
      "", // Exit date
      "", // Instrument
      "", // side
      "", // Entry
      "", // Exit
      "", // Qty
      "", // P&L
      "", // Strategy
      "", // Trading Result
      "", // Stoploss
      "", // takeprofit
      "", // Risk in rs
      "", // Risk in %
      "", // notes
    ];
    const d = payload.data;
    const entryDate = d.date || "";
    const exitDate = d.date || "";
    const instrument = d.instrument || "";
    const side = d.side || "";
    const entry = d.entryPrice ?? "";
    const exit = d.exitPrice ?? "";
    const qty = d.quantity ?? "";
    const pnlValue =
      typeof d.netMtm === "number" && typeof d.brokerage === "number"
        ? d.netMtm - d.brokerage
        : typeof d.netMtm === "number"
        ? d.netMtm
        : 0;
    const strategy = d.strategy || "";
    const tradingResult =
      d.result === "profit"
        ? "Win"
        : d.result === "loss"
        ? "Loss"
        : d.result === "breakeven"
        ? "Breakeven"
        : "";
    const notes = d.notes || "";

    rowData = [
      action === "update"
        ? new Date().toISOString().slice(0, 19).replace("T", " ")
        : "", // Timestamp (current for update, auto for insert)
      "", // Serial No. (auto-filled by backend)
      entryDate, // Entry date
      exitDate, // Exit date
      instrument, // Instrument
      side, // side
      entry, // Entry
      exit, // Exit
      qty, // Qty
      pnlValue, // P&L
      strategy, // Strategy
      tradingResult, // Trading Result
      "", // Stoploss
      "", // takeprofit
      "", // Risk in rs
      "", // Risk in %
      notes, // notes
    ];
  }

  formData.append("rowData", JSON.stringify(rowData));

  try {
    console.log("[Sheets Sync] Submitting", {
      type: payload?.type,
      url: GAS_URL,
      sheetName: DEFAULT_TRADES_SHEET,
      action,
    });
    if (IS_DEV) console.log("[Sheets Sync] Row data (dev)", rowData);

    const res = await fetchWithTimeout(
      GAS_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
        ...(useProxy ? ({} as RequestInit) : { mode: "cors" as const }),
      },
      15000
    );

    if (!res.ok) {
      console.warn(
        "[Sheets Sync] Non-OK response",
        res.status,
        await safeText(res)
      );
    } else {
      const txt = await safeText(res);
      console.log("[Sheets Sync] OK", { status: res.status, body: txt });
    }
  } catch (err) {
    if (useProxy) {
      console.warn("[Sheets Sync] Proxy request failed:", err);
      return;
    }
    console.warn(
      "[Sheets Sync] CORS or network error, retrying with no-cors (opaque):",
      err
    );
    try {
      await fetchWithTimeout(
        GAS_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
          mode: "no-cors",
        },
        15000
      );
      console.log(
        "[Sheets Sync] Sent in no-cors (opaque). Request dispatched; response not readable due to browser CORS."
      );
    } catch (err2) {
      console.warn("[Sheets Sync] Failed to sync even with no-cors:", err2);
    }
  }
}

async function safeText(res: Response) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

export async function syncTradeToSheet(
  trade: Trade,
  action: "insert" | "update" = "insert"
): Promise<void> {
  const payload = {
    type: "trade",
    timestamp: new Date().toISOString(),
    spreadsheetId: SPREADSHEET_ID,
    data: {
      id: trade.id,
      date: convertDateFormat(trade.date), // Convert to DD-MM-YYYY for Google Apps Script
      exitDate: trade.exitDate ? convertDateFormat(trade.exitDate) : "", // Convert exit date too
      instrument: trade.instrument,
      side: trade.side,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      quantity: trade.quantity,
      stopLoss: trade.stopLoss ?? "",
      takeProfit: trade.takeProfit ?? "",
      riskAmount: trade.riskAmount ?? "",
      riskPercent: trade.riskPercent ?? "",
      strategy: trade.strategy ?? "",
      entryReason: "",
      exitReason: "",
      screenshotName: undefined,
      tags: [],
      notes: trade.notes ?? "",
      pnl: computePnL(trade),
    },
  };
  await postToAppsScript(payload, action);
}

export type TradingDayForSheet = {
  id: string;
  date: string;
  tradesCount: number;
  symbols: string[];
  result: "profit" | "loss" | "breakeven" | "open";
  netMtm: number;
  brokerage: number;
  strategies: string[];
  notes?: string;
  // optional trade snapshot
  instrument?: string;
  side?: "Buy" | "Sell" | "Long" | "Short";
  entryPrice?: number;
  exitPrice?: number;
  quantity?: number;
  strategy?: string;
  tags?: string[];
};

export async function syncTradingDayToSheet(
  rec: TradingDayForSheet
): Promise<void> {
  const payload = {
    type: "day",
    timestamp: new Date().toISOString(),
    spreadsheetId: SPREADSHEET_ID,
    data: {
      id: rec.id,
      date: convertDateFormat(rec.date), // Convert to DD-MM-YYYY for Google Apps Script
      tradesCount: rec.tradesCount,
      symbols: rec.symbols.join(","),
      result: rec.result,
      netMtm: rec.netMtm,
      brokerage: rec.brokerage,
      strategies: rec.strategies.join(","),
      notes: rec.notes ?? "",
      instrument: rec.instrument ?? "",
      side: rec.side ?? "",
      entryPrice: rec.entryPrice ?? "",
      exitPrice: rec.exitPrice ?? "",
      quantity: rec.quantity ?? "",
      strategy: rec.strategy ?? "",
      tags: (rec.tags ?? []).join(","),
    },
  };
  await postToAppsScript(payload, "insert");
}

export interface TradeData {
  id: string;
  symbol: string;
  action: "buy" | "sell";
  quantity: number | string;
  price: number | string; // fallback field if entry/exit not provided
  entryPrice?: number | string;
  exitPrice?: number | string;
  timestamp: string;
  notes?: string;
  side?: "Buy" | "Sell" | "Long" | "Short";
  stopLoss?: string | number;
  takeProfit?: string | number;
  riskAmount?: string | number;
  riskPercent?: string | number;
  strategy?: string;
  entryReason?: string;
  exitReason?: string;
  screenshotName?: string;
  tags?: string[];
}

export const fetchTradesFromSheet = async (opts?: {
  signal?: AbortSignal;
  timeoutMs?: number;
  tradeDate?: string;
}): Promise<Trade[]> => {
  const isDev = !!import.meta.env.DEV;
  // In dev, use the '/gs' proxy which rewrites to the fixed exec URL in vite.config.ts
  // In prod, call the full exec URL directly and only append the query string (with fallback)
  const url = isDev
    ? `/gs?action=getTrades`
    : `${GAS_BASE_URL}?action=getTrades`;

  if (isDev) console.log("[Sheets] GET", url);

  const response = await fetchWithTimeout(
    url,
    {
      method: "GET",
      // Avoid setting non-simple headers on GET to prevent CORS preflight in browsers
    },
    opts?.timeoutMs ?? 15000,
    opts?.signal
  );

  if (!response.ok) {
    const body = await safeText(response);
    if (isDev) console.error("[Sheets] Non-OK response", response.status, body);
    throw new Error(`Failed to fetch trades: ${response.status}`);
  }

  const resClone = response.clone();
  let data: any;
  try {
    data = await response.json();
  } catch (e) {
    const body = await safeText(resClone);
    if (isDev) console.error("[Sheets] Invalid JSON response", e, body);
    throw new Error("Invalid JSON returned from Sheets");
  }

  if (isDev) {
    try {
      const keys = data && typeof data === "object" ? Object.keys(data) : [];
      console.debug("[Sheets] JSON shape", {
        type: Array.isArray(data) ? "array" : typeof data,
        keys,
        preview: Array.isArray(data) ? data.slice(0, 2) : data,
      });
    } catch {}
  }

  // Dev fallback: some Apps Script templates return a placeholder {status:"ready"}
  // Treat this as no data to avoid crashing the UI while backend is being fixed
  if (data?.status === "ready" && !Array.isArray(data)) {
    if (isDev)
      console.warn(
        "[Sheets] Backend returned placeholder status=ready; returning empty trades array",
        data
      );
    return [];
  }

  // Normalize possible shapes: array | {data: []} | {trades: []} | {items: []} | {rows: []}
  const arr: any[] | null = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.trades)
    ? data.trades
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.rows)
    ? data.rows
    : null;

  if (!arr) {
    if (isDev)
      console.error("[Sheets] Unexpected response shape, expected array", data);
    throw new Error("Invalid response shape from Sheets (expected an array)");
  }

  // Helper to coerce values (strips %, currency symbols, commas, spaces)
  const toNum = (v: any, def = 0) => {
    if (typeof v === "number") return Number.isFinite(v) ? v : def;
    const s = String(v ?? "").trim();
    if (!s) return def;
    // keep digits, dot, + and -; remove everything else (₹, $, commas, % etc.)
    const cleaned = s.replace(/[^\d.+-]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : def;
  };

  // Map various possible row shapes to Trade
  const parseTradeRow = (row: any): Trade => {
    // Case 1: Header-based object from the new sheet columns
    // Headers: ['Sl no','Timestamp','Entry date','Exit date','Instrument','side','Entry','Exit','Qty','P&L','Strategy','Trading Result','Stoploss','takeprofit','Risk in rs','Risk in %','notes']
    if (
      row &&
      typeof row === "object" &&
      !Array.isArray(row) &&
      ("Instrument" in row ||
        "Entry date" in row ||
        "Entry Date" in row ||
        "side" in row ||
        "Side" in row)
    ) {
      // Support both old and new header spellings/casing
      const entryDate = String(
        row["Entry date"] ?? row["Entry Date"] ?? row["entry_date"] ?? ""
      );
      const exitDateStr = String(
        row["Exit date"] ?? row["Exit Date"] ?? row["exit_date"] ?? ""
      );
      const timestamp = String(row["Timestamp"] ?? row["timestamp"] ?? "");
      // Always use Entry date for charting/grouping, not submission Timestamp
      const dateStr = convertDateFormatReverse(entryDate); // Convert DD-MM-YYYY back to YYYY-MM-DD
      const instrument = String(row["Instrument"] ?? row["instrument"] ?? "");
      const sideRaw = String(row["Side"] ?? row["side"] ?? "Buy");
      const side =
        sideRaw.toLowerCase() === "buy" || sideRaw.toLowerCase() === "long"
          ? "Buy"
          : sideRaw.toLowerCase() === "short"
          ? "Short"
          : "Sell";
      const entryPrice = toNum(
        row["Entry"] ?? row["Entry Price"] ?? row["entry"]
      );
      const exitPrice = toNum(row["Exit"] ?? row["Exit Price"] ?? row["exit"]);
      const quantity = Math.max(0, Math.floor(toNum(row["Qty"] ?? row["qty"])));
      const stopLoss =
        row["Stoploss"] != null ? toNum(row["Stoploss"]) : undefined;
      const takeProfit =
        row["takeprofit"] != null
          ? toNum(row["takeprofit"])
          : row["Takeprofit"] != null
          ? toNum(row["Takeprofit"])
          : undefined;
      const riskAmount =
        row["Risk in rs"] != null
          ? toNum(row["Risk in rs"])
          : row["Risk (₹)"] != null
          ? toNum(row["Risk (₹)"])
          : undefined;
      const riskPercent =
        row["Risk in %"] != null
          ? toNum(row["Risk in %"])
          : row["Risk (%)"] != null
          ? toNum(row["Risk (%)"])
          : undefined;
      const strategy = String(row["Strategy"] ?? row["strategy"] ?? "");
      const notes = String(row["Notes"] ?? row["notes"] ?? "");
      const id = String(
        row["Sl no"] ??
          row["Sl. No"] ??
          row["sl_no"] ??
          `${instrument}-${dateStr || Date.now()}`
      );
      return {
        id,
        // Append local time to avoid UTC parsing shifting the date in charts
        date: dateStr ? `${dateStr}T00:00:00` : dateStr,
        sheetTimestamp: timestamp || "",
        exitDate: exitDateStr
          ? convertDateFormatReverse(exitDateStr)
          : undefined, // Convert exit date back to YYYY-MM-DD
        instrument,
        side: side as Trade["side"],
        entryPrice,
        exitPrice,
        quantity,
        stopLoss,
        takeProfit,
        riskAmount,
        riskPercent,
        strategy,
        entryReason: "",
        exitReason: "",
        screenshotName: undefined,
        tags: [],
        notes,
      } as Trade;
    }

    // Case 2: Array row in the exact new order (length >= 17)
    if (Array.isArray(row) && row.length >= 17) {
      const [
        slno,
        ts,
        entryDate,
        exitDate,
        instrument,
        sideRaw,
        entry,
        exit,
        qty,
        _pnl,
        strategy,
        _result,
        sl,
        tp,
        riskRs,
        riskPct,
        notes,
      ] = row;
      const side =
        String(sideRaw).toLowerCase() === "buy" ||
        String(sideRaw).toLowerCase() === "long"
          ? "Buy"
          : String(sideRaw).toLowerCase() === "short"
          ? "Short"
          : "Sell";
      return {
        id: String(slno ?? `${instrument}-${ts ?? entryDate ?? Date.now()}`),
        // Append local time to avoid UTC parsing shifting the date in charts
        date: (() => {
          const base = String(convertDateFormatReverse(entryDate) || "");
          return base ? `${base}T00:00:00` : base;
        })(), // Convert entry date back to YYYY-MM-DD
        sheetTimestamp: String(ts || ""),
        exitDate: String(exitDate || "")
          ? convertDateFormatReverse(String(exitDate))
          : undefined, // Convert exit date back to YYYY-MM-DD
        instrument: String(instrument || ""),
        side: side as Trade["side"],
        entryPrice: toNum(entry),
        exitPrice: toNum(exit),
        quantity: Math.max(0, Math.floor(toNum(qty))),
        stopLoss: sl != null ? toNum(sl) : undefined,
        takeProfit: tp != null ? toNum(tp) : undefined,
        riskAmount: riskRs != null ? toNum(riskRs) : undefined,
        riskPercent: riskPct != null ? toNum(riskPct) : undefined,
        strategy: String(strategy || ""),
        entryReason: "",
        exitReason: "",
        screenshotName: undefined,
        tags: [],
        notes: String(notes || ""),
      } as Trade;
    }

    // Case 3: Backward-compatible TradeData object
    const trade = row as TradeData;
    const entry = toNum((trade as any).entryPrice ?? trade.price ?? 0);
    const exit = toNum((trade as any).exitPrice ?? trade.price ?? 0);
    const qty = toNum(trade.quantity ?? 0);
    const side =
      trade.action === "buy"
        ? "Buy"
        : trade.action === "sell"
        ? "Sell"
        : trade.side ?? "Buy";
    return {
      id: trade.id ?? `${trade.symbol}-${trade.timestamp}`,
      // If timestamp is YYYY-MM-DD, append local time to avoid UTC shift in charts
      date: /^\d{4}-\d{2}-\d{2}$/.test(String(trade.timestamp))
        ? `${trade.timestamp}T00:00:00`
        : trade.timestamp,
      sheetTimestamp: String(trade.timestamp || ""),
      exitDate: (trade as any).exitDate
        ? String((trade as any).exitDate)
        : undefined,
      instrument: trade.symbol,
      side: side as Trade["side"],
      entryPrice: Number.isFinite(entry) ? entry : 0,
      exitPrice: Number.isFinite(exit) ? exit : 0,
      quantity: Number.isFinite(qty) ? qty : 0,
      stopLoss: trade.stopLoss != null ? toNum(trade.stopLoss) : undefined,
      takeProfit:
        trade.takeProfit != null ? toNum(trade.takeProfit) : undefined,
      riskAmount:
        trade.riskAmount != null ? toNum(trade.riskAmount) : undefined,
      riskPercent:
        trade.riskPercent != null ? toNum(trade.riskPercent) : undefined,
      strategy: trade.strategy || "",
      entryReason: trade.entryReason || "",
      exitReason: trade.exitReason || "",
      screenshotName: trade.screenshotName || undefined,
      tags: trade.tags || [],
      notes: trade.notes || "",
    } as Trade;
  };

  return arr.map(parseTradeRow);
};

// Top Movers types and fetcher
export interface TopMover {
  symbol: string;
  name?: string;
  price: number | string; // allow backend numeric, UI can format
  change: string; // e.g. "+1.20%" or "-0.54%"
  changePercent?: number; // numeric variant if available
  trend?: "up" | "down";
  updatedAt?: string; // ISO string
}

export const fetchTopMoversFromSheet = async (opts?: {
  signal?: AbortSignal;
  timeoutMs?: number;
  sheet?: string;
}): Promise<TopMover[]> => {
  const isDev = !!import.meta.env.DEV;
  const sheet = opts?.sheet ? `&sheet=${encodeURIComponent(opts.sheet)}` : "";
  const url = isDev
    ? `/gs?action=getTopMovers${sheet}`
    : `${GAS_BASE_URL}?action=getTopMovers${sheet}`;

  if (isDev) console.log("[Sheets] GET", url);

  const response = await fetchWithTimeout(
    url,
    { method: "GET" },
    opts?.timeoutMs ?? 15000,
    opts?.signal
  );

  if (!response.ok) {
    const body = await safeText(response);
    if (isDev)
      console.error("[Sheets] TopMovers non-OK", response.status, body);
    throw new Error(`Failed to fetch top movers: ${response.status}`);
  }

  const resClone = response.clone();
  let data: any;
  try {
    data = await response.json();
  } catch (e) {
    const body = await safeText(resClone);
    if (isDev) console.error("[Sheets] TopMovers invalid JSON", e, body);
    throw new Error("Invalid JSON returned from Sheets (TopMovers)");
  }

  if (data?.status === "ready" && !Array.isArray(data)) {
    if (isDev)
      console.warn(
        "[Sheets] Backend returned placeholder status=ready; returning empty movers array",
        data
      );
    return [];
  }

  // Normalize shapes: array | {data: []} | {items: []} | {movers: []} | {rows: []}
  const arr: any[] | null = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.movers)
    ? data.movers
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.rows)
    ? data.rows
    : null;

  if (!arr) {
    if (isDev)
      console.error("[Sheets] Unexpected TopMovers response shape", data);
    throw new Error("Invalid response shape from Sheets (TopMovers)");
  }

  return arr.map((row: any) => {
    const symbol = String(
      row.symbol ?? row.Symbol ?? row.ticker ?? row.Ticker ?? ""
    );
    const name = row.name ?? row.Name ?? row.company ?? row.Company ?? "";
    const priceVal = row.price ?? row.Price ?? row.LTP ?? row.Close ?? 0;
    const price = typeof priceVal === "number" ? priceVal : Number(priceVal);
    const changeStrRaw = row.change ?? row.Change ?? "";
    const changePctVal =
      row.changePercent ??
      row.ChangePercent ??
      row["Change %"] ??
      row["Change%"] ??
      row["Pct Change"] ??
      row["1D%"];
    const changePercent =
      typeof changePctVal === "number" ? changePctVal : Number(changePctVal);
    const change =
      typeof changeStrRaw === "string" && changeStrRaw.includes("%")
        ? changeStrRaw
        : Number.isFinite(changePercent)
        ? `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`
        : "";
    const trendRaw = (row.trend ?? row.Trend ?? "").toString().toLowerCase();
    const trend: "up" | "down" = trendRaw
      ? trendRaw === "down" || trendRaw === "neg" || trendRaw === "bearish"
        ? "down"
        : "up"
      : Number(changePercent) < 0 ||
        (typeof change === "string" && change.trim().charAt(0) === "-")
      ? "down"
      : "up";
    const updatedAt = row.updatedAt ?? row.UpdatedAt ?? row["Updated At"] ?? "";
    return {
      symbol,
      name,
      price: Number.isFinite(price) ? price : 0,
      change,
      changePercent: Number.isFinite(changePercent) ? changePercent : undefined,
      trend,
      updatedAt:
        typeof updatedAt === "string"
          ? updatedAt
          : updatedAt
          ? new Date(updatedAt).toISOString()
          : "",
    } as TopMover;
  });
};

export interface TopProfit {
  symbol: string;
  name?: string;
  profit: number | string;
  profitPercent?: number;
  tradesCount?: number;
  avgWin?: number | string;
  updatedAt?: string;
}

export interface PortfolioStats {
  totalPositions: number;
  totalTrades: number;
  totalRealizedPnl: number;
  grossOpenExposure: number;
  totalPortfolioValue?: number;
  openPositionsMarketValue?: number;
  netUnrealizedPnl?: number;
  uniqueStocksCount?: number;
  lastUpdated?: string;
}

export const safeJson = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

export const fetchTopProfitFromSheet = async (opts?: {
  signal?: AbortSignal;
  timeoutMs?: number;
  sheet?: string;
}): Promise<TopProfit[]> => {
  const isDev = !!import.meta.env.DEV;
  const sheet = opts?.sheet ? `&sheet=${encodeURIComponent(opts.sheet)}` : "";
  const url = isDev
    ? `/gs?action=getTopProfit${sheet}`
    : `${GAS_BASE_URL}?action=getTopProfit${sheet}`;

  if (isDev) console.log("[Sheets] GET", url);

  const response = await fetchWithTimeout(
    url,
    { method: "GET" },
    opts?.timeoutMs ?? 15000,
    opts?.signal
  );

  if (!response.ok) {
    const body = await safeText(response);
    if (isDev)
      console.error("[Sheets] TopProfit non-OK", response.status, body);
    throw new Error(`Failed to fetch top profit: ${response.status}`);
  }

  const data = await safeJson(response);

  // Normalize response shapes
  const arr = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
    ? data
    : [];

  return arr.map((row: any) => ({
    symbol: String(row.symbol ?? ""),
    name: row.name ?? "",
    profit: Number(row.profit ?? 0),
    profitPercent: Number(row.profitPercent ?? 0),
    tradesCount: Number(row.tradesCount ?? 0),
    avgWin: Number(row.avgWin ?? 0),
    updatedAt: row.updatedAt ?? "",
  }));
};

export const fetchPortfolioStats = async (opts?: {
  signal?: AbortSignal;
  timeoutMs?: number;
  sheet?: string;
}): Promise<PortfolioStats> => {
  const isDev = !!import.meta.env.DEV;
  const sheetName = opts?.sheet ?? DEFAULT_TRADES_SHEET;
  const sheet = sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : "";
  const url = isDev
    ? `/gs?action=getPortfolioStats${sheet}`
    : `${GAS_BASE_URL}?action=getPortfolioStats${sheet}`;

  // First attempt
  let response: Response | null = null;
  try {
    response = await fetchWithTimeout(
      url,
      { method: "GET" },
      opts?.timeoutMs ?? 15000,
      opts?.signal
    );
  } catch (e: any) {
    // Retry once on timeout/abort/network errors with longer timeout
    const isAbort = e?.name === "AbortError";
    const isNetwork =
      e?.name === "TypeError" ||
      String(e?.message || "")
        .toLowerCase()
        .includes("network");
    if (isAbort || isNetwork) {
      console.warn(
        "[Sheets] Portfolio stats fetch aborted/failed, retrying once with longer timeout...",
        e?.message || e
      );
      response = await fetchWithTimeout(
        url,
        { method: "GET" },
        Math.max(20000, (opts?.timeoutMs ?? 15000) + 5000),
        opts?.signal
      );
    } else {
      throw e;
    }
  }

  if (!response || !response.ok) {
    const body = await safeText(response);
    throw new Error(
      `Failed to fetch portfolio stats: ${response.status} ${body}`
    );
  }

  const data = await safeJson(response);
  const d = (data as any)?.data ?? data ?? {};
  return {
    totalPositions: Number(d.totalPositions ?? 0),
    totalTrades: Number(d.totalTrades ?? 0),
    totalRealizedPnl: Number(d.totalRealizedPnl ?? 0),
    grossOpenExposure: Number(d.grossOpenExposure ?? 0),
    totalPortfolioValue: Number(d.totalPortfolioValue ?? 0),
    openPositionsMarketValue: Number(d.openPositionsMarketValue ?? 0),
    netUnrealizedPnl: Number(d.netUnrealizedPnl ?? 0),
    uniqueStocksCount: Number(d.uniqueStocksCount ?? 0),
    lastUpdated: d.lastUpdated || "",
  } as PortfolioStats;
};

export interface TradingDayStats {
  best: {
    date: string;
    pnl: number;
  };
  worst: {
    date: string;
    pnl: number;
  };
  monthlyPnl: number;
  todayPnl: number;
}

export const fetchTradingDayStats = async (opts?: {
  signal?: AbortSignal;
  timeoutMs?: number;
  sheet?: string;
}): Promise<TradingDayStats> => {
  console.log("[Sheets] Fetching trading day stats");
  try {
    const isDev = !!import.meta.env.DEV;
    const sheetName = opts?.sheet ?? DEFAULT_TRADES_SHEET;
    const sheet = sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : "";
    const url = isDev
      ? `/gs?action=getTradingDayStats${sheet}`
      : `${GAS_BASE_URL}?action=getTradingDayStats${sheet}`;

    console.log("[Sheets] Request URL:", url);

    // First attempt
    let response: Response | null = null;
    try {
      response = await fetchWithTimeout(
        url,
        { method: "GET" },
        opts?.timeoutMs ?? 15000,
        opts?.signal
      );
    } catch (e: any) {
      // Retry once on timeout/abort/network errors with longer timeout
      const isAbort = e?.name === "AbortError";
      const isNetwork =
        e?.name === "TypeError" ||
        String(e?.message || "")
          .toLowerCase()
          .includes("network");
      if (isAbort || isNetwork) {
        console.warn(
          "[Sheets] Trading stats fetch aborted/failed, retrying once with longer timeout...",
          e?.message || e
        );
        response = await fetchWithTimeout(
          url,
          { method: "GET" },
          Math.max(20000, (opts?.timeoutMs ?? 15000) + 5000),
          opts?.signal
        );
      } else {
        throw e;
      }
    }

    if (!response || !response.ok) {
      const body = await safeText(response);
      console.error("[Sheets] Trading stats failed:", response.status, body);
      throw new Error(
        `Failed to fetch trading stats: ${response.status} ${body}`
      );
    }

    const raw = await safeJson(response);
    console.log("[Sheets] Received trading stats:", raw);

    if ((raw as any)?.status === "ready") {
      if (isDev)
        console.warn(
          "[Sheets] Backend returned placeholder status=ready; using empty trading stats"
        );
    }

    const payload = (raw as any)?.data ?? raw ?? {};

    const best = payload?.best
      ? {
          date: convertDateFormatReverse(String(payload.best.date ?? "")), // Convert DD-MM-YYYY back to YYYY-MM-DD
          pnl: Number(payload.best.pnl ?? 0),
        }
      : { date: "", pnl: 0 };

    const worst = payload?.worst
      ? {
          date: convertDateFormatReverse(String(payload.worst.date ?? "")), // Convert DD-MM-YYYY back to YYYY-MM-DD
          pnl: Number(payload.worst.pnl ?? 0),
        }
      : { date: "", pnl: 0 };

    return {
      best,
      worst,
      monthlyPnl: Number(payload?.monthlyPnl ?? 0),
      todayPnl: Number(payload?.todayPnl ?? 0),
    };
  } catch (e) {
    console.error("[Sheets] Error fetching trading stats:", e);
    throw e;
  }
};

// ===== OTP Helpers =====
export interface OtpSendResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface OtpVerifyResult {
  success: boolean;
  email?: string;
  name?: string;
  error?: string;
  attemptsLeft?: number;
}

// ===== User Profile (LoginMaster) =====
export interface UserProfile {
  success: boolean;
  email?: string;
  userId?: string;
  name?: string;
  bio?: string;
  error?: string;
}

export const fetchUserProfileFromSheet = async (
  email: string,
  opts?: { signal?: AbortSignal; timeoutMs?: number }
): Promise<UserProfile> => {
  const isDev = !!import.meta.env.DEV;
  const url = isDev
    ? `/gs?action=getUserProfile&email=${encodeURIComponent(email)}`
    : `${GAS_BASE_URL}?action=getUserProfile&email=${encodeURIComponent(
        email
      )}`;
  const res = await fetchWithTimeout(
    url,
    { method: "GET" },
    opts?.timeoutMs ?? 15000,
    opts?.signal
  );
  if (!res.ok) {
    return { success: false, error: `HTTP ${res.status}` };
  }
  const data = await safeJson(res);
  return {
    success: Boolean((data as any)?.success),
    email: (data as any)?.email,
    userId: (data as any)?.userId,
    name: (data as any)?.name,
    bio: (data as any)?.bio,
    error: (data as any)?.error,
  } as UserProfile;
};

export const sendOtp = async (
  email: string,
  opts?: { signal?: AbortSignal; timeoutMs?: number }
): Promise<OtpSendResult> => {
  const isDev = !!import.meta.env.DEV;
  const url = isDev
    ? `/gs?action=sendOtp&email=${encodeURIComponent(email)}`
    : `${GAS_BASE_URL}?action=sendOtp&email=${encodeURIComponent(email)}`;
  const res = await fetchWithTimeout(
    url,
    { method: "GET" },
    opts?.timeoutMs ?? 15000,
    opts?.signal
  );
  const data = await safeJson(res);
  return {
    success: Boolean((data as any)?.success),
    message: (data as any)?.message,
    error: (data as any)?.error,
  } as OtpSendResult;
};

export const verifyOtp = async (
  email: string,
  code: string,
  opts?: { signal?: AbortSignal; timeoutMs?: number }
): Promise<OtpVerifyResult> => {
  const isDev = !!import.meta.env.DEV;
  const url = isDev
    ? `/gs?action=verifyOtp&email=${encodeURIComponent(
        email
      )}&code=${encodeURIComponent(code)}`
    : `${GAS_BASE_URL}?action=verifyOtp&email=${encodeURIComponent(
        email
      )}&code=${encodeURIComponent(code)}`;
  const res = await fetchWithTimeout(
    url,
    { method: "GET" },
    opts?.timeoutMs ?? 15000,
    opts?.signal
  );
  const data = await safeJson(res);
  return {
    success: Boolean((data as any)?.success),
    email: (data as any)?.email,
    name: (data as any)?.name,
    error: (data as any)?.error,
    attemptsLeft: (data as any)?.attemptsLeft,
  } as OtpVerifyResult;
};

// ===== Phone-based OTP helpers (SMS) =====
export const sendOtpPhone = async (
  phone: string,
  opts?: { signal?: AbortSignal; timeoutMs?: number }
): Promise<OtpSendResult> => {
  const isDev = !!import.meta.env.DEV;
  const url = isDev
    ? `/gs?action=sendOtpPhone&phone=${encodeURIComponent(phone)}`
    : `${GAS_BASE_URL}?action=sendOtpPhone&phone=${encodeURIComponent(phone)}`;
  const res = await fetchWithTimeout(
    url,
    { method: "GET" },
    opts?.timeoutMs ?? 15000,
    opts?.signal
  );
  const data = await safeJson(res);
  return {
    success: Boolean((data as any)?.success),
    message: (data as any)?.message,
    error: (data as any)?.error,
  } as OtpSendResult;
};

export const verifyOtpPhone = async (
  phone: string,
  code: string,
  opts?: { signal?: AbortSignal; timeoutMs?: number }
): Promise<OtpVerifyResult> => {
  const isDev = !!import.meta.env.DEV;
  const url = isDev
    ? `/gs?action=verifyOtpPhone&phone=${encodeURIComponent(
        phone
      )}&code=${encodeURIComponent(code)}`
    : `${GAS_BASE_URL}?action=verifyOtpPhone&phone=${encodeURIComponent(
        phone
      )}&code=${encodeURIComponent(code)}`;
  const res = await fetchWithTimeout(
    url,
    { method: "GET" },
    opts?.timeoutMs ?? 15000,
    opts?.signal
  );
  const data = await safeJson(res);
  return {
    success: Boolean((data as any)?.success),
    email: (data as any)?.email,
    name: (data as any)?.name,
    error: (data as any)?.error,
    attemptsLeft: (data as any)?.attemptsLeft,
  } as OtpVerifyResult;
};

// ===== Password + OTP Login helpers =====
export const loginWithPassword = async (
  email: string,
  password: string,
  opts?: { signal?: AbortSignal; timeoutMs?: number }
): Promise<{ success: boolean; message?: string; error?: string }> => {
  const isDev = !!import.meta.env.DEV;
  const url = isDev
    ? `/gs?action=loginWithPassword&email=${encodeURIComponent(
        email
      )}&password=${encodeURIComponent(password)}`
    : `${GAS_BASE_URL}?action=loginWithPassword&email=${encodeURIComponent(
        email
      )}&password=${encodeURIComponent(password)}`;
  const res = await fetchWithTimeout(
    url,
    { method: "GET" },
    opts?.timeoutMs ?? 15000,
    opts?.signal
  );
  if (!res.ok) {
    const body = await safeText(res);
    if (import.meta.env.DEV)
      console.warn(
        "[Login] loginWithPassword non-OK",
        res.status,
        body?.slice(0, 180)
      );
    return {
      success: false,
      error: `HTTP ${res.status} while contacting backend`,
    };
  }
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const body = await safeText(res);
    if (import.meta.env.DEV)
      console.warn(
        "[Login] loginWithPassword non-JSON response. First 180 chars:",
        body.slice(0, 180)
      );
    return {
      success: false,
      error:
        "Backend returned non-JSON (check Web App access: Execute as Me; Anyone)",
    };
  }
  const data = await safeJson(res);
  return {
    success: Boolean((data as any)?.success),
    message: (data as any)?.message,
    error: (data as any)?.error,
  };
};

export const verifyLogin = async (
  email: string,
  code: string,
  opts?: { signal?: AbortSignal; timeoutMs?: number }
): Promise<{
  success: boolean;
  token?: string;
  email?: string;
  message?: string;
  error?: string;
}> => {
  const isDev = !!import.meta.env.DEV;
  const gasUrl = import.meta.env.VITE_GAS_URL as string | undefined;
  if (!isDev && !gasUrl) throw new Error("Missing VITE_GAS_URL");
  const url = isDev
    ? `/gs?action=verifyLogin&email=${encodeURIComponent(
        email
      )}&code=${encodeURIComponent(code)}`
    : `${gasUrl}?action=verifyLogin&email=${encodeURIComponent(
        email
      )}&code=${encodeURIComponent(code)}`;
  const res = await fetchWithTimeout(
    url,
    { method: "GET" },
    opts?.timeoutMs ?? 15000,
    opts?.signal
  );
  if (!res.ok) {
    const body = await safeText(res);
    if (import.meta.env.DEV)
      console.warn(
        "[Login] verifyLogin non-OK",
        res.status,
        body?.slice(0, 180)
      );
    return {
      success: false,
      error: `HTTP ${res.status} while contacting backend`,
    };
  }
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const body = await safeText(res);
    if (import.meta.env.DEV)
      console.warn(
        "[Login] verifyLogin non-JSON response. First 180 chars:",
        body.slice(0, 180)
      );
    return {
      success: false,
      error:
        "Backend returned non-JSON (check Web App access: Execute as Me; Anyone)",
    };
  }
  const data = await safeJson(res);
  return {
    success: Boolean((data as any)?.success),
    email: (data as any)?.email,
    token: (data as any)?.token,
    message: (data as any)?.message,
    error: (data as any)?.error,
  };
};

export async function updatePassword(
  email: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const isDev = !!import.meta.env.DEV;
  try {
    if (isDev) console.log("[Password] Updating password for:", email);

    const response = await fetchWithTimeout(
      `${GAS_BASE_URL}?action=updatePassword&email=${encodeURIComponent(
        email
      )}&newPassword=${encodeURIComponent(newPassword)}`,
      {
        method: "GET",
      },
      15000
    ); // 15 second timeout

    if (!response.ok) {
      const errorText = await safeText(response);
      if (isDev)
        console.error("[Password] Update failed:", response.status, errorText);

      // Check if response is HTML (indicates backend error)
      if (errorText.includes("<!doctype") || errorText.includes("<html")) {
        return {
          success: false,
          error:
            "Google Apps Script backend error. Please check if the updatePassword action exists in your Google Apps Script.",
        };
      }

      return {
        success: false,
        error: `Failed to update password: HTTP ${response.status}`,
      };
    }

    const data = await safeJson(response);

    if (isDev) console.log("[Password] Update response:", data);

    // Validate response structure
    if (typeof data === "object" && data !== null) {
      // Check if response is empty object
      if (Object.keys(data).length === 0) {
        if (isDev)
          console.warn(
            "[Password] Received empty response from Google Apps Script"
          );
        return {
          success: false,
          error:
            "Google Apps Script returned empty response. Please check if the updatePassword action is properly implemented in your Google Apps Script.",
        };
      }

      // Check if response has the expected success field
      if ("success" in data) {
        return {
          success: Boolean(data.success),
          error:
            data.error || (data.success ? undefined : "Unknown error occurred"),
        };
      } else {
        if (isDev)
          console.warn("[Password] Response missing success field:", data);
        return {
          success: false,
          error:
            "Google Apps Script response missing required fields. Expected {success: boolean, error?: string}.",
        };
      }
    } else {
      if (isDev)
        console.warn("[Password] Invalid response type:", typeof data, data);
      return {
        success: false,
        error: "Invalid response from server - expected JSON object",
      };
    }
  } catch (error) {
    if (isDev) console.error("[Password] Update error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? `Network error: ${error.message}`
          : "Failed to update password",
    };
  }
}

export async function getPassword(
  email: string
): Promise<{ success: boolean; password?: string; error?: string }> {
  const isDev = !!import.meta.env.DEV;
  try {
    if (isDev) console.log("[Password] Fetching password for:", email);

    const response = await fetchWithTimeout(
      `${GAS_BASE_URL}?action=getPassword&email=${encodeURIComponent(email)}`,
      {
        method: "GET",
      },
      15000
    ); // 15 second timeout

    if (!response.ok) {
      const errorText = await safeText(response);
      if (isDev)
        console.error("[Password] Fetch failed:", response.status, errorText);

      // Check if response is HTML (indicates backend error)
      if (errorText.includes("<!doctype") || errorText.includes("<html")) {
        return {
          success: false,
          error:
            "Google Apps Script backend error. Please check if the getPassword action exists in your Google Apps Script.",
        };
      }

      return {
        success: false,
        error: `Failed to fetch password: HTTP ${response.status}`,
      };
    }

    const data = await safeJson(response);

    if (isDev) console.log("[Password] Fetch response:", data);

    // Validate response structure
    if (typeof data === "object" && data !== null) {
      // Check if response is empty object
      if (Object.keys(data).length === 0) {
        if (isDev)
          console.warn(
            "[Password] Received empty response from Google Apps Script"
          );
        return {
          success: false,
          error:
            "Google Apps Script returned empty response. Please check if the getPassword action is properly implemented in your Google Apps Script.",
        };
      }

      // Check if response has the expected success field
      if ("success" in data) {
        return {
          success: Boolean(data.success),
          password: data.password,
          error:
            data.error || (data.success ? undefined : "Unknown error occurred"),
        };
      } else {
        if (isDev)
          console.warn("[Password] Response missing success field:", data);
        return {
          success: false,
          error:
            "Google Apps Script response missing required fields. Expected {success: boolean, password?: string, error?: string}.",
        };
      }
    } else {
      if (isDev)
        console.warn("[Password] Invalid response type:", typeof data, data);
      return {
        success: false,
        error: "Invalid response from server - expected JSON object",
      };
    }
  } catch (error) {
    if (isDev) console.error("[Password] Fetch error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? `Network error: ${error.message}`
          : "Failed to fetch password",
    };
  }
}
