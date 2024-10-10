import logger from "./logger"
import path from "path"
import fs from "fs-extra"
import { load, type CheerioAPI } from "cheerio"

class HTML {
  private requiredIds: string[] = ["wow"]

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

  }

}

export default HTML
