export type QrType =
  | "url"
  | "text"
  | "wifi"
  | "phone"
  | "email"
  | "vcard"
  | "menu"
  | "wedding"
  | "rsvp"
  | "instagram"
  | "payment"
  | "ticket"
  | "pdf";

export type QrFormState = {
  type: QrType;
  url: string;
  text: string;
  wifi: { ssid: string; password: string; encryption: "WPA" | "WEP" | "nopass" };
  phone: { number: string; name: string };
  email: { to: string; subject: string; body: string };
  vcard: {
    name: string;
    phone: string;
    email: string;
    company: string;
    title: string;
    workPhone: string;
    fax: string;
    street: string;
    city: string;
    state: string;
    country: string;
    zip: string;
    website: string;
  };
  menu: string;
  wedding: {
    partner1: string;
    partner2: string;
    date: string;
    time: string;
    venue: string;
    venueAddress: string;
    note: string;
  };
  rsvp: { event: string; link: string; deadline: string; host: string; message: string };
  instagram: string;
  payment: {
    provider: "paypal" | "venmo" | "cashapp" | "url";
    handle: string;
    amount: string;
    currency: string;
    note: string;
  };
  ticket: {
    event: string;
    date: string;
    time: string;
    venue: string;
    section: string;
    row: string;
    seat: string;
    holder: string;
    confirmation: string;
    link: string;
  };
  pdf: string;
};

export const defaultForm: QrFormState = {
  type: "url",
  url: "",
  text: "",
  wifi: { ssid: "", password: "", encryption: "WPA" },
  phone: { number: "", name: "" },
  email: { to: "", subject: "", body: "" },
  vcard: {
    name: "",
    phone: "",
    email: "",
    company: "",
    title: "",
    workPhone: "",
    fax: "",
    street: "",
    city: "",
    state: "",
    country: "",
    zip: "",
    website: "",
  },
  menu: "",
  wedding: {
    partner1: "",
    partner2: "",
    date: "",
    time: "",
    venue: "",
    venueAddress: "",
    note: "",
  },
  rsvp: {
    event: "",
    link: "",
    deadline: "",
    host: "",
    message: "",
  },
  instagram: "",
  payment: { provider: "paypal", handle: "", amount: "", currency: "", note: "" },
  ticket: {
    event: "",
    date: "",
    time: "",
    venue: "",
    section: "",
    row: "",
    seat: "",
    holder: "",
    confirmation: "",
    link: "",
  },
  pdf: "",
};

const escapeWifi = (s: string) => s.replace(/([\\;,":])/g, "\\$1");

export function buildQrPayload(f: QrFormState): string {
  switch (f.type) {
    case "url":
      return f.url || "https://";
    case "text":
      return f.text || " ";
    case "wifi":
      return `WIFI:T:${f.wifi.encryption};S:${escapeWifi(f.wifi.ssid)};P:${escapeWifi(
        f.wifi.password,
      )};;`;
    case "phone":
      return `tel:${f.phone.number}`;
    case "email":
      return `mailto:${f.email.to}?subject=${encodeURIComponent(
        f.email.subject,
      )}&body=${encodeURIComponent(f.email.body)}`;
    case "vcard": {
      const v = f.vcard;
      const adr = [v.street, v.city, v.state, v.zip, v.country].some(Boolean)
        ? `ADR:;;${v.street};${v.city};${v.state};${v.zip};${v.country}`
        : null;
      return [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${v.name}`,
        v.company && `ORG:${v.company}`,
        v.title && `TITLE:${v.title}`,
        v.phone && `TEL;TYPE=CELL:${v.phone}`,
        v.workPhone && `TEL;TYPE=WORK:${v.workPhone}`,
        v.fax && `TEL;TYPE=FAX:${v.fax}`,
        v.email && `EMAIL:${v.email}`,
        v.website && `URL:${v.website}`,
        adr,
        "END:VCARD",
      ]
        .filter(Boolean)
        .join("\n");
    }
    case "menu":
      return f.menu;
    case "wedding":
      return [
        `${f.wedding.partner1} & ${f.wedding.partner2}`,
        `${f.wedding.date} ${f.wedding.time}`,
        f.wedding.venue,
        f.wedding.venueAddress,
        f.wedding.note,
      ]
        .filter(Boolean)
        .join("\n");
    case "rsvp":
      return [
        f.rsvp.event,
        f.rsvp.host && `Host: ${f.rsvp.host}`,
        f.rsvp.deadline && `RSVP by ${f.rsvp.deadline}`,
        f.rsvp.link,
        f.rsvp.message,
      ]
        .filter(Boolean)
        .join("\n");
    case "instagram":
      return `https://instagram.com/${f.instagram.replace(/^@/, "")}`;
    case "payment": {
      const h = f.payment.handle.replace(/^@/, "");
      let url: string;
      switch (f.payment.provider) {
        case "paypal":
          url = `https://paypal.me/${h}${f.payment.amount ? `/${f.payment.amount}` : ""}`;
          break;
        case "venmo":
          url = `https://venmo.com/${h}${
            f.payment.amount ? `?txn=pay&amount=${f.payment.amount}` : ""
          }`;
          break;
        case "cashapp":
          url = `https://cash.app/$${h}${f.payment.amount ? `/${f.payment.amount}` : ""}`;
          break;
        default:
          url = h.startsWith("http") ? h : `https://${h}`;
      }
      return f.payment.note ? `${url}\n${f.payment.note}` : url;
    }
    case "ticket":
      return [
        f.ticket.event,
        [f.ticket.date, f.ticket.time].filter(Boolean).join(" "),
        f.ticket.venue,
        [
          f.ticket.section && `Sec ${f.ticket.section}`,
          f.ticket.row && `Row ${f.ticket.row}`,
          f.ticket.seat && `Seat ${f.ticket.seat}`,
        ]
          .filter(Boolean)
          .join(" · "),
        f.ticket.holder && `Holder: ${f.ticket.holder}`,
        f.ticket.confirmation && `Conf: ${f.ticket.confirmation}`,
        f.ticket.link,
      ]
        .filter(Boolean)
        .join("\n");
    case "pdf":
      return f.pdf;
  }
}
