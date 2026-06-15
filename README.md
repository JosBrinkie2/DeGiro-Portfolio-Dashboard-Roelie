# DeGiro Portfolio Dashboard

A personal investment portfolio management and analysis tool designed for DeGiro trading account holders. Track your holdings, visualize portfolio growth, and monitor performance with real-time price updates.

![Dashboard Overview](degiro-dashboard/screenshots/dashboard.png)

## Features

### Dashboard
- **CSV File Upload** - Import your DeGiro account and transaction CSV exports
- **Multi-Account Support** - Track two separate accounts (Roel64 and RoelPensioen64)
- **Account Summary Cards** - View total deposits/withdrawals, portfolio value, invested capital, and overall returns
- **Holdings Table** - Complete overview of all positions with:
  - Product name, quantity, and average cost (GAK)
  - Live current prices from Yahoo Finance
  - Profit/Loss in EUR and percentage
  - 1-year sparkline charts per holding
  - 5-day trend indicators
  - Volume distribution charts

![Holdings Table](degiro-dashboard/screenshots/holdings.png)

### Portfolio Value History (Waardeontwikkeling)
- Historical portfolio value chart
- Quarterly snapshots tracking value across both accounts
- Multi-line chart showing individual account performance over time

![Portfolio History](degiro-dashboard/screenshots/portfolio.png)

### Bank Accounts (Bankrekeningen)
- Add, edit, and delete bank account records
- Track different account types (lopende, spaar, beleggersrekening)
- Persistent storage using browser local storage

![Bank Accounts](degiro-dashboard/screenshots/bank-accounts.png)

## Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 19, TypeScript 5.9, Vite 7.3 |
| **Styling** | Tailwind CSS 4.2 |
| **State Management** | Zustand |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Data Parsing** | PapaParse (CSV) |
| **Utilities** | date-fns, clsx |

## Installation

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/DeGiro-Portfolio-Dashboard-Roelie.git
cd DeGiro-Portfolio-Dashboard-Roelie/degiro-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint code analysis |

## Usage

### Trying the App with Dummy Data

The `dummy-data/` folder contains sample CSV files so you can explore the dashboard without a real DeGiro account. **This is fictional data** — names, ISINs, prices and amounts are made up for demonstration purposes only.

Only the `_Account.csv` file is needed per account — the dashboard derives everything from it.

| File | Account | Description |
|------|---------|-------------|
| `Roel64_Account.csv` | Roel64 | 12 monthly deposits (€5k each), 26 buy orders across 2024 |
| `RoelPensioen64_Account.csv` | RoelPensioen64 | 4 quarterly deposits (€10–25k), 16 buy orders |

> The bundled `public/data/Roel64_Account.csv` is a fuller real-format export (trades carry
> `Koop X @ Y` detail and Order Ids) so the demo shows live holdings and P&L. The simpler
> `dummy-data/` account files demonstrate the deposit/withdrawal summary.

**Products used in the dummy data** (real ISINs, so live prices will load from Yahoo Finance):

| Product | ISIN | Account |
|---------|------|---------|
| iShares Core MSCI World | IE00B4L5Y983 | Both |
| Vanguard FTSE All-World | IE00B3RBWM25 | Roel64 |
| ASML Holding | NL0010273215 | Roel64 |
| NVIDIA Corp | US67066G1040 | Roel64 |
| Vanguard FTSE Developed World | IE00BKX55T58 | RoelPensioen64 |
| iShares Core Euro Government Bond | IE00B4WXJJ64 | RoelPensioen64 |

### Uploading Data

1. Start the app and navigate to the **Upload** page (via the nav bar)
2. You will see two upload panels — **Roel64** (blue) and **RoelPensioen64** (violet)
3. For each account, upload the single **`_Account.csv`** file (the DeGiro
   *Rekeningoverzicht*). Everything — deposits/withdrawals, cash balance, holdings, GAK
   and P&L — is derived from this one file.
4. Drag-and-drop the file onto the panel, or click to open a file picker
5. The dashboard updates immediately — no page reload needed

To use **real DeGiro data** instead:
1. Log in to DeGiro → Activiteit → Exporteren
2. Export **Rekeningoverzicht** (account overview) → this becomes your `_Account.csv`
3. Upload that export for each account as described above (no separate transactions file needed)

> **Note:** All data is stored locally in your browser's `localStorage`. Nothing is sent to any server.

### CSV Format

The application expects the standard DeGiro Dutch export format (comma-separated, Dutch number notation):

**Account CSV** — the single source for the whole dashboard. Columns used:

| # | Column | Used for |
|---|--------|----------|
| 0 | Datum | Entry / transaction date |
| 3 | Product | Product name |
| 4 | ISIN | Security identifier (ticker resolution + price lookup) |
| 5 | Omschrijving | Entry type and trade detail (`Storting`, `Terugboeking`, `Koop 11 @ 40,15 EUR`, …) |
| 7–8 | Mutatie | Mutation currency + amount |
| 9–10 | Saldo | Balance currency + amount (latest EUR saldo = free cash) |
| 11 | Order Id | Links a trade to its fee and FX legs, so the EUR cost incl. fees can be reconstructed |

Buy/sell transactions are reconstructed from the `Koop`/`Verkoop` description lines:
quantity and price are parsed from the text, and the EUR cost (incl. transaction fees) is the
absolute net EUR movement of the trade's **Order Id** group — which works for both EUR and
foreign-currency trades. See `src/parsers/deriveTransactionsFromAccount.ts`.

## Project Structure

```
degiro-dashboard/
├── src/
│   ├── components/         # React UI components
│   │   ├── bank/          # Bank account management
│   │   ├── holdings/      # Holdings table & charts
│   │   ├── portfolio/     # Portfolio history charts
│   │   ├── summary/       # Account summary cards
│   │   ├── upload/        # File upload components
│   │   └── ui/            # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Page components
│   ├── parsers/           # CSV parsing logic
│   ├── services/          # External API integrations
│   ├── store/             # Zustand state stores
│   ├── types/             # TypeScript definitions
│   └── utils/             # Utility functions
├── public/                # Static assets
└── package.json
```

## How It Works

1. **CSV Upload** - User uploads DeGiro CSV exports
2. **Data Parsing** - PapaParse extracts transaction and account data
3. **Holdings Calculation** - Transactions are aggregated by ISIN to compute current holdings
4. **Live Prices** - Yahoo Finance API fetches current market prices
5. **Visualization** - Recharts displays portfolio data in interactive charts

### Key Calculations

- **Holdings**: Aggregated from buy/sell transactions by ISIN
- **Average Cost (GAK)**: Weighted average purchase price
- **Profit/Loss**: Current value minus cost basis
- **Portfolio Value**: Sum of all holdings at current market prices
- **Trend**: 5-day percentage change indicator

## API Integration

The application uses Yahoo Finance API for real-time price data. A Vite proxy handles CORS:

```
/api/yahoo → https://query1.finance.yahoo.com
```

Features include:
- Automatic ticker symbol resolution from ISIN codes
- EUR exchange rate conversion
- Intelligent caching (5 minutes for prices, 1 hour for history)
- Rate-limited batch fetching

## Browser Support

Modern browsers with:
- ES2020+ support
- localStorage API
- File API for drag-and-drop uploads

## Development

### Adding New Features

1. Create components in `src/components/`
2. Add state management in `src/store/`
3. Define types in `src/types/`
4. Add pages in `src/pages/` and update `App.tsx` routing

### Code Style

- TypeScript strict mode enabled
- ESLint with React hooks rules
- Tailwind CSS for styling

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

Built with React + TypeScript + Vite
