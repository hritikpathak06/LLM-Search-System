import { OpenAI } from "openai";
import { soundex } from "soundex-code";
import { metaphone } from "metaphone";
import { transliterate } from "hebrew-transliteration";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface LLMResponse {
  match: string;
  variations?: string[];
  category: string;
}

const normalizeHebrew = (text: string) => text.normalize("NFKC");

const generatePhoneticKeys = (text: string) => {
  const normalized = normalizeHebrew(text);
  const transliterated = transliterate(normalized, {
    vowels: false,
  } as any).toLowerCase();

  return {
    soundex: soundex(transliterated),
    metaphone: metaphone(transliterated),
    transliterated,
  };
};

export const callLLM = async (query: string): Promise<LLMResponse> => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `You are an entity normalization assistant. Given a user query, determine if it matches an existing entity.
          - If it matches, return: {"match": "canonical_name"}.
          - If it's a new entity, return:
            {
              "match": "new_entity",
              "variations": ["common_variant1", "variant2", "variant3"],
              "category": "most_relevant_category"
            }.
          - **Generate at least three relevant variations**, considering:
            - **Phonetic spelling** (e.g., "Kartik" → "Kartick", "Karthik")
            - **Common misspellings** (e.g., "Kartik" → "Karthick")
            - **Extra/missing letters** (e.g., "Kartik" → "Kartikk", "Kartk")
            - **Phoenix variations** (e.g., "Phoenix" → "Phoenicks")
          - **Categorize names intelligently**:
            - **Person** (e.g., "Ritik", "Michael") → Add common surnames, shortenings.
            - **Location** (e.g., "New York", "Paris") → Add abbreviations (e.g., "NYC"), phonetic changes.
            - **Brand** (e.g., "Nike", "Apple") → Add stylistic misspellings (e.g., "Nyke", "Appel").
          - Always return a valid JSON response.`,
        },
      ],
      response_format: "json" as any,
    });

    const content = response.choices[0].message.content;

    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    const parsedResponse = JSON.parse(content) as LLMResponse;

    if (!parsedResponse.category) {
      throw new Error("Missing category from OpenAI response");
    }

    return parsedResponse;
  } catch (error) {
    console.error("Error generating response:", error);

    return {
      match: "new_entity",
      variations: generateRelevantVariations(query),
      category: determineCategory(query),
    };
  }
};

const generateRelevantVariations = (query: string): string[] => {
  const { soundex: soundexKey, metaphone: metaphoneKey } =
    generatePhoneticKeys(query);

  return [
    query.replace(/c/g, "k"), // Phonetic swap
    query.replace(/t/g, "th"), // Phonetic swap
    query + query.slice(-1), // Duplicate last character
    query.slice(0, -1), // Remove last character
    soundexKey,
    metaphoneKey,
  ];
};

const determineCategory = (query: string): string => {
  if (/^[A-Z][a-z]+$/.test(query)) return "person";
  if (/^[A-Z][a-z]+\s[A-Z][a-z]+$/.test(query)) return "location";
  return "brand";
};
