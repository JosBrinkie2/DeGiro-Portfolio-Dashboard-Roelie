import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';

interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Hoe wordt de gemiddelde kostprijs (GAK) berekend?',
    answer: (
      <div className="space-y-2">
        <p>
          De dashboard gebruikt de <strong>gewogen gemiddelde kostprijs</strong> (ook wel GAK of
          FIFO-alternatief) om de aankoopprijs van een positie bij te houden.
        </p>
        <p>Bij elke <strong>aankoop</strong>:</p>
        <pre className="bg-slate-100 rounded p-3 text-xs overflow-x-auto">
{`totale kosten  += aantal × prijs (incl. transactiekosten)
totaal aantal  += aantal
gemiddelde kostprijs = totale kosten / totaal aantal`}
        </pre>
        <p>Bij elke <strong>verkoop</strong>:</p>
        <pre className="bg-slate-100 rounded p-3 text-xs overflow-x-auto">
{`totaal aantal  -= verkocht aantal
totale kosten  -= verkocht aantal × gemiddelde kostprijs`}
        </pre>
        <p className="text-sm text-slate-500">
          De kolom <em>TotaalEUR</em> in het DeGiro-transactiebestand is leidend — dit is het
          bedrag inclusief transactiekosten dat DeGiro verrekent.
        </p>
      </div>
    ),
  },
  {
    question: 'Hoe wordt winst/verlies (P&L) per positie berekend?',
    answer: (
      <div className="space-y-2">
        <p>Per positie:</p>
        <pre className="bg-slate-100 rounded p-3 text-xs overflow-x-auto">
{`huidige waarde   = actuele koers (EUR) × aantal aandelen
winst/verlies    = huidige waarde − totale kostprijs
winst/verlies %  = winst/verlies / totale kostprijs × 100`}
        </pre>
        <p>
          De actuele koers wordt live opgehaald via Yahoo Finance en omgezet naar EUR (zie
          hieronder).
        </p>
      </div>
    ),
  },
  {
    question: 'Hoe wordt het totale resultaat in de samenvattingskaart berekend?',
    answer: (
      <div className="space-y-2">
        <p>De samenvattingskaart bovenaan het dashboard toont:</p>
        <pre className="bg-slate-100 rounded p-3 text-xs overflow-x-auto">
{`netto inleg      = totaal gestort − totaal terugboekingen
portfoliowaarde  = som(actuele koers × aantal) voor alle posities
                   + vrije ruimte (indien aangevinkt)
totaal resultaat = portfoliowaarde − netto inleg
resultaat %      = totaal resultaat / netto inleg × 100`}
        </pre>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>
            <strong>Gestort</strong>: alle EUR-stortingen op de DeGiro-rekening (positieve
            mutatieregels in het rekeningbestand).
          </li>
          <li>
            <strong>Terugboekingen</strong>: alle opnames van de rekening (negatieve mutatieregels).
          </li>
          <li>
            <strong>Vrije ruimte</strong>: het actuele cashsaldo zoals vermeld in het
            rekeningbestand.
          </li>
        </ul>
      </div>
    ),
  },
  {
    question: 'Hoe worden actuele koersen opgehaald?',
    answer: (
      <div className="space-y-2">
        <p>
          Koersen worden live opgehaald van <strong>Yahoo Finance</strong> via een keten van
          CORS-proxy's (de browser mag Yahoo Finance niet direct aanroepen vanwege
          beveiligingsrestricties).
        </p>
        <p>Proxyservers worden in volgorde geprobeerd:</p>
        <ol className="list-decimal pl-5 text-sm space-y-0.5">
          <li>allorigins.win</li>
          <li>corsproxy.io</li>
          <li>thingproxy.freeboard.io</li>
          <li>codetabs.com</li>
        </ol>
        <p className="text-sm">
          Ticker-symbolen worden automatisch opgezocht op basis van het ISIN-nummer uit het
          DeGiro-transactiebestand. Gevonden symbolen worden <strong>1 uur gecached</strong> in de
          browser; actuele koersen worden <strong>5 minuten gecached</strong>.
        </p>
      </div>
    ),
  },
  {
    question: 'Hoe worden buitenlandse koersen omgezet naar EUR?',
    answer: (
      <div className="space-y-2">
        <p>
          Voor aandelen die niet in EUR noteren, wordt de wisselkoers van Yahoo Finance
          (bijv. <code>EURUSD=X</code>) gebruikt:
        </p>
        <pre className="bg-slate-100 rounded p-3 text-xs overflow-x-auto">
{`wisselkoers   = aantal vreemde valuta per 1 EUR
koers in EUR  = native koers / wisselkoers`}
        </pre>
        <p>Ondersteunde valuta's:</p>
        <ul className="list-disc pl-5 text-sm space-y-0.5">
          <li>USD (Amerikaanse dollar)</li>
          <li>GBP (Brits pond) — Londense koersen in pence worden automatisch ÷ 100 gedaan</li>
          <li>SEK (Zweedse kroon)</li>
          <li>NOK (Noorse kroon)</li>
          <li>CHF (Zwitserse frank)</li>
          <li>DKK (Deense kroon)</li>
        </ul>
        <p className="text-sm text-slate-500">
          Als Yahoo Finance geen wisselkoers levert, wordt teruggevallen op de ECB-data van
          Frankfurter.app.
        </p>
      </div>
    ),
  },
  {
    question: 'Wat is de 5-daagse trend?',
    answer: (
      <div className="space-y-2">
        <p>
          De trendpijl naast elk aandeel toont de koersontwikkeling over de <strong>laatste 5
          handelsdagen</strong>:
        </p>
        <pre className="bg-slate-100 rounded p-3 text-xs overflow-x-auto">
{`trend % = (slotkoers dag 5 − slotkoers dag 1) / slotkoers dag 1 × 100`}
        </pre>
        <p className="text-sm text-slate-500">
          Dit geeft een indicatie van de recente prijsbeweging, maar zegt niets over het
          persoonlijke rendement.
        </p>
      </div>
    ),
  },
  {
    question: 'Hoe werkt de Waardeontwikkeling (kwartaalgeschiedenis)?',
    answer: (
      <div className="space-y-2">
        <p>
          De pagina <em>Waardeontwikkeling</em> toont de totale portefeuillewaarde per kwartaal.
          Voor elk kwartaaleinde wordt berekend:
        </p>
        <pre className="bg-slate-100 rounded p-3 text-xs overflow-x-auto">
{`voor elk aandeel in de portefeuille op die datum:
  koers = dichtstbijzijnde historische slotkoers (uit 1-jaarshistorie)
  waarde = koers × aantal

totale waarde = som(alle posities) + cashsaldo op die datum`}
        </pre>
        <p className="text-sm text-slate-500">
          Historische prijzen worden opgehaald als wekelijkse data over 1 jaar. Voor periodes
          ouder dan 1 jaar is geen historische koers beschikbaar en wordt het datapunt
          weggelaten.
        </p>
      </div>
    ),
  },
  {
    question: 'Worden mijn gegevens ergens opgeslagen of verstuurd?',
    answer: (
      <p>
        Nee. Alle gegevens — transacties, rekeninghistorie en gecachte koersen — worden
        uitsluitend opgeslagen in de <strong>lokale opslag van je browser</strong>{' '}
        (localStorage). Er worden geen gegevens verstuurd naar een server. De enige externe
        verbindingen die de app maakt zijn het ophalen van actuele koersen bij Yahoo Finance
        (via een publieke CORS-proxy).
      </p>
    ),
  },
  {
    question: 'Wat zijn aandelensplitsingen en hoe worden ze verwerkt?',
    answer: (
      <p>
        Bij een aandelensplitsing verandert het aantal aandelen zonder dat er een geldbedrag
        mee gemoeid is (de <em>TotaalEUR</em> in het transactiebestand is dan 0). De dashboard
        detecteert dit automatisch: het aantal aandelen wordt aangepast, maar de totale
        kostprijs blijft ongewijzigd. De gemiddelde kostprijs per aandeel daalt daardoor
        proportioneel.
      </p>
    ),
  },
  {
    question: 'Welke CSV-bestanden moet ik uploaden?',
    answer: (
      <div className="space-y-2">
        <p>Per rekening heb je twee bestanden nodig, te exporteren via DeGiro:</p>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>
            <strong>Rekeningenoverzicht</strong> — bevat stortingen, opnames en het cashsaldo.
            Te vinden via: <em>Activiteit → Rekeningoverzicht → Exporteer</em>.
          </li>
          <li>
            <strong>Transacties</strong> — bevat alle aan- en verkooptransacties. Te vinden via:{' '}
            <em>Activiteit → Transacties → Exporteer</em>.
          </li>
        </ul>
        <p className="text-sm text-slate-500">
          Kies bij het exporteren altijd de volledige periode (begin tot vandaag) zodat de
          gewogen gemiddelde kostprijs correct wordt berekend.
        </p>
      </div>
    ),
  },
];

function FaqEntry({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-slate-800 hover:bg-slate-50 transition"
      >
        <span>{item.question}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 flex-shrink-0 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-slate-400" />
        )}
      </button>
      <div
        className={clsx(
          'px-5 text-sm text-slate-600 leading-relaxed transition-all duration-200',
          open ? 'py-4 border-t border-slate-100' : 'max-h-0 overflow-hidden py-0'
        )}
      >
        {open && item.answer}
      </div>
    </div>
  );
}

export function FaqPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Veelgestelde vragen</h2>
        <p className="text-sm text-slate-500 mt-1">
          Uitleg over hoe berekeningen in het dashboard werken.
        </p>
      </div>

      <div className="space-y-2">
        {FAQ_ITEMS.map((item) => (
          <FaqEntry key={item.question} item={item} />
        ))}
      </div>
    </div>
  );
}
