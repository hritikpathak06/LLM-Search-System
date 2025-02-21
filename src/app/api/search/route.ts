import { connect_db } from "@/configs/db";
import { callLLM, generatePhoneticKey } from "@/configs/openAi";
import { Normalization } from "@/models/normaliization.model";
import { NextRequest, NextResponse } from "next/server";

connect_db();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const phoneticKey = generatePhoneticKey(query);

    let match = await Normalization.findOne({
      $or: [
        { phoneticKeys: { $in: [phoneticKey] } },
      ],
    });

    if (match) {
      if (!match.variations.includes(query)) {
        match.variations.push(query);
        await match.save();
      }
      return NextResponse.json({ match });
    }

    const llmResponse = await callLLM(query);
    if (llmResponse !== "new_entity") {
      let existing = await Normalization.findOne({
        canonicalName: llmResponse,
      });
      if (existing) {
        if (!existing.variations.includes(query)) {
          existing.variations.push(query);
        }
        if (!existing.phoneticKeys.includes(phoneticKey)) {
          existing.phoneticKeys.push(phoneticKey);
        }
        await existing.save();
        return NextResponse.json({
          message: "Updated existing record",
          match: existing,
        });
      }
    }

    const newEntry = await Normalization.create({
      canonicalName: query,
      variations: [query],
      phoneticKeys: [phoneticKey],
      category: "unknown",
    });

    return NextResponse.json({ match: newEntry });
  } catch (error) {
    console.log("Error==>> ", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
