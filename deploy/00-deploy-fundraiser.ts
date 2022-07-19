import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployFundraiser = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  await deploy("Fundraiser", {
    from: deployer,
    args: [],
    log: true,
  });
  log("-----------------------------------");
};
export default deployFundraiser;

deployFundraiser.tags = ["all"];
