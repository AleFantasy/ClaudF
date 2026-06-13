---
name: windows-10-setting
description: Indicates that we are working on Windows 10 and scripts should be Windows-compatible.
metadata:
  type: user
---

This session is running on Windows 10 Pro (version 10.0.19045). All provided scripts, commands, and configurations should be tested and written to work on this Windows environment first. When writing shell scripts, use Git‑Bash/WSL-compatible syntax, avoid POSIX‑only features not present in Windows, and prefer cross‑platform commands or provide Windows‑specific alternatives (e.g., using `powershell` or `cmd` where needed). This ensures that the code runs reliably on the user's machine without requiring macOS or Linux‑specific adjustments.

**Why:** The user explicitly requested that all code be usable on Windows 10 as a priority.

**How to apply:** When creating new scripts or modifying existing ones, verify they function in Git‑Bash (the default shell used by Claude Code on Windows) or provide a Windows‑batch/PowerShell variant. Keep environment variable references compatible with both Unix‑style (`$VAR`) and Windows‐style (`%VAR%`) where needed, or use cross‑platform tools like `uv` and `python` that abstract away shell differences.