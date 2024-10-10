import inquirer, { type Question } from "inquirer";
import { INVOICE_PATH, DEFAULT_PATH, DEFAULT_DIR, mainMenu } from "..";
import logger from "./logger";
import fs from "fs-extra";
import path from "path"
import HTML from "./html";

interface DefaultOption<T extends 'input' | 'number' = 'input'> {
  type: T
  message: string
  validate: (value: T extends 'number' ? number : string) => void
} 

interface DefaultOptionPrompts {
  sortCode: DefaultOption
  bankNum: DefaultOption<"number"> 
  fullName: DefaultOption
}

class Invoice {

  defaultOptionPrompts : DefaultOptionPrompts = {
    sortCode:  {
      type: "input",
      message: "Enter your sort code",
      validate: val => val.length == 8 && val.includes('-') && !isNaN(parseInt(val.replaceAll('-', '')))
    },
    bankNum:  {
      type: "number",
      message: "Enter your bank account number",
      validate: num => num.toString().length == 8
    },
    fullName:  {
      type: "input",
      message: "Enter your fullname",
      validate: str => str.includes(' ') && str.length > 5
    },
  }

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

      const html = await new HTML().create(template)
      if (!html) throw new Error('Invalid template')

      const answers = await inquirer.prompt([
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

      const config = fs.readJsonSync(DEFAULT_PATH);

      const invoice = {
        template: template,
        companyName: answers.companyName,
        items,
        sortCode: useDefaultValues && config['default_values']?.['sortCode'] ? config['default_values']['sortcode'] : this.askForDefault('sortCode'),
        fullName: useDefaultValues && config['default_values']?.['fullName'] ? config['default_values']['fullName'] : this.askForDefault('fullName'),
        bankNum: useDefaultValues && config['default_values']?.['bankNum'] ? config['default_values']['bankNum'] : this.askForDefault('bankNum'),
        createdAt: new Date().toISOString(),
      };

      let invoiceHistory = [];
      if (fs.existsSync(INVOICE_PATH)) {
        invoiceHistory = fs.readJsonSync(INVOICE_PATH);
      }

      invoiceHistory.push(invoice);
      fs.writeJsonSync(INVOICE_PATH, invoiceHistory, { spaces: 2 });

      logger.info("Invoice successfully created!");
    } catch (e) {
      return mainMenu()

    }
  }


  viewHistory() {
    if (!fs.existsSync(INVOICE_PATH)) {
      logger.info("No invoice history found.");
    } else {
      const invoiceHistory = fs.readJsonSync(INVOICE_PATH);
      logger.info("Invoice History:");
      console.log(invoiceHistory);
    }
  }

  async askForDefault(key: keyof DefaultOptionPrompts): Promise<string> {
      // @ts-ignore
    const value = await inquirer.prompt([
      {
        name: key,
        ...this.defaultOptionPrompts[key]
      }
    ])

    logger.debug().info(`value: ${JSON.stringify(value)}, key: ${key}, keyval: ${value[key]}`)

    return value[key]
  }


  async setupDefaultValues(args?: string[]) {

    logger.debug().info(`Args: ${JSON.stringify(args)}`)

    const config = fs.readJsonSync(DEFAULT_PATH)

    if (args?.length) {
      args.forEach(async arg => {
        const key = Object.keys(this.defaultOptionPrompts).find(o => o.toLowerCase() == arg)
        if (!key) return logger.error(`Can't edit a value that doesn't exist: ${arg}`)

        logger.info(key)

        config['default_values'] = {
          [key]: await this.askForDefault(key as keyof DefaultOptionPrompts)
        }
      })
    }
    else {
      config['default_values'] = {
        fullName: await this.askForDefault('fullName'),
        bankNum: await this.askForDefault('bankNum'),
        sortCode: await this.askForDefault('sortCode') 
      }
    }

    fs.writeJsonSync(DEFAULT_PATH, config, { spaces: 2 })
  }
}

export default Invoice;
