# Pitta Plate

A personal web app for a pitta-balancing daily meal plan. It runs in any browser, installs to an iPhone home screen, works offline, and needs no build tools.

## Features (v1)

1. **Today**: the day's meals with times, a choice of options per meal (veg / egg / non-veg), and Eaten / Skipped / Ate something else buttons. A streak counts days with breakfast, lunch and dinner all eaten.
2. **Weight**: weekly weigh-ins with a trend chart against the 0.25 to 0.5 kg/week gain range.
3. **Eat out**: what to order and what to skip on Swiggy, per meal time.
4. **Rules**: your standing diet rules.
5. **Gym day** toggle: adds a post-workout snack (1 hour after gym, default 5 PM) and a bigger lunch note.
6. **Grocery**: a list built from the options you picked, with tick boxes.
7. **Ate something else**: log what you had, and the app suggests a light next meal.
8. **Running late**: shift every meal time for that day by 30 min to 2 hours.

Dinner always shows veg options only (no non-veg or curd at night). Data is saved in the browser on each device (localStorage), so the phone and laptop keep separate records for now.

## Run on the laptop

```powershell
cd C:\Users\sidda\pitta-diet-app
python -m http.server 5173
```

Open http://localhost:5173 in Edge or Chrome.

## Put it on the iPhone (free)

The iPhone needs the app on an https address to install it and use it offline. Free option with GitHub Pages:

1. Create a free GitHub account and a new public repository, e.g. `pitta-plate`.
2. Push this folder:
   ```powershell
   git remote add origin https://github.com/<your-username>/pitta-plate.git
   git push -u origin main
   ```
3. On GitHub: Settings → Pages → Source: `main` branch, `/ (root)` → Save.
4. After a minute, open `https://<your-username>.github.io/pitta-plate/` in **Safari** on the iPhone.
5. Tap **Share → Add to Home Screen**.

Netlify or Cloudflare Pages also work (drag and drop the folder).

## Meal reminders

Web apps on iPhone can't reliably ring at exact times, so use the iPhone **Reminders** app with daily repeating reminders at the meal times.

## Editing the plan

- Meals, times, options and ingredients: `data.js` (`SLOTS`).
- Swiggy guide: `EAT_OUT` in `data.js`. Rules: `RULES`.
- After changing any file, bump `VERSION` in `sw.js` so installed copies update.
- Icons: `python make_icons.py` regenerates the PNG icons.

## Later (public version)

Dosha quiz, accounts and cloud sync (e.g. Supabase free tier), more regional cuisines, a privacy policy and a "not medical advice" notice before sharing it publicly.

Lifestyle guidance based on Ayurvedic tradition, not medical advice.
