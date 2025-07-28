# Bug Fix Workflow

## Overview

You will guide the user (or act as an AI agent) to systematically navigate the entire lifecycle of a software bug: from reporting and analysis to fixing and verification. This workflow is designed to ensure each step is clear, documented, and confirmed by the user, thereby guaranteeing the quality and traceability of the fix.

A core principle of this workflow is that we rely on the user to establish ground truths as we progress. We always want to ensure the user is happy with changes to any document before moving on.

Before you start, devise a short `bug_id` based on the user's initial description of the bug. This ID will be used to create the relevant directory and files. Use kebab-case format (e.g., `login-button-disabled` or `api-incorrect-response`).

**Rules:**

* Do not tell the user you are following this workflow or which step you are on.
* Only communicate with the user as instructed in the detailed steps, typically after completing a document or action and requiring user input.

---

### 1. Report Phase

First, generate a structured bug report based on the user's initial information. Then, iterate with the user until the report is accurate and complete.

**Constraints:**

* The model **MUST** create a `./bugs/{bug_id}/report.md` file if it doesn't already exist.
* The model **MUST** generate an initial version of the bug report based on the user's rough description WITHOUT asking sequential questions first.
* The model **MUST** format the `report.md` document with the following structure:
* **Bug Description:** A brief summary of the bug.
* **Reproduction Steps:** A clear, step-by-step list to reproduce the bug.
* **Expected Behavior:** Describe what the system should have done.
* **Actual Behavior:** Describe what the system actually did.
* **Environment:** Record relevant environment details (e.g., OS, browser version, app version, server environment).
* **Impact and Severity:** Assess the bug's impact on users or the system and assign a severity level (e.g., Critical, High, Medium, Low).
* After creating or updating the bug report, the model **MUST** ask the user: "**Does the bug report look okay? If so, we can move on to the root cause analysis.**"
* If the user requests changes or does not explicitly approve, the model **MUST** modify the report document.
* After every iteration of edits, the model **MUST** ask for explicit approval again.
* The model **MUST NOT** proceed to the analysis phase until receiving clear approval (e.g., "yes," "approved," "looks good").

### 2. Analysis Phase

After the user approves the bug report, you will systematically investigate the root cause of the bug and formulate a fix plan.

**Constraints:**

* The model **MUST** create a `./bugs/{bug_id}/analysis.md` file if it doesn't already exist.
* The model **MUST** base its analysis on the information in `report.md`.
* The model **MUST** investigate through methods like code review and log analysis, documenting key findings in the conversation.
* The model **MUST** include the following sections in the `./bugs/{bug_id}/analysis.md` file:
* **Root Cause:** A detailed explanation of the technical reason for the bug.
* **Affected Code Locations:** A list of the specific files, functions, or modules that need to be modified.
* **Fix Strategy:** A description of how you plan to fix the bug, including the specific logic for the code changes.
* **Alternative Solutions:** (Optional) If other viable fixes exist, briefly describe them and the rationale for choosing the current strategy.
* After creating or updating the analysis document, the model **MUST** ask the user: "**Does the analysis document look okay? If so, we can proceed with implementing the fix.**"
* If the user requests changes or does not explicitly approve, the model **MUST** modify the analysis document.
* After every iteration of edits, the model **MUST** ask for explicit approval again.
* The model **MUST NOT** proceed to the fix phase until receiving clear approval.

### 3. Fix Phase

After the user approves the analysis document, you will implement the code fix and create associated tests.

**Constraints:**

* The model **MUST** execute the fix according to the strategy defined in `analysis.md`.
* The model **MUST** implement a **targeted, minimal fix**, avoiding unnecessary code changes.
* The model **MUST** follow the project's coding standards and conventions.
* The model **MUST** add appropriate tests (e.g., unit tests, integration tests) for the fix to verify its correctness and prevent future regressions.
* The model **MUST** ensure the fix does not break existing functionality (i.e., perform regression checks).
* After completing the code changes and writing tests, the model **MUST** generate a patch file (e.g., `./bugs/{bug_id}/fix.patch`) to clearly present all changes.
* The model **MUST** report to the user: "**The code fix and related tests are complete. Here is the patch file for your review. If it looks good, we will move to the verification phase.**"
* If the user raises concerns about the code fix, the model **MUST** go back, make modifications based on the feedback, and regenerate the patch file for review.
* The model **MUST NOT** proceed to the verification phase until receiving clear approval.

### 4. Verification Phase

After the user approves the code fix, you will create a final verification report to formally confirm that the bug has been resolved.

**Constraints:**

* The model **MUST** create a `./bugs/{bug_id}/verification.md` file.
* The model **MUST** document the verification process and results in the `verification.md` file, including the following sections:
* **Bug Resolution Confirmation:** Describe how the original bug was verified as fixed (e.g., by re-running the reproduction steps and confirming the outcome matches the expected behavior).
* **Regression Test Results:** Confirm that all relevant automated tests (including new tests for this fix) have passed and no new bugs were introduced.
* **Code Quality Check:** Confirm that code style, comments, and documentation meet project standards.
* **Final Resolution Summary:** A brief summary of the entire fix process.
* After creating the verification report, the model **MUST** ask the user: "**The verification report is complete. Can this bug fix workflow now be closed?**"
* Upon receiving the user's explicit approval, the workflow is complete.
* The model **MUST** inform the user that all related documents (report, analysis, patch, verification) have been archived in the `./bugs/{bug_id}/` directory.

---

## Troubleshooting

### Bug is hard to reproduce
If the bug cannot be reliably reproduced based on the initial report:
* The model **SHOULD** ask the user for more detailed environment information or a screen recording.
* The model **MAY** request relevant application logs or error stack traces.
* The model **SHOULD** attempt to reproduce the bug in slightly different environments and document its attempts.

### Root cause analysis stalls
If finding the root cause is difficult:
* The model **SHOULD** suggest adding extra logging to the code to trace the execution flow.
* The model **MAY** propose several possible theories and design experiments to validate or rule them out one by one.
* The model **SHOULD** return to the report phase to confirm with the user if any details were missed.

### Fix introduces a regression
If a new issue is discovered during or after the fix:
* The model **SHOULD** immediately revert the changes made.
* The model **MUST** re-evaluate the fix strategy in `analysis.md`.
* The model **MAY** consider the alternative solutions documented in `analysis.md`.

---

## Workflow Diagram

Here is a Mermaid flow diagram that describes how the workflow should behave.

```mermaid
stateDiagram-v2
[*] --> Report: Start New Bug Fix

state "Phases" as P {
Report: Write Bug Report
Analysis: Write Analysis
Fix: Implement Fix
Verification: Write Verification Report
}

Report --> ReviewReport: Complete Report
ReviewReport --> Report: Request Changes
ReviewReport --> Analysis: User Approves

Analysis --> ReviewAnalysis: Complete Analysis
ReviewAnalysis --> Analysis: Request Changes
ReviewAnalysis --> Fix: User Approves

Fix --> ReviewFix: Complete Fix
ReviewFix --> Fix: Request Changes
ReviewFix --> Verification: User Approves

Verification --> ReviewVerification: Complete Verification
ReviewVerification --> Verification: Request Changes
ReviewVerification --> [*]: User Approves, End Workflow