---

## **NexusSync: The Unified Intelligence Engine**
### **Product Requirements Document (PRD)**

#### **Goals and Background Context**

##### **Goals**

* **Unify Disparate Knowledge:** Create a single, locally-hosted source of truth by automatically syncing and indexing conversations from Google Gemini, chat.z.ai, and code/documentation from multiple GitHub accounts.
* **Democratize Deep Research:** Provide a powerful, open-source deep research tool with a user-friendly web interface, leveraging the latest web scraping and AI aggregation techniques.
* **Revolutionize Developer Workflow:** Build an advanced, cross-platform CLI that uses natural language processing to interact with the unified knowledge base, streamlining development and research.
* **Ensure Future-Proof Extensibility:** Implement a universal AI provider service that allows seamless integration with a vast array of current and future AI models, ensuring the ecosystem remains at the cutting edge.
* **Adhere to an Open-Source Ethos:** Deliver the entire platform as a free, open-source tool with zero operational cost as a primary goal, fostering community contribution and innovation.

##### **Background Context**

In today's fast-paced development landscape, valuable insights and context are fragmented across numerous platforms—AI chat logs, code repositories, and the web itself. This fragmentation leads to lost knowledge, redundant work, and inefficient workflows. NexusSync addresses this by creating a cohesive, intelligent ecosystem. It acts as a personal RAG (Retrieval-Augmented Generation) service, automatically centralizing a user's digital brain. By integrating this with a powerful deep research engine and an intuitive CLI, NexusSync aims to become an indispensable tool for developers, researchers, and creators, fundamentally changing how they interact with and leverage their own information.

---

#### **Requirements**

##### **Functional**

* **FR1:** A Chrome extension shall automatically and continuously sync chat history from Google Gemini to the local RAG service in real-time.
* **FR2:** The Chrome extension shall provide a feature to perform a one-time bulk export of the entire chat history from Google Gemini.
* **FR3:** The Chrome extension shall automatically and continuously sync chat history from chat.z.ai to the local RAG service in real-time.
* **FR4:** The Chrome extension shall provide a feature to perform a one-time bulk export of the entire chat history from chat.z.ai.
* **FR5:** A backend service shall securely connect to multiple user-configured GitHub accounts.
* **FR6:** The GitHub service shall automatically sync repository contents (code, markdown) to the local RAG service based on user-defined triggers (e.g., on push, scheduled).
* **FR7:** The GitHub service shall generate and maintain a comprehensive "blueprint" document for each repository, summarizing its structure and purpose.
* **FR8:** The local RAG service shall provide an API for ingesting, indexing, and querying all synced data.
* **FR9:** The RAG service shall use **Redis 8.2 with the RedisGraphVector (RGV) module** for high-performance caching and combined graph/vector storage and search.
* **FR10:** The RAG service shall use **PostgreSQL** for persistent metadata storage.
* **FR11:** A deep research backend service shall be able to scrape and process information from specified web sources.
* **FR12:** A web UI shall be provided to interact with the deep research service, allowing users to initiate research tasks and view aggregated results.
* **FR13:** A cross-platform CLI tool shall be developed.
* **FR14:** The CLI shall allow users to query the central RAG service using natural language.
* **FR15:** The CLI shall provide commands to manage and control the GitHub sync service (e.g., `resync`, `stop`).
* **FR16:** A universal AI provider service shall be implemented, capable of routing requests to various AI models via the **Unified AI Gateway Protocol (UAIGP)** standard.
* **FR17:** The system shall integrate with Motion for project management sync.

##### **Non Functional**

* **NFR1:** All components of the system **must** be licensed under a permissive open-source license (e.g., MIT).
* **NFR2:** The architecture **must** prioritize a **$0 cost footprint**, leveraging free tiers of services and local hosting wherever possible.
* **NFR3:** The system **must** utilize the latest stable versions of specified technologies as of August 2025.
* **NFR4:** All user interfaces (Web UI, CLI) **must** be highly responsive and performant.
* **NFR5:** Data synchronization processes **must** be resilient and include error handling and retry mechanisms.
* **NFR6:** The CLI **must** be compatible with major terminals on Windows, macOS, and Linux.
* **NFR7:** The system **must** support both a **100% local deployment model** (using containerized services like PostgreSQL) and a **hybrid-cloud model** (leveraging free-tier services like Neon) to ensure deployment flexibility.

---

#### **User Interface Design Goals**

##### **Overall UX Vision**

A clean, modern, and developer-centric aesthetic. The UI should feel fast, intuitive, and powerful, prioritizing information density and clarity without feeling cluttered. Dark mode is the default.

##### **Key Interaction Paradigms**

* **Command-Oriented:** Both the Web UI (via a command palette) and the CLI should emphasize keyboard-driven interaction.
* **Real-time Feedback:** Sync statuses and research progress should be clearly visible with real-time updates.
* **Configurability:** Users should have granular control over what is synced and how it's indexed.

##### **Core Screens and Views**

* **Dashboard:** An overview of the RAG service status, recent sync activities, and quick query access.
* **Research Hub (Web UI):** Interface for initiating deep research, viewing ongoing tasks, and exploring results.
* **Settings/Connections:** A unified view to manage connections to Gemini, chat.z.ai, GitHub, Motion, and AI providers.

##### **Accessibility**

WCAG 2.1 AA compliance is a target to ensure broad usability.

##### **Branding**

Minimalist and functional. No complex branding required; focus on a clean, professional look and feel. The name "NexusSync" and a simple logo should be used.

##### **Target Device and Platforms**

* **Web UI:** Responsive design targeting modern desktop browsers (Chrome, Firefox, Safari, Edge).
* **CLI:** Cross-platform (Windows, macOS, Linux).
* **Chrome Extension:** Google Chrome and compatible Chromium browsers, leveraging the **Service Weaves API** for background syncing.

---

#### **Technical Assumptions**

* **Repository Structure:** **Monorepo**. This is ideal for managing the interconnected services and frontends efficiently.
* **Service Architecture:** **Microservices**. Each major function (RAG, GitHub Sync, Research) will be a distinct service.
* **Deployment Strategy:** The system is designed to be **deployment-flexible**, supporting both a 100% local containerized setup and a hybrid-cloud model using the free tier of Neon for the database, selectable via an environment file.
* **Testing requirements:** A comprehensive testing strategy is required, including Unit tests, Integration tests, and End-to-End (E2E) tests for critical user flows.
* **CLI Framework:** The CLI will be built using the **Warp CLI (Rust-based)** framework to provide a modern, AI-native interactive experience.

---

#### **Epics**

1.  **Epic 1 - Foundation & Core RAG Service:** Establish the monorepo, foundational services (DB, Cache), and the central ingestion/query API.
2.  **Epic 2 - Deep Research Engine & Web UI:** Build the web scraping backend and the user-facing web interface for deep research.
3.  **Epic 3 - Chat Sync Chrome Extension:** Develop the browser extension for syncing conversations from Gemini and chat.z.ai.
4.  **Epic 4 - GitHub Multi-Sync Service:** Create the service for syncing GitHub repositories and generating blueprint documents.
5.  **Epic 5 - Advanced Cross-Platform CLI:** Build the universal CLI for interacting with all NexusSync services.
6.  **Epic 6 - Integrations & Ecosystem Polish:** Implement the Motion sync, add user authentication, and perform final end-to-end integration testing and polish.

---

This is the finalized Product Requirements Document.