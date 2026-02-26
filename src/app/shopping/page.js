"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  DollarSign,
  Package,
  ShoppingBasket,
  CircleCheckBig,
} from "lucide-react";
import ShoppingList from "@/components/ShoppingList";

const petFoodStarter = [
  "Dry food (age + breed appropriate)",
  "Wet food / toppers",
  "Training treats",
  "Dental chews",
  "Supplements (joint, skin/coat, probiotics)",
  "Travel or emergency food pack",
];

const petSupplyStarter = [
  "Food and water bowls",
  "Leash / harness / collar",
  "Waste bags or litter",
  "Shampoo and grooming brush",
  "Flea/tick prevention",
  "Pet-safe cleaning supplies",
  "Bed, crate, or carrier",
  "Enrichment toys",
];

const storeSuggestions = [
  {
    name: "Chewy",
    bestFor: "Auto-ship food and routine essentials",
    tip: "Use subscription pricing for food and litter refills.",
  },
  {
    name: "Pets at Home",
    bestFor: "In-store pickup and branded supplies",
    tip: "Useful for same-day replacement items.",
  },
  {
    name: "Costco",
    bestFor: "Bulk purchases for multi-pet households",
    tip: "Compare unit price before buying large packs.",
  },
  {
    name: "Local Feed or Independent Pet Store",
    bestFor: "Specialty diets and local product advice",
    tip: "Ask about loyalty rewards and neighborhood delivery.",
  },
];

export default function ShoppingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchPageData();
  }, []);

  const fetchPageData = async () => {
    try {
      setLoading(true);

      const userResponse = await fetch("/api/auth/me");
      const userData = await userResponse.json();

      if (!userData.user) {
        router.push("/login");
        return;
      }

      const shoppingResponse = await fetch("/api/shopping?includeCompleted=true");
      const shoppingData = await shoppingResponse.json();
      setItems(Array.isArray(shoppingData) ? shoppingData : []);
    } catch (error) {
      console.error("Failed to load shopping data:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const expenseSummary = useMemo(() => {
    const total = items.reduce(
      (sum, item) => sum + (Number(item.estimatedCost) || 0),
      0,
    );
    const pending = items
      .filter((item) => !item.isCompleted)
      .reduce((sum, item) => sum + (Number(item.estimatedCost) || 0), 0);
    const completed = total - pending;

    return {
      total,
      pending,
      completed,
      itemCount: items.length,
    };
  }, [items]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9faf7] flex items-center justify-center">
        <p className="text-[#697a63]">Loading shopping workspace...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f9faf7] p-4 md:p-6">
      <div className="bg-white/95 shadow-xl ring-1 ring-[#dbe1d4] rounded-2xl p-6 space-y-8">
        <section className="pb-6 border-b border-gray-200">
          <h1 className="text-3xl font-semibold text-[#4f5a4c] tracking-tight">
            Shopping Planner
          </h1>
          <p className="text-[#6b7867] mt-2 py-2">
            Plan food and supplies, track expected spending, and keep one shared
            list for your household.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <SummaryCard
            title="Estimated Total"
            value={`£${expenseSummary.total.toFixed(2)}`}
            subtitle="All items (open + completed)"
            icon={DollarSign}
          />
          <SummaryCard
            title="Still To Buy"
            value={`£${expenseSummary.pending.toFixed(2)}`}
            subtitle="Current open items"
            icon={ShoppingBasket}
          />
          <SummaryCard
            title="Already Purchased"
            value={`£${expenseSummary.completed.toFixed(2)}`}
            subtitle="Completed items"
            icon={CircleCheckBig}
          />
          <SummaryCard
            title="Tracked Items"
            value={`${expenseSummary.itemCount}`}
            subtitle="Total entries"
            icon={Package}
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-[#dbe1d4] bg-[#f7faf3] p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-[#4f5a4c] mb-4">
              Pet Food Checklist
            </h2>
            <ul className="space-y-2 text-[#4f5a4c]">
              {petFoodStarter.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#697a63]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[#dbe1d4] bg-[#f7faf3] p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-[#4f5a4c] mb-4">
              Pet Supplies Checklist
            </h2>
            <ul className="space-y-2 text-[#4f5a4c]">
              {petSupplyStarter.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#697a63]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-[#dbe1d4] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-[#4f5a4c] mb-4">
            Shared Shopping List
          </h2>
          <ShoppingList />
        </section>

        <section className="rounded-2xl border border-[#dbe1d4] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Store className="text-[#697a63]" size={20} />
            <h2 className="text-xl font-semibold text-[#4f5a4c]">
              Where To Shop
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {storeSuggestions.map((shop) => (
              <div
                key={shop.name}
                className="rounded-xl border border-[#dbe1d4] bg-[#f9faf7] p-4"
              >
                <h3 className="text-lg text-[#243022]">{shop.name}</h3>
                <p className="text-sm text-[#4f5a4c] mt-1">
                  <span className="font-medium">Best for:</span> {shop.bestFor}
                </p>
                <p className="text-sm text-[#6b7867] mt-2">Tip: {shop.tip}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="bg-gradient-to-br from-white to-[#f6faf2] p-5 rounded-2xl border border-[#dbe1d4] shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-base text-[#4f5a4c] font-medium">{title}</p>
        <Icon size={18} className="text-[#697a63]" />
      </div>
      <p className="text-3xl font-bold text-[#243022]">{value}</p>
      <p className="text-sm text-[#6b7867] mt-1">{subtitle}</p>
    </div>
  );
}
