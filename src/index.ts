import path from "path";
import fs from "fs-extra"
import { Command } from "commander";
import logger from "./utils/logger";
import Invoice from "./utils/invoice";
import minimist from "minimist"
import { getConfig, getInvoiceDirectory, getVersion, openConfigDirectory, openConfigurationFile, openInvoicesDirectory, timeout } from "./utils";
import * as os from "os"
import inquirer from "inquirer";
import type { Config } from "./types/types";

export const DEFAULT_DIR = path.join(os.homedir(), ".config", "icli/");
export const DEFAULT_INVOICES_DIR = path.join(os.homedir(), "Documents", "Invoices/")
export const DEFAULT_PATH = path.join(os.homedir(), ".config", "icli/icli.json");
export const INVOICE_PATH = path.join(path.dirname(DEFAULT_PATH), "invoices.json");


async function init() {

  const configExists = fs.existsSync(DEFAULT_PATH)

  const version = await getVersion()

  if (!configExists) {
    const config: Partial<Config> = {
      appName: "Invoice CLI Tool",
      createdAt: new Date().toISOString(),
      version
    }

    try {
      fs.ensureFileSync(DEFAULT_PATH)
      fs.writeJsonSync(DEFAULT_PATH, config, { spaces: 2 })
      logger.debug().info(`Setup the config with no defaults`)
    } catch (e) {
      logger.debug().error(`${e}`)
      logger.error('An error occured.')
    }
  } else {
    const config = getConfig()
    if (config.version !== version && version !== "Unknown") logger.warn(`The version you are running is outdated. Please upgrade.`)
  }

  await getInvoiceDirectory()
  const config = getConfig()

  await timeout(200)

  let unset = []
  for (const defaultOption of Object.keys(Invoice.defaultOptionPrompts)) {
    if (config?.default_values?.[defaultOption as keyof typeof config.default_values]) continue

    unset.push(defaultOption.toLowerCase())
  }

  if (unset.length) {
    await Invoice.setupDefaultValues(unset)
  }
}


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
      Invoice.viewHistory();
      break;
    case "Create a New Invoice":
      await Invoice.createInvoice()
      break;
    case "Exit CLI":
      logger.info("Exiting CLI...");
      process.exit(0);
  }

  mainMenu();
}

const args = minimist(process.argv.slice(2))
const isDebug = args.debug || false

logger.setDebugMode(isDebug)

const program = new Command();


program
  .version("1.0.0")
  .description("Invoice CLI Tool")
  .option('--debug', "Display external logs")

program
  .command('history')
  .description('View invoice history')
  .action(async () => {
    Invoice.viewHistory()
    await mainMenu()
  })

program
  .command('create')
  .description('Create a new invoice')
  .option('--explicit')
  .action(async () => {
    await Invoice.createInvoice(args.explicit ? false : true)
    await mainMenu()
  })

program
  .command('config')
  .description('Open the configuration file')
  .action(openConfigurationFile)

program
  .command('cd')
  .description('Open the configuration directory')
  .action(openConfigDirectory)

program
  .command('invoices')
  .description('Open the invoices directory')
  .action(openInvoicesDirectory)

program
  .command('defaults')
  .description('Setup the default details for creating new invoices')
  .action(async () => await Invoice.setupDefaultValues(args ? Array.from(new Set(Object.keys(args).filter(o => o !== "_" && o !== 'debug'))) : undefined))
  .option('--fullname')
  .option('--sortcode')
  .option('--banknum')
  .option('--address')
  .option('--postcode')
  .option('--email')
  .option('--logo')

program
  .command('exit')
  .description('Exit the Invoice CLI tool')
  .action(() => {
    process.exit(0)
  })



init().then(() => {
  program.parse(process.argv);

  if (!process.argv.slice(2).length) {
    program.outputHelp()
    process.exit(0)
  }
})

