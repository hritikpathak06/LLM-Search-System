"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n"; 

export default function Search() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState("en");

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?query=${query}`);
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error("Search Error:", error);
    }
    setLoading(false);
  };

  const toggleLanguage = () => {
    const newLang = lang === "en" ? "he" : "en";
    setLang(newLang);
    i18n.changeLanguage(newLang);
  };

  return (
    <div
      className={`flex flex-col items-center justify-center text-black min-h-screen px-6 bg-gradient-to-br ${
        lang === "he" ? "text-right" : "text-left"
      } from-blue-500 to-purple-600`}
    >
      <div className="bg-white shadow-lg rounded-2xl p-6 max-w-md w-full">
        <button
          onClick={toggleLanguage}
          className="px-4 py-2 mb-4 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition"
        >
          {t("toggle_language")}
        </button>

        <div className="relative w-full">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("placeholder")}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
        >
          {loading ? t("searching") : t("search")}
        </button>

        {result && (
          <div className="mt-4 w-full text-left">
            <pre className="p-2 bg-gray-100 rounded-lg overflow-auto text-sm max-h-60">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
