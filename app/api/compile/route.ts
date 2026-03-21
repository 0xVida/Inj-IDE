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

    const wasmName = projectName.replace(/-/g, '_') + ".wasm";
    const pathsToCleanup = [
      path.join(workspaceDir, "target", "wasm32-unknown-unknown", "release", wasmName),
      path.join(workspaceDir, projectName, "target", "wasm32-unknown-unknown", "release", wasmName)
    ];
    for (const p of pathsToCleanup) {
      try {
        await fs.unlink(p).catch(() => {});
        await fs.unlink(p.replace(".wasm", ".optimized.wasm")).catch(() => {});
      } catch (e) {}
    }

    const cargoPath = path.join(workspaceDir, "Cargo.toml");
    const nestedCargoPath = path.join(workspaceDir, projectName, "Cargo.toml");

    const rustFlags = 'export RUSTFLAGS="-C target-feature=-reference-types,-sign-ext,-bulk-memory"';
    const cargoCmd = `if [ -f ${cargoPath} ]; then cargo build --target wasm32-unknown-unknown --release --manifest-path ${cargoPath}; else cargo build --target wasm32-unknown-unknown --release --manifest-path ${nestedCargoPath}; fi`;
    
    const execCmd = `sh -c '${rustFlags} && ${cargoCmd}'`;

    try {
      const { stdout, stderr } = await execAsync(execCmd);

      let wasmBase64 = "";
      const pathsToTry = [
        path.join(workspaceDir, "target", "wasm32-unknown-unknown", "release", wasmName),
        path.join(workspaceDir, projectName, "target", "wasm32-unknown-unknown", "release", wasmName)
      ];

      for (const wasmPath of pathsToTry) {
        try {
          if (await fs.access(wasmPath).then(() => true).catch(() => false)) {
            const optimizedPath = wasmPath.replace(".wasm", ".optimized.wasm");
            const optCmd = `wasm-opt -Oz ${wasmPath} -o ${optimizedPath}`;
            
            try {
              await execAsync(optCmd);
              const wasmBuffer = await fs.readFile(optimizedPath);
              wasmBase64 = wasmBuffer.toString("base64");
            } catch (optErr) {
              console.warn("wasm-opt failed or not found, falling back to unoptimized wasm:", optErr);
              const wasmBuffer = await fs.readFile(wasmPath);
              wasmBase64 = wasmBuffer.toString("base64");
            }
            if (wasmBase64) break;
          }
        } catch (e) {
        }
      }

      if (!wasmBase64) {
        return NextResponse.json({
          success: false,
          output: stdout + stderr,
          error: "Build finished but no WASM artifact was found. Check build logs for possible errors."
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        output: stdout + stderr,
        wasmBase64,
        wasmGenerated: true
      });
    } catch (err: any) {
      const stderr = err.stderr || "";
      const stdout = err.stdout || "";
      
      let cleanError = err.message;
      if (stderr.includes("error:")) {
        const errorIndex = stderr.indexOf("error:");
        cleanError = stderr.substring(errorIndex);
      } else if (stderr.includes("v0.1.0")) {
        const pkgIndex = stderr.indexOf("v0.1.0");
        const nextLineIndex = stderr.indexOf("\n", pkgIndex);
        if (nextLineIndex !== -1) {
          cleanError = stderr.substring(nextLineIndex + 1);
        }
      }

      console.error("Compilation failed:", cleanError);

      return NextResponse.json({
        success: false,
        output: stdout + stderr,
        error: cleanError.trim()
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Compilation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
