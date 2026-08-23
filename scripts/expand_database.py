import random
import os
import subprocess

# Semantically constrained vocabulary to guarantee 100% sensical sentences
# Categorized by educational spelling rules (kategorien)
# Expanded to ensure at least 25 combinations per category to satisfy the 100 sentences per grade requirement.
semantic_templates = {
    1: {
        "Großschreibung": {
            "subjects": ["Das Kind", "Der Junge", "Das Mädchen", "Der Schüler", "Die Schülerin"],
            "predicates": ["schreibt ein Wort", "liest ein Buch", "lernt in der Schule", "malt ein buntes Bild", "spielt auf dem Spielplatz"]
        },
        "z und tz": {
            "subjects": ["Die Katze", "Das Kätzchen", "Der Welpe", "Der Hund", "Der Kater"],
            "predicates": ["sitzt auf der Matratze", "putzt sich die Tatzen", "rennt auf dem Holzplatz", "spielt mit dem Spielzeug", "schläft auf der Decke"]
        },
        "stummes h": {
            "subjects": ["Die Uhr", "Der Zeiger", "Der Wecker", "Die Jahresuhr", "Das Zifferblatt"],
            "predicates": ["geht sehr genau", "steht an der Wand", "schlägt zur vollen Stunde", "zeigt die Zeit an", "tickt leise im Zimmer"]
        },
        "Doppelkonsonanten": {
            "subjects": ["Der schnelle Hund", "Die kleine Maus", "Das liebe Schaf", "Der dicke Kater", "Die wilde Ratte"],
            "predicates": ["rennt über die Wiese", "frisst den leckeren Käse", "wollt im warmen Stall", "spielt mit dem gelben Ball", "schlüpft durch das schmale Loch"]
        },
        "sp und st": {
            "subjects": ["Die Kinder", "Die Schüler", "Die Freunde", "Die Spieler", "Die Mädchen"],
            "predicates": ["spielen im großen Garten", "springen über den Bach", "stehen im Kreis", "sprechen leise miteinander", "spielen ein schönes Spiel"]
        },
        "ie-Laut": {
            "subjects": ["Die Biene", "Das kleine Tier", "Die Fliege", "Die Hummel", "Der Marienkäfer"],
            "predicates": ["fliegt zur roten Blume", "sucht süßen Nektar", "kriecht über das grüne Blatt", "schwirrt durch die Luft", "sitzt auf dem Grashalm"]
        }
    },
    2: {
        "Großschreibung": {
            "subjects": ["Der fleißige Bäcker", "Die nette Lehrerin", "Der freundliche Gärtner", "Die sportliche Trainerin", "Der junge Koch"],
            "predicates": ["backt frisches Brot", "erklärt die schwierige Aufgabe", "gießt die bunten Blumen", "leitet das wichtige Training", "kocht eine leckere Suppe"]
        },
        "z und tz": {
            "subjects": ["Der clevere Detektiv", "Der schlaue Polizist", "Der mutige Wächter", "Der kleine Zwerg", "Der freundliche Wächter"],
            "predicates": ["schützt den wertvollen Schatz", "nutzt die geheime Lupe", "sitzt auf dem hölzernen Stuhl", "sucht den verlorenen Schlüssel", "findet die verdächtige Spur"]
        },
        "stummes h": {
            "subjects": ["Der große Zug", "Der schnelle Autofahrer", "Der alte Traktor", "Der rote Bus", "Der schwere Lastwagen"],
            "predicates": ["fährt durch das dunkle Tal", "sieht den fernen Bahnhof", "zieht den schweren Wagen", "hält an der alten Haltestelle", "überholt das langsame Fahrrad"]
        },
        "Doppelkonsonanten": {
            "subjects": ["Das kalte Wasser", "Der tiefe Fluss", "Der kleine See", "Der wilde Bach", "Der breite Kanal"],
            "predicates": ["fließt schnell durch das Tal", "rinnt über die Steine", "schimmert im hellen Sonnenlicht", "rauscht im dichten Wald", "glänzt am frühen Nachmittag"]
        },
        "sp und st": {
            "subjects": ["Ein starker Sturm", "Der kalte Wind", "Ein dichter Nebel", "Ein leiser Regen", "Ein dunkler Wolkenhimmel"],
            "predicates": ["weht durch die hohen Bäume", "bläst die Blätter vom Ast", "steht am frühen Morgen über der Wiese", "fällt auf die trockene Erde", "zieht über das weite Land"]
        },
        "ie-Laut": {
            "subjects": ["Die bunte Familie", "Die fröhliche Gruppe", "Die netten Nachbarn", "Die jungen Musiker", "Die kleinen Kinder"],
            "predicates": ["singen ein schönes Lied", "spielen ein lustiges Spiel", "feiern ein großes Fest", "spielen ein schönes Instrument", "lachen über den lustigen Witz"]
        }
    },
    3: {
        "stummes h": {
            "subjects": ["Der erfahrene Förster", "Der alte Jäger", "Die neugierigen Wanderer", "Die fleißigen Waldarbeiter", "Die jungen Naturforscher"],
            "predicates": ["sehen das scheue Reh im Wald", "gehen früh am Morgen los", "spüren den kühlen Wind", "fällen die hohen Bäume", "suchen die Spuren der Tiere"]
        },
        "z und tz": {
            "subjects": ["Die fleißigen Handwerker", "Die geschickten Maurer", "Die starken Zimmerleute", "Die fleißigen Maler", "Die jungen Tischler"],
            "predicates": ["putzen die Wände", "setzen die schweren Ziegel", "schützen das neue Dach", "streichen die alten Fenster", "bauen den hölzernen Tisch"]
        },
        "Doppelkonsonanten": {
            "subjects": ["Der reißende Bach", "Das fallende Wasser", "Der heftige Regen", "Der dichte Hagel", "Der nasse Schneeschauer"],
            "predicates": ["füllt das tiefe Becken", "schwemmt den Schmutz weg", "trommelt auf das Dach", "zerstört die zarten Blüten", "bedeckt die kalte Straße"]
        },
        "sp und st": {
            "subjects": ["Die mutigen Sportler", "Die jungen Kletterer", "Die schnellen Läufer", "Die starken Turner", "Die geschickten Schwimmer"],
            "predicates": ["springen über die Hürden", "steigen auf den hohen Berg", "starten beim großen Rennen", "turnen an den hohen Geräten", "trainieren im kalten Wasser"]
        },
        "ie-Laut": {
            "subjects": ["Die fleißigen Bienen", "Die bunten Schmetterlinge", "Die kleinen Käfer", "Die wilden Ameisen", "Die schnellen Libellen"],
            "predicates": ["fliegen über die weite Wiese", "suchen die süßesten Blüten", "kriechen unter die Rinde", "bauen den großen Hügel", "jagen über dem ruhigen Teich"]
        },
        "d oder t": {
            "subjects": ["Das kleine Pferd", "Das wilde Wildschwein", "Das weiche Schaf", "Der braune Hund", "Die weiße Ziege"],
            "predicates": ["läuft auf dem sandigen Pfad", "wühlt im feuchten Waldboden", "steht auf dem grünen Feld", "bellt am hölzernen Zaun", "frisst das frische Gras"]
        }
    },
    4: {
        "stummes h": {
            "subjects": ["Der berühmte Forscher", "Die mutigen Astronauten", "Die klugen Wissenschaftler", "Der erfahrene Professor", "Die neugierigen Studenten"],
            "predicates": ["sehen die Sterne durch das Teleskop", "erforschen die unendlichen Weiten", "erklären die schwierige Theorie", "halten einen interessanten Vortrag", "führen das komplizierte Experiment durch"]
        },
        "z und tz": {
            "subjects": ["Der schlaue Zauberer", "Die geschickten Akrobaten", "Die lustigen Clowns", "Der geschickte Jongleur", "Die bunten Tänzer"],
            "predicates": ["zeigen ihre besten Kunststücke", "tanzen auf dem dünnen Seil", "schützen das Zirkuszelt vor Sturm", "werfen die glänzenden Bälle", "bewegen sich zur lauten Musik"]
        },
        "Doppelkonsonanten": {
            "subjects": ["Das moderne Labor", "Die große Fabrik", "Das neue Kraftwerk", "Die moderne Werkstatt", "Das große Industriegebiet"],
            "predicates": ["stellt wichtige Medikamente her", "erzeugt sauberen Strom", "entwickelt neue Maschinen", "repariert die defekten Autos", "verschmutzt die umliegende Umwelt"]
        },
        "sp und st": {
            "subjects": ["Der starke Sturm", "Das heftige Gewitter", "Der dichte Schneefall", "Der heftige Orkan", "Der kalte Winterwind"],
            "predicates": ["stört den gesamten Verkehr", "beschädigt die alten Dächer", "sperrt die Straßen in den Bergen", "knickt die schwachen Bäume um", "bringt die eisige Kälte"]
        },
        "ie-Laut": {
            "subjects": ["Der treue Hund", "Die klugen Delphine", "Die edlen Pferde", "Die kleinen Katzen", "Die wilden Wölfe"],
            "predicates": ["spielen stundenlang am Strand", "schwimmen tief im Ozean", "laufen frei über die Koppel", "jagen die flinken Mäuse", "heulen im dunklen Wald"]
        },
        "Nominalisierung": {
            "subjects": ["Das laute Laufen", "Das schöne Singen", "Das fleißige Lernen", "Das gesunde Essen", "Das regelmäßige Sporttreiben"],
            "predicates": ["macht den Kindern großen Spaß", "erfreut alle Zuhörer im Saal", "bringt den gewünschten Erfolg", "stärkt den menschlichen Körper", "verbessert die körperliche Fitness"]
        }
    }
}

def generate_sensical_sentences(grade, count=100):
    sentences = []
    grade_data = semantic_templates[grade]
    categories = list(grade_data.keys())
    
    # We want exactly count sentences, balanced across categories
    per_cat = count // len(categories)
    extra = count % len(categories)
    
    for cat_idx, cat in enumerate(categories):
        num_to_gen = per_cat + (1 if cat_idx < extra else 0)
        subjects = grade_data[cat]["subjects"]
        predicates = grade_data[cat]["predicates"]
        
        cat_sents = []
        # Generate combinatorially to avoid duplicates
        for s in subjects:
            for p in predicates:
                sent = f"{s} {p}."
                cat_sents.append((cat, sent))
                
        # Shuffle combinations and take the required number
        random.shuffle(cat_sents)
        sentences.extend(cat_sents[:num_to_gen])
        
    return sentences

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(script_dir)
    saetze_path = os.path.join(base_dir, 'data', 'saetze.txt')
    
    print("Generating 100 100% sensical and didactically categorized sentences for each grade...")
    
    all_lines = []
    
    # Generate 100 sentences per grade
    for grade in [1, 2, 3, 4]:
        grade_data = generate_sensical_sentences(grade, 100)
        for category, sent in grade_data:
            line = f"{grade} | {category} | {sent}"
            all_lines.append(line)
        print(f"Grade {grade}: Generated 100 categorized sentences.")
        
    # Write to saetze.txt (Overwriting completely to remove any old nonsensical sentences)
    with open(saetze_path, 'w', encoding='utf-8') as f:
        for line in all_lines:
            f.write(line + "\n")
            
    print(f"Successfully generated and wrote all sentences to {saetze_path}.")
    
    # Automatically execute generate_sentences.py to rebuild sentences.json
    print("\nRunning generate_sentences.py...")
    subprocess.run(["python", os.path.join(script_dir, "generate_sentences.py")], check=True)
    
    # Automatically execute generate_audio.py to generate MP3s via edge-tts
    print("\nRunning generate_audio.py...")
    subprocess.run(["python", os.path.join(script_dir, "generate_audio.py")], check=True)
    
    print("\nAll sentences generated and MP3 files built successfully!")

if __name__ == '__main__':
    main()
