import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedRockPaperScissors = await deploy("RockPaperScissors", {
    from: deployer,
    log: true,
  });

  console.log(`RockPaperScissors contract deployed at: ${deployedRockPaperScissors.address}`);
  console.log(`Transaction hash: ${deployedRockPaperScissors.transactionHash || "N/A"}`);
};
export default func;
func.id = "deploy_rockPaperScissors"; // id required to prevent reexecution
func.tags = ["RockPaperScissors"];
