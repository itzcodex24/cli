import chalk from 'chalk';

class Logger {
  private isDebugMode: boolean = false;  
  private inDebugContext: boolean = false;

  constructor() {
  }

  setDebugMode(isDebug: boolean): void {
    this.isDebugMode = isDebug;
  }

  debug(): this {
    this.inDebugContext = true;
    return this; // Allow chaining
  }

  private formatMessage(level: string, colorFn: (msg: string) => string, ...messages: string[]): string {
    return `${chalk.gray(`[CLI]`)} ${colorFn(`[${level}]`)} ${messages.join(' ')}`;
  }

  private shouldLog(): boolean {
    if (this.inDebugContext && !this.isDebugMode) {
      this.inDebugContext = false; 
      return false; 
    }

    this.inDebugContext = false;
    return true; 
  }

  error(...messages: string[]): void {
    if (this.shouldLog()) {
      console.log(this.formatMessage('ERROR', chalk.bgRed.white, ...messages));
    }
  }

  success(...messages: string[]): void {
    if (this.shouldLog()) {
      console.log(this.formatMessage('SUCCESS', chalk.bgGreen.black, ...messages));
    }
  }

  info(...messages: string[]): void {
    if (this.shouldLog()) {
      console.log(this.formatMessage('INFO', chalk.bgBlue.white, ...messages));
    }
  }

  warn(...messages: string[]): void {
    if (this.shouldLog()) {
      console.log(this.formatMessage('WARNING', chalk.bgYellow.black, ...messages));
    }
  }

  throw(...messages: string[]): never {
    this.error(...messages); 
    throw new Error(messages.join(' '));
  }
}

export default new Logger();
