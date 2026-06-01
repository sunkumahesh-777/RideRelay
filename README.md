# RideRelay

RideRelay is a React + Vite web app.

## Share the Project Code

To share the full editable code with a friend:

1. Send them the whole `RideRelay` folder, but do not include `node_modules`.
2. They should install Node.js from https://nodejs.org if they do not already have it.
3. They should open the `RideRelay` folder in VS Code or any code editor.
4. They should run:

```bash
npm install
npm run dev
```

The terminal will show a local website address they can open in their browser.

## Run on Your Phone or Another Device

To test the app on another device on the same Wi-Fi:

1. Start the app on your computer:

```bash
npm run dev
```

2. Find your computer's local IP address.
3. On the other device, open:

```text
http://YOUR-IP-ADDRESS:5173
```

Example:

```text
http://192.168.1.5:5173
```

Both devices must be connected to the same Wi-Fi network.

## Make a Shareable Website Link

For friends who only need to view the site, deploy it with Vercel, Netlify, or GitHub Pages.

Build the production version with:

```bash
npm run build
```

The finished website files will be created in the `dist` folder.
