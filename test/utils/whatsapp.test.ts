import { describe, it, expect } from "vitest";
import {
  formatToWhatsAppPhone,
  buildWhatsAppUrl,
  WHATSAPP_TEMPLATES,
  getDefaultTemplate,
  WhatsAppMessageContext,
} from "@/utils/whatsapp";

describe("whatsapp utils", () => {
  describe("formatToWhatsAppPhone", () => {
    it("converts Indonesian 08xx number to 628xx format", () => {
      expect(formatToWhatsAppPhone("081234567890")).toBe("6281234567890");
    });

    it("strips whitespace, dashes, and parentheses", () => {
      expect(formatToWhatsAppPhone("0812-3456-7890")).toBe("6281234567890");
      expect(formatToWhatsAppPhone("+62 812 3456 7890")).toBe("6281234567890");
      expect(formatToWhatsAppPhone("(0812) 34567890")).toBe("6281234567890");
    });

    it("handles number starting directly with 8", () => {
      expect(formatToWhatsAppPhone("81234567890")).toBe("6281234567890");
    });

    it("keeps already formatted 628xx number", () => {
      expect(formatToWhatsAppPhone("6281234567890")).toBe("6281234567890");
    });

    it("handles empty or blank string gracefully", () => {
      expect(formatToWhatsAppPhone("")).toBe("");
    });
  });

  describe("WHATSAPP_TEMPLATES", () => {
    const mockContext: WhatsAppMessageContext = {
      recipientName: "Budi Santoso",
      courierName: "Ahmad",
      ticketId: "TK-123456",
      address: "Jl. Sudirman No. 10, Jakarta",
      status: "on_the_way",
    };

    it("contains all required courier message templates", () => {
      const templateIds = WHATSAPP_TEMPLATES.map((t) => t.id);
      expect(templateIds).toContain("on_the_way");
      expect(templateIds).toContain("arrived");
      expect(templateIds).toContain("directions");
      expect(templateIds).toContain("confirmation");
    });

    it("renders 'on_the_way' template with customer and ticket details", () => {
      const template = WHATSAPP_TEMPLATES.find((t) => t.id === "on_the_way")!;
      const msg = template.getMessage(mockContext);

      expect(msg).toContain("Halo Kak Budi Santoso");
      expect(msg).toContain("Ahmad");
      expect(msg).toContain("TK-123456");
      expect(msg).toContain("Jl. Sudirman No. 10, Jakarta");
      expect(msg).toContain("sedang dalam perjalanan");
    });

    it("renders 'arrived' template", () => {
      const template = WHATSAPP_TEMPLATES.find((t) => t.id === "arrived")!;
      const msg = template.getMessage(mockContext);

      expect(msg).toContain("sudah tiba di lokasi penjemputan");
      expect(msg).toContain("Budi Santoso");
      expect(msg).toContain("TK-123456");
    });

    it("handles fallback values when context is partially empty", () => {
      const emptyContext: WhatsAppMessageContext = {};
      const template = WHATSAPP_TEMPLATES.find((t) => t.id === "on_the_way")!;
      const msg = template.getMessage(emptyContext);

      expect(msg).toContain("Halo Kak Nasabah");
      expect(msg).toContain("Kurir UanginKuy");
    });
  });

  describe("getDefaultTemplate", () => {
    it("returns 'on_the_way' template for 'on_the_way' status", () => {
      const template = getDefaultTemplate("on_the_way");
      expect(template.id).toBe("on_the_way");
    });

    it("returns a valid template by default", () => {
      const template = getDefaultTemplate();
      expect(template.id).toBe("on_the_way");
    });
  });

  describe("buildWhatsAppUrl", () => {
    it("creates properly formatted https://wa.me URL with encoded message", () => {
      const url = buildWhatsAppUrl("081234567890", "Halo Kak Budi!");
      expect(url).toBe("https://wa.me/6281234567890?text=Halo%20Kak%20Budi!");
    });
  });
});
