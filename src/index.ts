import os from "os";
import fs from "fs-extra";
import path from "path";
import inquirer from "inquirer";
import { Command } from "commander";
import logger from "./utils/logger"; // Assuming you have a logger utility
import open from "open"
import Invoice from "./utils/invoice";

const program = new Command();

export const DEFAULT_DIR = path.join(os.homedir(), ".config", "icli/");
export const DEFAULT_PATH = path.join(os.homedir(), ".config", "icli/icli.json");
export const INVOICE_PATH = path.join(path.dirname(DEFAULT_PATH), "invoices.json");

export function configSetup(configPath: string) {
  return fs.existsSync(configPath);
}

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
    new Invoice().viewHistory();
    mainMenu();
  });

program
  .command("create")
  .description("Create a new invoice")
  .action(async () => {
    await new Invoice().createInvoice();
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
      new Invoice().viewHistory();
      break;
    case "Create a New Invoice":
      await new Invoice().createInvoice()
      break;
    case "Exit CLI":
      logger.info("Exiting CLI...");
      process.exit(0);
  }

  mainMenu();
}

program.parse(process.argv);
