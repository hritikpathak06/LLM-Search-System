"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function Search() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?query=${query}`);
      const data = await res.json();

      if (data.match) {
        setResult(data.match);
      } else {
        setResult(null);
      }
    } catch (error) {
      console.error("Search Error:", error);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center text-black min-h-screen px-6 bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white shadow-lg rounded-2xl p-6 max-w-md w-full">
        <div className="relative w-full">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("placeholder")}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            autoFocus
            autoComplete="off"
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
          <div className="mt-6 bg-gray-100 p-4 rounded-lg shadow-md w-full max-h-[300px] overflow-auto">
            <h2 className="text-lg font-semibold text-gray-900">
              Search Result
            </h2>
            <div className="mt-4 p-4 bg-white rounded-lg shadow-md">
              <p className="text-gray-800">
                <span className="font-semibold text-blue-600">
                  Canonical Name:
                </span>{" "}
                {result.canonicalName}
              </p>

              {result.variations?.length > 0 && (
                <div className="mt-2">
                  <p className="text-gray-800 font-semibold">Variations:</p>
                  <ul className="list-disc list-inside text-gray-700">
                    {result.variations.map(
                      (variation: string, index: number) => (
                        <li key={index} className="ml-4">
                          {variation}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {result.phoneticKeys?.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold text-blue-600">Phonetic Keys:</p>
                  <ul className="list-disc list-inside text-gray-700">
                    {result.phoneticKeys.map((key: string, index: number) => (
                      <li key={index} className="ml-4">
                        {key}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-2">
                <p className="text-gray-800">
                  <span className="font-semibold text-blue-600">Category:</span>{" "}
                  {result.category}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// {result && (
//   <div className="mt-4 w-full text-left">
//     <pre className="p-2 bg-gray-100 rounded-lg overflow-auto text-sm max-h-60">
//       {JSON.stringify(result, null, 2)}
//     </pre>
//   </div>
// )}
