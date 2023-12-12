import {
  BaseContract,
  ContractRunner,
  ContractTransaction,
  ContractTransactionResponse,
  DeferredTopicFilter,
  EventFragment,
  FunctionFragment,
  Result,
  TransactionResponse,
} from "ethers";
import {
  Abi,
  AbiParametersToPrimitiveTypes,
  ExtractAbiEvent,
  ExtractAbiEventNames,
  ExtractAbiEvents,
  ExtractAbiFunction,
  ExtractAbiFunctionNames,
  ExtractAbiFunctions,
} from "abitype";

export type * from "./abitype.js";

export type TypedContractFunctionResult<
  TAbi extends Abi,
  TFunctionName extends string,
  // variables
  TOutputArgs = AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<TAbi, TFunctionName>["outputs"]
  >
> = TOutputArgs extends readonly []
  ? void
  : TOutputArgs extends readonly [infer Arg]
  ? Arg
  : TOutputArgs;

export type TypedFragment<
  TAbi extends Abi,
  TFunctionName extends string,
  // variables
  TFunction extends ExtractAbiFunctions<TAbi> = ExtractAbiFunction<
    TAbi,
    TFunctionName
  >
> = Omit<
  FunctionFragment,
  "inputs" | "outputs" | "stateMutability" | "name" | "type"
> & {
  name: TFunction["name"];
  type: TFunction["type"];
  inputs: TFunction["inputs"];
  outputs: TFunction["outputs"];
  stateMutability: TFunction["stateMutability"];
};

export interface TypedContractFunction<
  TAbi extends Abi,
  TFunctionName extends string,
  // variables
  TFunction extends ExtractAbiFunctions<TAbi> = ExtractAbiFunction<
    TAbi,
    TFunctionName
  >,
  TInputArgs = AbiParametersToPrimitiveTypes<TFunction["inputs"]>,
  TResult = TypedContractFunctionResult<TAbi, TFunctionName>,
  TFragment = TypedFragment<TAbi, TFunctionName>
> {
  // @ts-ignore
  (...args: TInputArgs): Promise<
    TFunction["stateMutability"] extends "view" | "pure"
      ? TResult
      : ContractTransactionResponse
  >;

  /**
   *  The name of the Contract method.
   */
  name: TFunctionName;

  /**
   *  The fragment of the Contract method. This will throw on ambiguous
   *  method names.
   */
  fragment: TFragment;

  /**
   *  Returns the fragment constrained by %%args%%. This can be used to
   *  resolve ambiguous method names.
   */
  // @ts-ignore
  getFragment(...args: TInputArgs): TFragment;

  /**
   *  Returns a populated transaction that can be used to perform the
   *  contract method with %%args%%.
   */
  // @ts-ignore
  populateTransaction(...args: TInputArgs): Promise<ContractTransaction>;

  /**
   *  Call the contract method with %%args%% and return the value.
   *
   *  If the return value is a single type, it will be dereferenced and
   *  returned directly, otherwise the full Result will be returned.
   */
  staticCall(
    // @ts-ignore
    ...args: TInputArgs
  ): Promise<TResult>;

  /**
   *  Send a transaction for the contract method with %%args%%.
   */
  // @ts-ignore
  send(...args: TInputArgs): Promise<ContractTransactionResponse>;

  /**
   *  Estimate the gas to send the contract method with %%args%%.
   */
  // @ts-ignore
  estimateGas(...args: TInputArgs): Promise<bigint>;

  /**
   *  Call the contract method with %%args%% and return the Result
   *  without any dereferencing.
   */
  // @ts-ignore
  staticCallResult(...args: TInputArgs): Promise<Result>;
}

export interface TypedContractEvent<
  TAbi extends Abi,
  TEventName extends string,
  // variables
  TEvent extends ExtractAbiEvents<TAbi> = ExtractAbiEvent<TAbi, TEventName>,
  TEventArgs = Partial<
    AbiParametersToPrimitiveTypes<
      TEvent["inputs"]
      // TODO: filter only indexed: true
      // Extract<TEvent["inputs"][number], { indexed: true }>[]
    >
  >
> {
  // @ts-ignore
  (...args: TEventArgs): DeferredTopicFilter;

  /**
   *  The name of the Contract event.
   */
  name: TEventName;

  /**
   *  The fragment of the Contract event. This will throw on ambiguous
   *  method names.
   */
  fragment: EventFragment;

  /**
   *  Returns the fragment constrained by %%args%%. This can be used to
   *  resolve ambiguous event names.
   */
  getFragment(
    // @ts-ignore
    ...args: TEventArgs
  ): EventFragment;
}

// TODO: on, off, once, queryFilter, interface
export type TypedContract<TAbi extends Abi> = Omit<
  BaseContract,
  "getFunction" | "getEvent"
> & {
  [Method in ExtractAbiFunctionNames<TAbi>]: TypedContractFunction<
    TAbi,
    Method
  >;
} & {
  /**
   *  Return the function for a given name. This is useful when a contract
   *  method name conflicts with a JavaScript name such as ``prototype`` or
   *  when using a Contract programatically.
   */
  getFunction<T extends ExtractAbiFunctionNames<TAbi>>(
    key: T | TypedFragment<TAbi, T>
  ): TypedContractFunction<TAbi, T>;

  /**
   *  Return the event for a given name. This is useful when a contract
   *  event name conflicts with a JavaScript name such as ``prototype`` or
   *  when using a Contract programatically.
   */
  getEvent<T extends ExtractAbiEventNames<TAbi>>(
    key: T | EventFragment
  ): TypedContractEvent<TAbi, T>;

  /**
   *  All the Events available on this contract.
   */
  filters: {
    [EventName in ExtractAbiEventNames<TAbi>]: TypedContractEvent<
      TAbi,
      EventName
    >;
  };
};

export const typedContract = <TAbi extends Abi>(
  target: string,
  abi: TAbi,
  runner?: ContractRunner | null,
  _deployTx?: TransactionResponse | null
): TypedContract<TAbi> => {
  return new BaseContract(
    target,
    abi as any,
    runner,
    _deployTx
  ) as TypedContract<TAbi>;
};
