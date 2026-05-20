import type { QrType } from "@/lib/qr/payload";
import type { QrStyle } from "@/lib/qr/style";

export type QrTemplate = {
  id: string;
  name: string;
  description: string;
  type: QrType;
  preset: Partial<QrStyle>;
};

/**
 * Standard is the default in every situation. The remaining templates only
 * pre-fill colors and corner styles — the form data stays whatever the user
 * already typed.
 */
export const TEMPLATES: QrTemplate[] = [
  {
    id: "standard",
    name: "Standard",
    description: "Classic black & white. Maximum scan reliability.",
    type: "url",
    preset: {
      fg: "#0f172a",
      bg: "#ffffff",
      dotStyle: "rounded",
      cornerSquareStyle: "extra-rounded",
      cornerDotStyle: "dot",
      gradient: null,
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Soft blue gradient — great for SaaS and tech brands.",
    type: "url",
    preset: {
      fg: "#1d4ed8",
      bg: "#ffffff",
      dotStyle: "rounded",
      cornerSquareStyle: "extra-rounded",
      cornerDotStyle: "dot",
      gradient: { from: "#1d4ed8", to: "#38bdf8" },
    },
  },
  {
    id: "wedding",
    name: "Wedding",
    description: "Romantic blush palette with elegant rounded dots.",
    type: "wedding",
    preset: {
      fg: "#be185d",
      bg: "#fdf2f8",
      dotStyle: "rounded",
      cornerSquareStyle: "extra-rounded",
      cornerDotStyle: "dot",
      gradient: null,
    },
  },
  {
    id: "menu",
    name: "Restaurant Menu",
    description: "Warm amber styling for cafés and restaurants.",
    type: "menu",
    preset: {
      fg: "#9a3412",
      bg: "#fff7ed",
      dotStyle: "classy-rounded",
      cornerSquareStyle: "extra-rounded",
      cornerDotStyle: "square",
      gradient: null,
    },
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "Vibrant gradient inspired by Instagram brand colors.",
    type: "instagram",
    preset: {
      fg: "#9d174d",
      bg: "#ffffff",
      dotStyle: "dots",
      cornerSquareStyle: "extra-rounded",
      cornerDotStyle: "dot",
      gradient: { from: "#f97316", to: "#db2777" },
    },
  },
  {
    id: "vcard",
    name: "Business Card",
    description: "Crisp slate look perfect for vCards and professional use.",
    type: "vcard",
    preset: {
      fg: "#0f172a",
      bg: "#f8fafc",
      dotStyle: "square",
      cornerSquareStyle: "square",
      cornerDotStyle: "square",
      gradient: null,
    },
  },
  {
    id: "payment",
    name: "Payment",
    description: "Trust-building indigo for payment links.",
    type: "payment",
    preset: {
      fg: "#3730a3",
      bg: "#eef2ff",
      dotStyle: "rounded",
      cornerSquareStyle: "extra-rounded",
      cornerDotStyle: "dot",
      gradient: null,
    },
  },
  {
    id: "ticket",
    name: "Event Ticket",
    description: "Bold amber that pops on printed tickets.",
    type: "ticket",
    preset: {
      fg: "#a16207",
      bg: "#fefce8",
      dotStyle: "extra-rounded",
      cornerSquareStyle: "extra-rounded",
      cornerDotStyle: "dot",
      gradient: null,
    },
  },
];
