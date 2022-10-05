import polyfill from "./polyfill";
import { flipIt, getFlipperValue } from "./flipperContract";
import { subscribeToBalance, toREEFBalanceNormal } from "./signerUtil";
import { getReefExtension } from "./extensionUtil";
import { Signer } from "@reef-defi/evm-provider";

polyfill;

let selectedSigner: Signer;
let selSignerConnectedEVM: boolean;
let unsubBalance = () => {};

// Listen to bind-evm-address event

document.addEventListener("bind-evm-address", async (evt: any) => {
  if (
    await isSelectedAddress(
      evt.detail as string,
      selectedSigner,
      "Error connecting EVM. Selected signer is not the same."
    )
  ) {
    bindEvm(selectedSigner);
  }
});

// Do stuff when the window loads

window.addEventListener("load", async () => {
  try {
    const extension = await getReefExtension("Minimal DApp Example");

    // reefSigner.subscribeSelectedAccountSigner is Reef extension custom feature otherwise we can use accounts
    extension.reefSigner.subscribeSelectedAccountSigner(async (sig) => {
      try {
        if (!sig) {
          throw new Error(
            "Create account in Reef extension or make selected account visible."
          );
        }
        setSelectedSigner(sig);
      } catch (err) {
        displayError(err);
      }
    });
  } catch (e) {
    displayError(e);
  }
});

/* Functions to interact with the page and extension */

// isSelectedAddress

async function isSelectedAddress(
  addr: string,
  selectedSigner: Signer,
  message: string
) {
  const selAddr = await selectedSigner.getSubstrateAddress();
  if (addr !== selAddr) {
    displayError({ message });
    return false;
  }
  return true;
}

// displayError

function displayError(err) {
  document.dispatchEvent(
    new CustomEvent("display-error", {
      detail: err,
    })
  );
}

// clearError

function clearError() {
  document.dispatchEvent(new Event("clear-error"));
}

// setSelectedSigner

async function setSelectedSigner(sig) {
  selectedSigner = sig;
  unsubBalance();
  unsubBalance = await subscribeToBalance(
    sig,
    async (balFree) => await updateBalance(selectedSigner, balFree)
  );
  let substrateAddress = await sig?.getSubstrateAddress();
  console.log("new signer=", substrateAddress);
  document.dispatchEvent(
    new CustomEvent("signer-change", { detail: substrateAddress })
  );
}

// isEVMConnected

async function isEvmConnected(sig) {
  if (selSignerConnectedEVM) {
    return selSignerConnectedEVM;
  }
  selSignerConnectedEVM = await sig.isClaimed();
  return selSignerConnectedEVM;
}

// updateBalance

async function updateBalance(sig, balFree) {
  let balanceNormal = toREEFBalanceNormal(balFree.toString());
  document.dispatchEvent(
    new CustomEvent("balance-value", { detail: balanceNormal })
  );

  var evmConnected = await isEvmConnected(sig);
  console.log(
    "New SIGNER balance=",
    balanceNormal.toString(),
    " EVM connected=",
    evmConnected
  );

  if (!evmConnected) {
    if (balanceNormal.lt("3")) {
      displayError(
        "<p>To enable contract interaction you need to sign transaction with ~3REEF fee.<br/>To get 1000 testnet REEF simply type:<br/> <code>!drip " +
          (await sig.getSubstrateAddress()) +
          '</code> <br/>in <a href="https://app.element.io/#/room/#reef:matrix.org" target="_blank">Reef matrix chat</a>. <br/>Listening on chain for balance update.</p>'
      );
      return;
    }
  } else {
    document.dispatchEvent(new Event("evm-connected"));
  }
  clearError();
  document.dispatchEvent(new Event("dapp-connected"));
}

// bindEVM

async function bindEvm(sig) {
  try {
    document.dispatchEvent(new Event("tx-progress"));
    await sig.claimDefaultAccount();
    document.dispatchEvent(new Event("tx-complete"));
    document.dispatchEvent(new Event("evm-connected"));
  } catch (e) {
    displayError(e);
  }
}

/*
	Code to interact with the contract goes here!

	Functions and Listeners to interact with the Contract
*/

// getContractValue

async function getContractValue(sig) {}

// toggleContractValue

async function toggleContractValue(sig) {}

// Listen to get-contract-value event

document.addEventListener("get-contract-value", async (evt: any) => {});

// Listen to toggle-contract-value event

document.addEventListener("toggle-contract-value", async (evt: any) => {});
