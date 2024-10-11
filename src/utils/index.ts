import open from "open"
import { exec } from "child_process"
import * as os from "os"
import path from "path"
import logger from "./logger"
import { DEFAULT_INVOICES_DIR, DEFAULT_PATH, mainMenu } from ".."
import inquirer from "inquirer"
import fs from "fs-extra"

export const timeout = async (t: number) => new Promise(r => setTimeout(r, t))

export async function openConfigurationFile() {
  const platform = os.platform()

  if (platform !== 'darwin') {
    return logger.error('Unsupported operating system.')
  }

  exec(`open ${DEFAULT_PATH}`, e => {
    if (e) {
      logger.error(`Can't open configuration file`)
      logger.debug().info(`${e}`)
    }
  })
}

export async function openInvoicesDirectory() {
  const config = fs.readJsonSync(DEFAULT_PATH)
  try {
    await open(config.invoices_path);
    logger.info(`Opened configuration directory: ${config.invoices_path}`);
  } catch (error) {
    logger.error("Error opening configuration directory")
  }

  process.exit(0)
}

export async function openConfigDirectory() {
  const configDir = path.dirname(DEFAULT_PATH);
  try {
    await open(configDir);
    logger.info(`Opened configuration directory: ${configDir}`);
  } catch (error) {
    logger.error("Error opening configuration directory")
  }

  process.exit(0)
}

export async function getInvoiceDirectory() {
  const config = fs.readJsonSync(DEFAULT_PATH)
  if (config.invoices_path) return;

  const { path } = await inquirer.prompt([
    {
      type: "input",
      name: "path",
      message: "Where should we save all your invoices?",
      default: DEFAULT_INVOICES_DIR,
    }
  ])

  try {
    config['invoices_path'] = path;
    ensureExists(path, 0o744, async function (e) {
      if (e) return logger.error(`Was unable to add the invoice directory. Please do this manually: ${path}`)

      fs.writeJsonSync(DEFAULT_PATH, config, { spaces: 2 })
      logger.success("Created invoice path.")

    })

    return await timeout(2000)
    
  } catch (e) {
    logger.error("Coundn't add the invoice path")
    logger.debug().error(`${e}`)
  }

}

function ensureExists(path: string, mask: any, cb: (v: any) => void) {
  if (typeof mask === 'function') {
    cb = mask;
    mask = 0o744
  }
  fs.mkdir(path, mask, function (e) {
    if (e) {
      if (e.code === "EEXIST") cb(null)
      else cb(e)
    } else cb(null)
  })
}

export async function initConfig() {
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
      logger.error('Error setting up configuration file');
    }
  }

  await getInvoiceDirectory()
}

export function configSetup(configPath: string) {
  return fs.existsSync(configPath);
}

export function deepFindByKey(obj: any, keyToFind: string) {
  if (typeof obj !== 'object' || obj === null) {
    return undefined;
  }

  // Check if the current object contains the key
  if (obj.hasOwnProperty(keyToFind)) {
    return obj[keyToFind];
  }

  // Recursively search in each nested object
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];

      if (typeof value === 'object') {
        const result : any = deepFindByKey(value, keyToFind);
        if (result !== undefined) {
          return result;
        }
      }
    }
  }

  return undefined;
}
