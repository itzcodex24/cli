import inquirer from "inquirer";
import logger from "./logger";
import fs from "fs-extra";
import path from "path"
import HTML from "./html";
import chalk from "chalk";
import type { DefaultOptionPrompts, TInvoice } from "../types/types";
import { getConfig } from ".";
import { DEFAULT_DIR, DEFAULT_OPTION_PROMPTS, DEFAULT_PATH, INVOICE_PATH } from "./constants";
import { mainMenu } from "..";

class Invoice {
  async createInvoice(useDefaultValues = true) {
    try {
      const templatePath = path.dirname(DEFAULT_PATH);
      const templates = fs.readdirSync(templatePath).filter(file => file.endsWith(".html")).map(f => `${DEFAULT_DIR}${f}`)

      logger.info(JSON.stringify(templates))

      if (templates.length === 0) {
        logger.error("No invoice templates found. Please ensure there are .html files in the templates directory.");
        throw new Error("No templates.")
      }

      let template = templates.length > 1 ? await inquirer.prompt([{
        type: "list",
        name: "template",
        message: "Choose an invoice template:",
        choices: templates,
      }]).then(r => r.template) : templates[0]

      const editor = new HTML()
      const html = await editor.create(template)
      if (!html) throw new Error('Invalid template')

      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "companyName",
          message: "Enter your company name:",
          validate: value => value.trim().length > 2 || "Company name must be at least 3 characters long",
        },
        {
          type: "number",
          name: "numItems",
          message: "How many items do you want to add?",
          validate: value => Number.isInteger(value) && value && value > 0 || "Must be a whole number greater than 0",
        },
      ]);

      const items = [];
      for (let i = 0; i < answers.numItems; i++) {
        const itemDetails = await inquirer.prompt([
          {
            type: "input",
            name: "itemName",
            message: `Enter the name for item ${i + 1}:`,
            validate: value => value.trim().length > 1 || "Item name must be at least 2 characters long",
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

      const config = getConfig()

      const invoice: TInvoice = {
        template: template,
        companyName: answers.companyName,
        items,
        createdAt: new Date().toISOString(),

        ...(useDefaultValues ? {
          sortCode: config.default_values.sortCode,
          fullName: config.default_values.fullName,
          bankNum: config.default_values.bankNum
        } : {
          sortCode: await this.askForDefault('sortCode'),
          fullName: await this.askForDefault('fullName'),
          bankNum: await this.askForDefault('bankNum')
        })
      };

      let invoiceHistory = [];
      if (fs.existsSync(INVOICE_PATH)) {
        invoiceHistory = fs.readJsonSync(INVOICE_PATH);
      }

      invoiceHistory.push(invoice);
      fs.writeJsonSync(INVOICE_PATH, invoiceHistory, { spaces: 2 });

      invoice['id'] = invoiceHistory.length

      const outpath = await editor.editor(html, invoice)
      if (!outpath) throw new Error('failed to convert')

      logger.success("Invoice successfully created! ", outpath);
    } catch (e) {
      logger.debug().error(`${e}`)
      return mainMenu()
    }
  }


  viewHistory() {
    if (!fs.existsSync(INVOICE_PATH)) {
      logger.info("No invoice history found.");
    } else {
      const invoiceHistory = fs.readJsonSync(INVOICE_PATH);
      console.log(
        chalk.blue(JSON.stringify(invoiceHistory, null, 2))
      )
    }
  }

  async askForDefault(key: keyof DefaultOptionPrompts): Promise<string> {
    // @ts-ignore
    const value = await inquirer.prompt([
      {
        name: key,
        ...DEFAULT_OPTION_PROMPTS[key]
      }
    ])
    return value[key]
  }

  async setupDefaultValues(args?: string[]) {
    const config = getConfig()

    args = args?.length ? args : Object.entries(DEFAULT_OPTION_PROMPTS).filter(([_, v]) => v.required).map(([k]) => k)

    for (const arg of args) {
      const key = Object.keys(DEFAULT_OPTION_PROMPTS).find(o => o.toLowerCase() === arg)
      if (!key) {
        logger.error(`Can't edit a value that doesn't exist: ${arg}`)
        continue
      }

      config['default_values'] = {
        ...config['default_values'],
        [key]: await this.askForDefault(key as keyof DefaultOptionPrompts)
      }

      fs.writeJsonSync(DEFAULT_PATH, config, { spaces: 2 })
    }

    process.exit(0)
  }
}

export default new Invoice();
