import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import connectDB from "@/lib/db";
import ShoppingItem from "@/models/shoppingItem";
import User from "@/models/user";
import { sessionOptions } from "@/lib/session";

function normalizeShoppingPayload(payload) {
  const normalized = { ...payload };

  // Optional ObjectId field must be omitted when blank.
  if (!normalized.petId) {
    delete normalized.petId;
  }

  // Optional numeric fields should not be stored as empty strings.
  if (normalized.quantity === "" || normalized.quantity === null) {
    delete normalized.quantity;
  }

  if (normalized.estimatedCost === "" || normalized.estimatedCost === null) {
    delete normalized.estimatedCost;
  }

  // Trim optional text fields and drop if blank.
  ["unit", "supplier", "notes"].forEach((key) => {
    if (typeof normalized[key] === "string") {
      normalized[key] = normalized[key].trim();
      if (!normalized[key]) {
        delete normalized[key];
      }
    }
  });

  return normalized;
}

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);

    if (!session.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.userId);
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const body = normalizeShoppingPayload(await req.json());

    if (!user.householdId) {
      return Response.json({ error: "Household not found" }, { status: 404 });
    }

    const shoppingItem = new ShoppingItem({
      ...body,
      familyProfileId: user.householdId,
    });

    await shoppingItem.save();
    await shoppingItem.populate(["petId", "addedBy", "completedBy"]);

    return Response.json(shoppingItem, { status: 201 });
  } catch (error) {
    console.error("Error creating shopping item:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);

    if (!session.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.userId);
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const includeCompleted = searchParams.get("includeCompleted") === "true";

    if (!user.householdId) {
      return Response.json({ error: "Household not found" }, { status: 404 });
    }

    let query = { familyProfileId: user.householdId };

    if (!includeCompleted) {
      query.isCompleted = false;
    }

    const items = await ShoppingItem.find(query)
      .populate("petId")
      .populate("addedBy")
      .populate("completedBy")
      .sort({ priority: -1, createdAt: -1 });

    return Response.json(items, { status: 200 });
  } catch (error) {
    console.error("Error fetching shopping items:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
