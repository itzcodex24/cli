import logger from "./logger"
import path from "path"
import fs from "fs-extra"
import { load, type CheerioAPI } from "cheerio"
import { DEFAULT_PATH } from ".."
import { deepFindByKey } from "."
import puppeteer from 'puppeteer'


class HTML {
  private requiredIds: string[] = ["createdAt", "fullName", "sortCode", "bankNum"]

  create(path: string) {
    return this.parser(path)
  }

  async parser(filePath: string): Promise<boolean> {
    try {
      if (path.extname(filePath) !== '.html')
        throw new Error('file type')

      const fileExists = await fs.pathExists(filePath);
      if (!fileExists)
        throw new Error('file non-existant')

      const htmlContent = await fs.readFile(filePath, 'utf-8');

      const $ = load(htmlContent);

      const idsFound = $('[id]').map((_, element) => $(element).attr('id')).get();

      const missingIds = this.requiredIds.filter(id => !idsFound.includes(id));

      if (missingIds.length > 0 || !idsFound.length) {
        logger.debug().error(`Missing IDs: ${missingIds.join(', ')}`);
        throw new Error("Missing IDs")
      } else {
        logger.debug().success('All required IDs are present in the HTML.');
      }

      return true
    } catch (error) {
      logger.debug().error(`An error occured: ${error}`)
      return false
    }
  }

  async editor($: CheerioAPI) {
    const config = fs.readJsonSync(DEFAULT_PATH)
    for (const id of this.requiredIds) {
      const value = deepFindByKey(config, id)
      if (!value) {
        logger.error(`No value was found for ${id}`);
        process.exit(0)
      }

      $(`#${id}`).text(value)
    }

    const html = $.html()
    await this.convertToPdf(html, config.invoices_path)
  }

  async convertToPdf(html: string, outputPath: string) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    await page.setContent(html, { waitUntil: 'networkidle0' })

    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true
    })

    await browser.close()
  }
}

export default HTML
