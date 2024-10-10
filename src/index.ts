import path from "path";
import { Command } from "commander";
import logger from "./utils/logger";
import Invoice from "./utils/invoice";
import minimist from "minimist"
import { initConfig, openConfigDirectory, openConfigurationFile, timeout } from "./utils";
import * as os from "os"
import inquirer from "inquirer";

const args = minimist(process.argv.slice(2))
const isDebug = args.debug || false

logger.setDebugMode(isDebug)

const program = new Command();

export const DEFAULT_DIR = path.join(os.homedir(), ".config", "icli/");
export const DEFAULT_INVOICES_DIR = path.join(os.homedir(), "Documents", "Invoices/")
export const DEFAULT_PATH = path.join(os.homedir(), ".config", "icli/icli.json");
export const INVOICE_PATH = path.join(path.dirname(DEFAULT_PATH), "invoices.json");

export async function mainMenu() {
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


const commands = [
  {
    name: "setup",
    description: "Setup configuration file",
    action: async () => {
      await initConfig();
      await mainMenu();
    }
  },
  {
    name: "history",
    description: "View invoice history",
    action: async () => {
      new Invoice().viewHistory()
      await mainMenu()
    }
  },
  {
    name: "create",
    description: "Create a new invoice",
    action: async () => {
      await new Invoice().createInvoice(args.explicit ? false : true)
      await mainMenu()
    },
    option: [{
      value: 'explicit',
      description: "Explicitly select the values for your personal details"
    }]
  },
  {
    name: "config",
    description: "Open the configuration file",
    action: openConfigurationFile
  },
  {
    name: "cd",
    description: "Open the configuration directory",
    action: openConfigDirectory
  },
  {
    name: "defaults",
    description: "Setup your default details for creating invoices.",
    // options: [Object.keys(Invoice.prototype.defaultOptionPrompts).map(k => ({value: k, description: `Change default value for: ${k}`}))],
    options: 
      Object.keys(new Invoice().defaultOptionPrompts)
        .map(o => ({ value: o.toLowerCase(), description: `Change default for: ${o}` })),
    action: async () => {
      await new Invoice().setupDefaultValues(Array.from(new Set(Object.keys(args).filter(o => o !== "_" && o !== "debug"))))
    },
  },
  {
    name: "exit",
    description: "Exit the CLI tool",
    action: () => {
      logger.info('Exiting CLI...')
      process.exit(0)
    }
  },
]
program
  .version("1.0.0")
  .description("Invoice CLI Tool")
  .option('--debug', "Display external logs")

commands.forEach((c) => {
  const cmd = program
    .command(c.name)
    .description(c.description)
    .action(c.action)

  c.options?.forEach(c => {
    cmd.option(`--${c.value}`, c.description)
  })
})

program.parse(process.argv);
