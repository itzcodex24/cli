<p align="center">
<img src="https://i.imgur.com/l3co8R0.png" alt="Codex Logo" width="300" height="300"/>
</p>

# Invoice Generator CLI Tool

This tool was built to help developers quickly write up their invoices straight from the terminal. Why go about the hasle of writing a document yourself?

With automatic **PDF** conversion, this is the tool for your invoices!

## Installation

Firstly, install the CLI using brew

```bash
  npm install -g invoice-cli
```

Simply run the `invoice-cli` command in your terminal, and configure your generator.

```bash
  invoice-cli
```

## FAQ

#### Can I change the default template?

Yes, if you need to change the template of the invoice, then simply do so by running the `invoice-cli config` command, and drag and drop your HTML files in this directory. You need to make sure however that you specify elements with the [ids](https://google.com). This is so that the CLI tool can update these fields to produce the PDF file.

<!-- #### Can I access these in the browser?  -->
<!---->
<!-- Yes, simply run the `invoice-cli web` command, which will serve up a local build, where you can upload files, download, and view your recent invoice history. -->

**NOTE**: If you want to run the generator tool without using any of the options specified in the config, run the command using the `--no-config` flag

```bash
  invoice-cli --explicit 
```

## Debugging

If you think you have found a bug within the tool, feel free to open an [issue](https://github.com/itzcodex24/cli/issues/new) against it.

Use the `--debug` flag to show extra information when submitting an issue!

```bash
  invoice-cli --debug ...rest
```

<!-- ## Features -->
<!---->
<!-- - Fully customizable -->
<!-- - Infinite uses -->

## Feedback

If you have any feedback, please react out to me on my [portfolio website]('https://codex-dev.vercel.app')

<!-- ## Tech Stack -->
<!---->
<!-- TypeScript, Puppeteer -->
<!---->
## Contributing

Contributions are always welcome! Please get in touch if you are interested.
<!---->
<!-- See `contributing.md` for ways to get started. -->
<!---->
<!-- Please adhere to this project's `code of conduct`. -->

## License

[MIT](https://choosealicense.com/licenses/mit/)
