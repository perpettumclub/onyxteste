# Bug Handling SOP (Stress Testing Protocol)

## 1. Discovery
When you encounter a bug during stress testing (e.g., spamming buttons, reloading pages, edge cases):
1.  **Stop.** Do not refresh immediately.
2.  **Open TeleConsole.** Check the logs.
3.  **Copy Logs.** Use the copy button in TeleConsole.

## 2. Documentation
1.  Navigate to `docs/troubleshoot/[AREA]`.
2.  Create a new file: `BUG_[YYYY-MM-DD]_[SHORT_DESC].md`.
3.  Copy `docs/troubleshoot/BUG_TEMPLATE.md` content into the new file.
4.  Fill in the "Context", "Description", and "Steps to Reproduce".
5.  Paste the logs.

## 3. Resolution
1.  Analyze the logs and code.
2.  **Fix the bug.**
3.  Verify the fix (try to break it again).
4.  Update the Bug File:
    -   Fill in the "Solution" section.
    -   Mark Status as "Resolved".

## 4. Prevention
1.  Can this happen elsewhere? Check similar components.
2.  Add a regression test if possible.
