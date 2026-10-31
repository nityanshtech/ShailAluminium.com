# Connect the SHAIL dashboard to Firebase and Netlify

The website is static; Firebase supplies shared online data and administrator sign-in. Netlify serves the website files. The Firebase web configuration is visible to website visitors by design. Firestore security rules, not hidden frontend values, protect changes.

## 1. Create the Firebase project

1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. In **Project settings → General → Your apps**, add a **Web app** and copy its web configuration.
3. In **Authentication → Sign-in method**, enable **Email/Password**.
4. In **Authentication → Settings → Authorized domains**, add the Netlify domain for this website (for example, `your-site.netlify.app`).
5. In **Firestore Database**, create a database. Choose a location appropriate for your business; start in production mode.
6. In **Authentication → Users**, add **one account per person** who needs dashboard access. For two people, add two accounts and note each account's **User UID**.

## 2. Add this project's Firebase config

Edit `js/firebase-config.js` and replace the four `REPLACE_WITH_...` values with your web app's `apiKey`, `authDomain`, `projectId`, and `appId`. Replace `REPLACE_WITH_FIRST_ADMIN_AUTH_UID` and `REPLACE_WITH_SECOND_ADMIN_AUTH_UID` in the `adminUids` list with the UID for each person's account. Keep each person's own email and password private; both administrators sign in separately.

Do **not** put a Firebase service-account JSON, private key, or other server credentials in this website.

## 3. Apply the Firestore security rules

Edit `firestore.rules` and replace both UID placeholders with exactly the same two UIDs in `js/firebase-config.js`. Then deploy the rules from this project folder using Firebase CLI:

```text
npm install --global firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules
```

Select the Firebase project created above when prompted. These rules allow visitors to read the public website content, but only the two listed signed-in administrator UIDs to create, update, or delete it. Never deploy either placeholder UID.

## 4. Deploy the website to Netlify

1. Push this project to a private GitHub repository, or upload the project folder using Netlify's manual deploy.
2. In Netlify, create a site from the repository (or deploy the folder). `netlify.toml` publishes the website from the project root.
3. Open `https://<your-netlify-domain>/admin.html`, sign in with the administrator account, and confirm the dashboard shows **Connected**.
4. If the old website has browser-only products, inventory, photos, or settings on your computer, the dashboard offers **Import existing data from this browser**. Review and import those once from the browser that contains the old data. Existing Firebase sections are not overwritten by this import.
5. Add or update a product, shop hours, or contact details, then verify the public site. Visitors load those values from Firestore; changes no longer depend on the admin browser's local storage.

## Safety and backups

- Use a unique administrator password, enable Firebase Authentication email/password, and create only the intended admin account.
- The dashboard checks the signed-in UID and Firestore rules. Both UIDs in `js/firebase-config.js` must match the two UIDs in `firestore.rules`. To remove a person's access, remove their UID from both places and deploy the rules again.
- Keep regular backups of Firestore data. Before major changes, use Firebase Console's export/backup options appropriate to your project.
- Firebase and Netlify free allowances and billing requirements can change. Check each provider's current plan and usage; do not enable billing without reviewing its limits.
- Product/gallery image links should point to images hosted on the website or a trusted image host. Do not store private information in public website content; Firestore site content is intentionally readable by visitors.
