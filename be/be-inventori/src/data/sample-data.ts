export type InitialEquipment = {
  serial: string;
  name: string;
  category: string;
  location: string;
  condition: "good" | "broken";
};

const LOC = "Biznet Duri Pulo";
const splicer = (serial: string, name: string, condition: "good" | "broken" = "good"): InitialEquipment => ({ serial, name: `Fusion Splicer ${name}`, category: "Mesin Fusion Splicer", location: LOC, condition });

/**
 * Daftar alat cabang Jakarta Duri Pulo (Biznet). Serial berawalan kode internal (DEVISER-, FITEL-, INNOVIEW3-,
 * TOGO-POWER-, OFI-) dipakai karena alat itu tidak punya nomor seri; ganti lewat menu Alat bila nomor aslinya ada.
 */
export const INITIAL_EQUIPMENT: InitialEquipment[] = [
  { serial: "DEVISER-AE2300-01", name: "OTDR DEVISER AE2300", category: "OTDR", location: LOC, condition: "good" },
  { serial: "DEVISER-AE3100-01", name: "OTDR DEVISER AE3100", category: "OTDR", location: LOC, condition: "good" },
  splicer("V01J20120899", "SIGNAL FIRE AI8", "broken"),
  splicer("VOCN23041211", "SIGNAL FIRE AI8"),
  splicer("W33J24122969", "SIGNAL FIRE AI8"),
  splicer("W33F24123031", "SIGNAL FIRE AI8"),
  splicer("W33P24124662", "SIGNAL FIRE AI8"),
  splicer("W33J24122961", "SIGNAL FIRE AI8"),
  splicer("V01B1B120431", "SIGNAL FIRE AI10"),
  splicer("VOCJ22121552", "SIGNAL FIRE AI10"),
  splicer("FITEL-01", "FITEL", "broken"),
  splicer("INNOVIEW3-01", "INNO VIEW 3"),
  { serial: "TOGO-POWER-01", name: "Togo Power Station", category: "Lain-lain", location: LOC, condition: "good" },
  { serial: "OFI-01", name: "Optical Fiber Identifier (OFI)", category: "Lain-lain", location: LOC, condition: "good" },
];
