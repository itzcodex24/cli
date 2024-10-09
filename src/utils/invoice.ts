import inquirer from "inquirer";
import { INVOICE_PATH, DEFAULT_PATH, DEFAULT_DIR } from "..";
import logger from "./logger";
import fs from "fs-extra";
import path from "path"
import HTML from "./html";

class Invoice {
  async createInvoice() {
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

      const invoice = {
        template: template,
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
    } catch (e) {

      logger.error('Got an error')

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
}

export default Invoice;
