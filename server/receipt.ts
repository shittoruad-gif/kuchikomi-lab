import PDFDocument from "pdfkit";
import type { PaymentHistory, User } from "../drizzle/schema";
import { PLAN_NAMES } from "@shared/const";

export async function generateReceiptPDF(
  payment: PaymentHistory,
  user: User,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    doc.fontSize(24).text("領収書", { align: "center" });
    doc.moveDown(2);

    // Receipt number
    doc.fontSize(12).text(`領収書番号: R-${String(payment.id).padStart(6, "0")}`, { align: "right" });
    doc.text(`発行日: ${new Date().toLocaleDateString("ja-JP")}`, { align: "right" });
    doc.moveDown(2);

    // Recipient
    doc.fontSize(14).text(`${user.name ?? "ご利用者"} 様`, { underline: true });
    doc.moveDown();

    // Details
    doc.fontSize(12);
    doc.text(`プラン: ${PLAN_NAMES[payment.plan as keyof typeof PLAN_NAMES] ?? payment.plan}`);
    doc.text(`金額: ¥${payment.amount.toLocaleString()} (税込)`);
    doc.text(`決済日: ${payment.paidAt ? new Date(payment.paidAt).toLocaleDateString("ja-JP") : "-"}`);
    doc.text(`ステータス: ${payment.status === "succeeded" ? "決済完了" : payment.status}`);
    doc.moveDown(2);

    // Separator
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    // Description
    if (payment.description) {
      doc.text(`備考: ${payment.description}`);
      doc.moveDown();
    }

    // Footer
    doc.moveDown(3);
    doc.fontSize(10).text("クチコミラボ", { align: "center" });
    doc.text("AI口コミ生成サービス", { align: "center" });

    doc.end();
  });
}
