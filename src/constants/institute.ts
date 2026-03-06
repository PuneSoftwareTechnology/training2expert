import type { Institute } from "@/types/common.types";
import PSTLogo from "@/assets/images/PST.png";
import TCHLogo from "@/assets/images/TCH.webp";

export interface InstituteConfig {
  name: string;
  shortName: Institute;
  logo: string;
  address?: string;
  authorizedBy: string;
  headerColor: string;
}

export const INSTITUTE_CONFIG: Record<Institute, InstituteConfig> = {
  PST: {
    name: "Pune Software Technologies",
    shortName: "PST",
    logo: PSTLogo,
    address: "",
    authorizedBy: "Autorized - Pune Software Technologies",
    headerColor: "#1a3c7a",
  },
  TCH: {
    name: "TCH Software Services LLP",
    shortName: "TCH",
    logo: TCHLogo,
    address: "Office -305, Royal Tranquil, Konkane Chowck, Pune - 411027",
    authorizedBy: "Autorized - Tech Concept Hub",
    headerColor: "#4a1a8a",
  },
};
