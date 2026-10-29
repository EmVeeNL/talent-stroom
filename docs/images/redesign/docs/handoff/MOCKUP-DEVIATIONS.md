# Afwijkingen en interpretaties van historische mockups

- Oude afbeeldingen bevatten af en toe onjuiste, niet-bestaande of inconsistente data/labels; alle tekst is illustratief.
- Sommige historische pagina's gebruiken andere merknamen (TalentMate / TalentStroom). Alleen **TalentStroom** is definitief.
- Asap Sharp was niet gegarandeerd werkelijk gerenderd in oudere AI-mockups. In productie uitsluitend de geïnstalleerde font gebruiken.
- Sommige mockups bevatten generiek getekende iconen. In productie Material Symbols **Rounded**, met expliciete ligature naam en maat.
- Eerdere schermen kennen inconsistente border radius, schaduw, spacing en kleuren; **tokens winnen altijd**.
- Oude schermen zijn niet allemaal beschikbaar in zowel light als dark. Componenten zijn beide; volledige schermen dienen later in React te worden gevalideerd.
- De 2× rasterexports zijn **upscaled** mockups en dus niet gelijk aan native Retina-renders.
- De gekozen logo #10 PNG wordmarks bevatten mogelijk een benaderde font; niet als typografische bron gebruiken.
- Nieuwe componentplaten zijn nauwkeuriger in layout dan de oudere AI-schermmockups, maar gebruiken gerenderde fallbacklettervormen omdat het Asap Sharp-binaire font niet in dit pakket zit.
