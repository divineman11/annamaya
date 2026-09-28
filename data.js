// Meal plan data. Types: veg < egg < nonveg. "light" marks options suggested after a cheat meal.
const SLOTS = [
  { id: 'wake', label: 'Wake-up', time: '06:45', main: false, options: [
    { name: 'Warm water + 5 soaked peeled almonds', type: 'veg', light: true, ing: ['Almonds'] },
  ]},
  { id: 'breakfast', label: 'Breakfast', time: '08:00', main: true, options: [
    { name: '2 boiled eggs + 2 rotis with ghee', type: 'egg', ing: ['Eggs', 'Atta', 'Ghee'] },
    { name: 'Moong dal chilla + banana', type: 'veg', ing: ['Moong dal', 'Banana'] },
    { name: 'Pesarattu with ghee', type: 'veg', light: true, ing: ['Moong dal', 'Ghee'] },
    { name: 'Idli + coconut chutney + ghee', type: 'veg', light: true, ing: ['Idli rice', 'Urad dal', 'Coconut', 'Ghee'] },
    { name: 'Poached eggs + rava upma', type: 'egg', ing: ['Eggs', 'Rava', 'Ghee'] },
  ]},
  { id: 'mid', label: 'Mid-morning', time: '11:00', main: false, options: [
    { name: 'Banana or mango + soaked almonds', type: 'veg', ing: ['Banana', 'Almonds'] },
    { name: 'Coconut water + 2 dates', type: 'veg', light: true, ing: ['Tender coconut', 'Dates'] },
    { name: 'Grapes + soaked raisins', type: 'veg', ing: ['Grapes', 'Raisins'] },
  ]},
  { id: 'lunch', label: 'Lunch', time: '13:15', main: true, gymNote: 'Gym day: take an extra helping of rice and dal.', options: [
    { name: 'Rice + dal with ghee + mild chicken curry + cucumber raita + bottle gourd curry', type: 'nonveg', ing: ['Rice', 'Toor dal', 'Ghee', 'Desi chicken', 'Curd', 'Cucumber', 'Bottle gourd'] },
    { name: 'Rice + chicken stew (coconut) + pappu + beans poriyal + curd', type: 'nonveg', ing: ['Rice', 'Desi chicken', 'Coconut', 'Moong dal', 'Beans', 'Curd', 'Ghee'] },
    { name: 'Rice + pappu with ghee + egg curry + majjiga', type: 'egg', ing: ['Rice', 'Moong dal', 'Ghee', 'Eggs', 'Curd'] },
    { name: 'Rice + sambar + paneer curry + sweet potato fry (shallow) + curd', type: 'veg', ing: ['Rice', 'Toor dal', 'Paneer', 'Sweet potato', 'Curd', 'Ghee'] },
    { name: 'Curd rice + pappu + ridge gourd curry', type: 'veg', light: true, ing: ['Rice', 'Curd', 'Moong dal', 'Ridge gourd', 'Ghee'] },
  ]},
  { id: 'snack', label: 'Evening snack', time: '16:00', main: false, options: [
    { name: 'Warm milk with cardamom', type: 'veg', light: true, ing: ['Milk', 'Cardamom'] },
    { name: 'Roasted makhana in ghee', type: 'veg', ing: ['Makhana', 'Ghee'] },
    { name: 'Mixed nuts + 2 dates', type: 'veg', ing: ['Almonds', 'Cashews', 'Dates'] },
  ]},
  { id: 'postgym', label: 'Post-workout', gymOnly: true, main: false, options: [
    { name: 'Banana + warm milk', type: 'veg', ing: ['Banana', 'Milk'] },
    { name: 'Coconut water + banana', type: 'veg', light: true, ing: ['Tender coconut', 'Banana'] },
  ]},
  { id: 'fruit', label: 'Fruit (optional)', time: '18:00', main: false, optional: true, options: [
    { name: 'Sweet fruit (papaya, pear, grapes)', type: 'veg', light: true, ing: ['Papaya', 'Grapes'] },
    { name: 'Coconut water', type: 'veg', light: true, ing: ['Tender coconut'] },
  ]},
  { id: 'dinner', label: 'Dinner', time: '19:45', main: true, vegOnly: true, note: 'Lighter than lunch. No non-veg, no curd at night.', options: [
    { name: 'Phulka + moong dal + lauki sabzi + ghee', type: 'veg', light: true, ing: ['Atta', 'Moong dal', 'Bottle gourd', 'Ghee'] },
    { name: 'Dal khichdi with ghee', type: 'veg', light: true, ing: ['Rice', 'Moong dal', 'Ghee'] },
    { name: 'Rice + paneer sabzi + pumpkin curry', type: 'veg', ing: ['Rice', 'Paneer', 'Pumpkin', 'Ghee'] },
    { name: 'Ven pongal with ghee', type: 'veg', light: true, ing: ['Rice', 'Moong dal', 'Ghee', 'Pepper'] },
  ]},
  { id: 'bed', label: 'Bedtime', time: '21:30', main: false, options: [
    { name: 'Warm milk with cardamom or turmeric', type: 'veg', light: true, ing: ['Milk', 'Cardamom', 'Turmeric'] },
  ]},
];

const CATEGORY = {
  'Grains & dals': ['Rice', 'Atta', 'Rava', 'Idli rice', 'Toor dal', 'Moong dal', 'Urad dal'],
  'Dairy & ghee': ['Ghee', 'Milk', 'Curd', 'Paneer'],
  'Vegetables': ['Cucumber', 'Bottle gourd', 'Beans', 'Sweet potato', 'Ridge gourd', 'Pumpkin', 'Coconut'],
  'Fruit': ['Banana', 'Grapes', 'Papaya', 'Tender coconut'],
  'Eggs & chicken': ['Eggs', 'Desi chicken'],
  'Dry fruits & spices': ['Almonds', 'Cashews', 'Dates', 'Raisins', 'Makhana', 'Cardamom', 'Turmeric', 'Pepper'],
};

// Swiggy / eating-out guide by meal time
const EAT_OUT = {
  breakfast: { label: 'Breakfast', safe: ['Idli with ghee and coconut chutney', 'Ven pongal', 'Pesarattu or plain dosa', 'Rava upma', 'Boiled eggs with toast'], avoid: ['Masala dosa with spicy red chutney', 'Puri with spicy curry', 'Mirchi bajji or vada', 'Chilli idli'] },
  lunch: { label: 'Lunch', safe: ['South Indian veg meals (ask for less spicy)', 'Butter chicken or chicken korma with rice', 'Kerala chicken stew with appam', 'Mild egg curry with rice', 'Curd rice with pappu'], avoid: ['Andhra chicken fry or spicy gongura', 'Chilli chicken, chicken 65', 'Biryani with mirchi ka salan', 'Pickles and extra red chilli', 'Ice-cold soft drinks'] },
  snack: { label: 'Evening', safe: ['Fruit bowl', 'Tender coconut', 'Dry fruit laddu', 'Kheer or payasam (small)', 'Warm badam milk'], avoid: ['Samosa, pakodi, bajji', 'Pani puri and sour chaat', 'Iced coffee or cold drinks', 'Spicy mixture'] },
  dinner: { label: 'Dinner', safe: ['Dal khichdi with ghee', 'Phulka + dal + paneer butter masala (mild)', 'Ven pongal', 'Veg thali without curd', 'Moong dal + rice'], avoid: ['Any non-veg at night', 'Curd, raita or buttermilk', 'Fried rice, noodles, manchurian', 'Pizza, burgers, fried starters'] },
};

const RULES = [
  'Eat at the same times every day. Never skip a meal.',
  'Use ghee generously on rice, rotis and dal.',
  'No ice-cold drinks with meals. Warm or room-temperature water.',
  'Keep fried, spicy and sour food to a minimum.',
  'Desi chicken over broiler. Non-veg only at lunch.',
  '1 to 2 eggs a day, boiled or poached.',
  'Curd only at lunch, never at night.',
  'Avoid horse gram (ulavacharu) and organ meats.',
  'Gym: strength-focused, moderate intensity, keep rest days. Coconut water after.',
];
