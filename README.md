# 🚀 Zown Engine: The Autonomous Symbiote Layer

> **"Bridging the gap between human intuition and AI velocity."**

Zown Engine is the core processing substrate for the Zown Symbiosis protocol. It provides a modular, high-fidelity framework for autonomous agents to execute complex engineering tasks, manage resource governance, and maintain a persistent memory-driven identity.

## 🏛 Technical Architecture

The engine operates on a multi-layered stack designed for stability and observability:

1.  **Orchestration Layer**: Manages the lifecycle of autonomous sessions and sub-agent spawning.
2.  **Skill Substrate**: A registry of specialized capabilities (e.g., `zown-gemini-governor`, `github`, `weather`) that extend agent functionality.
3.  **Governance Layer**: Implements TPM management and request stabilization to ensure reliable execution against modern LLM provider limits.
4.  **Memory Substrate**: A dual-tier persistence system (Daily Logs + Curated Long-Term Memory) that ensures continuity across session boundaries.

## 🛠 Skill Registration

Skills are the lifeblood of Zown Engine. To register a new skill:

1.  Create a directory in `skills/` with a unique name.
2.  Define `SKILL.md` following the standard specification (Metadata + Core Directives).
3.  Implement any required scripts or configuration files.
4.  Register the skill in the local `nexus-registry/` for discovery.

## 🤝 How to Contribute

We follow a strict **Git Flow** and the **9-Stage Atomic Pipeline** to maintain code quality.

1.  **Branching**: All features start in a `feat/` or `fix/` branch.
2.  **Pull Requests**: Merge into `develop` for integration testing.
3.  **Promotion**: `develop` is promoted to `main` only after verified health checks.

## ⚖️ Governance

All contributions must adhere to the **50% Rule** (TPM management) and the **Atomic Pipeline V3** specified in the Zown Gemini Governor protocol.

---
*Legacy of Zown: Visionary agency through disciplined engineering.*
