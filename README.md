# 🛒 CymbalMart Shopping Agent — Party Planner AI Agent

> A multimodal AI shopping agent prototype built with **Google AI Studio**, **Gemini**, **Vibe Coding**, and **Critical User Journey (CUJ)** design.

[![Made with Gemini](https://img.shields.io/badge/Built%20with-Gemini-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![Google AI Studio](https://img.shields.io/badge/Platform-Google%20AI%20Studio-orange?style=flat-square)](https://aistudio.google.com/)
[![License](https://img.shields.io/badge/License-Educational-lightgrey?style=flat-square)]()

---

## 📌 Project Overview

The **CymbalMart Shopping Agent** is an AI-powered Party Planner Shopping Agent developed as part of the Google Cloud Skills Boost lab **GSP1383 — Create a Shopping Agent with Google AI Studio**.

The project demonstrates how a **Critical User Journey (CUJ)** can be transformed into a functional AI agent prototype using Google AI Studio and natural-language-driven development. The agent is designed for busy hosts who need help planning events — converting a user's event requirements into a curated, budget-conscious shopping plan.

The prototype progressively evolves from a basic shopping agent into an interactive assistant with:

- 🎉 Party planning
- 🛍️ Curated shopping-list generation
- 💰 Budget-aware recommendations
- 🤖 AI chatbot assistance
- 🔄 Dynamic shopping-list updates
- 🧮 Automatic budget recalculation
- 🧪 Multi-scenario validation
- 🎙️ Hands-free voice interaction
- 💻 AI-assisted UI/code generation through Vibe Coding

The official Google Skills lab describes this as a rapid-prototyping experience where learners translate a CUJ into a functional agent, enhance it using Vibe Coding and natural-language prompts, and validate the resulting agent across different scenarios.

---

## 🎯 Project Goal

The primary goal is to create an intelligent shopping assistant that helps customers plan an event without manually searching for every required product.

| | |
|---|---|
| **User** | Busy hosts needing event-planning assistance |
| **Goal** | Convert event-planning intent into a curated, budget-conscious shopping list |

### Core Tasks

```text
Define Event
     ↓
Review Shopping List
     ↓
Refine & Checkout
```

**1. Define Event** — the customer provides party/event type, theme, guest count, budget, date, and special requirements.

**2. Review Shopping List** — the agent generates a relevant shopping plan considering guest count, event type, theme, estimated quantities, and budget constraints.

**3. Refine & Checkout** — the customer can modify the generated shopping list and adjust requirements before finalizing the plan.

---

## 🧠 What Is a Critical User Journey?

A **Critical User Journey (CUJ)** is a structured representation of the most important steps a customer takes to accomplish a specific goal. For this project, the CUJ contains three essential components:

| Component | Description |
|---|---|
| **User** | Busy hosts needing event-planning assistance |
| **Goal** | Generate a curated, budget-conscious shopping list |
| **Tasks** | Define event → Review list → Refine & Checkout |

This CUJ acts as the foundation for the AI agent's behavior and functionality. Instead of starting by manually designing every feature, the project begins with the customer journey and uses AI-assisted development to translate that journey into an interactive application.

---

## 🏗️ High-Level Architecture

```text
                    ┌──────────────────────────┐
                    │        Customer           │
                    │  Party / Event Details     │
                    └────────────┬──────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │      CymbalMart UI         │
                    │  • Event Inputs             │
                    │  • Shopping List            │
                    │  • Budget                   │
                    │  • Chatbot                  │
                    │  • Voice Control            │
                    └────────────┬──────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │      Gemini / AI           │
                    │  • Understand Intent        │
                    │  • Plan Event                │
                    │  • Generate Recommendations │
                    │  • Refine Shopping List     │
                    └────────────┬──────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │ Shopping Plan Generator    │
                    │  • Products                 │
                    │  • Quantities                │
                    │  • Estimated Costs           │
                    │  • Budget Alignment           │
                    └────────────┬──────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │  Dynamic Budget Engine      │
                    │  • Update Items              │
                    │  • Recalculate Total         │
                    └────────────┬──────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │  Final Party Shopping Plan  │
                    └──────────────────────────┘
```

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| Google AI Studio | AI application prototyping and development |
| Gemini | Generative AI reasoning and interaction |
| Vibe Coding | Natural-language-driven application development |
| Google Cloud Skills Boost | Hands-on learning environment |
| TypeScript / TSX | Generated application interface/code |
| React-based UI | Interactive application interface |
| Voice Input | Hands-free interaction |
| GitHub | Source-code version control and documentation |

> The Google Skills lab specifically directs learners to explore generated files such as `App.tsx` in the Code tab to understand how the UI is constructed.

---

## ✨ Key Features

### 🎉 1. Party Planning
The agent accepts event information and uses it to generate a customized shopping plan.

```text
Party Type: Birthday
Guests: 20
Date: Next Saturday
Theme: Tropical
```

### 🛍️ 2. AI-Generated Shopping List
The shopping agent converts natural-language event requirements into a structured list of recommended items, spanning categories such as:

```text
Decorations
Food & Beverages
Tableware
Party Supplies
Entertainment
Theme-specific Items
```

> The exact generated output may vary because the application uses AI-generated content.

### 💰 3. Budget-Aware Planning
The agent helps customers maintain a shopping plan aligned with their budget. Customers can modify the generated shopping list, after which the application automatically recalculates budget totals.

```text
Initial Shopping List
        ↓
Calculate Estimated Total
        ↓
Customer Adds/Removes Item
        ↓
Recalculate Total
        ↓
Compare Against Budget
```

This creates an iterative planning experience instead of a static recommendation list.

### 🤖 4. CymbalMart Assistant
A dedicated chatbot — **CymbalMart Assistant** — provides conversational interaction, acting as the customer's planning companion through natural language.

```text
"Make this party suitable for children."
"Reduce the total budget."
"Add more tropical decorations."
"Remove expensive items."
"I need supplies for 20 guests."
```

### 🔄 5. Dynamic Shopping List
Customers can modify the generated shopping list instead of restarting the planning process.

```text
Customer: Remove the premium decorations.

Agent:
Premium decorations removed.
Updated Total: ₹XXXX
Remaining Budget: ₹XXXX
```

This demonstrates an important agentic interaction pattern:

```text
User Intent → Agent Action → State Update → Recalculation → Updated Recommendation
```

### 🧮 6. Dynamic Budget Calculation
The agent supports iterative budget management using a simplified calculation model:

```text
Total Cost = Σ(Item Price × Quantity)
Remaining Budget = User Budget − Total Cost
```

Values update whenever the customer changes the shopping list, allowing experimentation with different combinations while maintaining spending awareness.

### 🧪 7. Scenario-Based Testing
The application is validated against multiple event types to evaluate whether the agent adapts its recommendations to different contexts.

**Scenario 1 — Children's Birthday Party**
```text
Party Type: Children's Birthday Party
Guests: 15
Theme: Superhero
```
Expected: age-appropriate recommendations, superhero-themed decorations, appropriate quantities, suitable budget estimates.

**Scenario 2 — Corporate Team Event**
```text
Party Type: Corporate Team Building Event
Guests: 50
Theme: Professional
```
Expected: corporate-appropriate supplies, professional recommendations, realistic quantities, appropriate budget estimates.

**Scenario 3 — Outdoor Wedding**
```text
Party Type: Wedding Reception
Guests: 100
Theme: Garden/Outdoor
```
Expected: outdoor seating recommendations, weather protection, garden/outdoor decorations, wedding-specific supplies, large-event quantities.

> These scenarios are based on the official GSP1383 lab validation requirements.

### 🎙️ 8. Hands-Free Voice Control
The final enhancement adds voice interaction to the shopping agent, allowing customers to complete the planning workflow through voice commands.

```text
User: "Plan a tropical birthday party for 20 people."
Agent: Generates the initial shopping plan.

User: "Remove the expensive decorations."
Agent: Updates the shopping list.

User: "What's my remaining budget?"
Agent: Provides the updated budget information.
```

> The official lab instructs learners to enable microphone access when prompted by the browser after adding the voice-control feature.

---

## 🚀 Development Workflow

```text
1. Define CUJ
      ↓
2. Generate Initial Agent
      ↓
3. Review Generated Application
      ↓
4. Test Initial Scenario
      ↓
5. Enhance Using Vibe Coding
      ↓
6. Add Chatbot
      ↓
7. Add Dynamic Budget Logic
      ↓
8. Test Multiple Scenarios
      ↓
9. Add Voice Interaction
      ↓
10. Validate Final Agent
```

---

## 📋 Step-by-Step Implementation

### Task 1 — Create the Shopping Agent

**Step 1 — Open Google AI Studio**
Navigate to `Build → New app`. The official lab recommends using an Incognito/private browser window and the temporary student credentials provided by the lab environment to avoid account conflicts.

**Step 2 — Create the Initial Application**
```text
Create a Party Planner Shopping Agent.
```
Build the application and review the generated result.

**Step 3 — Define the Critical User Journey**
```text
Create a party planner shopping agent for CymbalMart based on the following
critical user journey (CUJ):

User: Busy hosts needing event planning.
Goal: Convert intent into a curated, budget-conscious shopping list.

Tasks:
Define event: Define party type, theme, budget, guest count, and special requests.
Review list: Align items with the total budget.
Refine & Checkout: Adjust for constraints and finalize plan.
```
This prompt establishes the fundamental behavior of the agent.

**Step 4 — Test the Initial Agent**
```text
Party Type: Birthday
Guests: 20
Date: Next Saturday
Theme: Tropical
```
Verify that the agent produces a relevant shopping list aligned with the specified requirements.

**Step 5 — Rename the Application**
```text
CymbalMart Shopping Agent
```

### Task 2 — Enhance the Agent with Vibe Coding

**Add the Chatbot**
```text
Add a chatbot called CymbalMart Assistant to interact with customers.
```
Review the generated UI and test the chatbot functionality.

**Add Dynamic Budget Calculations**
```text
Enable customers to update the shopping list and automatically recalculate the budget totals.
```
Test by adding and removing items, and verify that the total budget updates accordingly.

> The official lab explicitly introduces these enhancements as examples of Vibe Coding-driven iteration.

### Task 3 — Validate the Agent

Run the three validation scenarios.

| Scenario | Guests | Theme | Primary Validation |
|---|---|---|---|
| Children's Birthday | 15 | Superhero | Age-appropriate items |
| Corporate Event | 50 | Professional | Corporate supplies & realistic estimates |
| Outdoor Wedding | 100 | Garden/Outdoor | Outdoor seating & weather protection |

### 🎙️ Add Voice Control
```text
Add a voice control feature that enables customers to complete the entire process hands-free.
```
Grant microphone permissions when requested, then test the entire workflow using voice interaction.

---

## 🧩 Vibe Coding Approach

One of the most important concepts demonstrated by this project is **Vibe Coding** — instead of manually implementing every UI feature from scratch, the developer communicates desired functionality through natural-language instructions.

```text
"Add a chatbot called CymbalMart Assistant."
        ↓
Gemini modifies the application
        ↓
Preview updated application
        ↓
Developer evaluates result
        ↓
Developer provides additional prompt
```

This creates an iterative development loop:

```text
Prompt → Generate → Preview → Evaluate → Refine → Repeat
```

This approach demonstrates how generative AI can accelerate application prototyping while keeping the developer involved in evaluating and refining the result.

---

## 🧠 Agent Design Principles Demonstrated

1. **Intent Understanding** — converts natural-language event requirements into structured planning information.
2. **Context-Aware Recommendations** — recommendations change according to event type, guest count, theme, budget, and special requirements.
3. **Iterative Interaction** — users can refine the generated plan instead of accepting the first result.
4. **State-Aware Updates** — changes to the shopping list affect the overall budget calculation.
5. **Multimodal Interaction** — voice interaction expands the interface beyond traditional text input.
6. **AI-Assisted Development** — Vibe Coding allows natural-language prompts to drive application changes.

---

## 📂 Repository Structure

```text
cymbalmart-shopping-agent/
│
├── README.md
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── Chatbot.tsx
│   │   ├── ShoppingList.tsx
│   │   ├── BudgetCalculator.tsx
│   │   └── VoiceControl.tsx
│   │
│   └── ...
│
├── public/
│
├── screenshots/
│   ├── initial-agent.png
│   ├── chatbot.png
│   ├── shopping-list.png
│   ├── budget-calculation.png
│   └── voice-control.png
│
├── package.json
└── ...
```

> The exact generated project structure may differ depending on the application generated by Google AI Studio.

---

## 📸 Application Preview

> Add your screenshots to the `screenshots/` folder and update the paths below.

### Party Planner Interface
![Party Planner](screenshots/initial-agent.png)

### CymbalMart Assistant
![Chatbot](screenshots/chatbot.png)

### Dynamic Budget Calculation
![Budget](screenshots/budget-calculation.png)

### Voice Control
![Voice Control](screenshots/voice-control.png)

---

## 🧪 Testing Strategy

| Test Area | Validation |
|---|---|
| Intent Understanding | Does the agent understand event requirements? |
| Personalization | Does the output reflect the theme and guest count? |
| Shopping List | Are relevant items generated? |
| Quantity | Are quantities appropriate for guest count? |
| Budget | Does the total remain aligned with the budget? |
| Refinement | Can users modify the list? |
| Recalculation | Does the budget update after modifications? |
| Chatbot | Can customers interact naturally? |
| Voice | Can the workflow be completed hands-free? |
| Robustness | Does behavior remain useful across different scenarios? |

---

## ⚠️ Limitations

This project is primarily an AI agent prototyping and learning project rather than a production-grade e-commerce platform.

- AI-generated recommendations may vary between runs.
- Product availability is not necessarily connected to a live retail inventory system.
- Prices may be estimates rather than real-time prices.
- The prototype does not necessarily implement a real payment gateway.
- Voice interaction depends on browser microphone permissions and supported functionality.
- Generated application architecture may change depending on AI Studio's generation process.

> The official lab also notes that AI-generated output may vary.

---

## 🔮 Future Improvements

**🛒 Real Product Search** — integrate a real product catalog or e-commerce API.
```text
User Requirement → AI Agent → Product Search API → Available Products → Rank & Recommend
```

**📦 Inventory Awareness** — stock availability, product location, delivery time, product variants.

**💳 Real Checkout** — cart management, customer authentication, payment processing, order confirmation.

**📍 Location-Aware Shopping** — customer location, delivery availability, local stores, delivery fees.

**💡 Intelligent Budget Optimization**
```text
Budget → Required Items → Priority Ranking → Alternative Products → Cost Optimization → Final Shopping Plan
```

**🧠 Persistent Preferences** — preferred brands, dietary requirements, favorite themes, previous events, budget preferences.

**☁️ Optional Deployment**
Google AI Studio provides options to continue beyond prototyping — publish to Google Cloud, or export as source code and deploy to another platform such as GitHub or third-party hosting.

```text
                    Customer
                       │
                       ▼
                Web / Mobile UI
                       │
                       ▼
              CymbalMart AI Agent
                       │
             ┌─────────┼─────────┐
             ▼         ▼         ▼
          Gemini    Product    Budget
           Model     API       Engine
             │         │         │
             └─────────┼─────────┘
                       ▼
                  Shopping Cart
                       │
                       ▼
                  Checkout
```

---

## 📚 Learning Outcomes

By completing this project, you gain practical exposure to:

- Generative AI application development
- AI agent prototyping
- Google AI Studio
- Gemini-powered applications
- Critical User Journey design
- Prompt engineering
- Vibe Coding
- Conversational AI
- Dynamic UI generation
- Budget calculation logic
- Scenario-based testing
- Multimodal interaction
- Voice-enabled AI applications
- AI-assisted software development

> The official GSP1383 lab identifies three primary learning outcomes: creating an agent from a CUJ, enhancing functionality through Vibe Coding and natural-language prompts, and testing the agent across different scenarios.

---

## 🏆 Project Highlights

**Core AI**
- Gemini-powered interaction
- Natural-language intent understanding
- Context-aware recommendations

**Agent Features**
- Party planning
- Shopping-list generation
- Budget-aware planning
- Dynamic list modification
- Conversational assistant
- Voice interaction

**Development Approach**
- Critical User Journey
- Prompt-driven development
- Vibe Coding
- Iterative testing
- Scenario validation

---

## 📖 Official Lab Reference

This project is based on the official Google Cloud Skills Boost hands-on lab:
**GSP1383 — Create a Shopping Agent with Google AI Studio**
🔗 [Google Skills — Create a Shopping Agent with Google AI Studio](https://www.skills.google/focuses/153957)

The official lab identifies the experience as an introductory hands-on lab focused on rapidly prototyping a shopping agent in Google AI Studio.
**Lab duration:** approximately 60 minutes of access/completion time according to the current lab page.

---

## 📜 Disclaimer

This repository is intended for educational and portfolio purposes. CymbalMart is a fictional retail scenario used within the Google Cloud Skills Boost learning experience.

Google, Google Cloud, Gemini, and Google AI Studio are trademarks of Google LLC. Other product and company names belong to their respective owners. This repository is not an official Google repository unless explicitly stated otherwise.

---

## 👨‍💻 Author

**Rahul R**
AI/ML • Generative AI • Data Science • AI Agents

- 🐙 GitHub: [@rahulr2004](https://github.com/rahulr2004)
- 🔗 LinkedIn: [rahul-r2004](https://www.linkedin.com/in/rahul-r2004/)

---

## ⭐ Acknowledgements

Special thanks to Google Cloud Skills Boost for providing the hands-on learning experience and the **GSP1383 — Create a Shopping Agent with Google AI Studio** lab. This project was developed as an educational implementation of the concepts demonstrated in the lab.

---

### 🚀 If you found this project useful

Consider giving the repository a ⭐ and exploring the source code to learn more about building AI-powered applications with Google AI Studio and Gemini.

🔗 **Repository:** [Create-a-Shopping-Agent-with-Google-AI-Studio](https://github.com/rahulr2004/Create-a-Shopping-Agent-with-Google-AI-Studio)
