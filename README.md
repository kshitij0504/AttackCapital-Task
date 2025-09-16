# 🏥 EdTech Healthcare Integration with ModMed API

This is a comprehensive **healthcare platform** that integrates with **ModMed's secure APIs** to offer a modern and responsive user experience for managing patient data, medications, and appointment scheduling.

-----

## ✅ Current Features

  * **Patient Management**
    Display detailed patient information including demographics, allergies, conditions, and medications.
  * **Medication Management**
    Create, update, and list `MedicationStatements`. Patients can also add their medications using a form with proper validation.

-----

## 📅 Upcoming Features

  * Appointment scheduling (view, book, reschedule, cancel).
  * Calendar view for appointments.
  * Dynamic provider and patient rosters.
  * Billing and clinical encounter modules.

-----

## 🛠️ Technology Stack

  * **Frontend:** React 18, TypeScript, Tailwind CSS, Next.js (App Router)
  * **Backend:** Next.js API routes that act as a proxy to the ModMed REST API

-----

## ⚙️ Setup and Installation

Follow these steps to set up and run the project locally.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/edtech-healthcare-modmed.git
    cd edtech-healthcare-modmed
    ```
2.  **Create a `.env` file:**
    Create a new file named `.env` in the root directory and add the following variables:
    ```env
    MODMED_TOKEN_ENDPOINT=https://stage.ema-api.com/ema-dev/firm/entpmsandbox393/ema/ws/oauth2/grant
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Run the development server:**
    ```bash
    npm run dev
    ```

-----

## 🔑 Sandbox Credentials (EHR Login)

You can use the following credentials to test with the ModMed Sandbox environment.

  * **ModMed API Docs:** [ModMed API Docs (PDF)](https://www.modmed.com/wp-content/uploads/2023/04/MMI-API-Documentation-April-2023.pdf)
  * **Base URL:** `https://stage.ema-api.com/ema-dev/firm`
  * **Firm URL Prefix:** `entpmsandbox393`
  * **API Key:** `f69902ad-c2bc-4b30-aa89-e136d26a04b3`
  * **Username:** `fhir_pmOYS`
  * **Password:** `NmrxdT7I34`

> 🔐 **Authentication:** The platform uses the **API Key, Username, and Password** for authentication via an OAuth2 grant. Tokens are stored securely in **HTTP-only cookies**.

