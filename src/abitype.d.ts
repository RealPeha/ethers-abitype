import "abitype";
import { Addressable } from "ethers";

declare module "abitype" {
  export interface Register {
    AddressType: string | Addressable;
    BytesType: {
      inputs: string;
      outputs: string;
    };
    IntType: bigint;
  }
}
