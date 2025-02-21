import { connect_db } from "@/configs/db";
import { callLLM } from "@/configs/openAi";
import { Normalization } from "@/models/normaliization.model";
import { NextRequest, NextResponse } from "next/server";
import { soundex } from "soundex-code";
import { metaphone } from "metaphone";
import { transliterate } from "hebrew-transliteration";

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

connect_db();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    console.log("Query==>> ", query);

    const { soundex, metaphone, transliterated } = generatePhoneticKeys(query);
    console.log("Phonetic Keys:", { soundex, metaphone, transliterated });

    let match = await Normalization.findOne({
      $or: [
        { phoneticKeys: { $in: [soundex, metaphone, transliterated] } },
        { variations: { $regex: query, $options: "i" } },
      ],
    });

    if (match) {
      if (!match.variations.includes(query)) match.variations.push(query);
      if (!match.phoneticKeys.includes(soundex))
        match.phoneticKeys.push(soundex);
      if (!match.phoneticKeys.includes(metaphone))
        match.phoneticKeys.push(metaphone);

      match.canonicalName = query;
      await match.save();

      return NextResponse.json({ message: "Updated existing match", match });
    }

    const llmResponse = await callLLM(query);
    console.log("LLM Response==>> ", llmResponse);

    if (llmResponse !== "new_entity") {
      let existing = await Normalization.findOne({
        canonicalName: llmResponse,
      });

      if (existing) {
        if (!existing.variations.includes(query))
          existing.variations.push(query);
        if (!existing.phoneticKeys.includes(soundex))
          existing.phoneticKeys.push(soundex);
        if (!existing.phoneticKeys.includes(metaphone))
          existing.phoneticKeys.push(metaphone);
        existing.canonicalName = query;
        await existing.save();

        return NextResponse.json({
          message: "Updated existing LLM-matched record",
          match: existing,
        });
      }
    }

    const newEntry = await Normalization.create({
      canonicalName: query,
      variations: [query],
      phoneticKeys: [soundex, metaphone, transliterated],
      category: "unknown",
    });

    return NextResponse.json({ message: "Created new entry", match: newEntry });
  } catch (error) {
    console.log("Error==>> ", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
