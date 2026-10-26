# MyDiary — Brief

| | |
|---|---|
| App | MyDiary |
| Date | 2026-10-18 |

## What it is

A private journaling app for phone, tablet and computer. One journal per person, three ways to write. Opening it shows a short, warm story of what you wrote on this date in past years. You can ask plain questions about your past ("how many coffee bottles did I open last year?") and get a counted answer listing the entries it used. It is free on one device; a paid licence adds backup and use on several devices, and a choice of AI model.

**Fixed choices.** Accounts, sign-in, devices, licences, problem reports and account-data requests all use the AppManager API (`docs/AppManager-api-usage-guide.md`) with its installed-app key; MyDiary has no server of its own and AppManager never sees journal text. Screens are built with TrBlazeUI, so the mockups use TrBlazeUI's own components and look. Every AI feature, built-in or online, is done through TechieRag; MyDiary writes no AI code of its own.

## Who it is for

- **Free user**: writes on one device; everything stays on that device.
- **Paid user**: writes on several devices, backs up and restores the journal, and may pick their own AI model or online AI service.
- **Goal reviewer** (free or paid): runs monthly, yearly, health, fitness or project reviews and wants the same answers side by side over time.
- **Owner (admin)**: assigns paid licences and reads problem reports on the AppManager site. Does nothing inside MyDiary.

## Must do

1. A new user creates a MyDiary account, or signs in, on first launch.
2. The app keeps working offline for up to 30 days, then must check the licence online again.
3. A user can reset a forgotten password, edit their profile, change their password, send a problem report, and ask for a copy or deletion of their account data, all from inside the app.
4. A free account works on one device only. Signing in on a second device is refused, with a message saying a paid licence allows more.
5. A paid account works on up to the number of devices its licence allows. A device over that number is refused, and the message says how to free a slot.
6. A user can see their plan, when it ends, and every device signed in to their account (with how many of the allowed devices are in use), and can forget or block a device.
7. The app decides what is paid from the licence key and licence name that AppManager's licence check returns: "Pro" allows 2 devices, "Pro-Plus" allows more than 2 (the number set on the licence in AppManager). No paid licence means free.
8. When a paid licence ends, the user keeps every free feature and their whole journal on the current device.
9. A user keeps one journal. There is no list of journals to pick from.
10. A user can write a 10-Thought Dump (ten numbered quick lines, empty ones dropped on save) or a Free-Flow entry with formatting and photos.
11. A user can answer Targeted Questioning sets (Monthly Goals, Yearly Review, Health, Fitness, Weekly Retro, Project Retro, Gratitude) and build their own.
12. The app suggests a question set when it is due, for example Monthly Goals on the 1st.
13. A user sees today's entries, a streak and the On This Day card on the home screen.
14. A user can browse entries by timeline or calendar, add tags, star entries and pick a mood.
15. On This Day shows, for each past year, a short warm story of what was written on this date or around it, not a list of entries.
16. A user can search by keyword and filter by date, tag, question set, photo, star and mood.
17. A user can ask questions in plain words and get counted answers with the source entries listed. When no entry matches, it says so and never makes one up.
18. A user can see one question's answers side by side across months or years.
19. Free users get the smallest built-in AI model, installed with the app, running on the device.
20. A paid user can choose a different AI model, or enter their own key for any online AI service TechieRag supports, such as OpenAI. The app warns that journal text will then be sent to that service.
21. A paid user can back up the journal to their own Google Drive or OneDrive, sync it between devices, and restore it on a new device.
22. Any user, free or paid, can export the journal to a JSON file and import one, including an export from Day One.
23. A user can lock the app with a PIN or fingerprint/face, and set journaling reminders.
24. The same screens work on Android, iPhone, iPad, Windows and Mac.

## Out of scope

- The purchase and landing page. It is a separate MyDiary web app in phase 2, which buys licences through AppManager. Until then the admin assigns paid licences in AppManager, and MyDiary has no "Buy" button.
- Taking payment inside the app, and app-store purchases.
- More than one journal, shared journals, and family groups sharing one licence.
- Sending journal text anywhere for a free user. Online AI only happens when a paid user enters their own key.
- iCloud, Dropbox and any other sync service.
- Map view, voice transcription, widgets, handwriting, sharing an entry as an image.
