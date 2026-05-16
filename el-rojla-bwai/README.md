<div align="center">
  <h1 align="center">Linkly Infrastructure (El-Rojla-BWAI)</h1>
  <p align="center">
    <strong>Decentralized Ecosystem Data Pipelines & Bipartite Matching Engine</strong>
  </p>
</div>

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini_Flash-8E75B2?style=flat&logo=google)](https://deepmind.google/technologies/gemini/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

**`Documentation`** | **`API Reference`** | **`Governance Hub`**
------------------- | ------------------- | --------------------

[Linkly](https://linkly.sh/) is a decentralized, ecosystem-agnostic data pipeline infrastructure designed to bridge the gap between startups, mentors, accelerators, universities, and venture capital. 

Originally built as a project for the **Hackathon 2026 Build with AI**, Linkly has evolved into a robust open-source platform that enables any ecosystem partner to funnel data into a centralized hub using typed, secure, and context-aware endpoints powered by **Gemini AI**.

## 🚀 Core Infrastructure

Linkly provides a comprehensive, flexible ecosystem of data pipelines that lets researchers and ecosystem managers build state-of-the-art relationship graphs without manual data entry.

*   **Decentralized Pipeline Registry**: A modular architecture allowing VCs, HR platforms, government agencies, and universities to register unique ingestion pipelines (`/api/pipeline/[type]`).
*   **AI-Powered Ingestion**: Automatically normalizes messy, unstructured data (CSV, YAML, JSON, Markdown, vCard) using Google's `gemini-3.1-flash-lite` AI model.
*   **Bipartite Matching Engine**: Computes high-fidelity linkages between startups and mentors, optimizing connections based on "friction capacity".
*   **Live Ecosystem Graph**: Visualize the entire startup ecosystem in real-time with an interactive, multi-layered mesh network diagram.

Keep up-to-date with release announcements by subscribing to the [Mailing List](#) or checking our [Releases page](../../releases).

---

## 💻 Installation & Setup

See the [Linkly Install Guide](#) for detailed instructions on deploying the infrastructure locally or to production environments like Vercel.

To get the development environment running locally:

```shell
# 1. Clone the repository
git clone https://github.com/your-org/el-rojla-bwai.git
cd el-rojla-bwai

# 2. Install dependencies
npm install

# 3. Configure Environment Variables
cp .env.example .env.local
# Add your NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and GEMINI_API_KEY

# 4. Run the development server
npm run dev
```

The application will be available at `http://localhost:3000`. 
Access the **Pipeline Monitor** directly at `/admin/pipeline`.

---

## 🔌 API & Integration

Linkly exposes robust POST endpoints allowing external systems to stream data directly into your ecosystem graph.

#### *Try your first Pipeline Push (Google Sheets)*

```bash
curl -X POST http://localhost:3000/api/pipeline/sheets \
  -H "X-Linkly-API-Key: lnk_magic_partner_6t4z9n" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://docs.google.com/spreadsheets/d/your-sheet-id/export?format=csv"}'
```

Other natively supported pipelines include:
*   `POST /api/pipeline/webhook` (Form URL-Encoded / Webflow / Typeform)
*   `POST /api/pipeline/hr` (vCard Contact Sync)
*   `POST /api/pipeline/crm` (JSON / HubSpot / Salesforce)
*   `POST /api/pipeline/notion` (Markdown)

---

## 🤝 Contribution Guidelines

**If you want to contribute to Linkly, be sure to review our [Contribution Guidelines](CONTRIBUTING.md). This project adheres to a strict [Code of Conduct](CODE_OF_CONDUCT.md).**

We use [GitHub Issues](../../issues) for tracking requests and bugs. For architectural discussions, please open a [GitHub Discussion](../../discussions).

The Linkly project strives to abide by generally accepted best practices in open-source software development, including comprehensive PR reviews and semantic versioning.

---

## 📊 CI/CD & Build Status

We utilize automated pipelines to ensure platform stability. You can view full build logs in the Actions tab.

| Build Type | Status | Artifacts |
| :--- | :--- | :--- |
| **Production Build** | [![Build Status](https://img.shields.io/github/actions/workflow/status/your-org/el-rojla-bwai/build.yml?branch=main)](../../actions) | [Vercel](https://vercel.com/) |
| **Lint & Formatting** | [![Lint Status](https://img.shields.io/github/actions/workflow/status/your-org/el-rojla-bwai/lint.yml)](../../actions) | - |
| **Unit Tests (Jest)** | [![Test Status](https://img.shields.io/github/actions/workflow/status/your-org/el-rojla-bwai/test.yml)](../../actions) | Coverage Report |

---

## 📚 Resources & Architecture

*   [System Architecture Whitepaper](#)
*   [Decentralized Data Pipeline Specifications](#)
*   [Friction Capacity Algorithms](#)

Learn more about the Linkly Community and how to get involved.

## 📄 License

This project is licensed under the [MIT License](LICENSE).
