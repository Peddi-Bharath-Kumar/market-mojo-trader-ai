
// Options Greeks Calculator
interface GreeksInput {
  spotPrice: number;
  strikePrice: number;
  timeToExpiry: number; // in years
  riskFreeRate: number; // as decimal (e.g., 0.05 for 5%)
  volatility: number; // as decimal (e.g., 0.20 for 20%)
  optionType: 'call' | 'put';
}

interface GreeksOutput {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  price: number;
}

class OptionsGreeksCalculator {
  // Standard normal distribution
  private normDist(x: number): number {
    return (1.0 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
  }

  // Cumulative normal distribution
  private normCDF(x: number): number {
    return (1.0 + this.erf(x / Math.sqrt(2))) / 2.0;
  }

  private erf(x: number): number {
    // Approximation of error function
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  calculateGreeks(input: GreeksInput): GreeksOutput {
    const { spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility, optionType } = input;

    // Black-Scholes calculations
    const d1 = (Math.log(spotPrice / strikePrice) + (riskFreeRate + 0.5 * volatility * volatility) * timeToExpiry) /
               (volatility * Math.sqrt(timeToExpiry));
    const d2 = d1 - volatility * Math.sqrt(timeToExpiry);

    const Nd1 = this.normCDF(d1);
    const Nd2 = this.normCDF(d2);
    const nd1 = this.normDist(d1);

    let price: number;
    let delta: number;

    if (optionType === 'call') {
      price = spotPrice * Nd1 - strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * Nd2;
      delta = Nd1;
    } else {
      price = strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * this.normCDF(-d2) - spotPrice * this.normCDF(-d1);
      delta = Nd1 - 1;
    }

    const gamma = nd1 / (spotPrice * volatility * Math.sqrt(timeToExpiry));
    const theta = optionType === 'call' 
      ? (-spotPrice * nd1 * volatility / (2 * Math.sqrt(timeToExpiry)) - 
         riskFreeRate * strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * Nd2) / 365
      : (-spotPrice * nd1 * volatility / (2 * Math.sqrt(timeToExpiry)) + 
         riskFreeRate * strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * this.normCDF(-d2)) / 365;
    
    const vega = (spotPrice * nd1 * Math.sqrt(timeToExpiry)) / 100;
    const rho = optionType === 'call'
      ? (strikePrice * timeToExpiry * Math.exp(-riskFreeRate * timeToExpiry) * Nd2) / 100
      : (-strikePrice * timeToExpiry * Math.exp(-riskFreeRate * timeToExpiry) * this.normCDF(-d2)) / 100;

    return {
      delta: Math.round(delta * 10000) / 10000,
      gamma: Math.round(gamma * 10000) / 10000,
      theta: Math.round(theta * 100) / 100,
      vega: Math.round(vega * 100) / 100,
      rho: Math.round(rho * 100) / 100,
      price: Math.round(price * 100) / 100
    };
  }

  // Portfolio Greeks calculation
  calculatePortfolioGreeks(positions: Array<{
    quantity: number;
    greeks: GreeksOutput;
  }>): GreeksOutput {
    const portfolioGreeks = positions.reduce((acc, position) => {
      const { quantity, greeks } = position;
      return {
        delta: acc.delta + (quantity * greeks.delta),
        gamma: acc.gamma + (quantity * greeks.gamma),
        theta: acc.theta + (quantity * greeks.theta),
        vega: acc.vega + (quantity * greeks.vega),
        rho: acc.rho + (quantity * greeks.rho),
        price: acc.price + (quantity * greeks.price)
      };
    }, { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0, price: 0 });

    return {
      delta: Math.round(portfolioGreeks.delta * 100) / 100,
      gamma: Math.round(portfolioGreeks.gamma * 100) / 100,
      theta: Math.round(portfolioGreeks.theta * 100) / 100,
      vega: Math.round(portfolioGreeks.vega * 100) / 100,
      rho: Math.round(portfolioGreeks.rho * 100) / 100,
      price: Math.round(portfolioGreeks.price * 100) / 100
    };
  }
}

export const optionsCalculator = new OptionsGreeksCalculator();
export type { GreeksInput, GreeksOutput };
