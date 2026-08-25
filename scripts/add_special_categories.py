# -*- coding: utf-8 -*-
import os
import subprocess

new_categories = {
    "Umlautableitung": [
        "Die Katze hat vier weiche Pfoten und scharfe Krallen.",
        "Im Herbst fallen viele bunte Blätter von den Bäumen.",
        "Wir pflücken süße Äpfel im großen Garten.",
        "Zwei kleine Mäuse knabbern heimlich am Käse.",
        "Die Kinder waschen ihre schmutzigen Hände mit Seife.",
        "Im Winter tragen wir warme Mäntel und Mützen.",
        "Die Vögel bauen ihre Nester in den Ästen.",
        "Mama backt heute leckere Plätzchen für uns alle.",
        "Die Ärzte helfen den kranken Menschen im Krankenhaus.",
        "Wir malen schöne Bilder mit bunten Farben.",
        "Der Bäcker backt jeden Morgen frische Brötchen.",
        "Der Junge zählt die Sterne am dunklen Himmel.",
        "Die Kühe grasen friedlich auf den grünen Wiesen.",
        "Die Ziegen springen über die hohen Zäune.",
        "Wir machen eine lange Wanderung durch die Täler.",
        "Die Mädchen spielen fröhlich auf dem Spielplatz.",
        "Das Baby schläft tief in seiner Wiege.",
        "Wir hören die lauten Töne der Musik.",
        "Der Gärtner gießt die jungen Pflanzen im Gewächshaus.",
        "Die Schüler schreiben fleißig in ihre Hefte.",
        "Der Fluss fließt durch tiefe Täler zum Meer.",
        "Wir hängen die nassen Handtücher an die Leine.",
        "Der Hund bewacht das große Haus am Waldrand.",
        "Im Frühling blühen die ersten zarten Blumen.",
        "Wir sammeln reife Nüsse unter den alten Bäumen.",
        "Die Kinder rennen fröhlich durch die engen Gassen.",
        "Der Wind bläst die Blätter weit über das Feld.",
        "Wir trinken kalten Saft an einem heißen Tag.",
        "Der Koch bereitet ein köstliches Essen für uns vor.",
        "Die Lehrerin zeigt uns eine Weltkarte an der Wand.",
        "Der Bauer erntet das Korn auf dem Feld.",
        "Die Familie macht ein schönes Picknick am See.",
        "Wir werfen den Ball hoch in die Luft.",
        "Die Züge fahren schnell auf den eisernen Schienen.",
        "Das Kätzchen spielt gern mit einem roten Wollknäuel.",
        "Wir bauen ein stabiles Baumhaus im Garten.",
        "Die Sonne geht langsam hinter den Bergen unter.",
        "Der Fischer fängt viele Fische mit seinem Netz.",
        "Die Bienen fliegen fleißig von Blüte zu Blüte.",
        "Wir backen einen süßen Kuchen mit Äpfeln."
    ],
    "s-Laut (ss/ß)": [
        "Der breite Fluss fließt schnell durch das grüne Tal.",
        "Ein großer Hund läuft aufmerksam an der Straße.",
        "Die heiße Sonne scheint heute sehr kräftig.",
        "Wir essen leckeres Eis auf der sonnigen Wiese.",
        "Der weiße Schnee schmilzt in der warmen Sonne.",
        "Ich trinke ein kaltes Glas Wasser am Mittag.",
        "Er vergisst manchmal seine Hausaufgaben in der Schule.",
        "Die Kinder spielen draußen im weichen Gras.",
        "Der Schlüssel passt genau in das alte Schloss.",
        "Wir müssen heute fleißig für die Schule lernen.",
        "Das kleine Floß treibt langsam auf dem See.",
        "Sie grüßt ihre Oma freundlich am Telefon.",
        "Der Hund beißt vorsichtig in den großen Knochen.",
        "Wir schließen abends die Fenster im Haus.",
        "Die Straße führt direkt zum neuen Spielplatz.",
        "Es gibt ein spannendes Fußballspiel im Fernsehen.",
        "Er misst die Länge des Tisches mit dem Lineal.",
        "Die Katzen fressen hungrig ihr Futter auf.",
        "Ein süßer Duft steigt aus der Küche auf.",
        "Wir genießen den Ausflug in den großen Freizeitpark.",
        "Sie liest ein spannendes Buch im bequemen Sessel.",
        "Der Wind bläst das trockene Laub über den Weg.",
        "Er lässt den bunten Drachen in den Himmel steigen.",
        "Die Schüler wissen viele richtige Antworten im Unterricht.",
        "Das Schloss hat ein schweres Tor aus Eisen.",
        "Der Bach fließt leise murmelnd durch den Wald.",
        "Wir lassen uns die leckere Pizza gut schmecken.",
        "Er stößt den Ball mit dem Fuß ins Tor.",
        "Die Wiese ist nass vom kalten Tau am Morgen.",
        "Der Gärtner gießt das Gemüse mit der Gießkanne.",
        "Wir essen heute Abend Brot mit frischem Käse.",
        "Er weiß den Weg zum Bahnhof ganz genau.",
        "Das weiche Kissen liegt auf dem großen Bett.",
        "Die Kinder gießen die Pflanzen im Schulgarten.",
        "Sie misst das Mehl für den Kuchen genau ab.",
        "Der Hund schläft friedlich auf seiner Decke.",
        "Wir laufen barfuß über den warmen Sand am Strand.",
        "Er schließt die Tür leise hinter sich.",
        "Das Wasser im Pool ist heute angenehm warm.",
        "Sie isst einen roten Apfel in der Pause."
    ],
    "Vogel-v": [
        "Der bunte Vogel fliegt hoch über die Bäume.",
        "Mein lieber Vater arbeitet fleißig im Büro.",
        "Wir haben heute viel Spaß auf dem Spielplatz.",
        "Der Becher ist voll mit leckeren Beeren.",
        "Der schnelle Zug fährt um vier Uhr ab.",
        "Wir müssen die Aufgaben vorsichtig durchlesen.",
        "Vor dem Haus steht ein großer, alter Baum.",
        "Der Detektiv sucht nach einem wichtigen Beweis.",
        "Wir besuchen unsere Großeltern am Wochenende.",
        "Der Junge hat viele bunte Murmeln gesammelt.",
        "Er verliert seinen roten Stift in der Schule.",
        "Wir verstehen die schwierige Rechenaufgabe gut.",
        "Das Zimmer ist voll mit schönen Spielsachen.",
        "Der Vater schenkt seinem Sohn ein neues Fahrrad.",
        "Die Vögel singen fröhliche Lieder am Morgen.",
        "Wir laufen vor dem großen Regen schnell nach Hause.",
        "Sie liest ein spannendes Buch voller Abenteuer.",
        "Der Hund läuft vorsichtig über die nasse Straße.",
        "Wir füttern die Hühner auf dem Bauernhof.",
        "Er vergisst seine Mütze auf dem Spielplatz.",
        "Der Vulkan spuckt heiße Lava und Rauch aus.",
        "Wir betrachten das schöne Gemälde im Museum.",
        "Vor vielen Jahren gab es hier einen dichten Wald.",
        "Der Junge rennt voll Freude seiner Mutter entgegen.",
        "Wir teilen den Kuchen in vier gleiche Teile.",
        "Die Schüler schreiben ein wichtiges Diktat auf.",
        "Sie versteckt das Geschenk hinter der Tür.",
        "Der Wind bläst die Vorhänge am Fenster auf.",
        "Wir verbringen einen schönen Tag im Freibad.",
        "Er trägt einen schweren Rucksack voll Proviant.",
        "Der Vogel baut sein Nest aus kleinen Zweigen.",
        "Der Lehrer erklärt uns die Grammatik sehr verständlich.",
        "Wir freuen uns über den Besuch der Tante.",
        "Der Hund läuft flink hinter dem Ball her.",
        "Sie liest ein Buch vor dem Einschlafen.",
        "Wir müssen vor dem Essen die Hände waschen.",
        "Der Korb ist voll mit reifen Äpfeln.",
        "Der kleine Junge läuft voll Stolz zum Ziel.",
        "Wir hören die schöne Musik im Radio.",
        "Mein Vater repariert die kaputte Lampe."
    ],
    "sp / st": [
        "Die Kinder spielen fröhlich im Garten.",
        "Ein schwerer Stein liegt mitten auf dem Weg.",
        "Der Wecker klingelt heute viel zu spät.",
        "Die Pferde stehen im warmen, sauberen Stall.",
        "Wir sprechen leise, damit das Baby schläft.",
        "Der Schüler spitzt seinen Bleistift mit dem Spitzer.",
        "Am Himmel funkeln viele helle Sterne.",
        "Wir springen über die Pfützen auf der Straße.",
        "Der Tisch steht direkt am großen Fenster.",
        "Wir spazieren gemütlich durch den dichten Wald.",
        "Der Junge stolpert über ein trockenes Stück Holz.",
        "Die Suppe schmeckt heute besonders gut.",
        "Wir sparen Geld für ein neues Spielzeug.",
        "Der starke Wind bläst die Blätter vom Ast.",
        "Das Kätzchen spielt mit einem langen Strick.",
        "Die Schüler schreiben die Wörter an die Tafel.",
        "Wir stellen die Blumen in die bunte Vase.",
        "Der Hund springt mutig über das Hindernis.",
        "Sie spricht sehr gut Englisch und Deutsch.",
        "Der Weg führt steil nach oben auf den Berg.",
        "Wir spannen das Seil fest zwischen zwei Bäumen.",
        "Der Wecker steht auf dem kleinen Nachttisch.",
        "Sie spielen ein lustiges Spiel am Nachmittag.",
        "Der Koch rührt die Suppe mit dem Löffel.",
        "Wir staunen über den schönen, bunten Regenbogen.",
        "Das Kind spitzt die Ohren und hört zu.",
        "Die Freunde stehen eng im Kreis zusammen.",
        "Er spritzt das kühle Wasser aus dem Schlauch.",
        "Die Sonne strahlt warm vom blauen Himmel.",
        "Wir spülen die Teller nach dem Mittagessen.",
        "Der Wanderer rastet an einem alten Baumstamm.",
        "Der Junge spielt Fußball auf dem Sportplatz.",
        "Wir steigen die Treppe hinauf ins Zimmer.",
        "Der Hund bellt, als er den Fremden sieht.",
        "Sie spricht leise mit ihrer besten Freundin.",
        "Wir stellen den Stuhl an den großen Tisch.",
        "Der starke Mann trägt die schwere Kiste.",
        "Das Kind springt vor Freude in die Luft.",
        "Die Vögel fliegen am frühen Morgen los.",
        "Wir spielen ein spannendes Spiel am Abend."
    ],
    "Endung -ig/-lich": [
        "Der kleine Clown ist heute besonders lustig.",
        "Wir machen eine fröhliche Fahrt ins Grüne.",
        "Sei bitte ehrlich und sag die Wahrheit.",
        "Der frische Wind weht kräftig durch die Blätter.",
        "Das Essen schmeckt wirklich sehr lecker.",
        "Sie löst die schwierige Aufgabe ganz allein.",
        "Wir verbringen einen gemütlichen Abend im Zimmer.",
        "Der Hund läuft traurig zu seinem Körbchen.",
        "Die Katze schleicht heimlich in die Küche.",
        "Das Wetter ist heute sonnig und warm.",
        "Er gibt uns einen nützlichen Tipp für das Spiel.",
        "Sie schreibt einen herzlichen Brief an ihre Oma.",
        "Wir machen einen täglichen Spaziergang im Park.",
        "Der kleine Welpe ist unglaublich süß.",
        "Der Lehrer lobt den fleißigen Schüler.",
        "Die Wolken ziehen langsam über den Himmel.",
        "Das Kind malt ein wunderschönes Bild.",
        "Wir have eine herrliche Aussicht vom Turm.",
        "Die Suppe ist heute ein bisschen salzig.",
        "Er erklärt uns die Regeln sehr geduldig.",
        "Sie freut sich über das schöne Geschenk.",
        "Wir gehen wöchentlich zum Schwimmtraining.",
        "Der Hund läuft unruhig hin und her.",
        "Das Buch ist sehr spannend und lehrreich.",
        "Sie singt ein fröhliches Lied unter der Dusche.",
        "Wir machen ein köstliches Picknick auf der Wiese.",
        "Er arbeitet sehr ordentlich in seinem Heft.",
        "Das Kind läuft vorsichtig über die Brücke.",
        "Wir genießen das herrliche Wetter im Garten.",
        "Der Wald sieht heute geheimnisvoll aus.",
        "Er antwortet höflich auf die Frage.",
        "Das weiche Kissen ist sehr gemütlich.",
        "Sie löst das Rätsel erstaunlich schnell.",
        "Der Hund bewacht wachsam den Eingang.",
        "Wir machen eine sportliche Radtour am Fluss.",
        "Der Gärtner schneidet die Äste vorsichtig ab.",
        "Die Kinder lachen über den lustigen Film.",
        "Er gibt sich heute besonders viel Mühe.",
        "Wir verbringen einen herrlichen Tag am Strand.",
        "Das kleine Kätzchen ist sehr neugierig."
    ],
    "Großschreibung Nomen": [
        "Das Kind spielt fröhlich mit dem Hund.",
        "Der Schüler schreibt ein langes Wort.",
        "Wir lesen ein spannendes Buch im Bett.",
        "Das große Haus steht direkt am Waldrand.",
        "Der Bäcker backt jeden Morgen frisches Brot.",
        "Die Lehrerin erklärt die schwierige Aufgabe an der Tafel.",
        "Der Gärtner pflanzt bunte Blumen im Garten.",
        "Wir hören die laute Musik aus dem Radio.",
        "Der Vogel baut sein Nest aus kleinen Ästen.",
        "Die Familie macht eine Wanderung durch die Berge.",
        "Der Koch bereitet eine leckere Suppe in der Küche zu.",
        "Das Kätzchen spielt gern mit einem roten Ball.",
        "Wir sehen viele helle Sterne am dunklen Himmel.",
        "Der Hund bewacht das große Tor am Eingang.",
        "Die Kinder rennen fröhlich über den großen Spielplatz.",
        "Der Wind bläst die Blätter weit über das Feld.",
        "Wir trinken kalten Saft an einem heißen Sommertag.",
        "Die Schule beginnt jeden Morgen um acht Uhr.",
        "Der Fischer fängt viele Fische mit seinem großen Netz.",
        "Die Bienen fliegen fleißig von Blüte zu Blüte.",
        "Wir bauen ein stabiles Baumhaus auf dem Baum.",
        "Der Zug fährt pünktlich am großen Bahnhof ab.",
        "Die Sonne geht langsam hinter den Bergen unter.",
        "Wir sammeln reife Nüsse unter dem alten Baum.",
        "Das Baby schläft friedlich in seinem warmen Bett.",
        "Der Bauer füttert die Kühe im warmen Stall.",
        "Wir hängen die nasse Wäsche an die lange Leine.",
        "Der Junge zeichnet ein schönes Bild auf das Papier.",
        "Die Schwalben fliegen schnell durch die blaue Luft.",
        "Wir machen ein gemütliches Picknick auf der grünen Wiese.",
        "Der Arzt hilft dem kranken Kind im Krankenhaus.",
        "Die Wolken ziehen langsam über das weite Land.",
        "Wir trinken warmen Tee in der gemütlichen Stube.",
        "Der Hund läuft aufgeregt hinter der kleinen Katze her.",
        "Die Freunde spielen ein spannendes Spiel am Tisch.",
        "Wir putzen gründlich unsere Zähne mit der Bürste.",
        "Der Wecker klingelt laut am frühen Morgen.",
        "Das Schiff fährt über das tiefe, weite Meer.",
        "Wir freuen uns über den Besuch der netten Tante.",
        "Der Koch schneidet das frische Gemüse mit dem Messer."
    ]
}

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(script_dir)
    saetze_path = os.path.join(base_dir, 'data', 'saetze.txt')

    print(f"Reading existing saetze.txt from {saetze_path}...")
    existing_lines = []
    if os.path.exists(saetze_path):
        with open(saetze_path, 'r', encoding='utf-8') as f:
            existing_lines = f.readlines()

    # Append new categories structured lines
    lines_to_append = []
    lines_to_append.append("\n# ==========================================\n")
    lines_to_append.append("# NEUE SCHWERPUNKTE (Umlautableitung, s-Laut, Vogel-v, sp/st, Endungen, Großschreibung)\n")
    lines_to_append.append("# ==========================================\n")

    for category, sentences in new_categories.items():
        lines_to_append.append(f"\n# Thema: {category} (40 Sätze)\n")
        # Grade 2 for 2-grade topics, grade 3 for 3-grade topics
        grade = 3 if category in ["Endung -ig/-lich", "Großschreibung Nomen"] else 2
        for sent in sentences:
            lines_to_append.append(f"{grade} | {category} | {sent}\n")

    print("Appending new sentences to saetze.txt...")
    with open(saetze_path, 'a', encoding='utf-8') as f:
        f.writelines(lines_to_append)

    print("Successfully appended 240 new sentences to saetze.txt!")

    # Running generate_sentences.py
    print("\nRunning generate_sentences.py...")
    subprocess.run(["python", os.path.join(script_dir, "generate_sentences.py")], check=True)

    # Running generate_audio.py
    print("\nRunning generate_audio.py...")
    subprocess.run(["python", os.path.join(script_dir, "generate_audio.py")], check=True)

    print("\nSuccessfully updated sentences.json and generated all new audio assets!")

if __name__ == '__main__':
    main()
