# Homebrew formula for bgit (GIT-024)
class Bgit < Formula
  desc "Agent-native git overlay — sessions, checkpoints, provenance"
  homepage "https://github.com/theo-startups/bgit"
  version "0.1.0"
  license "MIT"

  depends_on "bun" => :build
  depends_on "git"

  url "https://github.com/theo-startups/bgit/archive/refs/tags/v0.1.0.tar.gz"
  sha256 "SKIP_ON_FIRST_PUBLISH"

  def install
    cd "startups/packages/bgit" do
      system "bun", "install", "--frozen-lockfile"
      system "bun", "run", "build"
      bin.install "dist/cli.js" => "bgit"
    end
  end

  test do
    system "#{bin}/bgit", "--version"
  end
end
