import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const { projectName, files } = await req.json();

    if (!projectName) {
      return NextResponse.json({ error: "Missing projectName" }, { status: 400 });
    }

    const workspaceDir = path.join(process.cwd(), "workspace", "projects", projectName);
    await fs.mkdir(workspaceDir, { recursive: true });

    const writeFiles = async (dir: string, nodes: any[]) => {
      if (!nodes) return;
      for (const node of nodes) {
        const filePath = path.join(dir, node.name);
        if (node.type === "file") {
          await fs.writeFile(filePath, node.content || "");
        } else if (node.type === "folder" && node.children) {
          await fs.mkdir(filePath, { recursive: true });
          await writeFiles(filePath, node.children);
        }
      }
    };

    if (files) {
      await writeFiles(workspaceDir, files);
    }

    const cargoPath = path.join(workspaceDir, "Cargo.toml");
    const nestedCargoPath = path.join(workspaceDir, projectName, "Cargo.toml");

    const testCmd = `if [ -f ${cargoPath} ]; then cargo test --manifest-path ${cargoPath}; else cargo test --manifest-path ${nestedCargoPath}; fi`;
    const execCmd = `sh -c '${testCmd}'`;

    try {
      const { stdout, stderr } = await execAsync(execCmd);

      return NextResponse.json({
        success: true,
        output: stdout + stderr
      });
    } catch (err: any) {
      const stderr = err.stderr || "";
      const stdout = err.stdout || "";
      
      let cleanError = err.message;
      if (stdout.includes("failures:")) {
        cleanError = stdout.substring(stdout.indexOf("failures:"));
      } else if (stderr.includes("error:")) {
        cleanError = stderr.substring(stderr.indexOf("error:"));
      }

      return NextResponse.json({
        success: false,
        output: stdout + stderr,
        error: cleanError.trim()
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Test execution error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
