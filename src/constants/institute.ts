import type { Institute } from "@/types/common.types";
import TechvaaLogo from "@/assets/images/TECHVAA.png";
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
  TECHVAA: {
    name: "Techvaa",
    shortName: "TECHVAA",
    logo: TechvaaLogo,
    address: "",
    authorizedBy: "Authorized - Techvaa",
    headerColor: "#153767",
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
