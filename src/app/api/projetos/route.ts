// app/api/projetos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/connectDB";
import Order from "@/models/Order";
import PartnerProject from "@/models/PartnerProject";

type ProjectStatus = "active" | "paused" | "no_sales";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // 🔹 Somente pedidos BUCKPAY que estão PAGOS
const orders = await Order.find({
  status: "paid",
  gateway: { $in: ["buckpay", "blackcat"] },
}).lean();

    type ProjectAgg = {
      siteSlug: string;
      totalOrders: number;
      totalGross: number;
      totalNet: number;
      myCommissionTotal: number;
      lastOrderAt: Date | null;
    };

    const map = new Map<string, ProjectAgg>();

    // ===== AGREGA AS VENDAS POR SITE =====
    for (const o of orders as any[]) {
      const siteSlug: string = o.siteSlug || "desconhecido";

      const totalAmountInCents: number = o.totalAmountInCents ?? 0;
      const netAmountInCents: number = o.netAmountInCents ?? 0;

      const grossReais = totalAmountInCents / 100;
      const netReais = netAmountInCents / 100;
      const myCommissionReais = netReais * 0.3; // 30% do lucro

      const createdAt: Date =
        o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt);

      if (!map.has(siteSlug)) {
        map.set(siteSlug, {
          siteSlug,
          totalOrders: 0,
          totalGross: 0,
          totalNet: 0,
          myCommissionTotal: 0,
          lastOrderAt: null,
        });
      }

      const agg = map.get(siteSlug)!;
      agg.totalOrders += 1;
      agg.totalGross += grossReais;
      agg.totalNet += netReais;
      agg.myCommissionTotal += myCommissionReais;

      if (!agg.lastOrderAt || createdAt > agg.lastOrderAt) {
        agg.lastOrderAt = createdAt;
      }
    }

    const aggs = Array.from(map.values());
    const slugs = aggs.map((p) => p.siteSlug);

    // ===== BUSCA CONFIGURAÇÃO DOS PARCEIROS =====
    const configs = await PartnerProject.find({
      siteSlug: { $in: slugs },
    }).lean();

    const configBySlug = new Map(
      configs.map((c: any) => [c.siteSlug, c])
    );

    // ===== MONTA A RESPOSTA FINAL =====
    const projects = aggs.map((p) => {
      const cfg = configBySlug.get(p.siteSlug);

      let status: ProjectStatus = "no_sales";
      if (p.totalOrders > 0) status = "active";

      return {
        id: p.siteSlug,
        siteSlug: p.siteSlug,

        // 🔹 usa configs, senão usa fallback
        partnerName: cfg?.partnerName || "",
        siteName: cfg?.siteName || p.siteSlug,
        domain: cfg?.domain || "",
        buckpayStoreId: cfg?.buckpayStoreId || null,
        utmBase: cfg?.utmBase || null,

        // 🔹 valores agregados
        totalOrders: p.totalOrders,
        totalGross: Number(p.totalGross.toFixed(2)),
        totalNet: Number(p.totalNet.toFixed(2)),
        myCommissionTotal: Number(p.myCommissionTotal.toFixed(2)),

        // 🔹 status
        status,
        lastOrderAt: p.lastOrderAt ? p.lastOrderAt.toISOString() : null,
      };
    });

    return NextResponse.json(projects);
  } catch (err) {
    console.error("[Projetos] Erro ao listar projetos:", err);
    return NextResponse.json(
      { error: "Erro interno ao listar projetos." },
      { status: 500 }
    );
  }
}
