import logger from "./logger"
import path from "path"
import fs from "fs-extra"
import { load } from "cheerio"
import puppeteer from 'puppeteer'
import { getConfig } from "."


class HTML {
  private config = getConfig()
  private requiredIds: string[] = Object.keys(this.config.default_values)

  create(path: string) {
    return this.parser(path)
  }

  async parser(filePath: string) {
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
        logger.error(`Missing IDs: ${missingIds.join(', ')}`);
        throw new Error("Missing IDs")
      } else {
        logger.debug().success('All required IDs are present in the HTML.');
      }

      return htmlContent
    } catch (error) {
      logger.debug().error(`An error occured: ${error}`)
      return false
    }
  }

  async editor(content: string, data: any) {
    const $ = load(content)
    const config = getConfig()
    logger.debug().info(JSON.stringify(data))
    for (const id of this.requiredIds) {
      const value = data[id]
      if (!value) {
        logger.error(`No value was found for ${id}`);
        return false
      }

      $(`#${id}`).text(value)
    }

    logger.debug().info(`Updated DOM.`)

    const html = $.html()
    const outputPath = `${config.invoices_path}/Invoice#${data.id}.pdf`
    return await this.convertToPdf(html, outputPath)
  }

  async convertToPdf(html: string, outputPath: string) {
    logger.debug().info(`Starting conversion.`);


    if (!outputPath || outputPath.endsWith('/')) {
      logger.error(`Invalid output path: ${outputPath} is a directory or an invalid path.`);
      throw new Error(`Invalid output path: ${outputPath} is a directory or an invalid path.`);
    }

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0' });

    logger.debug().info(`Saving PDF to: ${outputPath}`);

    try {
      await page.pdf({
        path: outputPath,
        format: "A4",
        printBackground: true,
      });
    } catch (err) {
      logger.error(`Error during PDF generation: ${err}`);
      throw err;
    } finally {
      await browser.close();
    }

    return outputPath;
  }
}

export default HTML
