// Vedic Lifestyle Diet — DISHES: common restaurant / delivery dishes rated by dosha.
// r: [Vata, Pitta, Kapha] — 1 good choice, 0 okay in moderation, -1 better to limit.
// ask: dish-specific request for the restaurant's cooking instructions.
// swap: a lighter / better-suited choice (with search word swapQ) when a dosha should limit it.
// curd: dish is curd-based (traditionally kept away from night meals).
// Educational only — traditional guidance, not medical advice.

const DISHES = [
  // Rice dishes
  { n: 'Chicken biryani', a: ['chicken biryani', 'dum biryani', 'biryani', 'biriyani'], t: 'nonveg', r: [0, -1, -1], ask: 'Less oil and less masala. Raita and salan on the side.', swap: 'Chicken pulao, or rice with a mild chicken curry', swapQ: 'Chicken pulao' },
  { n: 'Mutton biryani', a: ['mutton biryani', 'gosht biryani'], t: 'nonveg', r: [0, -1, -1], ask: 'Less oil and less masala. Raita on the side.', swap: 'Rice with a mild mutton or chicken curry', swapQ: 'Mutton curry' },
  { n: 'Egg biryani', a: ['egg biryani', 'anda biryani'], t: 'egg', r: [0, -1, -1], ask: 'Less oil and less masala. Raita on the side.', swap: 'Rice with a mild egg curry', swapQ: 'Egg curry' },
  { n: 'Veg biryani', a: ['veg biryani', 'vegetable biryani', 'paneer biryani'], t: 'veg', r: [0, 0, -1], ask: 'Less oil and less masala. Raita on the side.', swap: 'Veg pulao', swapQ: 'Veg pulao' },
  { n: 'Veg pulao', a: ['pulao', 'pulav', 'veg pulao', 'jeera rice'], t: 'veg', r: [1, 1, 0], ask: 'Less oil, mild spice.' },
  { n: 'Fried rice', a: ['fried rice', 'schezwan rice', 'szechuan rice'], t: 'veg', r: [-1, -1, -1], ask: 'Less oil, no ajinomoto (MSG), less soy sauce, no extra chilli.', swap: 'Veg pulao or dal khichdi', swapQ: 'Veg pulao' },
  { n: 'Curd rice', a: ['curd rice', 'thayir sadam', 'daddojanam'], t: 'veg', r: [0, 1, -1], curd: true, ask: 'Fresh curd, not sour. No pickle.', swap: 'Rasam rice or dal khichdi', swapQ: 'Rasam rice' },
  { n: 'Lemon or tamarind rice', a: ['lemon rice', 'tamarind rice', 'puliyogare', 'pulihora', 'chitranna'], t: 'veg', r: [0, -1, 0], ask: 'Less oil, mild spice.', swap: 'Veg pulao or coconut rice', swapQ: 'Coconut rice' },
  { n: 'Khichdi', a: ['khichdi', 'khichadi', 'dal khichdi'], t: 'veg', r: [1, 1, 1], ask: 'Serve hot, a little ghee.' },
  { n: 'Sambar rice', a: ['sambar rice', 'bisi bele bath', 'bisibelebath'], t: 'veg', r: [0, 0, 1], ask: 'Mild spice, less tamarind.' },
  { n: 'South Indian meals / thali', a: ['meals', 'thali', 'south indian meals', 'veg meals', 'andhra meals'], t: 'veg', r: [1, 1, 0], ask: 'Less spicy, no extra pickle. Curd separately.' },

  // Tiffins
  { n: 'Idli', a: ['idli', 'idly', 'mini idli'], t: 'veg', r: [1, 1, 0], ask: 'Coconut chutney, no red chutney. A little ghee.' },
  { n: 'Plain dosa', a: ['plain dosa', 'dosa', 'dosai', 'set dosa', 'neer dosa'], t: 'veg', r: [0, 0, 0], ask: 'Less oil. Coconut chutney, no red chutney.' },
  { n: 'Masala dosa', a: ['masala dosa', 'mysore masala dosa', 'onion dosa', 'ghee roast'], t: 'veg', r: [0, -1, -1], ask: 'Less oil, mild potato masala, no red chutney.', swap: 'Plain dosa or idli', swapQ: 'Idli' },
  { n: 'Pesarattu', a: ['pesarattu', 'moong dosa'], t: 'veg', r: [0, 1, 1], ask: 'Less oil, mild chutney.' },
  { n: 'Vada', a: ['vada', 'medu vada', 'vadai', 'garelu'], t: 'veg', r: [0, -1, -1], ask: 'Fresh and hot, not re-fried.', swap: 'Idli or pongal', swapQ: 'Idli' },
  { n: 'Pongal', a: ['pongal', 'ven pongal', 'khara pongal'], t: 'veg', r: [1, 1, -1], ask: 'Serve hot.' },
  { n: 'Upma', a: ['upma', 'uppittu', 'rava upma'], t: 'veg', r: [1, 1, 0], ask: 'Less oil, soft.' },
  { n: 'Poha', a: ['poha', 'aval', 'atukulu'], t: 'veg', r: [0, 1, 1], ask: 'Mild, less lemon.' },
  { n: 'Poori', a: ['poori', 'puri', 'puri bhaji', 'chole bhature', 'bhature'], t: 'veg', r: [0, -1, -1], ask: 'Fresh and hot, mild curry.', swap: 'Chapati with a mild sabzi', swapQ: 'Chapati' },
  { n: 'Appam with stew', a: ['appam', 'stew', 'idiyappam'], t: 'veg', r: [1, 1, 0], ask: 'Mild stew, not too much coconut milk.' },

  // Breads
  { n: 'Chapati / roti / phulka', a: ['chapati', 'chapathi', 'roti', 'phulka', 'tandoori roti'], t: 'veg', r: [1, 1, 0], ask: 'Less ghee or butter.' },
  { n: 'Paratha', a: ['paratha', 'aloo paratha', 'parotta', 'kerala parotta', 'laccha paratha'], t: 'veg', r: [1, 0, -1], ask: 'Less oil or ghee, curd on the side only at lunch.', swap: 'Chapati or phulka', swapQ: 'Chapati' },
  { n: 'Naan', a: ['naan', 'butter naan', 'garlic naan', 'kulcha'], t: 'veg', r: [0, 0, -1], ask: 'Plain, not butter naan.', swap: 'Tandoori roti', swapQ: 'Tandoori roti' },

  // Dal, veg curries
  { n: 'Dal tadka / dal fry', a: ['dal tadka', 'dal fry', 'dal', 'yellow dal', 'pappu', 'tadka'], t: 'veg', r: [1, 1, 0], ask: 'Less oil and chilli. Ghee tadka is fine.' },
  { n: 'Dal makhani', a: ['dal makhani', 'dal makhni', 'maa ki dal'], t: 'veg', r: [0, 0, -1], ask: 'Less butter and cream.', swap: 'Dal tadka', swapQ: 'Dal tadka' },
  { n: 'Chole / chana masala', a: ['chole', 'chana masala', 'channa', 'chickpea curry'], t: 'veg', r: [-1, 0, 0], ask: 'Less oil and spice, extra hing if possible. Onion on the side.', swap: 'Dal tadka with rice', swapQ: 'Dal tadka' },
  { n: 'Rajma', a: ['rajma', 'rajma chawal', 'kidney bean'], t: 'veg', r: [-1, 0, 0], ask: 'Less oil, mild spice.', swap: 'Dal tadka with rice', swapQ: 'Dal tadka' },
  { n: 'Paneer butter masala', a: ['paneer butter masala', 'butter paneer', 'paneer makhani', 'shahi paneer', 'kadai paneer', 'paneer tikka masala'], t: 'veg', r: [1, 0, -1], ask: 'Less butter and cream, mild spice.', swap: 'Palak paneer or a mixed veg curry', swapQ: 'Palak paneer' },
  { n: 'Palak paneer', a: ['palak paneer', 'saag paneer'], t: 'veg', r: [0, 1, 0], ask: 'Less cream and oil.' },
  { n: 'Paneer tikka', a: ['paneer tikka'], t: 'veg', r: [0, 0, -1], ask: 'Mild marinade, not charred.', swap: 'Grilled vegetables or tandoori mushroom', swapQ: 'Tandoori mushroom' },
  { n: 'Mixed veg curry', a: ['mix veg', 'mixed veg', 'veg kurma', 'vegetable kurma', 'veg korma', 'aloo gobi', 'bhindi'], t: 'veg', r: [0, 1, 1], ask: 'Less oil, mild spice.' },
  { n: 'Pav bhaji', a: ['pav bhaji', 'pav'], t: 'veg', r: [0, -1, -1], ask: 'Less butter, mild spice.', swap: 'Chapati with mixed veg curry', swapQ: 'Mix veg' },

  // Non-veg curries
  { n: 'Butter chicken', a: ['butter chicken', 'murgh makhani', 'chicken makhani', 'chicken tikka masala'], t: 'nonveg', r: [1, 0, -1], ask: 'Less butter and cream, mild spice.', swap: 'Tandoori chicken or pepper chicken (not deep-fried)', swapQ: 'Tandoori chicken' },
  { n: 'Chicken curry', a: ['chicken curry', 'chicken korma', 'kerala chicken', 'chicken stew', 'home style chicken'], t: 'nonveg', r: [1, 0, 0], ask: 'Mild spice, less oil.' },
  { n: 'Chicken 65 / chilli chicken', a: ['chicken 65', 'chilli chicken', 'chili chicken', 'chicken lollipop', 'dragon chicken', 'chicken manchurian', 'fried chicken'], t: 'nonveg', r: [-1, -1, -1], ask: 'Less oil, less chilli.', swap: 'Pepper chicken (not deep-fried) or tandoori chicken', swapQ: 'Pepper chicken' },
  { n: 'Tandoori chicken / kebab', a: ['tandoori', 'tandoori chicken', 'kebab', 'kabab', 'tikka', 'chicken tikka', 'grilled chicken', 'seekh'], t: 'nonveg', r: [0, 0, 1], ask: 'Mild spice, not charred. Mint chutney on the side.' },
  { n: 'Pepper chicken', a: ['pepper chicken', 'chicken pepper fry', 'chicken sukka'], t: 'nonveg', r: [0, -1, 1], ask: 'Not deep-fried, less oil.' },
  { n: 'Mutton curry', a: ['mutton curry', 'mutton', 'rogan josh', 'gosht', 'keema', 'paya'], t: 'nonveg', r: [1, -1, -1], ask: 'Less oil and spice, trim the fat.', swap: 'Chicken curry (mild)', swapQ: 'Chicken curry' },
  { n: 'Haleem', a: ['haleem'], t: 'nonveg', r: [1, -1, -1], ask: 'Less ghee on top, small portion.', swap: 'Chicken soup or a mild chicken curry', swapQ: 'Chicken soup' },
  { n: 'Fish curry', a: ['fish curry', 'meen curry', 'fish moilee', 'fish'], t: 'nonveg', r: [1, 0, 0], ask: 'Mild, coconut-based, less tamarind.' },
  { n: 'Fish fry', a: ['fish fry', 'apollo fish', 'fish fingers', 'fried fish'], t: 'nonveg', r: [0, -1, -1], ask: 'Tawa fry, not deep-fried. Less chilli.', swap: 'Grilled fish or fish curry', swapQ: 'Grilled fish' },
  { n: 'Prawn curry', a: ['prawn', 'prawns', 'shrimp', 'royyala'], t: 'nonveg', r: [1, -1, 0], ask: 'Mild spice, coconut-based.', swap: 'Fish curry (mild)', swapQ: 'Fish curry' },
  { n: 'Egg curry', a: ['egg curry', 'egg masala', 'anda curry'], t: 'egg', r: [1, 0, 0], ask: 'Mild spice, less oil.' },
  { n: 'Omelette / egg bhurji', a: ['omelette', 'omelet', 'bhurji', 'egg bhurji', 'boiled egg'], t: 'egg', r: [1, -1, 0], ask: 'No green chilli, less oil.' },
  { n: 'Shawarma', a: ['shawarma', 'shawarama', 'roll', 'kathi roll', 'frankie', 'wrap'], t: 'nonveg', r: [0, -1, -1], ask: 'Less mayo, no extra chilli sauce.', swap: 'Tandoori chicken with roti', swapQ: 'Tandoori chicken' },

  // Chinese / fast food
  { n: 'Noodles', a: ['noodles', 'hakka noodles', 'chowmein', 'chow mein', 'maggi', 'schezwan noodles'], t: 'veg', r: [-1, -1, -1], ask: 'Less oil, no ajinomoto (MSG), less soy and chilli sauce.', swap: 'Veg clear soup with a small portion of noodles, or khichdi', swapQ: 'Clear soup' },
  { n: 'Manchurian', a: ['manchurian', 'gobi manchurian', 'veg manchurian', 'chilli paneer', 'crispy corn'], t: 'veg', r: [-1, -1, -1], ask: 'Dry, less oil and less sauce.', swap: 'Steamed momos or a clear soup', swapQ: 'Steamed momos' },
  { n: 'Momos', a: ['momos', 'momo', 'dumpling', 'dim sum'], t: 'veg', r: [0, 0, 0], ask: 'Steamed, not fried. Mild chutney.' },
  { n: 'Soup', a: ['soup', 'clear soup', 'tomato soup', 'sweet corn soup', 'manchow', 'chicken soup', 'rasam'], t: 'veg', r: [1, 1, 1], ask: 'Serve hot, less salt, no extra chilli.' },
  { n: 'Hot and sour soup', a: ['hot and sour', 'hot & sour'], t: 'veg', r: [0, -1, 1], ask: 'Less chilli and vinegar.', swap: 'Clear or sweet corn soup', swapQ: 'Sweet corn soup' },
  { n: 'Pizza', a: ['pizza', 'margherita', 'garlic bread'], t: 'veg', r: [-1, -1, -1], ask: 'Thin crust, less cheese, extra vegetables, no extra chilli flakes.', swap: 'A veg thali or khichdi', swapQ: 'Veg thali' },
  { n: 'Burger', a: ['burger', 'zinger', 'whopper', 'mcaloo'], t: 'veg', r: [-1, -1, -1], ask: 'Grilled, not fried. Less mayo and cheese.', swap: 'A grilled sandwich or a wrap with grilled filling', swapQ: 'Grilled sandwich' },
  { n: 'Pasta', a: ['pasta', 'penne', 'spaghetti', 'mac and cheese', 'lasagna'], t: 'veg', r: [0, -1, -1], ask: 'White or pesto sauce, less cheese, extra vegetables.', swap: 'Veg pulao or khichdi', swapQ: 'Veg pulao' },
  { n: 'Sandwich', a: ['sandwich', 'grilled sandwich', 'club sandwich', 'sub', 'subway'], t: 'veg', r: [0, 0, 0], ask: 'Toasted, less cheese and mayo.' },
  { n: 'French fries', a: ['fries', 'french fries', 'peri peri fries', 'wedges', 'nuggets'], t: 'veg', r: [-1, -1, -1], ask: 'Small portion, less salt.', swap: 'Roasted makhana or corn', swapQ: 'Sweet corn' },
  { n: 'Salad', a: ['salad', 'sprouts', 'raw'], t: 'veg', r: [-1, 1, 1], ask: 'Less dressing. Lightly steamed vegetables if Vata.' },

  // Snacks & chaat
  { n: 'Samosa / pakoda / bajji', a: ['samosa', 'pakoda', 'pakora', 'bajji', 'bhajji', 'mirchi bajji', 'kachori', 'cutlet', 'bonda'], t: 'veg', r: [0, -1, -1], ask: 'Fresh and hot, not re-fried. Mild chutney.', swap: 'Steamed dhokla or sundal', swapQ: 'Dhokla' },
  { n: 'Pani puri / chaat', a: ['pani puri', 'golgappa', 'gol gappa', 'chaat', 'bhel', 'bhel puri', 'sev puri', 'dahi puri', 'papdi chaat'], t: 'veg', r: [-1, -1, 0], ask: 'Less spicy water, less tamarind chutney.', swap: 'Sundal or roasted corn', swapQ: 'Sundal' },
  { n: 'Dhokla', a: ['dhokla', 'khaman'], t: 'veg', r: [0, 0, 1], ask: 'Fresh, mild chutney.' },

  // Sweets & drinks
  { n: 'Indian sweets', a: ['sweet', 'sweets', 'gulab jamun', 'rasgulla', 'jalebi', 'halwa', 'laddu', 'kheer', 'payasam', 'mithai', 'rasmalai'], t: 'veg', r: [1, 0, -1], ask: 'One small piece, after lunch rather than at night.', swap: 'Fresh fruit or a few dates', swapQ: 'Fruit bowl' },
  { n: 'Cake / pastry / dessert', a: ['cake', 'pastry', 'brownie', 'dessert', 'donut', 'doughnut', 'cookie'], t: 'veg', r: [0, 0, -1], ask: 'Small portion.', swap: 'Fresh fruit or a small kheer', swapQ: 'Fruit bowl' },
  { n: 'Ice cream', a: ['ice cream', 'icecream', 'kulfi', 'sundae', 'gelato', 'falooda'], t: 'veg', r: [-1, 0, -1], ask: 'Small scoop, not right after a meal.', swap: 'Warm kheer or badam milk', swapQ: 'Badam milk' },
  { n: 'Milkshake / cold coffee', a: ['milkshake', 'shake', 'cold coffee', 'frappe', 'smoothie', 'thick shake'], t: 'veg', r: [-1, 0, -1], ask: 'No ice, less sugar.', swap: 'Warm badam milk', swapQ: 'Badam milk' },
  { n: 'Lassi / buttermilk', a: ['lassi', 'buttermilk', 'chaas', 'majjiga', 'mor'], t: 'veg', r: [1, 1, 0], curd: true, ask: 'Not too cold, less sugar.' },
  { n: 'Fresh juice', a: ['juice', 'fresh juice', 'orange juice', 'watermelon juice', 'sugarcane', 'mosambi'], t: 'veg', r: [0, 1, 0], ask: 'No ice, no added sugar.' },
  { n: 'Tea / coffee', a: ['tea', 'chai', 'coffee', 'filter coffee', 'masala chai'], t: 'veg', r: [0, -1, 1], ask: 'Less sugar, not too strong.' },
  { n: 'Soft drinks', a: ['coke', 'pepsi', 'soft drink', 'cold drink', 'soda', 'sprite', 'thums up'], t: 'veg', r: [-1, -1, -1], ask: 'Skip it if you can.', swap: 'Tender coconut water or buttermilk', swapQ: 'Tender coconut' },
];

// Keyword hints for dishes not in the list above. Each adds a traditional reason,
// and optionally a request for the restaurant note.
const DISH_HINTS = [
  { re: /fri(ed|es)|fry|crispy|65|pakod|bajji|tempura|nugget|chips/i, r: [0, -1, -1], why: 'Deep-fried food is heavy and oily.', note: 'Less oil, please.' },
  { re: /chill?i|spicy|schezwan|szechuan|andhra|kolhapuri|chettinad|peri peri|mirchi|\bhot\b/i, r: [0, -1, 0], why: 'Very spicy food is traditionally said to heat Pitta.', note: 'Mild spice, no extra chilli.' },
  { re: /cheese|cream|butter|makhani|malai|mayo|alfredo/i, r: [0, 0, -1], why: 'Cheese, cream and butter are heavy for Kapha.', note: 'Less cheese and cream.' },
  { re: /\bice\b|\bcold\b|frozen|chilled|shake|kulfi/i, r: [-1, 0, -1], why: 'Cold food and drinks are traditionally said to weaken digestion (agni).', note: 'Not chilled, no ice.' },
  { re: /sweet|sugar|dessert|cake|choc|jamun|halwa|mithai/i, r: [0, 0, -1], why: 'Sweets are heavy for Kapha. Keep portions small.' },
  { re: /salad|\braw\b|sprout/i, r: [-1, 0, 0], why: 'Raw, cold food can be hard for Vata. Lightly cooked is gentler.' },
  { re: /sour|tamarind|pickle|vinegar|achar/i, r: [0, -1, 0], why: 'Sour and pickled food is traditionally said to heat Pitta.', note: 'Less sour, no pickle on the side.' },
  { re: /soup|khichdi|idli|steamed|\bdal\b|rasam/i, r: [1, 1, 1], why: 'Warm, simple, cooked food is easy to digest.' },
];
