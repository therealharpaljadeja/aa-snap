import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { heading, panel, text } from '@metamask/snaps-ui';
import { InternalMethod } from './permissions';
// import { logRequest } from './utils';
import {
  KeyringSnapRpcClient,
  MethodNotSupportedError,
  buildHandlersChain,
  handleKeyringRequest,
} from '@metamask/keyring-api';
import { ERC4337Keyring } from './keyring';
import { getState } from './stateManagement';

let keyring: ERC4337Keyring;

// Logs and pass the control to next handler
const loggerHandler: OnRpcRequestHandler = async ({ origin, request }) => {
  // await snap.request({
  //   method: 'snap_manageState',
  //   params: { operation: 'clear' },
  // });
  // console.log(
  //   await snap.request({
  //     method: 'snap_manageState',
  //     params: { operation: 'get' },
  //   }),
  // );
  console.log(
    `[Snap] request (id=${request.id ?? 'null'}, origin=${origin}):`,
    request,
  );
  throw new MethodNotSupportedError(request.method);
};

// const customHandler: OnRpcRequestHandler = async ({
//   request,
// }): Promise<any> => {
//   switch (request.method) {
//     // internal methods
//     case InternalMethod.Hello: {
//       return snap.request({
//         method: 'snap_dialog',
//         params: {
//           type: 'alert',
//           content: panel([
//             heading('Something happened in the system'),
//             text('The thing that happened is...'),
//           ]),
//         },
//       });
//     }

//     default: {
//       throw new MethodNotSupportedError(request.method);
//     }
//   }
// };

const keyringHandler: OnRpcRequestHandler = async ({ origin, request }) => {
  if (!keyring) {
    const keyringState = await getState();
    keyring = new ERC4337Keyring(keyringState);
  }
  return await handleKeyringRequest(keyring, request);
};

export const onRpcRequest: OnRpcRequestHandler = buildHandlersChain(
  loggerHandler,
  keyringHandler,
);
