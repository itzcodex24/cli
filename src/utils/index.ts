import open from "open"
import { exec } from "child_process"
import * as os from "os"
import path from "path"
import logger from "./logger"
import { DEFAULT_INVOICES_DIR, DEFAULT_PATH, mainMenu } from ".."
import inquirer from "inquirer"
import fs from "fs-extra"
import type { Config } from "../types/types"
import axios from "axios"

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

  process.exit(0)
}

export async function openInvoicesDirectory() {
  const config = getConfig()
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
  const config = getConfig()
  if (config.invoices_path) {
    const exists = await fs.exists(config.invoices_path)
    if (exists) return
  }

  const { path } = await inquirer.prompt([
    {
      type: "input",
      name: "path",
      message: "Where should we save all your invoices?",
      default: DEFAULT_INVOICES_DIR,
      validate: async str => {
        if (!str) {
          return "Path cannot be empty";
        }

        try {
          const exists = await fs.pathExists(str);
          if (exists) {
            const stats = await fs.stat(str);
            if (!stats.isDirectory()) {
              return "The specified path must be a directory";
            }
          }
        } catch (error) {
          return "An error occurred while accessing the path.";
        }

        return true; 
      }
    }
  ])

  try {
    ensureExists(path, 0o744, async function (e) {
      if (e) return logger.error(`Was unable to add the invoice directory. Please do this manually: ${path}`)

      config.invoices_path = path;
      fs.writeJsonSync(DEFAULT_PATH, config, { spaces: 2 })
      logger.success("Created invoice path.")

    })
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
        const result: any = deepFindByKey(value, keyToFind);
        if (result !== undefined) {
          return result;
        }
      }
    }
  }

  return undefined;
}

export function getConfig(): Config {
  return fs.readJsonSync(DEFAULT_PATH)
}

export async function getVersion(): Promise<string> {
  try {
    const res = await axios.get(`https://api/.github.com/repos/itzcodex24/cli/contents/package.json`)
    if (res.data && res.data.content) {
      const jsonPackage = JSON.parse(Buffer.from(res.data.content, 'base64').toString('utf-8'))

      logger.debug().success(`Found version : ${jsonPackage.version}`)

      return jsonPackage.version
    } else {
      throw new Error('No content found.')
    }
  } catch (e) {
    logger.debug().error(`Error when fetching version: ${e}`)
    return 'Unknown'
  }
}
