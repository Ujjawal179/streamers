// youtubeAdCostCalculator.ts
export class YoutubeAdCostCalculator {
    /**
     * Calculates the YouTube ad cost based on total viewers, referencing the pricing structure
     * from the provided Excel data. The cost is calculated as CPM (Cost Per Mille) * (totalViews / 1000).
     * 
     * @param totalViews The total number of viewers for the campaign/stream
     * @param minAdBuy The minimum ad buy amount (optional, defaults to 1000 from the Excel)
     * @param numberOfAdDisplays The number of ad displays (optional, defaults to 3 from the Excel)
     * @returns The calculated ad cost in dollars
     */
    static calculateYouTubeAdCost(totalViews: number, minAdBuy: number = 10, numberOfAdDisplays: number = 1): number {
      let cpm: number;
  
      // Determine CPM based on total viewers, following the patterns in the Excel
      if (totalViews < 10000) {
        cpm = 425; // Base CPM for lower viewer counts (e.g., Demo 1-4 in Excel)
      } else if (totalViews < 50000) {
        cpm = 400; // Medium viewer count CPM (e.g., Demo 5-8)
      } else if (totalViews < 100000) {
        cpm = 375; // Higher viewer count CPM (e.g., Demo 9-12)
      } else {
        cpm = 350; // Very high viewer count CPM (e.g., Demo 13-15)
      }
  
      // Calculate base cost: CPM * (totalViews / 1000)
      let baseCost = cpm * (totalViews / 1000);
  
      // Apply minimum ad buy if base cost is less than minAdBuy
      if (baseCost < minAdBuy) {
        baseCost = minAdBuy;
      }
  
      // Factor in the number of ad displays (multiply by number of displays)
      const finalCost = baseCost * numberOfAdDisplays;
  
      // Ensure the cost is rounded to 2 decimal places
      return Number(finalCost.toFixed(2));
    }
  
    /**
     * Calculates the cost per view based on total viewers and the calculated ad cost
     * 
     * @param totalViews The total number of viewers
     * @param minAdBuy The minimum ad buy amount (optional, defaults to 1000)
     * @param numberOfAdDisplays The number of ad displays (optional, defaults to 3)
     * @returns The cost per view in dollars
     */
    static calculateCostPerView(totalViews: number, minAdBuy: number = 1000, numberOfAdDisplays: number = 3): number {
      const totalCost = this.calculateYouTubeAdCost(totalViews, minAdBuy, numberOfAdDisplays);
      return Number((totalCost / totalViews).toFixed(6)); // Cost per view, rounded to 6 decimals
    }
  }
  
  // Example usage (uncomment to test):
  /*
  console.log(YoutubeAdCostCalculator.calculateYouTubeAdCost(5000)); // Low viewers
  console.log(YoutubeAdCostCalculator.calculateYouTubeAdCost(75000)); // Medium viewers
  console.log(YoutubeAdCostCalculator.calculateYouTubeAdCost(150000)); // High viewers
  console.log(YoutubeAdCostCalculator.calculateCostPerView(5000));
  console.log(YoutubeAdCostCalculator.calculateCostPerView(75000));
  console.log(YoutubeAdCostCalculator.calculateCostPerView(150000));
  */