import { create } from 'zustand';
import type { PricePoint } from '../types/holding';

export interface PriceData {
  currentPriceEUR: number;
  ticker: string | null;   // resolved Yahoo Finance ticker, e.g. "IWDA.AS"
  nativeCurrency: string | null; // original currency from Yahoo, e.g. "USD", "GBP"
  nativePriceRaw: number | null; // price in native currency (GBp normalized to GBP)
  history1Y: PricePoint[];
  history5Day: PricePoint[];
  trend5Day: number; // % change over last 5 days as decimal
  lastFetched: number; // timestamp ms
  loading: boolean;
  error: string | null;
}

interface PriceStoreState {
  prices: Record<string, PriceData>; // keyed by ISIN
  setLoading: (isin: string) => void;
  setPriceData: (isin: string, data: Omit<PriceData, 'loading' | 'error' | 'lastFetched'>) => void;
  // Phase A: quote only. Preserves any existing history so the row paints the
  // price immediately without clobbering a previously-loaded sparkline.
  setQuoteData: (isin: string, data: Pick<PriceData, 'ticker' | 'nativeCurrency' | 'nativePriceRaw' | 'currentPriceEUR'>) => void;
  // Phase B: history/trend only. Never touches price or loading state.
  setHistoryData: (isin: string, data: Pick<PriceData, 'history1Y' | 'history5Day' | 'trend5Day'>) => void;
  setError: (isin: string, error: string) => void;
}

const DEFAULT_PRICE_DATA: PriceData = {
  currentPriceEUR: 0,
  ticker: null,
  nativeCurrency: null,
  nativePriceRaw: null,
  history1Y: [],
  history5Day: [],
  trend5Day: 0,
  lastFetched: 0,
  loading: false,
  error: null,
};

export const usePriceStore = create<PriceStoreState>((set) => ({
  prices: {},

  setLoading: (isin) =>
    set((state) => ({
      prices: {
        ...state.prices,
        [isin]: {
          ...DEFAULT_PRICE_DATA,
          ...state.prices[isin],
          loading: true,
          error: null,
        },
      },
    })),

  setPriceData: (isin, data) =>
    set((state) => ({
      prices: {
        ...state.prices,
        [isin]: {
          ...data,
          lastFetched: Date.now(),
          loading: false,
          error: null,
        },
      },
    })),

  setQuoteData: (isin, data) =>
    set((state) => ({
      prices: {
        ...state.prices,
        [isin]: {
          ...DEFAULT_PRICE_DATA,
          ...state.prices[isin],
          ...data,
          lastFetched: Date.now(),
          loading: false,
          error: null,
        },
      },
    })),

  setHistoryData: (isin, data) =>
    set((state) => ({
      prices: {
        ...state.prices,
        [isin]: {
          ...DEFAULT_PRICE_DATA,
          ...state.prices[isin],
          ...data,
        },
      },
    })),

  setError: (isin, error) =>
    set((state) => ({
      prices: {
        ...state.prices,
        [isin]: {
          ...DEFAULT_PRICE_DATA,
          ...state.prices[isin],
          loading: false,
          error,
        },
      },
    })),
}));
