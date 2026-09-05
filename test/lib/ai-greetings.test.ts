import { describe, expect, it } from "vitest";
import {
  isPureGreeting,
  getTimeOfDayGreeting,
  generateGreetingResponse,
} from "@/lib/ai-greetings";

describe("AI Greetings Module", () => {
  describe("isPureGreeting", () => {
    it("recognizes simple greetings", () => {
      expect(isPureGreeting("halo")).toBe(true);
      expect(isPureGreeting("Halo")).toBe(true);
      expect(isPureGreeting("HAI")).toBe(true);
      expect(isPureGreeting("helo")).toBe(true);
      expect(isPureGreeting("hello")).toBe(true);
      expect(isPureGreeting("pagi")).toBe(true);
      expect(isPureGreeting("siang")).toBe(true);
      expect(isPureGreeting("sore")).toBe(true);
      expect(isPureGreeting("malam")).toBe(true);
    });

    it("recognizes greetings with bot salutations or polite affixes", () => {
      expect(isPureGreeting("halo uanginbot")).toBe(true);
      expect(isPureGreeting("hai bot!")).toBe(true);
      expect(isPureGreeting("selamat pagi kak")).toBe(true);
      expect(isPureGreeting("pagi min")).toBe(true);
      expect(isPureGreeting("assalamualaikum min")).toBe(true);
      expect(isPureGreeting("assalamu'alaikum!")).toBe(true);
      expect(isPureGreeting("hai apa kabar")).toBe(true);
      expect(isPureGreeting("halo apa kabar?")).toBe(true);
    });

    it("rejects non-greeting messages and questions", () => {
      expect(isPureGreeting("Berapa saldo saya?")).toBe(false);
      expect(isPureGreeting("Halo, berapa saldo saya?")).toBe(false);
      expect(isPureGreeting("pagi, kurir datang jam berapa?")).toBe(false);
      expect(isPureGreeting("gimana cara pakai aplikasi ini")).toBe(false);
      expect(isPureGreeting("sampah plastik")).toBe(false);
      expect(isPureGreeting("jadwal pickup")).toBe(false);
      expect(isPureGreeting("")).toBe(false);
    });
  });

  describe("getTimeOfDayGreeting", () => {
    it("returns correct time period for WITA time", () => {
      // 08:00 WITA (00:00 UTC) -> Pagi
      const pagiDate = new Date("2026-09-05T00:00:00Z");
      expect(getTimeOfDayGreeting(pagiDate)).toBe("pagi");

      // 12:00 WITA (04:00 UTC) -> Siang
      const siangDate = new Date("2026-09-05T04:00:00Z");
      expect(getTimeOfDayGreeting(siangDate)).toBe("siang");

      // 16:00 WITA (08:00 UTC) -> Sore
      const soreDate = new Date("2026-09-05T08:00:00Z");
      expect(getTimeOfDayGreeting(soreDate)).toBe("sore");

      // 21:00 WITA (13:00 UTC) -> Malam
      const malamDate = new Date("2026-09-05T13:00:00Z");
      expect(getTimeOfDayGreeting(malamDate)).toBe("malam");
    });
  });

  describe("generateGreetingResponse", () => {
    it("generates a structured greeting template with options", () => {
      const morningDate = new Date("2026-09-05T00:00:00Z");
      const response = generateGreetingResponse("Budi", morningDate);

      expect(response).toContain("Halo Kak **Budi**! Selamat Pagi! 👋");
      expect(response).toContain("UanginBot");
      expect(response).toContain("Cek Saldo");
      expect(response).toContain("Status Penjemputan");
      expect(response).toContain("Jadwal Pickup");
      expect(response).toContain("Kategori Sampah");
      expect(response).toContain("🌱");
    });

    it("generates generic greeting if userName is not provided", () => {
      const response = generateGreetingResponse(null);
      expect(response).toContain("Halo! Selamat");
      expect(response).not.toContain("Kak **null**");
    });
  });
});
