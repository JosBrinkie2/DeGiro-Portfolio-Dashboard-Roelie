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

### Uploading Data

1. Export your account overview CSV from DeGiro (`account.csv`)
2. Export your transactions CSV from DeGiro (`transactions.csv`)
3. Upload both files for each account using the upload zones on the dashboard

### CSV Format

The application expects the standard DeGiro export format:

**account.csv** - Contains:
- Deposits and withdrawals
- Balance history
- Account transactions

**transactions.csv** - Contains:
- Buy/sell transactions
- Quantities and prices
- Transaction fees
- ISIN codes

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
