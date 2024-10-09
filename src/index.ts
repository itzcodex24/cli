import os from "os";
import fs from "fs-extra";
import path from "path";
import inquirer from "inquirer";
import { Command } from "commander";
import logger from "./utils/logger"; // Assuming you have a logger utility
import open from "open"

const program = new Command();
const DEFAULT_PATH = path.join(os.homedir(), ".config", "icli/icli.json");
const INVOICE_PATH = path.join(path.dirname(DEFAULT_PATH), "invoices.json");

// Utility function to check if config exists
export function configSetup(configPath: string) {
  return fs.existsSync(configPath);
}

// Initialize configuration setup if not already present
async function initConfig() {
  if (!configSetup(DEFAULT_PATH)) {
    const config = {
      appName: "Invoice CLI Tool",
      version: "1.0.0",
      createdAt: new Date().toISOString(),
    };

    try {
      fs.ensureFileSync(DEFAULT_PATH); 
      fs.writeJsonSync(DEFAULT_PATH, config, { spaces: 2 });
      logger.info(`Your configuration file has been set up.`);
    } catch (error) {
      console.log(error)
      logger.error('Error setting up configuration file');
    }
  }
}

// Function to handle viewing invoice history
function viewInvoiceHistory() {
  if (!fs.existsSync(INVOICE_PATH)) {
    logger.info("No invoice history found.");
  } else {
    const invoiceHistory = fs.readJsonSync(INVOICE_PATH);
    logger.info("Invoice History:");
    console.log(invoiceHistory); // Display the history to the user
  }
}

async function openConfigDirectory() {
  const configDir = path.dirname(DEFAULT_PATH);
  try {
    await open(configDir); // Open the directory
    logger.info(`Opened configuration directory: ${configDir}`);
  } catch (error) {
    console.log(error)
    logger.error("Error opening configuration directory")
  }
}


async function createInvoice() {
  const templatePath = path.dirname(DEFAULT_PATH);
  const templates = fs.readdirSync(templatePath).filter(file => file.endsWith(".html"));

  // Check if templates are available
  if (templates.length === 0) {
    logger.error("No invoice templates found. Please ensure there are .html files in the templates directory.");
    return; // Exit the function early
  }

  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "template",
      message: "Choose an invoice template:",
      choices: templates,
    },
    {
      type: "input",
      name: "companyName",
      message: "Enter your company name:",
    },
    {
      type: "number",
      name: "numItems",
      message: "How many items do you want to add?",
      validate: value => value && value > 0 || "Must be at least 1 item",
    },
  ]);

  const items = [];
  for (let i = 0; i < answers.numItems; i++) {
    const itemDetails = await inquirer.prompt([
      {
        type: "input",
        name: "itemName",
        message: `Enter the name for item ${i + 1}:`,
      },
      {
        type: "number",
        name: "price",
        message: `Enter the price for item ${i + 1}:`,
        validate: value => value && value > 0 || "Price must be greater than zero",
      },
    ]);
    items.push(itemDetails);
  }

  const invoice = {
    template: answers.template,
    companyName: answers.companyName,
    items,
    createdAt: new Date().toISOString(),
  };

  let invoiceHistory = [];
  if (fs.existsSync(INVOICE_PATH)) {
    invoiceHistory = fs.readJsonSync(INVOICE_PATH);
  }

  invoiceHistory.push(invoice);
  fs.writeJsonSync(INVOICE_PATH, invoiceHistory, { spaces: 2 });

  logger.info("Invoice successfully created!");
}

// CLI setup with commander
program
  .version("1.0.0")
  .description("Invoice CLI Tool");

program
  .command("setup")
  .description("Setup configuration file")
  .action(async () => {
    await initConfig();
    mainMenu();
  });

program
  .command("history")
  .description("View invoice history")
  .action(() => {
    viewInvoiceHistory();
    mainMenu();
  });

program
  .command("create")
  .description("Create a new invoice")
  .action(async () => {
    await createInvoice();
    mainMenu();
  });

program
  .command('config')
  .description('Open the configuration file.')
  .action(openConfigDirectory)

program
  .command("exit")
  .description("Exit the CLI")
  .action(() => {
    logger.info("Exiting CLI...");
    process.exit(0);
  });

// Main menu to loop back to choices
async function mainMenu() {
  const choices = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices: ["View Invoice History", "Create a New Invoice", "Exit CLI"],
    },
  ]);

  switch (choices.action) {
    case "View Invoice History":
      viewInvoiceHistory();
      break;
    case "Create a New Invoice":
      await createInvoice();
      break;
    case "Exit CLI":
      logger.info("Exiting CLI...");
      process.exit(0);
  }

  // Loop back to the main menu after completing an action
  mainMenu();
}

// Initialize the CLI program
program.parse(process.argv);
