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

    const { soundex, metaphone, transliterated } = generatePhoneticKeys(query);
    console.log("Phonetic Keys:", { soundex, metaphone, transliterated });

    let match = await Normalization.findOne({
      $or: [
        { phoneticKeys: { $in: [soundex, metaphone, transliterated] } },
        { variations: { $regex: query, $options: "i" } },
        { canonicalName: query },
      ],
    });

    if (match) {
      let updated = false;
      if (!match.variations.includes(query)) {
        match.variations.push(query);
        updated = true;
      }
      if (!match.phoneticKeys.includes(soundex)) {
        match.phoneticKeys.push(soundex);
        updated = true;
      }
      if (!match.phoneticKeys.includes(metaphone)) {
        match.phoneticKeys.push(metaphone);
        updated = true;
      }
      match.canonicalName = query;
      if (updated) {
        await match.save();
        console.log("Updated existing match:", match);
      }

      return NextResponse.json({ message: "Updated existing match", match });
    }

    const llmResponse = await callLLM(query);
    console.log("LLM Response ==>>", llmResponse);

    if (llmResponse.match !== "new_entity") {
      let existing = await Normalization.findOne({
        canonicalName: llmResponse.match,
      });

      if (existing) {
        let updated = false;
        if (!existing.variations.includes(query)) {
          existing.variations.push(query);
          updated = true;
        }
        if (!existing.phoneticKeys.includes(soundex)) {
          existing.phoneticKeys.push(soundex);
          updated = true;
        }
        if (!existing.phoneticKeys.includes(metaphone)) {
          existing.phoneticKeys.push(metaphone);
          updated = true;
        }

        if (updated) {
          await existing.save();
          console.log("Updated LLM-matched record:", existing);
        }

        return NextResponse.json({
          message: "Updated existing LLM-matched record",
          match: existing,
        });
      }
    }

    const variations = [query, ...(llmResponse.variations || [])];
    const phoneticKeys = new Set<string>();
    variations.forEach((variant) => {
      const { soundex, metaphone, transliterated } =
        generatePhoneticKeys(variant);
      phoneticKeys.add(soundex);
      phoneticKeys.add(metaphone);
      phoneticKeys.add(transliterated);
    });

    const newEntry = await Normalization.create({
      canonicalName: query,
      variations,
      phoneticKeys: Array.from(phoneticKeys),
      category: llmResponse.category || "general",
    });

    console.log("Created new entry:", newEntry);

    return NextResponse.json({ message: "Created new entry", match: newEntry });
  } catch (error) {
    console.error("Error ==>> ", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
