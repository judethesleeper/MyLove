# Firebase Setup

Use these steps for the free live booth version.

## What This Version Uses

- `Firestore Database` for rooms and signaling
- `WebRTC` for direct phone-to-phone photo sharing during the session
- `No Firebase Storage`

That means the photos are not meant to stay in backend storage. Both phones should download the final strip during the session if you want to keep it.

## 1. Create Firebase Project

1. Open the Firebase console
2. Create a new project
3. Add a `Web App`

## 2. Enable Firestore

Turn on:

- `Firestore Database`

Start in test mode first while building.

## 3. Copy Web Config

From your Firebase web app settings, copy these values into:

`assets/js/firebase-config.js`

Fields:

- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

`measurementId` is not needed.

## 4. Hosting

For camera access on phones, use a secure `https` URL.

Good options:

- GitHub Pages
- Firebase Hosting
- Vercel
- Netlify

## 5. What Happens In This Version

1. Host creates a room
2. Guest joins with a link
3. Firestore helps both phones find each other
4. WebRTC connects the phones directly
5. Each round both phones take one shot
6. The final strip is built during that session
7. Both people download it to their phones

## 6. Important Limitation

Because this version does not save photos in backend storage:

- if the connection breaks, photos may be lost from the session
- if you want to keep the strip, download it before leaving
