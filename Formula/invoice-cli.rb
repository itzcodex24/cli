class InvoiceCLI < Formula
  desc "Quickly design, and create invoices. Straight from your terminal!"
  homepage "https://github.com/itzcodex24/cli"
  url "https://github.com/itzcodex24/cli/releases/download/1.0.0/invoice-cli.tar.gz"
  sha256 "e173e708d99c9d46e91553808e2d2f026ca9f3228c08ab983b463f71726e4a25"
  license "MIT"

  depends_on "node"

  def install
    bin.install "build/index.js" => "invoice-cli"
  end

  test do
    # Simple test to verify the CLI works
    assert_match "Invoice CLI Version", shell_output("#{bin}/invoice-cli --version")
  end
end
