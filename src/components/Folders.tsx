import React, { useState, useRef } from "react";
import {
  Folder,
  Plus,
  Edit,
  Trash2,
  Upload,
  FileText,
  X,
  Save,
  Eye,
} from "lucide-react";
import * as XLSX from "xlsx";
import { syncTradeToSheet } from "../lib/sheets";

interface TradeRow {
  company: string;
  symbol: string;
  quantity: number;
  buyValue: number;
  sellValue: number;
  profit: number;
  rawData: any;
}

interface Folder {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  tradeCount: number;
  trades?: TradeRow[];
  excelData?: any[];
  excelHeaders?: string[];
  fileName?: string;
  totalBuy?: number;
  totalSell?: number;
  totalProfit?: number;
}

const Folders: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"list" | "add">("add");
  const [folders, setFolders] = useState<Folder[]>([
    {
      id: "1",
      name: "Breakout Trades",
      description: "Trades based on breakout strategies",
      createdAt: new Date("2024-01-15"),
      tradeCount: 3,
      trades: [
        {
          company: "RELIANCE",
          symbol: "RELIANCE",
          quantity: 100,
          buyValue: 50000,
          sellValue: 55000,
          profit: 5000,
          rawData: {},
        },
        {
          company: "TCS",
          symbol: "TCS",
          quantity: 50,
          buyValue: 30000,
          sellValue: 32000,
          profit: 2000,
          rawData: {},
        },
        {
          company: "INFY",
          symbol: "INFY",
          quantity: 75,
          buyValue: 25000,
          sellValue: 24000,
          profit: -1000,
          rawData: {},
        },
      ],
      totalBuy: 105000,
      totalSell: 111000,
      totalProfit: 6000,
    },
  ]);

  const [newFolder, setNewFolder] = useState({ name: "", description: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [excelPreview, setExcelPreview] = useState<{
    data: any[];
    headers: string[];
    fileName: string;
    trades: TradeRow[];
    totalBuy: number;
    totalSell: number;
    totalProfit: number;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [viewingFolder, setViewingFolder] = useState<Folder | null>(null);
  const [editingTrade, setEditingTrade] = useState<{
    folderId: string;
    tradeIndex: number;
    trade: TradeRow;
  } | null>(null);
  const [editingPreviewTrade, setEditingPreviewTrade] = useState<{
    rowIndex: number;
    trade: TradeRow;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log(
      "Selected file:",
      file.name,
      "Size:",
      file.size,
      "Type:",
      file.type
    );

    if (file.size === 0) {
      alert("The selected file is empty. Please choose a valid Excel file.");
      setSelectedFile(null);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert("File is too large. Please choose a file smaller than 50MB.");
      setSelectedFile(null);
      return;
    }

    const allowedExtensions = [".xlsx", ".xls", ".xlsm", ".xlsb"];
    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf("."));

    if (!allowedExtensions.includes(fileExtension)) {
      alert("Please select a valid Excel file (.xlsx, .xls, .xlsm, .xlsb)");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          console.log("File loaded, processing...");
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          console.log("File size:", data.length, "bytes");

          const workbook = XLSX.read(data, { type: "array" });
          console.log("Workbook sheets:", workbook.SheetNames);

          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            alert(
              "Excel file appears to be empty or corrupted. No worksheets found."
            );
            setSelectedFile(null);
            return;
          }

          const sheetName = workbook.SheetNames[0];
          console.log("Reading sheet:", sheetName);

          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) {
            alert(`Sheet "${sheetName}" not found or is empty.`);
            setSelectedFile(null);
            return;
          }

          console.log("Worksheet range:", worksheet["!ref"]);

          const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:AX50");
          const maxRow = Math.max(range.e.r + 1, 50);
          const maxCol = Math.max(range.e.c + 1, 50);
          worksheet["!ref"] = XLSX.utils.encode_range({
            s: { r: 0, c: 0 },
            e: { r: maxRow - 1, c: maxCol - 1 },
          });

          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: "",
            blankrows: false,
            raw: false,
          });

          console.log("Raw JSON data length:", jsonData.length);

          let processedData = jsonData;
          if (jsonData.length === 0) {
            console.log("Trying alternative parsing method...");
            const altJsonData = XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
              defval: null,
              blankrows: true,
              raw: true,
            });
            processedData = altJsonData;
          }

          if (processedData.length === 0) {
            alert(
              "No data found in Excel file. Please check if the file contains data."
            );
            setSelectedFile(null);
            return;
          }

          const headers = processedData[0] as string[];

          const isFirstRowHeaders = () => {
            if (!headers || headers.length === 0) return false;

            let stringCount = 0;
            let dataLikeCount = 0;

            for (const cell of headers) {
              const cellStr: string = String(cell || "").trim();
              if (cellStr === "") continue;

              if (/^[A-Z]{2,10}$/.test(cellStr)) {
                dataLikeCount++;
              } else if (!isNaN(Number(cellStr)) && Number(cellStr) > 0) {
                dataLikeCount++;
              } else {
                stringCount++;
              }
            }

            return stringCount > dataLikeCount;
          };

          const firstRowIsHeaders = isFirstRowHeaders();
          console.log("First row detected as headers:", firstRowIsHeaders);

          const findDataRows = (data: any[]) => {
            const dataRows: any[] = [];

            for (let i = 0; i < data.length; i++) {
              const row = data[i];
              if (row && Array.isArray(row)) {
                let hasSymbol = false;
                let hasNumbers = false;

                for (let j = 0; j < row.length; j++) {
                  const cell = String(row[j] || "").trim();

                  if (
                    cell.length >= 3 &&
                    cell.length <= 10 &&
                    /^[A-Z]+$/.test(cell)
                  ) {
                    hasSymbol = true;
                  }

                  if (!isNaN(Number(cell)) && Number(cell) > 0) {
                    hasNumbers = true;
                  }
                }

                if (hasSymbol && hasNumbers) {
                  dataRows.push(row);
                }
              }
            }

            if (dataRows.length === 0) {
              for (let i = 0; i < data.length; i++) {
                const row = data[i];
                if (row && Array.isArray(row)) {
                  const hasData = row.some(
                    (cell) =>
                      cell !== null &&
                      cell !== undefined &&
                      String(cell).trim() !== ""
                  );
                  if (hasData) {
                    dataRows.push(row);
                  }
                }
              }
            }

            return dataRows;
          };

          let rows: any[];
          if (firstRowIsHeaders) {
            rows = findDataRows(processedData.slice(1));
          } else {
            rows = findDataRows(processedData);
          }

          console.log("Total data rows found:", rows.length);

          if (rows.length === 0) {
            alert(
              "No data rows found in Excel file. Please ensure your file contains trading data."
            );
            setSelectedFile(null);
            return;
          }

          // Fixed column mapping based on your Excel structure
          // Column B (index 1) = Symbol
          // Column D (index 3) = Quantity
          // Column E (index 4) = Buy Value
          // Column F (index 5) = Sell Value
          // Column G (index 6) = Profit/Loss

          const symbolIndex = 1; // Column B
          const quantityIndex = 3; // Column D
          const buyIndex = 4; // Column E
          const sellIndex = 5; // Column F
          const profitIndex = 6; // Column G

          console.log("Using fixed column mapping:", {
            symbolIndex: `Column B (${symbolIndex})`,
            quantityIndex: `Column D (${quantityIndex})`,
            buyIndex: `Column E (${buyIndex})`,
            sellIndex: `Column F (${sellIndex})`,
            profitIndex: `Column G (${profitIndex})`,
          });

          // Log sample data from detected columns
          if (rows.length > 0) {
            console.log("Sample data from fixed columns:");
            const sampleRow = rows[0];
            console.log(`Symbol (Column B): "${sampleRow[symbolIndex]}"`);
            console.log(`Quantity (Column D): "${sampleRow[quantityIndex]}"`);
            console.log(`Buy (Column E): "${sampleRow[buyIndex]}"`);
            console.log(`Sell (Column F): "${sampleRow[sellIndex]}"`);
            console.log(`Profit (Column G): "${sampleRow[profitIndex]}"`);
          }

          const trades: TradeRow[] = [];
          let totalBuy = 0,
            totalSell = 0,
            totalProfit = 0;

          rows.forEach((row, rowIndex) => {
            if (!row || row.length === 0) return;

            const symbol = String(row[symbolIndex] || "")
              .trim()
              .toUpperCase();
            if (!symbol) return;

            const quantity = parseFloat(String(row[quantityIndex] || 0)) || 0;
            const buy = parseFloat(String(row[buyIndex] || 0)) || 0;
            const sell = parseFloat(String(row[sellIndex] || 0)) || 0;
            const profit = parseFloat(String(row[profitIndex] || 0)) || 0;

            console.log(`Row ${rowIndex + 1}:`, {
              symbol,
              quantity,
              buy,
              sell,
              profit,
            });

            trades.push({
              company: symbol,
              symbol: symbol,
              quantity: quantity,
              buyValue: buy,
              sellValue: sell,
              profit: profit,
              rawData: row,
            });

            totalBuy += buy;
            totalSell += sell;
            totalProfit += profit;
          });

          setExcelPreview({
            data: rows,
            headers,
            fileName: file.name,
            trades,
            totalBuy,
            totalSell,
            totalProfit,
          });
          setShowPreview(true);
        } catch (error) {
          console.error("Error processing Excel data:", error);
          alert(
            `Error processing Excel file: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
          setSelectedFile(null);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error parsing Excel file:", error);
      alert("Error reading Excel file. Please try again.");
    }
  };

  const handleConfirmUpload = async () => {
    if (excelPreview && selectedFile) {
      setIsSaving(true);
      for (let i = 0; i < excelPreview.trades.length; i++) {
        const t = excelPreview.trades[i];
        const symbol = (t.symbol || t.company || "").toString().toUpperCase();
        const quantity = Number(t.quantity) || 0;
        const buy = Number(t.buyValue) || 0;
        const sell = Number(t.sellValue) || 0;
        if (!symbol || !(quantity > 0 || buy > 0 || sell > 0)) continue;
        const trade = {
          id: `${symbol}-${Date.now()}-${i}`,
          date: "",
          instrument: symbol,
          side: "Buy" as const,
          entryPrice: buy,
          exitPrice: sell,
          quantity: quantity,
          strategy: "",
          notes: "",
        };
        try {
          await syncTradeToSheet(trade as any, "insert");
        } catch (e) {
          console.warn("Failed to submit trade to sheet", symbol, e);
        }
      }

      const folder: Folder = {
        id: Date.now().toString(),
        name:
          newFolder.name.trim() || selectedFile.name.replace(/\.[^/.]+$/, ""),
        description: newFolder.description.trim(),
        createdAt: new Date(),
        tradeCount: excelPreview.trades.length,
        trades: excelPreview.trades,
        excelData: excelPreview.data,
        excelHeaders: excelPreview.headers,
        fileName: selectedFile.name,
        totalBuy: excelPreview.totalBuy,
        totalSell: excelPreview.totalSell,
        totalProfit: excelPreview.totalProfit,
      };
      setFolders((prev) => [...prev, folder]);
      alert("Successfully saved!");
      setNewFolder({ name: "", description: "" });
      setSelectedFile(null);
      setExcelPreview(null);
      setShowPreview(false);
      setActiveTab("list");
      setIsSaving(false);
    }
  };

  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setNewFolder({ name: folder.name, description: folder.description || "" });
    setActiveTab("add");
  };

  const handleUpdateFolder = () => {
    if (editingFolder && newFolder.name.trim()) {
      setFolders((prev) =>
        prev.map((f) =>
          f.id === editingFolder.id
            ? {
                ...f,
                name: newFolder.name.trim(),
                description: newFolder.description.trim(),
              }
            : f
        )
      );
      setEditingFolder(null);
      setNewFolder({ name: "", description: "" });
      setActiveTab("list");
    }
  };

  const handleAddFolder = () => {
    if (newFolder.name.trim()) {
      setFolders((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          name: newFolder.name.trim(),
          description: newFolder.description.trim(),
          createdAt: new Date(),
          tradeCount: 0,
          trades: [],
        },
      ]);
      setNewFolder({ name: "", description: "" });
      setSelectedFile(null);
      setExcelPreview(null);
      setShowPreview(false);
      setActiveTab("list");
    }
  };

  const handleDeleteFolder = (id: string) => {
    if (confirm("Are you sure you want to delete this folder?"))
      setFolders((prev) => prev.filter((f) => f.id !== id));
  };

  const handleEditTrade = (
    folderId: string,
    tradeIndex: number,
    trade: TradeRow
  ) => {
    setEditingTrade({ folderId, tradeIndex, trade: { ...trade } });
  };

  const handleSaveTrade = () => {
    if (!editingTrade) return;
    setFolders((prev) =>
      prev.map((folder) => {
        if (folder.id === editingTrade.folderId && folder.trades) {
          const updatedTrades = [...folder.trades];
          updatedTrades[editingTrade.tradeIndex] = editingTrade.trade;
          const totalBuy = updatedTrades.reduce(
            (sum, t) => sum + t.buyValue,
            0
          );
          const totalSell = updatedTrades.reduce(
            (sum, t) => sum + t.sellValue,
            0
          );
          const totalProfit = updatedTrades.reduce(
            (sum, t) => sum + t.profit,
            0
          );
          return {
            ...folder,
            trades: updatedTrades,
            totalBuy,
            totalSell,
            totalProfit,
          };
        }
        return folder;
      })
    );
    setEditingTrade(null);
  };

  const handleDeleteTrade = (folderId: string, tradeIndex: number) => {
    if (!confirm("Are you sure you want to delete this trade?")) return;
    setFolders((prev) =>
      prev.map((folder) => {
        if (folder.id === folderId && folder.trades) {
          const updatedTrades = folder.trades.filter(
            (_, i) => i !== tradeIndex
          );
          const totalBuy = updatedTrades.reduce(
            (sum, t) => sum + t.buyValue,
            0
          );
          const totalSell = updatedTrades.reduce(
            (sum, t) => sum + t.sellValue,
            0
          );
          const totalProfit = updatedTrades.reduce(
            (sum, t) => sum + t.profit,
            0
          );
          return {
            ...folder,
            trades: updatedTrades,
            tradeCount: updatedTrades.length,
            totalBuy,
            totalSell,
            totalProfit,
          };
        }
        return folder;
      })
    );
  };

  return (
    <div className="p-6 space-y-8 min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
          Folder Management
        </h2>

        <div className="mt-6">
          <button
            onClick={() => {
              setActiveTab("add");
              setEditingFolder(null);
              setNewFolder({ name: "", description: "" });
            }}
            className="px-6 py-3 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg border border-red-500 shadow-md transition-all hover:shadow-xl hover:scale-105"
          >
            <Plus className="inline mr-2 w-5 h-5" />
            Create New Folder
          </button>
        </div>

        {activeTab === "list" && (
          <section className="mt-6">
            {folders.length === 0 ? (
              <div className="p-8 bg-white rounded-xl shadow-lg dark:bg-slate-900">
                <p className="text-slate-500 dark:text-slate-400">
                  Create your first folder to organize your trades.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="p-6 bg-white rounded-xl border shadow-lg transition-all dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:shadow-2xl hover:scale-105"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg">
                          {folder.fileName ? (
                            <FileText className="w-6 h-6 text-white" />
                          ) : (
                            <Folder className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            {folder.name}
                          </h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {folder.tradeCount} trades
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        {folder.trades && folder.trades.length > 0 && (
                          <button
                            onClick={() => setViewingFolder(folder)}
                            className="p-2 rounded-lg border border-red-500 transition-colors text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950"
                            title="View trades"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditFolder(folder)}
                          className="p-2 rounded-lg border border-red-500 transition-colors text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFolder(folder.id)}
                          className="p-2 rounded-lg border border-red-500 transition-colors text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {folder.description && (
                      <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
                        {folder.description}
                      </p>
                    )}
                    {folder.fileName && (
                      <div className="p-3 mb-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          Excel File
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-200">
                          {folder.fileName}
                        </p>
                      </div>
                    )}

                    {folder.totalBuy !== undefined && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="p-3 text-center bg-blue-50 rounded-lg dark:bg-blue-950">
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            Buy
                          </p>
                          <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                            ₹{folder.totalBuy.toLocaleString()}
                          </p>
                        </div>
                        <div className="p-3 text-center bg-purple-50 rounded-lg dark:bg-purple-950">
                          <p className="text-xs text-purple-600 dark:text-purple-400">
                            Sell
                          </p>
                          <p className="text-sm font-bold text-purple-700 dark:text-purple-300">
                            ₹{folder.totalSell?.toLocaleString()}
                          </p>
                        </div>
                        <div
                          className={`p-3 text-center rounded-lg ${
                            (folder.totalProfit || 0) >= 0
                              ? "bg-green-50 dark:bg-green-950"
                              : "bg-red-50 dark:bg-red-950"
                          }`}
                        >
                          <p
                            className={`text-xs ${
                              (folder.totalProfit || 0) >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            P&L
                          </p>
                          <p
                            className={`text-sm font-bold ${
                              (folder.totalProfit || 0) >= 0
                                ? "text-green-700 dark:text-green-300"
                                : "text-red-700 dark:text-red-300"
                            }`}
                          >
                            ₹{folder.totalProfit?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="pt-3 text-xs border-t text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                      Created {folder.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "add" && (
          <div className="p-6 mt-6 bg-white rounded-xl border shadow-lg dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <h3 className="mb-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
              {editingFolder ? "Edit Folder" : "Create New Folder"}
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Folder Name *
                </label>
                <input
                  type="text"
                  value={newFolder.name}
                  onChange={(e) =>
                    setNewFolder((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="px-4 py-3 w-full bg-white rounded-lg border-2 transition-all border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter folder name"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  value={newFolder.description}
                  onChange={(e) =>
                    setNewFolder((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="px-4 py-3 w-full bg-white rounded-lg border-2 transition-all border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional description"
                  rows={3}
                />
              </div>

              {!editingFolder && (
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Upload Excel File (Optional)
                  </label>
                  <div className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.xlsm,.xlsb"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex justify-center items-center px-6 py-4 space-x-3 w-full rounded-xl border-2 border-dashed transition-all border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950"
                    >
                      <Upload className="w-6 h-6" />
                      <span className="font-medium">
                        {selectedFile ? selectedFile.name : "Choose Excel file"}
                      </span>
                      {selectedFile && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            setExcelPreview(null);
                            setShowPreview(false);
                          }}
                          className="p-1 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-950"
                          title="Remove file"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                    </button>
                    <div className="p-3 bg-blue-50 rounded-lg dark:bg-blue-950">
                      <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                        📋 Excel Requirements:
                      </p>
                      <ul className="mt-1 ml-4 text-xs list-disc text-blue-700 dark:text-blue-300">
                        <li>
                          <strong>Fixed Column Layout:</strong>
                          <ul className="ml-4 list-circle">
                            <li>Column B: Symbol/Ticker</li>
                            <li>Column D: Quantity</li>
                            <li>Column E: Buy Value</li>
                            <li>Column F: Sell Value</li>
                            <li>Column G: Profit/Loss</li>
                          </ul>
                        </li>
                        <li>
                          <strong>Required:</strong> Symbol (Column B), Quantity
                          (Column D), Buy & Sell Values (Columns E & F),
                          Profit/Loss (Column G)
                        </li>
                        <li>
                          <strong>Formats:</strong> .xlsx, .xls, .xlsm, .xlsb
                        </li>
                        <li>
                          <strong>Capacity:</strong> Supports up to 50 rows × 50
                          columns
                        </li>
                        <li>
                          <strong>Data Detection:</strong> Automatically skips
                          header rows and finds actual trading data
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex pt-4 space-x-3">
                <button
                  onClick={editingFolder ? handleUpdateFolder : handleAddFolder}
                  disabled={
                    editingFolder
                      ? !editingFolder.name.trim()
                      : !newFolder.name.trim()
                  }
                  className="px-6 py-3 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-md transition-all hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {editingFolder ? "Update Folder" : "Create Folder"}
                </button>
                <button
                  onClick={() => {
                    setEditingFolder(null);
                    setNewFolder({ name: "", description: "" });
                    setSelectedFile(null);
                    setExcelPreview(null);
                    setShowPreview(false);
                    setActiveTab("list");
                  }}
                  className="px-6 py-3 rounded-lg border-2 transition-all border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showPreview && excelPreview && (
          <div className="overflow-hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 backdrop-blur-sm bg-black/70"
              onClick={() => setShowPreview(false)}
            />
            <div className="flex fixed inset-1 justify-center items-center md:inset-4 lg:inset-8">
              <div className="overflow-hidden relative w-full max-w-full md:max-w-5xl lg:max-w-4xl mx-1 md:mx-4 lg:mx-8 bg-white rounded-2xl shadow-2xl dark:bg-slate-900 max-h-[95vh] md:max-h-[90vh]">
                <div className="flex justify-between items-center p-2 bg-gradient-to-r from-blue-50 to-purple-50 border-b md:p-4 dark:from-blue-950 dark:to-purple-950 border-slate-200 dark:border-slate-700">
                  <div>
                    <h3 className="text-lg font-bold md:text-xl text-slate-900 dark:text-slate-100">
                      📊 Excel Preview
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {excelPreview.fileName} • {excelPreview.trades.length}{" "}
                      trades found
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="p-2 rounded-lg transition-all hover:bg-white dark:hover:bg-slate-800"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-1 p-2 border-b md:grid-cols-3 md:gap-2 md:p-3 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                  <div className="p-1 text-center bg-blue-100 rounded-xl md:p-2 dark:bg-blue-900">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300 md:text-sm">
                      Total Buy
                    </p>
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-100 md:text-xl">
                      ₹{excelPreview.totalBuy.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-1 text-center bg-purple-100 rounded-xl md:p-2 dark:bg-purple-900">
                    <p className="text-xs font-medium text-purple-700 dark:text-purple-300 md:text-sm">
                      Total Sell
                    </p>
                    <p className="text-lg font-bold text-purple-900 dark:text-purple-100 md:text-xl">
                      ₹{excelPreview.totalSell.toLocaleString()}
                    </p>
                  </div>
                  <div
                    className={`p-1 md:p-2 text-center rounded-xl ${
                      excelPreview.totalProfit >= 0
                        ? "bg-green-100 dark:bg-green-900"
                        : "bg-red-100 dark:bg-red-900"
                    }`}
                  >
                    <p
                      className={`text-xs font-medium md:text-sm ${
                        excelPreview.totalProfit >= 0
                          ? "text-green-700 dark:text-green-300"
                          : "text-red-700 dark:text-red-300"
                      }`}
                    >
                      Total P&L
                    </p>
                    <p
                      className={`text-lg font-bold md:text-xl ${
                        excelPreview.totalProfit >= 0
                          ? "text-green-900 dark:text-green-100"
                          : "text-red-900 dark:text-red-100"
                      }`}
                    >
                      ₹{excelPreview.totalProfit.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="p-1 md:p-1 overflow-auto max-h-[40vh] md:max-h-[50vh]">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
                      <tr>
                        <th className="px-2 py-3 text-xs font-semibold tracking-wider text-left uppercase md:px-4 text-slate-700 dark:text-slate-300">
                          Row #
                        </th>
                        <th className="px-2 py-3 text-xs font-semibold tracking-wider text-left uppercase md:px-4 text-slate-700 dark:text-slate-300">
                          Symbol
                        </th>
                        <th className="px-2 py-3 text-xs font-semibold tracking-wider text-left uppercase md:px-4 text-slate-700 dark:text-slate-300">
                          Quantity
                        </th>
                        <th className="px-2 py-3 text-xs font-semibold tracking-wider text-right uppercase md:px-4 text-slate-700 dark:text-slate-300">
                          Buy Value
                        </th>
                        <th className="px-2 py-3 text-xs font-semibold tracking-wider text-right uppercase md:px-4 text-slate-700 dark:text-slate-300">
                          Sell Value
                        </th>
                        <th className="px-2 py-3 text-xs font-semibold tracking-wider text-right uppercase md:px-4 text-slate-700 dark:text-slate-300">
                          P&L
                        </th>
                        <th className="px-2 py-3 text-xs font-semibold tracking-wider text-center uppercase md:px-4 text-slate-700 dark:text-slate-300">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y dark:bg-slate-900 divide-slate-200 dark:divide-slate-700">
                      {excelPreview.data
                        .filter((row) => {
                          // Filter to only show rows with actual trading data
                          const symbol = String(row[1] || "")
                            .trim()
                            .toUpperCase();
                          const quantity = parseFloat(String(row[3] || 0)) || 0;
                          const buy = parseFloat(String(row[4] || 0)) || 0;
                          const sell = parseFloat(String(row[5] || 0)) || 0;
                          const profit = parseFloat(String(row[6] || 0)) || 0;

                          // Only show rows that have a symbol AND either quantity or buy/sell values
                          return (
                            symbol &&
                            (quantity > 0 ||
                              buy > 0 ||
                              sell > 0 ||
                              profit !== 0)
                          );
                        })
                        .slice(0, 100)
                        .map((row, index) => (
                          <tr
                            key={index}
                            className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <td className="px-2 py-3 font-medium md:px-4 text-slate-900 dark:text-slate-100">
                              {index + 1}
                            </td>
                            <td className="px-2 py-3 font-mono md:px-4 text-slate-600 dark:text-slate-400">
                              {excelPreview.data.indexOf(row) === editingPreviewTrade?.rowIndex
                                ? editingPreviewTrade.trade.symbol
                                : row[1] || "-"}
                            </td>
                            <td className="px-2 py-3 text-left md:px-4 text-slate-900 dark:text-slate-100">
                              {excelPreview.data.indexOf(row) === editingPreviewTrade?.rowIndex
                                ? editingPreviewTrade.trade.quantity.toLocaleString()
                                : row[3] || "-"}
                            </td>
                            <td className="px-2 py-3 text-right md:px-4 text-slate-900 dark:text-slate-100">
                              {excelPreview.data.indexOf(row) === editingPreviewTrade?.rowIndex
                                ? `₹${editingPreviewTrade.trade.buyValue.toLocaleString()}`
                                : row[4]
                                ? `₹${parseFloat(
                                    String(row[4] || 0)
                                  ).toLocaleString()}`
                                : "-"}
                            </td>
                            <td className="px-2 py-3 text-right md:px-4 text-slate-900 dark:text-slate-100">
                              {excelPreview.data.indexOf(row) === editingPreviewTrade?.rowIndex
                                ? `₹${editingPreviewTrade.trade.sellValue.toLocaleString()}`
                                : row[5]
                                ? `₹${parseFloat(
                                    String(row[5] || 0)
                                  ).toLocaleString()}`
                                : "-"}
                            </td>
                            <td className="px-2 py-3 text-right md:px-4 text-slate-900 dark:text-slate-100">
                              {excelPreview.data.indexOf(row) === editingPreviewTrade?.rowIndex
                                ? `₹${editingPreviewTrade.trade.profit.toLocaleString()}`
                                : row[6]
                                ? `₹${parseFloat(
                                    String(row[6] || 0)
                                  ).toLocaleString()}`
                                : "-"}
                            </td>
                            <td className="px-2 py-3 text-center md:px-4">
                              <button
                                onClick={() => {
                                  // Create a trade object from the row data
                                  const trade: TradeRow = {
                                    company: String(row[1] || "")
                                      .trim()
                                      .toUpperCase(),
                                    symbol: String(row[1] || "")
                                      .trim()
                                      .toUpperCase(),
                                    quantity:
                                      parseFloat(String(row[3] || 0)) || 0,
                                    buyValue:
                                      parseFloat(String(row[4] || 0)) || 0,
                                    sellValue:
                                      parseFloat(String(row[5] || 0)) || 0,
                                    profit:
                                      parseFloat(String(row[6] || 0)) || 0,
                                    rawData: row,
                                  };
                                  const originalIndex = excelPreview.data.indexOf(row);
                                  setEditingPreviewTrade({
                                    rowIndex: originalIndex,
                                    trade,
                                  });
                                }}
                                className="p-1.5 transition-colors rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 border border-red-500"
                                title="Edit trade"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-center items-center p-3 space-x-2 border-t md:p-2 md:space-x-3 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-4 py-2 rounded-lg border border-red-500 transition-colors border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmUpload}
                    disabled={isSaving}
                    className="px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg border border-red-500 transition-colors hover:shadow-lg disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewingFolder && (
          <div className="overflow-hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 backdrop-blur-sm bg-black/70"
              onClick={() => setViewingFolder(null)}
            />
            <div className="flex fixed inset-1 justify-center items-center md:inset-4 lg:inset-8">
              <div className="overflow-hidden relative w-full max-w-full max-h-full bg-white rounded-2xl shadow-2xl md:max-w-7xl dark:bg-slate-900">
                <div className="flex justify-between items-center p-2 bg-gradient-to-r from-blue-50 to-purple-50 border-b md:p-4 dark:from-blue-950 dark:to-purple-950 border-slate-200 dark:border-slate-700">
                  <div>
                    <h3 className="text-lg font-bold md:text-xl text-slate-900 dark:text-slate-100">
                      {viewingFolder.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {viewingFolder.tradeCount} trades
                    </p>
                  </div>
                  <button
                    onClick={() => setViewingFolder(null)}
                    className="p-2 rounded-lg transition-all hover:bg-white dark:hover:bg-slate-800"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 p-4 border-b md:grid-cols-3 md:gap-4 md:p-6 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                  <div className="p-3 text-center bg-blue-100 rounded-xl md:p-4 dark:bg-blue-900">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Total Buy
                    </p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      ₹{viewingFolder.totalBuy?.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 text-center bg-purple-100 rounded-xl md:p-4 dark:bg-purple-900">
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      Total Sell
                    </p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      ₹{viewingFolder.totalSell?.toLocaleString()}
                    </p>
                  </div>
                  <div
                    className={`p-3 md:p-4 text-center rounded-xl ${
                      (viewingFolder.totalProfit || 0) >= 0
                        ? "bg-green-100 dark:bg-green-900"
                        : "bg-red-100 dark:bg-red-900"
                    }`}
                  >
                    <p
                      className={`text-sm font-medium ${
                        (viewingFolder.totalProfit || 0) >= 0
                          ? "text-green-700 dark:text-green-300"
                          : "text-red-700 dark:text-red-300"
                      }`}
                    >
                      Total P&L
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        (viewingFolder.totalProfit || 0) >= 0
                          ? "text-green-900 dark:text-green-100"
                          : "text-red-900 dark:text-red-100"
                      }`}
                    >
                      ₹{viewingFolder.totalProfit?.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="p-4 md:p-6 overflow-auto max-h-[60vh] md:max-h-[50vh]">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
                      <tr>
                        <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase text-slate-700 dark:text-slate-300">
                          Stock Symbol
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase text-slate-700 dark:text-slate-300">
                          Symbol
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold tracking-wider text-right uppercase text-slate-700 dark:text-slate-300">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold tracking-wider text-right uppercase text-slate-700 dark:text-slate-300">
                          Buy Value
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold tracking-wider text-right uppercase text-slate-700 dark:text-slate-300">
                          Sell Value
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold tracking-wider text-right uppercase text-slate-700 dark:text-slate-300">
                          Profit/Loss
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold tracking-wider text-center uppercase text-slate-700 dark:text-slate-300">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y dark:bg-slate-900 divide-slate-200 dark:divide-slate-700">
                      {viewingFolder.trades?.map((trade, index) => (
                        <tr
                          key={index}
                          className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                            {trade.company}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                            {trade.symbol}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-900 dark:text-slate-100">
                            {trade.quantity.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-900 dark:text-slate-100">
                            ₹{trade.buyValue.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-900 dark:text-slate-100">
                            ₹{trade.sellValue.toLocaleString()}
                          </td>
                          <td
                            className={`px-2 md:px-4 py-3 text-right font-medium ${
                              trade.profit >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            ₹{trade.profit.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() =>
                                  handleEditTrade(
                                    viewingFolder.id,
                                    index,
                                    trade
                                  )
                                }
                                className="p-1.5 transition-colors rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950"
                                title="Edit trade"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteTrade(viewingFolder.id, index)
                                }
                                className="p-1.5 transition-colors rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                title="Delete trade"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end items-center p-4 border-t md:p-6 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <button
                    onClick={() => setViewingFolder(null)}
                    className="px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg transition-colors md:px-6 hover:shadow-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {editingTrade && (
          <div className="overflow-hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 backdrop-blur-sm bg-black/70"
              onClick={() => setEditingTrade(null)}
            />
            <div className="flex fixed inset-1 justify-center items-center md:inset-4">
              <div className="relative w-full max-w-full bg-white rounded-2xl shadow-2xl md:max-w-lg dark:bg-slate-900">
                <div className="flex justify-between items-center p-2 bg-gradient-to-r from-blue-50 to-purple-50 border-b md:p-4 dark:from-blue-950 dark:to-purple-950 border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold md:text-xl text-slate-900 dark:text-slate-100">
                    ✏️ Edit Trade
                  </h3>
                  <button
                    onClick={() => setEditingTrade(null)}
                    className="p-2 rounded-lg transition-all hover:bg-white dark:hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 space-y-3 md:p-6 md:space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Stock Symbol (Company Name)
                    </label>
                    <input
                      type="text"
                      value={editingTrade?.trade?.symbol || ""}
                      onChange={(e) => {
                        const newSymbol = e.target.value.toUpperCase();
                        if (editingTrade) {
                          setEditingTrade({
                            ...editingTrade,
                            trade: {
                              ...editingTrade.trade,
                              company: newSymbol,
                              symbol: newSymbol,
                            },
                          });
                        }
                      }}
                      className="px-4 py-3 w-full font-mono bg-white rounded-lg border-2 transition-all border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter stock symbol"
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Stock Symbol name will automatically match the symbol
                    </p>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Quantity
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={editingTrade?.trade?.quantity || 0}
                      onChange={(e) => {
                        const quantity = parseFloat(e.target.value) || 0;
                        if (editingTrade) {
                          setEditingTrade({
                            ...editingTrade,
                            trade: {
                              ...editingTrade.trade,
                              quantity: quantity,
                            },
                          });
                        }
                      }}
                      className="px-4 py-3 w-full bg-white rounded-lg border-2 transition-all border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter quantity"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Buy Value (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingTrade?.trade?.buyValue || 0}
                      onChange={(e) => {
                        const buyValue = parseFloat(e.target.value) || 0;
                        if (editingTrade) {
                          setEditingTrade({
                            ...editingTrade,
                            trade: {
                              ...editingTrade.trade,
                              buyValue: buyValue,
                              profit:
                                (editingTrade.trade.sellValue || 0) - buyValue,
                            },
                          });
                        }
                      }}
                      className="px-4 py-3 w-full bg-white rounded-lg border-2 transition-all border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter buy value"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Sell Value (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingTrade?.trade?.sellValue || 0}
                      onChange={(e) => {
                        const sellValue = parseFloat(e.target.value) || 0;
                        if (editingTrade) {
                          setEditingTrade({
                            ...editingTrade,
                            trade: {
                              ...editingTrade.trade,
                              sellValue: sellValue,
                              profit:
                                sellValue - (editingTrade.trade.buyValue || 0),
                            },
                          });
                        }
                      }}
                      className="px-4 py-3 w-full bg-white rounded-lg border-2 transition-all border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter sell value"
                    />
                  </div>

                  <div className="p-3 rounded-lg md:p-4 bg-slate-50 dark:bg-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Calculated Profit/Loss:
                      </span>
                      <span
                        className={`text-lg font-bold ${
                          (editingTrade?.trade?.profit || 0) >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        ₹{(editingTrade?.trade?.profit || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end items-center p-4 space-x-2 border-t md:p-6 md:space-x-3 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <button
                    onClick={() => setEditingTrade(null)}
                    className="px-4 py-2 rounded-lg border-2 transition-colors border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTrade}
                    className="flex items-center px-4 py-2 space-x-2 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg transition-colors md:px-6 hover:shadow-lg"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {editingPreviewTrade && (
          <div className="overflow-hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 backdrop-blur-sm bg-black/70"
              onClick={() => setEditingPreviewTrade(null)}
            />
            <div className="flex fixed inset-2 justify-center items-center md:inset-12 lg:inset-20">
              <div className="relative w-full max-w-lg md:max-w-md lg:max-w-sm mx-2 md:mx-0 bg-white rounded-2xl shadow-2xl dark:bg-slate-900 max-h-[85vh] md:max-h-[70vh] overflow-hidden">
                <div className="flex justify-between items-center p-2 bg-gradient-to-r from-blue-50 to-purple-50 border-b md:p-4 dark:from-blue-950 dark:to-purple-950 border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold md:text-xl text-slate-900 dark:text-slate-100">
                    ✏️ Edit Preview Trade
                  </h3>
                  <button
                    onClick={() => setEditingPreviewTrade(null)}
                    className="p-2 rounded-lg transition-all hover:bg-white dark:hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-3 md:p-6 space-y-2 md:space-y-4 overflow-y-auto max-h-[50vh] md:max-h-[40vh]">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Stock Symbol (Company Name)
                    </label>
                    <input
                      type="text"
                      value={editingPreviewTrade?.trade?.symbol || ""}
                      onChange={(e) => {
                        const newSymbol = e.target.value.toUpperCase();
                        if (editingPreviewTrade) {
                          setEditingPreviewTrade({
                            ...editingPreviewTrade,
                            trade: {
                              ...editingPreviewTrade.trade,
                              company: newSymbol,
                              symbol: newSymbol,
                            },
                          });
                        }
                      }}
                      className="px-4 py-3 w-full font-mono bg-white rounded-lg border-2 transition-all border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter stock symbol"
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Stock Symbol name will automatically match the symbol
                    </p>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium md:mb-2 text-slate-700 dark:text-slate-300">
                      Quantity
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={editingPreviewTrade?.trade?.quantity || 0}
                      onChange={(e) => {
                        const quantity = parseFloat(e.target.value) || 0;
                        if (editingPreviewTrade) {
                          setEditingPreviewTrade({
                            ...editingPreviewTrade,
                            trade: {
                              ...editingPreviewTrade.trade,
                              quantity: quantity,
                            },
                          });
                        }
                      }}
                      className="px-3 py-2 w-full bg-white rounded-lg border-2 transition-all md:px-4 md:py-3 border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter quantity"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium md:mb-2 text-slate-700 dark:text-slate-300">
                      Buy Value (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingPreviewTrade?.trade?.buyValue || 0}
                      onChange={(e) => {
                        const buyValue = parseFloat(e.target.value) || 0;
                        if (editingPreviewTrade) {
                          setEditingPreviewTrade({
                            ...editingPreviewTrade,
                            trade: {
                              ...editingPreviewTrade.trade,
                              buyValue: buyValue,
                              profit:
                                (editingPreviewTrade.trade.sellValue || 0) -
                                buyValue,
                            },
                          });
                        }
                      }}
                      className="px-3 py-2 w-full bg-white rounded-lg border-2 transition-all md:px-4 md:py-3 border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter buy value"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium md:mb-2 text-slate-700 dark:text-slate-300">
                      Sell Value (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingPreviewTrade?.trade?.sellValue || 0}
                      onChange={(e) => {
                        const sellValue = parseFloat(e.target.value) || 0;
                        if (editingPreviewTrade) {
                          setEditingPreviewTrade({
                            ...editingPreviewTrade,
                            trade: {
                              ...editingPreviewTrade.trade,
                              sellValue: sellValue,
                              profit:
                                sellValue -
                                (editingPreviewTrade.trade.buyValue || 0),
                            },
                          });
                        }
                      }}
                      className="px-3 py-2 w-full bg-white rounded-lg border-2 transition-all md:px-4 md:py-3 border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter sell value"
                    />
                  </div>

                  <div className="p-3 mt-2 rounded-lg md:p-4 bg-slate-50 dark:bg-slate-800 md:mt-0">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium md:text-sm text-slate-700 dark:text-slate-300">
                        P&L:
                      </span>
                      <span
                        className={`text-sm md:text-lg font-bold ${
                          (editingPreviewTrade?.trade?.profit || 0) >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        ₹
                        {(
                          editingPreviewTrade?.trade?.profit || 0
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end items-center p-3 md:p-6 space-x-2 md:space-x-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 min-h-[50px] md:min-h-[80px]">
                  <button
                    onClick={() => setEditingPreviewTrade(null)}
                    className="px-3 py-2 text-sm rounded-lg border-2 transition-colors md:px-4 md:py-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 md:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (editingPreviewTrade && excelPreview) {
                        // Update the preview data
                        const updatedData = [...excelPreview.data];
                        const rowIndex = editingPreviewTrade.rowIndex;
                        const trade = editingPreviewTrade.trade;

                        // Update the row data (columns: 1=symbol, 3=quantity, 4=buy, 5=sell, 6=profit)
                        updatedData[rowIndex] = [
                          ...updatedData[rowIndex].slice(0, 1), // Keep columns before symbol
                          trade.symbol, // Column 1: Symbol
                          ...updatedData[rowIndex].slice(2, 3), // Keep columns between symbol and quantity
                          trade.quantity.toString(), // Column 3: Quantity
                          trade.buyValue.toString(), // Column 4: Buy Value
                          trade.sellValue.toString(), // Column 5: Sell Value
                          trade.profit.toString(), // Column 6: Profit
                          ...updatedData[rowIndex].slice(7), // Keep remaining columns
                        ];

                        // Recalculate totals
                        const trades = updatedData
                          .filter((row) => {
                            const symbol = String(row[1] || "")
                              .trim()
                              .toUpperCase();
                            const quantity =
                              parseFloat(String(row[3] || 0)) || 0;
                            const buy = parseFloat(String(row[4] || 0)) || 0;
                            const sell = parseFloat(String(row[5] || 0)) || 0;
                            return (
                              symbol && (quantity > 0 || buy > 0 || sell > 0)
                            );
                          })
                          .map((row) => ({
                            company: String(row[1] || "")
                              .trim()
                              .toUpperCase(),
                            symbol: String(row[1] || "")
                              .trim()
                              .toUpperCase(),
                            quantity: parseFloat(String(row[3] || 0)) || 0,
                            buyValue: parseFloat(String(row[4] || 0)) || 0,
                            sellValue: parseFloat(String(row[5] || 0)) || 0,
                            profit: parseFloat(String(row[6] || 0)) || 0,
                            rawData: row,
                          }));

                        const totalBuy = trades.reduce(
                          (sum, t) => sum + t.buyValue,
                          0
                        );
                        const totalSell = trades.reduce(
                          (sum, t) => sum + t.sellValue,
                          0
                        );
                        const totalProfit = trades.reduce(
                          (sum, t) => sum + t.profit,
                          0
                        );

                        setExcelPreview({
                          ...excelPreview,
                          data: updatedData,
                          trades,
                          totalBuy,
                          totalSell,
                          totalProfit,
                        });

                        setEditingPreviewTrade(null);
                      }
                    }}
                    className="flex items-center px-4 py-2 space-x-2 text-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg transition-colors md:px-6 md:py-2 hover:shadow-lg md:text-base"
                  >
                    <Save className="w-4 h-4" />
                    <span>Submit</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Folders;
