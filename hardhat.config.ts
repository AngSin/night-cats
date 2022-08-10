import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-chai-matchers";

const key = process.env.key || "=====invalid key=====";

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  networks: {
    hardhat: {
      accounts: {
        count: 3,
      }
    },
    // rinkeby: {
    //   url: 'https://eth-rinkeby.alchemyapi.io/v2/8HVZPCFqCAHtpIVegx7W5Wsx_Sxg0x1W',
    //   accounts: [key]
    // },
  },
  etherscan: {
    apiKey: 'K2UD7HS82VSM7UW83X4NA4AUGEC63GD83F',
  }
};

export default config;
