/**
 * SpeediBoi's AI Riddler — Cloudflare Worker Proxy
 *
 * ENV VARS (set in Cloudflare dashboard → Workers → Settings → Variables):
 *   ANTHROPIC_API_KEY   — your Anthropic API key (sk-ant-...)
 *   VALID_TOKENS        — comma-separated list of allowed client tokens
 *                         e.g. "mytoken123,backuptoken456"
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Models mapped to tier names (matches Lua script tier field)
const TIER_MODELS = {
  FASTER: "claude-haiku-4-5",
  FAST:   "claude-sonnet-4-5",
};

// ── SAB Knowledge Base ─────────────────────────────────────────────────────────
const SAB_DB = `
INSTRUCTIONS: IF ASKED THE RAREST/COMMON BRAINROT YOU NEED FROM WAYPOINT 1 START TO WAYPOINT 1 END TO FINALIZE THE ANSWER
I LIVE IN UNITED STATES!
YOU NEED TO HANDLE THE RAREST ETC YOURSELF CORRECTLY
"Nth RAREST OG" ALWAYS COUNTS DOWN FROM THE RAREST. USE THIS EXACT RANKING AND NEVER COUNT FROM THE LEAST RARE END:
1st rarest OG = StrawberryElephant
2nd rarest OG = HeadlessHorseman
3rd rarest OG = Meowl
4th rarest OG = JohnPork
5th rarest OG = SkibidiToilet
THE LEAST RAREST OG IS SKIBIDITOILET AND THE MOST RAERST IS STRAWBERRYELEPHANT
POV YOUR SAMMY AND YOU ARE GIVING RIDDLES THIS IS WHAT YOU NEED TO KNOW
LUNAR TOLD SAMMY TO RUN YIN YANG ONCE AND SHE IS A TESTER + GF
THE RAREST BRAINROT IN TERMS OF RARITY IS HEADLESSHORSEMAN AND IN TERMS OF MONEY STRAWBERRYELEPHANT
THE BRIANROTS NAME + THEIR INCOME + THEIR RARITY + WHERE THEY ARE OBTAINED FROM
1x1x1x1 | 1.11M | Secret | Cave Ritual
25 | 2.5M | Secret | Advent Calendar
4th Bros | 3.75M | Secret | Admin Abuse
67 | 7.5M | Secret |
Abyssaloco | 33.33M | Secret | Backrooms Event
Admin Lucky Block | 0 | Admin |
Agarrini la Palini | 425K | Secret | First Fuse Machine
Alessio | 85K | Brainrot God |
Anpali Babel | 280K | Brainrot God | This was obtained from the Craft Machine
Antonio | 125M | Secret | First Craft Machine
Appelini | 300K | Brainrot God | The Red Carpet
Aquanaut | 245K | Brainrot God | The Red Carpet
Aquarino | 4.25M | Secret | Summer Hour
Arcadopus | 5M | Secret | Tsunami LTM
Arcadragon | 215M | Secret | DLC Code
Astrolero Cervalero | 280K | Brainrot God | Divine Fuse
Avocadini Antilopini | 115 | Epic | The Red Carpet
Avocadini Guffo | 225 | Epic | The Red Carpet
Avocadorilla | 7K | Mythic | First Fuse Machine
Bacuru and Egguru | 24M | Secret | OG Fuse
Ballerina Cappuccina | 500 | Legendary | The Red Carpet
Ballerina Peppermintina | 215K | Brainrot God | Advent/Winter Hour
Ballerino Lololo | 200K | Brainrot God | The Red Carpet
Bambini Crostini | 135 | Epic | The Red Carpet
Bambu Bambu Sahur | 275K | Brainrot God | Indonesia Event
Bananita Dolphinita | 150 | Epic | The Red Carpet
Bananito | 15M | Secret | The Red Carpet
Bananito Bandito | 16.5K | Mythic |
Bandito Axolito | 1.23K | Legendary | Cyber Craft
Bandito Bobritto | 35 | Rare | The Red Carpet
Baskito | 16M | Secret |
Baskito Egg | 0 | Easter |
Bearito Cabinito | 72.5M | Secret |
Beavo Potto | 315K | Brainrot God | Bee Block
Bee Loco | 13.5K | Mythic | Cyber Craft
Bee Lucky Block | 0 | Honey |
Belula Beluga | 290K | Brainrot God | Brainrot Trader
Berenjello Angello | 18K | Mythic | Divine Fuse
Berryno | 1.5M | Secret | The Red Carpet
Bisonte Giuppitere | 325K | Secret | This is obtained from Sammy's Base
Blackhole Goat | 400K | Secret |
Blueberrinni Octopusini | 1K | Legendary | The Red Carpet
Boatito Auratito | 525K | Secret | Admin Abuse
Boba Panda | 270K | Brainrot God | OG Fuse
Bombardini Tortinii | 225K | Brainrot God | Taco Event
Bombardiro Crocodilo | 2.5K | Mythic | The Red Carpet
Bombardiro Vaccariro | 1M | Secret | Summer Fuse
Bombombini Gusini | 5K | Mythic | The Red Carpet
Boneca Ambalabu | 40 | Rare | The Red Carpet
Boppin Bunny | 80M | Secret | DLC Code
Brainrot God Lucky Block | 0 | Brainrot God |
Brasilini Berimbini | 285K | Brainrot God | Admin Abuse
Brr Brr Patapim | 100 | Epic | The Red Carpet
Brr es Teh Patipum | 225K | Brainrot God | First Fuse Machine
Brri Brri Bicus Dicus Bombicus | 175 | Epic | The Red Carpet
Brunito Marsito | 3.5M | Secret | This was spawned during Bruno's Concert Event
Brutto Gialutto | 3K | Mythic | First Craft Machine
Bucketoro | 18.25K | Mythic | Summer Fuse
Bufalino Boomberino | 32M | Secret | Limited Quantity Craft
Buho de Fuego | 1.85K | Legendary | Witch's Fuse
Buho de Noelo | 267.5K | Brainrot God | Santa's Fuse
Buho de Volto | 2.75M | Secret | Cyber Craft
Buho del Cielo | 1.35K | Legendary | Divine Fuse
Bulbito Bandito Traktorito | 205K | Brainrot God |
Bumbatron | 172.5M | Secret | Bee Merchant
Bunito Bunito Spinito | 3M | Secret | New Year's Event
Bunny and Eggy | 170M | Secret | Divine Fuse
Bunny Bunny Bunny Sahur | 2.25M | Secret | Easter Event
Bunny Bunny Bunny Sahur Egg | 0 | Easter |
Bunny Tralala | 270K | Brainrot God |
Bunny Tralala Egg | 0 | Easter |
Bunnyman | 1.5M | Secret | Advent Calendar
Buntteo | 850K | Secret | Easter Event
Buntteo Egg | 0 | Easter |
Burbaloni Loliloli | 200 | Legendary | The Red Carpet
Burguro And Fryuro | 150M | Secret |
Burrito Bandito | 4M | Secret |
Burrito Bat | 7M | Secret | Taco Merchant
Cacasito Satalito | 240K | Brainrot God | The Red Carpet
Cachorrito Melonito | 13K | Mythic | The Red Carpet
Cacto Hipopotamo | 50 | Rare | The Red Carpet
Camera Ramena | 17M | Secret | Cyber Craft
Candini Fluffini | 57.5M | Secret | RNG Machine
Cangurato Gelato | 77.5M | Secret | The Red Carpet
Capi Taco | 155K | Brainrot God | Taco Event
Capitano Americano | 72.5M | Secret | Limited Quantity Craft
Capitano Gullini | 22M | Secret | Summer Fuse
Capitano Moby | 160M | Secret | The Red Carpet
Cappuccino Assassino | 75 | Epic | The Red Carpet
Cappuccino Clownino | 285K | Brainrot God |
Caramello Filtrello | 1.05K | Legendary | First Craft Machine
Carloo | 13.5K | Mythic |
Carrotini Brainini | 15K | Mythic |
Cash or Card | 100M | Secret | The Red Carpet
Cavallo Virtuoso | 7.5K | Mythic | The Red Carpet
Caylusaurus | 55M | Secret | Limited Quantity Craft
Celestial Pegasus | 175M | Secret |
Celularcini Viciosini | 22.5M | Secret | First Craft Machine
Centrucci Nuclucci | 15.5K | Mythic | Brainrot Trader
Cerberus | 175M | Secret | The Red Carpet
Chachechi | 400K | Secret | Admin Abuse
Chef Crabracadabra | 600 | Legendary | The Red Carpet
Chicleteira Bicicleteira | 3.5M | Secret | The Red Carpet
Chicleteira Champeona | 19M | Secret | Spain Event
Chicleteira Cupideira | 17.5M | Secret |
Chicleteira Noelteira | 15M | Secret | Santa's Fuse
Chicleteira Surfeiteira | 16M | Secret | Summer Hour
Chicleteirina Bicicleteirina | 4M | Secret | The Red Carpet
Chihuanini Taconini | 45K | Brainrot God |
Chill Puppy | 4M | Secret | OG Fuse
Chillin Chili | 25M | Secret | Limited Quantity Craft
Chimnino | 14M | Secret |
Chimpanzini Bananini | 300 | Legendary | The Red Carpet
Chipso and Queso | 25M | Secret | Limited Quantity Craft
Chocco Bunny | 1.4K | Legendary | Santa's Fuse
Chrismasmamat | 277.5K | Brainrot God |
Churrito Bunnito | 21M | Secret |
Churrito Bunnito Egg | 0 | Easter |
Cigno Fulgoro | 20M | Secret | Divine Fuse
Clickerino Crabo | 1K | Legendary | Brainrot Trader
Cloverat Clapat | 60M | Secret | St Patricks Event
Clovkur Kurkur | 305K | Brainrot God |
Coco and Mango | 33.5M | Secret | Summer Fuse
Cocoa Assassino | 291K | Brainrot God | Christmas Event
Cocofanto Elefanto | 19K | Brainrot God | The Red Carpet
Cocosini Mama | 1.2K | Legendary | First Fuse Machine
Cocoteddy | 15K | Mythic | Summer Fuse
Cola Cat | 275K | Brainrot God |
Conetto Morsetto | 10M | Secret | Bee Merchant
Cooki and Milki | 155M | Secret | Santa's Fuse
Corn Corn Corn Sahur | 250K | Brainrot God | The Piñata
Crabbo Limonetta | 235K | Brainrot God |
Craburger | 1.3M | Secret |
Cuadramat and Pakrahmatmamat | 1.4M | Secret | Brainrot Trader
Cupcake Koala | 60 | Rare | Brainrot Trader
Cupid Cupid Sahur | 3.1M | Secret | Cupid's Machine
Cupid Hotspot | 3.5M | Secret |
Digi Narwhal | 200M | Secret | Cyber Craft
Divino Platypio | 160K | Brainrot God | Divine Fuse
DJ Panda | 17.5M | Secret | The Red Carpet
Doi Doi Do | 260 | Epic | Brainrot Trader
Dolphini Jetskini | 294.5K | Brainrot God | OG Fuse
Donkeyturbo Express | 7.5M | Secret | Christmas Event
Dragon Aquanini | 375M | Secret | Summer Fuse
Dragon Cannelloni | 250M | Secret | The Red Carpet
Dragon Gingerini | 350M | Secret | Santa's Fuse
Dug dug dug | 35M | Secret | First Craft Machine
Duggy Bros | 90M | Secret | Cyber Craft
Dul Dul Dul | 375K | Secret | Admin Abuse
Dumborino Miracello | 315K | Brainrot God | Divine Fuse
Easter Easter Easter Sahur | 1.25M | Secret |
Easter Easter Easter Sahur Egg | 0 | Easter |
Egg Lucky Block | 0 | Easter |
Eggdin Egg Egg Dun | 310K | Brainrot God |
Eggdin Egg Egg Dun Egg | 0 | Easter |
Eid Eid Eid Sahur | 3.5M | Secret | Eid Event
Electro Quacko | 1.85K | Legendary | Cyber Craft
Elefanto Frigo | 185M | Secret | First Craft Machine
Esok Goala | 32.5M | Secret | Soccer Board
Esok Sekolah | 30M | Secret |
Espresso Signora | 70K | Brainrot God | Admin Abuse
Eviledon | 31.5M | Secret | Witch's Fuse
Examen Bros | 70M | Secret | Los Traders
Extinct Ballerina | 125K | Brainrot God | Extinct Event
Extinct Matteo | 625K | Secret | Extinct Event
Extinct Tralalero | 450K | Secret | Extinct Event
Festive 67 | 67M | Secret | DLC Code
Festive Lucky Block | 0 | Festive |
Fishboard | 825K | Secret | The Red Carpet
Fishino Clownino | 120M | Secret | Fishing Event
Fizzy Soda | 17.25K | Mythic | OG Fuse
Flancito | 3.75M | Secret | SAB's Anniversary Event
Flipa Sandala | 6M | Secret | Backrooms Event
Flippo Marino | 316K | Brainrot God | Summer Fuse
Fluriflura | 7 | Common | The Red Carpet
Fortunu and Cashuru | 130M | Secret |
Foxini Lanternini | 115M | Secret | Eid Event
Fragola La La La | 32.5M | Secret | First Craft Machine
Fragrama and Chocrama | 100M | Secret | Brainrot Trader
Frankentteo | 700K | Secret | Halloween Event
Frigo Camelo | 2K | Mythic | The Red Carpet
Frio Ninja | 265K | Brainrot God | Witch's Fuse
Frogato Pirato | 240 | Epic | Witch's Fuse
Frogo Elfo | 67 | Rare | Santa's Fuse
Frullato Framingo | 20M | Secret | Sammy's Code
Futbolini Skatini | 4.5M | Secret | Cyber Craft
Ganganzelli Trulala | 9K | Mythic | First Fuse Machine
Gangster Footera | 30 | Rare | The Red Carpet
Garama and Madundung | 50M | Secret | The Red Carpet
Gato Celesto | 250 | Epic | Divine Fuse
Gattatino Nyanino | 35K | Brainrot God | Admin Abuse
Gattito Tacoto | 165K | Brainrot God |
Gelatina Volatina | 2.4M | Secret | RNG Machine
Gelato Lumacho | 1.4M | Secret | Summer Hour
Giftini Spyderini | 1000K | Secret | This was obtained from the North Pole
Ginger Cisterna | 293.5K | Brainrot God | Santa's Fuse
Ginger Gerat | 75M | Secret | Santa's Market
Ginger Globo | 257.5K | Brainrot God | Santa's Fuse
Girafa Celestre | 20K | Brainrot God | The Red Carpet
Girafini Raftini | 18M | Secret |
Glaciator | 2.3M | Secret | Backrooms Event
Globa Steppa | 27.5M | Secret | DLC Code
Glorbo Fruttodrillo | 750 | Legendary | The Red Carpet
GOAT | 950K | Secret | Admin Abuse
Gobblino Uniciclino | 27.5M | Secret | Thanksgiving Event
Gold Egg | 0 | Secret |
Gold Elf | 0 | Secret |
Gold Gold Gold | 45M | Secret |
Gorillo Subwoofero | 7.75K | Mythic | First Craft Machine
Gorillo Watermelondrillo | 8K | Mythic | The Red Carpet
Grabatron | 62.5M | Secret | DLC Codes
Graipuss Medussi | 1M | Secret | The Red Carpet
Granchiello Spiritell | 260K | Brainrot God | Fishing Event
Granny | 4M | Secret | Granny's Funeral Event
Griffin | 400M | Secret | Divine Fuse
Guest 666 | 66.67M | Secret | Cave Ritual
Gym Bros | 42.5M | Secret | Cyber Craft
Harpuccino | 14K | Mythic | Divine Fuse
Headless Horseman | 600M | OG | Witch's Fuse
Heart Lucky Block | 0 | Valentines |
Hippo Golazo | 1.25M | Secret | Soccer Board
Ho Ho Ho Sahur | 3.25M | Secret | Santa's Fuse
Holy Arepa | 14 | Common | Divine Fuse
Honey Honey Bear | 32M | Secret | Bee Merchant
Honey Honey Narwhal | 950K | Secret | Bee Block
Hopilikalika Hopilikalako | 55M | Secret |
Hopilikalika Hopilikalako Egg | 0 | Easter |
Horegini Boom | 2.75M | Secret | Aura Boat
Hydra Bunny | 185M | Secret |
Hydra Bunny Egg | 0 | Easter |
Hydra Dragon Cannelloni | 300M | Secret | OG Fuse
Jacko Jack Jack | 150K | Brainrot God | Witch's Fuse
Jacko Spaventosa | 16.25K | Mythic | Witch's Fuse
Jackorilla | 315K | Secret |
Jelly Moby | 175M | Secret | SAB's Anniversary Event
Jingle Jingle Sahur | 12.25K | Mythic | Santa's Fuse
Job Job Job Sahur | 700K | Secret | The Red Carpet
John Doe | 7.5M | Secret | Cave Ritual
John Pork | 500M | OG | The Red Carpet
Jolly Jolly Sahur | 45M | Secret | Santa's Market
Kalika Bros | 115M | Secret | Cyber Craft
Karker Sahur | 725K | Secret | First Craft Machine
Karkerheart Luvkur | 297.5K | Brainrot God |
Karkerkar Kurkur | 325K | Secret | Admin Abuse
Ketchuru and Musturu | 42.5M | Secret | The Red Carpet
Ketupat Bros | 145M | Secret | OG Fuse
Ketupat Kepat | 35M | Secret | The Red Carpet
Kraken | 200M | Secret |
Krupuk Pagi Pagi | 290K | Brainrot God | Indonesia Event
La Anniversary Grande | 50M | Secret | Limited Quantity Craft
La Breakfast Combinasion | 165M | Secret | RNG Machine
La Casa Boo | 100M | Secret |
La Cucaracha | 475K | Secret | Admin Abuse
La Easter Grande | 55M | Secret | Limited Quantity Craft
La Extinct Grande | 23.5M | Secret | Extinct Event
La Food Combinasion | 90M | Secret |
La Fuse Machine | 95M | Secret | RNG Machine
La Ginger Sekolah | 75M | Secret |
La Grande Combinasion | 10M | Secret | The Red Carpet
La Jolly Grande | 30M | Secret | Christmas Wheel Spin
La Karkerkar Combinasion | 600K | Secret | First Craft Machine
La Lucky Grande | 40M | Secret | Limited Quantity Craft
La Romantic Grande | 40M | Secret | Limited Quantity Craft
La Sahur Combinasion | 2M | Secret | First Craft Machine
La Secret Combinasion | 125M | Secret |
La Spooky Grande | 24.5M | Secret | Limited Quantity Craft
La Summer Grande | 60M | Secret | Limited Quantity Craft
La Supreme Combinasion | 200M | Secret | First Fuse Machine
La Taco Combinasion | 35M | Secret | Limited Quantity Craft
La Vacca Jacko Linterino | 850K | Secret | Halloween Event
La Vacca Lepre Lepreino | 1.1M | Secret |
La Vacca Prese Presente | 600K | Secret | Santa's Fuse
La Vacca Saturno Saturnita | 325K | Secret | The Red Carpet
Las Capuchinas | 185K | Brainrot God | First Craft Machine
Las Sis | 17.5M | Secret | First Craft Machine
Las Tralaleritas | 650K | Secret | The Red Carpet
Las Vaquitas Saturnitas | 750K | Secret | La Vacca Ritual
Lavadorito Spinito | 45M | Secret | The Red Carpet
Lazy Ducky | 255K | Brainrot God | DLC Code
Lemonita Splashita | 280K | Brainrot God | Summer Fuse
Leprechaun Lucky Block | 0 | St Patrick's |
Lerulerulerule | 8.75K | Mythic | The Red Carpet
Lionel Cactuseli | 650 | Legendary | The Red Carpet
Lirilì Larilà | 3 | Common | The Red Carpet
List List List Sahur | 2M | Secret | Christmas Event
Los 25 | 10M | Secret |
Los 67 | 22.5M | Secret |
Los Admins | 95M | Secret | Los Traders
Los Amigos | 130M | Secret |
Los Bombinitos | 220K | Brainrot God |
Los Bros | 24M | Secret | First Craft Machine
Los Bunitos | 4.25M | Secret |
Los Bunitos Egg | 0 | Easter |
Los Burritos | 8.5M | Secret |
Los Candies | 23M | Secret | Santa's Fuse
Los Chicleteiras | 7M | Secret | Chicleteira Ritual
Los Chihuaninis | 160K | Brainrot God |
Los Chillis | 75M | Secret | Cyber Craft
Los Combinasionas | 15M | Secret | First Fuse Machine
Los Cornis | 3.1M | Secret | Los Traders
Los Crocodillitos | 55K | Brainrot God | Bombardiro Event
Los Cucarachas | 1.25M | Secret |
Los Cupids | 30M | Secret | Divine Fuse
Los Fruits | 23M | Secret | Summer Fuse
Los Gattitos | 275K | Brainrot God |
Los Hackers | 75M | Secret | Cyber Craft
Los Hotspotsitos | 20M | Secret | First Fuse Machine
Los Jobcitos | 1.5M | Secret |
Los Jolly Combinasionas | 20M | Secret | Santa's Market
Los Karkeritos | 750K | Secret | Karker Ritual
Los Lucky Blocks | 0 | Admin |
Los Mariachis | 30M | Secret | The Piñata
Los Matteos | 325K | Secret | Matteo Ritual
Los Mi Gatitos | 6.5M | Secret | Mi Gatito Ritual
Los Mobilis | 22M | Secret | Witch's Fuse
Los Noobinis | 12.5K | Mythic | Cyber Craft
Los Nooo My Hotspotsitos | 5.5M | Secret |
Los Orcalitos | 235K | Brainrot God | First Fuse Machine
Los Planitos | 18.5M | Secret | Brainrot Trader
Los Primos | 31M | Secret | First Craft Machine
Los Puggies | 30M | Secret | Brainrot Trader
Los Quesadillas | 4.5M | Secret |
Los Secret Combinasionas | 150M | Secret | Los Traders
Los Sekolahs | 110M | Secret |
Los Sigmas | 2.3M | Secret | Los Traders
Los Spaghettis | 70M | Secret | Brainrot Trader
Los Spooky Combinasionas | 20M | Secret |
Los Spyderinis | 425K | Secret | Spyderini Ritual
Los Sweethearts | 16.5M | Secret | First Fuse Machine
Los Taco Blocks | 0 | Taco |
Los Tacoritas | 32M | Secret | First Craft Machine
Los Tangcitos | 42.5M | Secret | Los Traders
Los Tictacs | 60M | Secret | Los Traders
Los Tipi Tacos | 260K | Brainrot God |
Los Tortus | 500K | Secret |
Los Tralaleritos | 500K | Secret | The Red Carpet
Los Trios | 700K | Secret | OG Fuse
Los Tungtungtungcitos | 210K | Brainrot God | First Fuse Machine
Love Love Bear | 225M | Secret | Cupid's Machine
Love Love Love Sahur | 1M | Secret |
Lovin Rose | 32.5M | Secret | Cupid's Machine
Luck Luck Luck Sahur | 3.75M | Secret |
Lumaca Malefica | 265K | Brainrot God | Backrooms Event
Luv Luv Luv | 282.5K | Brainrot God |
Magi Ribbitini | 11.5K | Mythic | Witch's Fuse
Malame Amarele | 140 | Epic | First Craft Machine
Mangolini Parrocini | 235 | Epic | Brainrot Trader
Mariachi Corazoni | 12.5M | Secret | The Piñata
Mastodontico Telepiedone | 275K | Brainrot God |
Matteo | 50K | Brainrot God | Admin Abuse
Meowl | 600M | OG | The Red Carpet
Mi Gatito | 3.25M | Secret | Admin Abuse
Mieteteira Bicicleteira | 26M | Secret | Witch's Fuse
Moby Bros | 225M | Secret | Los Traders
Money Money Bros | 47M | Secret | Cyber Craft
Money Money Man | 65K | Brainrot God | Brainrot Trader
Money Money Puggy | 21M | Secret | The Red Carpet
Money Money Reindeer | 25M | Secret | Santa's Market
Motorino Bumbino | 16.5M | Secret | Bee Block
Mummio Rappitto | 325 | Epic | Witch's Fuse
Mummy Ambalabu | 250K | Brainrot God |
Mythic Lucky Block | 0 | Mythic |
Nacho Spyder | 50M | Secret | Limited Quantity Craft
Nachorilla | 47.5M | Secret | Taco Merchant
Naughty Naughty | 3M | Secret | Christmas Event
Noo La Polizia | 280K | Brainrot God | Brainrot Trader
Noo my Candy | 5M | Secret | Trick Or Treat
Noo my Eggs | 7M | Secret | Easter Event
Noo my Eggs Egg | 0 | Easter |
Noo my examine | 32.5M | Secret | Dul Dul Ritual
Noo my Gold | 13.5M | Secret |
Noo my Heart | 13M | Secret |
Noo my Present | 6M | Secret | Christmas Event
Noo my Resume | 32.5M | Secret | Job Ritual
Noobini Pizzanini | 1 | Common | The Red Carpet
Noobini Santanini | 11 | Common | Santa's Fuse
Noodle Noodle Poodle | 27.5M | Secret | The Red Carpet
Nooo My Hotspot | 1.5M | Secret | Taco Event
Nuclearo Dinossauro | 15M | Secret | The Red Carpet
Octo Lucky Block | 0 | Summer |
Octoball | 3.25M | Secret |
Odin Din Din Dun | 75K | Brainrot God |
Ombrello Topolino | 6.5M | Secret | Summer Fuse
Orangutini Ananassini | 2.1K | Mythic | The Red Carpet
Orbi Mochi | 18.5K | Mythic | Cyber Craft
Orcaledon | 40M | Secret | Brainrot Trader
Orcalero Orcala | 100K | Brainrot God |
Orcalita Orcala | 240K | Brainrot God | Cyber Craft
Orchidox | 155M | Secret | Bee Block
Pakrahmatmamat | 215K | Brainrot God | The Red Carpet
Pakrahmatmatina | 225K | Brainrot God | Pole Game
Pancake and Syrup | 125M | Secret | DLC Code
Pandaccini Bananini | 1.25K | Legendary | The Red Carpet
Pandanini Frostini | 294K | Brainrot God |
Paradiso Axolottino | 900K | Secret | Divine Fuse
Patteo | 287.5K | Brainrot God |
Pengolino Nuvoletto | 72 | Rare | Divine Fuse
Penguin Tree | 270 | Epic | Santa's Fuse
Penguino Cocosino | 300 | Epic | Summer Fuse
Perochello Lemonchello | 160 | Epic | The Red Carpet
Perrito Burrito | 1M | Secret | Limited Quantity Craft
Peschito Machito | 19M | Secret | RNG Machine
Pi Pi Watermelon | 1.3K | Legendary | Summer Fuse
Piccione Macchina | 225K | Brainrot God | The Red Carpet
Piccionetta Macchina | 270K | Brainrot God | First Craft Machine
Pinealotto Fruttarino | 75 | Rare | Witch's Fuse
Pineaplino | 200K | Brainrot God | DLC Code
Pipi Avocado | 70 | Rare | Summer Fuse
Pipi Corni | 14 | Common | Summer Fuse
Pipi Kiwi | 13 | Common | The Red Carpet
Pipi Potato | 1.1K | Legendary | The Red Carpet
Pirulitoita Bicicleteira | 2.5M | Secret | Brainrot Trader
Pizza and Ranch | 130M | Secret |
Please my Present | 1.3M | Secret | Advent Calendar
Pogo Pogo Penguin | 12.5M | Secret | RNG Machine
Polaroidini | 55M | Secret | DLC Codes
Pop Pop Petalini | 62.5M | Secret | Bee Block
Pop Pop Sahur | 295K | Brainrot God |
Popcuru and Fizzuru | 170M | Secret | OG Fuse
Pot Hotspot | 2.5M | Secret |
Pot Pumpkin | 3M | Secret | Halloween Event
Premium Bee Lucky Block | 0 | Honey |
Premium Egg Lucky Block | 0 | Easter |
Premium Festive Lucky Block | 0 | Festive |
Premium Heart Lucky Block | 0 | Valentines |
Premium Leprechaun Lucky Block | 0 | St Patrick's |
Premium Octo Lucky Block | 0 | Summer |
Pretzo Robo | 320K | Brainrot God | Cyber Craft
Puffaball | 1.5K | Legendary | Fishing Event
Pumpkini Spyderini | 650K | Secret |
Quackalena | 265K | Brainrot God | RNG Machine
Quackini Snackini | 65M | Secret | Egg Town Event
Quackini Snackini Egg | 0 | Easter |
Quackula | 1.28K | Legendary | Witch's Fuse
Queen Bee | 65M | Secret | Bee Merchant
Quesadilla Crocodila | 3M | Secret |
Quesadillo Vampiro | 3.5M | Secret | Limited Quantity Craft
Quivioli Ameleonni | 900 | Legendary | The Red Carpet
Raccooni Jandelini | 12 | Common | Admin Abuse War
Rang Ring Bus | 6M | Secret | Pole Game
Ref Ref Ref Sahur | 2.75M | Secret | Soccer Board
Reindeer Tralala | 600K | Secret | Christmas Event
Reinito Sleighito | 140M | Secret |
Rhino Helicopterino | 11K | Mythic | First Craft Machine
Rhino Toasterino | 2.15K | Mythic |
Rico Dinero | 42.5M | Secret | DLC Code
Robo Grafito | 317.5K | Brainrot God | Backrooms Event
Rocco Disco | 650K | Secret | New Year's Event
Rocketini Frostini | 3M | Secret | Sammy's Code
Rosatops Triceratino | 3.1M | Secret | Bee Block
Rosetti Tualetti | 50M | Secret |
Rosey and Teddy | 165M | Secret |
Rubiko and Kubiko | 72.5M | Secret | Los Traders
Rubrikiko | 70M | Secret | Backrooms Event
S'more Serat | 85M | Secret | Bee Merchant
Salamino Penguino | 250 | Epic | The Red Carpet
Sammyni Cakini | 85M | Secret | SAB's Anniversary Event
Sammyni Fattini | 70M | Secret |
Sammyni Spyderini | 325K | Secret | Admin Abuse
Sammyni Truckini | 110M | Secret | Taco Merchant
Sand Sand Sand | 30M | Secret |
Santa Hotspot | 2.6M | Secret |
Santteo | 800K | Secret | Christmas Event
Scorpino Coasterino | 47.5M | Secret | RNG Machine
Sealo Regalo | 1.83K | Legendary | Santa's Fuse
Secret Lucky Block | 0 | Secret |
Serafinna Medusella | 5.5M | Secret | Divine Fuse
Seraphino Gruyero | 1.9K | Legendary | Divine Fuse
Sigma Boy | 1.35K | Legendary | The Red Carpet
Sigma Girl | 1.8K | Legendary | First Craft Machine
Signore Carapace | 275M | Secret | First Craft Machine
Skibidi Toilet | 450M | OG | The Red Carpet
Skull Skull Skull | 290K | Brainrot God | Halloween Event
Snailenzo | 250K | Brainrot God | Witch's Fuse
Snailo Clovero | 18.5M | Secret |
Spaghetti Tualetti | 60M | Secret |
Spinny Hammy | 17M | Secret | OG Fuse
Spioniro Golubiro | 3.5K | Mythic |
Spongini Quackini | 13K | Mythic | OG Fuse
Spooky and Pumpky | 80M | Secret | Witch's Fuse
Spooky Lucky Block | 0 | Spooky |
Spyder Elephant | 1B | OG |
Squalanana | 250K | Brainrot God | Cyber Craft
Steakini Fattini | 55M | Secret | Limited Quantity Craft
Stoppo Luminino | 8K | Mythic | Brainrot Trader
Strawberrelli Flamingelli | 1.15K | Legendary | The Red Carpet
Strawberrita | 6.5M | Secret |
Strawberry Elephant | 750M | OG | The Red Carpet
Sundrilla Sundae | 180K | Brainrot God | Summer Fuse
Sushi Inu | 8M | Secret |
Svinina Bombardino | 10 | Common | The Red Carpet
Swag Soda | 13M | Secret | Brainrot Trader
Swaggy Bros | 40M | Secret | Limited Quantity Craft
Syrup Samurai | 6.7M | Secret | Bee Block
Ta Ta Ta Ta Sahur | 55 | Rare |
Taco Lucky Block | 0 | Taco |
Tacorillo Crocodillo | 12.5M | Secret | Limited Quantity Craft
Tacorita Bicicleta | 16.5M | Secret | Taco Event
Tacoturbo Tacorito | 26M | Secret | Taco Merchant
Talpa Di Fero | 9 | Common | The Red Carpet
Tang Tang Keletang | 33.5M | Secret | The Red Carpet
Tartaragno | 13 | Common | Witch's Fuse
Tartaruga Cisterna | 250K | Brainrot God | This is obtained from Sammy's Base
Te Te Te Sahur | 9.5K | Mythic | The Red Carpet
Telemorte | 2M | Secret |
Tenini Ballini | 320K | Brainrot God | DLC Code
Tentacolo Tecnico | 292.5K | Brainrot God | Witch's Fuse
Ti Ti Ti Sahur | 225 | Epic | Summer Fuse
Tic Tic Ribbit | 18.75K | Mythic | RNG Machine
Tictac Sahur | 37.5M | Secret | The Red Carpet
Tigrilini Watermelini | 6.5K | Mythic |
Tigroligre Frutonni | 60K | Brainrot God |
Tim Cheese | 5 | Common | The Red Carpet
Tipi Topi Taco | 75K | Brainrot God | Taco Event
Tirilikalika Tirilikalako | 42.5M | Secret | First Craft Machine
To to to Sahur | 2.25M | Secret | The Red Carpet
Tob Tobi Tobi | 8.5K | Mythic | First Fuse Machine
Toiletto Focaccino | 16K | Mythic | The Red Carpet
Tootini Shrimpini | 260K | Brainrot God | New Year's Event
Toro Españolo | 2.25M | Secret | Spain Event
Torrtuginni Dragonfrutini | 350K | Secret |
Tortuginni Sandcastlini | 317.5K | Brainrot God |
Tracoducotulu Delapeladustuz | 12K | Mythic | The Red Carpet
Tractoro Dinosauro | 230K | Brainrot God | The Red Carpet
Tralaledon | 27.5M | Secret | First Craft Machine
Tralalero Tralala | 50K | Brainrot God | The Red Carpet
Tralalita Tralala | 100K | Brainrot God | The Red Carpet
Tree Tree Tree Sahur | 17K | Mythic | Santa's Fuse
Trenostruzzo Turbo 3000 | 150K | Brainrot God | The Red Carpet
Trenostruzzo Turbo 4000 | 335K | Secret | First Craft Machine
Trenotubo Axolotrico 9000 | 255K | Brainrot God | Cyber Craft
Tric Trac Baraboom | 65 | Rare | The Red Carpet
Trickolino | 900K | Secret |
Triplito Tralaleritos | 875K | Secret |
Trippi Troppi | 15 | Rare | The Red Carpet
Trippi Troppi Troppa Trippa | 175K | Brainrot God | The Red Carpet
Trulimero Trulicina | 125 | Epic | The Red Carpet
Tuff Toucan | 26M | Secret | New Year's Event
Tukanno Bananno | 100K | Brainrot God | First Fuse Machine
Unclito Samito | 75K | Brainrot God | Admin Abuse
Urubini Flamenguini | 150K | Brainrot God | Admin Abuse
Vampira Cappucina | 125K | Brainrot God | Halloween Event
Var Var Var | 5.5M | Secret | Soccer Board
Ventoliero Pavonero | 65M | Secret | The Red Carpet
Venuspino | 175M | Secret | Summer Fuse
Vulturino Skeletono | 500K | Secret | Witch's Fuse
W or L | 30M | Secret | Limited Quantity Craft
Wheelchair Granny | 0 | Secret |
Wombo Rollo | 275 | Epic | The Red Carpet
Yess my examine | 575K | Secret | Dul Dul Ritual
Yess my Resume | 2.1M | Secret | Job Ritual
Yeti Claus | 257.5K | Brainrot God | Santa's Fuse
Yetimatic | 87.5M | Secret | RNG Machine
Zibra Zubra Zibralini | 6K | Mythic |
Zombie Tralala | 500K | Secret | Halloween Event

THE NEW BRAINROTS ARE:
Found 9 new animals.
Chicli Chicla | 47.5M | Secret | OG Craft
Deputy Leopard | 18M | Secret | OG Craft
Gold and Diamond | 85M | Secret | OG Craft
Hippo Jacuzzo | 322.5K | Brainrot God | OG Craft
Koala Parabala | 200K | Brainrot God | OG Craft
La Craft Machine | 75M | Secret | OG Craft
Los Dragons | 425M | Secret | OG Craft
Panda Popanda | 67M | Secret | OG Craft
Pelican Pachetto | 1.75M | Secret | OG Craft

THE NEW BRAINROT THAT WILL COME NEXT UPDATE IS:
Hydra Serpent

BEST SECRET RIGHT NOW IS LOS DRAGONS

IF I ASK WHAT IS THE SECOND RAREST SECRET BRAINROT YOU SAY DRAGONAQUANINI AND IF I SAK WHAT IF THE 3RD RAREST SECRET BRAINROT YOU SAY DRAGONGINGERINI, AND LIKE SO..........
so if i ask what is the rarest brainrot you say Strawberry Elephant and if i ask what is the most common brainrot you say Noobini Pizzanini and if I ask what is the 6th most rarest brainrot you will say Griffin since the 5th rarest brainrots are ogs and 6th one is Griffin the most rarest secret so you go through multiple mutations if asked what is the rarest brainrots
- WAYPOINT 1 START
THe Game was released on May 15, 2025. So if i ask which month you say May, which year 2025, which year and month => 2025MAY
Sammy (The Developer) was born in the month of february he ages 24 right now
SAMMY'S HEIGHT IS 35
SAMMY'S WEIGHT IS 250
SAMMY'S CAR IS RED
SAMMY'S FAVOURITE BRAINROT IS MEOWL
SAMMY'S CAT NAME IS NOVA
THE NEWEST EVENT IS MONEY MONEY PUGGY
THE NEWEST RITUAL IS MONEY MONEY PUGGY
FROM THE NEWEST EVENT YOU GET LOS PUGGIES
FROM THE NEWEST RITUAL YOU GET LOS PUGGIES
SOURCE ALIASES (other names people use for a source; edit or remove freely)
ALIAS: Christmas Fuse = Santa's Fuse
ALIAS: Xmas Fuse = Santa's Fuse
All mutations names are (in order when they released and their multiplier is low to high)
Normal - 1x
Gold - 1.25x
Diamond - 1.5x
Rainbow - 10x
Bloodrot - 2x
Candy - 4x
Lava - 6x
Galaxy - 7x
Yin Yang - 7.5x
Radioactive - 8.5x
Cursed - 9x
Divine - 10x
Cyber - 11x
Phantom - 12x
Crystal - 13x
BASE SKINS
F2P Bases (that cannot be bought):
Halloween - A base that came in Halloween event.
Aquatic - A base that came in Aquatic event.
Christmas - A F2P base that came in Christmas event.
Taco - A base that came for Taco.
Valentines - A F2P base that came in Valentines event.
Lucky - A F2P base that came in Leprechaun event.
Easter - A F2P base that came in Easter event.
Summer - A F2P base that came in Summer event.
P2W Bases (that is bought through robux):
Gingerbread - A P2W base that came in Christmas event
Rose - A P2W base that came in Valentines event.
Pot of Gold - A P2W base that came in Leprechaun event.
Bunny Basket - A P2W base that came in Easter event.
Octo - A P2W base that came in Octo event.
Tralalero - A DLC base.
Bee Emperor - A P2W base that came in Bee event.
Mutation Bases (listed as low rare to high rare):
Bloodrot
Candy
Lava
Galaxy
YinYang
Radioactive
Cursed
Divine
Cyber
Phantom
Crystal
and these codes are already completed you need to exclude these
ILOVEFOOD123 (limited stock - exclusive)        Kraken
SUMMERUPD3 (limited stock)      Rocketini Frostini (75%) / Frullato Framingo (25%)
NEEDTHIS4CRAFT333 (limited stock)       Chicleteira Surfeiteira
OCTOBLOCK555 (limited stock)    Octo Lucky Block
FREEOCTOBLOCK777 (limited stock)        Octo Lucky Block
FREEOCTO555 (limited stock)     Octo Lucky Block
FREEPREMIUMOCTO777 (limited stock)      Premium Octo Lucky Block
WSUMMERUPD1 (limited stock)     Premium Octo Lucky Block
FREEOCTOBASE333W (limited stock)        Octo Base
WAVERIDER4FREELOL (limited stock)       Waverider
FREE500DRAGS (limited stock)    Dragon Cannelloni
JOHNPORKDAPIGGY (limited stock) John Pork
CODESAREREAL321 (limited stock) John Pork
L2EXPLOITERS (limited stock)    John Pork
IMANEGG (limited stock) Strawberry Elephant
PIZZAISYUM (limited stock)      Pizza And Ranch
MAYMEOWLJANDEL (limited stock - 3)      Meowl
CANDY24SAMMY (limited stock - 1)        Strawberry Elephant
DIVINECURSED (limited stock -1) Strawberry Elephant
Codes were added on December 13, 2025.
The first code that was added was for the Festive 67 which is a limited quantity brainrot and plushie.
Each code for Festive 67 is random because a payment is required to get the Festive 67.
There are currently no new codes in the game since Sammy has not added any more yet.
Despite Sammy saying on the week after the code feature was added that he would "add some new codes for taco tuesday", there are still none for everyone to use, currently nearing 5 months since then.
The codes feature used to have a Santa Hat on it during christmas, but the hat got removed on 3/16/26.
On 6/13/26, Sammy made a GUI button for codes and removed it from the shop.
The Premium Octo Lucky Block from the code "WSUMMERUPD1" is likely very rare, as some got traits. This makes traited Premium Octo Lucky Blocks rare but possible, since Premium Octo Lucky Blocks usually instantly teleport to your base after purchasing it from the Robux Shop.
Sammy created a code for Steak himself named "IMANEGG", spawning him a Strawberry Elephant.
Sammy stopped creating codes from Saturday, June 27, to Tuesday, June 30, during Admin Abuses due to exploiters.
Sammy has fixed this as of the June 30th Taco Tuesday, and the exploiter group that used AI to get codes has been banned from the game,
Sammy made the code "L2EXPLOITERS", which would have spawned a John Pork.
# SAB Info Book
> Community-made Steal a Brainrot reference file.
>
> This file is made for reference, riddle solving, collecting information, and learning about SAB history.
>
> Information can change because Steal a Brainrot updates often.
---
# Table of Contents
1. Overview
2. Value Formula
3. Brainrot Rarity Notes
4. OG Brainrots
5. Mutation History
6. Trait System
7. Trait Categories
8. Secrets
9. Events
10. Trivia
11. Development Credits
---
# Overview
Steal a Brainrot is a Roblox game focused on collecting, stealing,
and upgrading Brainrots.
Brainrots can have:
- Mutations
- Traits
- Different rarities
- Different values
- Limited availability
Some content is permanently unavailable after events.
---
# Value Formula
Brainrot income is calculated using:
    Final Value =
    (Brainrot Value x Mutation Multiplier)
    + Trait Multiplier 1
    + Trait Multiplier 2
    + Other Trait Multipliers
Multiple traits can stack.
Some traits use special calculations.
Example:
Ventoliero Pavonero:
Base income:
$65M/s
Default:
1x multiplier
Gold:
1.25x multiplier
Cyber:
11x multiplier
With one 5x trait:
Default:
6x
Gold:
6.25x
Cyber:
16x
With two 5x traits:
Default:
11x
Gold:
11.25x
Cyber:
21x
---
# OG Brainrots
OG Brainrots are some of the oldest and rarest Brainrots.
## OG Order
| Order | Brainrot |
|---|---|
| 1st OG | Strawberry Elephant |
| 2nd OG | Headless Horseman |
| 3rd OG | Meowl |
| 4th OG | John Pork |
| 5th OG | Skibidi Toilet |
---
# Mutation History
## Bloodrot
Multiplier:
2x
Release:
Update 2
Event:
Bloodmoon
Visual:
Dark red appearance.
Notes:
One of the earliest known mutations.
---
## Candy
Multiplier:
4x
Release:
July 5 2025
Event:
Candy Aurora
Visual:
Pink appearance.
---
## Lava
Multiplier:
6x
Release:
July 25 2025
Event:
Molten
Visual:
Orange neon appearance.
---
## Galaxy
Multiplier:
7x
Release:
August 23 2025
Event:
Galactic
Visual:
Purple neon appearance.
---
## Yin Yang
Multiplier:
7.5x
Release:
September 27 2025
Visual:
Black and white appearance.
---
## Radioactive
Multiplier:
8.5x
Release:
November 15 2025
Visual:
Green radioactive appearance.
---
## Cursed
Multiplier:
9x
Release:
January 3 2026
Visual:
Red and black appearance.
---
## Divine
Multiplier:
10x
Release:
February 21 2026
Visual:
White/yellow appearance.
---
## Cyber
Multiplier:
11x
Release:
April 18 2026
Visual:
Black and blue cyber appearance.
---
## Phantom
Multiplier:
12x
Release:
June 13 2026
Visual:
Transparent dark appearance.
---
# Mutation Order
Oldest known mutations:
1. Bloodrot
2. Candy
3. Lava
4. Galaxy
5. Yin Yang
6. Radioactive
7. Cursed
8. Divine
9. Cyber
10. Phantom
---
# Traits
Traits modify Brainrot value.
Traits can be:
- OG
- Event
- Admin Abuse
- Seasonal
- Ritual
- Natural
---
# OG Traits
| Trait | Multiplier |
|---|---:|
| Strawberry | 9x |
| Meowl | 8x |
| John Pork | 7.5x |
| Skibidi | 7x |
---
# Admin Abuse Traits
| Trait | Multiplier |
|---|---:|
| Fire | 5x |
| Nyan | 5x |
| Lightning | 5x |
| Rose | 5x |
| Fireworks | 5x |
| Granny | 5.5x |
| Burger | 4.5x |
| Disco | 4x |
| Glitch | 4x |
| Crab | 4x |
| Zombie | 4x |
| Bubblegum | 3x |
| UFO | 2x |
| Taco | 2x |
| Sleepy | 0.5x |
---
# Seasonal Traits
| Trait | Multiplier |
|---|---:|
| Reindeer | 5x |
| Chocolate | 4.5x |
| 26 | 5x |
| Halo | 5x |
| Lucky | 5x |
| Jack O Lantern | 4.5x |
| Bunny Ears | 4.5x |
| Santa Hat | 4x |
| RIP Tombstone | 3.5x |
| Witching Hour | 3x |
| Skeleton | 3x |
---
# Balloon Traits
| Trait | Multiplier |
|---|---:|
| Orange Balloon | 3x |
| Green Balloon | 3.5x |
| Blue Balloon | 4x |
| Red Balloon | 5x |
| Pink Balloon | 5.5x |
| Rainbow Balloon | 6.5x |
---
# Egg Traits
| Trait | Multiplier |
|---|---:|
| Orange Egg | 3x |
| Green Egg | 4x |
| Blue Egg | 4.5x |
| Pink Egg | 6.5x |
---
# Ritual Traits
| Trait | Multiplier |
|---|---:|
| Paint | 5x |
| :3 | 4.5x |
| Tie | 3.75x |
| Spider | 3.5x |
| Matteo Hat | 3.5x |
| Galactic | 3x |
| Explosive | 3x |
| Shark Fin | 3x |
---
# Natural Traits
| Trait | Multiplier |
|---|---:|
| Comet-struck | 2.5x |
| Snowy | 2x |
| Wet | 1.5x |
---
# Events
## Bloodmoon Event
Associated mutation:
Bloodrot
Effect:
Brainrots can receive Bloodrot mutation.
Appearance:
Dark red mutation effect.
---
## Candy Aurora Event
Associated mutation:
Candy
Effect:
Candy mutation chance.
Appearance:
Pink mutation effect.
---
## Molten Event
Associated mutation:
Lava
Effect:
Lava mutation chance.
Appearance:
Orange neon effect.
---
## Galactic Event
Associated mutation:
Galaxy
Effect:
Galaxy mutation chance.
Appearance:
Purple neon effect.
---
## Yin Yang Event
Associated mutation:
Yin Yang
Effect:
Black and white mutation.
---
## Radioactive Event
Associated mutation:
Radioactive
Effect:
Green radioactive mutation.
---
## Cursed Event
Associated mutation:
Cursed
Effect:
Red/black cursed mutation.
---
## Divine Event
Associated mutation:
Divine
Effect:
Yellow/white divine mutation.
---
## Cyber Event
Associated mutation:
Cyber
Effect:
Cyber mutation.
---
## Phantom Event
Associated mutation:
Phantom
Effect:
Phantom mutation.
---
# Trait Details
## Strawberry
Multiplier:
9x
Category:
OG
Notes:
One of the highest multiplier traits.
---
## Meowl
Multiplier:
8x
Category:
OG
Notes:
Second OG trait.
---
## John Pork
Multiplier:
7.5x
Category:
OG
Notes:
OG event trait.
---
## Skibidi
Multiplier:
7x
Category:
OG
Notes:
Skibidi themed trait.
---
## Taco
Multiplier:
2x
Category:
Admin Abuse
Notes:
Known as one of the earliest traits.
---
## Fire
Multiplier:
5x
Category:
Admin Abuse
Notes:
Fire effect appears on Brainrot.
---
## Nyan
Multiplier:
5x
Category:
Admin Abuse
Notes:
Rainbow trail effect.
---
## Lightning
Multiplier:
5x
Category:
Admin Abuse
Notes:
Lightning dragon visual.
---
## Fireworks
Multiplier:
5x
Category:
Admin Abuse
Notes:
Firework effects.
---
## Disco
Multiplier:
4x
Category:
Admin Abuse
Notes:
Neon disco style.
---
## Glitched
Multiplier:
4x
Category:
Admin Abuse
Notes:
Glitch visuals.
---
## Crab
It is the 2nd most hated trait
Multiplier:
4x
Category:
Admin Abuse
Notes:
Crab claw visuals.
---
## Zombie
Multiplier:
4x
Category:
Admin Abuse
Notes:
Red eye effect.
---
## Bubblegum
Multiplier:
3x
Category:
Admin Abuse
Notes:
Bubble effect.
---
## UFO
Multiplier:
2x
Category:
Admin Abuse
Notes:
Alien UFO effect.
---
## Sleepy
Multiplier:
0.5x
Category:
Admin Abuse
Notes:
Negative multiplier.
---
# Rare Historical Facts
## Oldest Trait
Taco is considered one of the earliest known traits.
---
## High Multiplier Traits
Traits above 6x include:
- Strawberry
- Meowl
- John Pork
- Skibidi
- Rainbow Balloon
- Pink Egg
---
## Event Traits
Some traits only appear during limited events.
Many become unobtainable after events end.
---
# Riddle Code Help Section
For riddle codes, common answers may reference:
- OG Brainrots
- Secret Brainrots
- Event names
- Mutation names
- Update history
Always check current game updates because codes can change.
---
# SAB Timeline Notes
## Early Era
- OG Brainrots introduced.
- Early traits appeared.
- First events started.
## Mutation Era
- Bloodrot introduced.
- More mutation events added.
- Higher multipliers introduced.
## Event Era
- More Admin Abuse traits.
- Seasonal traits.
- Limited content.
---
# Trivia
- OG traits are among the strongest traits.
- Rainbow Balloon is one of the strongest non-OG traits.
- Pink Egg has a very high multiplier.
- Halo is connected to Divine mutation.
- Some traits are no longer normally obtainable.
- Admin Abuse introduced many exclusive traits.
- Mutations change Brainrot appearance.
- Traits change value.
---
# Development Credits
## Management
- SpyderSammy
- do_small
- Atavi
---
## Contributors
- mygame43
- Jordan
- hgdev
- ABU
- TyrxNOff
- Alsalihin
- jandel
---
## Developers
- MegaImpostor585
- Joey
- BossSpax
- Molten
- K4RM4_Dev
- Thernus
- Guga
- iJava
- Adam
- yHasteeD
- Conception_World
- anonric
---
 -- === DEVELOPER & OWNER (SAMMY) ===
    "Dev / Game Owner: Sammy | Riddle perspective (I/me/my): SpyderSammy",
    "age: 24 | birthday: February 25, 2002",
    "height: 35 | weight: 250 | car: red",
    "favorite color: Blue | favorite animal: Spider",
    "favorite Brainrot: Meowl",
    "cat name: Nova",
    "newest event/ritual: MoneyMoneyPuggy (you get: LosPuggies)",
    "favorite football player: CristianoRonaldo",
    "world cup win: Spain | world cup loose: Argentina",
    "eliminated world cup: 2026",
    "rival game / worst game / hated game: KeyboardEscape",
    -- === GAME INFO ===
    "Game Name: StealABrainrot",
    "creation date: May 16, 2025",
    -- === OG BRAINROTS ===
    "1st OG: StrawberryElephant",
    "2nd OG: Headless Horseman tier: OG",
    "3rd OG: Meowl",
    "4th OG: JohnPork",
    "5th OG: SkibidiToilet",
    -- === MUTATIONS ===
    "1st Mutation: Bloodrot | 2nd: Candy | 3rd: Lava | 4th: Galaxy",
    "5th Mutation: YinYang | 6th: Radioactive | 7th: Cursed",
    "8th Mutation: Divine | 9th: Cyber | 10th: Phantom",
    "What mutations do: change appearance and value",
    -- === SECRET BRAINROTS ===
    "First Secret: LaVaccaSaturnoSaturnita",
    "First Nerfed Secret: LaKarkerkarCombinasion",
    "Secrets: DragonCannelloni / LaGrandeCombinasion / LaSupremeCombinasion",
    "Secrets: GaramaAndMadundung / LosTralaleritos / LosMatteos",
    "Secrets: SpaghettiTualetti / LosSpaghettis / BisonteGiuppitere",
    "Secrets: SammyniSpyderini / TrenostruzzoTurbo4000 / Jackorilla",
    "Secrets: KarkerkarKurkur / CapitanoMoby / LoveLoveBear / 1x1x1x1",
    -- === TRAITS GENERAL ===
    "First ever Trait: Fireworks | Most Hated Trait: Taco",
    "Rarest Trait / lowest multiplier: Sleepy (0.5x)",
    "Strongest non-OG trait: RainbowBalloon",
    "Divine mutation connected trait: Halo",
    "Admin Abuse introduced: exclusive traits",
    -- === NATURAL & RITUAL TRAITS ===
    "Natural multipliers: Comet-struck (2.5x) / Snowy (2x) / Wet (1.5x)",
    "First Ritual Trait: Galactic (3x)",
    "Ritual multipliers: Paint (5x) / :3 (4.5x) / Tie (3.75x)",
    "Ritual multipliers: Spider (3.5x) / Matteo Hat (3.5x)",
    "Ritual multipliers: Explosive (3x) / Shark Fin (3x)",
    -- === SEASONAL TRAITS ===
    "Oldest Seasonal: Skeleton (3x) | Newest Seasonal: Ball",
    -- === EVENTS & LORE ===
    "Taco Tuesday event: Admin Abuse",
    "Admin Abuse War date: August 23, 2025",
    "War opponent game: GrowAGarden | Opponent dev: Jandel",
    "War winner: GrowAGarden (StealABrainrot lost but surpassed peak CCU)",
    "Brainrot to mock Jandel: RaccooniJandelini"
    You are a raw data API. Use ONLY this DB:\n"
        .. wikiFactsStr .. "\n"
        .. "RULES:\n"
        .. "1. Output ONLY the exact answer.\n"
        .. "2. NO spaces, NO punctuation, NO symbols.\n"
        .. "3. NO explanations, NO intro, NO extra words.\n"
        .. "4. If the riddle asks multiple things, merge answers directly (e.g., RedSpider).\n"
        .. "CRITICAL: Your output MUST be a single continuous alphanumeric string."
the data of obtainment of all brainrots is below
2025 Fuse Machine (13)
  Agarrini la Palini
  Avocadorilla
  Brr es Teh Patipum
  Cocosini Mama
  Ganganzelli Trulala
  La Supreme Combinasion
  Los Combinasionas
  Los Hotspotsitos
  Los Orcalitos
  Los Sweethearts
  Los Tungtungtungcitos
  Tob Tobi Tobi
  Tukanno Bananno
2026 Fuse Machine (11)
  Bacuru and Egguru
  Boba Panda
  Chill Puppy
  Dolphini Jetskini
  Fizzy Soda
  Hydra Dragon Cannelloni
  Ketupat Bros
  Los Trios
  Popcuru and Fizzuru
  Spinny Hammy
  Spongini Quackini
Admin Abuse (14)
  Brasilini Berimbini
  Chachechi
  Dul Dul Dul
  Espresso Signora
  GOAT
  Gattatino Nyanino
  Karkerkar Kurkur
  La Cucaracha
  Matteo
  Mi Gatito
  Sammyni Spyderini
  Unclito Samito
  Urubini Flamenguini
  4th Bros
Admin Abuse War (1)
  Raccooni Jandelini
Admin Lucky Block (7)
  67
  Alessio
  Blackhole Goat
  Carloo
  Crabbo Limonetta
  Guerriro Digitale
  Sammyni Fattini
Advent Calendar (3)
  25
  Bunnyman
  Please my Present
Advent/Winter Hour (4)
  Ballerina Peppermintina
  List List List Sahur
  Reindeer Tralala
  Santteo
Backrooms (6)
  Abyssaloco
  Flipa Sandala
  Glaciator
  Lumaca Malefica
  Robo Grafito
  Rubrikiko
Bee Merchant (5)
  Bumbatron: RAREST BRAINROT
  Conetto Morsetto
  Honey Honey Bear
  Queen Bee
  S'more Serat
Brainrot God Lucky Block (5)
  Bulbito Bandito Traktorito
  Mastodontico Telepiedone
  Orcalero Orcala
  Pop Pop Sahur
  Tigroligre Frutonni
Brainrot Trader (17)
  Belula Beluga
  Centrucci Nuclucci
  Clickerino Crabo
  Cuadramat and Pakrahmatmamat
  Cupcake Koala
  Doi Doi Do
  Fragrama and Chocrama
  Los Planitos
  Los Puggies
  Los Spaghettis
  Mangolini Parrocini
  Money Money Man
  Noo La Polizia
  Orcaledon
  Pirulitoita Bicicleteira
  Stoppo Luminino
  Swag Soda
Bruno's Concert (1)
  Brunito Marsito
Christmas (5)
  Cocoa Assassino
  Donkeyturbo Express
  Giftini Spyderini
  Naughty Naughty
  Noo my Present
Christmas Wheel Spin (1)
  La Jolly Grande
Cupid's Machine (3)
  Cupid Cupid Sahur
  Love Love Bear
  Lovin Rose
Cyber Craft (19)
  Bandito Axolito
  Bee Loco
  Buho de Volto
  Camera Ramena
  Digi Narwhal
  Duggy Bros
  Electro Quacko
  Futbolini Skatini
  Gym Bros
  Kalika Bros
  Los Chillis
  Los Hackers
  Los Noobinis
  Money Money Bros
  Orbi Mochi
  Orcalita Orcala
  Pretzo Robo
  Squalanana
  Trenotubo Axolotrico 9000
Divine Fuse (16)
  Astrolero Cervalero
  Berenjello Angello
  Buho del Cielo
  Bunny and Eggy
  Cigno Fulgoro
  Divino Platypio
  Dumborino Miracello
  Gato Celesto
  Griffin
  Harpuccino
  Holy Arepa
  Los Cupids
  Paradiso Axolottino
  Pengolino Nuvoletto
  Serafinna Medusella
  Seraphino Gruyero
Easter (3)
  Bunny Bunny Bunny Sahur
  Buntteo
  Noo my Eggs
Egg Lucky Block (8)
  Baskito
  Bunny Tralala
  Churrito Bunnito
  Easter Easter Easter Sahur
  Eggdin Egg Egg Dun
  Hopilikalika Hopilikalako
  Hydra Bunny
  Los Bunitos
Egg Town (1)
  Quackini Snackini
Eid (2)
  Eid Eid Eid Sahur
  Foxini Lanternini
Extinct (3)
  Extinct Ballerina
  Extinct Matteo
  Extinct Tralalero
Festive Lucky Block (8)
  Chimnino
  Chrismasmamat
  La Ginger Sekolah
  Los 25
  Pandanini Frostini
  Reinito Sleighito
  Santa Hotspot
  Triplito Tralaleritos
First Craft Machine (25)
  Anpali Babel
  Antonio
  Brutto Gialutto
  Caramello Filtrello
  Celularcini Viciosini
  Dug dug dug
  Elefanto Frigo
  Fragola La La La
  Gorillo Subwoofero
  Karker Sahur
  La Karkerkar Combinasion
  La Sahur Combinasion
  Las Capuchinas
  Las Sis
  Los Bros
  Los Primos
  Los Tacoritas
  Malame Amarele
  Piccionetta Macchina
  Rhino Helicopterino
  Sigma Girl
  Signore Carapace
  Tirilikalika Tirilikalako
  Tralaledon
  Trenostruzzo Turbo 4000
Fishing (3)
  Fishino Clownino
  Granchiello Spiritell
  Puffaball
Granny's Funeral (1)
  Granny
Halloween (2)
  Pot Pumpkin
  Skull Skull Skull
Heart Lucky Block (8)
  Chicleteira Cupideira
  Cupid Hotspot
  Karkerheart Luvkur
  Love Love Love Sahur
  Luv Luv Luv
  Noo my Heart
  Rosetti Tualetti
  Rosey and Teddy
Indonesia (4)
  Bambu Bambu Sahur
  Boatito Auratito
  Horegini Boom
  Krupuk Pagi Pagi
Leprechaun Lucky Block (8)
  Clovkur Kurkur
  Fortunu and Cashuru
  Gold Gold Gold
  La Vacca Lepre Lepreino
  Luck Luck Luck Sahur
  Noo my Gold
  Patteo
  Snailo Clovero
Limited Quantity Craft (22)
  Caylusaurus
  Chillin Chili
  Chipso and Queso
  La Anniversary Grande
  La Easter Grande
  La Extinct Grande
  La Lucky Grande
  La Romantic Grande
  La Spooky Grande
  La Taco Combinasion
  Nacho Spyder
  Perrito Burrito
  Quesadillo Vampiro
  Steakini Fattini
  Swaggy Bros
  Tacorillo Crocodillo
  Tacorita Bicicleta
  Tuff Toucan
  W or L
  Bufalino Boomberino
  La Summer Grande
  Capitano Americano
Los Lucky Blocks (6)
  Los 67
  Los Bombinitos
  Los Jobcitos
  Los Sekolahs
  Los Tipi Tacos
  Los Tortus
Los Taco Blocks (6)
  Los Amigos
  Los Burritos
  Los Chihuaninis
  Los Cucarachas
  Los Gattitos
  Los Quesadillas
Los Traders (9)
  Examen Bros
  Los Admins
  Los Cornis
  los secret combinasionas
  Los Sigmas
  Los Tangcitos
  Los Tictacs
  Moby Bros
  Rubiko and Kubiko
Mythic Lucky Block (5)
  Bananito Bandito
  Carrotini Brainini
  Spioniro Golubiro
  Tigrilini Watermelini
  Zibra Zubra Zibralini
New Year's (3)
  Bunito Bunito Spinito
  Rocco Disco
  Tootini Shrimpini
Octo Lucky Block (8)
  Bearito Cabinito
  Craburger
  Girafini Raftini
  Kraken
  Octoball
  Sand Sand Sand
  Sushi Inu
  Tortuginni Sandcastlini
Pole Game (2)
  Pakrahmatmatina
  Rang Ring Bus
Rituals (16)
  Noo my examen
  Noo my Resume
  Yess my Examen
  Yess My Resume
  Las Vaquitas Saturnitas
  Los Crocodillitos
  Los Matteos
  Los Spyderinis
  Los Chicleteiras
  Yess my examine
  Noo my examine
  Los Karkeritos
  1x1x1x1
  Guest 666
  John Doe
  Los Mi Gatitos
RNG Machine (8)
  Tic Tic Ribbit
  Quackalena
  Gelatina Volatina
  La Breakfast Combinasion
  Peschito Machito
  Pogo Pogo Penguin
  Scorpino Coasterino
  Yetimatic
SAB's Anniversary (3)
  Flancito
  Jelly Moby
  Sammyni Cakini
Sammy's Base (2)
  Bisonte Giuppitere
  Tartaruga Cisterna
Sammy's Code (12)
  Arcadragon
  Boppin Bunny
  Festive 67
  Frullato Framingo
  Globa Steppa
  Lazy Ducky
  Pancake and Syrup
  Pineaplino
  Rico Dinero
  Rocketini Frostini
  Tenini Ballini
  Grabatron
Santa's Fuse (17)
  Buho de Noelo
  Chicleteira Noelteira
  Chocco Bunny
  Cooki and Milki
  Dragon Gingerini
  Frogo Elfo
  Ginger Cisterna
  Ginger Globo
  Ho Ho Ho Sahur
  Jingle Jingle Sahur
  La Vacca Prese Presente
  Los Candies
  Noobini Santanini
  Penguin Tree
  Sealo Regalo
  Tree Tree Tree Sahur
  Yeti Claus
Santa's Market (4)
  Ginger Gerat
  Jolly Jolly Sahur
  Los Jolly Combinasionas
  Money Money Reindeer
Secret Lucky Block [NOT SECRET RARITY USE THE DATA OF BRAINROTS] (6)
  Celestial Pegasus
  Esok Sekolah
  La Secret Combinasion
  Pot Hotspot
  Spaghetti Tualetti
  Torrtuginni Dragonfrutini
Soccer Board (4)
  Hippo Golazo
  Ref Ref Ref Sahur
  Var Var Var
  Esok Goala
Spain (2)
  Toro Espanolo
  Chicleteira Champeona
Spooky Lucky Block (8)
  Cappuccino Clownino
  Jackorilla
  La Casa Boo
  Los Spooky Combinasionas
  Mummy Ambalabu
  Pumpkini Spyderini
  Telemorte
  Trickolino
St Patricks (1)
  Cloverat Clapat
Summer Fuse (17)
  Bombardiro Vaccariro
  Bucketoro
  Capitano Gullini
  Coco and Mango
  Cocoteddy
  Dragon Aquanini
  Flippo Marino
  Lemonita Splashita
  Los Fruits
  Ombrello Topolino
  Penguino Cocosino
  Pi Pi Watermelon
  Pipi Avocado
  Pipi Corni
  Sundrilla Sundae
  Ti Ti Ti Sahur
  Venuspino
Summer Hour (3)
  Gelato Lumacho
  Aquarino
  Chicleteira Surfeiteira
Taco (4)
  Bombardini Tortinii
  Capi Taco
  Nooo My Hotspot
  Tipi Topi Taco
Taco Lucky Block (6)
  Burrito Bandito
  Chihuanini Taconini
  Gattito Tacoto
  La Food Combinasion
  Los Nooo My Hotspotsitos
  Quesadilla Crocodila
Thanksgiving (1)
  Gobblino Uniciclino
The Red Carpet (98)
  Appelini
  Aquanaut
  Avocadini Antilopini
  Avocadini Guffo
  Ballerina Cappuccina
  Ballerino Lololo
  Bambini Crostini
  Bananita Dolphinita
  Bananito
  Bandito Bobritto
  Berryno
  Blueberrinni Octopusini
  Bombardiro Crocodilo
  Bombombini Gusini
  Boneca Ambalabu
  Brr Brr Patapim
  Brri Brri Bicus Dicus Bombicus
  Burbaloni Loliloli
  Burguro And Fryuro
  Cacasito Satalito
  Cachorrito Melonito
  Cacto Hipopotamo
  Capitano Moby
  Cappuccino Assassino
  Cash or Card
  Cavallo Virtuoso
  Cerberus
  Chef Crabracadabra
  Chicleteira Bicicleteira
  Chicleteirina Bicicleteirina
  Chimpanzini Bananini
  Cocofanto Elefanto
  DJ Panda
  Dragon Cannelloni
  Fishboard
  Fluriflura
  Frigo Camelo
  Gangster Footera
  Garama and Madundung
  Girafa Celestre
  Glorbo Fruttodrillo
  Gorillo Watermelondrillo
  Graipuss Medussi
  Job Job Job Sahur
  John Pork
  Ketchuru and Musturu
  Ketupat Kepat
  La Grande Combinasion
  La Vacca Saturno Saturnita
  Las Tralaleritas
  Lavadorito Spinito
  Lerulerulerule
  Lionel Cactuseli
  Lirili Larila
  Los Tralaleritos
  Meowl
  Money Money Puggy
  Noobini Pizzanini
  Nuclearo Dinossauro
  Odin Din Din Dun
  Orangutini Ananassini
  Pakrahmatmamat
  Pandaccini Bananini
  Perochello Lemonchello
  Piccione Macchina
  Pipi Kiwi
  Pipi Potato
  Quivioli Ameleonni
  Rhino Toasterino
  Salamino Penguino
  Sigma Boy
  Skibidi Toilet
  Strawberrelli Flamingelli
  Strawberrita
  Strawberry Elephant
  Svinina Bombardino
  Ta Ta Ta Ta Sahur
  Talpa Di Fero
  Tang Tang Keletang
  Te Te Te Sahur
  Tictac Sahur
  Tim Cheese
  To to to Sahur
  Toiletto Focaccino
  Tracoducotulu Delapeladustuz
  Tractoro Dinosauro
  Tralalero Tralala
  Tralalita Tralala
  Trenostruzzo Turbo 3000
  Tric Trac Baraboom
  Trippi Troppi
  Trippi Troppi Troppa Trippa
  Trulimero Trulicina
  Ventoliero Pavonero
  Wombo Rollo
  Pizza and Ranch
  Noodle Noodle Poodle
  Cangurato Gelato
Trick Or Treat (1)
  Noo my Candy
Tsunami LTM (1)
  Arcadopus
Witch's Fuse (18)
  Buho de Fuego
  Eviledon
  Frio Ninja
  Frogato Pirato
  Headless Horseman
  Jacko Jack Jack
  Jacko Spaventosa
  Los Mobilis
  Magi Ribbitini
  Mieteteira Bicicleteira
  Mummio Rappitto
  Pinealotto Fruttarino
  Quackula
  Snailenzo
  Spooky and Pumpky
  Tartaragno
  Tentacolo Tecnico
  Vulturino Skeletono
Witching Hour (4)
  Frankentteo
  La Vacca Jacko Linterino
  Vampira Cappucina
  Zombie Tralala
No category (23)
  Alien Slap
  Blackhole Bomb
  Bloodmoon Hammer
  Bloodmoon Slap
  Candy Sentry
  Candy Slap
  Cupid's Wings
  Cursed Slap
  Cyber Slap
  Demon's Head
  Divine Slap
  Lava Blaster
  Lava Slap
  Phantom Slap
  Radioactive Airstrike
  Radioactive Slap
  Rainbow Hammer
  Rainbow Slap
  Santa's Sleigh
  Waverider
  Witch's Broom
  Yin Yang Lamp
  Yin Yang Slap
  MY NAME IS SAMMY AND IF I SAY AND 67 OR ANYTHING AFTER AND YOU NEED TO ADD IT.
`;

// System prompt for SAB riddle solving
const SYSTEM_PROMPT = `You are a raw data API for the Roblox game "Steal a Brainrot" (SAB). You solve riddles using ONLY the database below.

RULES:
1. Output ONLY the exact answer — a single continuous alphanumeric string.
2. NO spaces, NO punctuation, NO symbols unless the answer itself requires them.
3. NO explanations, NO intro, NO extra words.
4. If the riddle asks multiple things, merge answers directly (e.g. RedSpider).
5. "Nth rarest OG" counts DOWN from rarest (1st rarest = StrawberryElephant).
6. "Nth rarest Secret" counts down from rarest by value.
7. Riddle perspective: you are Sammy (SpyderSammy), the game developer.
8. If live game state is provided, use it to refine your answer.

=== DATABASE ===
${SAB_DB}`;

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return jsonError("method not allowed", 405);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonError("invalid json", 400);
    }

    const { op, token, tier, user, riddle, liveState, nonce } = body;

    // ── Token validation ──────────────────────────────────────────────────────
    const validTokens = (env.VALID_TOKENS || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (!validTokens.includes(token)) {
      return jsonError("unauthorized", 401);
    }

    // ── Route ops ─────────────────────────────────────────────────────────────
    switch (op) {
      case "warm":
        // Keepalive ping — just acknowledge
        return jsonOk({ warm: true });

      case "solve":
        return handleSolve({ env, tier, riddle, liveState, user });

      case "search":
        // Web-search verification pass — forward query to Anthropic with search context
        return handleSearch({ env, tier, riddle, liveState });

      default:
        return jsonError("unknown op", 400);
    }
  },
};

// ── Solve handler ──────────────────────────────────────────────────────────────
async function handleSolve({ env, tier, riddle, liveState }) {
  if (!riddle) return jsonError("missing riddle", 400);

  const model = TIER_MODELS[tier] || TIER_MODELS.FASTER;

  const userContent = liveState
    ? `LIVE GAME STATE:\n${liveState}\n\nRIDDLE: ${riddle}`
    : `RIDDLE: ${riddle}`;

  const answer = await callAnthropic({ env, model, userContent });
  if (answer === null) return jsonError("ai call failed", 502);

  return jsonOk({ text: answer.trim() });
}

// ── Search handler (used for verification / double-check) ─────────────────────
async function handleSearch({ env, tier, riddle, liveState }) {
  if (!riddle) return jsonError("missing riddle", 400);

  const model = TIER_MODELS[tier] || TIER_MODELS.FAST;

  const userContent = liveState
    ? `You are verifying an answer for a SAB riddle.\nLIVE GAME STATE:\n${liveState}\n\nRIDDLE: ${riddle}\n\nBased on your knowledge of Steal a Brainrot, what is the correct answer?`
    : `You are verifying an answer for a SAB riddle.\nRIDDLE: ${riddle}\n\nBased on your knowledge of Steal a Brainrot, what is the correct answer?`;

  const answer = await callAnthropic({ env, model, userContent });
  if (answer === null) return jsonError("ai call failed", 502);

  return jsonOk({ text: answer.trim() });
}

// ── Anthropic API call ─────────────────────────────────────────────────────────
async function callAnthropic({ env, model, userContent }) {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY not set");
    return null;
  }

  let resp;
  try {
    resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 64,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }),
    });
  } catch (err) {
    console.error("fetch to Anthropic failed:", err);
    return null;
  }

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    console.error(`Anthropic ${resp.status}: ${txt}`);
    return null;
  }

  let data;
  try {
    data = await resp.json();
  } catch {
    return null;
  }

  return data?.content?.[0]?.text ?? null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function jsonOk(payload) {
  return new Response(JSON.stringify({ ok: true, ...payload }), {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function jsonError(message, status = 400) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}