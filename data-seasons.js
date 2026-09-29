// Vedic Lifestyle Diet — SEASONS: Ritucharya (seasonal eating), six Indian seasons.
// Months are approximate for most of India (seasons shift with local weather).
// Follows the app's language rule: traditional guidance, "classical texts describe", never medical claims.
// start: [month (1-12), day] the season begins; each season ends when the next begins.

const SEASONS = [
  {
    id: 'shishira', name: 'Shishira', english: 'Late winter', start: [1, 15], months: 'mid-January to mid-March',
    dosha: 'Cold and dry. Digestive fire (agni) is traditionally strong, and Kapha begins to build up.',
    favour: ['Warm, freshly cooked meals', 'Wheat, new rice and urad dal', 'Ghee and sesame', 'Jaggery', 'Ginger and warm spices in cooking', 'Warm water to drink'],
    limit: ['Cold and iced drinks', 'Very light, dry meals', 'Long gaps without food', 'Raw salads in the evening'],
    tips: {
      V: 'Your season to nourish: warm oil massage and soft, warm, well-oiled food are traditionally advised.',
      P: 'A comfortable season for you. Enjoy hearty meals, with less chilli.',
      K: 'Kapha starts to collect. Keep sweets and heavy dairy modest and stay active in the mornings.',
    },
    source: 'Charaka Samhita, Sutrasthana 6; Ashtanga Hridaya, Sutrasthana 3',
  },
  {
    id: 'vasanta', name: 'Vasanta', english: 'Spring', start: [3, 15], months: 'mid-March to mid-May',
    dosha: 'Kapha that built up in winter melts with the sun and is traditionally said to be at its highest.',
    favour: ['Old (aged) rice, barley and millets', 'Moong dal', 'Bitter and astringent vegetables (bitter gourd, methi, drumstick)', 'Honey, a little, in lukewarm water', 'Ginger and black pepper', 'Light, warm meals'],
    limit: ['Heavy, oily and fried food', 'Sweets and new jaggery', 'Curd', 'Cold drinks', 'Sleeping in the daytime'],
    tips: {
      V: 'Keep meals warm and not too dry, even while eating lighter.',
      P: 'Light meals suit you; skip extra chilli as the days warm up.',
      K: 'Your most important season: keep food light, warm and less sweet, and move more.',
    },
    source: 'Charaka Samhita, Sutrasthana 6; Ashtanga Hridaya, Sutrasthana 3',
  },
  {
    id: 'grishma', name: 'Grishma', english: 'Summer', start: [5, 15], months: 'mid-May to mid-July',
    dosha: 'Hot sun dries the body; strength and agni are traditionally low. Vata begins to build up.',
    favour: ['Sweet, cool and liquid foods', 'Rice, moong dal and ghee', 'Buttermilk, tender coconut, panakam', 'Sweet fruits (mango, watermelon, grapes)', 'Milk with a little sugar at night', 'Gourd vegetables (lauki, ash gourd)'],
    limit: ['Spicy, sour and salty food', 'Fried and heavy food', 'Alcohol', 'Hard exercise in the midday heat'],
    tips: {
      V: 'Drink enough fluids and keep a little ghee in meals so the heat does not dry you out.',
      P: 'Heat is at its peak for you: cooling, sweet foods and no chilli-heavy meals.',
      K: 'An easier season for Kapha; still keep sweets moderate.',
    },
    source: 'Charaka Samhita, Sutrasthana 6; Ashtanga Hridaya, Sutrasthana 3',
  },
  {
    id: 'varsha', name: 'Varsha', english: 'Monsoon', start: [7, 15], months: 'mid-July to mid-September',
    dosha: 'Damp, cloudy days weaken agni further. Vata is traditionally at its highest and Pitta begins to build.',
    favour: ['Warm, freshly cooked, easy-to-digest meals', 'Old rice, wheat and moong dal', 'Soups and rasam', 'Ginger, pepper and a little rock salt', 'Boiled and cooled water', 'Honey in small amounts (not heated)'],
    limit: ['Raw salads and street food', 'Leafy greens that are hard to wash clean', 'Heavy, cold and stale food', 'Curd at night', 'Sleeping in the daytime'],
    tips: {
      V: 'Your most important season: warm, oily, cooked food and regular meal times.',
      P: 'Keep it light and fresh; Pitta starts to build, so go easy on sour food.',
      K: 'Light, warm meals and ginger help with the heavy, damp weather.',
    },
    source: 'Charaka Samhita, Sutrasthana 6; Ashtanga Hridaya, Sutrasthana 3',
  },
  {
    id: 'sharad', name: 'Sharad', english: 'Autumn', start: [9, 15], months: 'mid-September to mid-November',
    dosha: 'After the rains the sun is sharp again. Pitta that built up in the monsoon is traditionally at its highest.',
    favour: ['Sweet, bitter and astringent tastes', 'Rice, wheat, barley and moong dal', 'Ghee and milk', 'Amla, pomegranate, grapes and sweet fruits', 'Bitter gourd and gourd vegetables', 'Water kept in moonlight or sun-warmed and cooled'],
    limit: ['Curd', 'Sour, very salty and spicy food', 'Fried food and heavy oils', 'Fish and heating meats', 'Sitting in strong sun'],
    tips: {
      V: 'Warm, well-cooked meals with ghee keep you steady as the days change.',
      P: 'Your most important season: choose cooling, sweet and bitter foods, and skip chilli, curd and fried food.',
      K: 'A good season to keep meals light; enjoy bitter vegetables.',
    },
    source: 'Charaka Samhita, Sutrasthana 6; Ashtanga Hridaya, Sutrasthana 3',
  },
  {
    id: 'hemanta', name: 'Hemanta', english: 'Early winter', start: [11, 15], months: 'mid-November to mid-January',
    dosha: 'Cool weather; agni is traditionally at its strongest, so the body can digest heavier, nourishing food.',
    favour: ['Nourishing meals: wheat, new rice, urad dal', 'Ghee, milk and sesame', 'Jaggery and sesame sweets (in moderation)', 'Warm soups and stews', 'Warm water', 'Root vegetables'],
    limit: ['Cold, dry and very light food', 'Skipping meals (strong agni needs food)', 'Iced drinks'],
    tips: {
      V: 'Your season to build strength with warm, oily, nourishing food.',
      P: 'You can eat heartier now; keep chilli and sour food moderate.',
      K: 'Enjoy the nourishing food, but keep portions and sweets in check.',
    },
    source: 'Charaka Samhita, Sutrasthana 6; Ashtanga Hridaya, Sutrasthana 3',
  },
];

// The season for a date (defaults to today).
function seasonFor(date) {
  const d = date || new Date();
  const md = (d.getMonth() + 1) * 100 + d.getDate();
  const starts = SEASONS.map((s) => s.start[0] * 100 + s.start[1]);
  let idx = SEASONS.length - 1; // before 15 Jan = Hemanta (from last year)
  starts.forEach((st, i) => { if (md >= st) idx = i; });
  return SEASONS[idx];
}
