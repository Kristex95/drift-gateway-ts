import { BASE_PRECISION, User } from "@drift-labs/sdk";

export function getAllPositions(user: User){
  const perpPositions = user.getActivePerpPositions();
  const spotPositions = user.getActiveSpotPositions();

  const perpResult = perpPositions.map(element => {
    return {
      amount: (element.baseAssetAmount.toNumber() / BASE_PRECISION.toNumber()).toString(),
      type: "deposit",
      marketIndex: element.marketIndex
    };
  })
  const spotResult = spotPositions.map(element => {
    return {
      amount: (element.cumulativeDeposits.toNumber() / BASE_PRECISION.toNumber()).toString(),
      type: "deposit",
      marketIndex: element.marketIndex
    }
  })
  return {
    spot: spotResult,
    perp: perpResult
  }
}