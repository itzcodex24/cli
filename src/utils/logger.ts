import chalk from 'chalk';

class Logger {

  private formatMessage(level: string, colorFn: (msg: string) => string, ...messages: string[]): string {
    return `${chalk.gray(`[CLI]`)} ${colorFn(`[${level}]`)} ${messages.join(' ')}`;
  }

  error(...messages: string[]): void {
    console.log(this.formatMessage('ERROR', chalk.bgRed.white, ...messages));
  }

  success(...messages: string[]): void {
    console.log(this.formatMessage('SUCCESS', chalk.bgGreen.black, ...messages));
  }

  info(...messages: string[]): void {
    console.log(this.formatMessage('INFO', chalk.bgBlue.white, ...messages));
  }

  warn(...messages: string[]): void {
    console.log(this.formatMessage('WARNING', chalk.bgYellow.black, ...messages));
  }

  throw(...messages: string[]): never {
    this.error(...messages); 
    throw new Error(messages.join(' '));
  }
}

export default new Logger();
