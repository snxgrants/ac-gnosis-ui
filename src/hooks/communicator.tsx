function useCommunicator() {
  const communicator = useAppCommunicator(iframeRef, safeApp);
  useEffect(() => {
    /**
     * @deprecated: getEnvInfo is a legacy method. Should not be used
     */
    communicator?.on(LegacyMethods.getEnvInfo, () => ({
      txServiceUrl: getTxServiceUrl(),
    }));

    communicator?.on(Methods.getTxBySafeTxHash, async (msg) => {
      const { safeTxHash } = msg.data.params as GetTxBySafeTxHashParams;

      const tx = await fetchSafeTransaction(safeTxHash);

      return tx;
    });

    communicator?.on(Methods.getEnvironmentInfo, async () => ({
      origin: document.location.origin,
    }));

    communicator?.on(Methods.getSafeInfo, () => ({
      safeAddress,
      // FIXME `network` is deprecated. we should find how many apps are still using it
      // Apps using this property expect this to be in UPPERCASE
      network: getLegacyChainName(chainName, chainId).toUpperCase(),
      chainId: parseInt(chainId, 10),
      owners,
      threshold,
      isReadOnly: !granted,
    }));

    communicator?.on(Methods.getSafeBalances, async (msg) => {
      const { currency = 'usd' } = msg.data.params as GetBalanceParams;

      const balances = await fetchTokenCurrenciesBalances({
        safeAddress,
        selectedCurrency: currency,
      });

      return balances;
    });

    communicator?.on(Methods.wallet_getPermissions, (msg) => {
      return getPermissions(msg.origin);
    });

    communicator?.on(Methods.wallet_requestPermissions, async (msg) => {
      setPermissionsRequest({
        origin: msg.origin,
        request: msg.data.params as PermissionRequest[],
        requestId: msg.data.id,
      });
    });

    communicator?.on(Methods.requestAddressBook, async (msg) => {
      if (hasPermission(msg.origin, Methods.requestAddressBook)) {
        return addressBook;
      }

      return [];
    });

    communicator?.on(Methods.rpcCall, async (msg) => {
      const params = msg.data.params as RPCPayload;

      try {
        const response = new Promise<MethodToResponse['rpcCall']>(
          (resolve, reject) => {
            safeAppWeb3Provider.send(
              {
                jsonrpc: '2.0',
                method: params.call,
                params: params.params,
                id: '1',
              },
              (err, res) => {
                if (err || res?.error) {
                  reject(err || res?.error);
                }

                resolve(res?.result);
              }
            );
          }
        );

        return response;
      } catch (err) {
        return err;
      }
    });

    communicator?.on(Methods.sendTransactions, (msg) => {
      // @ts-expect-error explore ways to fix this
      const transactions = (msg.data.params.txs as Transaction[]).map(
        ({ to, ...rest }) => ({
          to: checksumAddress(to),
          ...rest,
        })
      );
      // @ts-expect-error explore ways to fix this
      openConfirmationModal(transactions, msg.data.params.params, msg.data.id);
    });

    communicator?.on(Methods.signMessage, async (msg) => {
      const { message } = msg.data.params as SignMessageParams;

      openSignMessageModal(message, msg.data.id, Methods.signMessage);
    });

    communicator?.on(Methods.signTypedMessage, async (msg) => {
      const { typedData } = msg.data.params as SignTypedMessageParams;

      openSignMessageModal(typedData, msg.data.id, Methods.signTypedMessage);
    });

    communicator?.on(Methods.getChainInfo, async () => {
      return {
        chainName,
        chainId,
        shortName,
        nativeCurrency,
        blockExplorerUriTemplate,
      };
    });
  }, [
    communicator,
    openConfirmationModal,
    safeAddress,
    owners,
    threshold,
    openSignMessageModal,
    nativeCurrency,
    chainId,
    chainName,
    shortName,
    safeAppWeb3Provider,
    granted,
    blockExplorerUriTemplate,
    addressBook,
    getPermissions,
    setPermissionsRequest,
    hasPermission,
  ]);
}
