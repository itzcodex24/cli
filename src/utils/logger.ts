import chalk from 'chalk';

class Logger {
  private isDebugMode: boolean = false;
  private inDebugContext: boolean = false;

  constructor() {}

  setDebugMode(isDebug: boolean): void {
    this.isDebugMode = isDebug;
  }

  debug(): this {
    this.inDebugContext = true;
    return this; // Allow chaining
  }

  private formatMessage(level: string, colorFn: (msg: string) => string, ...messages: string[]): string {
    let message = `${chalk.gray(`[CLI]`)} ${colorFn(`[${level}]`)} ${messages.join(' ')}`;
    
    // If in debug mode, append the caller details
    if (this.isDebugMode) {
      const callerDetails = this.getCallerDetails();
      message += ` ${chalk.gray(`(${callerDetails})`)}`;
    }

    return message;
  }

  private shouldLog(): boolean {
    if (this.inDebugContext && !this.isDebugMode) {
      this.inDebugContext = false;
      return false;
    }

    this.inDebugContext = false;
    return true;
  }

  private getCallerDetails(): string {
    const originalPrepareStackTrace = Error.prepareStackTrace;
    const error = new Error();
    Error.prepareStackTrace = (_, stack) => stack;

    const stack = (error.stack as unknown) as NodeJS.CallSite[];
    Error.prepareStackTrace = originalPrepareStackTrace;

    let caller;
    for (let i = 2; i < stack.length; i++) {
      const fileName = stack[i].getFileName();
      if (fileName && !fileName.includes(__filename)) {
        caller = stack[i];
        break;
      }
    }

    if (caller) {
      const fileName = caller.getFileName();
      const lineNumber = caller.getLineNumber();
      const columnNumber = caller.getColumnNumber();
      return `${fileName}:${lineNumber}:${columnNumber}`;
    } else {
      return 'unknown';
    }
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
