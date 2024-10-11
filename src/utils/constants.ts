import path from "path"
import os from "os"
import type { DefaultOptionPrompts } from "../types/types";
import axios from "axios";

export const DEFAULT_DIR = path.join(os.homedir(), ".config", "icli/");
export const DEFAULT_INVOICES_DIR = path.join(os.homedir(), "Documents", "Invoices/")
export const DEFAULT_PATH = path.join(os.homedir(), ".config", "icli/icli.json");
export const INVOICE_PATH = path.join(path.dirname(DEFAULT_PATH), "invoices.json");

export const DEFAULT_OPTION_PROMPTS: DefaultOptionPrompts = {
  sortCode: {
    required: true,
    type: "input",
    message: "Enter your sort code",
    validate: val => {
      const sortCodePattern = /^\d{2}-\d{2}-\d{2}$/;
      return sortCodePattern.test(val) || "Sort code must be in the format XX-XX-XX (e.g., 12-34-56)";
    }
  },
  bankNum: {
    required: true,
    type: "number",
    message: "Enter your bank account number",
    validate: num => {
      const bankNumStr = num.toString();
      return /^\d{8}$/.test(bankNumStr) || "Bank account number must be exactly 8 digits long";
    }
  },
  fullName: {
    required: true,
    type: "input",
    message: "Enter your full name",
    validate: str => {
      const fullNamePattern = /^[a-zA-Z]+([ '-][a-zA-Z]+)+$/;
      return fullNamePattern.test(str) || "Full name must contain at least two parts (e.g., John Doe) and only letters, spaces, hyphens, or apostrophes";
    }
  },
  address: {
    required: true,
    type: "input",
    message: "Enter your line of address",
    validate: str => {
      const addressPattern = /^[a-zA-Z0-9\s,.\-]+$/;
      return (str.length >= 5 && addressPattern.test(str)) || "Address must be at least 5 characters long and can contain letters, numbers, spaces, commas, and periods.";
    }
  },
  email: {
    required: true,
    type: "input",
    message: "Enter your email address",
    validate: str => {
      if (!str) return "Email cannot be empty"

      const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.test(str)) return "Please insert a valid email address."

      return true
    }
  },
  postcode: {
    required: true,
    type: "input",
    message: "Enter your postcode",
    validate: str => {
      const postcodePattern = /^([A-Z]{1,2}\d{1,2}|[A-Z]{1,2}\d{1,2}[A-Z]?)\s?\d[A-Z]{2}$/i;
      return postcodePattern.test(str) || "Postcode must be in a valid format (e.g., AB1 2CD).";
    }
  },
  logo: {
    required: false,
    type: "input",
    message: "Enter your logo source",
    validate: async str => {
      if (!str) return 'Logo source cannot be empty'
      
      const url = /^(ftp|http|https):\/\/[^ "]+$/;
      if (!url.test(str)) return "Please enter a valid URL"

      try {
        const res = await axios.head(str)
        return res.status === 200 ? true : "The URL must point to a valid image"
      } catch (e) {
        return "Unable to access URL."
      }
    }
  }

};

