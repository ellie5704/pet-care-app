import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import connectDB from "@/lib/db";
import ShoppingItem from "@/models/shoppingItem";
import User from "@/models/user";
import { sessionOptions } from "@/lib/session";

function normalizeShoppingPayload(payload) {
  const normalized = { ...payload };

  if (!normalized.petId) {
    delete normalized.petId;
  }

  if (normalized.quantity === "" || normalized.quantity === null) {
    delete normalized.quantity;
  }

  if (normalized.estimatedCost === "" || normalized.estimatedCost === null) {
    delete normalized.estimatedCost;
  }

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

export async function PUT(req, { params }) {
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

    const { itemId } = await params;
    if (!itemId) {
      return Response.json({ error: "Missing shopping item id" }, { status: 400 });
    }
    const body = normalizeShoppingPayload(await req.json());

    if (!user.householdId) {
      return Response.json({ error: "Household not found" }, { status: 404 });
    }

    const shoppingItem = await ShoppingItem.findOneAndUpdate(
      { _id: itemId, familyProfileId: user.householdId },
      body,
      { new: true },
    ).populate(["petId", "addedBy", "completedBy"]);

    if (!shoppingItem) {
      return Response.json(
        { error: "Shopping item not found" },
        { status: 404 },
      );
    }

    return Response.json(shoppingItem, { status: 200 });
  } catch (error) {
    console.error("Error updating shopping item:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
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

    const { itemId } = await params;
    if (!itemId) {
      return Response.json({ error: "Missing shopping item id" }, { status: 400 });
    }

    if (!user.householdId) {
      return Response.json({ error: "Household not found" }, { status: 404 });
    }

    const shoppingItem = await ShoppingItem.findOneAndDelete({
      _id: itemId,
      familyProfileId: user.householdId,
    });

    if (!shoppingItem) {
      return Response.json(
        { error: "Shopping item not found" },
        { status: 404 },
      );
    }

    return Response.json(
      { message: "Shopping item deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting shopping item:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
